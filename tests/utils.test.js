import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { removePath } from '../src/utils.js';

test('removePath removes an existing directory', async () => {
  const tmpDir = path.join(import.meta.dirname, 'tmp-test-dir');
  fs.mkdirSync(tmpDir, { recursive: true });
  assert.ok(fs.existsSync(tmpDir));

  await removePath(tmpDir);
  assert.equal(fs.existsSync(tmpDir), false);
});

test('removePath resolves silently if path does not exist', async () => {
  const tmpDir = path.join(import.meta.dirname, 'does-not-exist');
  assert.equal(fs.existsSync(tmpDir), false);

  await removePath(tmpDir); // Should not throw
  assert.equal(fs.existsSync(tmpDir), false);
});
