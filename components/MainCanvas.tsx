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
import { Pixel, Selection, ToolType } from "../hooks/usePixelEditor";
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
  selection?: Selection;
  currentTool: ToolType;
  onMoveSelection?: (dx: number, dy: number) => void;
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
      selection,
      currentTool,
      onMoveSelection,
    },
    viewShotRef
  ) => {
    const lastTouchesRef = useRef<{ [key: string]: { x: number; y: number } }>(
      {}
    );
    const isDrawingRef = useRef(false);
    const isMovingSelectionRef = useRef(false);

    const panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (e: GestureResponderEvent) => {
        const touches = e.nativeEvent.touches;
        lastTouchesRef.current = {};

        if (touches.length === 1) {
          const touch = touches[0];
          const { locationX, locationY } = touch;

          if (isMoveMode) {
            isDrawingRef.current = false;
            onPanStart();
          } else if (
            currentTool === "select" &&
            selection?.selectedPixels.length &&
            locationX >= selection.start!.x * pixelSize &&
            locationX <= (selection.end!.x + 1) * pixelSize &&
            locationY >= selection.start!.y * pixelSize &&
            locationY <= (selection.end!.y + 1) * pixelSize
          ) {
            isMovingSelectionRef.current = true;
          } else {
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
          const touch = touches[0];
          const lastTouch = lastTouchesRef.current[touch.identifier];

          if (lastTouch) {
            const dx = touch.pageX - lastTouch.x;
            const dy = touch.pageY - lastTouch.y;

            if (isMoveMode) {
              onPanMove(dx, dy, canvasSize);
            } else if (isMovingSelectionRef.current && onMoveSelection) {
              const gridDx = Math.round(dx / pixelSize);
              const gridDy = Math.round(dy / pixelSize);
              if (gridDx !== 0 || gridDy !== 0) {
                onMoveSelection(gridDx, gridDy);
                lastTouchesRef.current[touch.identifier] = {
                  x: touch.pageX,
                  y: touch.pageY,
                };
              }
            } else if (isDrawingRef.current) {
              const { locationX, locationY } = touch;
              onPixelPress(locationX, locationY, canvasSize);
            }
          }

          if (!isMovingSelectionRef.current) {
            lastTouchesRef.current[touch.identifier] = {
              x: touch.pageX,
              y: touch.pageY,
            };
          }
        }
      },

      onPanResponderRelease: () => {
        if (!isDrawingRef.current && !isMovingSelectionRef.current) {
          onPanEnd();
        }
        lastTouchesRef.current = {};
        isDrawingRef.current = false;
        isMovingSelectionRef.current = false;
      },

      onPanResponderTerminate: () => {
        if (!isDrawingRef.current && !isMovingSelectionRef.current) {
          onPanEnd();
        }
        lastTouchesRef.current = {};
        isDrawingRef.current = false;
        isMovingSelectionRef.current = false;
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
            <Canvas
              style={{
                width: saveCanvasSize,
                height: saveCanvasSize,
                backgroundColor: "transparent",
              }}
            >
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
                  selection={selection}
                />
              </Canvas>
            </View>
          </View>

          {/* Zoom controls */}
          <View style={styles.rightControls}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => onZoomChange(Math.min(1000, currentZoom + 25))}
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
    marginBottom: 50,
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
