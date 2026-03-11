import { test, describe } from 'node:test';
import assert from 'node:assert';
import path from 'path';
import fs from 'fs';
import { promises as fsp } from 'fs';

import { removePath, copyRecursive } from '../src/utils.js';
import { RUNTIME_DIR } from '../src/config.js';

describe('utils test', () => {
  const testDir = path.join(RUNTIME_DIR, 'test-utils');

  test('removePath removes a directory successfully', async () => {
    const p = path.join(testDir, 'to-remove');
    await fsp.mkdir(p, { recursive: true });
    await fsp.writeFile(path.join(p, 'test.txt'), 'hello');

    assert.strictEqual(fs.existsSync(p), true);

    await removePath(p);

    assert.strictEqual(fs.existsSync(p), false);
  });

  test('copyRecursive copies directory and its content', async () => {
    const src = path.join(testDir, 'src');
    const dst = path.join(testDir, 'dst');

    await fsp.mkdir(src, { recursive: true });
    await fsp.writeFile(path.join(src, 'data.txt'), '12345');

    await copyRecursive(src, dst);

    const content = await fsp.readFile(path.join(dst, 'data.txt'), 'utf8');
    assert.strictEqual(content, '12345');

    // Cleanup
    await removePath(testDir);
  });
});
