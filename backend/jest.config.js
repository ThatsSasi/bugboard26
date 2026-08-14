/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.(t|s)?sx?$': ['@swc/jest'],
  },
};