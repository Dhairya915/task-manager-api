import request from 'supertest';
import app from '../app';
import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';
import { connectMongo } from '../lib/mongo';

let token: string;
let adminToken: string;
let regularUserId: string;
let adminUserId: string;

beforeAll(async () => {
  await connectMongo();

  // 1. signup regular user — capture the response so you can grab its id
  const signupRes = await request(app)
    .post('/api/v1/signup')
    .send({ email: 'jesttest@example.com', password: 'password123' });
  regularUserId = signupRes.body.id;

  // 2. store regularUserId from that signup response's body
  const res = await request(app)
    .post('/api/v1/login')
    .send({ email: 'jesttest@example.com', password: 'password123' });
  token = res.body.accessToken;

  // 3. signup admin user — capture the response so you can grab its id
  const adminSignupRes = await request(app)
    .post('/api/v1/signup')
    .send({ email: 'admintest@example.com', password: 'password123' });
  adminUserId = adminSignupRes.body.id;

  // 4. store adminUserId from that signup response's body
  await prisma.user.update({
    where: { email: 'admintest@example.com' },
    data: { role: 'admin' },
  });

  const adminRes = await request(app)
    .post('/api/v1/login')
    .send({ email: 'admintest@example.com', password: 'password123' });
  adminToken = adminRes.body.accessToken;
});

afterEach(async () => {
  await prisma.task.deleteMany();
  await redis.flushall();
});

afterAll(async () => {
  await prisma.user.deleteMany({
    where: { email: { in: ['jesttest@example.com', 'admintest@example.com'] } },
  });
  await prisma.$disconnect();
  await redis.quit();
});

