import { Canvas, Circle, Group } from "@shopify/react-native-skia";
import * as ScreenOrientation from "expo-screen-orientation";
import { useEffect } from "react";
import {
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

export default function App() {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  useEffect(() => {
    // Allow all orientations
    async function enableRotation() {
      await ScreenOrientation.unlockAsync();
    }
    enableRotation();

    // Clean up by locking to portrait when component unmounts
    return () => {
      ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP
      );
    };
  }, []);

  // Make canvas size responsive to screen dimensions
  const canvasSize = Math.min(windowWidth, windowHeight) * 0.8;
  const r = canvasSize * 0.33;

  return (
    <View style={styles.container}>
      <Text>Open up App.tsx to start working on yossssssusr app!</Text>
      <Canvas
        style={{
          width: canvasSize,
          height: canvasSize,
        }}
        testID="canvas"
      >
        <Group blendMode="multiply">
          <Circle cx={r} cy={r} r={r} color="cyan" />
          <Circle cx={canvasSize - r} cy={r} r={r} color="magenta" />
          <Circle
            cx={canvasSize / 2}
            cy={canvasSize - r}
            r={r}
            color="yellow"
          />
        </Group>
      </Canvas>
      <StatusBar barStyle="dark-content" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
