import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export function addDevHost(content) {
  const addresses = content.split(/\r?\n/).flatMap(line => {
    const [address, ...names] = line.split('#')[0].trim().split(/\s+/);
    return names.some(name => name.toLowerCase() === 'carbon-passport-dev') ? [address] : [];
  });
  if (addresses.some(address => address !== '127.0.0.1')) {
    throw new Error('Conflicting carbon-passport-dev hosts entry. Set its address to 127.0.0.1 and retry.');
  }
  const newline = content.includes('\r\n') ? '\r\n' : '\n';
  return addresses.length ? content : `${content}${newline}127.0.0.1 carbon-passport-dev # carbon-poc local development${newline}`;
}

function checked(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} failed (${result.status}).`);
}

function windowsHosts(command) {
  // Resolve the Windows path inside PowerShell, including when called from WSL.
  const body = `
$ErrorActionPreference = 'Stop'
$file = Join-Path $env:SystemRoot 'System32\\drivers\\etc\\hosts'
$content = [IO.File]::ReadAllText($file)
$addresses = @($content -split '\\r?\\n' | ForEach-Object {
  $fields = (($_ -split '#')[0]).Trim() -split '\\s+'
  if ($fields.Length -gt 1 -and $fields[1..($fields.Length - 1)] -contains 'carbon-passport-dev') { $fields[0] }
})
if (@($addresses | Where-Object { $_ -ne '127.0.0.1' }).Count -gt 0) {
  throw "Conflicting carbon-passport-dev entry in $file. Set its address to 127.0.0.1 and retry."
}
if ($addresses.Count -eq 0) {
  [IO.File]::AppendAllText($file, "\r\n127.0.0.1 carbon-passport-dev # carbon-poc local development\r\n")
}
`;
  const encodedBody = Buffer.from(body, 'utf16le').toString('base64');
  // Read first without elevation; request UAC only for a missing entry.
  const wrapper = `
$ErrorActionPreference = 'Stop'
try { & { ${body} }; exit 0 }
catch [System.UnauthorizedAccessException] {
  $process = Start-Process powershell.exe -Verb RunAs -Wait -PassThru -ArgumentList @('-NoProfile', '-EncodedCommand', '${encodedBody}')
  exit $process.ExitCode
}
catch { Write-Error $_; exit 1 }
`;
  checked(command, ['-NoProfile', '-EncodedCommand', Buffer.from(wrapper, 'utf16le').toString('base64')]);
}

export function setupDevHost({ localOnly = false } = {}) {
  if (process.platform === 'win32') {
    windowsHosts('powershell.exe');
  } else {
    const file = '/etc/hosts';
    const content = fs.readFileSync(file, 'utf8');
    const updated = addDevHost(content);
    if (updated !== content) {
      try { fs.appendFileSync(file, updated.slice(content.length)); }
      catch (error) {
        if (!['EACCES', 'EPERM'].includes(error.code)) throw error;
        console.log('Adding local domain to /etc/hosts (sudo may prompt)...');
        checked('sudo', [process.execPath, fileURLToPath(import.meta.url), '--local-only']);
      }
    }
    if (!localOnly && /microsoft/i.test(os.release())) {
      windowsHosts('powershell.exe');
    }
  }
  console.log('Hosts configured: 127.0.0.1 carbon-passport-dev');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { setupDevHost({ localOnly: process.argv.includes('--local-only') }); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
