import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MirrorMode, ToolType } from "../hooks/usePixelEditor";
import { ColorPicker } from "./ColorPicker";

const ICON_SIZE = 25;
const COLOR_ICON_SIZE = 25;
const DEFAULT_COLORS = [
  "#6366F1", // Indigo
  "#EC4899", // Pink
  "#F59E0B", // Amber
  "#10B981", // Emerald
  "#3B82F6", // Blue
  "#8B5CF6", // Purple
  "#FFFFFF", // White
];

const BRUSH_SIZES = [1, 2, 3, 4, 5, 6, 8, 10, 12, 14, 16];

type ToolsProps = {
  currentTool: ToolType;
  currentColor: string;
  brushSize: number;
  onToolChange: (tool: ToolType) => void;
  onColorChange: (color: string) => void;
  onBrushSizeChange: (size: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  canZoomOut: boolean;
  mirrorMode: MirrorMode;
  setMirrorMode: (mode: MirrorMode) => void;
};

const BrushPreview = ({ size, color }: { size: number; color: string }) => {
  const pixels = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      pixels.push(
        <View
          key={`${x}-${y}`}
          style={[styles.previewPixel, { backgroundColor: color }]}
        />
      );
    }
  }

  return (
    <View style={[styles.previewGrid, { width: size * 8, height: size * 8 }]}>
      {pixels}
    </View>
  );
};

