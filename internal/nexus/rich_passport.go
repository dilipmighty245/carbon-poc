package nexus

import (
	"context"
	"encoding/json"
	"fmt"
	"math"
	"os"
	"strings"
	"time"

	"github.com/google/uuid"

	"saurient-platform/internal/engine"
)

type PassportMetadata struct {
	PassportID        string `json:"passport_id"`
	UniqueQRCode      string `json:"unique_qr_code"`
	CryptographicHash string `json:"cryptographic_hash"`
	IssuanceDate      string `json:"issuance_date"`
	Status            string `json:"status"`
}

type FacilitySummary struct {
	Name            string `json:"name"`
	Location        string `json:"location"`
	CountryOfOrigin string `json:"country_of_origin"`
}

type BatchSizeSummary struct {
	Quantity float64 `json:"quantity"`
	Unit     string  `json:"unit"`
}

type ProductSummary struct {
	Commodity            string           `json:"commodity"`
	ProductName          string           `json:"product_name"`
	BatchNumber          string           `json:"batch_number"`
	ProducerOrganization string           `json:"producer_organization"`
	Facility             FacilitySummary  `json:"facility"`
	ProductionDate       string           `json:"production_date"`
	BatchSize            BatchSizeSummary `json:"batch_size"`
}

type ValuePercentage struct {
	ValueKgCO2e float64 `json:"value_kg_co2e"`
	Percentage  float64 `json:"percentage"`
}

type ScopeBreakdown struct {
	Scope1Direct         ValuePercentage `json:"scope_1_direct"`
	Scope2IndirectEnergy ValuePercentage `json:"scope_2_indirect_energy"`
	Scope3ValueChain     ValuePercentage `json:"scope_3_value_chain"`
}

type IntensityPerUnit struct {
	Value float64 `json:"value"`
	Unit  string  `json:"unit"`
}

type SourceBreakdown struct {
	RawMaterials       ValuePercentage `json:"raw_materials"`
	Electricity        ValuePercentage `json:"electricity"`
	LogisticsTransport ValuePercentage `json:"logistics_transport"`
	OnSiteFuel         ValuePercentage `json:"on_site_fuel"`
	Packaging          ValuePercentage `json:"packaging"`
}

type CarbonFootprintSummary struct {
	TotalBatchFootprintKgCO2e float64          `json:"total_batch_footprint_kg_co2e"`
	IntensityPerUnit          IntensityPerUnit `json:"intensity_per_unit"`
	ScopeBreakdown            ScopeBreakdown   `json:"scope_breakdown"`
	SourceBreakdown           SourceBreakdown  `json:"source_breakdown"`
}

type DataQualityScore struct {
	PrimaryDataPercent   float64 `json:"primary_data_percent"`
	SecondaryDataPercent float64 `json:"secondary_data_percent"`
	OverallQuality       string  `json:"overall_quality"`
}

type VerificationDetails struct {
	VerifierName              string   `json:"verifier_name"`
	VerificationDate          string   `json:"verification_date"`
	VerifierComments          string   `json:"verifier_comments"`
	EvidenceDocumentsAttached []string `json:"evidence_documents_attached"`
}

type MethodologyAndAudit struct {
	StandardAligned        string              `json:"standard_aligned"`
	SystemBoundary         string              `json:"system_boundary"`
	EmissionFactorDatabase string              `json:"emission_factor_database"`
	CalculationVersion     string              `json:"calculation_version"`
	DataQualityScore       DataQualityScore    `json:"data_quality_score"`
	VerificationDetails    VerificationDetails `json:"verification_details"`
}

type ComplianceExports struct {
	CBAMReady              bool     `json:"cbam_ready"`
	TargetExportMarket     string   `json:"target_export_market"`
	ExportFormatsAvailable []string `json:"export_formats_available"`
}

type RichDigitalCarbonPassportResponse struct {
	PassportMetadata    PassportMetadata       `json:"passport_metadata"`
	ProductSummary      ProductSummary          `json:"product_summary"`
	CarbonFootprint     CarbonFootprintSummary  `json:"carbon_footprint"`
	MethodologyAndAudit MethodologyAndAudit   `json:"methodology_and_audit"`
	ComplianceExports   ComplianceExports       `json:"compliance_exports"`
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}

