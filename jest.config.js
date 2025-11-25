module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: [
    '**/*.js',
    '!**/node_modules/**',
    '!**/dist/**',
    '!jest.config.js'
  ],
  coverageDirectory: 'coverage',
  verbose: true,
  projects: [
    {
      displayName: 'main',
      testEnvironment: 'node',
      testMatch: ['**/main.test.js']
    },
    {
      displayName: 'renderer',
      testEnvironment: 'jsdom',
      testMatch: ['**/renderer.test.js']
    },
    {
      displayName: 'renderer-property',
      testEnvironment: 'jsdom',
      testMatch: ['**/renderer.property.test.js']
    },
    {
      displayName: 'integration',
      testEnvironment: 'jsdom',
      testMatch: ['**/integration.test.js']
    }
  ]
};
