// backend/tests/categories.test.js
jest.setTimeout(30000);
console.log('🧪 categories.test.js loaded');

const request   = require('supertest');
const http      = require('http');
const app       = require('../server');
const sequelize = require('../utils/sequelize');

let server, baseUrl, token;

beforeAll(async () => {
  console.log('🔹 categories beforeAll start');
  process.env.NODE_ENV = 'test';
  await sequelize.sync({ force: true });
  console.log('🔹 categories DB synced');

  server = http.createServer(app);
  await new Promise(r => server.listen(0, r));
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;
  console.log('🔹 categories server listening at', baseUrl);

  // Get auth token
  const user = { name:'Toto', email:'toto@ex.com', password:'pwd', role:'teacher' };
  console.log('▶️ categories registering user for token');
  await request(baseUrl).post('/api/auth/register').send(user);
  const res = await request(baseUrl).post('/api/auth/login')
                    .send({ email: user.email, password: user.password });
  token = res.body.token;
  console.log('🔹 categories obtained token');
});

afterAll(async () => {
  console.log('🔸 categories afterAll start');
  await new Promise(r => server.close(r));
  console.log('🔸 categories HTTP server closed');
  await sequelize.close();
  console.log('🔸 categories DB connection closed');
});

describe('Category routes', () => {
  let catId;

  it('GET /api/categories → empty array', async () => {
    console.log('▶️ categories GET empty array start');
    const res = await request(baseUrl)
      .get('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    console.log('◀️ categories GET empty array response:', res.body);
    expect(res.body).toEqual([]);
  });

  it('POST /api/categories → create', async () => {
    console.log('▶️ categories POST create start');
    const payload = { name:'Math', description:'desc' };
    const res = await request(baseUrl)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(201);
    console.log('◀️ categories POST create response:', res.body);
    expect(res.body.id).toBeDefined();
    catId = res.body.id;
  });

  it('GET /api/categories/:id → single', async () => {
    console.log('▶️ categories GET single start');
    const res = await request(baseUrl)
      .get(`/api/categories/${catId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    console.log('◀️ categories GET single response:', res.body);
    expect(res.body.id).toBe(catId);
  });

  it('PUT /api/categories/:id → update', async () => {
    console.log('▶️ categories PUT update start');
    const res = await request(baseUrl)
      .put(`/api/categories/${catId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name:'Physics', description:'desc' })
      .expect(200);
    console.log('◀️ categories PUT update response:', res.body);
    expect(res.body.name).toBe('Physics');
  });

  it('DELETE /api/categories/:id → delete', async () => {
    console.log('▶️ categories DELETE start');
    await request(baseUrl)
      .delete(`/api/categories/${catId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    console.log('◀️ categories DELETE complete');
    const res = await request(baseUrl)
      .get('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body).toEqual([]);
  });
});
