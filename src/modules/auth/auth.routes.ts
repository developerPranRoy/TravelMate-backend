import { Router } from 'express';
import { register, login, logout, getMe } from './auth.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import { registerSchema, loginSchema } from './auth.schema';

const router = Router();

// Public routes
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);

// Authenticated routes
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);

export default router;
