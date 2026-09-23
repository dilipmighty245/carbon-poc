package engine

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"sort"
	"time"

	"cel.dev/cel-go/cel"
)

type CELEngine struct{}

func NewCELEngine() *CELEngine {
	return &CELEngine{}
}

// Evaluate compiles and executes the CEL rulebook formulas against activity data.
func (e *CELEngine) Evaluate(ctx context.Context, rulebook CalculationRulebook, activityData map[string]interface{}) (*CalculationResult, error) {
	// Recursively flatten nested activity data maps so leaf variables are accessible at top-level
	flatVars := make(map[string]interface{})
	flattenActivityData(activityData, flatVars)

	// Normalize activity data numbers to float64 for consistent CEL evaluation
	normalizedVars := make(map[string]interface{})
	var envOpts []cel.EnvOption

	for k, v := range flatVars {
		switch num := v.(type) {
		case int:
			val := float64(num)
			normalizedVars[k] = val
			envOpts = append(envOpts, cel.Variable(k, cel.DoubleType))
		case int64:
			val := float64(num)
			normalizedVars[k] = val
			envOpts = append(envOpts, cel.Variable(k, cel.DoubleType))
		case float64:
			normalizedVars[k] = num
			envOpts = append(envOpts, cel.Variable(k, cel.DoubleType))
		case float32:
			val := float64(num)
			normalizedVars[k] = val
			envOpts = append(envOpts, cel.Variable(k, cel.DoubleType))
		case string:
			normalizedVars[k] = num
			envOpts = append(envOpts, cel.Variable(k, cel.StringType))
		case bool:
			normalizedVars[k] = num
			envOpts = append(envOpts, cel.Variable(k, cel.BoolType))
		default:
			normalizedVars[k] = v
			envOpts = append(envOpts, cel.Variable(k, cel.AnyType))
		}
	}

	env, err := cel.NewEnv(envOpts...)
	if err != nil {
		return nil, fmt.Errorf("failed to create CEL environment: %w", err)
	}

	s1, err := e.evalFormula(env, rulebook.Scope1Formula, normalizedVars)
	if err != nil {
		return nil, fmt.Errorf("error evaluating Scope 1 formula: %w", err)
	}

	s2, err := e.evalFormula(env, rulebook.Scope2Formula, normalizedVars)
	if err != nil {
		return nil, fmt.Errorf("error evaluating Scope 2 formula: %w", err)
	}

	s3, err := e.evalFormula(env, rulebook.Scope3Formula, normalizedVars)
	if err != nil {
		return nil, fmt.Errorf("error evaluating Scope 3 formula: %w", err)
	}

	total := s1 + s2 + s3
	batchQty := rulebook.BatchQuantity
	if batchQty <= 0 {
		batchQty = 1.0 // Prevent division by zero
	}
	intensity := total / batchQty

	now := time.Now().UTC()

	// Compute CBAM cryptographic SHA-256 hash digest
	dataHash, err := e.computeCBAMHash(rulebook.Version, normalizedVars, s1, s2, s3, total, intensity)
	if err != nil {
		return nil, fmt.Errorf("failed to compute CBAM cryptographic proof hash: %w", err)
	}

	return &CalculationResult{
		Scope1Kg:         s1,
		Scope2Kg:         s2,
		Scope3Kg:         s3,
		TotalFootprintKg: total,
		IntensityPerUnit: intensity,
		FunctionalUnit:   rulebook.FunctionalUnit,
		DataHash:         dataHash,
		RulebookVersion:  rulebook.Version,
		ExecutionTime:    now,
		VariableSnapshot: normalizedVars,
	}, nil
}

func (e *CELEngine) evalFormula(env *cel.Env, formula string, vars map[string]interface{}) (float64, error) {
	if formula == "" {
		return 0.0, nil
	}

	ast, issues := env.Compile(formula)
	if issues != nil && issues.Err() != nil {
		return 0.0, fmt.Errorf("compile error in formula '%s': %w", formula, issues.Err())
	}

	prg, err := env.Program(ast)
	if err != nil {
		return 0.0, fmt.Errorf("program construction error for formula '%s': %w", formula, err)
	}

	out, _, err := prg.Eval(vars)
	if err != nil {
		return 0.0, fmt.Errorf("evaluation error for formula '%s': %w", formula, err)
	}

	rawVal := out.Value()
	switch val := rawVal.(type) {
	case float64:
		return val, nil
	case int64:
		return float64(val), nil
	default:
		return 0.0, fmt.Errorf("formula '%s' output is not numeric: %v", formula, out)
	}
}

func (e *CELEngine) computeCBAMHash(version string, vars map[string]interface{}, s1, s2, s3, total, intensity float64) (string, error) {
	// Deterministically sort variable keys
	keys := make([]string, 0, len(vars))
	for k := range vars {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	sortedVars := make(map[string]interface{})
	for _, k := range keys {
		sortedVars[k] = vars[k]
	}

	payload := map[string]interface{}{
		"rulebook_version": version,
		"variables":        sortedVars,
		"scope_1_kg":       s1,
		"scope_2_kg":       s2,
		"scope_3_kg":       s3,
		"total_footprint":  total,
		"intensity":        intensity,
	}

	jsonBytes, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}

	hash := sha256.Sum256(jsonBytes)
	return hex.EncodeToString(hash[:]), nil
}

func flattenActivityData(input map[string]interface{}, flat map[string]interface{}) {
	for k, v := range input {
		flat[k] = v
		switch val := v.(type) {
		case map[string]interface{}:
			flattenActivityData(val, flat)
		case []interface{}:
			for _, item := range val {
				if itemMap, ok := item.(map[string]interface{}); ok {
					flattenActivityData(itemMap, flat)
				}
			}
		}
	}
}
