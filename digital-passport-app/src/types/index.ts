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
    standard_aligned: string;
    system_boundary: string;
    emission_factor_database: string;
    calculation_version: string;
    data_quality_score: {
      primary_data_percent: number;
      secondary_data_percent: number;
      overall_quality: string;
    };
    verification_details: {
      verifier_name: string;
      verification_date: string;
      verifier_comments: string;
      evidence_documents_attached: string[];
    };
  };
  compliance_exports: {
    cbam_ready: boolean;
    target_export_market: string;
    export_formats_available: string[];
  };
}
