import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Prisma so unit tests don't need a real database
vi.mock('../../utils/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    agency: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    $disconnect: vi.fn(),
  },
}));

vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('$2b$12$hashedpassword'),
    compare: vi.fn().mockResolvedValue(true),
  },
  hash: vi.fn().mockResolvedValue('$2b$12$hashedpassword'),
  compare: vi.fn().mockResolvedValue(true),
}));

import prisma from '../../utils/prisma';
import { registerUser, loginUser } from '../../modules/auth/auth.service';

const mockPrisma = prisma as typeof prisma & {
  user: {
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
};

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should reject duplicate email on register', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: '1', email: 'test@example.com' });
    await expect(
      registerUser({ name: 'Test', email: 'test@example.com', password: 'pass123', role: 'CUSTOMER' })
    ).rejects.toThrow('Email already in use');
  });

  it('should register a new user successfully', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
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
    mockPrisma.user.findUnique.mockResolvedValue(null);
    await expect(
      loginUser({ email: 'nobody@example.com', password: 'pass123' })
    ).rejects.toThrow('Invalid email or password');
  });

  it('should reject login with wrong password', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: '1', email: 'test@example.com', passwordHash: '$2b$12$hash', role: 'CUSTOMER',
      name: 'Test', createdAt: new Date(), updatedAt: new Date(),
    });
    const bcrypt = await import('bcrypt');
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);
    await expect(
      loginUser({ email: 'test@example.com', password: 'wrongpass' })
    ).rejects.toThrow('Invalid email or password');
  });
});
