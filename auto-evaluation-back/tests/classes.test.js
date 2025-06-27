// backend/tests/classes.test.js
jest.setTimeout(30000);
console.log('🧪 classes.test.js loaded');

const request   = require('supertest');
const http      = require('http');
const app       = require('../server');
const sequelize = require('../utils/sequelize');

let server, baseUrl, token, classId;

beforeAll(async () => {
  console.log('🔹 classes beforeAll start');
  process.env.NODE_ENV = 'test';
  await sequelize.sync({ force: true });
  console.log('🔹 classes DB synced');

  server = http.createServer(app);
  await new Promise(r => server.listen(0, r));
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;
  console.log('🔹 classes server listening at', baseUrl);

  // Auth
  const user = { name:'Prof', email:'prof@ex.com', password:'pwd', role:'teacher' };
  await request(baseUrl).post('/api/auth/register').send(user);
  const login = await request(baseUrl).post('/api/auth/login')
                  .send({ email:user.email, password:user.password });
  token = login.body.token;
  console.log('🔹 classes obtained token');
});

afterAll(async () => {
  console.log('🔸 classes afterAll start');
  await new Promise(r => server.close(r));
  console.log('🔸 classes HTTP server closed');
  await sequelize.close();
  console.log('🔸 classes DB connection closed');
});

describe('Class routes', () => {
  it('POST /api/classes → create', async () => {
    console.log('▶️ classes POST create start');
    const res = await request(baseUrl)
      .post('/api/classes')
      .set('Authorization', `Bearer ${token}`)
      .send({ name:'Classe A', year:'2025' })
      .expect(201);
    console.log('◀️ classes POST create response:', res.body);
    classId = res.body.id;
  });

  it('GET /api/classes → teacher sees it', async () => {
    console.log('▶️ classes GET start');
    const res = await request(baseUrl)
      .get('/api/classes')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    console.log('◀️ classes GET response:', res.body);
    expect(res.body).toHaveLength(1);
  });

  it('DELETE /api/classes/:classId → delete', async () => {
    console.log('▶️ classes DELETE start');
    await request(baseUrl)
      .delete(`/api/classes/${classId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    console.log('◀️ classes DELETE complete');
    const res = await request(baseUrl)
      .get('/api/classes')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body).toEqual([]);
  });
});
