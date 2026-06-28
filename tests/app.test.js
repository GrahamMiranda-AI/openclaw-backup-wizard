import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import bcrypt from 'bcryptjs';

// Setup mock environment before ESM hoisting evaluates the app
process.env.PORT = '8080';
process.env.APP_NAME = 'Test Wizard';
process.env.ADMIN_USER = 'testadmin';
process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync('testpass', 10);

const { app } = await import('../src/app.js');

test('GET /login should render the login page', async () => {
  const res = await request(app).get('/login');
  assert.strictEqual(res.status, 200);
  assert.match(res.text, /Test Wizard - Login/);
});

test('POST /login with correct credentials sets session and redirects', async () => {
  const res = await request(app)
    .post('/login')
    .type('form')
    .send({ username: 'testadmin', password: 'testpass' });

  assert.strictEqual(res.status, 302);
  assert.strictEqual(res.headers.location, '/wizard');

  const cookies = res.headers['set-cookie'];
  assert.ok(cookies && cookies.length > 0, 'Should set a session cookie');
});

test('POST /login with incorrect credentials returns 401', async () => {
  const res = await request(app)
    .post('/login')
    .type('form')
    .send({ username: 'testadmin', password: 'wrongpass' });

  assert.strictEqual(res.status, 401);
  assert.match(res.text, /Invalid login/);
});

test('GET /wizard without authentication redirects to login', async () => {
  const res = await request(app).get('/wizard');
  assert.strictEqual(res.status, 302);
  assert.strictEqual(res.headers.location, '/login');
});

test('GET /wizard with valid session renders the wizard page', async () => {
  const agent = request.agent(app);

  await agent
    .post('/login')
    .type('form')
    .send({ username: 'testadmin', password: 'testpass' });

  const res = await agent.get('/wizard');

  assert.strictEqual(res.status, 200);
  assert.match(res.text, /Test Wizard - Wizard/);
});
