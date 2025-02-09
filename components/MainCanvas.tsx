import { Canvas } from "@shopify/react-native-skia";
import { forwardRef } from "react";
import { StyleSheet, View } from "react-native";
import ViewShot from "react-native-view-shot";
import { Pixel } from "../hooks/usePixelEditor";
import { PixelCanvas } from "./PixelCanvas";

type MainCanvasProps = {
  pixels: Pixel[];
  gridSize: number;
  canvasSize: number;
  scaledSize: number;
  pixelSize: number;
  panOffset: { x: number; y: number };
  saveCanvasSize: number;
  savePixelSize: number;
  onPixelPress: (x: number, y: number, canvasSize: number) => void;
  panResponder: any;
};

export const MainCanvas = forwardRef<ViewShot, MainCanvasProps>(
  (
    {
      pixels,
      gridSize,
      canvasSize,
      scaledSize,
      pixelSize,
      panOffset,
      saveCanvasSize,
      savePixelSize,
      onPixelPress,
      panResponder,
    },
    viewShotRef
  ) => {
    return (
      <View style={styles.mainContent}>
        {/* Hidden canvas for saving */}
        <View
          style={[
            styles.hiddenCanvas,
            {
              width: saveCanvasSize,
              height: saveCanvasSize,
              backgroundColor: "#fff",
            },
          ]}
          pointerEvents="none"
        >
          <ViewShot
            ref={viewShotRef}
            options={{
              format: "png",
              quality: 1,
              result: "tmpfile",
              width: saveCanvasSize,
              height: saveCanvasSize,
            }}
          >
            <Canvas style={{ width: saveCanvasSize, height: saveCanvasSize }}>
              <PixelCanvas
                pixels={pixels}
                gridSize={gridSize}
                pixelSize={savePixelSize}
                showGrid={false}
              />
            </Canvas>
          </ViewShot>
        </View>

        {/* Main visible canvas */}
        <View style={styles.canvasWrapper}>
          <View
            style={[
              styles.canvasContainer,
              { width: canvasSize, height: canvasSize },
            ]}
            {...panResponder.panHandlers}
          >
            <Canvas
              style={{
                width: scaledSize,
                height: scaledSize,
                backgroundColor: "#f0f0f0",
                transform: [
                  { translateX: panOffset.x },
                  { translateY: panOffset.y },
                ],
              }}
              onTouchStart={(event) => {
                const x = event.nativeEvent.locationX;
                const y = event.nativeEvent.locationY;
                onPixelPress(x, y, canvasSize);
              }}
            >
              <PixelCanvas
                pixels={pixels}
                gridSize={gridSize}
                pixelSize={pixelSize}
                showGrid={true}
              />
            </Canvas>
          </View>
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  mainContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  canvasWrapper: {
    aspectRatio: 1,
    width: "100%",
    maxWidth: "80%",
    maxHeight: "80%",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  canvasContainer: {
    backgroundColor: "#fff",
    overflow: "hidden",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  hiddenCanvas: {
    position: "absolute",
    opacity: 0,
    zIndex: -1,
  },
});
