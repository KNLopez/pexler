import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { ToolType } from "../hooks/usePixelEditor";
import { ColorPicker } from "./ColorPicker";

const ICON_SIZE = 25;
const COLOR_ICON_SIZE = 22;
const DEFAULT_COLORS = [
  "#6366F1", // Indigo
  "#EC4899", // Pink
  "#F59E0B", // Amber
  "#10B981", // Emerald
  "#3B82F6", // Blue
  "#8B5CF6", // Purple
  "#FFFFFF", // White
];

type ToolsProps = {
  currentTool: ToolType;
  currentColor: string;
  onToolChange: (tool: ToolType) => void;
  onColorChange: (color: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRecenter: () => void;
  canZoomOut: boolean;
};

export const Tools = ({
  currentTool,
  currentColor,
  onToolChange,
  onColorChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClear,
  onZoomIn,
  onZoomOut,
  onRecenter,
  canZoomOut,
}: ToolsProps) => {
  const [colors, setColors] = useState(DEFAULT_COLORS);
  const [isColorPickerVisible, setIsColorPickerVisible] = useState(false);

  const handleColorSelect = (color: string) => {
    setColors((prev) => {
      const newColors = [...prev];
      newColors.pop(); // Remove last color
      return [...newColors, color]; // Add new color
    });
    onColorChange(color);
  };

  const shouldShowColors = (tool: ToolType) => {
    return tool === "pen" || tool === "fill";
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
    gap: 2,
    backgroundColor: "#333",
    padding: 3,
    borderRadius: 6,
  },
  colorButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
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
});
