import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import request from 'supertest';
import bcryptPkg from 'bcryptjs';

const mockHome = path.join(import.meta.dirname, 'mock_home');
const mockOpenclaw = path.join(mockHome, '.openclaw');
const backupsDir = path.join(import.meta.dirname, '../backups');

process.env.HOME = mockHome;
process.env.ADMIN_USER = 'testadmin';
process.env.ADMIN_PASSWORD_HASH = bcryptPkg.hashSync('testpass', 10);

const { app } = await import('../src/app.js');

test.before(async () => {
  await fs.promises.mkdir(mockOpenclaw, { recursive: true });
});

test.after(async () => {
  await fs.promises.rm(mockHome, { recursive: true, force: true });
});

test('login mechanism', async (t) => {
  await t.test('rejects invalid credentials', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'testadmin', password: 'wrongpassword' });

    assert.strictEqual(res.statusCode, 401);
  });

  await t.test('accepts valid credentials', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'testadmin', password: 'testpass' });

    assert.strictEqual(res.statusCode, 302);
    assert.strictEqual(res.headers.location, '/wizard');
  });
});

test('backup and restore', async (t) => {
  let cookie;
  let backupFile;

  await t.test('login', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'testadmin', password: 'testpass' });
    cookie = res.headers['set-cookie'];
  });

  await t.test('create backup', async () => {
    const res = await request(app)
      .post('/backup')
      .set('Cookie', cookie)
      .send();

    assert.strictEqual(res.statusCode, 302);
    const redirectUrl = res.headers.location;
    const urlParams = new URLSearchParams(redirectUrl.split('?')[1]);
    const message = urlParams.get('ok');
    assert.ok(message.includes('Backup created:'));

    backupFile = message.split('Backup created: ')[1].trim();
  });

  await t.test('download backup', async () => {
    const res = await request(app)
      .get(`/download/${backupFile}`)
      .set('Cookie', cookie)
      .send();

    assert.strictEqual(res.statusCode, 200);
  });

  await t.test('restore backup', async () => {
    const backupPath = path.join(backupsDir, backupFile);

    const res = await request(app)
      .post('/restore')
      .set('Cookie', cookie)
      .field('confirm', 'yes')
      .attach('backup', backupPath);

    assert.strictEqual(res.statusCode, 302);
    const redirectUrl = res.headers.location;
    const urlParams = new URLSearchParams(redirectUrl.split('?')[1]);
    const message = urlParams.get('ok');
    assert.ok(message.includes('Restore completed'));
  });

  await t.test('delete backup', async () => {
    const res = await request(app)
      .post('/delete-backup')
      .set('Cookie', cookie)
      .send({ name: backupFile });

    assert.strictEqual(res.statusCode, 302);
    const redirectUrl = res.headers.location;
    const urlParams = new URLSearchParams(redirectUrl.split('?')[1]);
    const message = urlParams.get('ok');
    assert.ok(message.includes('Backup deleted'));
  });
});
