import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import fs from 'fs';
import path from 'path';

test('App Tests', async (t) => {
  const mockHome = path.join(import.meta.dirname, 'mock_home');
  const mockOpenclaw = path.join(mockHome, '.openclaw');

  // Ensure fresh state
  if (fs.existsSync(mockHome)) fs.rmSync(mockHome, { recursive: true, force: true });
  fs.mkdirSync(mockOpenclaw, { recursive: true });

  process.env.HOME = mockHome;
  process.env.ADMIN_USER = 'testadmin';
  process.env.ADMIN_PASSWORD_HASH = '$2a$10$YjCVyAQnehz2cLZQjVXQgeGdn2htoV0L3XxqVSP49uZqJ0iBo5BKe'; // 'TestPass123'

  const { app } = await import('../src/app.js');

  let cookie;

  await t.test('Unauthenticated user is redirected to login', async () => {
    const res = await request(app).get('/');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  await t.test('Unauthenticated user is redirected to login for wizard', async () => {
    const res = await request(app).get('/wizard');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  await t.test('Successful login sets session and redirects to wizard', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'testadmin', password: 'TestPass123' });

    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/wizard');

    // Save the session cookie for subsequent requests
    cookie = res.headers['set-cookie'][0].split(';')[0];
  });

  await t.test('Authenticated user can access wizard', async () => {
    const res = await request(app)
      .get('/wizard')
      .set('Cookie', cookie);

    assert.strictEqual(res.status, 200);
    assert.ok(res.text.includes('Step 1 — Create backup'));
  });

  await t.test('Can create a backup', async () => {
    const res = await request(app)
      .post('/backup')
      .set('Cookie', cookie);

    assert.strictEqual(res.status, 302);
    assert.ok(res.headers.location.includes('/wizard?ok=Backup%20created'));
  });

  await t.test('Can logout', async () => {
    const res = await request(app)
      .post('/logout')
      .set('Cookie', cookie);

    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');

    const protectedRes = await request(app).get('/wizard');
    assert.strictEqual(protectedRes.status, 302);
  });
});
