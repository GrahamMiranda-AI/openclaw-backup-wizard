import { test, before, after } from 'node:test';
import assert from 'node:assert';
import supertest from 'supertest';
import fs from 'fs';
import path from 'path';

let app;
const mockHome = path.join(import.meta.dirname, 'mock_home');

before(async () => {
  // Setup mock home directory to avoid testing with the real host system
  if (!fs.existsSync(mockHome)) {
    fs.mkdirSync(mockHome, { recursive: true });
  }
  const openclawDir = path.join(mockHome, '.openclaw');
  if (!fs.existsSync(openclawDir)) {
    fs.mkdirSync(openclawDir, { recursive: true });
  }

  process.env.HOME = mockHome;
  process.env.ADMIN_USER = 'testadmin';
  // Mock hash for 'testpass'
  process.env.ADMIN_PASSWORD_HASH = '$2a$10$Z.1lWmbinjyqv4NHtdBUYeP9ojMZfvLf7hXijHwetVXUSa8n7vUbi';

  // Import app after env vars are set
  const appModule = await import('../src/app.js');
  app = appModule.app;
});

after(() => {
  if (fs.existsSync(mockHome)) {
    fs.rmSync(mockHome, { recursive: true, force: true });
  }
});

test('GET /login returns login page', async () => {
  const response = await supertest(app).get('/login');
  assert.strictEqual(response.status, 200);
  assert.match(response.text, /<form method="post" action="\/login"/);
});

test('POST /login redirects to wizard with correct credentials', async () => {
  const response = await supertest(app)
    .post('/login')
    .send('username=testadmin&password=testpass')
    .set('Content-Type', 'application/x-www-form-urlencoded');

  assert.strictEqual(response.status, 302);
  assert.strictEqual(response.headers.location, '/wizard');
});

test('POST /login returns 401 with incorrect credentials', async () => {
  const response = await supertest(app)
    .post('/login')
    .send('username=testadmin&password=wrongpass')
    .set('Content-Type', 'application/x-www-form-urlencoded');

  assert.strictEqual(response.status, 401);
  assert.match(response.text, /Invalid login/);
});

test('GET / redirects to login when not authenticated', async () => {
  const response = await supertest(app).get('/');
  assert.strictEqual(response.status, 302);
  assert.strictEqual(response.headers.location, '/login');
});

test('GET /wizard redirects to login when not authenticated', async () => {
  const response = await supertest(app).get('/wizard');
  assert.strictEqual(response.status, 302);
  assert.strictEqual(response.headers.location, '/login');
});
