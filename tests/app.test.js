import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import fs from 'fs';
import path from 'path';

let app;
const mockHome = path.join(import.meta.dirname, 'mock_home');

describe('OpenClaw Backup Wizard', () => {
  before(async () => {
    // Setup mock home and openclaw directory
    fs.mkdirSync(path.join(mockHome, '.openclaw'), { recursive: true });
    process.env.HOME = mockHome;
    process.env.ADMIN_USER = 'testadmin';
    process.env.ADMIN_PASSWORD_HASH = 'mockhash';
    process.env.SESSION_SECRET = 'testsecret';

    // Dynamically import app after environment variables are set
    const module = await import('../src/app.js');
    app = module.app;
  });

  after(() => {
    // Cleanup mock home
    if (fs.existsSync(mockHome)) {
      fs.rmSync(mockHome, { recursive: true, force: true });
    }
  });

  test('GET / should redirect to /login when unauthenticated', async () => {
    const response = await request(app).get('/');
    assert.strictEqual(response.status, 302);
    assert.strictEqual(response.headers.location, '/login');
  });

  test('GET /login should render login page', async () => {
    const response = await request(app).get('/login');
    assert.strictEqual(response.status, 200);
    assert.match(response.text, /Login/);
    assert.match(response.text, /Username/);
  });
});
