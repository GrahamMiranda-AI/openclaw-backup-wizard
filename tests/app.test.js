import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import fs from 'fs';
import path from 'path';

// Setup mocked environment first before dynamic app import
const MOCK_HOME = path.join(import.meta.dirname, 'mock_home');
if (!fs.existsSync(MOCK_HOME)) {
  fs.mkdirSync(MOCK_HOME, { recursive: true });
}
if (!fs.existsSync(path.join(MOCK_HOME, '.openclaw'))) {
  fs.mkdirSync(path.join(MOCK_HOME, '.openclaw'), { recursive: true });
}

process.env.HOME = MOCK_HOME;
process.env.ADMIN_USER = 'admin';
// Deterministic hash for 'testpass'
process.env.ADMIN_PASSWORD_HASH = '$2a$10$cPqsqXkoU1FFC413vx9w1eMMNFcpXGTjFvaWuCptF/jYqSdaAA54a';

let app;

test.before(async () => {
  // Dynamically import app so config uses mocked environment variables
  const mod = await import('../src/app.js');
  app = mod.app;
});

test.after(async () => {
  if (fs.existsSync(MOCK_HOME)) {
    fs.rmSync(MOCK_HOME, { recursive: true, force: true });
  }
});

test('GET /login renders login page', async () => {
  const res = await request(app).get('/login');
  assert.strictEqual(res.statusCode, 200);
  assert.match(res.text, /Login/);
});

test('POST /login with valid credentials redirects to /wizard and sets session', async () => {
  const res = await request(app)
    .post('/login')
    .send({ username: 'admin', password: 'testpass' });

  assert.strictEqual(res.statusCode, 302);
  assert.strictEqual(res.headers.location, '/wizard');
  assert.match(res.headers['set-cookie'][0], /connect\.sid=/);
});

test('POST /login with invalid credentials fails', async () => {
  const res = await request(app)
    .post('/login')
    .send({ username: 'admin', password: 'wrongpassword' });

  assert.strictEqual(res.statusCode, 401);
  assert.match(res.text, /Invalid login/);
});

test('GET /wizard requires authentication', async () => {
  const res = await request(app).get('/wizard');
  assert.strictEqual(res.statusCode, 302);
  assert.strictEqual(res.headers.location, '/login');
});

test('POST /backup works when authed', async () => {
  // Login first
  const agent = request.agent(app);
  await agent
    .post('/login')
    .send({ username: 'admin', password: 'testpass' });

  // Now trigger backup
  const res = await agent.post('/backup');
  assert.strictEqual(res.statusCode, 302);

  const loc = res.headers.location;
  assert.ok(loc.startsWith('/wizard?ok='), 'Should redirect with ok query string');

  // Extract URL correctly to check message
  const urlParams = new URLSearchParams(loc.split('?')[1]);
  assert.match(urlParams.get('ok'), /Backup created:/);
});
