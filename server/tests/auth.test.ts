import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';
import { app } from '../src/app';
import { cleanupTestData, TEST_PREFIX } from './helpers';

describe('Auth Endpoints', () => {
	afterAll(async () => {
		await cleanupTestData();
	});

	it('should register a new user', async () => {
		const uniqueSuffix = Date.now();
		const res = await request(app)
			.post('/api/auth/register')
			.send({
				username: `${TEST_PREFIX}user_${uniqueSuffix}`,
				email: `${TEST_PREFIX}user_${uniqueSuffix}@example.com`,
				password: 'password123',
			});

		expect(res.status).toBe(201);
		expect(res.body).toHaveProperty('token');
		expect(res.body.user).toHaveProperty('id');
		expect(res.body.user.username).toBe(`${TEST_PREFIX}user_${uniqueSuffix}`);
	});

	it('should login an existing user', async () => {
		// First register a user
		const uniqueSuffix = Date.now() + 1;
		const userData = {
			username: `${TEST_PREFIX}login_${uniqueSuffix}`,
			email: `${TEST_PREFIX}login_${uniqueSuffix}@example.com`,
			password: 'password123',
		};

		await request(app).post('/api/auth/register').send(userData);

		// Then try to login
		const res = await request(app).post('/api/auth/login').send({
			email: userData.email,
			password: userData.password,
		});

		expect(res.status).toBe(200);
		expect(res.body).toHaveProperty('token');
		expect(res.body.user.email).toBe(userData.email);
	});

	it('should fail login with wrong password', async () => {
		// First register a user
		const uniqueSuffix = Date.now() + 2;
		const userData = {
			username: `${TEST_PREFIX}wrongpass_${uniqueSuffix}`,
			email: `${TEST_PREFIX}wrongpass_${uniqueSuffix}@example.com`,
			password: 'password123',
		};

		await request(app).post('/api/auth/register').send(userData);

		const res = await request(app).post('/api/auth/login').send({
			email: userData.email,
			password: 'wrongpassword',
		});

		expect(res.status).toBe(401); // Invalid credentials
	});
});
