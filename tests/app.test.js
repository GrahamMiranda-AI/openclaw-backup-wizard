import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';

// Setup mock env vars before dynamic import
process.env.ADMIN_USER = 'testadmin';
process.env.ADMIN_PASSWORD_HASH = '$2a$10$dnT5/6E9VfIRbq60HqC9S.1brCbCrlye4UszVXVAqY0qDUIYfwld.';

const { app } = await import('../src/app.js');

test('GET /login returns login page', async () => {
  const res = await request(app).get('/login');
  assert.strictEqual(res.status, 200);
  assert.match(res.text, /Login/);
});

test('POST /login with wrong credentials fails', async () => {
  const res = await request(app)
    .post('/login')
    .send({ username: 'testadmin', password: 'wrongpassword' });
  assert.strictEqual(res.status, 401);
  assert.match(res.text, /Invalid login/);
});

test('POST /login with correct credentials succeeds', async () => {
  const res = await request(app)
    .post('/login')
    .send({ username: 'testadmin', password: 'testpass' });
  assert.strictEqual(res.status, 302);
  assert.strictEqual(res.headers.location, '/wizard');
});

test('GET /wizard redirects to login if unauthenticated', async () => {
  const res = await request(app).get('/wizard');
  assert.strictEqual(res.status, 302);
  assert.strictEqual(res.headers.location, '/login');
});

test('GET / redirects to login if unauthenticated', async () => {
  const res = await request(app).get('/');
  assert.strictEqual(res.status, 302);
  assert.strictEqual(res.headers.location, '/login');
});
