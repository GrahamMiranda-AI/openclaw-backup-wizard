import { test } from 'node:test';
import assert from 'node:assert';
import path from 'path';
import {
  APP_NAME,
  BACKUP_DIR,
  OPENCLAW_DIR,
  WORKSPACE_DIR,
  HOME_DIR
} from '../src/config.js';

test('APP_NAME is exported', () => {
  assert.ok(APP_NAME, 'APP_NAME should be truthy');
});

test('BACKUP_DIR uses correct parent directory relative path', () => {
  assert.ok(BACKUP_DIR.includes('backups'), 'BACKUP_DIR should include backups folder');
  assert.ok(path.isAbsolute(BACKUP_DIR), 'BACKUP_DIR should be an absolute path');
});

test('OPENCLAW_DIR relies on HOME_DIR', () => {
  assert.equal(OPENCLAW_DIR, path.join(HOME_DIR, '.openclaw'), 'OPENCLAW_DIR matches HOME_DIR/.openclaw');
});

test('WORKSPACE_DIR relies on OPENCLAW_DIR', () => {
  assert.equal(WORKSPACE_DIR, path.join(OPENCLAW_DIR, 'workspace'), 'WORKSPACE_DIR uses OPENCLAW_DIR correctly');
});
