import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Prisma so unit tests don't need a real database
const prismaMock = vi.hoisted(() => {
  const mock: any = {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    agency: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    $disconnect: vi.fn(),
  };
  // Run transaction callbacks against the same mock client
  mock.$transaction = vi.fn(async (fn: (tx: any) => unknown) => fn(mock));
  return mock;
});

vi.mock('../utils/prisma', () => ({ default: prismaMock }));

const bcryptMock = vi.hoisted(() => ({
  hash: vi.fn(),
  compare: vi.fn(),
}));

vi.mock('bcrypt', () => ({
  default: bcryptMock,
  hash: bcryptMock.hash,
  compare: bcryptMock.compare,
}));

import { registerUser, loginUser } from '../modules/auth/auth.service';

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    bcryptMock.hash.mockResolvedValue('$2b$12$hashedpassword');
    bcryptMock.compare.mockResolvedValue(true);
  });

  it('should reject duplicate email on register', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: '1', email: 'test@example.com' });
    await expect(
      registerUser({ name: 'Test', email: 'test@example.com', password: 'pass123', role: 'CUSTOMER' })
    ).rejects.toThrow('A user with this email already exists');
  });

  it('should register a new user successfully', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({
      id: 'uuid-1', name: 'Test', email: 'newuser@example.com',
      role: 'CUSTOMER', createdAt: new Date(), agency: null,
    });

    const result = await registerUser({
      name: 'Test', email: 'newuser@example.com', password: 'pass123', role: 'CUSTOMER',
    });
    expect(result.user).toBeDefined();
    expect(result.token).toBeDefined();
    expect(typeof result.token).toBe('string');
  });

  it('should reject login with invalid email', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    await expect(
      loginUser({ email: 'nobody@example.com', password: 'pass123' })
    ).rejects.toThrow('Invalid email or password');
  });

  it('should reject login with wrong password', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: '1', email: 'test@example.com', passwordHash: '$2b$12$hash', role: 'CUSTOMER',
      name: 'Test', createdAt: new Date(), updatedAt: new Date(), agency: null,
    });
    bcryptMock.compare.mockResolvedValue(false);
    await expect(
      loginUser({ email: 'test@example.com', password: 'wrongpass' })
    ).rejects.toThrow('Invalid email or password');
  });
});
