import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { getAuthToken } from './helpers';

describe('Channel Endpoints', () => {
  it('should get all channels', async () => {
    const token = await getAuthToken();
    const res = await request(app)
      .get('/api/channels')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should create a new channel', async () => {
    const token = await getAuthToken();
    const channelName = `test-channel-${Date.now()}`;
    
    const res = await request(app)
      .post('/api/channels')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: channelName });
      
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe(channelName);
  });
});