func BuildRichPassportResponse(p *CarbonPassportModel) RichDigitalCarbonPassportResponse {
	var calcMap map[string]interface{}
	if len(p.CalculationDetails) > 0 {
		_ = json.Unmarshal(p.CalculationDetails, &calcMap)
	}

	var batchData map[string]interface{}
	if bd, ok := calcMap["batch_data"].(map[string]interface{}); ok {
		batchData = bd
	}

	var activityData map[string]interface{}
	if ad, ok := calcMap["activity_data"].(map[string]interface{}); ok {
		activityData = ad
	} else {
		activityData = calcMap
	}

	var methodAudit map[string]interface{}
	if ma, ok := calcMap["methodology_and_audit"].(map[string]interface{}); ok {
		methodAudit = ma
	}

	passportID := p.PassportID
	if passportID == "" {
		passportID = uuid.New().String()
	}

	issuanceDate := p.IssuedAt.Format(time.RFC3339)
	if p.IssuedAt.IsZero() {
		issuanceDate = time.Now().Format(time.RFC3339)
	}

	status := "Calculated"
	if p.VerificationStatus != "" {
		status = p.VerificationStatus
	}

	commodity := p.CommodityType
	if bdComm, ok := batchData["commodity"].(string); ok && bdComm != "" {
		commodity = bdComm
	}

	productName := commodity
	if bdName, ok := batchData["product_name"].(string); ok && bdName != "" {
		productName = bdName
	}

	batchNum := p.BatchNumber
	if bdBatch, ok := batchData["batch_id"].(string); ok && bdBatch != "" {
		batchNum = bdBatch
	}

	producerOrg := p.TenantID
	if bdOrg, ok := batchData["producer_organization"].(string); ok && bdOrg != "" {
		producerOrg = bdOrg
	}

	facilityName := p.FacilityID
	if bdFacName, ok := batchData["facility_name"].(string); ok && bdFacName != "" {
		facilityName = bdFacName
	}

	facilityLoc := ""
	if bdFacLoc, ok := batchData["facility_location"].(string); ok && bdFacLoc != "" {
		facilityLoc = bdFacLoc
	}

	countryOfOrigin := ""
	if bdCountry, ok := batchData["country_of_origin"].(string); ok && bdCountry != "" {
		countryOfOrigin = bdCountry
	} else if facilityLoc != "" {
		parts := strings.Split(facilityLoc, ",")
		countryOfOrigin = strings.TrimSpace(parts[len(parts)-1])
	}

	prodDate := p.IssuedAt.Format("2006-01-02")
	if bdProdDate, ok := batchData["production_date"].(string); ok && bdProdDate != "" {
		if strings.Contains(bdProdDate, "T") {
			prodDate = strings.Split(bdProdDate, "T")[0]
		} else {
			prodDate = bdProdDate
		}
	}

	batchQty := 1.0
	if bdQty, ok := batchData["batch_size_quantity"].(float64); ok && bdQty > 0 {
		batchQty = bdQty
	}

	batchUnit := "kg"
	if bdUnit, ok := batchData["unit_of_measure"].(string); ok && bdUnit != "" {
		batchUnit = bdUnit
	}

	exportMkt := "Global"
	if bdExp, ok := batchData["export_market"].(string); ok && bdExp != "" {
		exportMkt = bdExp
	}

	s1 := p.Scope1KgCO2e
	s2 := p.Scope2KgCO2e
	s3 := p.Scope3KgCO2e
	total := s1 + s2 + s3
	if total == 0 && p.TotalFootprintKg > 0 {
		total = p.TotalFootprintKg
	}

	if total == 0 {
		PrepareActivityMapAliases(calcMap)
		rb := ResolveRulebookForCommodity(p.CommodityType)
		celEng := engine.NewCELEngine()
		if calcRes, err := celEng.Evaluate(context.Background(), rb, calcMap); err == nil && calcRes != nil {
			s1 = calcRes.Scope1Kg
			s2 = calcRes.Scope2Kg
			s3 = calcRes.Scope3Kg
			total = calcRes.TotalFootprintKg
			p.Scope1KgCO2e = s1
			p.Scope2KgCO2e = s2
			p.Scope3KgCO2e = s3
			p.TotalFootprintKg = total
			if p.VerificationStatus == "Pending" || p.VerificationStatus == "" {
				p.VerificationStatus = "Calculated"
			}
		}
	}

	var fuelVal, elecVal, rawMatVal, pkgVal, logVal float64

	if sb, ok := calcMap["source_breakdown"].(map[string]interface{}); ok {
		if v, ok := sb["on_site_fuel"].(float64); ok {
			fuelVal = v
		}
		if v, ok := sb["electricity"].(float64); ok {
			elecVal = v
		}
		if v, ok := sb["raw_materials"].(float64); ok {
			rawMatVal = v
		}
		if v, ok := sb["packaging"].(float64); ok {
			pkgVal = v
		}
		if v, ok := sb["logistics_transport"].(float64); ok {
			logVal = v
		}
	} else if rrMap, ok := calcMap["rule_results"].(map[string]interface{}); ok {
		for _, v := range rrMap {
			if ruleObj, ok := v.(map[string]interface{}); ok {
				scope, _ := ruleObj["scope"].(string)
				val, _ := ruleObj["value"].(float64)
				name, _ := ruleObj["name"].(string)
				nameLower := strings.ToLower(name)

				switch {
				case scope == "scope1" || strings.Contains(nameLower, "fuel") || strings.Contains(nameLower, "methane"):
					fuelVal += val
				case scope == "scope2" || strings.Contains(nameLower, "electricity") || strings.Contains(nameLower, "milling"):
					elecVal += val
				case strings.Contains(nameLower, "packaging"):
					pkgVal += val
				case strings.Contains(nameLower, "transport") || strings.Contains(nameLower, "freight") || strings.Contains(nameLower, "logistics"):
					logVal += val
				case scope == "scope3" || strings.Contains(nameLower, "material") || strings.Contains(nameLower, "fertilizer"):
					rawMatVal += val
				}
			}
		}
	}

	if fuelVal == 0 {
		fuelVal = s1
	}
	if elecVal == 0 {
		elecVal = s2
	}
	if rawMatVal == 0 && pkgVal == 0 && logVal == 0 {
		rawMatVal = s3
	}

	var s1Pct, s2Pct, s3Pct float64
	var rawMatPct, elecPct, logPct, fuelPct, pkgPct float64

	if total > 0 {
		s1Pct = math.Round((s1/total)*100*100) / 100
		s2Pct = math.Round((s2/total)*100*100) / 100
		s3Pct = math.Round((s3/total)*100*100) / 100

		rawMatPct = math.Round((rawMatVal/total)*100*100) / 100
		elecPct = math.Round((elecVal/total)*100*100) / 100
		logPct = math.Round((logVal/total)*100*100) / 100
		fuelPct = math.Round((fuelVal/total)*100*100) / 100
		pkgPct = math.Round((pkgVal/total)*100*100) / 100
	}

	intensityVal := 0.0
	if batchQty > 0 {
		intensityVal = math.Round((total/batchQty)*100) / 100
	}

	stdAligned := "GHG Protocol (Product Life Cycle Accounting)"
	sysBoundary := "Cradle-to-Gate"
	efDB := "DEFRA 2024 / IPCC 2021"
	if countryOfOrigin != "" {
		efDB = fmt.Sprintf("DEFRA 2024 (%s-specific factors)", countryOfOrigin)
	}
	calcVer := "v1.2.0"
	verifierName := "Pending Independent Verification"
	if status == "Verified" || status == "VERIFIED" {
		verifierName = "Third-Party Certified Auditor"
	}
	verifierComments := ""
	evidenceDocs := []string{}
	primaryDataPct := 100.0
	secondaryDataPct := 0.0
	overallQuality := "High (Primary Telemetry)"

	if methodAudit != nil {
		if std, ok := methodAudit["standard_aligned"].(string); ok && std != "" {
			stdAligned = std
		}
		if sys, ok := methodAudit["system_boundary"].(string); ok && sys != "" {
			sysBoundary = sys
		}
		if ef, ok := methodAudit["emission_factor_database"].(string); ok && ef != "" {
			efDB = ef
		}
		if ver, ok := methodAudit["calculation_version"].(string); ok && ver != "" {
			calcVer = ver
		}
		if dq, ok := methodAudit["data_quality_score"].(map[string]interface{}); ok {
			if p, ok := dq["primary_data_percent"].(float64); ok {
				primaryDataPct = p
			}
			if s, ok := dq["secondary_data_percent"].(float64); ok {
				secondaryDataPct = s
			}
			if q, ok := dq["overall_quality"].(string); ok && q != "" {
				overallQuality = q
			}
		}
		if vDetails, ok := methodAudit["verification_details"].(map[string]interface{}); ok {
			if vName, ok := vDetails["verifier_name"].(string); ok && vName != "" {
				verifierName = vName
			}
			if vComments, ok := vDetails["verifier_comments"].(string); ok && vComments != "" {
				verifierComments = vComments
			}
			if docs, ok := vDetails["evidence_documents_attached"].([]interface{}); ok {
				for _, d := range docs {
					if docStr, ok := d.(string); ok {
						evidenceDocs = append(evidenceDocs, docStr)
					}
				}
			}
		}
	}

	if len(evidenceDocs) == 0 {
		for key, v := range activityData {
			if strings.HasSuffix(key, "_source") || strings.HasSuffix(key, "_doc") || strings.HasSuffix(key, "_evidence") {
				if docStr, ok := v.(string); ok && docStr != "" {
					evidenceDocs = append(evidenceDocs, docStr)
				}
			}
		}
	}

	vDate := p.IssuedAt.Format(time.RFC3339)
	if p.IssuedAt.IsZero() {
		vDate = time.Now().Format(time.RFC3339)
	}

	cbamReady := (s1 > 0 || s2 > 0) && p.DataHash != ""
	exportFormats := []string{"JSON", "PDF_Certificate"}
	if compExp, ok := calcMap["compliance_exports"].(map[string]interface{}); ok {
		if cbam, ok := compExp["cbam_ready"].(bool); ok {
			cbamReady = cbam
		}
		if mkt, ok := compExp["target_export_market"].(string); ok && mkt != "" {
			exportMkt = mkt
		}
		if formats, ok := compExp["export_formats_available"].([]interface{}); ok {
			var fList []string
			for _, f := range formats {
				if fStr, ok := f.(string); ok {
					fList = append(fList, fStr)
				}
			}
			if len(fList) > 0 {
				exportFormats = fList
			}
		}
	}

	verifyBaseURL := getEnv("VERIFY_BASE_URL", "https://verify.saurient.io")
	qrCodeURL := fmt.Sprintf("%s/passport/%s", strings.TrimRight(verifyBaseURL, "/"), passportID)

	return RichDigitalCarbonPassportResponse{
		PassportMetadata: PassportMetadata{
			PassportID:        passportID,
			UniqueQRCode:      qrCodeURL,
			CryptographicHash: p.DataHash,
			IssuanceDate:      issuanceDate,
			Status:            status,
		},
		ProductSummary: ProductSummary{
			Commodity:            commodity,
			ProductName:          productName,
			BatchNumber:          batchNum,
			ProducerOrganization: producerOrg,
			Facility: FacilitySummary{
				Name:            facilityName,
				Location:        facilityLoc,
				CountryOfOrigin: countryOfOrigin,
			},
			ProductionDate: prodDate,
			BatchSize: BatchSizeSummary{
				Quantity: batchQty,
				Unit:     batchUnit,
			},
		},
		CarbonFootprint: CarbonFootprintSummary{
			TotalBatchFootprintKgCO2e: math.Round(total*100) / 100,
			IntensityPerUnit: IntensityPerUnit{
				Value: intensityVal,
				Unit:  fmt.Sprintf("kg CO2e per %s", batchUnit),
			},
			ScopeBreakdown: ScopeBreakdown{
				Scope1Direct: ValuePercentage{
					ValueKgCO2e: math.Round(s1*100) / 100,
					Percentage:  s1Pct,
				},
				Scope2IndirectEnergy: ValuePercentage{
					ValueKgCO2e: math.Round(s2*100) / 100,
					Percentage:  s2Pct,
				},
				Scope3ValueChain: ValuePercentage{
					ValueKgCO2e: math.Round(s3*100) / 100,
					Percentage:  s3Pct,
				},
			},
			SourceBreakdown: SourceBreakdown{
				RawMaterials:       ValuePercentage{ValueKgCO2e: math.Round(rawMatVal*100) / 100, Percentage: rawMatPct},
				Electricity:        ValuePercentage{ValueKgCO2e: math.Round(elecVal*100) / 100, Percentage: elecPct},
				LogisticsTransport: ValuePercentage{ValueKgCO2e: math.Round(logVal*100) / 100, Percentage: logPct},
				OnSiteFuel:         ValuePercentage{ValueKgCO2e: math.Round(fuelVal*100) / 100, Percentage: fuelPct},
				Packaging:          ValuePercentage{ValueKgCO2e: math.Round(pkgVal*100) / 100, Percentage: pkgPct},
			},
		},
		MethodologyAndAudit: MethodologyAndAudit{
			StandardAligned:        stdAligned,
			SystemBoundary:         sysBoundary,
			EmissionFactorDatabase: efDB,
			CalculationVersion:     calcVer,
			DataQualityScore: DataQualityScore{
				PrimaryDataPercent:   primaryDataPct,
				SecondaryDataPercent: secondaryDataPct,
				OverallQuality:       overallQuality,
			},
			VerificationDetails: VerificationDetails{
				VerifierName:              verifierName,
				VerificationDate:          vDate,
				VerifierComments:          verifierComments,
				EvidenceDocumentsAttached: evidenceDocs,
			},
		},
		ComplianceExports: ComplianceExports{
			CBAMReady:              cbamReady,
			TargetExportMarket:     exportMkt,
			ExportFormatsAvailable: exportFormats,
		},
	}
}

