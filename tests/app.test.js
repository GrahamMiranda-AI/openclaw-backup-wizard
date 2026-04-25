import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

describe('App Endpoints', () => {
  test('GET /login should render the login page', async () => {
    process.env.PORT = 4281;
    const { app } = await import('../src/app.js');
    const response = await request(app).get('/login');
    assert.equal(response.status, 200);
    assert.match(response.text, /Login/);
    assert.match(response.text, /OpenClaw Backup Wizard/);
  });

  test('GET / should redirect to /login', async () => {
    process.env.PORT = 4281;
    const { app } = await import('../src/app.js');
    const response = await request(app).get('/');
    assert.equal(response.status, 302);
    assert.equal(response.headers.location, '/login');
  });
});
