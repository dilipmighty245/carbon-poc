import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { setupDevHost } from './setup_dev_host.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
process.chdir(root);
const windows = process.platform === 'win32';
const etcd = process.env.ETCD_CONTAINER || 'saurient-etcd';
const proxy = 'carbon-passport-dev-proxy';
const etcdImage = process.env.ETCD_IMAGE || 'quay.io/coreos/etcd:v3.5.10';
const proxyImage = process.env.DEV_PROXY_IMAGE || 'nginx:stable-alpine';

function run(command, args, optional = false) {
  const result = spawnSync(command, args, { stdio: optional ? 'ignore' : 'inherit', cwd: root });
  if (!optional && (result.error || result.status !== 0)) {
    throw result.error || new Error(`${command} failed (${result.status}).`);
  }
}

function stopServices() {
  for (const name of ['ui', 'api', 'telemetry']) {
    const file = `.${name}.pid`;
    if (!fs.existsSync(file)) continue;
    const pid = Number(fs.readFileSync(file, 'utf8').trim());
    if (Number.isInteger(pid) && pid > 1) {
      if (windows) run('taskkill', ['/PID', String(pid), '/T', '/F'], true);
      else {
        try { process.kill(-pid, 'SIGTERM'); }
        catch { try { process.kill(pid, 'SIGTERM'); } catch { /* Already stopped. */ } }
      }
    }
    fs.rmSync(file, { force: true });
  }
}

async function clean() {
  // Keep the existing clean-state behavior, with a bounded request.
  try { await fetch('http://localhost:8080/api/v1/system/reset', { method: 'POST', signal: AbortSignal.timeout(2000) }); } catch { /* API may be stopped. */ }
  stopServices();
  run('docker', ['rm', '-f', proxy, etcd], true);
  fs.rmSync('bin', { recursive: true, force: true });
  for (const file of ['api.log', 'telemetry.log', 'ui.log']) fs.rmSync(file, { force: true });
}

async function start(name, command, args, cwd = root, foreground = false) {
  const log = foreground ? null : fs.openSync(`${name}.log`, 'a');
  const child = spawn(command, args, {
    cwd, detached: true, stdio: foreground ? 'inherit' : ['ignore', log, log],
  });
  try {
    await new Promise((resolve, reject) => { child.once('spawn', resolve); child.once('error', reject); });
  } finally { if (log !== null) fs.closeSync(log); }
  fs.writeFileSync(`.${name}.pid`, String(child.pid));
  if (!foreground) child.unref();
  return child;
}

async function waitFor(url) {
  for (let attempt = 0; attempt < 30; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1000) });
      await response.arrayBuffer();
      if (response.ok) return;
    } catch { /* Retry while the server starts. */ }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error(`Service did not become ready: ${url}`);
}

async function main() {
  if (process.argv[2] === 'clean') { await clean(); return; }
  if (process.argv[2] !== 'start') throw new Error('Usage: node scripts/dev_environment.mjs start|clean');
  run('docker', ['info', '--format', '{{.ServerVersion}}']);
  run('go', ['version']);
  const uiDirectory = path.join(root, 'digital-passport-app');
  const vite = path.join(uiDirectory, 'node_modules/vite/bin/vite.js');
  if (!fs.existsSync(vite)) throw new Error('Install UI dependencies first: cd digital-passport-app && npm install');
  setupDevHost();
  await clean();
  const extension = windows ? '.exe' : '';
  try {
    run('docker', ['run', '-d', '--name', etcd, '-p', '2379:2379', '-p', '2380:2380',
      '-e', 'ALLOW_NONE_AUTHENTICATION=yes', etcdImage, 'etcd',
      '--listen-client-urls', 'http://0.0.0.0:2379', '--advertise-client-urls', 'http://0.0.0.0:2379']);
    fs.mkdirSync('bin', { recursive: true });
    run('go', ['build', '-o', `bin/api${extension}`, './cmd/api']);
    run('go', ['build', '-o', `bin/telemetry${extension}`, './cmd/telemetry']);
    // Copy config rather than mounting a host path: works with Windows paths and WSL.
    run('docker', ['create', '--name', proxy, '-p', '127.0.0.1:80:80',
      '--add-host', 'host.docker.internal:host-gateway', proxyImage]);
    run('docker', ['cp', path.join(root, 'deploy/nginx.dev.conf'), `${proxy}:/etc/nginx/conf.d/default.conf`]);
    run('docker', ['start', proxy]);
    await start('api', path.join(root, `bin/api${extension}`), []);
    await start('telemetry', path.join(root, `bin/telemetry${extension}`), ['-port', '8085']);
    await Promise.all([waitFor('http://localhost:8080/healthz'), waitFor('http://localhost:8085/healthz')]);
    const ui = await start('ui', process.execPath, [vite, '--port', '5173', '--strictPort'], uiDirectory, true);
    let stoppingUI = false;
    const stopUI = () => {
      stoppingUI = true;
      if (windows) run('taskkill', ['/PID', String(ui.pid), '/T', '/F'], true);
      else { try { process.kill(-ui.pid, 'SIGTERM'); } catch { /* Already stopped. */ } }
    };
    process.once('SIGINT', stopUI);
    process.once('SIGTERM', stopUI);
    const exited = new Promise((resolve, reject) => {
      ui.once('exit', code => !stoppingUI && code && code !== 130 ? reject(new Error(`Vite exited (${code}).`)) : resolve());
      ui.once('error', reject);
    });
    // Attach a handler immediately, including while waiting for readiness.
    exited.catch(() => {});
    await Promise.race([waitFor('http://localhost:5173'), exited.then(() => { throw new Error('Vite stopped before becoming ready.'); })]);
    console.log('Digital Passport UI: http://carbon-passport.com (http://localhost:5173)');
    console.log('API: http://localhost:8080/api/v1 | Telemetry: http://localhost:8085');
    await exited;
    fs.rmSync('.ui.pid', { force: true });
  } catch (error) {
    stopServices();
    run('docker', ['rm', '-f', proxy, etcd], true);
    throw error;
  }
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
