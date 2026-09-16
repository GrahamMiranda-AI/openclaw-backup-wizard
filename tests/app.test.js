import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock environment variables before evaluating modules
process.env.HOME = path.join(__dirname, 'mock_home');
// Hash for "password" using bcryptjs with 10 rounds
process.env.ADMIN_PASSWORD_HASH = '$2a$10$GFWa/NOeyHK/gQJ651CUQOJ6Te2iggChv50Rtk2zln55gzTvCIh92';
process.env.ADMIN_USER = 'admin';

const mockHome = process.env.HOME;
const openclawDir = path.join(mockHome, '.openclaw');
fs.mkdirSync(openclawDir, { recursive: true });

test('App Tests', async (t) => {
  // Dynamically import app module after environment is set up
  const { app } = await import('../src/app.js');

  await t.test('GET /login returns login page', async () => {
    const res = await request(app).get('/login');
    assert.strictEqual(res.statusCode, 200);
    assert.match(res.text, /<form method="post" action="\/login"/);
  });

  await t.test('POST /login with correct credentials redirects to /wizard', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'admin', password: 'password' });

    assert.strictEqual(res.statusCode, 302);
    assert.strictEqual(res.headers.location, '/wizard');
  });

  await t.test('POST /login with incorrect credentials returns 401', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'admin', password: 'wrongpassword' });

    assert.strictEqual(res.statusCode, 401);
    assert.match(res.text, /Invalid login/);
  });

  await t.test('GET / redirects to /login if not authenticated', async () => {
    const res = await request(app).get('/');
    assert.strictEqual(res.statusCode, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  await t.test('GET /wizard redirects to /login if not authenticated', async () => {
    const res = await request(app).get('/wizard');
    assert.strictEqual(res.statusCode, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  await t.test('POST /backup works when authenticated', async () => {
    const agent = request.agent(app);

    // Login
    await agent.post('/login').send({ username: 'admin', password: 'password' });

    // Create backup
    const res = await agent.post('/backup');
    assert.strictEqual(res.statusCode, 302);

    // Check redirection URL string contains ok param
    const location = res.headers.location;
    assert.ok(location.startsWith('/wizard?ok='));

    const url = new URL(location, 'http://localhost');
    const okMsg = url.searchParams.get('ok');
    assert.match(okMsg, /Backup created/);
  });
});
