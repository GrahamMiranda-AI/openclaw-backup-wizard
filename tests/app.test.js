import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import bcrypt from 'bcryptjs';

let app;

describe('OpenClaw Backup Wizard', () => {
  before(async () => {
    // Set up mock environment variables for testing
    process.env.SESSION_SECRET = 'test-secret';
    process.env.ADMIN_USER = 'testadmin';
    // Password 'password123'
    process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync('password123', 10);
    process.env.APP_NAME = 'Test App';

    // Dynamically import the app after setting env vars
    const appModule = await import('../src/app.js');
    app = appModule.app;
  });

  it('redirects unauthenticated users to /login on /', async () => {
    const res = await request(app).get('/');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  it('renders the login page on GET /login', async () => {
    const res = await request(app).get('/login');
    assert.strictEqual(res.status, 200);
    assert.match(res.text, /Test App - Login/);
    assert.match(res.text, /<form method="post" action="\/login"/);
  });

  it('rejects invalid login credentials', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'testadmin', password: 'wrongpassword' });

    assert.strictEqual(res.status, 401);
    assert.match(res.text, /Invalid login/);
  });

  it('rejects login with wrong username', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'wronguser', password: 'password123' });

    assert.strictEqual(res.status, 401);
    assert.match(res.text, /Invalid login/);
  });

  it('accepts valid login credentials and redirects to /wizard', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'testadmin', password: 'password123' });

    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/wizard');

    // Make sure a cookie is set for the session
    const cookies = res.headers['set-cookie'];
    assert.ok(cookies);
    assert.ok(cookies.some(c => c.startsWith('connect.sid=')));
  });

  it('redirects to /wizard on / if authenticated', async () => {
    // First, login to get a valid session
    const loginRes = await request(app)
      .post('/login')
      .send({ username: 'testadmin', password: 'password123' });

    const cookies = loginRes.headers['set-cookie'];

    // Now request / using the session cookie
    const res = await request(app)
      .get('/')
      .set('Cookie', cookies);

    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/wizard');
  });
});
