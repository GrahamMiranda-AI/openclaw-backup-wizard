import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import supertest from 'supertest';
import bcrypt from 'bcryptjs';

describe('App routes', () => {
  let app;

  before(async () => {
    // Set up mock environment for tests before ESM module hoisting evaluates config
    process.env.ADMIN_USER = 'admin';
    process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync('testpass', 10);
    process.env.APP_NAME = 'Test App';

    const appModule = await import('../src/app.js');
    app = appModule.app;
  });

  test('GET / redirects to /login when unauthenticated', async () => {
    const res = await supertest(app).get('/');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  test('GET /login renders login page', async () => {
    const res = await supertest(app).get('/login');
    assert.strictEqual(res.status, 200);
    assert.match(res.text, /Test App - Login/);
    assert.match(res.text, /Sign in/);
  });

  test('POST /login with valid credentials redirects to /wizard', async () => {
    const agent = supertest.agent(app);
    const res = await agent.post('/login').send({
      username: 'admin',
      password: 'testpass'
    });

    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/wizard');

    // Verify session
    const wizardRes = await agent.get('/wizard');
    assert.strictEqual(wizardRes.status, 200);
    assert.match(wizardRes.text, /Step 1 — Create backup/);
  });

  test('POST /login with invalid credentials returns 401', async () => {
    const res = await supertest(app).post('/login').send({
      username: 'admin',
      password: 'wrongpass'
    });

    assert.strictEqual(res.status, 401);
    assert.match(res.text, /Invalid login/);
  });
});
