const request = require('supertest');

const { startMongo, stopMongo, clearDb } = require('./helpers');

const User = require('../../src/models/user');
const Task = require('../../src/models/task');

const { app } = require('../../src/app');

async function registerUser({ username, email, password }) {
  await request(app)
    .post('/register')
    .type('form')
    .send({ username, email, password })
    .expect(302);
}

async function loginAgent({ email, password }) {
  const agent = request.agent(app);
  await agent.post('/login').type('form').send({ email, password }).expect(302);
  return agent;
}

describe('Integration: error paths coverage', () => {
  beforeAll(async () => {
    await startMongo();
  });

  afterAll(async () => {
    await stopMongo();
  });

  beforeEach(async () => {
    await clearDb();
    jest.restoreAllMocks();
  });

  test('admin HTML page renders and admin /users error path returns 500', async () => {
    // First user is admin
    await registerUser({
      username: 'admin',
      email: 'admin@example.com',
      password: 'pass123',
    });

    const adminAgent = await loginAgent({
      email: 'admin@example.com',
      password: 'pass123',
    });

    await adminAgent.get('/admin').expect(200);

    jest.spyOn(User, 'find').mockRejectedValueOnce(new Error('boom'));

    const res = await adminAgent.get('/admin/users').expect(500);
    expect(res.body).toHaveProperty('message', 'Server error');
  });

  test('admin /users/:id/tasks error path returns 500', async () => {
    await registerUser({
      username: 'admin',
      email: 'admin@example.com',
      password: 'pass123',
    });
    await registerUser({
      username: 'bob',
      email: 'bob@example.com',
      password: 'pass123',
    });

    const bob = await User.findOne({ email: 'bob@example.com' });

    const adminAgent = await loginAgent({
      email: 'admin@example.com',
      password: 'pass123',
    });

    jest.spyOn(Task, 'find').mockRejectedValueOnce(new Error('boom'));

    const res = await adminAgent
      .get(`/admin/users/${bob._id}/tasks`)
      .expect(500);
    expect(res.body).toHaveProperty('message', 'Server error');
  });

  test('categories route catch branch returns 500 JSON', async () => {
    await registerUser({
      username: 'u',
      email: 'u@example.com',
      password: 'pass123',
    });

    const agent = await loginAgent({
      email: 'u@example.com',
      password: 'pass123',
    });

    jest.spyOn(Task, 'find').mockRejectedValueOnce(new Error('boom'));

    const res = await agent.get('/api/categories').expect(500);
    expect(res.body).toHaveProperty('error');
  });

  test('home page catch branch returns 500', async () => {
    await registerUser({
      username: 'u',
      email: 'u@example.com',
      password: 'pass123',
    });

    const agent = await loginAgent({
      email: 'u@example.com',
      password: 'pass123',
    });

    jest.spyOn(Task, 'find').mockReturnValueOnce({
      lean: () => Promise.reject(new Error('boom')),
    });

    await agent.get('/').expect(500);
  });

  test('home page renders when logged in', async () => {
    // First user is admin, second is normal user (redirects to /)
    await registerUser({
      username: 'admin',
      email: 'admin@example.com',
      password: 'pass123',
    });
    await registerUser({
      username: 'u',
      email: 'u@example.com',
      password: 'pass123',
    });

    const agent = await loginAgent({
      email: 'u@example.com',
      password: 'pass123',
    });

    const res = await agent.get('/').expect(200);
    expect(res.text).toMatch(/Mes tâches/i);
  });

  test('register route catch branch returns 500 JSON', async () => {
    jest.spyOn(User, 'findOne').mockRejectedValueOnce(new Error('boom'));

    const res = await request(app)
      .post('/register')
      .type('form')
      .send({ username: 'u', email: 'u@example.com', password: 'pass123' })
      .expect(500);

    expect(res.body).toHaveProperty('message', 'Server error');
  });

  test('login route catch branch renders error message', async () => {
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(User, 'findOne').mockRejectedValueOnce(new Error('boom'));

    const res = await request(app)
      .post('/login')
      .type('form')
      .send({ email: 'u@example.com', password: 'pass123' })
      .expect(200);

    expect(res.text).toMatch(/An error occurred\. Please try again\./i);
    errSpy.mockRestore();
  });
});
