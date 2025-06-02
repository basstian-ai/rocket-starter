import '@testing-library/jest-dom';

// Initialize global.fetch as a Jest mock
// This ensures it's available for all tests if not mocked on a per-test basis.
global.fetch = jest.fn();
