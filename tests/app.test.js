import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import bcrypt from 'bcryptjs';

// Setup mock environment before loading app
process.env.ADMIN_USER = 'admin';
process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync('testpass', 10);
process.env.SESSION_SECRET = 'test-secret';

// Dynamically import the app after env vars are set
const { app } = await import('../src/app.js');

test('Unauthenticated requests to /wizard redirect to /login', async () => {
  const res = await request(app).get('/wizard');
  assert.strictEqual(res.status, 302);
  assert.strictEqual(res.headers.location, '/login');
});

test('Valid login POST redirects to /wizard', async () => {
  const res = await request(app)
    .post('/login')
    .send({ username: 'admin', password: 'testpass' })
    .expect(302);

  assert.strictEqual(res.headers.location, '/wizard');
  // Check for the set-cookie header indicating session created
  assert.ok(res.headers['set-cookie']);
});

test('Invalid login POST returns 401', async () => {
  const res = await request(app)
    .post('/login')
    .send({ username: 'admin', password: 'wrongpassword' });

  assert.strictEqual(res.status, 401);
});

test('The /login page renders correctly', async () => {
  const res = await request(app).get('/login');
  assert.strictEqual(res.status, 200);
  assert.match(res.text, /<form method="post" action="\/login"/);
  assert.match(res.text, /Login/);
});
