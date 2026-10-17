import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
process.chdir(root);
const name = 'saurient-dev';
const context = `kind-${name}`;
const kubeconfig = path.join(root, '.dev-data', 'kind-kubeconfig');
fs.mkdirSync(path.dirname(kubeconfig), { recursive: true, mode: 0o700 });
function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: root, stdio: options.input !== undefined ? ['pipe', 'inherit', 'inherit'] : 'inherit', ...options });
  if (result.error || result.status !== 0) throw result.error || new Error(`${command} failed (${result.status})`);
  return result.stdout?.toString().trim();
}
function kubectl(args, options) { return run('kubectl', ['--kubeconfig', kubeconfig, '--context', context, ...args], options); }
try {
  if (process.argv[2] === 'reset') {
    const response = await fetch('http://127.0.0.1:18080/api/v1/system/reset', { method: 'POST', signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`Reset failed: HTTP ${response.status}`);
    console.log(await response.text());
  } else {
    const clusters = run('kind', ['get', 'clusters'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
    if (!clusters.split(/\r?\n/).includes(name)) {
      run('kind', ['create', 'cluster', '--config', 'deploy/kind-nexus-config.yaml', '--kubeconfig', kubeconfig, '--wait', '120s']);
    } else {
      run('kind', ['export', 'kubeconfig', '--name', name, '--kubeconfig', kubeconfig]);
    }
    fs.chmodSync(kubeconfig, 0o600);
    fs.mkdirSync('bin', { recursive: true });
    const tool = path.join(root, 'bin', process.platform === 'win32' ? 'devcluster.exe' : 'devcluster');
    run('go', ['build', '-o', tool, './cmd/devcluster']);
    const crds = run(tool, ['crds'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
    kubectl(['apply', '-f', '-'], { input: crds });
    kubectl(['wait', '--for=condition=Established', '--timeout=60s', '-f', '-'], { input: crds });
    // Create namespace before importing the previous local snapshot. The marker prevents re-import on restart.
    kubectl(['apply', '-f', '-'], { input: JSON.stringify({ apiVersion: 'v1', kind: 'Namespace', metadata: { name: 'saurient-system' } }) });
    run(tool, ['import', kubeconfig, path.join(root, '.dev-data')]);
    const arch = run('docker', ['version', '--format', '{{.Server.Arch}}'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
    if (!['arm64', 'amd64'].includes(arch)) throw new Error(`Unsupported Docker architecture: ${arch}`);
    run('go', ['build', '-o', 'bin/api-kind', './cmd/api'], { env: { ...process.env, CGO_ENABLED: '0', GOOS: 'linux', GOARCH: arch } });
    run('docker', ['build', '-f', 'deploy/Dockerfile.kind.api', '-t', 'saurient-api:kind-dev', '.']);
    run('kind', ['load', 'docker-image', 'saurient-api:kind-dev', '--name', name]);
    kubectl(['apply', '-f', 'deploy/nexus-app.yaml']);
    kubectl(['rollout', 'restart', 'deployment/saurient-api', '-n', 'saurient-system']);
    kubectl(['rollout', 'status', 'deployment/saurient-api', '-n', 'saurient-system', '--timeout=120s']);
    console.log('Nexus API: http://127.0.0.1:18080 | storage: Kubernetes CRDs + workspace ConfigMap, backed by kind etcd.');
  }
} catch (error) { console.error(error.message); process.exitCode = 1; }
