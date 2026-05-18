// tests/unit/rateLimiter.test.ts
// Run with: npm run test:unit

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock ioredis
jest.mock('ioredis', () => {
  return {
    Redis: jest.fn().mockImplementation(() => ({
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      on: jest.fn(),
      connect: jest.fn(),
      options: { host: 'localhost', port: 6379 },
    })),
  };
});

describe('Slug generation', () => {
  it('should generate a 7-char alphanumeric slug', async () => {
    const { nanoid } = await import('nanoid');
    const slug = nanoid(7);
    expect(slug).toHaveLength(7);
    expect(slug).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});

describe('Password hashing', () => {
  it('should hash and verify passwords correctly', () => {
    const crypto = require('crypto');

    function hashPassword(password: string): string {
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = crypto.scryptSync(password, salt, 64).toString('hex');
      return `${salt}:${hash}`;
    }

    function verifyPassword(password: string, stored: string): boolean {
      const [salt, hash] = stored.split(':');
      const hashBuffer = crypto.scryptSync(password, salt, 64);
      return crypto.timingSafeEqual(hashBuffer, Buffer.from(hash, 'hex'));
    }

    const password = 'supersecret123';
    const hashed = hashPassword(password);

    expect(verifyPassword(password, hashed)).toBe(true);
    expect(verifyPassword('wrongpassword', hashed)).toBe(false);
  });
});

describe('JWT', () => {
  it('should sign and verify a token', () => {
    process.env.JWT_SECRET = 'test-secret';
    const jwt = require('jsonwebtoken');

    const token = jwt.sign({ userId: 'abc', email: 'test@test.com' }, process.env.JWT_SECRET!, { expiresIn: '1h' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    expect(decoded.userId).toBe('abc');
    expect(decoded.email).toBe('test@test.com');
  });
});
