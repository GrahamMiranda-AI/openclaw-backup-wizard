import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';

import { APP_NAME, PORT, BACKUP_DIR } from '../src/config.js';
import { removePath, copyRecursive } from '../src/utils.js';

test('config exports are valid', (t) => {
  assert.strictEqual(typeof APP_NAME, 'string');
  assert.strictEqual(typeof PORT, 'number');
  assert.ok(BACKUP_DIR.includes('backups'), 'BACKUP_DIR should contain backups folder name');
});

test('utils file system operations', async (t) => {
  const currentDir = import.meta.dirname ? import.meta.dirname : import.meta.url ? new URL('.', import.meta.url).pathname : process.cwd();

  const tempTestDir = path.join(currentDir, 'temp_test_dir');
  const tempTargetDir = path.join(currentDir, 'temp_target_dir');

  // ensure clean state
  await removePath(tempTestDir);
  await removePath(tempTargetDir);

  fs.mkdirSync(tempTestDir, { recursive: true });
  fs.writeFileSync(path.join(tempTestDir, 'test.txt'), 'hello world');

  await copyRecursive(tempTestDir, tempTargetDir);
  assert.ok(fs.existsSync(tempTargetDir), 'Target dir should exist after copyRecursive');
  assert.ok(fs.existsSync(path.join(tempTargetDir, 'test.txt')), 'File should be copied');

  await removePath(tempTestDir);
  await removePath(tempTargetDir);

  assert.ok(!fs.existsSync(tempTestDir), 'Source dir should be removed');
  assert.ok(!fs.existsSync(tempTargetDir), 'Target dir should be removed');
});
