#!/usr/bin/env bash
set -euo pipefail

# Hosts files resolve names only; the dev nginx proxy handles port 80 -> 5173.
hosts_file=/etc/hosts
hostname=carbon-passport.com

addresses=$(awk -v hostname="$hostname" '
  { sub(/#.*/, ""); for (i = 2; i <= NF; i++) if ($i == hostname) print $1 }
' "$hosts_file")

if [ -n "$addresses" ]; then
  if [ "$addresses" != "127.0.0.1" ]; then
    echo "Error: $hostname already has conflicting or duplicate entries in $hosts_file: $addresses" >&2
    echo "Keep a single '127.0.0.1 $hostname' entry and retry." >&2
    exit 1
  fi
  echo "==> $hostname already resolves to 127.0.0.1 in $hosts_file"
  exit 0
fi

echo "==> Adding 127.0.0.1 $hostname to $hosts_file (may request sudo)..."
if [ -w "$hosts_file" ]; then
  printf '\n127.0.0.1 %s # carbon-poc local development\n' "$hostname" >> "$hosts_file"
else
  printf '\n127.0.0.1 %s # carbon-poc local development\n' "$hostname" | sudo tee -a "$hosts_file" >/dev/null
fi
