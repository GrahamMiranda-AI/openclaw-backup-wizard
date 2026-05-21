import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import bcrypt from 'bcryptjs';

test('App Integration Tests', async (t) => {
  // Set up mocked process.env for tests
  process.env.ADMIN_USER = 'testadmin';
  process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync('testpass123', 10);
  process.env.SESSION_SECRET = 'test-secret';

  // Import app dynamically after setting environment variables
  const { app } = await import('../src/app.js');

  await t.test('GET /login returns login page', async () => {
    const res = await request(app).get('/login');
    assert.strictEqual(res.status, 200);
    assert.match(res.text, /<form method="post" action="\/login"/);
  });

  await t.test('POST /login with correct credentials redirects to /wizard', async () => {
    const res = await request(app)
      .post('/login')
      .send('username=testadmin&password=testpass123')
      .set('Content-Type', 'application/x-www-form-urlencoded');

    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/wizard');
  });

  await t.test('POST /login with incorrect credentials returns 401', async () => {
    const res = await request(app)
      .post('/login')
      .send('username=testadmin&password=wrongpass')
      .set('Content-Type', 'application/x-www-form-urlencoded');

    assert.strictEqual(res.status, 401);
    assert.match(res.text, /Invalid login/);
  });

  await t.test('GET /wizard without auth redirects to /login', async () => {
    const res = await request(app).get('/wizard');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });
});
