import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import prisma from '../../utils/prisma';
import { config } from '../../config';
import { AppError } from '../../middleware/errorHandler';
import { RegisterInput, LoginInput } from './auth.schema';

const SALT_ROUNDS = 12;

/**
 * Registers a new user. If the role is AGENCY, also creates an Agency record
 * with PENDING status linked to the user.
 */
export async function registerUser(data: RegisterInput) {
  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new AppError('A user with this email already exists', 409);
  }

  // Hash the password
  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

  // Create user (and agency if applicable) in a transaction
  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: data.role ?? 'CUSTOMER',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // If the role is AGENCY, create a linked Agency record
    if (data.role === 'AGENCY' && data.agencyName) {
      await tx.agency.create({
        data: {
          userId: newUser.id,
          agencyName: data.agencyName,
          status: 'PENDING',
        },
      });
    }

    return newUser;
  });

  // Generate JWT token
  const token = generateToken(user.id);

  return { user, token };
}

/**
 * Authenticates a user by email and password. Returns the user (without
 * passwordHash) and a signed JWT token.
 */
export async function loginUser(data: LoginInput) {
  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: data.email },
    include: {
      agency: {
        select: {
          id: true,
          agencyName: true,
          status: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  // Compare passwords
  const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);

  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  // Generate JWT token
  const token = generateToken(user.id);

  // Return user without passwordHash
  const { passwordHash: _, ...userWithoutPassword } = user;

  return { user: userWithoutPassword, token };
}

/**
 * Retrieves the current user's profile by ID, including agency information
 * if applicable. Excludes the passwordHash from the result.
 */
export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      agency: {
        select: {
          id: true,
          agencyName: true,
          description: true,
          contactNumber: true,
          status: true,
          createdAt: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user;
}

/**
 * Generates a signed JWT token with the user's ID as payload.
 */
function generateToken(userId: string): string {
  return jwt.sign(
    { userId },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn as SignOptions['expiresIn'] }
  );
}
