import { test } from 'node:test';
import assert from 'node:assert';
import path from 'path';

import * as config from '../src/config.js';

test('config exports required constants', () => {
  assert.ok(config.PORT);
  assert.ok(config.APP_NAME);
  assert.ok(config.WORKSPACE_FILES.length > 0);
});

test('config paths are correctly resolved relative to project root', () => {
  const root = path.resolve(import.meta.dirname, '..');

  assert.strictEqual(config.BACKUP_DIR, path.join(root, 'backups'));
  assert.strictEqual(config.RUNTIME_DIR, path.join(root, '.runtime'));
  assert.strictEqual(config.UPLOAD_DIR, path.join(root, '.runtime', 'uploads'));
  assert.strictEqual(config.TMP_RESTORE_DIR, path.join(root, '.runtime', 'restore'));
});
