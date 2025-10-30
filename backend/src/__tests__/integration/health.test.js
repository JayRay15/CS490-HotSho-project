import express from 'express';
import request from 'supertest';

describe('Health endpoint', () => {
  test('GET /api/health returns server status', async () => {
    const app = express();
    app.get('/api/health', (req, res) => {
      res.status(200).json({ success: true, message: 'Server is running' });
    });

    const res = await request(app).get('/api/health').expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/running/i);
  });
});


