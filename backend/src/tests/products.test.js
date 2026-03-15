const request = require('supertest');
const app     = require('../server');

describe('Products API', () => {
  test('GET /api/products — returns product list', async () => {
    const res = await request(app).get('/api/products').expect(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body).toHaveProperty('pagination');
  });

  test('GET /api/products — supports sort parameter', async () => {
    const res = await request(app).get('/api/products?sort=newest').expect(200);
    expect(res.body.success).toBe(true);
  });

  test('GET /api/products — supports industry filter', async () => {
    const res = await request(app).get('/api/products?industry=SaaS').expect(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('GET /api/products/:id — returns 404 for invalid UUID', async () => {
    const res = await request(app).get('/api/products/not-a-uuid').expect(404);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/products/:id — returns 404 for non-existent product', async () => {
    const res = await request(app)
      .get('/api/products/00000000-0000-0000-0000-000000000000')
      .expect(404);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/products — rejects unauthenticated requests', async () => {
    const res = await request(app)
      .post('/api/products')
      .send({ name: 'Test', tagline: 'Test tagline', industry: 'SaaS' })
      .expect(401);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/stats/summary — returns platform stats', async () => {
    const res = await request(app).get('/api/stats/summary').expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('products');
    expect(res.body.data).toHaveProperty('founders');
  });

  test('GET /api/stats/directory — returns directory stats', async () => {
    const res = await request(app).get('/api/stats/directory').expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('industries');
    expect(res.body.data).toHaveProperty('countries');
  });

  test('GET /api/health — returns 200', async () => {
    const res = await request(app).get('/api/health').expect(200);
    expect(res.body.success).toBe(true);
  });
});
