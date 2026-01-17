import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/app';

describe('Security Headers', () => {
	it('should have basic security headers', async () => {
		const res = await request(app).get('/health');

		expect(res.headers['x-dns-prefetch-control']).toBeDefined();
		expect(res.headers['x-frame-options']).toBeDefined();
		expect(res.headers['strict-transport-security']).toBeDefined();
		expect(res.headers['x-download-options']).toBeDefined();
		expect(res.headers['x-content-type-options']).toBeDefined();
		expect(res.headers['x-xss-protection']).toBe('0'); // Helmet disables this by default as it's deprecated/buggy in modern browsers
	});

	it('should have Content-Security-Policy', async () => {
		const res = await request(app).get('/health');
		expect(res.headers['content-security-policy']).toBeDefined();
	});
});
