import test from 'node:test';
import assert from 'node:assert';
import supertest from 'supertest';
import path from 'path';
import fs from 'fs';
import { promises as fsp } from 'fs';

// Mock environment variables before importing app
const mockHome = path.join(import.meta.dirname, 'mock_home');
process.env.HOME = mockHome;
process.env.ADMIN_USER = 'testadmin';
process.env.ADMIN_PASSWORD_HASH = '$2a$10$FiGfxX3/VGsCgPnXKDLkI.OWJdTAoHVSyGVWUuN0V1vSPg.nFVu7i'; // Hash for 'testpass'
process.env.SESSION_SECRET = 'test-secret';

// create mock .openclaw
fs.mkdirSync(path.join(mockHome, '.openclaw'), { recursive: true });

test('Application Routes', async (t) => {
  // Dynamically import app after env is mocked
  const { app } = await import('../src/app.js');
  const { setupRoutes } = await import('../src/routes.js');
  setupRoutes(app);

  const request = supertest.agent(app); // Use agent to persist cookies

  await t.test('GET /login returns login page', async () => {
    const response = await request.get('/login');
    assert.strictEqual(response.status, 200);
    assert.match(response.text, /<form method="post" action="\/login"/);
  });

  await t.test('GET / redirects to /login when unauthenticated', async () => {
    const response = await request.get('/');
    assert.strictEqual(response.status, 302);
    assert.strictEqual(response.headers.location, '/login');
  });

  await t.test('POST /login with invalid credentials fails', async () => {
    const response = await request.post('/login').send({
      username: 'testadmin',
      password: 'wrongpassword'
    });
    assert.strictEqual(response.status, 401);
    assert.match(response.text, /Invalid login/);
  });

  await t.test('POST /login with valid credentials succeeds', async () => {
    const response = await request.post('/login').send({
      username: 'testadmin',
      password: 'testpass'
    });
    assert.strictEqual(response.status, 302);
    assert.strictEqual(response.headers.location, '/wizard');
  });

  await t.test('GET /wizard is accessible when authenticated', async () => {
    const response = await request.get('/wizard');
    assert.strictEqual(response.status, 200);
    assert.match(response.text, /Step 1 — Create backup/);
  });

  await t.test('POST /logout redirects to login', async () => {
    const response = await request.post('/logout');
    assert.strictEqual(response.status, 302);
    assert.strictEqual(response.headers.location, '/login');
  });

  await t.test('GET /wizard redirects to /login after logout', async () => {
    const response = await request.get('/wizard');
    assert.strictEqual(response.status, 302);
    assert.strictEqual(response.headers.location, '/login');
  });

  // Cleanup mock home
  t.after(async () => {
    await fsp.rm(mockHome, { recursive: true, force: true });
  });
});