export const Tools = ({
  currentTool,
  currentColor,
  brushSize,
  onToolChange,
  onColorChange,
  onBrushSizeChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClear,
  mirrorMode,
  setMirrorMode,
}: ToolsProps) => {
  const [colors, setColors] = useState(DEFAULT_COLORS);
  const [isColorPickerVisible, setIsColorPickerVisible] = useState(false);
  const [isBrushSizeVisible, setIsBrushSizeVisible] = useState(false);

  const handleColorSelect = (color: string) => {
    setColors((prev) => {
      const newColors = [...prev];
      newColors.splice(0, 1);
      return [...newColors, color];
    });
    onColorChange(color);
  };

  const shouldShowColors = (tool: ToolType) => {
    return tool === "pen" || tool === "fill";
  };

  const shouldShowBrushSize = (tool: ToolType) => {
    return tool === "pen" || tool === "eraser";
  };

  return (
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
                    onPress={() => onColorChange(color)}
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
              {/* Brush Size - only show when pen or eraser is selected */}
              {shouldShowBrushSize(currentTool) && (
                <TouchableOpacity
                  style={styles.brushSizeButton}
                  onPress={() => setIsBrushSizeVisible(true)}
                >
                  <Text style={styles.brushSizeText}>{brushSize}px</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        )}

        {/* Tools */}
        <View style={styles.toolbarSection}>
          <View style={styles.toolbarRow}>
            <View style={styles.tools}>
              <TouchableOpacity
                style={[
                  styles.tool,
                  currentTool === "pen" && styles.selectedTool,
                ]}
                onPress={() => onToolChange("pen")}
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
                onPress={() => onToolChange("fill")}
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
                onPress={() => onToolChange("eraser")}
              >
                <MaterialCommunityIcons
                  name="eraser"
                  size={ICON_SIZE}
                  color="#fff"
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.tool}
                onPress={onUndo}
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
                onPress={onRedo}
                disabled={!canRedo}
              >
                <MaterialCommunityIcons
                  name="redo"
                  size={ICON_SIZE}
                  color={canRedo ? "#fff" : "rgba(255,255,255,0.3)"}
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.tool} onPress={onClear}>
                <MaterialCommunityIcons
                  name="delete"
                  size={ICON_SIZE}
                  color="#fff"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <View style={[styles.tools, styles.mirrorTools]}>
              <TouchableOpacity
                style={[
                  styles.tool,
                  mirrorMode === "horizontal" && styles.activeTool,
                ]}
                onPress={() =>
                  setMirrorMode(
                    mirrorMode === "horizontal" ? "none" : "horizontal"
                  )
                }
              >
                <MaterialCommunityIcons
                  name="arrow-left-right"
                  size={24}
                  color={mirrorMode === "horizontal" ? "#6366F1" : "#fff"}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tool,
                  mirrorMode === "vertical" && styles.activeTool,
                ]}
                onPress={() =>
                  setMirrorMode(mirrorMode === "vertical" ? "none" : "vertical")
                }
              >
                <MaterialCommunityIcons
                  name="arrow-up-down"
                  size={24}
                  color={mirrorMode === "vertical" ? "#6366F1" : "#fff"}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tool,
                  mirrorMode === "both" && styles.activeTool,
                ]}
                onPress={() =>
                  setMirrorMode(mirrorMode === "both" ? "none" : "both")
                }
              >
                <MaterialCommunityIcons
                  name="arrow-all"
                  size={24}
                  color={mirrorMode === "both" ? "#6366F1" : "#fff"}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <ColorPicker
          isVisible={isColorPickerVisible}
          onClose={() => setIsColorPickerVisible(false)}
          onSelectColor={handleColorSelect}
          initialColor={currentColor}
        />

        {/* Brush Size Modal */}
        <Modal
          visible={isBrushSizeVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsBrushSizeVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Brush Size</Text>
              <View style={styles.brushSizeGrid}>
                {BRUSH_SIZES.map((size) => (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.brushSizeOption,
                      brushSize === size && styles.selectedBrushSize,
                    ]}
                    onPress={() => {
                      onBrushSizeChange(size);
                      setIsBrushSizeVisible(false);
                    }}
                  >
                    <Text style={styles.brushSizeOptionText}>{size}px</Text>
                    <BrushPreview
                      size={size}
                      color={currentTool === "eraser" ? "#666" : currentColor}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setIsBrushSizeVisible(false)}
              >
                <Text style={styles.modalCloseButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingToolbar: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  toolbarInner: {
    maxWidth: 400,
    width: "100%",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.8)",
    borderRadius: 10,
    padding: 8,
  },
  toolbarSection: {
    alignItems: "center",
  },
  toolbarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
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
    padding: 5,
    borderRadius: 3,
  },
  selectedTool: {
    backgroundColor: "#666",
  },
  palette: {
    flexDirection: "row",
    backgroundColor: "#333",
    padding: 10,
    borderRadius: 6,
    gap: 10,
  },
  colorButton: {
    width: 25,
    height: 25,
    borderRadius: 12.5,
    borderWidth: 1,
    borderColor: "#666",
  },
  selectedColor: {
    borderWidth: 2,
    borderColor: "#fff",
  },
  colorPickerButton: {
    backgroundColor: "#666",
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    height: "100%",
    width: 1,
    backgroundColor: "#666",
  },
  mirrorTools: {
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  activeTool: {
    backgroundColor: "#000",
    borderWidth: 2,
    borderColor: "#6366F1",
  },
  brushSizesContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  brushSizes: {
    flexDirection: "row",
    backgroundColor: "#333",
    padding: 10,
    borderRadius: 6,
    gap: 10,
  },
  brushSizeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#333",
    padding: 8,
    borderRadius: 6,
    gap: 8,
    marginLeft: 10,
  },
  brushSizeText: {
    color: "#fff",
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#333",
    borderRadius: 16,
    padding: 20,
    width: "90%",
    maxWidth: 400,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  brushSizeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
    marginBottom: 20,
  },
  brushSizeOption: {
    alignItems: "center",
    backgroundColor: "#444",
    padding: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#444",
  },
  selectedBrushSize: {
    borderColor: "#6366F1",
  },
  brushSizeOptionText: {
    color: "#fff",
    marginBottom: 5,
  },
  modalCloseButton: {
    backgroundColor: "#6366F1",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  modalCloseButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  previewGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "#fff",
    borderRadius: 4,
    overflow: "hidden",
  },
  previewPixel: {
    width: 8,
    height: 8,
  },
});
