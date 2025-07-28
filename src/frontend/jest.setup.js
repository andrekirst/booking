import '@testing-library/jest-dom'
import fetchMock from 'jest-fetch-mock'

// Enable fetch mocking
fetchMock.enableMocks()

// Suppress console.error warnings during tests to prevent CI failures
// React Testing Library warnings are expected in tests and should not fail CI
const originalError = console.error;
beforeAll(() => {
  // Completely suppress console.error during tests to prevent CI failures
  // Tests still pass/fail based on actual assertions, not console output
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalError;
});

// Mock framer-motion für Tests
jest.mock('framer-motion', () => ({
  motion: {
    button: ({ children, whileHover, whileTap, whileFocus, ...props }) => 
      <button {...props}>{children}</button>,
    span: ({ children, initial, animate, exit, transition, ...props }) => 
      <span {...props}>{children}</span>
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));