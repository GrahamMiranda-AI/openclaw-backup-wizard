import test from 'node:test';
import assert from 'node:assert';
import supertest from 'supertest';
import bcrypt from 'bcryptjs';

// Set up mock environment variables before importing the app
process.env.PORT = '4281';
process.env.APP_NAME = 'Test Wizard';
process.env.SESSION_SECRET = 'test-secret';
process.env.ADMIN_USER = 'testadmin';
process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync('testpass', 10);

const { app } = await import('../src/app.js');

test('GET /login renders the login page', async () => {
  const response = await supertest(app).get('/login');
  assert.strictEqual(response.status, 200);
  assert.match(response.text, /Test Wizard/);
  assert.match(response.text, /<form method="post" action="\/login"/);
});

test('GET / redirects to /login when unauthenticated', async () => {
  const response = await supertest(app).get('/');
  assert.strictEqual(response.status, 302);
  assert.strictEqual(response.headers.location, '/login');
});

test('POST /login with valid credentials redirects to /wizard', async () => {
  const response = await supertest(app)
    .post('/login')
    .send({ username: 'testadmin', password: 'testpass' });

  assert.strictEqual(response.status, 302);
  assert.strictEqual(response.headers.location, '/wizard');
});

test('POST /login with invalid credentials returns 401', async () => {
  const response = await supertest(app)
    .post('/login')
    .send({ username: 'testadmin', password: 'wrongpass' });

  assert.strictEqual(response.status, 401);
  assert.match(response.text, /Invalid login/);
});
