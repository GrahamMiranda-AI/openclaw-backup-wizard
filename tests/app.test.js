import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import fs from 'fs';
import path from 'path';

// Setup mock environment variables before importing app
process.env.ADMIN_USER = 'testadmin';
// bcrypt hash for 'testpass'
process.env.ADMIN_PASSWORD_HASH = '$2a$10$DUKKKf4xUewAj81CWN3Twu12.hyCln8nI/oqpl77Eh0.f3/R/7iya';
process.env.SESSION_SECRET = 'testsecret';
process.env.HOME = path.join(import.meta.dirname, 'mock_home');

fs.mkdirSync(path.join(process.env.HOME, '.openclaw/workspace'), { recursive: true });

// Dynamic import to ensure process.env changes are respected by config.js
const { app } = await import('../src/app.js');

test('GET /login returns login page', async () => {
  const response = await request(app).get('/login');
  assert.strictEqual(response.status, 200);
  assert.match(response.text, /Login/);
});

test('POST /login with invalid credentials fails', async () => {
  const response = await request(app)
    .post('/login')
    .send({ username: 'testadmin', password: 'wrongpassword' });
  assert.strictEqual(response.status, 401);
  assert.match(response.text, /Invalid login/);
});

test('POST /login with valid credentials redirects to /wizard', async () => {
  const response = await request(app)
    .post('/login')
    .send({ username: 'testadmin', password: 'testpass' });
  assert.strictEqual(response.status, 302);
  assert.strictEqual(response.headers.location, '/wizard');
});

test('GET /wizard is protected', async () => {
  const response = await request(app).get('/wizard');
  assert.strictEqual(response.status, 302);
  assert.strictEqual(response.headers.location, '/login');
});

test('GET /wizard is accessible when authenticated', async () => {
  const loginRes = await request(app)
    .post('/login')
    .send({ username: 'testadmin', password: 'testpass' });

  const cookie = loginRes.headers['set-cookie'];

  const wizardRes = await request(app)
    .get('/wizard')
    .set('Cookie', cookie);

  assert.strictEqual(wizardRes.status, 200);
  assert.match(wizardRes.text, /Step 1 — Create backup/);
});

test('POST /backup creates a backup', async () => {
  const loginRes = await request(app)
    .post('/login')
    .send({ username: 'testadmin', password: 'testpass' });

  const cookie = loginRes.headers['set-cookie'];

  const response = await request(app)
    .post('/backup')
    .set('Cookie', cookie);

  assert.strictEqual(response.status, 302);
  assert.match(response.headers.location, /^\/wizard\?ok=Backup%20created/);
});

test('POST /restore requires confirmation', async () => {
  const loginRes = await request(app)
    .post('/login')
    .send({ username: 'testadmin', password: 'testpass' });

  const cookie = loginRes.headers['set-cookie'];

  // Create a dummy zip file
  const dummyZipPath = path.join(import.meta.dirname, 'dummy.zip');
  fs.writeFileSync(dummyZipPath, 'dummy data');

  const response = await request(app)
    .post('/restore')
    .set('Cookie', cookie)
    .attach('backup', dummyZipPath);

  assert.strictEqual(response.status, 500);
  assert.match(response.text, /Confirmation required/);

  fs.unlinkSync(dummyZipPath);
});
