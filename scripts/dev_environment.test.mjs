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
  test(`${platform}: setup builds native binaries, copies proxy config, and launches Vite`, async () => {
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
        platform, env: {}, argv: ['node', 'script', 'start'], execPath: '/node',
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
      fetch: async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(0) }),
      AbortSignal, console: { log() {} }, setTimeout,
    };
    await vm.runInNewContext(`${source}\nmain()`, context);
    assert.equal(hostSetupCount, 1);
    const extension = platform === 'win32' ? '.exe' : '';
    assert.ok(commands.some(([cmd, args]) => cmd === 'go' && args.includes(`bin/api${extension}`)));
    assert.ok(commands.some(([cmd, args]) => cmd === 'docker' && args[0] === 'cp'));
    assert.ok(commands.some(([cmd, args]) => cmd === 'docker' && args.includes('127.0.0.1:80:80')));
    assert.equal(children[0][0], `/repo/bin/api${extension}`);
    assert.equal(children[1][0], `/repo/bin/telemetry${extension}`);
    assert.deepEqual(Array.from(children[2][1]).slice(-3), ['--port', '5173', '--strictPort']);
    assert.equal(files.has('.ui.pid'), false);
    assert.equal(files.has('.api.pid'), true);
    assert.ok(commands.some(([cmd]) => cmd === (platform === 'win32' ? 'taskkill' : 'kill')));
    assert.equal(commands.some(([cmd]) => ['bash', 'sh', 'sudo', 'pkill', 'lsof'].includes(cmd)), false);
  });
}
