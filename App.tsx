import * as MediaLibrary from "expo-media-library";
import * as NavigationBar from "expo-navigation-bar";
import * as ScreenOrientation from "expo-screen-orientation";
import { useEffect, useRef, useState } from "react";
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import ViewShot from "react-native-view-shot";
import { Header } from "./components/Header";
import { MainCanvas } from "./components/MainCanvas";
import { Tools } from "./components/Tools";
import { usePixelEditor } from "./hooks/usePixelEditor";

export default function App() {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const {
    gridSize,
    pixels,
    currentColor,
    currentTool,
    zoom,
    panOffset,
    handlePixelPress,
    setCurrentColor,
    setCurrentTool,
    changeGridSize,
    clearCanvas,
    undo,
    redo,
    handlePanStart,
    handlePanMove,
    handlePanEnd,
    canUndo,
    canRedo,
    setPanOffset,
    setZoomConstrained,
    calculateMinZoom,
  } = usePixelEditor(32);

  const [isPortrait, setIsPortrait] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const viewShotRef = useRef<ViewShot>(null);
  const [hasMediaPermission, setHasMediaPermission] = useState(false);

  // Add permission check
  useEffect(() => {
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setHasMediaPermission(status === "granted");
    })();
  }, []);

  useEffect(() => {
    const subscription = ScreenOrientation.addOrientationChangeListener(
      ({ orientationInfo }) => {
        setIsPortrait(
          orientationInfo.orientation ===
            ScreenOrientation.Orientation.PORTRAIT_UP ||
            orientationInfo.orientation ===
              ScreenOrientation.Orientation.PORTRAIT_DOWN
        );
      }
    );

    async function getOrientation() {
      const orientation = await ScreenOrientation.getOrientationAsync();
      setIsPortrait(
        orientation === ScreenOrientation.Orientation.PORTRAIT_UP ||
          orientation === ScreenOrientation.Orientation.PORTRAIT_DOWN
      );
    }
    getOrientation();

    return () => {
      ScreenOrientation.removeOrientationChangeListener(subscription);
    };
  }, []);

  useEffect(() => {
    async function hideNavigationBar() {
      await NavigationBar.setVisibilityAsync("hidden");
      await NavigationBar.setBackgroundColorAsync("#000000");
    }
    hideNavigationBar();
  }, []);

  const canvasSize = isPortrait
    ? Math.min(windowWidth, windowHeight) * 0.8
    : Math.min(windowWidth, windowHeight) * 0.6;
  const scaledSize = canvasSize * (zoom / 100);
  const pixelSize = scaledSize / gridSize;

  const handleZoomChange = (newZoom: number) => {
    setZoomConstrained(newZoom, canvasSize);
  };

  const handleRecenter = () => {
    setPanOffset({ x: 0, y: 0 });
    setZoomConstrained(100, canvasSize);
  };

  const zoomIn = () => {
    setZoomConstrained(zoom + 25, canvasSize);
  };

  const zoomOut = () => {
    setZoomConstrained(zoom - 25, canvasSize);
  };

  // Update save function
  const handleSave = async () => {
    console.log("Saving...");
    if (isSaving) return;

    try {
      setIsSaving(true);

      if (!viewShotRef.current?.capture) {
        console.error("ViewShot ref or capture method is not available");
        alert("Unable to save: ViewShot not ready");
        return;
      }

      if (!hasMediaPermission) {
        console.error("Media library permission not granted");
        alert(
          "Storage permission is required to save images. Please grant permission in your device settings."
        );
        return;
      }

      // Capture the canvas as PNG
      console.log("Capturing canvas...");
      const uri = await viewShotRef.current.capture();

      if (!uri) {
        console.error("Failed to capture canvas - no URI returned");
        alert("Failed to capture canvas");
        return;
      }

      console.log("Saving to media library...");
      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync("Pixel Art", asset, false);

      alert("Image saved to gallery!");
    } catch (error) {
      console.error("Error saving image:", error);
      alert(
        `Failed to save image: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Add a separate canvas size for saving (to ensure good quality)
  const saveCanvasSize = 512;
  const savePixelSize = saveCanvasSize / gridSize;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar hidden />
      <View style={styles.container}>
        <Header
          gridSize={gridSize}
          zoom={zoom}
          onGridSizeChange={changeGridSize}
          onZoomChange={handleZoomChange}
          onSave={handleSave}
          isSaving={isSaving}
        />

        <MainCanvas
          ref={viewShotRef}
          pixels={pixels}
          gridSize={gridSize}
          canvasSize={canvasSize}
          scaledSize={scaledSize}
          pixelSize={pixelSize}
          panOffset={panOffset}
          saveCanvasSize={saveCanvasSize}
          savePixelSize={savePixelSize}
          onPixelPress={handlePixelPress}
          panResponder={{
            onStartShouldSetPanResponder: () => true,
            onPanResponderGrant: handlePanStart,
            onPanResponderMove: (_, gestureState) => {
              handlePanMove(
                gestureState.dx * 0.5,
                gestureState.dy * 0.5,
                canvasSize
              );
            },
            onPanResponderRelease: handlePanEnd,
          }}
        />

        <Tools
          currentTool={currentTool}
          currentColor={currentColor}
          onToolChange={setCurrentTool}
          onColorChange={setCurrentColor}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={undo}
          onRedo={redo}
          onClear={clearCanvas}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onRecenter={handleRecenter}
          canZoomOut={zoom > calculateMinZoom(canvasSize)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000",
  },
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
});
