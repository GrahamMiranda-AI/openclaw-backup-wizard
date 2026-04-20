import { describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';

describe('App', async () => {
  // Set up mock process variables
  process.env.APP_NAME = 'Test Wizard';
  process.env.ADMIN_USER = 'testadmin';
  process.env.ADMIN_PASSWORD_HASH = 'mockhash';
  process.env.PORT = '3000';

  const { app } = await import('../src/app.js');

  it('redirects to /login if not authenticated on /', async () => {
    const res = await request(app).get('/');
    assert.strictEqual(res.statusCode, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  it('redirects to /login if not authenticated on /wizard', async () => {
    const res = await request(app).get('/wizard');
    assert.strictEqual(res.statusCode, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  it('renders login page on GET /login', async () => {
    const res = await request(app).get('/login');
    assert.strictEqual(res.statusCode, 200);
    assert.match(res.text, /Test Wizard/);
    assert.match(res.text, /Login/);
  });
});
