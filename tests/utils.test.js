import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { copyRecursive, removePath } from '../src/utils.js';

const fsp = fs.promises;
const TEST_DIR = path.join(import.meta.dirname, '.test_env');

test('utils', async (t) => {
  await fsp.mkdir(TEST_DIR, { recursive: true });

  await t.test('copyRecursive should copy files correctly', async () => {
    const srcDir = path.join(TEST_DIR, 'src');
    const dstDir = path.join(TEST_DIR, 'dst');
    await fsp.mkdir(srcDir, { recursive: true });
    await fsp.writeFile(path.join(srcDir, 'test.txt'), 'hello world');

    await copyRecursive(srcDir, dstDir);

    const content = await fsp.readFile(path.join(dstDir, 'test.txt'), 'utf8');
    assert.strictEqual(content, 'hello world');
  });

  await t.test('removePath should remove files and directories', async () => {
    const targetDir = path.join(TEST_DIR, 'to_remove');
    await fsp.mkdir(targetDir, { recursive: true });
    await fsp.writeFile(path.join(targetDir, 'file.txt'), 'data');

    assert.strictEqual(fs.existsSync(targetDir), true);

    await removePath(targetDir);

    assert.strictEqual(fs.existsSync(targetDir), false);
  });

  // Cleanup
  await removePath(TEST_DIR);
});
