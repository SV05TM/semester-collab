import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('Tasks API', () => {
  let token;
  let eventId;
  let taskId;

  beforeAll(async () => {
    // Register user
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'taskuser_' + Date.now(),
        email: `taskuser_${Date.now()}@example.com`,
        password: 'password123'
      });
    token = userRes.body.token;

    // Create event
    const eventRes = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Task Test Event' });
    eventId = eventRes.body.id || eventRes.body._id;
  });

  describe('POST /api/tasks', () => {
    it('should create a task', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({
          event_id: eventId,
          title: 'Buy supplies',
          description: 'Get markers and paper',
          deadline: '2026-06-15T10:00:00'
        });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe('Buy supplies');
      expect(res.body.status).toBe('pending');
      taskId = res.body.id || res.body._id;
    });

    it('should reject task without title', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({ event_id: eventId });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/tasks/event/:eventId', () => {
    it('should return tasks for the event', async () => {
      const res = await request(app)
        .get(`/api/tasks/event/${eventId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0].title).toBe('Buy supplies');
    });
  });

  describe('PUT /api/tasks/:id', () => {
    it('should update task status', async () => {
      const res = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'in-progress' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('in-progress');
    });

    it('should update task to completed', async () => {
      const res = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'completed' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('completed');
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('should delete a task', async () => {
      const res = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
