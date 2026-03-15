const request = require('supertest');
const app     = require('../server');

describe('Auth API', () => {
  const testUser = {
    name:     'Test User',
    handle:   `testuser_${Date.now()}`,
    email:    `test_${Date.now()}@example.com`,
    password: 'SecurePass123!',
    persona:  'Founder',
  };

  let accessToken;
  let refreshToken;

  test('POST /api/auth/register — creates a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('refreshToken');
    expect(res.body.data.user.email).toBe(testUser.email);

    accessToken  = res.body.data.accessToken;
    refreshToken = res.body.data.refreshToken;
  });

  test('POST /api/auth/register — rejects duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser)
      .expect(409);

    expect(res.body.success).toBe(false);
  });

  test('POST /api/auth/login — authenticates valid user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testUser.email);
    accessToken  = res.body.data.accessToken;
    refreshToken = res.body.data.refreshToken;
  });

  test('POST /api/auth/login — rejects invalid password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'wrongpassword' })
      .expect(401);

    expect(res.body.success).toBe(false);
  });

  test('GET /api/auth/me — returns current user with valid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(testUser.email);
  });

  test('GET /api/auth/me — rejects request without token', async () => {
    await request(app).get('/api/auth/me').expect(401);
  });

  test('POST /api/auth/refresh — rotates refresh token', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('refreshToken');
  });

  test('POST /api/auth/logout — revokes session', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .send({ refreshToken })
      .expect(200);

    expect(res.body.success).toBe(true);
  });
});
