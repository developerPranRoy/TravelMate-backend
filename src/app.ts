import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';

// Route imports
import authRoutes from './modules/auth/auth.routes';
import destinationRoutes from './modules/destinations/destination.routes';
import packageRoutes from './modules/packages/package.routes';
import bookingRoutes from './modules/bookings/booking.routes';
import adminRoutes from './modules/admin/admin.routes';

const app = express();

// Render (and other proxies) terminate TLS in front of the app.
app.set('trust proxy', 1);

// Security & parsing middleware
app.use(helmet());

// CLIENT_ORIGIN may contain a comma-separated list of allowed origins.
const allowedOrigins = config.clientOrigin
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow same-origin/non-browser requests (curl, health checks) with no Origin header.
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many requests, please try again later' },
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'TravelMate API is running' });
});

// API routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/destinations', destinationRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);

// Error handler
app.use(errorHandler);

export default app;
