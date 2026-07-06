import { describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';

process.env.APP_NAME = 'Test Wizard';
process.env.SESSION_SECRET = 'test-secret';
process.env.ADMIN_USER = 'testadmin';
// Hash for 'testpass'
process.env.ADMIN_PASSWORD_HASH = '$2a$10$wE7/5GzMvK2iXy.zT4X5/uV0B.qR7oR9zM8mPz0XfK/2I/eC2Gz7q';

const { app } = await import('../src/app.js');

describe('App routes', () => {
  it('GET / should redirect to /login if unauthenticated', async () => {
    const res = await request(app).get('/');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  it('GET /login should render the login page', async () => {
    const res = await request(app).get('/login');
    assert.strictEqual(res.status, 200);
    assert.ok(res.text.includes('Test Wizard - Login'));
  });
});
