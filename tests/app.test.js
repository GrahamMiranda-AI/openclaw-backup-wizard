import { describe, it } from 'node:test';
import assert from 'node:assert';
import supertest from 'supertest';
import { app } from '../src/app.js';

describe('App endpoints', () => {
  it('should redirect / to /login if not authed', async () => {
    const res = await supertest(app).get('/');
    assert.strictEqual(res.statusCode, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  it('should serve the login page', async () => {
    const res = await supertest(app).get('/login');
    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.text.includes('Login'));
  });
});
