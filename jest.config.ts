import type { JestConfigWithTsJest } from 'ts-jest';

const jestConfig: JestConfigWithTsJest = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  verbose: false,
  clearMocks: true,
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  moduleFileExtensions: ['js', 'json', 'ts'],
  testRegex: '.spec.ts$',
  coveragePathIgnorePatterns: [
    'dist',
    'test',
    'node_modules',
    'coverage',
  ],
};

export default jestConfig;
