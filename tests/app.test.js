import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import fs from 'fs';
import path from 'path';

// Setup mocked environment
const MOCK_HOME = path.join(import.meta.dirname, 'mock_home');
const MOCK_OPENCLAW = path.join(MOCK_HOME, '.openclaw');

process.env.HOME = MOCK_HOME;
process.env.ADMIN_USER = 'admin';
// "testpassword"
process.env.ADMIN_PASSWORD_HASH = '$2a$10$rblJuoj7BzbW/R0Ln8r3Qeky8bZaE1ncqNyElcgdECaPIXJi9VWyy';
process.env.SESSION_SECRET = 'test-secret';

// Initialize mock directories
fs.mkdirSync(MOCK_OPENCLAW, { recursive: true });

test('environment setup', async (t) => {
  assert.strictEqual(process.env.HOME, MOCK_HOME);
  assert.ok(fs.existsSync(MOCK_OPENCLAW));
});

test('App integration tests', async (t) => {
  // Dynamically import the app after setting environment variables
  const { app } = await import('../src/app.js');

  await t.test('GET / login redirect', async () => {
    const response = await request(app).get('/');
    assert.strictEqual(response.status, 302);
    assert.strictEqual(response.headers.location, '/login');
  });

  await t.test('POST /login success', async () => {
    const response = await request(app)
      .post('/login')
      .send({ username: 'admin', password: 'testpassword' })
      .expect(302);

    assert.strictEqual(response.headers.location, '/wizard');
    const cookies = response.headers['set-cookie'];
    assert.ok(cookies, 'Should set a session cookie');

    // Follow up request to /wizard with the cookie
    const wizardResponse = await request(app)
      .get('/wizard')
      .set('Cookie', cookies)
      .expect(200);

    assert.ok(wizardResponse.text.includes('Step 1 — Create backup'));
  });

  await t.test('POST /login failure', async () => {
    const response = await request(app)
      .post('/login')
      .send({ username: 'admin', password: 'wrongpassword' })
      .expect(401);

    assert.ok(response.text.includes('Invalid login'));
  });

  await t.test('GET /wizard without auth', async () => {
    const response = await request(app).get('/wizard').expect(302);
    assert.strictEqual(response.headers.location, '/login');
  });
});
