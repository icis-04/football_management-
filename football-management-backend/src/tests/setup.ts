// Test setup configuration

// Set test environment
process.env['NODE_ENV'] = 'test';
process.env['DATABASE_PATH'] = ':memory:';
process.env['JWT_SECRET'] = 'test-jwt-secret';
process.env['JWT_REFRESH_SECRET'] = 'test-refresh-secret';

// Mock console methods in tests to reduce noise
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Global test timeout
jest.setTimeout(10000);

// Setup and teardown hooks
beforeAll(async () => {
  // Any global setup can go here
});

afterAll(async () => {
  // Any global cleanup can go here
});

beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
});

afterEach(() => {
  // Any cleanup after each test
}); 