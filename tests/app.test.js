import { test, before, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import bcryptPkg from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MOCK_HOME = path.join(__dirname, 'mock_home');

before(async () => {
  await fs.mkdir(path.join(MOCK_HOME, '.openclaw'), { recursive: true });
  process.env.HOME = MOCK_HOME;
  process.env.ADMIN_USER = 'admin';
  process.env.ADMIN_PASSWORD_HASH = bcryptPkg.hashSync('testpass', 10);
});

after(async () => {
  await fs.rm(MOCK_HOME, { recursive: true, force: true });
});

test('App routing and auth', async (t) => {
  // Use dynamic import so that it picks up the mocked process.env variables
  const { app } = await import('../src/app.js');

  await t.test('GET /login returns login page', async () => {
    const res = await request(app).get('/login');
    assert.strictEqual(res.statusCode, 200);
    assert.match(res.text, /<form method="post" action="\/login"/);
  });

  await t.test('POST /login handles auth logic', async () => {
    const res = await request(app)
      .post('/login')
      .send('username=admin&password=testpass')
      .set('Content-Type', 'application/x-www-form-urlencoded');

    assert.strictEqual(res.statusCode, 302);
    assert.strictEqual(res.headers.location, '/wizard');
  });

  await t.test('GET /wizard redirects if not authed', async () => {
    const res = await request(app).get('/wizard');
    assert.strictEqual(res.statusCode, 302);
    assert.strictEqual(res.headers.location, '/login');
  });
});
