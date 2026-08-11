import request from 'supertest';
import app from '../app';
import { prisma } from '../lib/prisma';

let token: string;

beforeAll(async () => {
  await request(app).post('/api/v1/signup').send({email: 'jesttest@example.com', password:'password123'});
  const res = await request(app).post('/api/v1/login').send({email: 'jesttest@example.com', password:'password123'});
  token = res.body.accessToken;
});

afterEach(async () => {
  await prisma.task.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});


describe('Task API', () => {
  it('GET /tasks returns an array', async () => {
    const res = await request(app).get('/api/v1/tasks').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /tasks creates a task', async () => {
    const res = await request(app).post('/api/v1/tasks').send({ title: 'Test task' }).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Test task');
  });

  it('POST /tasks fails with missing title', async () => {
    const res = await request(app).post('/api/v1/tasks').send({}).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  it('GET /tasks/:id return 404 for unknown id' , async() => {
    const res = await request(app).get('/api/v1/tasks/nonexistent-id').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('PATCH /tasks/:id updates a task' , async() => {
    const created = await request(app).post('/api/v1/tasks').send({ title: 'Test task' }).set('Authorization', `Bearer ${token}`);
    const res = await request(app).patch(`/api/v1/tasks/${created.body.id}`).send({completed:true}).set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.completed).toBe(true);
  });

  it('DELETE /tasks/:id remove a task', async() => {
    const created = await request(app).post('/api/v1/tasks').send({ title: 'Test task' }).set('Authorization', `Bearer ${token}`);
    const res = await request(app).delete(`/api/v1/tasks/${created.body.id}`).set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(204);
  })
});