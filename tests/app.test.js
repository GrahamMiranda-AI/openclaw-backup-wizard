import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import path from 'path';
import fs from 'fs';

const MOCK_HOME = path.join(import.meta.dirname, 'mock_home');
const fsp = fs.promises;

describe('App Tests', () => {
  let app;

  before(async () => {
    // Setup Mock Environment
    process.env.HOME = MOCK_HOME;
    process.env.ADMIN_USER = 'admin';
    // $2a$10$FC6fP.9Zmo3j1WnteeC0Z.ZjQaELEH94wzEqpsREJN5zvPKVjljLi is 'super-secret'
    process.env.ADMIN_PASSWORD_HASH = '$2a$10$FC6fP.9Zmo3j1WnteeC0Z.ZjQaELEH94wzEqpsREJN5zvPKVjljLi';

    await fsp.mkdir(path.join(MOCK_HOME, '.openclaw/workspace'), { recursive: true });

    const appModule = await import('../src/app.js');
    app = appModule.app;
  });

  after(async () => {
    if (fs.existsSync(MOCK_HOME)) {
      await fsp.rm(MOCK_HOME, { recursive: true, force: true });
    }
  });

  it('redirects to /login from / if not authenticated', async () => {
    const res = await request(app).get('/');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  it('renders login page', async () => {
    const res = await request(app).get('/login');
    assert.strictEqual(res.status, 200);
    assert.match(res.text, /Login/);
  });

  it('redirects to /wizard on successful login', async () => {
    const res = await request(app).post('/login')
      .send({ username: 'admin', password: 'super-secret' })
      .expect(302);

    assert.strictEqual(res.headers.location, '/wizard');
  });

  it('rejects invalid login', async () => {
    const res = await request(app).post('/login')
      .send({ username: 'admin', password: 'wrong-password' })
      .expect(401);

    assert.match(res.text, /Invalid login/);
  });

});
