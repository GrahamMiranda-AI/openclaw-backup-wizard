import request from 'supertest';
import fs from 'fs';
import path from 'path';

const mockHome = path.join(import.meta.dirname, 'mock_home');
const mockOpenclaw = path.join(mockHome, '.openclaw');

if (fs.existsSync(mockHome)) fs.rmSync(mockHome, { recursive: true, force: true });
fs.mkdirSync(mockOpenclaw, { recursive: true });

process.env.HOME = mockHome;
process.env.ADMIN_USER = 'testadmin';
process.env.ADMIN_PASSWORD_HASH = '$2a$10$YjCVyAQnehz2cLZQjVXQgeGdn2htoV0L3XxqVSP49uZqJ0iBo5BKe'; // 'TestPass123'

const { app } = await import('./src/app.js');

(async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'testadmin', password: 'TestPass123' });
    const cookie = res.headers['set-cookie'][0].split(';')[0];

    const res2 = await request(app).get('/wizard').set('Cookie', cookie);
    console.log(res2.text);
})()
