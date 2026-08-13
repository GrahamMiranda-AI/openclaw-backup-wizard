import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import path from 'path';

process.env.HOME = path.join(import.meta.dirname, '../mock_home');
process.env.ADMIN_USER = 'admin';
process.env.ADMIN_PASSWORD_HASH = '$2a$10$8CsvwGbqPXt0jFDxbj5UyeI1g6OoWU5m3Z3kxMf.VPZxD9bIkuWHa'; // hash of 'test_password'

// Dynamically import app so environment variables are applied first
const { app } = await import('../src/app.js');

test('GET / redirects to /login when unauthenticated', async () => {
  const response = await request(app).get('/');
  assert.strictEqual(response.status, 302);
  assert.strictEqual(response.headers.location, '/login');
});

test('GET /wizard redirects to /login when unauthenticated', async () => {
  const response = await request(app).get('/wizard');
  assert.strictEqual(response.status, 302);
  assert.strictEqual(response.headers.location, '/login');
});

test('GET /login loads login page', async () => {
  const response = await request(app).get('/login');
  assert.strictEqual(response.status, 200);
  assert.match(response.text, /Login/);
});

test('POST /login succeeds with correct credentials', async () => {
  const response = await request(app)
    .post('/login')
    .send('username=admin&password=test_password')
    .set('Content-Type', 'application/x-www-form-urlencoded');

  assert.strictEqual(response.status, 302);
  assert.strictEqual(response.headers.location, '/wizard');
});

test('POST /login fails with incorrect credentials', async () => {
  const response = await request(app)
    .post('/login')
    .send('username=admin&password=wrong')
    .set('Content-Type', 'application/x-www-form-urlencoded');

  assert.strictEqual(response.status, 401);
  assert.match(response.text, /Invalid login/);
});
