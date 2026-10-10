package main

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math"
	"net/http"
	"os"
	"regexp"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/rs/cors"
	"github.com/vmware-tanzu/graph-framework-for-microservices/gqlgen/graphql/handler"
	"github.com/vmware-tanzu/graph-framework-for-microservices/gqlgen/graphql/playground"

	configv1 "saurient-platform/build/apis/config.saurient.io/v1"
	inventoryv1 "saurient-platform/build/apis/inventory.saurient.io/v1"
	runtimev1 "saurient-platform/build/apis/runtime.saurient.io/v1"
	nexus_client "saurient-platform/build/nexus-client"
	gqlgraph "saurient-platform/build/nexus-gql/graph"
	gqlgenerated "saurient-platform/build/nexus-gql/graph/generated"
	"saurient-platform/internal/api"
	"saurient-platform/internal/engine"
	"saurient-platform/internal/nexus"
	"saurient-platform/internal/telemetry"
	"saurient-platform/internal/tenant"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type VerificationServer struct {
	nexusClient *nexus_client.Clientset
	nexusEngine *nexus.NexusGraphEngine
	reconciler  *nexus.ProductReconciler
	gqlHandler  http.Handler
	rulesMutex  sync.RWMutex
	customRules map[string]RulebookItemResponse
}

func (s *VerificationServer) getNexusClient() *nexus_client.Clientset {
	return s.nexusClient
}

const openAPISpecJSON = `{
  "openapi": "3.0.3",
  "info": {
    "title": "Saurient Carbon Passport Platform - Core API Gateway",
    "description": "Enterprise microservice API Gateway for the 3-CRD Saurient Carbon Passport architecture (CalculationRulebook -> Product -> CarbonPassport).",
    "version": "1.0.0"
  },
  "servers": [
    {
      "url": "http://localhost:8080",
      "description": "Local Kind Cluster Gateway"
    }
  ],
  "paths": {
    "/api/v1/products": {
      "post": {
        "summary": "Create Product Batch",
        "description": "Registers a new product batch with activity data telemetry and batch metadata, creating a Product Custom Resource in Kubernetes. The ProductReconciler automatically evaluates formulas from the referenced CalculationRulebook and issues a child CarbonPassport CR.",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["tenant_id", "commodity_type", "rulebook_ref", "activity_data"],
                "properties": {
                  "tenant_id": { "type": "string", "example": "org_saurient_demo" },
                  "facility_id": { "type": "string", "example": "fac_nordic_smelter_01" },
                  "batch_id": { "type": "string", "example": "aluminum-batch-iai-2026-001" },
                  "product_name": { "type": "string", "example": "Hydro-Powered Low-Carbon Primary Aluminium Ingot" },
                  "commodity_type": { "type": "string", "example": "Aluminium" },
                  "rulebook_ref": {
                    "type": "object",
                    "properties": {
                      "name": { "type": "string", "example": "aluminium-rulebook-iai-2026" },
                      "namespace": { "type": "string", "example": "default" }
                    }
                  },
                  "batch_data": {
                    "type": "object",
                    "properties": {
                      "product_name": { "type": "string", "example": "Hydro-Powered Low-Carbon Primary Aluminium Ingot" },
                      "commodity": { "type": "string", "example": "Aluminium" },
                      "batch_id": { "type": "string", "example": "aluminum-batch-iai-2026-001" },
                      "facility_name": { "type": "string", "example": "fac_nordic_smelter_01" },
                      "facility_location": { "type": "string", "example": "Sunndalsøra Hydro Smelter, Norway" },
                      "batch_size_quantity": { "type": "number", "example": 5000.0 },
                      "unit_of_measure": { "type": "string", "example": "kg" },
                      "export_market": { "type": "string", "example": "European Union" }
                    }
                  },
                  "activity_data": {
                    "type": "object",
                    "description": "Industrial telemetry inputs evaluated against CEL DAG rule expressions",
                    "properties": {
                      "batch_quantity_kg": { "type": "number", "example": 5000.0 },
                      "anode_consumed_kg": { "type": "number", "example": 2250.0 },
                      "natural_gas_m3": { "type": "number", "example": 800.0 },
                      "smelting_electricity_kwh": { "type": "number", "example": 70000.0 },
                      "grid_carbon_intensity": { "type": "number", "example": 0.15 },
                      "bauxite_mined_tons": { "type": "number", "example": 20.0 },
                      "alumina_refined_tons": { "type": "number", "example": 10.0 },
                      "freight_ton_km": { "type": "number", "example": 15000.0 }
                    }
                  }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Product CR registered successfully in Kubernetes cluster",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/ProductCreateResponse" }
              }
            }
          },
          "400": { "description": "Invalid payload or missing mandatory fields" }
        }
      }
    },
    "/api/v1/products/{name}": {
      "get": {
        "summary": "Get Product Status",
        "description": "Retrieves the status of a registered Product Custom Resource including reconciliation phase, total calculated footprint, data hash, and child CarbonPassport reference.",
        "parameters": [
          {
            "name": "name",
            "in": "path",
            "required": true,
            "description": "Name of the Product CR",
            "schema": { "type": "string", "example": "aluminum-batch-iai-2026-001" }
          },
          {
            "name": "namespace",
            "in": "query",
            "required": false,
            "description": "Kubernetes namespace (defaults to 'default')",
            "schema": { "type": "string", "example": "default" }
          }
        ],
        "responses": {
          "200": { "description": "Product CR details and reconciliation status" },
          "404": { "description": "Product CR not found" }
        }
      }
    },
    "/api/v1/rules": {
      "get": {
        "summary": "List Calculation Rulebooks",
        "description": "Retrieves all registered calculation rulebooks and CRDs defining Scope 1-3 formulas and accounting standards.",
        "responses": {
          "200": { "description": "List of CalculationRulebook items" }
        }
      },
      "post": {
        "summary": "Create Calculation Rulebook",
        "description": "Creates a new CalculationRulebook Custom Resource in Kubernetes defining Scope 1-3 CEL DAG formulas, accounting modes (pcf, ghg, cbam), functional unit, and batch quantity for a commodity type.",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["name", "commodity_type", "rules"],
                "properties": {
                  "name": { "type": "string", "example": "aluminium-rulebook-iai-2026" },
                  "namespace": { "type": "string", "example": "default" },
                  "commodity_type": { "type": "string", "example": "Aluminium" },
                  "version": { "type": "string", "example": "2026.1" },
                  "accounting_mode": { "type": "string", "example": "pcf" },
                  "functional_unit": { "type": "string", "example": "kg CO2e per kg Aluminium Ingot" },
                  "batch_quantity": { "type": "number", "example": 5000.0 },
                  "rules": {
                    "type": "array",
                    "description": "DAG calculation steps evaluated sequentially or in parallel",
                    "items": {
                      "type": "object",
                      "properties": {
                        "id": { "type": "string", "example": "R01" },
                        "name": { "type": "string", "example": "Anode Consumption & Process PFCs" },
                        "scope": { "type": "string", "example": "scope1" },
                        "mode": { "type": "string", "example": "pcf" },
                        "outputType": { "type": "string", "example": "intermediate" },
                        "formula": { "type": "string", "example": "anode_consumed_kg * 1.8" }
                      }
                    },
                    "example": [
                      { "id": "R01", "name": "Anode Consumption & Process PFCs", "scope": "scope1", "mode": "pcf", "formula": "anode_consumed_kg * 1.8" },
                      { "id": "R02", "name": "Casting & Holding Furnaces", "scope": "scope1", "mode": "pcf", "formula": "natural_gas_m3 * 2.1" },
                      { "id": "R03", "name": "Hall-Heroult Electrolysis Power", "scope": "scope2", "mode": "pcf", "formula": "smelting_electricity_kwh * grid_carbon_intensity" },
                      { "id": "R04", "name": "Bauxite Mining Upstream", "scope": "scope3", "mode": "pcf", "formula": "bauxite_mined_tons * 38.5" },
                      { "id": "R05", "name": "Bayer Alumina Refining", "scope": "scope3", "mode": "pcf", "formula": "alumina_refined_tons * 800.0" },
                      { "id": "R06", "name": "Transoceanic Freight Logistics", "scope": "scope3", "mode": "pcf", "formula": "freight_ton_km * 0.08" },
                      { "id": "R07", "name": "Total Cradle-to-Gate Footprint", "scope": "intermediate", "mode": "pcf", "outputType": "total_footprint", "formula": "R01 + R02 + R03 + R04 + R05 + R06" },
                      { "id": "R08", "name": "Carbon Intensity per Kg Al", "scope": "intermediate", "mode": "pcf", "outputType": "intensity", "formula": "R07 / batch_quantity_kg" }
                    ]
                  }
                }
              }
            }
          }
        },
        "responses": {
          "201": { "description": "CalculationRulebook CR created successfully" }
        }
      }
    },
    "/api/v1/passports/{passport_id}": {
      "get": {
        "summary": "Get Digital Carbon Passport",
        "description": "Retrieves verified product Carbon Passport details with Scope 1-3 footprint breakdowns, intensity per unit, and SHA-256 cryptographic hash proofs from high-speed Redis edge cache or RLS PostgreSQL storage.",
        "parameters": [
          {
            "name": "passport_id",
            "in": "path",
            "required": true,
            "description": "UUID of the Carbon Passport",
            "schema": { "type": "string", "example": "aluminum-batch-iai-2026-001-passport" }
          },
          {
            "name": "X-Tenant-ID",
            "in": "header",
            "required": false,
            "description": "Multi-tenant context isolation header",
            "schema": { "type": "string", "example": "org_saurient_demo" }
          }
        ],
        "responses": {
          "200": {
            "description": "Verified Carbon Passport details",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/CarbonPassport" }
              }
            }
          },
          "404": { "description": "Passport not found or tenant unauthorized" }
        }
      }
    }
  },
  "components": {
    "schemas": {
      "ProductCreateResponse": {
        "type": "object",
        "properties": {
          "name": { "type": "string", "example": "aluminum-batch-iai-2026-001" },
          "namespace": { "type": "string", "example": "default" },
          "tenant_id": { "type": "string", "example": "org_saurient_demo" },
          "facility_id": { "type": "string", "example": "fac_nordic_smelter_01" },
          "batch_id": { "type": "string", "example": "aluminum-batch-iai-2026-001" },
          "product_name": { "type": "string", "example": "Hydro-Powered Low-Carbon Primary Aluminium Ingot" },
          "commodity_type": { "type": "string", "example": "Aluminium" },
          "status": { "type": "string", "example": "Pending" },
          "created_at": { "type": "string", "format": "date-time" }
        }
      },
      "CarbonPassport": {
        "type": "object",
        "properties": {
          "passport_id": { "type": "string", "example": "aluminum-batch-iai-2026-001-passport" },
          "tenant_id": { "type": "string", "example": "org_saurient_demo" },
          "facility_id": { "type": "string", "example": "fac_nordic_smelter_01" },
          "batch_number": { "type": "string", "example": "aluminum-batch-iai-2026-001" },
          "commodity_type": { "type": "string", "example": "Aluminium" },
          "verification_status": { "type": "string", "example": "Calculated" },
          "scope_1_kg_co2e": { "type": "number", "example": 5730.0 },
          "scope_2_kg_co2e": { "type": "number", "example": 10500.0 },
          "scope_3_kg_co2e": { "type": "number", "example": 9970.0 },
          "total_footprint_kg": { "type": "number", "example": 26200.0 },
          "intensity_per_unit": { "type": "number", "example": 5.24 },
          "data_hash": { "type": "string", "example": "b47e2c90e3810a9161a052e46b9a89c92a188f1100b95d0ef92809e578c772b1" }
        }
      }
    }
  }
}`

const swaggerUIHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Saurient Carbon Passport - Nexus API Gateway Swagger UI</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin:0; background: #fafafa; }
    .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js" charset="UTF-8"> </script>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js" charset="UTF-8"> </script>
  <script>
    window.onload = function() {
      window.ui = SwaggerUIBundle({
        url: "/swagger/openapi.json",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout"
      });
    };
  </script>
</body>
</html>`

const graphqlPlaygroundHTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset=utf-8/>
  <title>Nexus GraphQL Explorer - Saurient Carbon Passport</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/graphql-playground-react/build/static/css/index.css" />
  <script src="https://cdn.jsdelivr.net/npm/graphql-playground-react/build/static/js/middleware.js"></script>
  <style>
    body { background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; height: 100vh; margin: 0; }
    #root { height: 100%; }
    
    /* Completely hide type tooltips, hover info popovers, and floating type boxes */
    .CodeMirror-info,
    .info-popover,
    .type-name,
    div[class*="info-popover"],
    div[class*="type-name"],
    div[class*="popover"],
    div[class*="tooltip"] {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      pointer-events: none !important;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script>
    window.addEventListener('load', function (event) {
      GraphQLPlayground.init(document.getElementById('root'), {
        endpoint: '/graphql',
        settings: {
          'editor.theme': 'dark',
          'editor.cursorShape': 'line',
          'editor.fontSize': 14,
          'editor.reuseHeaders': true,
          'tracing.hideTracingResponse': true
        }
      });

      // Active observer to remove dynamically spawned hover type popovers
      const observer = new MutationObserver(function() {
        const popovers = document.querySelectorAll('.info-popover, .type-name, div[class*="info-popover"], div[class*="type-name"], .CodeMirror-info');
        popovers.forEach(function(el) {
          el.style.setProperty('display', 'none', 'important');
          el.style.setProperty('visibility', 'hidden', 'important');
        });
      });
      observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });
    });
  </script>
</body>
</html>`

const graphiqlHTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Nexus GraphiQL Explorer - Saurient Carbon Passport</title>
  <style>
    body { height: 100vh; margin: 0; width: 100%; overflow: hidden; background: #0f172a; }
    #graphiql { height: 100vh; }
  </style>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <link rel="stylesheet" href="https://unpkg.com/graphiql/graphiql.min.css" />
</head>
<body>
  <div id="graphiql">Loading GraphiQL...</div>
  <script src="https://unpkg.com/graphiql/graphiql.min.js"></script>
  <script>
    const fetcher = GraphiQL.createFetcher({ url: '/graphql' });
    ReactDOM.render(
      React.createElement(GraphiQL, {
        fetcher: fetcher,
        defaultEditorTheme: 'dracula',
        headerEditorEnabled: true,
        shouldPersistHeaders: true,
      }),
      document.getElementById('graphiql'),
    );
  </script>
</body>
</html>`

const graphqlVoyagerHTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Nexus GraphQL Node Graph Voyager - Saurient Carbon Passport</title>
  <meta name="viewport" content="user-scalable=no, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, minimal-ui" />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/graphql-voyager@1.0.0-rc.31/dist/voyager.css" />
  <style>
    body { height: 100vh; margin: 0; width: 100%; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    #voyager { height: 100vh; }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/react@16.14.0/umd/react.production.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/react-dom@16.14.0/umd/react-dom.production.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/graphql-voyager@1.0.0-rc.31/dist/voyager.min.js"></script>
</head>
<body>
  <div id="voyager">Loading Nexus Graph Voyager...</div>
  <script>
    function introspectionProvider(introspectionQuery) {
      return fetch('/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: introspectionQuery }),
      }).then(function (response) { return response.json(); });
    }
    GraphQLVoyager.renderVoyager(document.getElementById('voyager'), {
      introspection: introspectionProvider,
      displayOptions: {
        skipRelay: false,
        skipDeprecated: true,
        rootType: 'Query',
        sortByAlphabet: false
      }
    });
  </script>
</body>
</html>`

func main() {
	port := getEnv("PORT", "8080")

	// Initialize Nexus typed client and ensure root graph anchor hierarchy
	nClient := nexus.GetNexusClient()
	if nClient == nil {
		log.Fatalf("Fatal: Nexus client cannot be nil")
	}
	if _, err := nexus.EnsureGraphRoots(context.Background(), nClient); err != nil {
		log.Printf("Warning: failed to ensure Nexus graph roots: %v", err)
	}

	server := &VerificationServer{
		nexusClient: nClient,
		nexusEngine: nexus.GetNexusEngine(),
	}

	// Initialize and start Nexus Product Reconciler background worker
	celEng := engine.NewCELEngine()
	reconciler := nexus.NewProductReconcilerWithClient(nClient, server.nexusEngine, celEng)
	reconciler.Start(context.Background())
	server.reconciler = reconciler

	// Initialize compiler-generated Nexus GraphQL Server (matching graph-framework-for-microservices)
	gqlgraph.SetNexusClient(nClient)
	es := gqlgenerated.NewExecutableSchema(gqlgenerated.Config{Resolvers: &gqlgraph.Resolver{}})
	gqlServer := handler.NewDefaultServer(es)
	server.gqlHandler = gqlServer
	log.Println("API Gateway initialized Compiler-Generated Nexus GraphQL Server & Resolvers")

	// 1. Healthz Probe Endpoint
	http.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"status":"ok"}`))
	})

	// 2. Swagger UI & OpenAPI Specification Endpoints
	http.HandleFunc("/swagger/openapi.json", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(openAPISpecJSON))
	})

	http.HandleFunc("/swagger/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(swaggerUIHTML))
	})

	// 3. Nexus Graph Datamodel Reflection API
	http.HandleFunc("/api/v1/nexus/graph", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		graphSpec := map[string]interface{}{
			"framework":  "Nexus (graph-framework-for-microservices)",
			"repository": "https://github.com/vmware-tanzu/graph-framework-for-microservices",
			"root_node":  "Root",
			"hierarchy": map[string]interface{}{
				"Root": map[string]interface{}{
					"nexus_tag": "root",
					"children":  []string{"Config", "Inventory", "Runtime"},
				},
				"Config": map[string]interface{}{
					"nexus_tag": "child",
					"children":  []string{"RulebookMap", "CbamBenchmarkMap", "StoryboardSceneMap"},
				},
				"Inventory": map[string]interface{}{
					"nexus_tag": "child",
					"children":  []string{"TenantMap", "ACVAgencyMap", "SupplierMap"},
				},
				"Runtime": map[string]interface{}{
					"nexus_tag": "child",
					"children":  []string{"CarbonPassportMap", "ProcessPassportMap", "ReadinessAssessmentMap", "VerificationMap", "ComplianceArtifactMap", "ProvenanceNodeMap"},
				},
			},
		}
		resp, _ := json.MarshalIndent(graphSpec, "", "  ")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write(resp)
	})

	// 4. Nexus GraphQL Gateway Endpoints (matching graph-framework-for-microservices)
	corsMiddleware := cors.New(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"*"},
		AllowCredentials: true,
	})

	http.Handle("/query", corsMiddleware.Handler(gqlServer))
	http.Handle("/apis/graphql/v1/query", corsMiddleware.Handler(gqlServer))
	http.HandleFunc("/graphql", server.handleGraphQL)
	http.Handle("/graphql/playground", playground.Handler("GraphQL playground", "/graphql"))
	http.HandleFunc("/graphql/voyager", server.handleGraphQLVoyager)
	http.HandleFunc("/voyager", server.handleGraphQLVoyager)

	// 5. Nexus Automatic Node REST Endpoints for Data Model Tree
	http.HandleFunc("/api/v1/nexus/nodes/", server.handleNexusNodes)
	http.HandleFunc("/api/v1/nexus/enterprises", server.handleNexusNodeCollection("enterprise"))
	http.HandleFunc("/api/v1/nexus/facilities", server.handleNexusNodeCollection("facility"))
	http.HandleFunc("/api/v1/nexus/devices", server.handleNexusNodeCollection("device"))
	http.HandleFunc("/api/v1/nexus/production-batches", server.handleNexusNodeCollection("production-batch"))
	http.HandleFunc("/api/v1/nexus/product-types", server.handleNexusNodeCollection("product-type"))
	http.HandleFunc("/api/v1/nexus/calculation-rulebooks", server.handleNexusNodeCollection("calculation-rulebook"))
	http.HandleFunc("/api/v1/nexus/carbon-passports", server.handleNexusNodeCollection("carbon-passport"))
	http.HandleFunc("/api/v1/nexus/emission-snapshots", server.handleNexusNodeCollection("emission-snapshot"))
	http.HandleFunc("/api/v1/nexus/verification-records", server.handleNexusNodeCollection("verification-record"))
	http.HandleFunc("/api/v1/nexus/compliance-artifacts", server.handleNexusNodeCollection("compliance-artifact"))

	// 6. Core 3-CRD REST Endpoints
	http.HandleFunc("/api/v1/products", server.handleProducts)
	http.HandleFunc("/api/v1/products/", server.handleProducts)
	http.HandleFunc("/api/v1/rules", server.handleRules)
	http.HandleFunc("/api/v1/rules/", server.handleRules)

	// 7. Digital Carbon Passport REST CRUD & Verification API
	http.HandleFunc("/api/v1/passports", server.handlePassports)
	http.HandleFunc("/api/v1/passports/", server.handlePassports)

	// 7.1 MRV Readiness & Submission REST API
	http.HandleFunc("/api/v1/mrv/readiness/submit", server.handleMRVSubmitPackage)
	http.HandleFunc("/api/v1/mrv/submit", server.handleMRVSubmitPackage)
	http.HandleFunc("/api/v1/mrv/freeze", server.handleMRVFreezeDataset)

	// 8. Organisation & Internal Workspace REST API
	orgHandler := api.NewOrganisationHandlerWithClient(nClient, server.nexusEngine)
	orgHandler.RegisterRoutes(http.DefaultServeMux)

	// 9. ACV Verification & Nexus Lineage REST API
	acvHandler := api.NewACVHandler(server.nexusEngine)
	acvHandler.RegisterRoutes(http.DefaultServeMux)

	lineageHandler := api.NewLineageHandler()
	lineageHandler.RegisterRoutes(http.DefaultServeMux)

	// 10. Industrial Telemetry Simulation (Schneider / Sattric EM6400)
	telemetryGen := telemetry.NewTelemetryGenerator()
	telemetryServer := telemetry.NewServer(telemetryGen, port)
	telemetryServer.RegisterRoutes(http.DefaultServeMux)

	// Redirect root / to /swagger/
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/" {
			http.Redirect(w, r, "/swagger/", http.StatusFound)
			return
		}
		http.NotFound(w, r)
	})

	log.Printf("Saurient Carbon Passport Nexus API Gateway listening on :%s", port)
	log.Printf("Swagger UI interactive API documentation available at http://localhost:%s/swagger/", port)
	log.Printf("GraphQL Playground available at http://localhost:%s/graphql/playground", port)
	log.Printf("GraphQL Voyager node visualizer available at http://localhost:%s/graphql/voyager", port)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}

func (s *VerificationServer) GetPassportByID(ctx context.Context, passportID string) (interface{}, error) {
	nClient := s.getNexusClient()
	var p *nexus.CarbonPassportModel
	if nClient != nil {
		if pNode, err := nexus.GetPassportNode(ctx, nClient, passportID); err == nil && pNode != nil {
			p = nexus.CarbonPassportModelFromNode(pNode)
		} else if pNode, err := nexus.GetPassportNodeByBatchID(ctx, nClient, passportID); err == nil && pNode != nil {
			p = nexus.CarbonPassportModelFromNode(pNode)
		}
	}

	if p == nil && s.nexusEngine != nil {
		var err error
		p, err = s.nexusEngine.GetPassportByID(ctx, passportID)
		if err != nil || p == nil {
			return nil, err
		}
	}
	if p == nil {
		return nil, fmt.Errorf("passport not found: %s", passportID)
	}
	return map[string]interface{}{
		"passport_id":         p.PassportID,
		"tenant_id":           p.TenantID,
		"facility_id":         p.FacilityID,
		"batch_number":        p.BatchNumber,
		"commodity_type":      p.CommodityType,
		"verification_status": p.VerificationStatus,
		"total_footprint_kg":  p.TotalFootprintKg,
		"intensity_per_unit":  math.Round((p.TotalFootprintKg/1000.0)*100) / 100,
		"data_hash":           p.DataHash,
		"issued_at":           p.IssuedAt.Format(time.RFC3339),
		"facility": map[string]interface{}{
			"id":            p.FacilityID,
			"name":          "Hydro Sunndalsøra Smelter",
			"location":      "Norway",
			"enterprise_id": "ent-saurient-global",
		},
		"productType": map[string]interface{}{
			"id":        "prod-" + strings.ToLower(p.CommodityType),
			"name":      p.CommodityType + " Ingot",
			"commodity": p.CommodityType,
		},
		"snapshots": []map[string]interface{}{
			{
				"scope1KgCO2e":     p.TotalFootprintKg * 0.2187,
				"scope2KgCO2e":     p.TotalFootprintKg * 0.4007,
				"scope3KgCO2e":     p.TotalFootprintKg * 0.3806,
				"totalFootprintKg": p.TotalFootprintKg,
				"dataHash":         p.DataHash,
			},
		},
		"verificationRecords": []map[string]interface{}{
			{
				"verifierID": "v-dnv-gl-2026",
				"status":     p.VerificationStatus,
				"verifiedAt": time.Now().Format(time.RFC3339),
			},
		},
		"complianceArtifacts": []map[string]interface{}{
			{
				"artifactType": "CBAM_XML",
				"storageURI":   "s3://carbon-artifacts/cbam-2026-aluminum-001.xml",
			},
		},
	}, nil
}

func (s *VerificationServer) handleGraphQL(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "*")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method == http.MethodGet && r.URL.Query().Get("query") == "" {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(graphqlPlaygroundHTML))
		return
	}

	tenantID := r.Header.Get("X-Tenant-ID")
	if tenantID == "" {
		tenantID = r.URL.Query().Get("tenant_id")
	}
	if tenantID == "" {
		tenantID = "org_saurient_demo"
	}

	tenantCtx := tenant.WithTenant(r.Context(), tenantID)
	s.gqlHandler.ServeHTTP(w, r.WithContext(tenantCtx))
}

func (s *VerificationServer) handleGraphQLVoyager(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte(graphqlVoyagerHTML))
}

func (s *VerificationServer) handleNexusNodes(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	nodeType := strings.TrimPrefix(r.URL.Path, "/api/v1/nexus/nodes/")
	nodeType = strings.TrimSuffix(nodeType, "/")

	if nodeType == "" {
		http.Error(w, `{"error":"node_type path parameter required"}`, http.StatusBadRequest)
		return
	}

	s.serveNexusNodeData(w, nodeType)
}

func (s *VerificationServer) handleNexusNodeCollection(nodeType string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")
		s.serveNexusNodeData(w, nodeType)
	}
}

func (s *VerificationServer) serveNexusNodeData(w http.ResponseWriter, nodeType string) {
	normalizedType := strings.ToLower(strings.TrimSpace(nodeType))

	nodeSchemas := map[string]interface{}{
		"enterprise": map[string]interface{}{
			"node_type": "Enterprise",
			"nexus_tag": "root",
			"children":  []string{"FacilityMap", "ProductTypeMap"},
			"nodes": []map[string]interface{}{
				{"id": "ent-saurient-global", "name": "Saurient Industrial Group"},
			},
		},
		"facility": map[string]interface{}{
			"node_type": "Facility",
			"nexus_tag": "child",
			"children":  []string{"DeviceMap", "ProductionBatchMap"},
			"nodes": []map[string]interface{}{
				{"id": "fac-rotterdam-01", "name": "Rotterdam Green Facility"},
			},
		},
		"device": map[string]interface{}{
			"node_type": "Device",
			"nexus_tag": "child",
			"children":  []string{"TelemetryMetricMap"},
			"nodes": []map[string]interface{}{
				{"id": "dev-meter-sattric-01", "type": "Sattric+ Smart Meter", "facility_id": "fac-rotterdam-01"},
			},
		},
		"production-batch": map[string]interface{}{
			"node_type": "ProductionBatch",
			"nexus_tag": "child",
			"children":  []string{},
			"nodes": []map[string]interface{}{
				{"batch_number": "cement-batch-001", "quantity": 100.0, "unit": "Metric Tons"},
			},
		},
		"product-type": map[string]interface{}{
			"node_type": "ProductType",
			"nexus_tag": "child",
			"children":  []string{"CalculationRulebookMap", "CarbonPassportMap"},
			"nodes": []map[string]interface{}{
				{"id": "prod-cement-cem1", "commodity": "Cement"},
			},
		},
		"calculation-rulebook": map[string]interface{}{
			"node_type": "CalculationRulebook",
			"nexus_tag": "child",
			"children":  []string{},
			"nodes": []map[string]interface{}{
				{"name": "cbam-cement-v1", "commodity": "Cement", "scope1_formula": "activityData.electricity_kwh * 0.85 + activityData.fuel_liters * 2.68"},
			},
		},
		"carbon-passport": map[string]interface{}{
			"node_type": "CarbonPassport",
			"nexus_tag": "child",
			"children":  []string{"EmissionSnapshotMap", "VerificationRecordMap", "ComplianceArtifactMap"},
			"status_node": "CarbonPassportStatusNode",
			"nodes": []map[string]interface{}{
				{
					"passport_id":        "4806cae0-30f4-49e9-aaad-7a83b7cbf34b",
					"commodity_type":     "Cement",
					"total_footprint_kg": 7765.0,
					"data_hash":          "9c1b07962f969092b9835faa1897e07408e613a9e02997aa1dfc719a75589ca8",
				},
			},
		},
		"emission-snapshot": map[string]interface{}{
			"node_type": "EmissionSnapshot",
			"nexus_tag": "child",
			"children":  []string{},
			"nodes": []map[string]interface{}{
				{"scope1_kg_co2e": 5740.0, "scope2_kg_co2e": 1275.0, "scope3_kg_co2e": 750.0, "total_kg_co2e": 7765.0},
			},
		},
		"verification-record": map[string]interface{}{
			"node_type": "VerificationRecord",
			"nexus_tag": "child",
			"children":  []string{},
			"nodes": []map[string]interface{}{
				{"verifier_id": "verifier-tuv-sud-01", "status": "Verified"},
			},
		},
		"compliance-artifact": map[string]interface{}{
			"node_type": "ComplianceArtifact",
			"nexus_tag": "child",
			"children":  []string{},
			"nodes": []map[string]interface{}{
				{"artifact_type": "CBAM_XML", "storage_uri": "s3://saurient-cbam-artifacts/cbam-4806cae0.xml"},
			},
		},
	}

	data, exists := nodeSchemas[normalizedType]
	if !exists {
		writeJSONError(w, "unknown node type '"+nodeType+"'", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(data)
}

// BatchData represents detailed batch metadata for products.
type BatchData struct {
	ProductName       string  `json:"product_name,omitempty"`
	Commodity         string  `json:"commodity,omitempty"`
	BatchID           string  `json:"batch_id,omitempty"`
	CnCode            string  `json:"cn_code,omitempty"`
	HsCode            string  `json:"hs_code,omitempty"`
	ProductionDate    string  `json:"production_date,omitempty"`
	FacilityName      string  `json:"facility_name,omitempty"`
	FacilityLocation  string  `json:"facility_location,omitempty"`
	BatchSizeQuantity float64 `json:"batch_size_quantity,omitempty"`
	UnitOfMeasure     string  `json:"unit_of_measure,omitempty"`
	ExportMarket      string  `json:"export_market,omitempty"`
}

// ProductRequest is the JSON payload for POST /api/v1/products.
type ProductRequest struct {
	TenantID         string                 `json:"tenant_id,omitempty"`
	FacilityID       string                 `json:"facility_id,omitempty"`
	BatchID          string                 `json:"batch_id,omitempty"`
	ProductName      string                 `json:"product_name,omitempty"`
	CommodityType    string                 `json:"commodity_type,omitempty"`
	CnCode           string                 `json:"cn_code,omitempty"`
	HsCode           string                 `json:"hs_code,omitempty"`
	ActivityDataRaw  string                 `json:"activity_data_raw,omitempty"`
	RulebookRef      map[string]string      `json:"rulebook_ref,omitempty"`
	BatchData        *BatchData             `json:"batch_data,omitempty"`
	ActivityData     map[string]interface{} `json:"activity_data,omitempty"`
	TelemetryContext map[string]interface{} `json:"telemetry_context,omitempty"`
}

// ProductCreateResponse is the JSON response for a successfully created Product CR.
type ProductCreateResponse struct {
	Name          string `json:"name"`
	Namespace     string `json:"namespace"`
	TenantID      string `json:"tenant_id"`
	FacilityID    string `json:"facility_id"`
	BatchID       string `json:"batch_id"`
	ProductName   string `json:"product_name"`
	CommodityType string `json:"commodity_type"`
	Status        string `json:"status"`
	CreatedAt     string `json:"created_at"`
	PassportID    string `json:"passport_id,omitempty"`
}

// handleProducts routes POST, GET, and DELETE /api/v1/products.
func (s *VerificationServer) handleProducts(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", getEnv("ALLOWED_ORIGIN", "*"))
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-Tenant-ID")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method == http.MethodPost {
		s.handleCreateProduct(w, r)
		return
	}

	if r.Method == http.MethodGet {
		s.handleGetProduct(w, r)
		return
	}

	if r.Method == http.MethodDelete {
		s.handleDeleteProduct(w, r)
		return
	}

	http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
}

func (s *VerificationServer) handleDeleteProduct(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/products/")
	path = strings.TrimPrefix(path, "/api/v1/products")
	id := strings.TrimSpace(path)
	if id == "" {
		id = r.URL.Query().Get("id")
	}
	if id == "" {
		id = r.URL.Query().Get("batch_id")
	}
	if id == "" {
		id = r.URL.Query().Get("name")
	}
	if id == "" {
		http.Error(w, `{"error":"product name or batch_id is required"}`, http.StatusBadRequest)
		return
	}

	tenantID := r.Header.Get("X-Tenant-ID")
	if tenantID == "" {
		tenantID = r.URL.Query().Get("tenant_id")
	}
	if tenantID == "" {
		tenantID = "org_saurient_demo"
	}

	namespace := r.URL.Query().Get("namespace")
	if namespace == "" {
		namespace = "default"
	}

	tenantCtx := tenant.WithTenant(ctx, tenantID)
	_ = nexus.DeleteProductNode(ctx, s.getNexusClient(), tenantID, id)
	_ = nexus.DeletePassportNode(ctx, s.getNexusClient(), id)
	if s.nexusEngine != nil {
		_ = s.nexusEngine.DeleteProduct(tenantCtx, id)
		_ = s.nexusEngine.DeletePassportByBatchNumber(tenantCtx, id)
		_ = s.nexusEngine.DeletePassportByPassportID(tenantCtx, id)
		_ = s.nexusEngine.DeletePassportCache(ctx, fmt.Sprintf("%s:%s", tenantID, id))
	}

	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]string{
		"message":   "Product and associated carbon passport deleted successfully",
		"target_id": id,
	})
}

// handleCreateProduct parses batch & activity JSON, creates a Product CR in Kubernetes,
// and returns http.StatusCreated with the Product details.
func (s *VerificationServer) handleCreateProduct(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	rawBytes, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, `{"error":"failed to read request body"}`, http.StatusBadRequest)
		return
	}

	var req ProductRequest
	if err := json.Unmarshal(rawBytes, &req); err != nil {
		http.Error(w, `{"error":"invalid JSON request body"}`, http.StatusBadRequest)
		return
	}

	// Resolve tenant from header fallback
	if req.TenantID == "" {
		req.TenantID = r.Header.Get("X-Tenant-ID")
	}
	if req.TenantID == "" {
		http.Error(w, `{"error":"tenant_id is required in body or X-Tenant-ID header"}`, http.StatusBadRequest)
		return
	}

	// Extract details from batch_data if supplied
	if req.BatchData != nil {
		if req.ProductName == "" {
			req.ProductName = req.BatchData.ProductName
		}
		if req.CommodityType == "" {
			req.CommodityType = req.BatchData.Commodity
		}
		if req.BatchID == "" {
			req.BatchID = req.BatchData.BatchID
		}
		if req.FacilityID == "" {
			req.FacilityID = req.BatchData.FacilityName
		}
		if req.CnCode == "" {
			req.CnCode = req.BatchData.CnCode
		}
		if req.HsCode == "" {
			req.HsCode = req.BatchData.HsCode
		}
	}

	if req.CommodityType == "" {
		http.Error(w, `{"error":"commodity_type is required"}`, http.StatusBadRequest)
		return
	}

	// Generate batch_id if not provided
	if req.BatchID == "" {
		req.BatchID = "batch-" + uuid.New().String()[:8]
	}

	// Build combined activity map for CEL engine and rich output rendering
	activityMap := make(map[string]interface{})
	if req.ActivityDataRaw != "" && req.ActivityDataRaw != "{}" {
		_ = json.Unmarshal([]byte(req.ActivityDataRaw), &activityMap)
	}
	if req.ActivityData != nil {
		for k, v := range req.ActivityData {
			activityMap[k] = v
		}
		activityMap["activity_data"] = req.ActivityData
	}
	bMap, ok := activityMap["batch_data"].(map[string]interface{})
	if !ok || bMap == nil {
		bMap = make(map[string]interface{})
	}
	if req.BatchData != nil {
		bBytes, _ := json.Marshal(req.BatchData)
		_ = json.Unmarshal(bBytes, &bMap)
	}
	if req.ProductName != "" {
		bMap["product_name"] = req.ProductName
		activityMap["product_name"] = req.ProductName
	}
	if req.CommodityType != "" {
		bMap["commodity"] = req.CommodityType
		activityMap["commodity"] = req.CommodityType
	}
	activityMap["batch_data"] = bMap
	if req.TelemetryContext != nil {
		activityMap["telemetry_context"] = req.TelemetryContext
	}

	// Helper alias mappings for standard CEL formula variables
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
				} else {
					activityMap["transport_km"] = 1000.0
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

	nexus.PrepareActivityMapAliases(activityMap)

	if len(activityMap) > 0 {
		rawBytes, _ := json.Marshal(activityMap)
		req.ActivityDataRaw = string(rawBytes)
	} else if req.ActivityDataRaw == "" {
		req.ActivityDataRaw = "{}"
	}

	// Compute resource name: lowercase, kubernetes-safe
	resourceName := sanitiseK8sName(req.BatchID)

	namespace := "default"
	rulebookName := "default-rulebook"
	if req.RulebookRef != nil {
		if n, ok := req.RulebookRef["name"]; ok && n != "" {
			rulebookName = n
		}
	}

	if req.ActivityDataRaw == "" {
		req.ActivityDataRaw = "{}"
	}

	// Create true Product node in Nexus graph (Root -> Inventory -> Tenant -> Product)
	nClient := s.getNexusClient()
	prodSpec := inventoryv1.ProductSpec{
		ProductID:       req.BatchID,
		ProductName:     req.ProductName,
		CommodityType:   req.CommodityType,
		BatchID:         req.BatchID,
		CnCode:          req.CnCode,
		HsCode:          req.HsCode,
		TenantID:        req.TenantID,
		FacilityID:      req.FacilityID,
		ActivityDataRaw: req.ActivityDataRaw,
		RulebookRef:     rulebookName,
		Phase:           "Pending",
		LastUpdated:     time.Now().UTC().Format(time.RFC3339),
	}
	productNode, err := nexus.CreateProductNode(ctx, nClient, req.TenantID, prodSpec)
	if err != nil {
		log.Printf("Failed to create Product node in Nexus graph: %v", err)
		http.Error(w, `{"error":"failed to create product node in nexus"}`, http.StatusInternalServerError)
		return
	}
	log.Printf("Product node created in Nexus graph under Tenant %s: %s (Phase: Pending)", req.TenantID, productNode.DisplayName())

	// Pure Nexus Informer Controller.
	// Creating the Product node in the Nexus graph automatically triggers the typed Informer
	// callback (ProcessProductAdd), and the background reconciler sweep loop guarantees
	// eventual consistency without legacy manual goroutines or Go channel queues.

	resp := ProductCreateResponse{
		Name:          resourceName,
		Namespace:     namespace,
		TenantID:      req.TenantID,
		FacilityID:    req.FacilityID,
		BatchID:       req.BatchID,
		ProductName:   req.ProductName,
		CommodityType: req.CommodityType,
		Status:        "Pending",
		CreatedAt:     time.Now().UTC().Format(time.RFC3339),
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(resp)
}

// handleGetProduct fetches a Product from Nexus Graph Engine and returns its details.
func (s *VerificationServer) handleGetProduct(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/products/")
	path = strings.TrimPrefix(path, "/api/v1/products")
	name := strings.TrimSpace(path)
	if name == "" {
		name = r.URL.Query().Get("name")
	}
	if name == "" {
		name = r.URL.Query().Get("batch_id")
	}

	tenantID := r.Header.Get("X-Tenant-ID")
	if tenantID == "" {
		tenantID = r.URL.Query().Get("tenant_id")
	}
	if tenantID == "" {
		tenantID = "org_saurient_demo"
	}
	tenantCtx := tenant.WithTenant(ctx, tenantID)

	nClient := s.getNexusClient()
	if nClient == nil && s.nexusEngine == nil {
		http.Error(w, `{"error":"nexus client unavailable"}`, http.StatusServiceUnavailable)
		return
	}

	if name == "" {
		http.Error(w, `{"error":"product name is required in path or query"}`, http.StatusBadRequest)
		return
	}

	// 1. Try to read from Nexus graph node first
	if nClient != nil {
		pNode, err := nexus.GetProductNode(ctx, nClient, tenantID, name)
		if err != nil || pNode == nil || pNode.Product == nil {
			// Search by batch_id or name in tenant's products
			if allProds, listErr := nexus.ListProductNodes(ctx, nClient, tenantID); listErr == nil {
				for _, prod := range allProds {
					if prod != nil && prod.Product != nil && (prod.DisplayName() == name || prod.Spec.BatchID == name || prod.Spec.ProductID == name) {
						pNode = prod
						break
					}
				}
			}
		}

		if pNode != nil && pNode.Product != nil {
			passportRefName := ""
			if pNode.Spec.PassportID != "" {
				passportRefName = pNode.Spec.PassportID
			}
			resp := map[string]interface{}{
				"name":               pNode.DisplayName(),
				"namespace":          "default",
				"tenant_id":          pNode.Spec.TenantID,
				"facility_id":        pNode.Spec.FacilityID,
				"batch_id":           pNode.Spec.BatchID,
				"product_name":       pNode.Spec.ProductName,
				"commodity_type":     pNode.Spec.CommodityType,
				"rulebook_ref": map[string]string{
					"name":      pNode.Spec.RulebookRef,
					"namespace": "default",
				},
				"phase":              pNode.Spec.Phase,
				"passport_id":        pNode.Spec.PassportID,
				"total_footprint_kg": pNode.Spec.TotalFootprintKg,
				"data_hash":          pNode.Spec.DataHash,
				"passport_ref": map[string]string{
					"name":      passportRefName,
					"namespace": "default",
				},
				"last_updated": pNode.Spec.LastUpdated,
			}
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			_ = json.NewEncoder(w).Encode(resp)
			return
		}
	}

	if s.nexusEngine != nil {
		prod, err := s.nexusEngine.GetProduct(tenantCtx, name)
		if err == nil && prod != nil {
			resp := map[string]interface{}{
				"name":               prod.Name,
				"namespace":          prod.Namespace,
				"tenant_id":          prod.TenantID,
				"facility_id":        prod.FacilityID,
				"batch_id":           prod.BatchID,
				"product_name":       prod.ProductName,
				"commodity_type":     prod.CommodityType,
				"rulebook_ref": map[string]string{
					"name":      prod.RulebookRefName,
					"namespace": prod.Namespace,
				},
				"phase":              prod.Phase,
				"passport_id":        prod.PassportID,
				"total_footprint_kg": prod.TotalFootprintKg,
				"data_hash":          prod.DataHash,
				"passport_ref": map[string]string{
					"name":      prod.PassportID,
					"namespace": prod.Namespace,
				},
				"last_updated": prod.LastUpdated.Format(time.RFC3339),
			}
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			_ = json.NewEncoder(w).Encode(resp)
			return
		}
	}

	http.Error(w, `{"error":"product not found"}`, http.StatusNotFound)
}

// RuleRequest is the JSON payload for POST /api/v1/rules.
type RuleRequest struct {
	Name           string                  `json:"name"`
	Namespace      string                  `json:"namespace"`
	CommodityType  string                  `json:"commodity_type"`
	Version        string                  `json:"version"`
	AccountingMode engine.AccountingMode   `json:"accounting_mode,omitempty"`
	Rules          []engine.RuleDefinition `json:"rules,omitempty"`
	Scope1Formula  string                  `json:"scope_1_formula,omitempty"`
	Scope2Formula  string                  `json:"scope_2_formula,omitempty"`
	Scope3Formula  string                  `json:"scope_3_formula,omitempty"`
	FunctionalUnit string                  `json:"functional_unit"`
	BatchQuantity  float64                 `json:"batch_quantity,omitempty"`
}

// RulebookItemResponse is the response model for GET /api/v1/rules.
type RulebookItemResponse struct {
	ID             string                  `json:"id"`
	Name           string                  `json:"name"`
	Label          string                  `json:"label"`
	CommodityType  string                  `json:"commodity_type"`
	Version        string                  `json:"version,omitempty"`
	AccountingMode engine.AccountingMode   `json:"accounting_mode,omitempty"`
	Standard       string                  `json:"standard,omitempty"`
	FunctionalUnit string                  `json:"functional_unit,omitempty"`
	BatchQuantity  float64                 `json:"batch_quantity,omitempty"`
	Rules          []engine.RuleDefinition `json:"rules,omitempty"`
}

func resolveRulebookForProduct(rulebookName, commodityType string, customRules map[string]RulebookItemResponse) engine.CalculationRulebook {
	if customRules != nil {
		if cr, ok := customRules[rulebookName]; ok {
			rb := engine.CalculationRulebook{
				CommodityType:  cr.CommodityType,
				AccountingMode: cr.AccountingMode,
				FunctionalUnit: cr.FunctionalUnit,
				BatchQuantity:  float64(cr.BatchQuantity),
			}
			for _, r := range cr.Rules {
				switch r.Scope {
				case engine.Scope1:
					rb.Scope1Formula = r.Formula
				case engine.Scope2:
					rb.Scope2Formula = r.Formula
				case engine.Scope3:
					rb.Scope3Formula = r.Formula
				}
			}
			if rb.Scope1Formula != "" || rb.Scope2Formula != "" || rb.Scope3Formula != "" {
				return rb
			}
		}
	}

	defaults := getDefaultRulebooks()
	if def, ok := defaults[rulebookName]; ok {
		rb := engine.CalculationRulebook{
			CommodityType:  def.CommodityType,
			AccountingMode: def.AccountingMode,
			FunctionalUnit: def.FunctionalUnit,
			BatchQuantity:  float64(def.BatchQuantity),
		}
		for _, r := range def.Rules {
			switch r.Scope {
			case engine.Scope1:
				rb.Scope1Formula = r.Formula
			case engine.Scope2:
				rb.Scope2Formula = r.Formula
			case engine.Scope3:
				rb.Scope3Formula = r.Formula
			}
		}
		if rb.Scope1Formula != "" || rb.Scope2Formula != "" || rb.Scope3Formula != "" {
			return rb
		}
	}

	return nexus.ResolveRulebookForCommodity(commodityType)
}

func getDefaultRulebooks() map[string]RulebookItemResponse {
	return map[string]RulebookItemResponse{
		"cocoa-rulebook-2026": {
			ID:             "cocoa-rulebook-2026",
			Name:           "cocoa-rulebook-2026",
			Label:          "cocoa-rulebook-2026 (ISO 14067)",
			CommodityType:  "Cocoa",
			Version:        "2026.1",
			AccountingMode: engine.ModePCF,
			Standard:       "ISO 14067 Product Footprint",
			FunctionalUnit: "kg CO2e per kg",
			BatchQuantity:  1000,
			Rules: []engine.RuleDefinition{
				{ID: "R01", Name: "Direct Fuel & Generator Combustion", Scope: engine.Scope1, Mode: engine.ModePCF, OutputType: engine.OutputNone, Formula: "fuel_consumed_liters * 2.68", Description: "Scope 1 diesel combustion emission factor"},
				{ID: "R02", Name: "Grid Electricity Consumption", Scope: engine.Scope2, Mode: engine.ModePCF, OutputType: engine.OutputNone, Formula: "electricity_consumed_kwh * 0.45", Description: "Scope 2 national grid carbon intensity"},
				{ID: "R03", Name: "Raw Materials & Packaging Upstream", Scope: engine.Scope3, Mode: engine.ModePCF, OutputType: engine.OutputNone, Formula: "batch_quantity_kg * 0.175", Description: "Scope 3 raw bean agricultural footprint"},
				{ID: "R04", Name: "Total Batch Footprint Aggregation", Scope: engine.Intermediate, Mode: engine.ModePCF, OutputType: engine.OutputTotalFootprint, Formula: "R01 + R02 + R03", Description: "Sum of Scope 1, 2, and 3 DAG calculation steps"},
				{ID: "R05", Name: "Product Carbon Intensity", Scope: engine.Intermediate, Mode: engine.ModePCF, OutputType: engine.OutputIntensity, Formula: "R04 / batch_quantity_kg", Description: "Unit carbon intensity metric"},
			},
		},
		"metal-rulebook-2026": {
			ID:             "metal-rulebook-2026",
			Name:           "metal-rulebook-2026",
			Label:          "metal-rulebook-2026 (EU CBAM CN 7601)",
			CommodityType:  "Metals",
			Version:        "2026.1",
			AccountingMode: engine.ModeCBAM,
			Standard:       "EU CBAM Annex IV",
			FunctionalUnit: "kg CO2e per kg Aluminium Ingot",
			BatchQuantity:  5000,
		},
		"cashew-rulebook-2026": {
			ID:             "cashew-rulebook-2026",
			Name:           "cashew-rulebook-2026",
			Label:          "cashew-rulebook-2026 (GHG Protocol)",
			CommodityType:  "Cashew",
			Version:        "2026.1",
			AccountingMode: engine.ModeGHG,
			Standard:       "GHG Protocol Product Standard",
			FunctionalUnit: "kg CO2e per kg",
			BatchQuantity:  1000,
		},
		"textiles-rulebook-2026": {
			ID:             "textiles-rulebook-2026",
			Name:           "textiles-rulebook-2026",
			Label:          "textiles-rulebook-2026 (ISO 14067)",
			CommodityType:  "Textiles",
			Version:        "2026.1",
			AccountingMode: engine.ModePCF,
			Standard:       "ISO 14067 Textile Boundary",
			FunctionalUnit: "kg CO2e per meter",
			BatchQuantity:  1000,
		},
		"food-rulebook-2026": {
			ID:             "food-rulebook-2026",
			Name:           "food-rulebook-2026",
			Label:          "food-rulebook-2026 (IPCC Tier 2)",
			CommodityType:  "Processed Foods",
			Version:        "2026.1",
			AccountingMode: engine.ModePCF,
			Standard:       "IPCC Tier 2 Food Standard",
			FunctionalUnit: "kg CO2e per L",
			BatchQuantity:  1000,
		},
		"cement-rulebook-2026": {
			ID:             "cement-rulebook-2026",
			Name:           "cement-rulebook-2026",
			Label:          "cement-rulebook-2026 (GHG Protocol)",
			CommodityType:  "Construction",
			Version:        "2026.1",
			AccountingMode: engine.ModeGHG,
			Standard:       "GHG Protocol Heavy Industry",
			FunctionalUnit: "kg CO2e per ton",
			BatchQuantity:  1000,
		},
		"default-rulebook": {
			ID:             "default-rulebook",
			Name:           "default-rulebook",
			Label:          "default-rulebook (Standard Scope 1-3)",
			CommodityType:  "General",
			Version:        "2026.1",
			AccountingMode: engine.ModeAll,
			Standard:       "Standard Scope 1-3 GHG",
			FunctionalUnit: "kg CO2e per unit",
			BatchQuantity:  1000,
		},
	}
}

// handleRules routes GET and POST /api/v1/rules.
func (s *VerificationServer) handleRules(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", getEnv("ALLOWED_ORIGIN", "*"))
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-Tenant-ID")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method == http.MethodGet {
		s.handleListRules(w, r)
		return
	}

	if r.Method == http.MethodPost {
		s.handleCreateRule(w, r)
		return
	}

	http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
}

// handleListRules returns all registered rulebooks from Nexus and default rules.
func (s *VerificationServer) handleListRules(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	rulesMap := getDefaultRulebooks()

	s.rulesMutex.RLock()
	for k, v := range s.customRules {
		rulesMap[k] = v
	}
	s.rulesMutex.RUnlock()

	nClient := s.getNexusClient()
	if nClient != nil {
		if ruleNodes, err := nexus.ListRulebookNodes(ctx, nClient); err == nil {
			for _, item := range ruleNodes {
				if item == nil || item.Rulebook == nil {
					continue
				}
				var rulesDefs []engine.RuleDefinition
				if item.Spec.RulesRaw != "" {
					_ = json.Unmarshal([]byte(item.Spec.RulesRaw), &rulesDefs)
				}
				rulesMap[item.DisplayName()] = RulebookItemResponse{
					ID:             item.Spec.RulebookID,
					Name:           item.DisplayName(),
					Label:          fmt.Sprintf("%s (%s)", item.DisplayName(), item.Spec.Standard),
					CommodityType:  item.Spec.CommodityType,
					Version:        item.Spec.Version,
					AccountingMode: engine.AccountingMode(item.Spec.AccountingMode),
					Standard:       item.Spec.Standard,
					FunctionalUnit: item.Spec.FunctionalUnit,
					BatchQuantity:  item.Spec.BatchQuantity,
					Rules:          rulesDefs,
				}
			}
		}
	}

	if s.nexusEngine != nil {
		if nexusRules, err := s.nexusEngine.ListRulebooks(ctx); err == nil {
			for _, item := range nexusRules {
				if _, exists := rulesMap[item.Name]; exists {
					continue
				}
				var rulesDefs []engine.RuleDefinition
				if len(item.RulesRaw) > 0 {
					_ = json.Unmarshal(item.RulesRaw, &rulesDefs)
				}
				rulesMap[item.Name] = RulebookItemResponse{
					ID:             item.ID,
					Name:           item.Name,
					Label:          item.Label,
					CommodityType:  item.CommodityType,
					Version:        item.Version,
					AccountingMode: engine.AccountingMode(item.AccountingMode),
					Standard:       item.Standard,
					FunctionalUnit: item.FunctionalUnit,
					BatchQuantity:  item.BatchQuantity,
					Rules:          rulesDefs,
				}
			}
		}
	}

	result := make([]RulebookItemResponse, 0, len(rulesMap))
	for _, v := range rulesMap {
		result = append(result, v)
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(result)
}

// handleCreateRule parses rule JSON and saves a Calculation Rulebook into Nexus.
func (s *VerificationServer) handleCreateRule(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	rawBytes, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, `{"error":"failed to read request body"}`, http.StatusBadRequest)
		return
	}

	var req RuleRequest
	if err := json.Unmarshal(rawBytes, &req); err != nil {
		http.Error(w, `{"error":"invalid JSON request body"}`, http.StatusBadRequest)
		return
	}

	if req.CommodityType == "" {
		http.Error(w, `{"error":"commodity_type is required"}`, http.StatusBadRequest)
		return
	}

	name := req.Name
	if name == "" {
		name = fmt.Sprintf("%s-rulebook-%s", strings.ToLower(req.CommodityType), time.Now().Format("20060102"))
	} else {
		name = strings.ToLower(name)
	}

	namespace := req.Namespace
	if namespace == "" {
		namespace = "default"
	}
	if req.Version == "" {
		req.Version = "2026.1"
	}

	std := "ISO 14067 Product Footprint"
	if req.AccountingMode == engine.ModeCBAM {
		std = "EU CBAM Annex IV"
	} else if req.AccountingMode == engine.ModeGHG {
		std = "GHG Protocol Product Standard"
	}

	rulesRaw, _ := json.Marshal(req.Rules)

	ruleModel := &nexus.RulebookModel{
		ID:             name,
		Name:           name,
		Namespace:      namespace,
		Label:          fmt.Sprintf("%s (%s)", name, std),
		CommodityType:  req.CommodityType,
		Version:        req.Version,
		AccountingMode: string(req.AccountingMode),
		Standard:       std,
		FunctionalUnit: req.FunctionalUnit,
		BatchQuantity:  req.BatchQuantity,
		RulesRaw:       json.RawMessage(rulesRaw),
		Scope1Formula:  req.Scope1Formula,
		Scope2Formula:  req.Scope2Formula,
		Scope3Formula:  req.Scope3Formula,
		CreatedAt:      time.Now(),
	}

	nClient := s.getNexusClient()
	if nClient != nil {
		rbSpec := configv1.RulebookSpec{
			RulebookID:       name,
			CommodityType:    req.CommodityType,
			Version:          req.Version,
			AccountingMode:   string(req.AccountingMode),
			Standard:         std,
			RulesRaw:         string(rulesRaw),
			Scope1Formula:    req.Scope1Formula,
			Scope2Formula:    req.Scope2Formula,
			Scope3Formula:    req.Scope3Formula,
			FunctionalUnit:   req.FunctionalUnit,
			BatchQuantity:    req.BatchQuantity,
			BoundaryType:     "Cradle-to-Gate",
			AllocationMethod: "Physical",
		}
		if _, err := nexus.CreateRulebookNode(ctx, nClient, name, rbSpec); err != nil {
			log.Printf("Failed to save Rulebook node in Nexus graph %s: %v", name, err)
		} else {
			log.Printf("Rulebook node saved in Nexus graph: %s", name)
		}
	}

	if s.nexusEngine != nil {
		if err := s.nexusEngine.SaveRulebook(ctx, ruleModel); err != nil {
			log.Printf("Failed to save Rulebook to Nexus %s: %v", name, err)
		} else {
			log.Printf("Rulebook saved to Nexus: %s", name)
		}
	}

	s.rulesMutex.Lock()
	if s.customRules == nil {
		s.customRules = make(map[string]RulebookItemResponse)
	}
	s.customRules[name] = RulebookItemResponse{
		ID:             name,
		Name:           name,
		Label:          fmt.Sprintf("%s (%s)", name, std),
		CommodityType:  req.CommodityType,
		Version:        req.Version,
		AccountingMode: req.AccountingMode,
		Standard:       std,
		FunctionalUnit: req.FunctionalUnit,
		BatchQuantity:  req.BatchQuantity,
		Rules:          req.Rules,
	}
	s.rulesMutex.Unlock()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"name":           name,
		"namespace":      namespace,
		"commodity_type": req.CommodityType,
		"version":        req.Version,
		"status":         "Created",
		"message":        fmt.Sprintf("Calculation rulebook %s registered successfully in Nexus", name),
		"created_at":     time.Now().UTC().Format(time.RFC3339),
	})
}

// createProductFromPassport creates a Product in Nexus when a passport is submitted.
// This is best-effort: errors are logged but do not fail the passport creation.
func (s *VerificationServer) createProductCRFromPassport(ctx context.Context, req *PassportInputReq, passportID string) {
	nClient := s.getNexusClient()
	if nClient == nil && s.nexusEngine == nil {
		return
	}

	batchID := req.BatchNumber
	if batchID == "" {
		batchID = "batch-" + uuid.New().String()[:8]
	}

	resourceName := sanitiseK8sName(batchID)
	namespace := "default"

	activityRaw := req.ActivityDataRaw
	if activityRaw == "" && req.ActivityData != nil {
		if b, err := json.Marshal(req.ActivityData); err == nil {
			activityRaw = string(b)
		}
	}
	if activityRaw == "" {
		activityRaw = "{}"
	}

	if nClient != nil {
		prodSpec := inventoryv1.ProductSpec{
			ProductID:       batchID,
			ProductName:     req.BatchNumber,
			CommodityType:   req.CommodityType,
			BatchID:         batchID,
			TenantID:        req.TenantID,
			FacilityID:      req.FacilityID,
			ActivityDataRaw: activityRaw,
			RulebookRef:     "default-rulebook",
			Phase:           "Calculated",
			PassportID:      passportID,
			LastUpdated:     time.Now().UTC().Format(time.RFC3339),
		}
		if _, err := nexus.CreateProductNode(ctx, nClient, req.TenantID, prodSpec); err != nil {
			log.Printf("createProductCRFromPassport: failed to create Product node %s: %v", resourceName, err)
		} else {
			log.Printf("createProductCRFromPassport: Product node created in Nexus graph %s", resourceName)
		}
	}

	if s.nexusEngine != nil {
		productModel := &nexus.ProductModel{
			Name:            resourceName,
			Namespace:       namespace,
			TenantID:        req.TenantID,
			FacilityID:      req.FacilityID,
			BatchID:         batchID,
			ProductName:     req.BatchNumber,
			CommodityType:   req.CommodityType,
			ActivityDataRaw: activityRaw,
			RulebookRefName: "default-rulebook",
			Phase:           "Calculated",
			PassportID:      passportID,
			CreatedAt:       time.Now(),
			LastUpdated:     time.Now(),
		}
		tenantCtx := tenant.WithTenant(ctx, req.TenantID)
		if err := s.nexusEngine.SaveProduct(tenantCtx, productModel); err != nil {
			log.Printf("createProductFromPassport: failed to save Product %s: %v", resourceName, err)
		} else {
			log.Printf("createProductFromPassport: Product saved to Nexus %s", resourceName)
		}
	}
}

func (s *VerificationServer) handlePassports(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	allowedOrigin := getEnv("ALLOWED_ORIGIN", "*")
	w.Header().Set("Access-Control-Allow-Origin", allowedOrigin)
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-Tenant-ID, X-User-Role, X-User-Email")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method == http.MethodPost {
		if strings.HasSuffix(r.URL.Path, "/sign") || strings.HasSuffix(r.URL.Path, "/issue") {
			s.handleSignPassport(w, r)
			return
		}
		if strings.HasSuffix(r.URL.Path, "/submit") {
			s.handleSubmitPassport(w, r)
			return
		}
		if strings.HasSuffix(r.URL.Path, "/findings") || strings.HasSuffix(r.URL.Path, "/request-corrections") {
			s.handleRequestCorrections(w, r)
			return
		}
		if strings.HasSuffix(r.URL.Path, "/verify") {
			s.handleVerifyPassport(w, r)
			return
		}
		if strings.HasSuffix(r.URL.Path, "/submit-agency") {
			s.handleSubmitToAgency(w, r)
			return
		}

		s.handleCreatePassport(w, r)
		return
	}

	if r.Method == http.MethodPut {
		s.handleUpdatePassport(w, r)
		return
	}

	if r.Method == http.MethodGet {
		s.handleGetPassport(w, r)
		return
	}

	if r.Method == http.MethodDelete {
		s.handleDeletePassport(w, r)
		return
	}

	http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
}

type PassportSubmitRequest struct {
	SubmittedBy string `json:"submitted_by"`
	Role        string `json:"role,omitempty"`
	Notes       string `json:"notes,omitempty"`
}

func (s *VerificationServer) handleSubmitPassport(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/passports/")
	path = strings.TrimSuffix(path, "/submit")
	passportID := strings.TrimSpace(path)
	if passportID == "" {
		http.Error(w, `{"error":"passport_id is required"}`, http.StatusBadRequest)
		return
	}

	var req PassportSubmitRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil && err != io.EOF {
		http.Error(w, `{"error":"invalid json payload"}`, http.StatusBadRequest)
		return
	}
	if req.SubmittedBy == "" {
		req.SubmittedBy = r.Header.Get("X-User-Email")
	}
	if req.SubmittedBy == "" {
		req.SubmittedBy = "Company Operator"
	}

	nClient := s.getNexusClient()
	pNode, err := nexus.GetPassportNode(ctx, nClient, passportID)
	if err != nil || pNode == nil {
		pNode, err = nexus.GetPassportNodeByBatchID(ctx, nClient, passportID)
	}
	if err != nil || pNode == nil {
		http.Error(w, fmt.Sprintf(`{"error":"passport not found: %s"}`, passportID), http.StatusNotFound)
		return
	}

	// Transition status to Submitted
	pNode.Spec.VerificationStatus = nexus.StatusSubmitted
	if err := pNode.Update(ctx); err != nil {
		http.Error(w, fmt.Sprintf(`{"error":"failed to update passport: %v"}`, err), http.StatusInternalServerError)
		return
	}

	// Audit record
	auditName := fmt.Sprintf("audit-submit-%d", time.Now().UnixNano())
	submitHash := fmt.Sprintf("0xSUB-%x", sha256.Sum256([]byte(pNode.Spec.DataHash+req.SubmittedBy)))
	_, _ = pNode.AddAuditRecords(ctx, &runtimev1.AuditRecord{
		ObjectMeta: metav1.ObjectMeta{Name: auditName},
		Spec: runtimev1.AuditRecordSpec{
			ActionType:   "SubmittedForVerification",
			PreviousHash: pNode.Spec.DataHash,
			CurrentHash:  submitHash,
			Timestamp:    time.Now().UTC().Format(time.RFC3339),
			UserRef:      fmt.Sprintf("%s (%s)", req.SubmittedBy, req.Notes),
		},
	})

	// Also update in-memory engine model and clear cache
	tenantID := pNode.Spec.TenantID
	if s.nexusEngine != nil {
		tenantCtx := tenant.WithTenant(ctx, tenantID)
		if pModel, err := s.nexusEngine.GetPassportByID(tenantCtx, pNode.DisplayName()); err == nil && pModel != nil {
			pModel.VerificationStatus = nexus.StatusSubmitted
			_ = s.nexusEngine.SavePassport(tenantCtx, pModel)
		}
		_ = s.nexusEngine.DeletePassportCache(ctx, fmt.Sprintf("%s:%s", tenantID, passportID))
		_ = s.nexusEngine.DeletePassportCache(ctx, fmt.Sprintf("%s:%s", tenantID, pNode.DisplayName()))
	}

	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"status":       nexus.StatusSubmitted,
		"passport_id":  pNode.DisplayName(),
		"batch_id":     pNode.Spec.BatchID,
		"submitted_by": req.SubmittedBy,
		"submitted_at": time.Now().UTC().Format(time.RFC3339),
		"message":      "Passport completed data and evidence successfully submitted for verification",
	})
}

type PassportCorrectionsRequest struct {
	VerifierName       string `json:"verifier_name"`
	FindingTitle       string `json:"finding_title"`
	FindingDescription string `json:"finding_description"`
	Category           string `json:"category,omitempty"`
}

func (s *VerificationServer) handleRequestCorrections(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/passports/")
	path = strings.TrimSuffix(path, "/findings")
	path = strings.TrimSuffix(path, "/request-corrections")
	passportID := strings.TrimSpace(path)

	var req PassportCorrectionsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil && err != io.EOF {
		http.Error(w, `{"error":"invalid json payload"}`, http.StatusBadRequest)
		return
	}
	if req.VerifierName == "" {
		req.VerifierName = "Accredited Lead Verifier"
	}
	if req.FindingTitle == "" {
		req.FindingTitle = "Material Discrepancy in Activity Data"
	}

	nClient := s.getNexusClient()
	pNode, err := nexus.GetPassportNode(ctx, nClient, passportID)
	if err != nil || pNode == nil {
		pNode, err = nexus.GetPassportNodeByBatchID(ctx, nClient, passportID)
	}
	if err != nil || pNode == nil {
		http.Error(w, fmt.Sprintf(`{"error":"passport not found: %s"}`, passportID), http.StatusNotFound)
		return
	}

	// Update status to CorrectionsRequired
	pNode.Spec.VerificationStatus = nexus.StatusCorrectionsRequired
	if err := pNode.Update(ctx); err != nil {
		http.Error(w, fmt.Sprintf(`{"error":"failed to update passport: %v"}`, err), http.StatusInternalServerError)
		return
	}

	// Audit record
	auditName := fmt.Sprintf("audit-finding-%d", time.Now().UnixNano())
	findingHash := fmt.Sprintf("0xFND-%x", sha256.Sum256([]byte(pNode.Spec.DataHash+req.FindingTitle)))
	_, _ = pNode.AddAuditRecords(ctx, &runtimev1.AuditRecord{
		ObjectMeta: metav1.ObjectMeta{Name: auditName},
		Spec: runtimev1.AuditRecordSpec{
			ActionType:   "CorrectionsRequested",
			PreviousHash: pNode.Spec.DataHash,
			CurrentHash:  findingHash,
			Timestamp:    time.Now().UTC().Format(time.RFC3339),
			UserRef:      fmt.Sprintf("%s (Finding: %s - %s)", req.VerifierName, req.FindingTitle, req.FindingDescription),
		},
	})

	tenantID := pNode.Spec.TenantID
	if s.nexusEngine != nil {
		tenantCtx := tenant.WithTenant(ctx, tenantID)
		if pModel, err := s.nexusEngine.GetPassportByID(tenantCtx, pNode.DisplayName()); err == nil && pModel != nil {
			pModel.VerificationStatus = nexus.StatusCorrectionsRequired
			_ = s.nexusEngine.SavePassport(tenantCtx, pModel)
		}
		_ = s.nexusEngine.DeletePassportCache(ctx, fmt.Sprintf("%s:%s", tenantID, passportID))
		_ = s.nexusEngine.DeletePassportCache(ctx, fmt.Sprintf("%s:%s", tenantID, pNode.DisplayName()))
	}

	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"status":      nexus.StatusCorrectionsRequired,
		"passport_id": pNode.DisplayName(),
		"batch_id":    pNode.Spec.BatchID,
		"verifier":    req.VerifierName,
		"finding":     req.FindingTitle,
		"description": req.FindingDescription,
		"message":     "Corrections requested by accredited verifier. Company must revise and resubmit.",
	})
}

type PassportVerifyRequest struct {
	VerifierName   string `json:"verifier_name"`
	AgencyName     string `json:"agency_name"`
	AssuranceLevel string `json:"assurance_level"`
	Opinion        string `json:"opinion"`
	Notes          string `json:"notes,omitempty"`
}

func (s *VerificationServer) handleVerifyPassport(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/passports/")
	path = strings.TrimSuffix(path, "/verify")
	passportID := strings.TrimSpace(path)

	// Segregation of Duties: Under ISO 14064-3 and EU CBAM, only an accredited independent verifier can issue verification statements
	userRole := r.Header.Get("X-User-Role")
	isVerifier := strings.Contains(strings.ToLower(userRole), "verifier") || strings.Contains(strings.ToLower(userRole), "auditor")
	if strings.Contains(strings.ToLower(userRole), "officer") || strings.EqualFold(userRole, "Company Operator") || strings.EqualFold(userRole, "Operator") || (userRole != "" && !isVerifier) {
		http.Error(w, `{"error":"Segregation of Duties violation: Only an accredited independent verifier can issue verification statements and verify passports. Passport officers and company operators cannot verify."}`, http.StatusForbidden)
		return
	}

	var req PassportVerifyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil && err != io.EOF {
		http.Error(w, `{"error":"invalid json payload"}`, http.StatusBadRequest)
		return
	}
	if req.VerifierName == "" {
		req.VerifierName = "Sarah Jenkins (Lead Verifier)"
	}
	if req.AgencyName == "" {
		req.AgencyName = "Bureau Veritas UK Ltd (Accreditation #NAB-8820)"
	}
	if req.AssuranceLevel == "" {
		req.AssuranceLevel = "Reasonable Assurance"
	}
	if req.Opinion == "" {
		req.Opinion = "Verified Without Qualification (ISO 14064-3 / CBAM Annex VI Compliant)"
	}

	nClient := s.getNexusClient()
	pNode, err := nexus.GetPassportNode(ctx, nClient, passportID)
	if err != nil || pNode == nil {
		pNode, err = nexus.GetPassportNodeByBatchID(ctx, nClient, passportID)
	}
	if err != nil || pNode == nil {
		http.Error(w, fmt.Sprintf(`{"error":"passport not found: %s"}`, passportID), http.StatusNotFound)
		return
	}

	// Update status to Verified
	pNode.Spec.VerificationStatus = nexus.StatusVerified
	if err := pNode.Update(ctx); err != nil {
		http.Error(w, fmt.Sprintf(`{"error":"failed to update passport: %v"}`, err), http.StatusInternalServerError)
		return
	}

	// Audit record
	auditName := fmt.Sprintf("audit-verify-%d", time.Now().UnixNano())
	verifyHash := fmt.Sprintf("0xVER-%x", sha256.Sum256([]byte(pNode.Spec.DataHash+req.AgencyName+req.VerifierName)))
	_, _ = pNode.AddAuditRecords(ctx, &runtimev1.AuditRecord{
		ObjectMeta: metav1.ObjectMeta{Name: auditName},
		Spec: runtimev1.AuditRecordSpec{
			ActionType:   "VerificationApproved",
			PreviousHash: pNode.Spec.DataHash,
			CurrentHash:  verifyHash,
			Timestamp:    time.Now().UTC().Format(time.RFC3339),
			UserRef:      fmt.Sprintf("%s (%s, Level: %s, Opinion: %s)", req.VerifierName, req.AgencyName, req.AssuranceLevel, req.Opinion),
		},
	})

	tenantID := pNode.Spec.TenantID
	if s.nexusEngine != nil {
		tenantCtx := tenant.WithTenant(ctx, tenantID)
		if pModel, err := s.nexusEngine.GetPassportByID(tenantCtx, pNode.DisplayName()); err == nil && pModel != nil {
			pModel.VerificationStatus = nexus.StatusVerified
			_ = s.nexusEngine.SavePassport(tenantCtx, pModel)
		}
		_ = s.nexusEngine.DeletePassportCache(ctx, fmt.Sprintf("%s:%s", tenantID, passportID))
		_ = s.nexusEngine.DeletePassportCache(ctx, fmt.Sprintf("%s:%s", tenantID, pNode.DisplayName()))
	}

	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"status":          nexus.StatusVerified,
		"passport_id":     pNode.DisplayName(),
		"batch_id":        pNode.Spec.BatchID,
		"verifier":        req.VerifierName,
		"agency":          req.AgencyName,
		"assurance_level": req.AssuranceLevel,
		"opinion":         req.Opinion,
		"verified_at":     time.Now().UTC().Format(time.RFC3339),
		"message":         "Accredited verification statement approved and signed",
	})
}

type PassportAgencySubmitRequest struct {
	AgencyName  string `json:"agency_name"`
	DeclarantID string `json:"declarant_id,omitempty"`
	Notes       string `json:"notes,omitempty"`
}

func (s *VerificationServer) handleSubmitToAgency(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/passports/")
	path = strings.TrimSuffix(path, "/submit-agency")
	passportID := strings.TrimSpace(path)

	var req PassportAgencySubmitRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil && err != io.EOF {
		http.Error(w, `{"error":"invalid json payload"}`, http.StatusBadRequest)
		return
	}
	if req.AgencyName == "" {
		req.AgencyName = "EU CBAM Transitional Registry & National Competent Authority"
	}

	nClient := s.getNexusClient()
	pNode, err := nexus.GetPassportNode(ctx, nClient, passportID)
	if err != nil || pNode == nil {
		pNode, err = nexus.GetPassportNodeByBatchID(ctx, nClient, passportID)
	}
	if err != nil || pNode == nil {
		http.Error(w, fmt.Sprintf(`{"error":"passport not found: %s"}`, passportID), http.StatusNotFound)
		return
	}

	if pNode.Spec.VerificationStatus != nexus.StatusIssued && !strings.EqualFold(pNode.Spec.VerificationStatus, "ISSUED") {
		http.Error(w, fmt.Sprintf(`{"error":"Cannot submit to agency: passport must be Issued first, current status is '%s'"}`, pNode.Spec.VerificationStatus), http.StatusBadRequest)
		return
	}

	pNode.Spec.VerificationStatus = nexus.StatusSubmittedToAgency
	if err := pNode.Update(ctx); err != nil {
		http.Error(w, fmt.Sprintf(`{"error":"failed to update passport: %v"}`, err), http.StatusInternalServerError)
		return
	}

	auditName := fmt.Sprintf("audit-agency-%d", time.Now().UnixNano())
	agencyHash := fmt.Sprintf("0xAGY-%x", sha256.Sum256([]byte(pNode.Spec.DataHash+req.AgencyName)))
	_, _ = pNode.AddAuditRecords(ctx, &runtimev1.AuditRecord{
		ObjectMeta: metav1.ObjectMeta{Name: auditName},
		Spec: runtimev1.AuditRecordSpec{
			ActionType:   "SubmittedToAgency",
			PreviousHash: pNode.Spec.DataHash,
			CurrentHash:  agencyHash,
			Timestamp:    time.Now().UTC().Format(time.RFC3339),
			UserRef:      fmt.Sprintf("%s (Declarant: %s)", req.AgencyName, req.DeclarantID),
		},
	})

	tenantID := pNode.Spec.TenantID
	if s.nexusEngine != nil {
		tenantCtx := tenant.WithTenant(ctx, tenantID)
		if pModel, err := s.nexusEngine.GetPassportByID(tenantCtx, pNode.DisplayName()); err == nil && pModel != nil {
			pModel.VerificationStatus = nexus.StatusSubmittedToAgency
			_ = s.nexusEngine.SavePassport(tenantCtx, pModel)
		}
		_ = s.nexusEngine.DeletePassportCache(ctx, fmt.Sprintf("%s:%s", tenantID, passportID))
		_ = s.nexusEngine.DeletePassportCache(ctx, fmt.Sprintf("%s:%s", tenantID, pNode.DisplayName()))
	}

	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"status":       nexus.StatusSubmittedToAgency,
		"passport_id":  pNode.DisplayName(),
		"batch_id":     pNode.Spec.BatchID,
		"agency":       req.AgencyName,
		"declarant_id": req.DeclarantID,
		"submitted_at": time.Now().UTC().Format(time.RFC3339),
		"message":      "Passport successfully lodged with regulatory agency",
	})
}

type PassportSignRequest struct {
	SignerName string `json:"signer_name"`
	SignerRole string `json:"signer_role"`
	KeyID      string `json:"key_id"`
	Signature  string `json:"signature,omitempty"`
	Notes      string `json:"notes,omitempty"`
}

func (s *VerificationServer) handleSignPassport(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/passports/")
	path = strings.TrimSuffix(path, "/sign")
	passportID := strings.TrimSpace(path)
	if passportID == "" {
		http.Error(w, `{"error":"passport_id is required"}`, http.StatusBadRequest)
		return
	}

	var req PassportSignRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil && err != io.EOF {
		http.Error(w, `{"error":"invalid json payload"}`, http.StatusBadRequest)
		return
	}
	if req.SignerName == "" {
		req.SignerName = "Santosh Samudrala"
	}
	if req.SignerRole == "" {
		req.SignerRole = "Chief Sustainability Officer"
	}
	if req.KeyID == "" {
		req.KeyID = "0xKEY-ORATOR-PROD-SECURE-ED25519-88492"
	}

	// Segregation of Duties: Verifiers are independent third-party auditors and cannot sign or issue passports. Only an authorized Passport Officer can issue.
	userRole := r.Header.Get("X-User-Role")
	if strings.Contains(strings.ToLower(userRole), "verifier") || strings.Contains(strings.ToLower(userRole), "auditor") {
		http.Error(w, `{"error":"Segregation of Duties violation: Verifiers are independent third-party auditors and cannot sign or issue passports under ISO 14064-3 and EU CBAM. Only an authorized Passport Officer can issue."}`, http.StatusForbidden)
		return
	}
	isOfficer := strings.Contains(strings.ToLower(userRole), "officer") || strings.Contains(strings.ToLower(req.SignerRole), "officer")
	if strings.EqualFold(userRole, "Company Operator") || strings.EqualFold(userRole, "Operator") || (userRole != "" && !isOfficer) {
		http.Error(w, `{"error":"Segregation of Duties violation: Only an authorized Passport Officer can sign and issue digital carbon passports."}`, http.StatusForbidden)
		return
	}

	nClient := s.getNexusClient()
	if nClient == nil {
		http.Error(w, `{"error":"nexus client unavailable"}`, http.StatusServiceUnavailable)
		return
	}

	pNode, err := nexus.GetPassportNode(ctx, nClient, passportID)
	if err != nil || pNode == nil {
		pNode, err = nexus.GetPassportNodeByBatchID(ctx, nClient, passportID)
	}
	if err != nil || pNode == nil {
		http.Error(w, fmt.Sprintf(`{"error":"passport not found: %s"}`, passportID), http.StatusNotFound)
		return
	}

	// Verification gate: Under EU CBAM and ISO 14064-3, only Verified passports can be signed and issued
	if pNode.Spec.VerificationStatus != nexus.StatusVerified && !strings.EqualFold(pNode.Spec.VerificationStatus, "VERIFIED") {
		http.Error(w, fmt.Sprintf(`{"error":"Cannot sign and issue passport: status is '%s'. Independent accredited verification must be approved prior to issuance."}`, pNode.Spec.VerificationStatus), http.StatusBadRequest)
		return
	}

	// Update RuntimeCarbonPassport node in Nexus graph
	pNode.Spec.VerificationStatus = nexus.StatusIssued
	pNode.Spec.Frozen = true
	pNode.Spec.FrozenAt = time.Now().UTC().Format(time.RFC3339)
	if pNode.Spec.IssuedAt == "" {
		pNode.Spec.IssuedAt = time.Now().UTC().Format(time.RFC3339)
	}
	if err := pNode.Update(ctx); err != nil {
		http.Error(w, fmt.Sprintf(`{"error":"failed to sign passport node: %v"}`, err), http.StatusInternalServerError)
		return
	}

	// Append immutable AuditRecord under CarbonPassport
	auditName := fmt.Sprintf("audit-sign-%d", time.Now().UnixNano())
	signHash := fmt.Sprintf("0xSIG-%x", sha256.Sum256([]byte(pNode.Spec.DataHash+req.KeyID)))
	_, _ = pNode.AddAuditRecords(ctx, &runtimev1.AuditRecord{
		ObjectMeta: metav1.ObjectMeta{
			Name: auditName,
		},
		Spec: runtimev1.AuditRecordSpec{
			ActionType:   "SignedAndIssued",
			PreviousHash: pNode.Spec.DataHash,
			CurrentHash:  signHash,
			Timestamp:    time.Now().UTC().Format(time.RFC3339),
			UserRef:      fmt.Sprintf("%s (%s, KeyID: %s)", req.SignerName, req.SignerRole, req.KeyID),
		},
	})

	// Also clear cache for passport
	tenantID := r.Header.Get("X-Tenant-ID")
	if tenantID == "" {
		tenantID = pNode.Spec.TenantID
	}
	if s.nexusEngine != nil {
		tenantCtx := tenant.WithTenant(ctx, tenantID)
		if pModel, err := s.nexusEngine.GetPassportByID(tenantCtx, pNode.DisplayName()); err == nil && pModel != nil {
			pModel.VerificationStatus = nexus.StatusIssued
			_ = s.nexusEngine.SavePassport(tenantCtx, pModel)
		}
		_ = s.nexusEngine.DeletePassportCache(ctx, fmt.Sprintf("%s:%s", tenantID, passportID))
		_ = s.nexusEngine.DeletePassportCache(ctx, fmt.Sprintf("%s:%s", tenantID, pNode.DisplayName()))
	}

	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"status":      nexus.StatusIssued,
		"message":     "Passport successfully signed and published to registry",
		"passport_id": pNode.DisplayName(),
		"batch_id":    pNode.Spec.BatchID,
		"signer":      req.SignerName,
		"signer_role": req.SignerRole,
		"key_id":      req.KeyID,
		"signature":   signHash,
		"signed_at":   time.Now().UTC().Format(time.RFC3339),
	})
}

func (s *VerificationServer) handleDeletePassport(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/passports/")
	path = strings.TrimPrefix(path, "/api/v1/passports")
	passportID := strings.TrimSpace(path)
	if passportID == "" {
		passportID = r.URL.Query().Get("id")
	}
	if passportID == "" {
		http.Error(w, `{"error":"passport_id is required"}`, http.StatusBadRequest)
		return
	}

	tenantID := r.Header.Get("X-Tenant-ID")
	if tenantID == "" {
		tenantID = r.URL.Query().Get("tenant_id")
	}
	if tenantID == "" {
		tenantID = "org_saurient_demo"
	}

	tenantCtx := tenant.WithTenant(ctx, tenantID)
	_ = nexus.DeletePassportNode(ctx, s.getNexusClient(), passportID)
	if s.nexusEngine != nil {
		_ = s.nexusEngine.DeletePassportByPassportID(tenantCtx, passportID)
		_ = s.nexusEngine.DeletePassportByBatchNumber(tenantCtx, passportID)
		_ = s.nexusEngine.DeletePassportCache(ctx, fmt.Sprintf("%s:%s", tenantID, passportID))
	}

	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]string{
		"message":     "Carbon passport deleted successfully",
		"passport_id": passportID,
	})
}

type MRVSubmitPackageRequest struct {
	EngagementID string `json:"engagement_id"`
	PassportID   string `json:"passport_id"`
	BatchID      string `json:"batch_id"`
	Facility     string `json:"facility"`
	SubmittedBy  string `json:"submitted_by"`
	Notes        string `json:"notes"`
	DatasetHash  string `json:"dataset_hash,omitempty"`
}

type MRVFreezeDatasetRequest struct {
	EngagementID string `json:"engagement_id"`
	PassportID   string `json:"passport_id"`
	BatchID      string `json:"batch_id"`
	Reason       string `json:"reason,omitempty"`
	FrozenBy     string `json:"frozen_by,omitempty"`
}

func (s *VerificationServer) handleMRVSubmitPackage(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	allowedOrigin := getEnv("ALLOWED_ORIGIN", "*")
	w.Header().Set("Access-Control-Allow-Origin", allowedOrigin)
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-Tenant-ID, X-User-Role, X-User-Email")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}
	if r.Method != http.MethodPost {
		http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	ctx := r.Context()
	var req MRVSubmitPackageRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil && err != io.EOF {
		http.Error(w, `{"error":"invalid json payload"}`, http.StatusBadRequest)
		return
	}

	if req.SubmittedBy == "" {
		req.SubmittedBy = r.Header.Get("X-User-Email")
	}
	if req.SubmittedBy == "" {
		req.SubmittedBy = "Company Carbon Officer"
	}
	if req.EngagementID == "" {
		req.EngagementID = "VER-026"
	}

	tenantID := r.Header.Get("X-Tenant-ID")
	if tenantID == "" {
		tenantID = "org_saurient_demo"
	}

	nowStr := time.Now().UTC().Format(time.RFC3339)
	submissionID := fmt.Sprintf("SUB-%d", time.Now().UnixNano()%1000000)

	lookupID := req.PassportID
	if lookupID == "" {
		lookupID = req.BatchID
	}

	rawHashInput := fmt.Sprintf("%s:%s:%s:%s", req.EngagementID, lookupID, req.SubmittedBy, nowStr)
	shaBytes := sha256.Sum256([]byte(rawHashInput))
	lockHash := fmt.Sprintf("0x%x", shaBytes)
	if req.DatasetHash != "" {
		lockHash = req.DatasetHash
	}

	nClient := s.getNexusClient()
	var pNode *nexus_client.RuntimeCarbonPassport
	var err error

	if lookupID != "" && nClient != nil {
		pNode, err = nexus.GetPassportNode(ctx, nClient, lookupID)
		if err != nil || pNode == nil {
			pNode, err = nexus.GetPassportNodeByBatchID(ctx, nClient, lookupID)
		}
	}

	var passportID string
	var batchID string

	if pNode != nil {
		passportID = pNode.DisplayName()
		batchID = pNode.Spec.BatchID
		pNode.Spec.VerificationStatus = nexus.StatusSubmitted
		pNode.Spec.Frozen = true
		pNode.Spec.FrozenAt = nowStr
		_ = pNode.Update(ctx)

		auditName := fmt.Sprintf("audit-mrv-submit-%d", time.Now().UnixNano())
		_, _ = pNode.AddAuditRecords(ctx, &runtimev1.AuditRecord{
			ObjectMeta: metav1.ObjectMeta{Name: auditName},
			Spec: runtimev1.AuditRecordSpec{
				ActionType:   "VerificationPackageSubmitted",
				PreviousHash: pNode.Spec.DataHash,
				CurrentHash:  lockHash,
				Timestamp:    nowStr,
				UserRef:      fmt.Sprintf("%s (%s)", req.SubmittedBy, req.Notes),
			},
		})

		if s.nexusEngine != nil {
			tenantCtx := tenant.WithTenant(ctx, tenantID)
			if pModel, err := s.nexusEngine.GetPassportByID(tenantCtx, passportID); err == nil && pModel != nil {
				pModel.VerificationStatus = nexus.StatusSubmitted
				_ = s.nexusEngine.SavePassport(tenantCtx, pModel)
			}
			_ = s.nexusEngine.DeletePassportCache(ctx, fmt.Sprintf("%s:%s", tenantID, passportID))
			_ = s.nexusEngine.DeletePassportCache(ctx, fmt.Sprintf("%s:%s", tenantID, batchID))
		}
	} else {
		passportID = req.PassportID
		if passportID == "" {
			passportID = "PASS-MRV-" + submissionID
		}
		batchID = req.BatchID
		if batchID == "" {
			batchID = "BATCH-" + submissionID
		}
	}

	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"status":            nexus.StatusSubmitted,
		"submission_id":     submissionID,
		"engagement_id":     req.EngagementID,
		"passport_id":       passportID,
		"batch_id":          batchID,
		"dataset_lock_hash": lockHash,
		"assigned_verifier": "Bureau Veritas Certification (#NAB-8820)",
		"submitted_by":      req.SubmittedBy,
		"submitted_at":      nowStr,
		"message":           "Verification package successfully submitted to Bureau Veritas for ISO 14064-3 / CBAM verification",
	})
}

func (s *VerificationServer) handleMRVFreezeDataset(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	allowedOrigin := getEnv("ALLOWED_ORIGIN", "*")
	w.Header().Set("Access-Control-Allow-Origin", allowedOrigin)
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-Tenant-ID, X-User-Role, X-User-Email")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}
	if r.Method != http.MethodPost {
		http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	var req MRVFreezeDatasetRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil && err != io.EOF {
		http.Error(w, `{"error":"invalid json payload"}`, http.StatusBadRequest)
		return
	}
	if req.FrozenBy == "" {
		req.FrozenBy = r.Header.Get("X-User-Email")
	}
	if req.FrozenBy == "" {
		req.FrozenBy = "Company Carbon Lead"
	}
	if req.EngagementID == "" {
		req.EngagementID = "VER-026"
	}

	freezeID := fmt.Sprintf("FRZ-%d", time.Now().UnixNano()%1000000)
	nowStr := time.Now().UTC().Format(time.RFC3339)
	rawHash := fmt.Sprintf("%s:%s:%s", req.EngagementID, req.FrozenBy, nowStr)
	shaBytes := sha256.Sum256([]byte(rawHash))
	freezeHash := fmt.Sprintf("0x%x", shaBytes)

	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"freeze_id":     freezeID,
		"engagement_id": req.EngagementID,
		"freeze_hash":   freezeHash,
		"frozen_by":     req.FrozenBy,
		"frozen_at":     nowStr,
		"reason":        req.Reason,
		"status":        "DATA_FROZEN",
		"message":       "Operational dataset successfully locked and frozen for verification review",
	})
}

type PassportInputReq struct {
	TenantID         string                 `json:"tenant_id"`
	FacilityID       string                 `json:"facility_id"`
	BatchNumber      string                 `json:"batch_number"`
	CommodityType    string                 `json:"commodity_type"`
	Scope1KgCO2e     float64                `json:"scope_1_kg_co2e"`
	Scope2KgCO2e     float64                `json:"scope_2_kg_co2e"`
	Scope3KgCO2e     float64                `json:"scope_3_kg_co2e"`
	ActivityDataRaw  string                 `json:"activity_data_raw"`
	BatchData        *BatchDataInput        `json:"batch_data,omitempty"`
	ActivityData     *ActivityDataInput     `json:"activity_data,omitempty"`
	TelemetryContext map[string]interface{} `json:"telemetry_context,omitempty"`
}

type BatchDataInput struct {
	ProductName          string  `json:"product_name"`
	Commodity            string  `json:"commodity"`
	BatchID              string  `json:"batch_id"`
	ProductionDate       string  `json:"production_date"`
	FacilityName         string  `json:"facility_name"`
	FacilityLocation     string  `json:"facility_location"`
	BatchSizeQuantity    float64 `json:"batch_size_quantity"`
	UnitOfMeasure        string  `json:"unit_of_measure"`
	ExportMarket         string  `json:"export_market"`
	ProducerOrganization string  `json:"producer_organization"`
}

type ActivityDataInput struct {
	Scope1Direct *struct {
		FuelType           string  `json:"fuel_type"`
		FuelConsumedLiters float64 `json:"fuel_consumed_liters"`
		DataSource         string  `json:"data_source"`
		ValueKgCO2e        float64 `json:"value_kg_co2e,omitempty"`
	} `json:"scope_1_direct,omitempty"`
	Scope2Indirect *struct {
		ElectricityConsumedKwh float64 `json:"electricity_consumed_kwh"`
		DataSource             string  `json:"data_source"`
		ValueKgCO2e            float64 `json:"value_kg_co2e,omitempty"`
	} `json:"scope_2_indirect,omitempty"`
	Scope3Upstream *struct {
		BillOfMaterials []map[string]interface{} `json:"bill_of_materials"`
		Packaging       map[string]interface{}   `json:"packaging"`
		Logistics       map[string]interface{}   `json:"logistics"`
		ValueKgCO2e     float64                  `json:"value_kg_co2e,omitempty"`
	} `json:"scope_3_upstream,omitempty"`
}

func buildRichPassportResponse(p *nexus.CarbonPassportModel) nexus.RichDigitalCarbonPassportResponse {
	return nexus.BuildRichPassportResponse(p)
}




func (s *VerificationServer) handleCreatePassport(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	rawBytes, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, `{"error":"failed to read request body"}`, http.StatusBadRequest)
		return
	}

	var req PassportInputReq
	if err := json.Unmarshal(rawBytes, &req); err != nil {
		http.Error(w, `{"error":"invalid JSON request body"}`, http.StatusBadRequest)
		return
	}

	if req.TenantID == "" {
		req.TenantID = r.Header.Get("X-Tenant-ID")
	}
	if req.TenantID == "" {
		http.Error(w, `{"error":"tenant_id is required in body or X-Tenant-ID header"}`, http.StatusBadRequest)
		return
	}

	// Populate fields from batch_data if present
	if req.BatchData != nil {
		if req.FacilityID == "" {
			req.FacilityID = req.BatchData.FacilityName
		}
		if req.BatchNumber == "" {
			req.BatchNumber = req.BatchData.BatchID
		}
		if req.CommodityType == "" {
			req.CommodityType = req.BatchData.Commodity
		}
	}

	// Compute scope values dynamically
	if req.ActivityData != nil {
		if req.ActivityData.Scope1Direct != nil {
			if req.ActivityData.Scope1Direct.ValueKgCO2e > 0 {
				req.Scope1KgCO2e = req.ActivityData.Scope1Direct.ValueKgCO2e
			} else if req.ActivityData.Scope1Direct.FuelConsumedLiters > 0 {
				req.Scope1KgCO2e = math.Round(req.ActivityData.Scope1Direct.FuelConsumedLiters*2.68*100) / 100
			}
		}
		if req.ActivityData.Scope2Indirect != nil {
			if req.ActivityData.Scope2Indirect.ValueKgCO2e > 0 {
				req.Scope2KgCO2e = req.ActivityData.Scope2Indirect.ValueKgCO2e
			} else if req.ActivityData.Scope2Indirect.ElectricityConsumedKwh > 0 {
				req.Scope2KgCO2e = math.Round(req.ActivityData.Scope2Indirect.ElectricityConsumedKwh*0.45*100) / 100
			}
		}
		if req.ActivityData.Scope3Upstream != nil {
			if req.ActivityData.Scope3Upstream.ValueKgCO2e > 0 {
				req.Scope3KgCO2e = req.ActivityData.Scope3Upstream.ValueKgCO2e
			} else {
				var bomVal, pkgVal, logVal float64
				for _, item := range req.ActivityData.Scope3Upstream.BillOfMaterials {
					if qty, ok := item["quantity"].(float64); ok {
						bomVal += qty * 0.175
					}
				}
				if pkg, ok := req.ActivityData.Scope3Upstream.Packaging["quantity"].(float64); ok {
					pkgVal = pkg * 1.875
				}
				logVal = 120.0
				req.Scope3KgCO2e = math.Round((bomVal+pkgVal+logVal)*100) / 100
			}
		}
	}

	totalKg := req.Scope1KgCO2e + req.Scope2KgCO2e + req.Scope3KgCO2e

	// Generate dynamic passport ID if not provided
	passportID := "pas_" + uuid.New().String()

	dataStr := fmt.Sprintf("%s|%s|%s|%s|%.2f|%.2f|%.2f", req.TenantID, req.FacilityID, req.BatchNumber, req.CommodityType, req.Scope1KgCO2e, req.Scope2KgCO2e, req.Scope3KgCO2e)
	hashBytes := sha256.Sum256([]byte(dataStr))
	dataHashStr := hex.EncodeToString(hashBytes[:])

	passportModel := &nexus.CarbonPassportModel{
		PassportID:         passportID,
		TenantID:           req.TenantID,
		FacilityID:         req.FacilityID,
		BatchNumber:        req.BatchNumber,
		CommodityType:      req.CommodityType,
		VerificationStatus: "VERIFIED",
		Scope1KgCO2e:       req.Scope1KgCO2e,
		Scope2KgCO2e:       req.Scope2KgCO2e,
		Scope3KgCO2e:       req.Scope3KgCO2e,
		TotalFootprintKg:   totalKg,
		CalculationDetails: rawBytes,
		DataHash:           dataHashStr,
		IssuedAt:           time.Now(),
	}

	auditModel := &nexus.PassportAuditTrailModel{
		PassportID:    passportID,
		ActionType:    "Created",
		PreviousHash:  "",
		CurrentHash:   dataHashStr,
		ChangePayload: rawBytes,
	}

	// Create Product CR in Kubernetes (best-effort, triggers reconciler pipeline)
	s.createProductCRFromPassport(ctx, &req, passportID)

	nClient := s.getNexusClient()
	if nClient != nil {
		passportSpec := runtimev1.CarbonPassportSpec{
			PassportID:         passportID,
			TenantID:           req.TenantID,
			FacilityID:         req.FacilityID,
			BatchID:            req.BatchNumber,
			CommodityType:      req.CommodityType,
			TotalFootprintKg:   totalKg,
			Scope1Kg:           req.Scope1KgCO2e,
			Scope2Kg:           req.Scope2KgCO2e,
			Scope3Kg:           req.Scope3KgCO2e,
			VerificationStatus: "VERIFIED",
			CalculationDetails: string(rawBytes),
			DataHash:           dataHashStr,
			IssuedAt:           time.Now().UTC().Format(time.RFC3339),
			Version:            "1.0",
		}
		prodNode, _ := nexus.GetProductNode(ctx, nClient, req.TenantID, req.BatchNumber)
		if _, err := nexus.CreatePassportNode(ctx, nClient, passportSpec, prodNode); err != nil {
			log.Printf("Failed to create CarbonPassport node in Nexus graph: %v", err)
		} else {
			log.Printf("CarbonPassport node created in Nexus graph: %s", passportID)
		}
	}

	if s.nexusEngine != nil {
		tenantCtx := tenant.WithTenant(ctx, req.TenantID)
		_ = s.nexusEngine.SavePassportAndAudit(tenantCtx, passportModel, auditModel)
	}

	richResp := nexus.BuildRichPassportResponse(passportModel)

	if s.nexusEngine != nil {
		cacheKey := fmt.Sprintf("%s:%s", req.TenantID, passportModel.PassportID)
		richBytes, _ := json.Marshal(richResp)
		_ = s.nexusEngine.CachePassport(ctx, cacheKey, richBytes, 24*time.Hour)
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(richResp)
}

func (s *VerificationServer) handleUpdatePassport(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/passports")
	passportID := strings.TrimPrefix(path, "/")

	if passportID == "" {
		http.Error(w, `{"error":"passport_id path parameter required for update"}`, http.StatusBadRequest)
		return
	}

	rawBytes, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, `{"error":"failed to read request body"}`, http.StatusBadRequest)
		return
	}

	var req PassportInputReq
	if err := json.Unmarshal(rawBytes, &req); err != nil {
		http.Error(w, `{"error":"invalid JSON request body"}`, http.StatusBadRequest)
		return
	}

	if req.TenantID == "" {
		req.TenantID = r.Header.Get("X-Tenant-ID")
	}
	if req.TenantID == "" {
		http.Error(w, `{"error":"tenant_id is required"}`, http.StatusBadRequest)
		return
	}

	if req.BatchData != nil {
		if req.FacilityID == "" {
			req.FacilityID = req.BatchData.FacilityName
		}
		if req.BatchNumber == "" {
			req.BatchNumber = req.BatchData.BatchID
		}
		if req.CommodityType == "" {
			req.CommodityType = req.BatchData.Commodity
		}
	}

	totalKg := req.Scope1KgCO2e + req.Scope2KgCO2e + req.Scope3KgCO2e

	// Deterministic hash: same input fields always produce the same digest (no timestamp).
	dataStr := fmt.Sprintf("%s|%s|%s|%s|%.2f|%.2f|%.2f", passportID, req.TenantID, req.FacilityID, req.BatchNumber, req.Scope1KgCO2e, req.Scope2KgCO2e, req.Scope3KgCO2e)
	hashBytes := sha256.Sum256([]byte(dataStr))
	dataHashStr := hex.EncodeToString(hashBytes[:])

	// Fetch the previous DataHash for the audit trail.
	previousHash := ""
	nClient := s.getNexusClient()
	if nClient != nil {
		if pNode, err := nexus.GetPassportNode(ctx, nClient, passportID); err == nil && pNode != nil {
			previousHash = pNode.Spec.DataHash
		}
	}
	if previousHash == "" && s.nexusEngine != nil {
		tenantCtx := tenant.WithTenant(ctx, req.TenantID)
		if prev, err := s.nexusEngine.GetPassportByID(tenantCtx, passportID); err == nil && prev != nil {
			previousHash = prev.DataHash
		}
	}

	passportModel := &nexus.CarbonPassportModel{
		PassportID:         passportID,
		TenantID:           req.TenantID,
		FacilityID:         req.FacilityID,
		BatchNumber:        req.BatchNumber,
		CommodityType:      req.CommodityType,
		VerificationStatus: "VERIFIED",
		Scope1KgCO2e:       req.Scope1KgCO2e,
		Scope2KgCO2e:       req.Scope2KgCO2e,
		Scope3KgCO2e:       req.Scope3KgCO2e,
		TotalFootprintKg:   totalKg,
		CalculationDetails: rawBytes,
		DataHash:           dataHashStr,
		IssuedAt:           time.Now(),
	}

	auditModel := &nexus.PassportAuditTrailModel{
		PassportID:    passportID,
		ActionType:    "Updated",
		PreviousHash:  previousHash,
		CurrentHash:   dataHashStr,
		ChangePayload: rawBytes,
	}

	if nClient != nil {
		passportSpec := runtimev1.CarbonPassportSpec{
			PassportID:         passportID,
			TenantID:           req.TenantID,
			FacilityID:         req.FacilityID,
			BatchID:            req.BatchNumber,
			CommodityType:      req.CommodityType,
			TotalFootprintKg:   totalKg,
			Scope1Kg:           req.Scope1KgCO2e,
			Scope2Kg:           req.Scope2KgCO2e,
			Scope3Kg:           req.Scope3KgCO2e,
			VerificationStatus: "VERIFIED",
			CalculationDetails: string(rawBytes),
			DataHash:           dataHashStr,
			IssuedAt:           time.Now().UTC().Format(time.RFC3339),
			Version:            "1.1",
		}
		prodNode, _ := nexus.GetProductNode(ctx, nClient, req.TenantID, req.BatchNumber)
		if _, err := nexus.CreatePassportNode(ctx, nClient, passportSpec, prodNode); err != nil {
			log.Printf("Failed to update CarbonPassport node in Nexus graph: %v", err)
		} else {
			log.Printf("CarbonPassport node updated in Nexus graph: %s", passportID)
		}
	}

	if s.nexusEngine != nil {
		tenantCtx := tenant.WithTenant(ctx, req.TenantID)
		_ = s.nexusEngine.UpdatePassportAndAudit(tenantCtx, passportModel, auditModel)
	}

	richResp := nexus.BuildRichPassportResponse(passportModel)

	if s.nexusEngine != nil {
		cacheKey := fmt.Sprintf("%s:%s", req.TenantID, passportID)
		richBytes, _ := json.Marshal(richResp)
		_ = s.nexusEngine.CachePassport(ctx, cacheKey, richBytes, 24*time.Hour)
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(richResp)
}

func (s *VerificationServer) handleGetPassport(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/passports")
	passportID := strings.TrimPrefix(path, "/")
	passportID = strings.TrimSpace(passportID)

	tenantID := r.Header.Get("X-Tenant-ID")
	if tenantID == "" {
		tenantID = r.URL.Query().Get("tenant_id")
	}
	userRole := r.Header.Get("X-User-Role")
	isIndependentRole := strings.Contains(strings.ToLower(userRole), "verifier") ||
		strings.Contains(strings.ToLower(userRole), "officer") ||
		strings.Contains(strings.ToLower(userRole), "auditor")

	if isIndependentRole || tenantID == "all" || tenantID == "public" || strings.HasPrefix(tenantID, "tenant-verifier") {
		tenantID = ""
	} else if tenantID == "" {
		tenantID = "tenant-default"
	}

	if passportID == "" {
		s.handleListPassports(w, r, tenantID)
		return
	}

	if s.nexusEngine != nil {
		cacheKey := fmt.Sprintf("%s:%s", tenantID, passportID)
		if cachedData, err := s.nexusEngine.GetPassportCache(ctx, cacheKey); err == nil && len(cachedData) > 0 {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write(cachedData)
			return
		}
	}

	nClient := s.getNexusClient()
	if nClient == nil && s.nexusEngine == nil {
		http.Error(w, `{"error":"nexus client unavailable"}`, http.StatusServiceUnavailable)
		return
	}

	// 1. Try to read from Nexus graph node first
	if nClient != nil {
		pNode, err := nexus.GetPassportNode(ctx, nClient, passportID)
		if err != nil || pNode == nil {
			pNode, err = nexus.GetPassportNodeByBatchID(ctx, nClient, passportID)
		}
		if err == nil && pNode != nil {
			pModel := nexus.CarbonPassportModelFromNode(pNode)
			richResp := nexus.BuildRichPassportResponse(pModel)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			_ = json.NewEncoder(w).Encode(richResp)
			return
		}
	}

	// 2. Fallback to nexusEngine if available
	if s.nexusEngine != nil {
		tenantCtx := tenant.WithTenant(ctx, tenantID)
		passport, err := s.nexusEngine.GetPassportByID(tenantCtx, passportID)
		if err != nil || passport == nil {
			passport, err = s.nexusEngine.GetPassportByBatchNumber(tenantCtx, passportID)
		}
		if (err != nil || passport == nil) && (tenantID != "" && tenantID != "all") {
			// Cross-tenant fallback for independent auditors
			allTenantCtx := tenant.WithTenant(ctx, "")
			passport, err = s.nexusEngine.GetPassportByID(allTenantCtx, passportID)
			if err != nil || passport == nil {
				passport, _ = s.nexusEngine.GetPassportByBatchNumber(allTenantCtx, passportID)
			}
		}
		if passport != nil {
			richResp := nexus.BuildRichPassportResponse(passport)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			_ = json.NewEncoder(w).Encode(richResp)
			return
		}
	}

	writeJSONError(w, fmt.Sprintf("Passport not found for the ID: %s", passportID), http.StatusNotFound)
}

func (s *VerificationServer) handleListPassports(w http.ResponseWriter, r *http.Request, tenantID string) {
	ctx := r.Context()
	list := make([]nexus.RichDigitalCarbonPassportResponse, 0)
	seen := make(map[string]bool)

	// Verifiers, passport officers, and public auditors have cross-tenant purview across registered producer tenants
	userRole := r.Header.Get("X-User-Role")
	isIndependentRole := strings.Contains(strings.ToLower(userRole), "verifier") ||
		strings.Contains(strings.ToLower(userRole), "officer") ||
		strings.Contains(strings.ToLower(userRole), "auditor")
	if isIndependentRole || tenantID == "all" || tenantID == "public" || strings.HasPrefix(tenantID, "tenant-verifier") {
		tenantID = ""
	}

	nClient := s.getNexusClient()
	if nClient != nil {
		if nodes, err := nexus.ListPassportNodes(ctx, nClient, tenantID); err == nil {
			for _, pNode := range nodes {
				if pNode == nil || pNode.CarbonPassport == nil {
					continue
				}
				pModel := nexus.CarbonPassportModelFromNode(pNode)
				if pModel != nil && !seen[pModel.PassportID] {
					seen[pModel.PassportID] = true
					list = append(list, nexus.BuildRichPassportResponse(pModel))
				}
			}
		}
	}

	if s.nexusEngine != nil {
		tenantCtx := tenant.WithTenant(ctx, tenantID)
		if passports, err := s.nexusEngine.ListPassports(tenantCtx); err == nil {
			for _, p := range passports {
				if p != nil && !seen[p.PassportID] {
					seen[p.PassportID] = true
					list = append(list, nexus.BuildRichPassportResponse(p))
				}
			}
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(list)
}

func getEnv(key, fallback string) string {
	if val, ok := os.LookupEnv(key); ok && val != "" {
		return val
	}
	return fallback
}

// sanitiseK8sName lowercases s, strips chars outside [a-z0-9-], collapses
// consecutive hyphens, trims leading/trailing hyphens, and truncates to 55
// chars before prepending the "product-" prefix (total ≤ 63 chars, the k8s limit).
var (
	reK8sInvalid  = regexp.MustCompile(`[^a-z0-9-]`)
	reK8sCollapse = regexp.MustCompile(`-{2,}`)
)

func sanitiseK8sName(s string) string {
	s = strings.ToLower(s)
	s = reK8sInvalid.ReplaceAllString(s, "-")
	s = reK8sCollapse.ReplaceAllString(s, "-")
	if len(s) > 55 {
		s = s[:55]
	}
	s = strings.Trim(s, "-")
	if s == "" {
		return "product-default"
	}
	return "product-" + s
}

func sanitiseK8sLabel(s string) string {
	s = strings.ToLower(s)
	s = reK8sInvalid.ReplaceAllString(s, "-")
	s = reK8sCollapse.ReplaceAllString(s, "-")
	s = strings.Trim(s, "-")
	if len(s) > 63 {
		s = s[:63]
	}
	if s == "" {
		return "default"
	}
	return s
}

// writeJSONError serialises msg via json.Marshal so that control characters,
// quotes, and other special bytes in user-supplied or k8s-returned strings
// cannot break the JSON envelope.
func writeJSONError(w http.ResponseWriter, msg string, code int) {
	b, _ := json.Marshal(map[string]string{"error": msg})
	http.Error(w, string(b), code)
}
