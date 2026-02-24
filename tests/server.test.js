import request from 'supertest';
import app from '../src/app.js';

describe('Server Endpoints', () => {
  it('should redirect / to /login', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toBe('/login');
  });

  it('should serve the login page', async () => {
    const res = await request(app).get('/login');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Login');
  });

  it('should reject invalid login', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'admin', password: 'wrongpassword' });
    expect(res.statusCode).toEqual(401);
  });

  it('should redirect /wizard if not authenticated', async () => {
    const res = await request(app).get('/wizard');
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toBe('/login'); // My middleware might return 401 JSON if accepts JSON, but supertest sets Accept header? No.
    // However, my middleware checks req.accepts('html'). Browsers send it. Supertest defaults might not.
    // If supertest doesn't send Accept: text/html, it might get JSON 401.
    // Let's force HTML.
  });

  it('should redirect /wizard if not authenticated (HTML)', async () => {
    const res = await request(app).get('/wizard').set('Accept', 'text/html');
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toBe('/login');
  });

  it('should return 401 JSON if not authenticated (JSON)', async () => {
    const res = await request(app).get('/wizard').set('Accept', 'application/json');
    expect(res.statusCode).toEqual(401);
    expect(res.body.error).toBe('Unauthorized');
  });
});
