import 'jest';
// Note: @testing-library/jest-dom types are usually picked up via tsconfig types array
// or by being imported in a setup file that's included in tsconfig.

declare global {
  // Using jest.Mock for compatibility with Jest's mocking system
  var fetch: jest.Mock;
}
