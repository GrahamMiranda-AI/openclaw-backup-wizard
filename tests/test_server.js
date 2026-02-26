const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const app = require('../server.js');

const PORT = 9999;
const BASE_URL = `http://localhost:${PORT}`;

let serverInstance;

describe('OpenClaw Backup Wizard', () => {

  before(async () => {
    return new Promise((resolve) => {
      serverInstance = app.listen(PORT, () => {
        resolve();
      });
    });
  });

  after(() => {
    if (serverInstance) {
      serverInstance.close();
    }
  });

  test('GET / should redirect to /login when unauthenticated', (t, done) => {
    http.get(`${BASE_URL}/`, (res) => {
      // In src/routes.js:
      // router.get('/', (req, res) => {
      //   if (!req.session?.authed) return res.redirect('/login');
      //   return res.redirect('/wizard');
      // });

      // So if unauthenticated, it redirects to /login.

      assert.strictEqual(res.statusCode, 302);
      assert.strictEqual(res.headers.location, '/login');
      done();
    });
  });

  test('GET /wizard should redirect to /login when unauthenticated', (t, done) => {
    http.get(`${BASE_URL}/wizard`, (res) => {
        assert.strictEqual(res.statusCode, 302);
        assert.strictEqual(res.headers.location, '/login');
        done();
      });
  });

  test('GET /login should return 200 and contain login form', (t, done) => {
    http.get(`${BASE_URL}/login`, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        assert.strictEqual(res.statusCode, 200);
        assert.match(data, /Login/);
        assert.match(data, /<form/);
        done();
      });
    });
  });
});