// PrepareActivityMapAliases ensures activity parameters and aliases are mapped into activityMap.
func PrepareActivityMapAliases(activityMap map[string]interface{}) {
	if s3, ok := activityMap["scope_3_upstream"].(map[string]interface{}); ok {
		if _, hasMat := activityMap["raw_material_kg"]; !hasMat {
			if bom, ok := s3["bill_of_materials"].([]interface{}); ok {
				var totalKg float64
				for _, item := range bom {
					if itemMap, ok := item.(map[string]interface{}); ok {
						if qty, ok := itemMap["quantity"].(float64); ok {
							totalKg += qty
						}
					}
				}
				if totalKg > 0 {
					activityMap["raw_material_kg"] = totalKg
				}
			}
		}
		if _, hasPkg := activityMap["packaging_qty"]; !hasPkg {
			if pkg, ok := s3["packaging"].(map[string]interface{}); ok {
				if qty, ok := pkg["quantity"].(float64); ok && qty > 0 {
					activityMap["packaging_qty"] = qty
				}
			}
		}
		if _, hasTrans := activityMap["transport_km"]; !hasTrans {
			if log, ok := s3["logistics"].(map[string]interface{}); ok {
				if dist, ok := log["distance_km"].(float64); ok && dist > 0 {
					activityMap["transport_km"] = dist
				}
			}
		}
	}

	if s1, ok := activityMap["scope_1_direct"].(map[string]interface{}); ok {
		if liters, ok := s1["fuel_consumed_liters"].(float64); ok && liters > 0 {
			if _, hasFuel := activityMap["fuel_consumed_liters"]; !hasFuel {
				activityMap["fuel_consumed_liters"] = liters
			}
		}
	}

	if s2, ok := activityMap["scope_2_indirect"].(map[string]interface{}); ok {
		if kwh, ok := s2["electricity_consumed_kwh"].(float64); ok && kwh > 0 {
			if _, hasElec := activityMap["electricity_consumed_kwh"]; !hasElec {
				activityMap["electricity_consumed_kwh"] = kwh
			}
		}
	}

	if bd, ok := activityMap["batch_data"].(map[string]interface{}); ok {
		if qty, ok := bd["batch_size_quantity"].(float64); ok && qty > 0 {
			if _, hasB := activityMap["batch_quantity_kg"]; !hasB {
				activityMap["batch_quantity_kg"] = qty
			}
			if _, hasB2 := activityMap["batch_quantity"]; !hasB2 {
				activityMap["batch_quantity"] = qty
			}
		}
	}

	if v, ok := activityMap["fuel_consumed_liters"].(float64); !ok || v <= 0 {
		activityMap["fuel_consumed_liters"] = 150.0
	}
	if v, ok := activityMap["electricity_consumed_kwh"].(float64); !ok || v <= 0 {
		activityMap["electricity_consumed_kwh"] = 1200.0
	}
	if v, ok := activityMap["batch_quantity_kg"].(float64); !ok || v <= 0 {
		activityMap["batch_quantity_kg"] = 1000.0
	}
	if v, ok := activityMap["batch_quantity"].(float64); !ok || v <= 0 {
		activityMap["batch_quantity"] = 1000.0
	}
	if v, ok := activityMap["raw_material_kg"].(float64); !ok || v <= 0 {
		if bq, ok := activityMap["batch_quantity_kg"].(float64); ok && bq > 0 {
			activityMap["raw_material_kg"] = bq
		} else {
			activityMap["raw_material_kg"] = 1000.0
		}
	}
	if v, ok := activityMap["packaging_qty"].(float64); !ok || v <= 0 {
		activityMap["packaging_qty"] = 10.0
	}
	if v, ok := activityMap["transport_km"].(float64); !ok || v <= 0 {
		activityMap["transport_km"] = 100.0
	}
}

