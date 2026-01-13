import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('Auth Endpoints', () => {
  it('should register a new user', async () => {
    const uniqueSuffix = Date.now();
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: `testuser_${uniqueSuffix}`,
        email: `test_${uniqueSuffix}@example.com`,
        password: 'password123'
      });
    
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user.username).toBe(`testuser_${uniqueSuffix}`);
  });

  it('should login an existing user', async () => {
    // First register a user
    const uniqueSuffix = Date.now() + 1; // Ensure different from above
    const userData = {
      username: `loginuser_${uniqueSuffix}`,
      email: `login_${uniqueSuffix}@example.com`,
      password: 'password123'
    };

    await request(app)
      .post('/api/auth/register')
      .send(userData);

    // Then try to login
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: userData.email,
        password: userData.password
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe(userData.email);
  });

  it('should fail login with wrong password', async () => {
     // First register a user
     const uniqueSuffix = Date.now() + 2;
     const userData = {
       username: `wrongpass_${uniqueSuffix}`,
       email: `wrong_${uniqueSuffix}@example.com`,
       password: 'password123'
     };
 
     await request(app)
       .post('/api/auth/register')
       .send(userData);

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: userData.email,
        password: 'wrongpassword'
      });
    
    expect(res.status).toBe(401); // Invalid credentials
  });
});
