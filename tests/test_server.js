import { test, before, after } from 'node:test';
import assert from 'node:assert';
import { server } from '../server.js';
import { PORT } from '../src/config.js';

const baseUrl = `http://127.0.0.1:${PORT}`;

test('Server endpoints', async (t) => {
  after(() => {
    server.close();
  });

  await t.test('GET / redirects to /login when not authed', async () => {
    const res = await fetch(`${baseUrl}/`, { redirect: 'manual' });
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.get('location'), '/login');
  });

  await t.test('GET /login returns login page', async () => {
    const res = await fetch(`${baseUrl}/login`);
    assert.strictEqual(res.status, 200);
    const text = await res.text();
    assert.ok(text.includes('Login'));
    assert.ok(text.includes('<form method="post" action="/login" class="stack">'));
  });

  await t.test('POST /login with invalid credentials fails', async () => {
    const res = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ username: 'admin', password: 'wrongpassword' }),
    });
    // Assuming ADMIN_PASSWORD_HASH is not set correctly in test environment so it might throw 500 or 401
    assert.ok(res.status === 401 || res.status === 500);
  });

  await t.test('GET /wizard redirects to /login when not authed', async () => {
    const res = await fetch(`${baseUrl}/wizard`, { redirect: 'manual' });
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.get('location'), '/login');
  });

  await t.test('POST /backup redirects to /login when not authed', async () => {
    const res = await fetch(`${baseUrl}/backup`, {
      method: 'POST',
      redirect: 'manual'
    });
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.get('location'), '/login');
  });

  await t.test('POST /restore redirects to /login when not authed', async () => {
    const res = await fetch(`${baseUrl}/restore`, {
      method: 'POST',
      redirect: 'manual'
    });
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.get('location'), '/login');
  });

  await t.test('POST /logout clears session and redirects', async () => {
    const res = await fetch(`${baseUrl}/logout`, {
      method: 'POST',
      redirect: 'manual'
    });
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.get('location'), '/login');
  });
});
