import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import fs from 'fs';
import path from 'path';

// Setup mock environment before loading app.js
const MOCK_HOME = path.join(import.meta.dirname, 'mock_home');
process.env.HOME = MOCK_HOME;
process.env.ADMIN_USER = 'admin';
// Use the hash for 'TestPass123!'
process.env.ADMIN_PASSWORD_HASH = '$2a$10$NWE1ktyPCSmgUYSkQS9Xx.tyD.ZD2lytkz/0ThcGg1FrfHE06829a';
process.env.SESSION_SECRET = 'test-secret';

fs.mkdirSync(path.join(MOCK_HOME, '.openclaw'), { recursive: true });

// Dynamic import needed so the environment variables set above are used
const { default: app } = await import('../src/app.js');

test('GET / should redirect unauthenticated user to /login', async () => {
  const response = await request(app).get('/');
  assert.strictEqual(response.status, 302);
  assert.strictEqual(response.header.location, '/login');
});

test('GET /wizard should redirect unauthenticated user to /login', async () => {
  const response = await request(app).get('/wizard');
  assert.strictEqual(response.status, 302);
  assert.strictEqual(response.header.location, '/login');
});

test('GET /login should display the login page', async () => {
  const response = await request(app).get('/login');
  assert.strictEqual(response.status, 200);
  assert.match(response.text, /<form method="post" action="\/login"/);
});

test('POST /login with valid credentials should authenticate and redirect to /wizard', async () => {
  const response = await request(app)
    .post('/login')
    .type('form')
    .send({ username: 'admin', password: 'TestPass123!' });

  assert.strictEqual(response.status, 302);
  assert.strictEqual(response.header.location, '/wizard');
});

test('POST /login with invalid credentials should return 401', async () => {
  const response = await request(app)
    .post('/login')
    .type('form')
    .send({ username: 'admin', password: 'WrongPassword!' });

  assert.strictEqual(response.status, 401);
  assert.match(response.text, /Invalid login\./);
});
