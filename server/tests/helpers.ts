import request from 'supertest';
import { app } from '../src/app';

export const getAuthToken = async () => {
  const uniqueSuffix = Date.now() + Math.floor(Math.random() * 1000);
  const user = {
    username: `helper_user_${uniqueSuffix}`,
    email: `helper_${uniqueSuffix}@example.com`,
    password: 'password123'
  };

  const res = await request(app)
    .post('/api/auth/register')
    .send(user);

  return res.body.token;
};
