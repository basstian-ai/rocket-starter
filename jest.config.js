module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy', // For CSS Modules or global CSS
    '^@/components/(.*)$': '<rootDir>/components/$1', // Alias for @/components
    '^@/lib/(.*)$': '<rootDir>/lib/$1', // Alias for @/lib
    '^@/app/(.*)$': '<rootDir>/app/$1', // Alias for @/app
     // Add other aliases if used and needed for tests, e.g., for "@/framework/"
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }], // Using next/babel preset
  },
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/', '<rootDir>/scripts/crystallize-import/'], // Ignore .next, node_modules, and specific script folders
  globals: {
    // Necessary if you're using TypeScript with Babel
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
};
