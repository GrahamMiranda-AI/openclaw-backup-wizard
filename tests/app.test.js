import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { app } from '../server.js';
import { APP_NAME } from '../src/config.js';

test('App routing', async (t) => {
  await t.test('GET / should redirect to /login when unauthenticated', async () => {
    const res = await request(app).get('/');
    assert.strictEqual(res.statusCode, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  await t.test('GET /login should render the login page', async () => {
    const res = await request(app).get('/login');
    assert.strictEqual(res.statusCode, 200);
    assert.match(res.text, new RegExp(`${APP_NAME} - Login`));
    assert.match(res.text, /<form method="post" action="\/login"/);
  });

  await t.test('GET /wizard should redirect to /login when unauthenticated', async () => {
    const res = await request(app).get('/wizard');
    assert.strictEqual(res.statusCode, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  await t.test('GET /logo.jpg should return 404 or image depending on workspace', async () => {
    const res = await request(app).get('/logo.jpg');
    // If workspace doesn't exist, it should return 404
    assert.ok([200, 404].includes(res.statusCode));
  });
});
