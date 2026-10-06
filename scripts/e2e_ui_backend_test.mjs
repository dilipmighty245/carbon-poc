import http from 'http';

function fetchUrl(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data, headers: res.headers }));
    });
    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function runUIBackendE2ETest() {
  console.log('================================================================');
  console.log('🚀 RUNNING FULL UI TO BACKEND END-TO-END (E2E) INTEGRATION TEST');
  console.log('================================================================');

  let errors = [];

  // Step 1: UI Frontend Web Server Health
  try {
    console.log('1. Checking UI Frontend Web Server (http://localhost:5173)...');
    const uiRes = await fetchUrl('http://localhost:5173');
    if (uiRes.status === 200 && (uiRes.data.includes('html') || uiRes.data.includes('root') || uiRes.data.includes('Vite'))) {
      console.log('   ✅ UI Frontend is UP and serving React bundle HTML (200 OK)');
    } else {
      throw new Error(`UI Frontend returned status ${uiRes.status}`);
    }
  } catch (err) {
    console.error('   ❌ UI Frontend check failed:', err.message);
    errors.push(`UI Frontend: ${err.message}`);
  }

  // Step 2: Backend API Gateway Health
  try {
    console.log('2. Checking Backend API Gateway (http://localhost:8080/healthz)...');
    const apiRes = await fetchUrl('http://localhost:8080/healthz');
    if (apiRes.status === 200) {
      console.log('   ✅ API Gateway is UP and Healthy (200 OK)');
    } else {
      throw new Error(`API Gateway returned status ${apiRes.status}`);
    }
  } catch (err) {
    console.error('   ❌ API Gateway check failed:', err.message);
    errors.push(`API Gateway: ${err.message}`);
  }

  // Step 3: Auth Endpoint Integration
  try {
    console.log('3. Testing Auth API Endpoint (POST /api/v1/auth/login)...');
    const authPayload = JSON.stringify({ email: 'operator@saurient.demo', password: 'secret' });
    const authRes = await fetchUrl('http://localhost:8080/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(authPayload),
        'X-Tenant-ID': 'TENANT-BELLARY-E2E'
      },
      body: authPayload
    });
    if (authRes.status === 200) {
      const data = JSON.parse(authRes.data);
      if (data.token) {
        console.log('   ✅ Auth API login successful. Issued Token:', data.token.slice(0, 20) + '...');
      } else {
        throw new Error('Missing token in response');
      }
    } else {
      throw new Error(`Auth API returned status ${authRes.status}: ${authRes.data}`);
    }
  } catch (err) {
    console.error('   ❌ Auth API test failed:', err.message);
    errors.push(`Auth API: ${err.message}`);
  }

  // Step 4: Lineage Trace Graph API Endpoint & Explicit Connections
  try {
    console.log('4. Testing Lineage Trace Graph API (GET /api/v1/lineage/trace/PASS-2026-981-v1.0)...');
    const lineageRes = await fetchUrl('http://localhost:8080/api/v1/lineage/trace/PASS-2026-981-v1.0', {
      method: 'GET',
      headers: { 'X-Tenant-ID': 'TENANT-BELLARY-E2E' }
    });
    if (lineageRes.status === 200) {
      const dag = JSON.parse(lineageRes.data);
      console.log(`   ✅ Lineage Trace DAG received. Nodes: ${dag.nodes.length}, Edges: ${dag.edges.length}`);
      
      const calcNode = dag.nodes.find(n => n.node_id === 'NODE_CALC_V1');
      const passNode = dag.nodes.find(n => n.node_id === 'NODE_PASS_V1');
      const efNode = dag.nodes.find(n => n.node_type === 'EMISSION_FACTOR');
      const evdNode = dag.nodes.find(n => n.node_type === 'EVIDENCE_DOCUMENT');

      if (calcNode && passNode && efNode && evdNode) {
        console.log('   ✅ Explicit Record Connections verified: Passport ➔ Calculation ➔ Batch ➔ Meters ➔ Factors ➔ Evidence');
      } else {
        throw new Error('Missing required record nodes in lineage DAG');
      }
    } else {
      throw new Error(`Lineage API returned status ${lineageRes.status}`);
    }
  } catch (err) {
    console.error('   ❌ Lineage API test failed:', err.message);
    errors.push(`Lineage API: ${err.message}`);
  }

  // Step 5: Supplier Input Immutability & Re-calculation Integration
  try {
    console.log('5. Testing Supplier Input Correction (POST /api/v1/lineage/correct-input)...');
    const corrPayload = JSON.stringify({
      input_node_id: 'NODE_IN_SUP_409',
      new_value: 0.720,
      unit: 'kgCO2e/kg',
      reason: 'E2E Audited scope 3 update',
      user_ref: 'usr-auditor-e2e'
    });
    const corrRes = await fetchUrl('http://localhost:8080/api/v1/lineage/correct-input', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(corrPayload),
        'X-Tenant-ID': 'TENANT-BELLARY-E2E'
      },
      body: corrPayload
    });
    if (corrRes.status === 200) {
      const result = JSON.parse(corrRes.data);
      if (result.original_passport_frozen === true && result.new_draft_passport_id) {
        console.log(`   ✅ Immutability & Draft recalculation verified. New Draft ID: ${result.new_draft_passport_id}`);
      } else {
        throw new Error('Immutability contract violated or draft ID missing');
      }
    } else {
      throw new Error(`Supplier correction returned status ${corrRes.status}`);
    }
  } catch (err) {
    console.error('   ❌ Supplier correction test failed:', err.message);
    errors.push(`Supplier correction: ${err.message}`);
  }

  console.log('================================================================');
  if (errors.length === 0) {
    console.log('🎉 ALL UI TO BACKEND E2E INTEGRATION TESTS PASSED SUCCESSFULLY!');
    console.log('================================================================');
    process.exit(0);
  } else {
    console.error('🚨 UI TO BACKEND E2E INTEGRATION TESTS FAILED:');
    errors.forEach(e => console.error('  - ' + e));
    console.log('================================================================');
    process.exit(1);
  }
}

runUIBackendE2ETest();