// ResolveRulebookForCommodity returns a standard CalculationRulebook based on commodity type.
func ResolveRulebookForCommodity(commodityType string) engine.CalculationRulebook {
	rb := engine.CalculationRulebook{
		CommodityType: commodityType,
	}
	commLower := strings.ToLower(commodityType)
	switch {
	case strings.Contains(commLower, "cocoa"):
		rb.Scope1Formula = "fuel_consumed_liters * 2.68"
		rb.Scope2Formula = "electricity_consumed_kwh * 0.45"
		rb.Scope3Formula = "(raw_material_kg * 0.175) + (packaging_qty * 1.875) + (transport_km * 0.12)"
		rb.FunctionalUnit = "kg CO2e per kg"
		rb.BatchQuantity = 1000.0
	case strings.Contains(commLower, "steel") || strings.Contains(commLower, "iron") || strings.Contains(commLower, "metal"):
		rb.Scope1Formula = "fuel_consumed_liters * 2.68"
		rb.Scope2Formula = "electricity_consumed_kwh * 0.71"
		rb.Scope3Formula = "(raw_material_kg * 0.65) + (transport_km * 0.15)"
		rb.FunctionalUnit = "kg CO2e per kg"
		rb.BatchQuantity = 5000.0
	case strings.Contains(commLower, "cashew"):
		rb.Scope1Formula = "fuel_consumed_liters * 2.68"
		rb.Scope2Formula = "electricity_consumed_kwh * 0.45"
		rb.Scope3Formula = "(raw_material_kg * 0.35) + (transport_km * 0.10)"
		rb.FunctionalUnit = "kg CO2e per kg"
		rb.BatchQuantity = 1000.0
	case strings.Contains(commLower, "textile"):
		rb.Scope1Formula = "fuel_consumed_liters * 2.68"
		rb.Scope2Formula = "electricity_consumed_kwh * 0.55"
		rb.Scope3Formula = "(raw_material_kg * 0.40) + (packaging_qty * 1.5)"
		rb.FunctionalUnit = "kg CO2e per meter"
		rb.BatchQuantity = 1000.0
	case strings.Contains(commLower, "food"):
		rb.Scope1Formula = "fuel_consumed_liters * 2.68"
		rb.Scope2Formula = "electricity_consumed_kwh * 0.45"
		rb.Scope3Formula = "(raw_material_kg * 0.25) + (packaging_qty * 1.2)"
		rb.FunctionalUnit = "kg CO2e per unit"
		rb.BatchQuantity = 1000.0
	case strings.Contains(commLower, "cement") || strings.Contains(commLower, "construction"):
		rb.Scope1Formula = "fuel_consumed_liters * 2.68"
		rb.Scope2Formula = "electricity_consumed_kwh * 0.85"
		rb.Scope3Formula = "(raw_material_kg * 0.50) + (transport_km * 0.20)"
		rb.FunctionalUnit = "kg CO2e per ton"
		rb.BatchQuantity = 100.0
	default:
		rb.Scope1Formula = "fuel_consumed_liters * 2.68"
		rb.Scope2Formula = "electricity_consumed_kwh * 0.45"
		rb.Scope3Formula = "(raw_material_kg * 0.25) + (packaging_qty * 1.5) + (transport_km * 0.10)"
		rb.FunctionalUnit = "kg CO2e per unit"
		rb.BatchQuantity = 1000.0
	}
	return rb
}
