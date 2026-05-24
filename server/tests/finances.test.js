import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('Finances API', () => {
  let token;
  let eventId;
  let budgetEntryId;
  let fundraisingEntryId;

  beforeAll(async () => {
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'finuser_' + Date.now(),
        email: `finuser_${Date.now()}@gmu.edu`,
        password: 'password123'
      });
    token = userRes.body.token;

    const eventRes = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Finance Test Event' });
    eventId = eventRes.body.id || eventRes.body._id;
  });

  describe('Budget entries', () => {
    it('should add a budget item', async () => {
      const res = await request(app)
        .post('/api/finances')
        .set('Authorization', `Bearer ${token}`)
        .send({
          event_id: eventId,
          section: 'budget',
          vendor: 'Giant',
          item_type: 'Cookies',
          quantity: 3,
          price_per_item: 12.50
        });

      expect(res.status).toBe(201);
      expect(res.body.vendor).toBe('Giant');
      expect(res.body.quantity).toBe(3);
      expect(res.body.price_per_item).toBe(12.50);
      budgetEntryId = res.body.id || res.body._id;
    });

    it('should get budget entries for event', async () => {
      const res = await request(app)
        .get(`/api/finances/event/${eventId}?section=budget`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.finances.length).toBe(1);
      expect(res.body.finances[0].vendor).toBe('Giant');
    });
  });

  describe('Fundraising entries', () => {
    it('should add a fundraising activity', async () => {
      const res = await request(app)
        .post('/api/finances')
        .set('Authorization', `Bearer ${token}`)
        .send({
          event_id: eventId,
          section: 'fundraising',
          source: 'Bake Sale',
          description: 'Sold cookies',
          revenue: 150.00,
          expense: 30.00,
          status: 'confirmed'
        });

      expect(res.status).toBe(201);
      expect(res.body.source).toBe('Bake Sale');
      expect(res.body.revenue).toBe(150);
      expect(res.body.expense).toBe(30);
      fundraisingEntryId = res.body.id || res.body._id;
    });

    it('should get fundraising entries for event', async () => {
      const res = await request(app)
        .get(`/api/finances/event/${eventId}?section=fundraising`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.finances.length).toBe(1);
      expect(res.body.finances[0].source).toBe('Bake Sale');
    });
  });

  describe('DELETE /api/finances/:id', () => {
    it('should delete a finance entry', async () => {
      const res = await request(app)
        .delete(`/api/finances/${budgetEntryId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
