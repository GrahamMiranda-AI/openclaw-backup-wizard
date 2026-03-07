import test from 'node:test';
import assert from 'node:assert';
import http from 'http';
import { server } from '../server.js';
import { PORT } from '../src/config.js';

test('Server startup and basic routing', async (t) => {
  t.after(() => {
    // Gracefully close the server after tests complete
    server.close();
  });

  await t.test('GET / should redirect to /login for unauthenticated users', () => {
    return new Promise((resolve, reject) => {
      http.get(`http://127.0.0.1:${PORT}/`, (res) => {
        try {
          // Express sends a 302 Found status code for res.redirect()
          assert.strictEqual(res.statusCode, 302);
          assert.strictEqual(res.headers.location, '/login');
          resolve();
        } catch (err) {
          reject(err);
        }
      }).on('error', reject);
    });
  });

  await t.test('GET /login should return 200 OK', () => {
    return new Promise((resolve, reject) => {
      http.get(`http://127.0.0.1:${PORT}/login`, (res) => {
        try {
          assert.strictEqual(res.statusCode, 200);
          resolve();
        } catch (err) {
          reject(err);
        }
      }).on('error', reject);
    });
  });
});
