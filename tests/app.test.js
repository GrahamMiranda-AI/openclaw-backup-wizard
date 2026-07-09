import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import bcryptPkg from 'bcryptjs';

const { hashSync } = bcryptPkg;

test('Application integration tests', async (t) => {
  // Set up mock environment variables
  process.env.ADMIN_USER = 'testadmin';
  process.env.ADMIN_PASSWORD_HASH = hashSync('testpass', 10);
  process.env.APP_NAME = 'Test Wizard';

  // Dynamically import app after setting env vars
  const { app } = await import('../src/app.js');

  await t.test('Unauthenticated user should be redirected to login from /', async () => {
    const response = await request(app).get('/');
    assert.strictEqual(response.status, 302);
    assert.strictEqual(response.headers.location, '/login');
  });

  await t.test('Unauthenticated user should be redirected to login from /wizard', async () => {
    const response = await request(app).get('/wizard');
    assert.strictEqual(response.status, 302);
    assert.strictEqual(response.headers.location, '/login');
  });

  await t.test('GET /login should render login page', async () => {
    const response = await request(app).get('/login');
    assert.strictEqual(response.status, 200);
    assert.ok(response.text.includes('Login'));
    assert.ok(response.text.includes('Test Wizard'));
  });

  await t.test('POST /login with invalid credentials should fail', async () => {
    const response = await request(app)
      .post('/login')
      .type('form')
      .send({ username: 'testadmin', password: 'wrongpassword' });

    assert.strictEqual(response.status, 401);
    assert.ok(response.text.includes('Invalid login.'));
  });

  await t.test('POST /login with valid credentials should succeed and redirect', async () => {
    const response = await request(app)
      .post('/login')
      .type('form')
      .send({ username: 'testadmin', password: 'testpass' });

    assert.strictEqual(response.status, 302);
    assert.strictEqual(response.headers.location, '/wizard');

    // Extract session cookie to test authenticated routes
    const cookie = response.headers['set-cookie'];

    const wizardResponse = await request(app)
      .get('/wizard')
      .set('Cookie', cookie);

    assert.strictEqual(wizardResponse.status, 200);
    assert.ok(wizardResponse.text.includes('Step 1 — Create backup'));
  });
});
