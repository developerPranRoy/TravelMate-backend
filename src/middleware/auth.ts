import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AppError } from './errorHandler';
import prisma from '../utils/prisma';
import { Role } from '@prisma/client';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = getRequestToken(req);

    if (!token) {
      throw new AppError('Authentication required', 401);
    }

    const user = await findUserFromToken(token);

    if (!user) {
      throw new AppError('User not found', 401);
    }

    req.user = user;
    next();
  } catch (err) {
    if (err instanceof AppError) {
      return next(err);
    }
    next(new AppError('Invalid or expired token', 401));
  }
}

/**
 * Same as `authenticate`, but never rejects. Used on public routes that behave
 * differently for the owner of a resource (e.g. an agency previewing its own
 * deactivated package). Invalid/absent tokens simply leave `req.user` unset.
 */
export async function optionalAuthenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = getRequestToken(req);
    if (token) {
      const user = await findUserFromToken(token);
      if (user) req.user = user;
    }
  } catch {
    // Ignore bad tokens on public routes.
  }
  next();
}

function getRequestToken(req: Request): string | null {
  return (
    req.cookies?.token ||
    (req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : null)
  );
}

async function findUserFromToken(token: string): Promise<AuthUser | null> {
  const decoded = jwt.verify(token, config.jwt.secret) as { userId: string };
  return prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { id: true, email: true, role: true, name: true },
  });
}