describe('Task API', () => {
  it('GET /tasks returns an array', async () => {
    const res = await request(app)
      .get('/api/v1/tasks')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /tasks creates a task', async () => {
    const res = await request(app)
      .post('/api/v1/tasks')
      .send({ title: 'Test task' })
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Test task');
  });

  it('POST /tasks fails with missing title', async () => {
    const res = await request(app)
      .post('/api/v1/tasks')
      .send({})
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  it('GET /tasks/:id return 404 for unknown id', async () => {
    const res = await request(app)
      .get('/api/v1/tasks/nonexistent-id')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('PATCH /tasks/:id updates a task', async () => {
    const created = await request(app)
      .post('/api/v1/tasks')
      .send({ title: 'Test task' })
      .set('Authorization', `Bearer ${token}`);
    const res = await request(app)
      .patch(`/api/v1/tasks/${created.body.id}`)
      .send({ completed: true })
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.completed).toBe(true);
  });

  it('DELETE /tasks/:id remove a task', async () => {
    const created = await request(app)
      .post('/api/v1/tasks')
      .send({ title: 'Test task' })
      .set('Authorization', `Bearer ${token}`);
    const res = await request(app)
      .delete(`/api/v1/tasks/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(204);
  });

  it('GET /tasks respects limit for pagination', async () => {
    await request(app)
      .post('/api/v1/tasks')
      .send({ title: 'Test task' })
      .set('Authorization', `Bearer ${token}`);
    await request(app)
      .post('/api/v1/tasks')
      .send({ title: 'Test task' })
      .set('Authorization', `Bearer ${token}`);
    await request(app)
      .post('/api/v1/tasks')
      .send({ title: 'Test task' })
      .set('Authorization', `Bearer ${token}`);

    const res = await request(app)
      .get('/api/v1/tasks?page=1&limit=2')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.length).toBe(2);
  });

  it('GET /tasks filters by completed status', async () => {
    const task1 = await request(app)
      .post('/api/v1/tasks')
      .send({ title: 'Test task 1' })
      .set('Authorization', `Bearer ${token}`);

    const updateTask1 = await request(app)
      .patch(`/api/v1/tasks/${task1.body.id}`)
      .send({ completed: true })
      .set('Authorization', `Bearer ${token}`);

    const task2 = await request(app)
      .post('/api/v1/tasks')
      .send({ title: 'Test task 2' })
      .set('Authorization', `Bearer ${token}`);

    const res = await request(app)
      .get('/api/v1/tasks?completed=true')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.length).toBe(1);

    expect(
      res.body.every((task: { completed: boolean }) => task.completed === true)
    ).toBe(true);
  });

  it('GET /admin/tasks allows admin to see all tasks', async () => {
    const res = await request(app)
      .get('/api/v1/admin/tasks')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  it('GET /admin/tasks blocks non-admin users', async () => {
    const res = await request(app)
      .get('/api/v1/admin/tasks')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  //catch testing
  it('GET /tasks reflects newly created task immediately (cache invalidation)', async () => {
    // 1. GET /tasks first (populates cache, likely empty array)
    await request(app).get('/api/v1/tasks').set('Authorization', `Bearer ${token}`);

    // 2. POST a new task
    await request(app)
      .post('/api/v1/tasks')
      .send({ title: 'Cache test task' })
      .set('Authorization', `Bearer ${token}`);

    // 3. GET /tasks again
    const res = await request(app)
      .get('/api/v1/tasks')
      .set('Authorization', `Bearer ${token}`);

    // 4. expect the second response's body to contain a task with the new title
    expect(
      res.body.some((task: { title: string }) => task.title === 'Cache test task')
    ).toBe(true);
  });

  //rate limiting
  it('blocks login after too many attempts', async () => {
    await redis.flushall();

    // 1. send 5 login requests in a row (any credentials, doesn't matter if right/wrong)
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/v1/login')
        .send({ email: 'test@example.com', password: 'password123' });
    }

    // 2. send a 6th request
    const res = await request(app)
      .post('/api/v1/login')
      .send({ email: 'test@example.com', password: 'password123' });

    // 3. expect the 6th response's status to be 429
    expect(res.status).toBe(429);
  });

  it('PATCH /users/:id/role blocks non-admin users', async () => {
    // 1. send PATCH request to /api/v1/users/:id/role using the regular user's token
    const res = await request(app)
      .patch(`/api/v1/users/${adminUserId}/role`)
      .send({ role: 'admin' })
      .set('Authorization', `Bearer ${token}`);

    // 2. expect status to be 403
    expect(res.status).toBe(403);
  });

  it('PATCH /users/:id/role allows admin to promote a user', async () => {
    // 1. send PATCH request to /api/v1/users/:id/role, targeting regularUserId, with role 'admin', using adminToken
    const res = await request(app)
      .patch(`/api/v1/users/${regularUserId}/role`)
      .send({ role: 'admin' })
      .set('Authorization', `Bearer ${adminToken}`);

    // 2. expect status to be 200
    expect(res.status).toBe(200);

    // 3. expect response body's role to be 'admin'
    expect(res.body.role).toBe('admin');
  });

  it('PATCH /users/:id/role rejects invalid role value', async () => {
    // 1. send PATCH request to /api/v1/users/:id/role, targeting regularUserId, with an invalid role, using adminToken
    const res = await request(app)
      .patch(`/api/v1/users/${regularUserId}/role`)
      .send({ role: 'doctor' })
      .set('Authorization', `Bearer ${adminToken}`);

    // 2. expect status to be 400
    expect(res.status).toBe(400);
  });

  it('POST /tasks/:id/attachment uploads a file successfully', async () => {
    // 1. create a task first (need a real task id to attach to)
    const task = await request(app)
      .post('/api/v1/tasks')
      .send({ title: 'test of attachment' })
      .set('Authorization', `Bearer ${token}`);

    // 2. send POST to /api/v1/tasks/:id/attachment, attach a file under field name 'file', with auth header
    const res = await request(app)
      .post(`/api/v1/tasks/${task.body.id}/attachment`)
      .attach('file', 'src/tests/hello.txt')
      .set('Authorization', `Bearer ${token}`);

    // 3. expect status to be 200
    expect(res.status).toBe(200);

    // 4. expect response body's attachmentUrl to be defined/truthy
    expect(res.body.attachmentUrl).toBeTruthy();
  });

  it('POST /tasks/:id/attachment fails with no file attached', async () => {
    // 1. create a task first
    const task = await request(app)
      .post('/api/v1/tasks')
      .send({ title: 'test of attachment 2' })
      .set('Authorization', `Bearer ${token}`);

    // 2. send POST to /api/v1/tasks/:id/attachment with NO file attached, just auth header
    const res = await request(app)
      .post(`/api/v1/tasks/${task.body.id}/attachment`)
      .set('Authorization', `Bearer ${token}`);

    // 3. expect status to be 400
    expect(res.status).toBe(400);
  });
});
