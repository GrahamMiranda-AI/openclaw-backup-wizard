import test from 'node:test';
import assert from 'node:assert';
import path from 'path';
import fs from 'fs';
import supertest from 'supertest';

// Mock env variables before evaluating any files
process.env.HOME = path.join(import.meta.dirname, 'mock_home');
// the hash corresponds to password "testpassword"
process.env.ADMIN_PASSWORD_HASH = '$2a$10$z9Av/jMNp74he7YTnFPHnucVp.v4z5l5ct209fZUpyXojpey1MnX.';
process.env.ADMIN_USER = 'admin';

const MOCK_OPENCLAW = path.join(process.env.HOME, '.openclaw');
fs.mkdirSync(MOCK_OPENCLAW, { recursive: true });

test('Application functionality tests', async (t) => {
  const { app } = await import('../src/app.js');
  const request = supertest(app);

  await t.test('GET / should redirect to /login when unauthenticated', async () => {
    const res = await request.get('/');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  await t.test('GET /login should render login page', async () => {
    const res = await request.get('/login');
    assert.strictEqual(res.status, 200);
    assert.match(res.text, /<form method="post" action="\/login"/);
  });

  await t.test('POST /login with valid credentials should redirect to /wizard', async () => {
    const res = await request.post('/login')
      .send({ username: 'admin', password: 'testpassword' })
      .expect(302);

    // Parse redirect location since query parameters could theoretically exist
    const [path] = res.headers.location.split('?');
    assert.strictEqual(path, '/wizard');
  });

  await t.test('POST /login with invalid credentials should return 401', async () => {
    const res = await request.post('/login')
      .send({ username: 'admin', password: 'wrongpassword' });
    assert.strictEqual(res.status, 401);
    assert.match(res.text, /Invalid login/);
  });
});
