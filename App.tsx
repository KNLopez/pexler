import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Canvas } from "@shopify/react-native-skia";
import * as MediaLibrary from "expo-media-library";
import * as NavigationBar from "expo-navigation-bar";
import * as ScreenOrientation from "expo-screen-orientation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  PanResponder,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import ViewShot from "react-native-view-shot";
import { ColorPicker } from "./components/ColorPicker";
import { PixelCanvas } from "./components/PixelCanvas";
import { ToolType, usePixelEditor } from "./hooks/usePixelEditor";

const GRID_SIZE_OPTIONS = [16, 32, 64];
const DEFAULT_COLORS = [
  "#6366F1", // Indigo
  "#EC4899", // Pink
  "#F59E0B", // Amber
  "#10B981", // Emerald
  "#3B82F6", // Blue
  "#8B5CF6", // Purple
  "#FFFFFF", // White
];

const ICON_SIZE = 18;
const COLOR_ICON_SIZE = 16;

// Add zoom options constant
const ZOOM_OPTIONS = [100, 125, 150, 175, 200];

export default function App() {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const PAN_SPEED_FACTOR = 0.5;
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
    setZoom,
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

  // Add ref for ViewShot
  const viewShotRef = useRef<ViewShot>(null);

  // Add permission state
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

  // Add navigation bar hiding effect
  useEffect(() => {
    async function hideNavigationBar() {
      await NavigationBar.setVisibilityAsync("hidden");
      // Optional: Set navigation bar color to match app theme
      await NavigationBar.setBackgroundColorAsync("#000000");
    }
    hideNavigationBar();
  }, []);

  const canvasSize = isPortrait
    ? Math.min(windowWidth, windowHeight) * 0.8
    : Math.min(windowWidth, windowHeight) * 0.6;
  const scaledSize = canvasSize * (zoom / 100);
  const pixelSize = scaledSize / gridSize;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: () => handlePanStart(),
        onPanResponderMove: (_, gestureState) => {
          handlePanMove(
            gestureState.dx * PAN_SPEED_FACTOR,
            gestureState.dy * PAN_SPEED_FACTOR,
            canvasSize
          );
        },
        onPanResponderRelease: () => handlePanEnd(),
      }),
    [handlePanStart, handlePanMove, handlePanEnd, canvasSize]
  );

  const [isGridDropdownOpen, setIsGridDropdownOpen] = useState(false);
  const [isZoomDropdownOpen, setIsZoomDropdownOpen] = useState(false);
  const [colors, setColors] = useState(DEFAULT_COLORS);
  const [isColorPickerVisible, setIsColorPickerVisible] = useState(false);

  const handleZoomChange = (newZoom: number) => {
    const constrainedZoom = setZoomConstrained(newZoom, canvasSize);
    setIsZoomDropdownOpen(false);
  };

  const handleRecenter = () => {
    setPanOffset({ x: 0, y: 0 });
    const minZoom = calculateMinZoom(canvasSize);
    setZoomConstrained(100, canvasSize);
  };

  const zoomIn = () => {
    setZoomConstrained(zoom + 25, canvasSize);
  };

  const zoomOut = () => {
    const minZoom = calculateMinZoom(canvasSize);
    setZoomConstrained(zoom - 25, canvasSize);
  };

  const handleColorSelect = (color: string) => {
    setColors((prev) => {
      const newColors = [...prev];
      newColors.pop(); // Remove last color
      return [...newColors, color]; // Add new color
    });
    setCurrentColor(color);
  };

  const shouldShowColors = (tool: ToolType) => {
    return tool === "pen" || tool === "fill";
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
      const uri = await viewShotRef.current.capture({
        format: "png",
        quality: 1,
        result: "tmpfile",
        width: saveCanvasSize,
        height: saveCanvasSize,
      });

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
  const saveCanvasSize = 512; // or any size you prefer
  const savePixelSize = saveCanvasSize / gridSize;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar hidden />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.controls}>
              {/* Grid Size Dropdown */}
              <View style={styles.dropdownContainer}>
                <TouchableOpacity
                  style={styles.dropdown}
                  onPress={() => setIsGridDropdownOpen(!isGridDropdownOpen)}
                >
                  <Text style={styles.dropdownText}>
                    {gridSize}×{gridSize}
                  </Text>
                  <Text style={styles.dropdownArrow}>▼</Text>
                </TouchableOpacity>

                {isGridDropdownOpen && (
                  <View style={styles.dropdownMenu}>
                    {GRID_SIZE_OPTIONS.map((size) => (
                      <TouchableOpacity
                        key={size}
                        style={[
                          styles.dropdownItem,
                          size === gridSize && styles.dropdownItemSelected,
                        ]}
                        onPress={() => {
                          changeGridSize(size);
                          setIsGridDropdownOpen(false);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>
                          {size}×{size}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Zoom Dropdown */}
              <View style={styles.dropdownContainer}>
                <TouchableOpacity
                  style={styles.dropdown}
                  onPress={() => setIsZoomDropdownOpen(!isZoomDropdownOpen)}
                >
                  <Text style={styles.dropdownText}>{zoom}%</Text>
                  <Text style={styles.dropdownArrow}>▼</Text>
                </TouchableOpacity>

                {isZoomDropdownOpen && (
                  <View style={styles.dropdownMenu}>
                    {ZOOM_OPTIONS.map((zoomLevel) => (
                      <TouchableOpacity
                        key={zoomLevel}
                        style={[
                          styles.dropdownItem,
                          zoomLevel === zoom && styles.dropdownItemSelected,
                        ]}
                        onPress={() => handleZoomChange(zoomLevel)}
                      >
                        <Text style={styles.dropdownItemText}>
                          {zoomLevel}%
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Save Button */}
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <MaterialCommunityIcons
                  name="content-save"
                  size={ICON_SIZE}
                  color="#fff"
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

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
        <View style={styles.mainContent}>
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
                  handlePixelPress(x, y, canvasSize);
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

        {/* Floating Toolbar */}
        <View style={styles.floatingToolbar}>
          <View style={styles.toolbarInner}>
            {/* Colors - only show when pen or fill is selected */}
            {shouldShowColors(currentTool) && (
              <View style={styles.toolbarSection}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.paletteScrollContainer}
                >
                  <View style={styles.palette}>
                    {colors.map((color) => (
                      <TouchableOpacity
                        key={color}
                        style={[
                          styles.colorButton,
                          { backgroundColor: color },
                          color === currentColor && styles.selectedColor,
                        ]}
                        onPress={() => setCurrentColor(color)}
                      />
                    ))}
                    <TouchableOpacity
                      style={[styles.colorButton, styles.colorPickerButton]}
                      onPress={() => setIsColorPickerVisible(true)}
                    >
                      <MaterialCommunityIcons
                        name="palette"
                        size={COLOR_ICON_SIZE}
                        color="#fff"
                      />
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            )}

            {/* Tools */}
            <View style={styles.toolbarSection}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.toolsScrollContainer}
              >
                <View style={styles.tools}>
                  <TouchableOpacity
                    style={[
                      styles.tool,
                      currentTool === "pen" && styles.selectedTool,
                    ]}
                    onPress={() => setCurrentTool("pen")}
                  >
                    <MaterialCommunityIcons
                      name="pencil"
                      size={ICON_SIZE}
                      color="#fff"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.tool,
                      currentTool === "fill" && styles.selectedTool,
                    ]}
                    onPress={() => setCurrentTool("fill")}
                  >
                    <MaterialCommunityIcons
                      name="format-color-fill"
                      size={ICON_SIZE}
                      color="#fff"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.tool,
                      currentTool === "eraser" && styles.selectedTool,
                    ]}
                    onPress={() => setCurrentTool("eraser")}
                  >
                    <MaterialCommunityIcons
                      name="eraser"
                      size={ICON_SIZE}
                      color="#fff"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.tool} onPress={zoomIn}>
                    <MaterialCommunityIcons
                      name="magnify-plus"
                      size={ICON_SIZE}
                      color="#fff"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.tool}
                    onPress={zoomOut}
                    disabled={zoom <= calculateMinZoom(canvasSize)}
                  >
                    <MaterialCommunityIcons
                      name="magnify-minus"
                      size={ICON_SIZE}
                      color={
                        zoom > calculateMinZoom(canvasSize)
                          ? "#fff"
                          : "rgba(255,255,255,0.3)"
                      }
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.tool}
                    onPress={handleRecenter}
                  >
                    <MaterialCommunityIcons
                      name="crop-free"
                      size={ICON_SIZE}
                      color="#fff"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.tool}
                    onPress={undo}
                    disabled={!canUndo}
                  >
                    <MaterialCommunityIcons
                      name="undo"
                      size={ICON_SIZE}
                      color={canUndo ? "#fff" : "rgba(255,255,255,0.3)"}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.tool}
                    onPress={redo}
                    disabled={!canRedo}
                  >
                    <MaterialCommunityIcons
                      name="redo"
                      size={ICON_SIZE}
                      color={canRedo ? "#fff" : "rgba(255,255,255,0.3)"}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.tool} onPress={clearCanvas}>
                    <MaterialCommunityIcons
                      name="delete"
                      size={ICON_SIZE}
                      color="#fff"
                    />
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>

            <ColorPicker
              isVisible={isColorPickerVisible}
              onClose={() => setIsColorPickerVisible(false)}
              onSelectColor={handleColorSelect}
              initialColor={currentColor}
            />
          </View>
        </View>
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
  header: {
    padding: 10,
    paddingBottom: 5,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
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
  floatingToolbar: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  toolbarInner: {
    maxWidth: 350,
    width: "100%",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.8)",
    borderRadius: 10,
    padding: 8,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    flex: 1, // Take up remaining space
  },
  dropdownContainer: {
    position: "relative",
    zIndex: 1000, // Ensure dropdowns appear above other elements
  },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#333",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  dropdownText: {
    color: "#fff",
    fontSize: 16,
    minWidth: 45, // Ensure consistent width for zoom values
    textAlign: "right",
  },
  dropdownArrow: {
    color: "#fff",
    fontSize: 12,
  },
  dropdownMenu: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    marginTop: 4,
    backgroundColor: "#333",
    borderRadius: 8,
    padding: 4,
    zIndex: 1000,
  },
  dropdownItem: {
    padding: 8,
    borderRadius: 4,
  },
  dropdownItemSelected: {
    backgroundColor: "#666",
  },
  dropdownItemText: {
    color: "#fff",
    textAlign: "center",
  },
  buttonText: {
    color: "#fff",
  },
  toolbarSection: {
    alignItems: "center",
  },
  toolsScrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  paletteScrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  tools: {
    flexDirection: "row",
    gap: 2,
    backgroundColor: "#333",
    padding: 3,
    borderRadius: 6,
  },
  tool: {
    padding: 3,
    borderRadius: 3,
  },
  selectedTool: {
    backgroundColor: "#666",
  },
  disabledTool: {
    opacity: 0.3,
  },
  palette: {
    flexDirection: "row",
    gap: 2,
    backgroundColor: "#333",
    padding: 3,
    borderRadius: 6,
  },
  colorButton: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#666",
  },
  selectedColor: {
    borderWidth: 2,
    borderColor: "#fff",
  },
  exportButton: {
    padding: 8,
    backgroundColor: "#333",
    borderRadius: 8,
  },
  colorPickerButton: {
    backgroundColor: "#666",
    alignItems: "center",
    justifyContent: "center",
  },
  saveButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#333",
    marginLeft: "auto",
  },
  hiddenCanvas: {
    position: "absolute",
    opacity: 0,
    zIndex: -1,
  },
});
