import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import bcrypt from 'bcryptjs';

// Set up process.env variables before dynamic import
process.env.ADMIN_USER = 'admin';
process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync('testpass', 10);
process.env.SESSION_SECRET = 'test-secret';

const { app } = await import('../src/app.js');

test('GET / should redirect to /login when unauthenticated', async () => {
  const response = await request(app).get('/');
  assert.strictEqual(response.status, 302);
  assert.strictEqual(response.headers.location, '/login');
});

test('GET /wizard should redirect to /login when unauthenticated', async () => {
  const response = await request(app).get('/wizard');
  assert.strictEqual(response.status, 302);
  assert.strictEqual(response.headers.location, '/login');
});

test('POST /login should authenticate and redirect to /wizard', async () => {
  const agent = request.agent(app);

  const loginResponse = await agent
    .post('/login')
    .send({ username: 'admin', password: 'testpass' })
    .expect(302);

  assert.strictEqual(loginResponse.headers.location, '/wizard');

  const wizardResponse = await agent.get('/wizard');
  assert.strictEqual(wizardResponse.status, 200);
  assert.match(wizardResponse.text, /Step 1 — Create backup/);
});

test('POST /login should fail with invalid credentials', async () => {
  const response = await request(app)
    .post('/login')
    .send({ username: 'admin', password: 'wrongpassword' });

  assert.strictEqual(response.status, 401);
  assert.match(response.text, /Invalid login/);
});
