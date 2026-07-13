import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import bcryptPkg from 'bcryptjs';
const { hashSync } = bcryptPkg;

test('App routing and auth tests', async (t) => {
  // Set required env variables before loading app.js to ensure hoisting doesn't evaluate with missing secrets
  process.env.SESSION_SECRET = 'test-secret';
  process.env.ADMIN_USER = 'testadmin';
  process.env.ADMIN_PASSWORD_HASH = hashSync('testpass', 10);

  const { default: app } = await import('../src/app.js');
  let sessionCookie = '';

  await t.test('GET / redirects to /login if not authenticated', async () => {
    const res = await request(app).get('/');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  await t.test('GET /login renders login page', async () => {
    const res = await request(app).get('/login');
    assert.strictEqual(res.status, 200);
    assert.match(res.text, /<form method="post" action="\/login"/);
  });

  await t.test('POST /login with bad credentials fails', async () => {
    const res = await request(app).post('/login').send({ username: 'testadmin', password: 'wrongpassword' });
    assert.strictEqual(res.status, 401);
    assert.match(res.text, /Invalid login/);
  });

  await t.test('POST /login with good credentials succeeds', async () => {
    const res = await request(app).post('/login').send({ username: 'testadmin', password: 'testpass' });
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/wizard');

    const cookies = res.headers['set-cookie'];
    assert.ok(cookies, 'Should set a session cookie');
    sessionCookie = cookies.find(c => c.startsWith('connect.sid='));
  });

  await t.test('GET /wizard with valid session succeeds', async () => {
    const res = await request(app).get('/wizard').set('Cookie', sessionCookie);
    assert.strictEqual(res.status, 200);
    assert.match(res.text, /Step 1 — Create backup/);
  });
});
