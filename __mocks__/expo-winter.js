// Mock for expo winter runtime modules to prevent Jest 30 compatibility issues
// with lazy-evaluated globals that may be accessed after test environment teardown.
module.exports = {
  ImportMetaRegistry: {
    url: 'http://localhost',
  },
};
