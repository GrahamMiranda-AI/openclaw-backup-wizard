import test from 'node:test';
import assert from 'node:assert';
import supertest from 'supertest';
import path from 'path';

// Mock environment variables before importing the app
process.env.APP_NAME = 'Test Wizard';
process.env.SESSION_SECRET = 'test-secret';
process.env.ADMIN_USER = 'testadmin';
process.env.ADMIN_PASSWORD_HASH = '$2a$10$bSmaNnuSNncVdWOYvXigIOZxG8XCqPMC90F6jVnNSok1EjR4uLZdq'; // hash for 'testpass'

const { app } = await import('../src/app.js');
const request = supertest(app);

test('GET /login', async () => {
  const response = await request.get('/login');
  assert.strictEqual(response.status, 200);
  assert.ok(response.text.includes('Test Wizard'));
  assert.ok(response.text.includes('<form method="post" action="/login"'));
});

test('POST /login failure', async () => {
  const response = await request.post('/login').send({
    username: 'testadmin',
    password: 'wrongpassword'
  });
  assert.strictEqual(response.status, 401);
  assert.ok(response.text.includes('Invalid login.'));
});

test('POST /login success and redirect', async () => {
  const response = await request.post('/login').send({
    username: 'testadmin',
    password: 'testpass'
  });
  assert.strictEqual(response.status, 302);
  assert.strictEqual(response.headers.location, '/wizard');

  // Follow redirect using cookie
  const cookies = response.headers['set-cookie'];

  const wizardResponse = await request.get('/wizard').set('Cookie', cookies);
  assert.strictEqual(wizardResponse.status, 200);
  assert.ok(wizardResponse.text.includes('Step 1 — Create backup'));
});

test('GET / redirects to /login if unauthenticated', async () => {
  const response = await request.get('/');
  assert.strictEqual(response.status, 302);
  assert.strictEqual(response.headers.location, '/login');
});
