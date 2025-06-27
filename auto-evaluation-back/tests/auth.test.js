// backend/tests/auth.test.js
jest.setTimeout(30000);

const request   = require('supertest');
const http      = require('http');
const app       = require('../server');
const sequelize = require('../utils/sequelize');

let server;
let baseUrl;

beforeAll(async () => {
  console.log('🔹 beforeAll start');
  process.env.NODE_ENV = 'test';

  // 1) synchroniser la base SQLite en mémoire
  await sequelize.sync({ force: true });
  console.log('🔹 DB synced');

  // 2) démarrer le serveur HTTP et attendre qu'il écoute
  server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
  console.log('🔹 server listening at', baseUrl);
});

afterAll(async () => {
    console.log('🔸 afterAll start');
    // 1) fermer le serveur HTTP
    await new Promise(resolve => server.close(resolve));
    console.log('🔸 HTTP server closed');
  
    // 2) puis fermer Sequelize, avec try/catch
    try {
      await sequelize.close();
      console.log('🔸 DB connection closed');
    } catch (err) {
      console.warn('⚠️ sequelize.close() threw, but ignoring:', err.message);
    }
});

describe('Auth routes', () => {
  it('should register then login a user', async () => {
    console.log('▶️  Test start');
    const payload = {
      name:     'Alice',
      email:    'alice@test.com',
      password: 'secret',
      role:     'teacher'
    };

    console.log('▶️  Sending register...');
    const reg = await request(baseUrl)
      .post('/api/auth/register')
      .send(payload)
      .expect(200);
    console.log('◀️  register response', reg.status, reg.body);
    expect(reg.body.token).toBeDefined();

    console.log('▶️  Sending login...');
    const log = await request(baseUrl)
      .post('/api/auth/login')
      .send({ email: payload.email, password: payload.password })
      .expect(200);
    console.log('◀️  login response', log.status, log.body);
    expect(log.body.token).toBeDefined();
  });
});
