const request = require('supertest');
const { startMongo, stopMongo, clearDb } = require('./helpers');
const User = require('../../src/models/user');
const Task = require('../../src/models/task');

// Import express app without starting the server
const { app } = require('../../src/app');

describe('Integration: auth + tasks API', () => {
  beforeAll(async () => {
    await startMongo();
  });

  afterAll(async () => {
    await stopMongo();
  });

  beforeEach(async () => {
    await clearDb();
  });

  test('first registered user becomes admin; second becomes user', async () => {
    await request(app)
      .post('/register')
      .type('form')
      .send({
        username: 'admin',
        email: 'admin@example.com',
        password: 'pass123',
      })
      .expect(302);

    await request(app)
      .post('/register')
      .type('form')
      .send({ username: 'bob', email: 'bob@example.com', password: 'pass123' })
      .expect(302);

    const adminUser = await User.findOne({ email: 'admin@example.com' }).lean();
    const bobUser = await User.findOne({ email: 'bob@example.com' }).lean();

    expect(adminUser.role).toBe('admin');
    expect(bobUser.role).toBe('user');
  });

  test('login creates a session and allows /api/tasks CRUD for that user', async () => {
    // Register and login
    await request(app)
      .post('/register')
      .type('form')
      .send({
        username: 'alice',
        email: 'alice@example.com',
        password: 'pass123',
      })
      .expect(302);

    const agent = request.agent(app);

    await agent
      .post('/login')
      .type('form')
      .send({ email: 'alice@example.com', password: 'pass123' })
      .expect(302);

    // Initially empty
    const list0 = await agent.get('/api/tasks').expect(200);
    expect(Array.isArray(list0.body)).toBe(true);
    expect(list0.body).toHaveLength(0);

    // Create task (Creator taken from session)
    const created = await agent
      .post('/api/tasks')
      .type('form')
      .send({
        titre: 'T1',
        description: 'D1',
        statut: 'à faire',
        categorie: 'perso',
        priorite: '2',
        etiquettes: 'tag1, tag2',
      })
      .expect(201);

    expect(created.body).toHaveProperty('_id');
    expect(created.body.titre).toBe('T1');

    // List contains one
    const list1 = await agent.get('/api/tasks').expect(200);
    expect(list1.body).toHaveLength(1);
    expect(list1.body[0].titre).toBe('T1');

    const taskId = list1.body[0]._id;

    // Update task
    await agent
      .put(`/api/task/${taskId}`)
      .send({ titre: 'T1 updated', priorite: 3 })
      .expect(204);

    const updated = await agent.get(`/api/task/${taskId}`).expect(200);
    expect(updated.body.titre).toBe('T1 updated');

    // Add comment
    const withComment = await agent
      .put(`/api/task/${taskId}/postComment`)
      .send({ commentaire: 'hello' })
      .expect(200);

    expect(withComment.body.commentaires).toContain('hello');

    // Delete comment
    await agent.delete(`/api/task/${taskId}/comment/0`).expect(204);

    // Add subtask
    await agent
      .post(`/api/task/${taskId}/subtask`)
      .send({ titre: 'sub1', statut: 'à faire' })
      .expect(204);

    const afterSub = await agent.get(`/api/task/${taskId}`).expect(200);
    expect(afterSub.body.sousTaches).toHaveLength(1);

    const subId = afterSub.body.sousTaches[0]._id;

    // Update subtask
    await agent
      .put(`/api/task/${taskId}/subtask/${subId}`)
      .send({ titre: 'sub1b', statut: 'en cours' })
      .expect(204);

    // Delete task
    await agent.delete(`/api/task/${taskId}`).expect(204);

    const list2 = await agent.get('/api/tasks').expect(200);
    expect(list2.body).toHaveLength(0);
  });

  test('tasks are isolated per user (Creator filter)', async () => {
    // Create two users
    await request(app)
      .post('/register')
      .type('form')
      .send({ username: 'u1', email: 'u1@example.com', password: 'pass123' })
      .expect(302);

    await request(app)
      .post('/register')
      .type('form')
      .send({ username: 'u2', email: 'u2@example.com', password: 'pass123' })
      .expect(302);

    const agent1 = request.agent(app);
    await agent1
      .post('/login')
      .type('form')
      .send({ email: 'u1@example.com', password: 'pass123' })
      .expect(302);

    await agent1
      .post('/api/tasks')
      .type('form')
      .send({
        titre: 'only-u1',
        description: 'd',
        statut: 'à faire',
        categorie: 'perso',
      })
      .expect(201);

    const agent2 = request.agent(app);
    await agent2
      .post('/login')
      .type('form')
      .send({ email: 'u2@example.com', password: 'pass123' })
      .expect(302);

    await agent2
      .post('/api/tasks')
      .type('form')
      .send({
        titre: 'only-u2',
        description: 'd',
        statut: 'à faire',
        categorie: 'perso',
      })
      .expect(201);

    const list1 = await agent1.get('/api/tasks').expect(200);
    const list2 = await agent2.get('/api/tasks').expect(200);

    expect(list1.body.map((t) => t.titre)).toEqual(['only-u1']);
    expect(list2.body.map((t) => t.titre)).toEqual(['only-u2']);

    // Sanity: DB contains both
    const all = await Task.find({}).lean();
    expect(all).toHaveLength(2);
  });
});
