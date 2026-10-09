import http from 'http';

function postJSON(url, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'X-Tenant-ID': 'org_saurient_demo',
        ...headers,
      },
    };

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(body));
          } catch {
            resolve(body);
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function seedLiveData() {
  console.log('========================================================================');
  console.log('🌱 SEEDING LIVE NON-MOCKED NEXUS GRAPH DATA INTO API GATEWAY (PORT 8080)');
  console.log('========================================================================');

  try {
    // 1. Seed Rulebook
    console.log('1. Registering live calculation rulebook (steel-rulebook-cbam-2026)...');
    const rulebook = await postJSON('http://localhost:8080/api/v1/rules', {
      name: 'steel-rulebook-cbam-2026',
      namespace: 'default',
      commodity_type: 'Steel',
      version: '2026.1',
      accounting_mode: 'cbam',
      functional_unit: 'kg CO2e per kg Hot-Rolled Steel Coil',
      batch_quantity: 10000,
      rules: [
        { id: 'R01', name: 'Scope 1 Fuel Combustion', scope: 'scope1', formula: 'fuel_consumed_liters * 2.68' },
        { id: 'R02', name: 'Scope 2 Grid Electricity', scope: 'scope2', formula: 'electricity_consumed_kwh * 0.71' },
        { id: 'R03', name: 'Scope 3 Upstream HBI Material', scope: 'scope3', formula: 'batch_quantity_kg * 0.65' },
      ],
    });
    console.log('   ✅ Live Rulebook Registered:', rulebook.name || rulebook.id);

    // 2. Seed Product Batch 1 (Hot-Rolled Steel Coil Batch ST-2026-00981)
    console.log('2. Registering live Product Batch ST-2026-00981...');
    const prod1 = await postJSON('http://localhost:8080/api/v1/products', {
      tenant_id: 'org_saurient_demo',
      facility_id: 'FAC-042',
      batch_id: 'ST-2026-00981',
      product_name: 'Hot-Rolled Steel Coil Batch',
      commodity_type: 'Steel',
      rulebook_ref: { name: 'steel-rulebook-cbam-2026', namespace: 'default' },
      batch_data: {
        product_name: 'Hot-Rolled Steel Coil Batch',
        commodity: 'Steel',
        batch_id: 'ST-2026-00981',
        facility_name: 'Bellary Integrated Steel Plant (FAC-042)',
        facility_location: 'Karnataka, India',
        batch_size_quantity: 10000,
        unit_of_measure: 'kg',
        export_market: 'European Union (CBAM Zone)',
      },
      activity_data: {
        scope_1_direct: { fuel_consumed_liters: 2450 },
        scope_2_indirect: { electricity_consumed_kwh: 14200 },
        scope_3_upstream: { bill_of_materials: [{ name: 'Apex Steel HBI Scrap', quantity: 10000 }] },
      },
    });
    console.log('   ✅ Live Product Batch ST-2026-00981 Created! Passport ID:', prod1.passport_id || prod1.name);

    // 3. Seed Product Batch 2 (Low-Carbon Primary Aluminium Ingot AL-2026-00412)
    console.log('3. Registering live Product Batch AL-2026-00412...');
    const prod2 = await postJSON('http://localhost:8080/api/v1/products', {
      tenant_id: 'org_saurient_demo',
      facility_id: 'FAC-088',
      batch_id: 'AL-2026-00412',
      product_name: 'Low-Carbon Primary Aluminium Ingot',
      commodity_type: 'Aluminium',
      rulebook_ref: { name: 'metal-rulebook-2026', namespace: 'default' },
      batch_data: {
        product_name: 'Low-Carbon Primary Aluminium Ingot',
        commodity: 'Aluminium',
        batch_id: 'AL-2026-00412',
        facility_name: 'Nordic Hydro Smelter (FAC-088)',
        facility_location: 'Sunndalsøra, Norway',
        batch_size_quantity: 5000,
        unit_of_measure: 'kg',
        export_market: 'European Union',
      },
      activity_data: {
        scope_1_direct: { fuel_consumed_liters: 1200 },
        scope_2_indirect: { electricity_consumed_kwh: 35000 },
        scope_3_upstream: { bill_of_materials: [{ name: 'Bauxite Ore', quantity: 5000 }] },
      },
    });
    console.log('   ✅ Live Product Batch AL-2026-00412 Created! Passport ID:', prod2.passport_id || prod2.name);

    console.log('========================================================================');
    console.log('🎉 LIVE NON-MOCK NEXUS DATA INITIALIZED SUCCESSFULLY!');
    console.log('========================================================================');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to seed live data:', err.message);
    process.exit(1);
  }
}

seedLiveData();
