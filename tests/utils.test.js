import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { copyRecursive, removePath } from '../src/utils.js';

test('copyRecursive and removePath', async (t) => {
  const testDir = path.join(process.cwd(), '.test-data');
  const srcDir = path.join(testDir, 'src');
  const dstDir = path.join(testDir, 'dst');

  await removePath(testDir);
  await fsp.mkdir(srcDir, { recursive: true });

  const testFile = path.join(srcDir, 'test.txt');
  await fsp.writeFile(testFile, 'hello world');

  await t.test('copyRecursive copies files', async () => {
    await copyRecursive(srcDir, dstDir);
    const dstFile = path.join(dstDir, 'test.txt');

    assert.strictEqual(fs.existsSync(dstFile), true);
    const content = await fsp.readFile(dstFile, 'utf8');
    assert.strictEqual(content, 'hello world');
  });

  await t.test('removePath removes directory', async () => {
    await removePath(testDir);
    assert.strictEqual(fs.existsSync(testDir), false);
  });
});
