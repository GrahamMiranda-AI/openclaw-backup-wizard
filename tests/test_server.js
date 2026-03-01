import { test, before, after } from 'node:test';
import assert from 'node:assert';
import { server } from '../server.js';
import { PORT } from '../src/config.js';

test('Server endpoints', async (t) => {
  const baseUrl = `http://127.0.0.1:${PORT}`;

  await t.test('GET /login returns 200', async () => {
    const response = await fetch(`${baseUrl}/login`);
    assert.strictEqual(response.status, 200);
    const text = await response.text();
    assert.ok(text.includes('Login'), 'Response body should contain "Login"');
  });

  await t.test('GET /wizard redirects to /login without auth', async () => {
    const response = await fetch(`${baseUrl}/wizard`, { redirect: 'manual' });
    assert.strictEqual(response.status, 302);
    assert.strictEqual(response.headers.get('location'), '/login');
  });

  after(() => {
    server.close();
  });
});
