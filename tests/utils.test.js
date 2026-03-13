import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { removePath, copyRecursive } from '../src/utils.js';

test('utils', async (t) => {
  const TMP_DIR = path.join(import.meta.dirname, '.test_tmp');

  await t.test('removePath removes a directory and its contents', async () => {
    fs.mkdirSync(TMP_DIR, { recursive: true });
    fs.writeFileSync(path.join(TMP_DIR, 'file.txt'), 'hello');

    assert.ok(fs.existsSync(TMP_DIR));

    await removePath(TMP_DIR);

    assert.ok(!fs.existsSync(TMP_DIR));
  });

  await t.test('copyRecursive copies directory recursively', async () => {
    const src = path.join(TMP_DIR, 'src_dir');
    const dst = path.join(TMP_DIR, 'dst_dir');

    fs.mkdirSync(src, { recursive: true });
    fs.writeFileSync(path.join(src, 'test.txt'), 'data');
    fs.mkdirSync(path.join(src, 'sub_dir'));
    fs.writeFileSync(path.join(src, 'sub_dir', 'nested.txt'), 'nested_data');

    await copyRecursive(src, dst);

    assert.ok(fs.existsSync(dst));
    assert.strictEqual(fs.readFileSync(path.join(dst, 'test.txt'), 'utf8'), 'data');
    assert.ok(fs.existsSync(path.join(dst, 'sub_dir')));
    assert.strictEqual(fs.readFileSync(path.join(dst, 'sub_dir', 'nested.txt'), 'utf8'), 'nested_data');

    await removePath(TMP_DIR);
  });
});
