// Mock Canvas and other Skia components
jest.mock("@shopify/react-native-skia", () => ({
  Canvas: "Canvas",
  Circle: "Circle",
  Group: "Group",
}));

// Mock StatusBar
jest.mock(
  "react-native/Libraries/Components/StatusBar/StatusBar",
  () => "StatusBar"
);

// Add any other global test setup here if needed
global.__reanimatedWorkletInit = jest.fn();

// Mock the native modules that might be used
jest.mock("react-native-reanimated", () => {
  const Reanimated = require("react-native-reanimated/mock");
  Reanimated.default.addWhitelistedNativeProps({});
  return Reanimated;
});
