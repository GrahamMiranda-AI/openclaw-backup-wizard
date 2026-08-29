import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import path from 'path';
import bcryptPkg from 'bcryptjs';

const { hashSync } = bcryptPkg;

const MOCK_HOME = path.join(import.meta.dirname, '../mock_home');

process.env.HOME = MOCK_HOME;
process.env.ADMIN_USER = 'testadmin';
process.env.ADMIN_PASSWORD_HASH = hashSync('testpass', 10);
process.env.SESSION_SECRET = 'test-secret';

const { app } = await import('../src/app.js');

test('Application Routes', async (t) => {
  let cookies;

  await t.test('GET / should redirect to /login if not authenticated', async () => {
    const res = await request(app).get('/');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.header.location, '/login');
  });

  await t.test('GET /wizard should redirect to /login if not authenticated', async () => {
    const res = await request(app).get('/wizard');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.header.location, '/login');
  });

  await t.test('POST /login should authenticate with valid credentials', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'testadmin', password: 'testpass' });

    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.header.location, '/wizard');

    // Save cookies for authenticated requests
    cookies = res.headers['set-cookie'];
  });

  await t.test('POST /login should fail with invalid credentials', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'testadmin', password: 'wrongpass' });

    assert.strictEqual(res.status, 401);
  });

  await t.test('GET /wizard should succeed if authenticated', async () => {
    const res = await request(app)
      .get('/wizard')
      .set('Cookie', cookies);

    assert.strictEqual(res.status, 200);
    assert.match(res.text, /Step 1 — Create backup/);
  });
});
