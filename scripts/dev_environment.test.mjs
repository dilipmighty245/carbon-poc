import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { EventEmitter } from 'node:events';
import test from 'node:test';

// Exercise orchestration without Docker, elevation, or touching running services.
const source = fs.readFileSync(new URL('./dev_environment.mjs', import.meta.url), 'utf8')
  .replace(/^import .*;\n/gm, '')
  .replace(/^const root = .*;$/m, "const root = '/repo';")
  .replace(/^main\(\)\.catch.*;$/m, '');

for (const platform of ['darwin', 'linux', 'win32']) {
  test(`${platform}: setup prepares kind, copies proxy config, and launches Vite without a simulator`, async () => {
    const commands = [];
    const children = [];
    const files = new Map([['.api.pid', '42']]);
    let hostSetupCount = 0;
    let pid = 100;
    const context = {
      path,
      fs: {
        existsSync: file => String(file).endsWith('vite/bin/vite.js') || files.has(file),
        readFileSync: file => files.get(file),
        writeFileSync: (file, value) => files.set(file, value),
        rmSync: file => files.delete(file),
        mkdirSync() {}, openSync() { return 9; }, closeSync() {},
      },
      process: {
        platform, env: { PORT: '9090' }, argv: ['node', 'script', 'start'], execPath: '/node',
        chdir() {}, once() {}, kill: (...args) => commands.push(['kill', args]),
      },
      spawnSync: (command, args) => { commands.push([command, args]); return { status: 0 }; },
      spawn: (command, args, options) => {
        children.push([command, args, options]);
        const child = new EventEmitter();
        child.pid = ++pid;
        child.unref = () => {};
        queueMicrotask(() => child.emit('spawn'));
        if (command === '/node') setTimeout(() => child.emit('exit', 0), 10);
        return child;
      },
      setupDevHost: () => { hostSetupCount++; },
      stopDevPorts: async () => { commands.push(['stopDevPorts', []]); },
      fetch: async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(0) }),
      AbortSignal, console: { log() {} }, setTimeout,
    };
    await vm.runInNewContext(`${source}\nmain()`, context);
    assert.equal(hostSetupCount, 1);
    const cleanupIndex = commands.findIndex(([cmd]) => cmd === 'stopDevPorts');
    assert.ok(cleanupIndex >= 0);
    assert.ok(cleanupIndex < commands.findIndex(([cmd, args]) => cmd === '/node' && args.includes('scripts/kind_environment.mjs')));
    assert.ok(commands.some(([cmd, args]) => cmd === 'docker' && args[0] === 'cp'));
    assert.ok(commands.some(([cmd, args]) => cmd === 'docker' && args.includes('127.0.0.1:80:80')));
    assert.equal(children.length, 1);
    assert.equal(children[0][0], '/node');
    assert.equal(children[0][2].env.VITE_API_PROXY_TARGET, 'http://127.0.0.1:18080');
    assert.deepEqual(Array.from(children[0][1]).slice(-3), ['--port', '5173', '--strictPort']);
    assert.equal(files.has('.ui.pid'), false);
    assert.equal(files.has('.api.pid'), false);
    assert.ok(commands.some(([cmd]) => cmd === (platform === 'win32' ? 'taskkill' : 'kill')));
    assert.equal(commands.some(([cmd]) => ['bash', 'sh', 'sudo', 'pkill', 'lsof'].includes(cmd)), false);
  });
}

const readinessSource = source.slice(source.indexOf('function readinessError'), source.indexOf('async function main'));

function readinessContext(fetch) {
  let now = 0;
  return {
    fetch, AbortSignal, Date: { now: () => now },
    setTimeout: (callback, delay) => { now += delay; callback(); },
    fs: { existsSync: () => true, readFileSync: () => 'API failed: port already in use\n' },
  };
}

test('readiness reports process exit and the service log immediately', async () => {
  const context = readinessContext(() => assert.fail('Exited process should not be polled'));
  await assert.rejects(vm.runInNewContext(`${readinessSource}
    waitFor('http://localhost:8080/healthz', { service: 'api', child: { exitCode: 1 } })`, context),
  /api did not become ready:[\s\S]*Process exited: 1[\s\S]*port already in use/);
});

test('readiness timeout includes the last HTTP response and log', async () => {
  const context = readinessContext(async () => ({ ok: false, status: 503, arrayBuffer: async () => {} }));
  await assert.rejects(vm.runInNewContext(`${readinessSource}
    waitFor('http://localhost:8080/healthz', { service: 'api', timeoutMs: 1000 })`, context),
  /Timed out after 1s. Last failure: HTTP 503[\s\S]*Last lines of api.log/);
});

test('readiness retries a connection failure and accepts a later healthy response', async () => {
  let calls = 0;
  const context = readinessContext(async () => {
    if (++calls === 1) throw new Error('Connection refused');
    return { ok: true, arrayBuffer: async () => {} };
  });
  await vm.runInNewContext(`${readinessSource}
    waitFor('http://localhost:8080/healthz', { service: 'api', timeoutMs: 1000 })`, context);
  assert.equal(calls, 2);
});
