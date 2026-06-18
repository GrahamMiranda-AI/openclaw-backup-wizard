import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import supertest from 'supertest';
import path from 'path';

// Set mock environment variables before importing anything else
process.env.PORT = '4281';
process.env.SESSION_SECRET = 'test-secret';
process.env.ADMIN_USER = 'admin';
process.env.ADMIN_PASSWORD_HASH = 'mock-hash'; // Will mock bcrypt anyway if testing auth deeply
process.env.HOME = path.join(process.cwd(), '.tmp-home');

let app;
let request;

describe('OpenClaw Backup Wizard API', () => {
  before(async () => {
    const imported = await import('../src/app.js');
    app = imported.app;
    request = supertest(app);
  });

  test('GET / redirects unauthenticated user to /login', async () => {
    const response = await request.get('/');
    assert.strictEqual(response.status, 302);
    assert.strictEqual(response.headers.location, '/login');
  });

  test('GET /login renders login page', async () => {
    const response = await request.get('/login');
    assert.strictEqual(response.status, 200);
    assert.match(response.text, /<h2>Login<\/h2>/);
    assert.match(response.text, /OpenClaw Backup Wizard/);
  });

  test('GET /wizard redirects unauthenticated user to /login', async () => {
    const response = await request.get('/wizard');
    assert.strictEqual(response.status, 302);
    assert.strictEqual(response.headers.location, '/login');
  });

  test('POST /login with invalid credentials fails', async () => {
    const response = await request.post('/login').send({
      username: 'admin',
      password: 'wrongpassword'
    });

    // We expect a 401 and an error message
    assert.strictEqual(response.status, 401);
    assert.match(response.text, /Invalid login/);
  });
});
