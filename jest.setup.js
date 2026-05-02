require('@testing-library/jest-dom');

// Mock clipboard globally for all tests
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: jest.fn(),
  },
  writable: true,
  configurable: true,
});
