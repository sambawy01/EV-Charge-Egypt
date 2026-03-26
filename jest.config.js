module.exports = {
  preset: 'jest-expo',
  forceExit: true,
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|react-native-worklets|react-native-worklets-core)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@screens/(.*)$': '<rootDir>/screens/$1',
    '^expo/src/winter$': '<rootDir>/__mocks__/expo-winter.js',
    '^expo/src/winter/(.*)$': '<rootDir>/__mocks__/expo-winter.js',
  },
  setupFilesAfterFramework: ['@testing-library/jest-native/extend-expect'],
};
