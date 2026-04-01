const request = require('supertest');
const { startMongo, stopMongo, clearDb } = require('./helpers');
const User = require('../../src/models/user');

const { app } = require('../../src/app');

describe('Integration: admin endpoints', () => {
  beforeAll(async () => {
    await startMongo();
  });

  afterAll(async () => {
    await stopMongo();
  });

  beforeEach(async () => {
    await clearDb();
  });

  test('admin can list users and view a user tasks', async () => {
    // First user becomes admin
    await request(app)
      .post('/register')
      .type('form')
      .send({
        username: 'admin',
        email: 'admin@example.com',
        password: 'pass123',
      })
      .expect(302);

    // Second user
    await request(app)
      .post('/register')
      .type('form')
      .send({ username: 'bob', email: 'bob@example.com', password: 'pass123' })
      .expect(302);

    const bob = await User.findOne({ email: 'bob@example.com' });

    // Bob creates one task
    const bobAgent = request.agent(app);
    await bobAgent
      .post('/login')
      .type('form')
      .send({ email: 'bob@example.com', password: 'pass123' })
      .expect(302);

    await bobAgent
      .post('/api/tasks')
      .type('form')
      .send({
        titre: 'bob-task',
        description: 'd',
        statut: 'à faire',
        categorie: 'perso',
      })
      .expect(201);

    // Admin logs in
    const adminAgent = request.agent(app);
    await adminAgent
      .post('/login')
      .type('form')
      .send({ email: 'admin@example.com', password: 'pass123' })
      .expect(302);

    const usersRes = await adminAgent.get('/admin/users').expect(200);
    expect(Array.isArray(usersRes.body)).toBe(true);
    expect(usersRes.body.length).toBe(2);

    const tasksRes = await adminAgent
      .get(`/admin/users/${bob._id}/tasks`)
      .expect(200);
    expect(Array.isArray(tasksRes.body)).toBe(true);
    expect(tasksRes.body.map((t) => t.titre)).toContain('bob-task');
  });
});
