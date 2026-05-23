import test from 'node:test';
import assert from 'node:assert';
import supertest from 'supertest';
import bcrypt from 'bcryptjs';

// Set environment variables before dynamic imports
process.env.PORT = '4281';
process.env.APP_NAME = 'Test Wizard';
process.env.SESSION_SECRET = 'test-secret';
process.env.ADMIN_USER = 'testadmin';
process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync('testpass', 10);

const { app } = await import('../src/app.js');
const request = supertest(app);

test('Application startup and unauthenticated redirect', async (t) => {
  const res = await request.get('/');
  assert.strictEqual(res.status, 302);
  assert.strictEqual(res.headers.location, '/login');
});

test('Login page loads', async (t) => {
  const res = await request.get('/login');
  assert.strictEqual(res.status, 200);
  assert.match(res.text, /Test Wizard - Login/);
  assert.match(res.text, /<form/);
});

test('Successful login', async (t) => {
  const res = await request.post('/login').send({
    username: 'testadmin',
    password: 'testpass'
  });
  assert.strictEqual(res.status, 302);
  assert.strictEqual(res.headers.location, '/wizard');
});

test('Failed login', async (t) => {
  const res = await request.post('/login').send({
    username: 'testadmin',
    password: 'wrongpassword'
  });
  assert.strictEqual(res.status, 401);
  assert.match(res.text, /Invalid login/);
});
