import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';

describe('App', () => {
  let app;

  before(async () => {
    process.env.ADMIN_USER = 'admin';
    process.env.ADMIN_PASSWORD_HASH = '$2a$10$dhR92Y5gTGtRidnYr4cQZe0qw3KOKBpfNoItV4Wi.B6bIXD94Iiv2'; // hash of 'TestPass123'
    process.env.SESSION_SECRET = 'test-secret';
    process.env.APP_NAME = 'Test Wizard';

    // dynamically import app after environment variables are set
    const appModule = await import('../src/app.js');
    app = appModule.app;
  });

  it('redirects to /login when not authenticated (GET /)', async () => {
    const res = await request(app).get('/');
    assert.strictEqual(res.statusCode, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  it('shows login page (GET /login)', async () => {
    const res = await request(app).get('/login');
    assert.strictEqual(res.statusCode, 200);
    assert.match(res.text, /Test Wizard - Login/);
    assert.match(res.text, /name="username"/);
    assert.match(res.text, /name="password"/);
  });

  it('login with valid credentials redirects to /wizard', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'admin', password: 'TestPass123' });

    assert.strictEqual(res.statusCode, 302);
    assert.strictEqual(res.headers.location, '/wizard');
    assert.ok(res.headers['set-cookie']);
  });

  it('login with invalid credentials returns 401', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'admin', password: 'WrongPassword' });

    assert.strictEqual(res.statusCode, 401);
    assert.match(res.text, /Invalid login/);
  });
});
