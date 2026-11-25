// Test setup: use a test DATABASE_URL if set
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/travelmate_test';
process.env.JWT_ACCESS_SECRET = 'test-jwt-secret';
process.env.JWT_ACCESS_EXPIRES_IN = '1h';
process.env.NODE_ENV = 'test';
