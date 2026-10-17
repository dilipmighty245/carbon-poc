import assert from 'node:assert/strict';
import test from 'node:test';
import { addDevHost } from './setup_dev_host.mjs';

test('adds one entry, ignoring comments and preserving existing contents', () => {
  const original = '127.0.0.1 localhost\n# 192.0.2.1 carbon-passport.com\n';
  const updated = addDevHost(original);
  assert.ok(updated.startsWith(original));
  assert.match(updated, /\n127\.0\.0\.1 carbon-passport\.com # carbon-poc local development\n$/);
  assert.equal(addDevHost(updated), updated);
});

test('recognizes case-insensitive aliases and inline comments', () => {
  const original = '127.0.0.1 localhost CARBON-PASSPORT.COM # dev\r\n';
  assert.equal(addDevHost(original), original);
});

test('preserves Windows line endings', () => {
  const updated = addDevHost('127.0.0.1 localhost\r\n');
  assert.equal(updated.replaceAll('\r\n', '').includes('\n'), false);
});

test('rejects conflicting IPv4 or IPv6 entries without changing the input', () => {
  for (const address of ['192.0.2.1', '::1']) {
    assert.throws(() => addDevHost(`127.0.0.1 carbon-passport.com\n${address} carbon-passport.com`), /Conflicting/);
  }
});
