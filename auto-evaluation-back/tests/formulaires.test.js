// backend/tests/formulaires.test.js
jest.setTimeout(30000);
console.log('🧪 formulaires.test.js loaded');

const request   = require('supertest');
const http      = require('http');
const app       = require('../server');
const sequelize = require('../utils/sequelize');

let server, baseUrl, token, catId, compId, formId;

beforeAll(async () => {
  console.log('🔹 formulaires beforeAll start');
  process.env.NODE_ENV = 'test';
  await sequelize.sync({ force: true });
  console.log('🔹 formulaires DB synced');

  server = http.createServer(app);
  await new Promise(r => server.listen(0, r));
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;
  console.log('🔹 formulaires server listening at', baseUrl);

  // Auth
  const user = { name:'Prof', email:'prof@ex.com', password:'pwd', role:'teacher' };
  await request(baseUrl).post('/api/auth/register').send(user);
  const login = await request(baseUrl).post('/api/auth/login')
                  .send({ email:user.email, password:user.password });
  token = login.body.token;
  console.log('🔹 formulaires obtained token');

  // Prereqs
  const cat = await request(baseUrl)
    .post('/api/categories')
    .set('Authorization', `Bearer ${token}`)
    .send({ name:'Math', description:'desc' });
  catId = cat.body.id;
  console.log('🔹 formulaires created category', catId);

  const comp = await request(baseUrl)
    .post('/api/competences')
    .set('Authorization', `Bearer ${token}`)
    .send({ name:'Algo', description:'desc', categoryId:catId });
  compId = comp.body.id;
  console.log('🔹 formulaires created competence', compId);
});

afterAll(async () => {
  console.log('🔸 formulaires afterAll start');
  await new Promise(r => server.close(r));
  console.log('🔸 formulaires HTTP server closed');
  await sequelize.close();
  console.log('🔸 formulaires DB connection closed');
});

describe('Formulaire routes', () => {
  it('GET /api/formulaires → empty', async () => {
    console.log('▶️ formulaires GET empty start');
    const res = await request(baseUrl)
      .get('/api/formulaires')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    console.log('◀️ formulaires GET empty response:', res.body);
    expect(res.body).toEqual([]);
  });

  it('POST /api/formulaires → create', async () => {
    console.log('▶️ formulaires POST create start');
    const res = await request(baseUrl)
      .post('/api/formulaires')
      .set('Authorization', `Bearer ${token}`)
      .send({ title:'Test Form', competences:[compId] })
      .expect(201);
    console.log('◀️ formulaires POST create response:', res.body);
    formId = res.body.id;
  });

  it('GET /api/formulaires/:id → single', async () => {
    console.log('▶️ formulaires GET single start');
    const res = await request(baseUrl)
      .get(`/api/formulaires/${formId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    console.log('◀️ formulaires GET single response:', res.body);
    expect(res.body.id).toBe(formId);
    expect(res.body.competences).toEqual([compId]);
  });

  it('PUT /api/formulaires/:id → update', async () => {
    console.log('▶️ formulaires PUT update start');
    const res = await request(baseUrl)
      .put(`/api/formulaires/${formId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title:'Updated', competences:[compId] })
      .expect(200);
    console.log('◀️ formulaires PUT update response:', res.body);
    expect(res.body.title).toBe('Updated');
  });

  it('DELETE /api/formulaires/:id → delete', async () => {
    console.log('▶️ formulaires DELETE start');
    await request(baseUrl)
      .delete(`/api/formulaires/${formId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    console.log('◀️ formulaires DELETE complete');
    const res = await request(baseUrl)
      .get('/api/formulaires')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body).toEqual([]);
  });
});
