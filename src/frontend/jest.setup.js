import '@testing-library/jest-dom'
import fetchMock from 'jest-fetch-mock'

// Enable fetch mocking
fetchMock.enableMocks()

// Suppress console.error warnings during tests to prevent CI failures
// These warnings are expected from React Testing Library and error scenario tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    const message = args[0];
    // Suppress React Testing Library act() warnings
    if (typeof message === 'string' && message.includes('Warning: An update to')) {
      return;
    }
    // Suppress expected error logs from error handling tests
    if (typeof message === 'string' && message.includes('Fehler beim Laden')) {
      return;
    }
    // Call original console.error for other messages
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});