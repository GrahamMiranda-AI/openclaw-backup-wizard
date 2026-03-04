import test from 'node:test';
import assert from 'node:assert';
import app from '../server.js';
import http from 'http';

test('Server initializes and responds to /login', async (t) => {
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  const response = await fetch(`http://localhost:${port}/login`);
  assert.strictEqual(response.status, 200, 'Expected 200 OK for /login');

  const text = await response.text();
  assert.match(text, /Login/, 'Expected HTML body to contain "Login"');

  server.close();
});
