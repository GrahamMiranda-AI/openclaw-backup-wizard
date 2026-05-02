import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import supertest from 'supertest';
import bcrypt from 'bcryptjs';

// Set up env vars before dynamic import
process.env.ADMIN_USER = 'testadmin';
process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync('testpass123', 10);
process.env.SESSION_SECRET = 'test-secret';
process.env.APP_NAME = 'Test Wizard';

describe('App Endpoints', () => {
  let app;

  before(async () => {
    // Dynamically import the app after env vars are set
    const appModule = await import('../src/app.js');
    app = appModule.app;
  });

  test('GET / should redirect to /login', async () => {
    const response = await supertest(app).get('/');
    assert.strictEqual(response.status, 302);
    assert.strictEqual(response.headers.location, '/login');
  });

  test('GET /login should render login page', async () => {
    const response = await supertest(app).get('/login');
    assert.strictEqual(response.status, 200);
    assert.match(response.text, /Test Wizard - Login/);
    assert.match(response.text, /Sign in/);
  });

  test('POST /login should authenticate with correct credentials', async () => {
    const response = await supertest(app)
      .post('/login')
      .send({ username: 'testadmin', password: 'testpass123' })
      .type('form');

    assert.strictEqual(response.status, 302);
    assert.strictEqual(response.headers.location, '/wizard');
    assert.ok(response.headers['set-cookie'].some(c => c.includes('connect.sid')));
  });

  test('POST /login should reject incorrect credentials', async () => {
    const response = await supertest(app)
      .post('/login')
      .send({ username: 'testadmin', password: 'wrongpassword' })
      .type('form');

    assert.strictEqual(response.status, 401);
    assert.match(response.text, /Invalid login/);
  });
});
