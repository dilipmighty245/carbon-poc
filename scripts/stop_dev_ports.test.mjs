import assert from 'node:assert/strict';
import test from 'node:test';
import { listeningPids, stopDevPorts } from './stop_dev_ports.mjs';

test('Unix discovers unique listeners on exactly the application ports', () => {
  const ports = [];
  const pids = listeningPids('darwin', (command, args) => {
    assert.equal(command, 'lsof');
    ports.push(args[1]);
    assert.ok(args.includes('-sTCP:LISTEN'));
    return { status: 0, stdout: '321\n321\n', stderr: '' };
  });
  assert.deepEqual(pids, [321]);
  assert.deepEqual(ports, ['-iTCP:8080', '-iTCP:8085', '-iTCP:5173']);
});

test('Linux falls back to ss and ignores unrelated ports', () => {
  const pids = listeningPids('linux', command => command === 'lsof'
    ? { error: { code: 'ENOENT' } }
    : { status: 0, stdout: 'LISTEN 0 128 0.0.0.0:8080 0.0.0.0:* users:(("api",pid=321,fd=5))\nLISTEN 0 128 [::]:5173 [::]:* users:(("node",pid=654,fd=6))\nLISTEN 0 128 0.0.0.0:80 0.0.0.0:* users:(("other",pid=999,fd=7))' });
  assert.deepEqual(pids, [321, 654]);
});

test('Windows stops a listener without a PID file using taskkill', async () => {
  const commands = [];
  let listening = true;
  await stopDevPorts({
    platform: 'win32', currentPid: 12345, pause: async () => {},
    execute: (command, args) => {
      commands.push([command, args]);
      if (command === 'powershell.exe') {
        assert.match(args[2], /8080,8085,5173/);
        return { status: 0, stdout: listening ? '[321]' : '[]' };
      }
      assert.equal(command, 'taskkill');
      listening = false;
      return { status: 0 };
    },
  });
  assert.deepEqual(commands.find(([command]) => command === 'taskkill')[1], ['/PID', '321', '/T', '/F']);
});

test('Unix escalates to SIGKILL if a listener ignores SIGTERM', async () => {
  let listening = true;
  const signals = [];
  await stopDevPorts({
    platform: 'linux', currentPid: 12345, pause: async () => {},
    execute: () => ({ status: listening ? 0 : 1, stdout: listening ? '321\n' : '', stderr: '' }),
    kill: (pid, signal) => {
      signals.push([pid, signal]);
      if (signal === 'SIGKILL') listening = false;
    },
  });
  assert.deepEqual(signals, [[321, 'SIGTERM'], [321, 'SIGKILL']]);
});

test('empty ports are a successful no-op', async () => {
  await stopDevPorts({
    platform: 'linux', execute: () => ({ status: 1, stdout: '', stderr: '' }),
    kill: () => assert.fail('Nothing should be killed'),
  });
});

test('permission errors are reported instead of claiming cleanup succeeded', async () => {
  await assert.rejects(stopDevPorts({
    platform: 'linux', currentPid: 12345,
    execute: () => ({ status: 0, stdout: '321\n' }),
    kill: () => { const error = new Error('Operation not permitted'); error.code = 'EPERM'; throw error; },
  }), /Cannot stop PID 321/);
});

test('Windows inspection failures do not silently skip cleanup', () => {
  assert.throws(() => listeningPids('win32', () => ({ status: 1, stderr: 'Access denied' })), /Access denied/);
});
