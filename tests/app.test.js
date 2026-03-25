import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';

test('app routes', async (t) => {
  await t.test('GET / should redirect to /login when unauthenticated', async () => {
    const res = await request(app).get('/');
    assert.equal(res.status, 302);
    assert.equal(res.headers.location, '/login');
  });

  await t.test('GET /login should render the login page', async () => {
    const res = await request(app).get('/login');
    assert.equal(res.status, 200);
    assert.match(res.text, /<title>.*Login<\/title>/);
    assert.match(res.text, /Username/);
    assert.match(res.text, /Password/);
  });

  await t.test('GET /wizard should redirect to /login when unauthenticated', async () => {
    const res = await request(app).get('/wizard');
    assert.equal(res.status, 302);
    assert.equal(res.headers.location, '/login');
  });
});
