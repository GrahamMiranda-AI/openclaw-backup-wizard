import { describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';

// Mock process.env before evaluating app modules
process.env.PORT = '4281';
process.env.SESSION_SECRET = 'test-secret';
process.env.ADMIN_USER = 'testadmin';
process.env.ADMIN_PASSWORD_HASH = 'mocked-hash';

const { app } = await import('../src/app.js');

describe('OpenClaw Backup Wizard Express App', () => {
  it('GET / should redirect to /login when unauthenticated', async () => {
    const response = await request(app).get('/');
    assert.strictEqual(response.status, 302);
    assert.strictEqual(response.header.location, '/login');
  });

  it('GET /login should return 200 OK', async () => {
    const response = await request(app).get('/login');
    assert.strictEqual(response.status, 200);
    assert.ok(response.text.includes('Login'));
  });
});
