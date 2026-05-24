import test from 'node:test';
import assert from 'node:assert';
import supertest from 'supertest';
import bcrypt from 'bcryptjs';

// Set up process.env mocks BEFORE importing app.js
process.env.ADMIN_USER = 'admin';
process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync('testpass', 10);
process.env.SESSION_SECRET = 'test-secret';

const { app } = await import('../src/app.js');
const request = supertest(app);

test('app basic flow', async (t) => {
  let sessionCookie = '';

  await t.test('GET / redirects to /login when unauthenticated', async () => {
    const res = await request.get('/');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  await t.test('GET /login returns HTML with login form', async () => {
    const res = await request.get('/login');
    assert.strictEqual(res.status, 200);
    assert.match(res.text, /<form method="post" action="\/login"/);
  });

  await t.test('POST /login with bad credentials fails', async () => {
    const res = await request.post('/login').send({ username: 'admin', password: 'wrongpassword' });
    assert.strictEqual(res.status, 401);
    assert.match(res.text, /Invalid login/);
  });

  await t.test('POST /login with good credentials succeeds and sets cookie', async () => {
    const res = await request.post('/login').send({ username: 'admin', password: 'testpass' });
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/wizard');

    // Save the session cookie for subsequent authenticated requests
    const cookies = res.headers['set-cookie'];
    assert.ok(cookies, 'Expected set-cookie header');
    sessionCookie = cookies[0].split(';')[0];
  });

  await t.test('GET / redirects to /wizard when authenticated', async () => {
    const res = await request.get('/').set('Cookie', sessionCookie);
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/wizard');
  });

  await t.test('GET /wizard returns HTML when authenticated', async () => {
    const res = await request.get('/wizard').set('Cookie', sessionCookie);
    assert.strictEqual(res.status, 200);
    assert.match(res.text, /Step 1 — Create backup/);
  });

  await t.test('POST /logout redirects to /login and clears session', async () => {
    const res = await request.post('/logout').set('Cookie', sessionCookie);
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });
});
