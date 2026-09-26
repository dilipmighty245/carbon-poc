export interface RuleDefinition {
  id: string;
  name?: string;
  scope: 'scope1' | 'scope2' | 'scope3' | 'intermediate';
  mode?: 'pcf' | 'ghg' | 'cbam' | 'all';
  outputType?: 'none' | 'total_footprint' | 'intensity';
  formula: string;
  description?: string;
}

export interface RulebookCreateRequest {
  name: string;
  namespace?: string;
  commodity_type: string;
  version?: string;
  accounting_mode?: string;
  functional_unit?: string;
  batch_quantity?: number;
  scope_1_formula?: string;
  scope_2_formula?: string;
  scope_3_formula?: string;
  rules?: RuleDefinition[];
}

export interface ProductCreateRequest {
  tenant_id: string;
  facility_id: string;
  batch_id: string;
  product_name: string;
  commodity_type: string;
  rulebook_ref?: {
    name: string;
    namespace: string;
  };
  batch_data?: {
    product_name: string;
    commodity: string;
    batch_id: string;
    facility_name: string;
    facility_location: string;
    batch_size_quantity: number;
    unit_of_measure: string;
    export_market: string;
  };
  activity_data?: Record<string, any>;
}

export interface ProductCreateResponse {
  name: string;
  namespace: string;
  tenant_id: string;
  facility_id: string;
  batch_id: string;
  product_name: string;
  commodity_type: string;
  status: string;
  created_at: string;
  passport_id?: string;
}

export interface RichDigitalPassport {
  passport_metadata: {
    passport_id: string;
    unique_qr_code: string;
    cryptographic_hash: string;
    issuance_date: string;
    status: string;
  };
  product_summary: {
    commodity: string;
    product_name: string;
    batch_number: string;
    producer_organization: string;
    facility: {
      name: string;
      location: string;
      country_of_origin: string;
    };
    production_date: string;
    batch_size: {
      quantity: number;
      unit: string;
    };
  };
  carbon_footprint: {
    total_batch_footprint_kg_co2e: number;
    intensity_per_unit: {
      value: number;
      unit: string;
    };
    scope_breakdown: {
      scope_1_direct: { value_kg_co2e: number; percentage: number };
      scope_2_indirect_energy: { value_kg_co2e: number; percentage: number };
      scope_3_value_chain: { value_kg_co2e: number; percentage: number };
    };
    source_breakdown: {
      raw_materials: { value_kg_co2e: number; percentage: number };
      electricity: { value_kg_co2e: number; percentage: number };
      logistics_transport: { value_kg_co2e: number; percentage: number };
      on_site_fuel: { value_kg_co2e: number; percentage: number };
      packaging: { value_kg_co2e: number; percentage: number };
    };
  };
  methodology_and_audit: {
    calculation_rulebook: string;
    accounting_standard: string;
    verification_body: string;
    assurance_level: string;
    verification_id: string;
  };
}
