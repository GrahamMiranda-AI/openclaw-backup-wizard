import test from 'node:test';
import assert from 'node:assert';
import app from '../server.js';
import { APP_NAME } from '../src/config.js';

test('Server responds to /login with correct title', async (t) => {
  // Start the server for testing on a dynamic port
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.on('listening', async () => {
      const port = server.address().port;
      try {
        const response = await fetch(`http://127.0.0.1:${port}/login`);
        assert.strictEqual(response.status, 200, 'Expected status code 200');

        const body = await response.text();
        assert.ok(body.includes(`<title>${APP_NAME} - Login</title>`), 'Expected title to be present in response body');
        assert.ok(body.includes('<form method="post" action="/login" class="stack">'), 'Expected login form to be present in response body');
        resolve();
      } catch (err) {
        reject(err);
      } finally {
        server.close();
        server.closeAllConnections();
      }
    });
  });
});
