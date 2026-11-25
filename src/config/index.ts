import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  jwt: {
    secret: process.env.JWT_ACCESS_SECRET || 'fallback-secret',
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '7d',
  },
};
