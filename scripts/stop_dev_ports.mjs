import { spawnSync } from 'node:child_process';

export const devPorts = [8080, 8085, 5173];

export function listeningPids(platform, execute = spawnSync) {
  if (platform === 'win32') {
    const script = `$ErrorActionPreference = 'Stop'; $owners = @(Get-NetTCPConnection -State Listen -ErrorAction Stop | Where-Object { $_.LocalPort -in @(${devPorts.join(',')}) } | Select-Object -ExpandProperty OwningProcess -Unique); ConvertTo-Json -Compress -InputObject $owners`;
    const result = execute('powershell.exe', ['-NoProfile', '-Command', script], { encoding: 'utf8' });
    if (result.error || result.status !== 0) {
      throw new Error(`Cannot inspect development ports: ${result.error?.message || result.stderr?.trim()}. Try an Administrator terminal.`);
    }
    return [...new Set(JSON.parse(result.stdout.trim() || '[]').map(Number))];
  }

  const pids = new Set();
  for (const port of devPorts) {
    const result = execute('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN', '-t'], { encoding: 'utf8' });
    if (result.error?.code === 'ENOENT') {
      // Minimal Linux installations may have ss instead of lsof.
      const sockets = execute('ss', ['-H', '-ltnp'], { encoding: 'utf8' });
      if (sockets.error || sockets.status !== 0) throw new Error('Port cleanup requires lsof or ss. Install lsof and retry.');
      for (const line of sockets.stdout.trim().split('\n')) {
        const local = line.trim().split(/\s+/)[3] || '';
        if (!devPorts.some(value => local.endsWith(`:${value}`))) continue;
        const owners = [...line.matchAll(/pid=(\d+)/g)];
        if (!owners.length) throw new Error(`Cannot identify process listening on ${local}. Retry with sufficient permissions.`);
        owners.forEach(match => pids.add(Number(match[1])));
      }
      return [...pids];
    }
    if (result.error || ![0, 1].includes(result.status) || (result.status === 1 && result.stderr?.trim())) {
      throw new Error(`Cannot inspect port ${port}: ${result.error?.message || result.stderr?.trim() || 'lsof failed'}`);
    }
    for (const value of result.stdout.trim().split(/\s+/)) {
      if (/^\d+$/.test(value)) pids.add(Number(value));
    }
  }
  return [...pids];
}

export async function stopDevPorts({
  platform = process.platform, execute = spawnSync,
  kill = (pid, signal) => process.kill(pid, signal),
  pause = () => new Promise(resolve => setTimeout(resolve, 200)),
  currentPid = process.pid,
} = {}) {
  const inspect = () => listeningPids(platform, execute);
  const stop = (pids, signal) => {
    for (const pid of pids) {
      if (!Number.isInteger(pid) || pid <= 1 || pid === currentPid || (platform === 'win32' && pid === 4)) {
        throw new Error(`Cannot stop protected PID ${pid} on a development port.`);
      }
      if (platform === 'win32') {
        // Reinspection below distinguishes an already-exited process from a failed kill.
        execute('taskkill', ['/PID', String(pid), '/T', '/F'], { encoding: 'utf8' });
      } else {
        try { kill(pid, signal); }
        catch (error) {
          if (error.code !== 'ESRCH') throw new Error(`Cannot stop PID ${pid}: ${error.message}. Retry with sufficient permissions.`);
        }
      }
    }
  };

  let pids = inspect();
  if (!pids.length) return;
  console.log(`Stopping listeners on development ports ${devPorts.join(', ')} (PIDs: ${pids.join(', ')})...`);
  stop(pids, 'SIGTERM');
  for (let attempt = 0; attempt < 10; attempt++) {
    await pause();
    pids = inspect();
    if (!pids.length) return;
  }
  stop(pids, 'SIGKILL');
  for (let attempt = 0; attempt < 10; attempt++) {
    await pause();
    pids = inspect();
    if (!pids.length) return;
  }
  throw new Error(`Development ports are still in use by PIDs ${pids.join(', ')}. Retry from an Administrator/root terminal.`);
}
