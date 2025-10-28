module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
  collectCoverageFrom: [
    "routes/**/*.js",
    "!**/node_modules/**"
  ]
};
