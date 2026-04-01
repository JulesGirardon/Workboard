const request = require('supertest');
const mongoose = require('mongoose');

const { startMongo, stopMongo, clearDb } = require('./helpers');
const User = require('../../src/models/user');

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

describe('Integration: extra coverage (middleware + queries + edge cases)', () => {
  beforeAll(async () => {
    await startMongo();
  });

  afterAll(async () => {
    await stopMongo();
  });

  beforeEach(async () => {
    await clearDb();
  });

  test('redirect middleware sends anonymous users to /login on non-API pages', async () => {
    await request(app)
      .get('/some-page')
      .expect(302)
      .expect('Location', '/login');
    await request(app).get('/').expect(302).expect('Location', '/login');

    // Auth pages should be reachable while logged out
    await request(app).get('/login').expect(200);
    await request(app).get('/register').expect(200);

    // Error query branch on /login
    const res = await request(app).get('/login?error=1').expect(200);
    expect(res.text).toMatch(/Invalid credentials/i);
  });

  test('isAuthenticated returns 401 on /api/* when not logged in', async () => {
    const res = await request(app).get('/api/tasks').expect(401);
    expect(res.text).toMatch(/Unauthorized/i);
  });

  test('non-admin user gets 403 on /admin', async () => {
    // First registered user becomes admin in this app.
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

    const res = await agent.get('/admin').expect(403);
    expect(res.text).toMatch(/Admin access required/i);
  });

  test('admin dashboard route works', async () => {
    await registerUser({
      username: 'admin',
      email: 'admin@example.com',
      password: 'pass123',
    });

    const agent = await loginAgent({
      email: 'admin@example.com',
      password: 'pass123',
    });

    await agent.get('/admin/dashboard').expect(200);
  });

  test('duplicate registration returns 400 JSON', async () => {
    await registerUser({
      username: 'u',
      email: 'dup@example.com',
      password: 'pass123',
    });

    const res = await request(app)
      .post('/register')
      .type('form')
      .send({ username: 'u2', email: 'dup@example.com', password: 'pass123' })
      .expect(400);

    expect(res.body).toEqual({ message: 'User already exists' });
  });

  test('invalid login renders login page (200) with error message', async () => {
    await registerUser({
      username: 'u',
      email: 'u@example.com',
      password: 'pass123',
    });

    const res = await request(app)
      .post('/login')
      .type('form')
      .send({ email: 'u@example.com', password: 'WRONG' })
      .expect(200);

    expect(res.text).toMatch(/invalid email or password/i);
  });

  test('GET /logout destroys session and redirects', async () => {
    await registerUser({
      username: 'u',
      email: 'u@example.com',
      password: 'pass123',
    });
    const agent = await loginAgent({
      email: 'u@example.com',
      password: 'pass123',
    });

    await agent.get('/logout').expect(302).expect('Location', '/login');

    // After logout, API should be unauthorized
    await agent.get('/api/tasks').expect(401);
  });

  test('tasks query filters (arrays, search, date range, sorting) and /api/categories', async () => {
    await registerUser({
      username: 'alice',
      email: 'alice@example.com',
      password: 'pass123',
    });

    // Create a second user with a different category to prove categories are aggregated
    await registerUser({
      username: 'bob',
      email: 'bob@example.com',
      password: 'pass123',
    });

    const aliceAgent = await loginAgent({
      email: 'alice@example.com',
      password: 'pass123',
    });

    await aliceAgent
      .post('/api/tasks')
      .type('form')
      .send({
        titre: 'Milk',
        description: 'Buy milk',
        statut: 'à faire',
        priorite: '1',
        categorie: 'perso',
        etiquettes: 'grocery, urgent',
        echeance: '2026-04-05',
      })
      .expect(201);

    await aliceAgent
      .post('/api/tasks')
      .type('form')
      .send({
        titre: 'Homework',
        description: 'Math',
        statut: 'en cours',
        priorite: '2',
        categorie: 'travail',
        etiquettes: 'math',
        echeance: '2026-04-10',
      })
      .expect(201);

    await aliceAgent
      .post('/api/tasks')
      .type('form')
      .send({
        titre: 'Project',
        description: 'Workboard',
        statut: 'terminée',
        priorite: '3',
        categorie: 'travail',
        echeance: '2026-03-01',
      })
      .expect(201);

    const bobAgent = await loginAgent({
      email: 'bob@example.com',
      password: 'pass123',
    });
    await bobAgent
      .post('/api/tasks')
      .type('form')
      .send({
        titre: 'Bob Task',
        description: 'x',
        statut: 'à faire',
        categorie: 'autre',
      })
      .expect(201);

    // Statut as scalar
    const statut1 = await aliceAgent
      .get('/api/tasks')
      .query({ statut: 'à faire' })
      .expect(200);
    expect(statut1.body).toHaveLength(1);

    // Statut as array
    const statutArr = await aliceAgent
      .get('/api/tasks')
      .query({ statut: ['à faire', 'en cours'] })
      .expect(200);
    expect(statutArr.body).toHaveLength(2);

    // Priorite filter
    const prio = await aliceAgent
      .get('/api/tasks')
      .query({ priorite: '2' })
      .expect(200);
    expect(prio.body).toHaveLength(1);
    expect(prio.body[0].titre).toBe('Homework');

    // Categorie filter
    const cat = await aliceAgent
      .get('/api/tasks')
      .query({ categorie: 'travail' })
      .expect(200);
    expect(cat.body).toHaveLength(2);

    // Etiquette filter (scalar)
    const tag = await aliceAgent
      .get('/api/tasks')
      .query({ etiquette: 'math' })
      .expect(200);
    expect(tag.body).toHaveLength(1);
    expect(tag.body[0].titre).toBe('Homework');

    // Date range filters
    const avant = await aliceAgent
      .get('/api/tasks')
      .query({ avant: '2026-04-06' })
      .expect(200);
    expect(avant.body.map((t) => t.titre).sort()).toEqual(['Milk', 'Project']);

    const apres = await aliceAgent
      .get('/api/tasks')
      .query({ apres: '2026-04-06' })
      .expect(200);
    expect(apres.body.map((t) => t.titre)).toEqual(['Homework']);

    // Text search
    const search = await aliceAgent
      .get('/api/tasks')
      .query({ q: 'milk' })
      .expect(200);
    expect(search.body).toHaveLength(1);
    expect(search.body[0].titre).toBe('Milk');

    // Sorting
    const sorted = await aliceAgent
      .get('/api/tasks')
      .query({ tri: 'priorite', ordre: 'desc' })
      .expect(200);
    expect(sorted.body.map((t) => t.priorite)).toEqual([3, 2, 1]);

    // Creator population
    expect(sorted.body[0]).toHaveProperty('Creator');
    expect(sorted.body[0].Creator).toHaveProperty('email');
    expect(sorted.body[0].Creator.email).toBe('alice@example.com');

    // Categories endpoint should return unique categories (includes tasks from other users too)
    const categoriesRes = await aliceAgent.get('/api/categories').expect(200);
    expect(Array.isArray(categoriesRes.body)).toBe(true);
    expect(categoriesRes.body).toEqual(
      expect.arrayContaining(['perso', 'travail', 'autre']),
    );

    // Ensure uniqueness
    const uniq = new Set(categoriesRes.body);
    expect(uniq.size).toBe(categoriesRes.body.length);
  });

  test('task edge cases: 404/500 branches', async () => {
    await registerUser({
      username: 'u',
      email: 'u@example.com',
      password: 'pass123',
    });
    const agent = await loginAgent({
      email: 'u@example.com',
      password: 'pass123',
    });

    const missingId = new mongoose.Types.ObjectId().toString();

    // Get missing
    await agent.get(`/api/task/${missingId}`).expect(404);

    // Invalid ObjectId -> 500
    await agent.get('/api/task/not-an-id').expect(500);

    // History missing -> 404 (does not attempt to render)
    const histRes = await agent
      .get(`/api/task/${missingId}/history`)
      .expect(404);
    expect(histRes.text).toMatch(/introuvable/i);

    // postComment missing
    await agent
      .put(`/api/task/${missingId}/postComment`)
      .send({ commentaire: 'x' })
      .expect(404);

    // subtask add missing
    await agent
      .post(`/api/task/${missingId}/subtask`)
      .send({ titre: 'sub', statut: 'à faire' })
      .expect(404);

    // subtask update missing
    const subId = new mongoose.Types.ObjectId().toString();
    await agent
      .put(`/api/task/${missingId}/subtask/${subId}`)
      .send({ titre: 'sub', statut: 'en cours' })
      .expect(404);

    // delete missing
    await agent.delete(`/api/task/${missingId}`).expect(404);
  });
});
