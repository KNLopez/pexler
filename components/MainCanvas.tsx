import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Canvas } from "@shopify/react-native-skia";
import { forwardRef, useRef } from "react";
import {
  GestureResponderEvent,
  PanResponder,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
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
  onPanStart: () => void;
  onPanMove: (dx: number, dy: number, canvasSize: number) => void;
  onPanEnd: () => void;
  currentZoom: number;
  onZoomChange: (zoom: number) => void;
  isMoveMode: boolean;
  setIsMoveMode: React.Dispatch<React.SetStateAction<boolean>>;
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
      onPanStart,
      onPanMove,
      onPanEnd,
      currentZoom,
      onZoomChange,
      isMoveMode,
      setIsMoveMode,
    },
    viewShotRef
  ) => {
    const lastTouchesRef = useRef<{ [key: string]: { x: number; y: number } }>(
      {}
    );
    const isDrawingRef = useRef(false);
    const initialPinchDistanceRef = useRef<number | null>(null);
    const initialZoomRef = useRef<number>(currentZoom);
    const lastMidpointRef = useRef<{ x: number; y: number } | null>(null);

    const calculateMidpoint = (
      touch1: { x: number; y: number },
      touch2: { x: number; y: number }
    ) => ({
      x: (touch1.x + touch2.x) / 2,
      y: (touch1.y + touch2.y) / 2,
    });

    const calculateDistance = (
      touch1: { x: number; y: number },
      touch2: { x: number; y: number }
    ) => {
      return Math.sqrt(
        Math.pow(touch2.x - touch1.x, 2) + Math.pow(touch2.y - touch1.y, 2)
      );
    };

    const panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (e: GestureResponderEvent) => {
        const touches = e.nativeEvent.touches;
        lastTouchesRef.current = {};

        if (touches.length === 1) {
          if (isMoveMode) {
            isDrawingRef.current = false;
            onPanStart();
          } else {
            const touch = touches[0];
            const { locationX, locationY } = touch;
            isDrawingRef.current = true;
            onPixelPress(locationX, locationY, canvasSize);
          }
        }

        touches.forEach((t) => {
          lastTouchesRef.current[t.identifier] = {
            x: t.pageX,
            y: t.pageY,
          };
        });
      },

      onPanResponderMove: (e: GestureResponderEvent) => {
        const touches = e.nativeEvent.touches;

        if (touches.length === 1) {
          if (isMoveMode) {
            const touch = touches[0];
            const lastTouch = lastTouchesRef.current[touch.identifier];
            if (lastTouch) {
              const dx = touch.pageX - lastTouch.x;
              const dy = touch.pageY - lastTouch.y;
              onPanMove(dx, dy, canvasSize);
            }
            lastTouchesRef.current[touch.identifier] = {
              x: touch.pageX,
              y: touch.pageY,
            };
          } else if (isDrawingRef.current) {
            const touch = touches[0];
            const { locationX, locationY } = touch;
            onPixelPress(locationX, locationY, canvasSize);
          }
        }
      },

      onPanResponderRelease: () => {
        if (!isDrawingRef.current) {
          onPanEnd();
        }
        lastTouchesRef.current = {};
        isDrawingRef.current = false;
      },

      onPanResponderTerminate: () => {
        if (!isDrawingRef.current) {
          onPanEnd();
        }
        lastTouchesRef.current = {};
        isDrawingRef.current = false;
      },
    });

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

        {/* Main canvas with controls */}
        <View style={styles.canvasWithControls}>
          {/* Move control */}
          <View style={styles.leftControls}>
            <TouchableOpacity
              style={[styles.controlButton, isMoveMode && styles.activeControl]}
              onPress={() => setIsMoveMode((prev: boolean) => !prev)}
            >
              <MaterialCommunityIcons
                name="cursor-move"
                size={24}
                color={isMoveMode ? "#6366F1" : "#fff"}
              />
            </TouchableOpacity>
          </View>

          {/* Canvas wrapper */}
          <View style={styles.canvasWrapper}>
            <View
              style={[
                styles.canvasContainer,
                { width: canvasSize, height: canvasSize },
              ]}
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
                {...panResponder.panHandlers}
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

          {/* Zoom controls */}
          <View style={styles.rightControls}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => onZoomChange(Math.min(200, currentZoom + 25))}
            >
              <MaterialCommunityIcons
                name="magnify-plus"
                size={24}
                color="#fff"
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => onZoomChange(Math.max(50, currentZoom - 25))}
            >
              <MaterialCommunityIcons
                name="magnify-minus"
                size={24}
                color="#fff"
              />
            </TouchableOpacity>
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
  canvasWithControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  leftControls: {
    gap: 8,
  },
  rightControls: {
    gap: 8,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },
  activeControl: {
    backgroundColor: "#1a1a1a",
    borderWidth: 2,
    borderColor: "#6366F1",
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
