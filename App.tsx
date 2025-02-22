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
import { FileManagerModal } from "./components/FileManagerModal";
import { Header } from "./components/Header";
import { LayerPanel } from "./components/LayerPanel";
import { MainCanvas } from "./components/MainCanvas";
import { Tools } from "./components/Tools";
import { Pixel, usePixelEditor } from "./hooks/usePixelEditor";
import { PixelArtFile, savePixelArt } from "./utils/fileSystem";

export default function App() {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const {
    gridSize,
    pixels,
    layers,
    activeLayerId,
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
    addLayer,
    deleteLayer,
    duplicateLayer,
    updateLayer,
    setActiveLayerId,
    brushSize,
    setBrushSize,
    mirrorMode,
    setMirrorMode,
    loadFromFile,
    rotatePixels,
    flipPixels,
    centerGrid,
  } = usePixelEditor(32);

  const [isPortrait, setIsPortrait] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showLayers, setShowLayers] = useState(true);
  const [isFileManagerVisible, setIsFileManagerVisible] = useState(false);
  const viewShotRef = useRef<ViewShot>(null);
  const [hasMediaPermission, setHasMediaPermission] = useState(false);
  const [isMoveMode, setIsMoveMode] = useState(false);

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

  const createSpriteSheet = () => {
    const MAX_COLUMNS = 5;
    const visibleLayers = layers.filter((layer) => layer.visible);
    const columns = Math.min(MAX_COLUMNS, visibleLayers.length);
    const rows = Math.ceil(visibleLayers.length / MAX_COLUMNS);

    const spritesheet: Pixel[] = [];

    visibleLayers.forEach((layer, index) => {
      const row = Math.floor(index / MAX_COLUMNS);
      const col = index % MAX_COLUMNS;

      layer.pixels.forEach((pixel) => {
        spritesheet.push({
          x: pixel.x + col * gridSize,
          y: pixel.y + row * gridSize,
          color: pixel.color,
        });
      });
    });

    return {
      pixels: spritesheet,
      columns,
      rows,
    };
  };

  // Add a separate canvas size for saving (to ensure good quality)
  const saveCanvasSize = 512;
  const savePixelSize = saveCanvasSize / gridSize;

  const handleSaveFile = async (fileName: string) => {
    await savePixelArt(fileName, gridSize, layers);
  };

  const handleLoadFile = (data: PixelArtFile) => {
    loadFromFile(data);
  };

  const handleRecenter = () => {
    centerGrid();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar hidden />
      <View style={styles.container}>
        <Header
          gridSize={gridSize}
          zoom={zoom}
          layers={layers}
          onGridSizeChange={changeGridSize}
          onZoomChange={handleZoomChange}
          onSave={handleSave}
          isSaving={isSaving}
          onToggleLayers={() => setShowLayers(!showLayers)}
          createSpritesheet={createSpriteSheet}
          hasMediaPermission={hasMediaPermission}
          onFileManagerOpen={() => setIsFileManagerVisible(true)}
        />

        <View style={styles.mainContent}>
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
            onPanStart={handlePanStart}
            onPanMove={handlePanMove}
            onPanEnd={handlePanEnd}
            currentZoom={zoom}
            onZoomChange={handleZoomChange}
            isMoveMode={isMoveMode}
            setIsMoveMode={setIsMoveMode}
            currentTool={currentTool}
          />

          {showLayers && (
            <LayerPanel
              layers={layers}
              activeLayerId={activeLayerId}
              onAddLayer={addLayer}
              onDeleteLayer={deleteLayer}
              onDuplicateLayer={duplicateLayer}
              onLayerVisibilityChange={(id, visible) =>
                updateLayer(id, { visible })
              }
              onLayerOpacityChange={(id, opacity) =>
                updateLayer(id, { opacity })
              }
              onLayerSelect={setActiveLayerId}
              onRenameLayer={(id, name) => updateLayer(id, { name })}
            />
          )}
        </View>

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
          canZoomOut={zoom > calculateMinZoom(canvasSize)}
          mirrorMode={mirrorMode}
          setMirrorMode={setMirrorMode}
          brushSize={brushSize}
          onBrushSizeChange={setBrushSize}
          onRotate={rotatePixels}
          onFlip={flipPixels}
          onRecenter={handleRecenter}
          pixels={pixels}
        />

        <FileManagerModal
          isVisible={isFileManagerVisible}
          onClose={() => setIsFileManagerVisible(false)}
          onLoad={handleLoadFile}
          onSave={handleSaveFile}
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
  mainContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});
