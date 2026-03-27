import { describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../src/app.js';
import { APP_NAME } from '../src/config.js';

describe('App Routing', () => {
  it('GET / should redirect to /login when not authed', async () => {
    const res = await request(app).get('/');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  it('GET /wizard should redirect to /login when not authed', async () => {
    const res = await request(app).get('/wizard');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  it('GET /login should render the login page', async () => {
    const res = await request(app).get('/login');
    assert.strictEqual(res.status, 200);
    assert.match(res.text, new RegExp(APP_NAME + ' - Login'));
    assert.match(res.text, /<form method="post" action="\/login"/);
  });
});
