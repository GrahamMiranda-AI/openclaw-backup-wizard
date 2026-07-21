import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import bcryptPkg from 'bcryptjs';

const { hashSync } = bcryptPkg;

// Use dynamic imports to set mock environment variables prior to testing.
process.env.ADMIN_USER = 'admin';
process.env.ADMIN_PASSWORD_HASH = hashSync('testpass123', 10);
process.env.SESSION_SECRET = 'test-secret';
process.env.APP_NAME = 'Test Wizard';
process.env.PORT = '4280';

const { app } = await import('../src/app.js');

test('GET /login returns login page', async () => {
  const res = await request(app).get('/login');
  assert.strictEqual(res.status, 200);
  assert.match(res.text, /Login/);
});

test('POST /login with valid credentials redirects to /wizard', async () => {
  const agent = request.agent(app);
  const res = await agent.post('/login')
    .send('username=admin&password=testpass123')
    .set('Content-Type', 'application/x-www-form-urlencoded');

  assert.strictEqual(res.status, 302);
  assert.strictEqual(res.headers.location, '/wizard');

  // Verify access to protected route after login
  const wizardRes = await agent.get('/wizard');
  assert.strictEqual(wizardRes.status, 200);
  assert.match(wizardRes.text, /Create backup/);
});

test('POST /login with invalid credentials returns 401', async () => {
  const res = await request(app).post('/login')
    .send('username=admin&password=wrongpass')
    .set('Content-Type', 'application/x-www-form-urlencoded');

  assert.strictEqual(res.status, 401);
  assert.match(res.text, /Invalid login/);
});

test('GET /wizard without authentication redirects to /login', async () => {
  const res = await request(app).get('/wizard');
  assert.strictEqual(res.status, 302);
  assert.strictEqual(res.headers.location, '/login');
});

test('GET / without authentication redirects to /login', async () => {
  const res = await request(app).get('/');
  assert.strictEqual(res.status, 302);
  assert.strictEqual(res.headers.location, '/login');
});
