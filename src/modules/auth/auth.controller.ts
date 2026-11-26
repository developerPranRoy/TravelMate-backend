import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendCreated } from '../../utils/response';
import { registerUser, loginUser, getCurrentUser } from './auth.service';
import { RegisterInput, LoginInput } from './auth.schema';
import { config } from '../../config';

/** Cookie options for the JWT token */
const isProduction = config.nodeEnv === 'production';

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  // In production the frontend and API are on different sites, so the cookie
  // must be SameSite=None (requires Secure) to be sent cross-origin.
  sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

/**
 * POST /api/auth/register
 * Registers a new user (and agency if role is AGENCY).
 * Sets an httpOnly cookie and returns user + token in the response body.
 */
export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const data = req.body as RegisterInput;
    const { user, token } = await registerUser(data);

    res.cookie('token', token, cookieOptions);

    return sendCreated(res, { user, token }, 'Registration successful');
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login
 * Validates credentials and returns user + token.
 * Sets an httpOnly cookie and returns token in the response body.
 */
export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const data = req.body as LoginInput;
    const { user, token } = await loginUser(data);

    res.cookie('token', token, cookieOptions);

    return sendSuccess(res, { user, token }, 'Login successful');
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/logout
 * Clears the authentication cookie.
 */
export async function logout(_req: Request, res: Response, next: NextFunction) {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: isProduction,
      sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
      path: '/',
    });

    return sendSuccess(res, null, 'Logout successful');
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/me
 * Returns the current authenticated user's profile.
 */
export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const user = await getCurrentUser(userId);

    return sendSuccess(res, { user }, 'User profile retrieved');
  } catch (err) {
    next(err);
  }
}
