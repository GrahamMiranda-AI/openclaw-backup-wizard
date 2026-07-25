import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import bcryptPkg from 'bcryptjs';
const { hashSync } = bcryptPkg;

process.env.PORT = '4281';
process.env.APP_NAME = 'Test Wizard';
process.env.SESSION_SECRET = 'test-secret';
process.env.ADMIN_USER = 'admin';
process.env.ADMIN_PASSWORD_HASH = hashSync('test-password', 10);

const { app } = await import('../src/app.js');

test('GET /login should render login page', async () => {
  const res = await request(app).get('/login');
  assert.strictEqual(res.statusCode, 200);
  assert.ok(res.text.includes('Test Wizard - Login'));
});

test('POST /login should authenticate and redirect', async () => {
  const res = await request(app)
    .post('/login')
    .send({ username: 'admin', password: 'test-password' });
  assert.strictEqual(res.statusCode, 302);
  assert.strictEqual(res.headers.location, '/wizard');
});

test('GET /wizard should redirect to login if unauthenticated', async () => {
  const res = await request(app).get('/wizard');
  assert.strictEqual(res.statusCode, 302);
  assert.strictEqual(res.headers.location, '/login');
});

test('GET / should redirect to wizard (which redirects to login)', async () => {
  const res = await request(app).get('/');
  assert.strictEqual(res.statusCode, 302);
  assert.strictEqual(res.headers.location, '/login');
});
