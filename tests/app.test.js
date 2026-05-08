import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import bcrypt from 'bcryptjs';

process.env.PORT = '4281'; // Avoid conflicts
process.env.APP_NAME = 'Test Wizard';
process.env.SESSION_SECRET = 'test-secret';
process.env.ADMIN_USER = 'testadmin';
process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync('testpass', 10);
process.env.HOME = '/tmp/test-home';

// Import app after env vars are set
const { app } = await import('../src/app.js');

test('GET / redirects to /login when unauthenticated', async () => {
  const res = await request(app).get('/');
  assert.strictEqual(res.status, 302);
  assert.strictEqual(res.headers.location, '/login');
});

test('GET /wizard redirects to /login when unauthenticated', async () => {
  const res = await request(app).get('/wizard');
  assert.strictEqual(res.status, 302);
  assert.strictEqual(res.headers.location, '/login');
});

test('GET /login returns 200 OK and HTML form', async () => {
  const res = await request(app).get('/login');
  assert.strictEqual(res.status, 200);
  assert.match(res.text, /<form method="post" action="\/login"/);
  assert.match(res.text, /Test Wizard - Login/);
});

test('POST /login with valid credentials redirects to /wizard', async () => {
  const res = await request(app)
    .post('/login')
    .send({ username: 'testadmin', password: 'testpass' });

  assert.strictEqual(res.status, 302);
  assert.strictEqual(res.headers.location, '/wizard');

  // Follow redirect to verify session logic
  const cookie = res.headers['set-cookie'];

  const wizardRes = await request(app)
    .get('/wizard')
    .set('Cookie', cookie);

  assert.strictEqual(wizardRes.status, 200);
  assert.match(wizardRes.text, /Test Wizard - Wizard/);
});

test('POST /login with invalid credentials returns 401', async () => {
  const res = await request(app)
    .post('/login')
    .send({ username: 'testadmin', password: 'wrongpass' });

  assert.strictEqual(res.status, 401);
  assert.match(res.text, /Invalid login/);
});
