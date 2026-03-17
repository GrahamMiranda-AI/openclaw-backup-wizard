import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { removePath, copyRecursive } from '../src/utils.js';

test('removePath removes a directory and its contents', async () => {
  const tmpDir = path.join(import.meta.dirname, 'tmp-remove-test');
  await fsp.mkdir(tmpDir, { recursive: true });
  await fsp.writeFile(path.join(tmpDir, 'file.txt'), 'hello world');

  assert.ok(fs.existsSync(tmpDir));

  await removePath(tmpDir);

  assert.ok(!fs.existsSync(tmpDir));
});

test('copyRecursive copies directory with files', async () => {
  const srcDir = path.join(import.meta.dirname, 'tmp-copy-src');
  const dstDir = path.join(import.meta.dirname, 'tmp-copy-dst');

  await fsp.mkdir(srcDir, { recursive: true });
  await fsp.writeFile(path.join(srcDir, 'file.txt'), 'hello copy');

  await copyRecursive(srcDir, dstDir);

  assert.ok(fs.existsSync(dstDir));
  assert.ok(fs.existsSync(path.join(dstDir, 'file.txt')));
  const content = await fsp.readFile(path.join(dstDir, 'file.txt'), 'utf-8');
  assert.strictEqual(content, 'hello copy');

  await removePath(srcDir);
  await removePath(dstDir);
});
