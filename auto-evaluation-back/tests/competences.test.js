// backend/tests/competences.test.js
jest.setTimeout(30000);
console.log('🧪 competences.test.js loaded');

const request   = require('supertest');
const http      = require('http');
const app       = require('../server');
const sequelize = require('../utils/sequelize');

let server, baseUrl, token, catId, compId;

beforeAll(async () => {
  console.log('🔹 competences beforeAll start');
  process.env.NODE_ENV = 'test';
  await sequelize.sync({ force: true });
  console.log('🔹 competences DB synced');

  server = http.createServer(app);
  await new Promise(r => server.listen(0, r));
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;
  console.log('🔹 competences server listening at', baseUrl);

  // Auth + category
  const user = { name:'Toto', email:'toto@ex.com', password:'pwd', role:'teacher' };
  await request(baseUrl).post('/api/auth/register').send(user);
  const login = await request(baseUrl).post('/api/auth/login')
                  .send({ email:user.email, password:user.password });
  token = login.body.token;
  console.log('🔹 competences obtained token');

  const cat = await request(baseUrl)
    .post('/api/categories')
    .set('Authorization', `Bearer ${token}`)
    .send({ name:'Math', description:'desc' });
  catId = cat.body.id;
  console.log('🔹 competences created category', catId);
});

afterAll(async () => {
  console.log('🔸 competences afterAll start');
  await new Promise(r => server.close(r));
  console.log('🔸 competences HTTP server closed');
  await sequelize.close();
  console.log('🔸 competences DB connection closed');
});

describe('Competence routes', () => {
  it('GET /api/competences → empty', async () => {
    console.log('▶️ competences GET empty start');
    const res = await request(baseUrl)
      .get('/api/competences')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    console.log('◀️ competences GET empty response:', res.body);
    expect(res.body).toEqual([]);
  });

  it('POST /api/competences → create', async () => {
    console.log('▶️ competences POST create start');
    const payload = { name:'Algèbre', description:'desc', categoryId:catId };
    const res = await request(baseUrl)
      .post('/api/competences')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(201);
    console.log('◀️ competences POST create response:', res.body);
    compId = res.body.id;
  });

  it('GET /api/competences/:id → single', async () => {
    console.log('▶️ competences GET single start');
    const res = await request(baseUrl)
      .get(`/api/competences/${compId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    console.log('◀️ competences GET single response:', res.body);
    expect(res.body.id).toBe(compId);
  });

  it('PUT /api/competences/:id → update', async () => {
    console.log('▶️ competences PUT update start');
    const res = await request(baseUrl)
      .put(`/api/competences/${compId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name:'Géométrie', description:'desc', categoryId:catId })
      .expect(200);
    console.log('◀️ competences PUT update response:', res.body);
    expect(res.body.name).toBe('Géométrie');
  });

  it('DELETE /api/competences/:id → delete', async () => {
    console.log('▶️ competences DELETE start');
    await request(baseUrl)
      .delete(`/api/competences/${compId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    console.log('◀️ competences DELETE complete');
    const res = await request(baseUrl)
      .get('/api/competences')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body).toEqual([]);
  });
});
