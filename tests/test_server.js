import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';

import { copyRecursive, createBackupZip, removePath } from '../src/utils.js';

test('copyRecursive copies files and directories recursively', async () => {
  const src = path.join(import.meta.dirname, 'test-src');
  const dst = path.join(import.meta.dirname, 'test-dst');

  await removePath(src);
  await removePath(dst);

  await fsp.mkdir(src, { recursive: true });
  await fsp.writeFile(path.join(src, 'file1.txt'), 'hello');
  await fsp.mkdir(path.join(src, 'subdir'));
  await fsp.writeFile(path.join(src, 'subdir', 'file2.txt'), 'world');

  await copyRecursive(src, dst);

  assert.strictEqual(fs.existsSync(path.join(dst, 'file1.txt')), true);
  assert.strictEqual(fs.readFileSync(path.join(dst, 'file1.txt'), 'utf8'), 'hello');
  assert.strictEqual(fs.existsSync(path.join(dst, 'subdir', 'file2.txt')), true);
  assert.strictEqual(fs.readFileSync(path.join(dst, 'subdir', 'file2.txt'), 'utf8'), 'world');

  await removePath(src);
  await removePath(dst);
});

test('removePath removes files and directories', async () => {
  const target = path.join(import.meta.dirname, 'test-target');

  await removePath(target);
  await fsp.mkdir(target, { recursive: true });
  await fsp.writeFile(path.join(target, 'file.txt'), 'hello');

  await removePath(target);

  assert.strictEqual(fs.existsSync(target), false);
});

test('createBackupZip creates a valid zip file', async () => {
  const zipFile = path.join(import.meta.dirname, 'test-backup.zip');

  await removePath(zipFile);

  await createBackupZip(zipFile);

  assert.strictEqual(fs.existsSync(zipFile), true);

  const stat = await fsp.stat(zipFile);
  assert.ok(stat.size > 0);

  await removePath(zipFile);
});
