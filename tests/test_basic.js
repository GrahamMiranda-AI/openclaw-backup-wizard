import test from 'node:test';
import assert from 'node:assert';
import path from 'path';
import fs from 'fs';
import { APP_NAME, ADMIN_USER, WORKSPACE_FILES } from '../src/config.js';
import { copyRecursive, removePath } from '../src/utils.js';

test('Configuration loaded correctly', (t) => {
  assert.strictEqual(typeof APP_NAME, 'string');
  assert.strictEqual(typeof ADMIN_USER, 'string');
  assert.ok(Array.isArray(WORKSPACE_FILES));
  assert.ok(WORKSPACE_FILES.includes('AGENTS.md'));
});

test('removePath removes a directory', async (t) => {
  const testDir = path.join(import.meta.dirname, 'test-remove-dir');
  fs.mkdirSync(testDir, { recursive: true });
  assert.ok(fs.existsSync(testDir));

  await removePath(testDir);
  assert.ok(!fs.existsSync(testDir));
});

test('copyRecursive copies files', async (t) => {
  const srcDir = path.join(import.meta.dirname, 'test-copy-src');
  const dstDir = path.join(import.meta.dirname, 'test-copy-dst');

  try {
    fs.mkdirSync(srcDir, { recursive: true });
    fs.writeFileSync(path.join(srcDir, 'test.txt'), 'hello world');

    await copyRecursive(srcDir, dstDir);

    assert.ok(fs.existsSync(dstDir));
    assert.ok(fs.existsSync(path.join(dstDir, 'test.txt')));
    assert.strictEqual(fs.readFileSync(path.join(dstDir, 'test.txt'), 'utf8'), 'hello world');
  } finally {
    await removePath(srcDir);
    await removePath(dstDir);
  }
});
