import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import supertest from 'supertest';
import bcryptPkg from 'bcryptjs';

const mockHome = path.join(import.meta.dirname, 'mock_home');
const mockOpenClawDir = path.join(mockHome, '.openclaw');
const backupDir = path.join(import.meta.dirname, '../backups');

test.before(() => {
  fs.mkdirSync(mockOpenClawDir, { recursive: true });
});

test.after(() => {
  fs.rmSync(mockHome, { recursive: true, force: true });
});

test('App routes and authentication', async (t) => {
  // Set mock environment variables
  process.env.HOME = mockHome;
  process.env.ADMIN_USER = 'testadmin';
  const bcrypt = bcryptPkg.default || bcryptPkg;
  process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync('testpass', 10);
  process.env.SESSION_SECRET = 'testsecret';

  // Dynamically import app after setting env vars
  const { app } = await import('../src/app.js');
  const request = supertest(app);

  let cookie;

  await t.test('GET /login returns 200 and shows login form', async () => {
    const res = await request.get('/login');
    assert.strictEqual(res.status, 200);
    assert.match(res.text, /<form method="post" action="\/login"/);
  });

  await t.test('GET /wizard without auth redirects to /login', async () => {
    const res = await request.get('/wizard');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  await t.test('POST /login authenticates user and sets session cookie', async () => {
    const res = await request
      .post('/login')
      .send({ username: 'testadmin', password: 'testpass' })
      .expect(302);

    assert.strictEqual(res.headers.location, '/wizard');
    assert.ok(res.headers['set-cookie'], 'Session cookie should be set');
    cookie = res.headers['set-cookie'];
  });

  await t.test('GET /wizard with auth returns 200', async () => {
    const res = await request
      .get('/wizard')
      .set('Cookie', cookie);
    assert.strictEqual(res.status, 200);
    assert.match(res.text, /Step 1 — Create backup/);
  });

  await t.test('POST /backup creates a zip and redirects', async () => {
    // Empty out backups dir first
    if (fs.existsSync(backupDir)) {
      const files = fs.readdirSync(backupDir);
      for (const file of files) {
        fs.rmSync(path.join(backupDir, file), { recursive: true, force: true });
      }
    } else {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const res = await request
      .post('/backup')
      .set('Cookie', cookie)
      .expect(302);

    assert.match(res.headers.location, /^\/wizard\?ok=/);

    // verify backup file was created
    const files = fs.readdirSync(backupDir);
    assert.strictEqual(files.length, 1);
    assert.match(files[0], /^openclaw-backup-.*\.zip$/);
  });
});
