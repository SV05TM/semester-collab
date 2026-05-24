import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('Events API', () => {
  let token;
  let userId;
  let eventId;

  beforeAll(async () => {
    // Register a user for testing
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'eventuser_' + Date.now(),
        email: `eventuser_${Date.now()}@example.com`,
        password: 'password123'
      });
    token = res.body.token;
    userId = res.body.user.id;
  });

  describe('POST /api/events', () => {
    it('should create an event', async () => {
      const res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Test Event',
          description: 'A test event',
          organization: 'Test Org',
          start_date: '2026-06-01',
          event_time: '14:00',
          event_location: 'Room 101'
        });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe('Test Event');
      expect(res.body.organization).toBe('Test Org');
      eventId = res.body.id || res.body._id;
    });

    it('should reject event without title', async () => {
      const res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'No title' });

      expect(res.status).toBe(400);
    });

    it('should reject unauthenticated request', async () => {
      const res = await request(app)
        .post('/api/events')
        .send({ title: 'Test' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/events', () => {
    it('should return events for the user', async () => {
      const res = await request(app)
        .get('/api/events')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].title).toBe('Test Event');
    });
  });

  describe('GET /api/events/:id', () => {
    it('should return event details with members and categories', async () => {
      const res = await request(app)
        .get(`/api/events/${eventId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Test Event');
      expect(res.body.members).toBeDefined();
      expect(res.body.members.length).toBe(1); // creator
      expect(res.body.categories).toBeDefined();
      expect(res.body.categories.length).toBe(4); // default categories
    });

    it('should return 404 for non-existent event', async () => {
      const res = await request(app)
        .get('/api/events/000000000000000000000000')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/events/:id/categories', () => {
    it('should add a custom category', async () => {
      const res = await request(app)
        .post(`/api/events/${eventId}/categories`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Custom Section' });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Custom Section');
    });
  });
});
