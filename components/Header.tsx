import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const ICON_SIZE = 18;
const GRID_SIZE_OPTIONS = [8, 16, 32, 64, 128, 256];
const ZOOM_OPTIONS = [100, 125, 150, 175, 200, 300, 500, 1000];

type HeaderProps = {
  gridSize: number;
  zoom: number;
  onGridSizeChange: (size: number) => void;
  onZoomChange: (zoom: number) => void;
  onSave: () => void;
  isSaving: boolean;
  onToggleLayers: () => void;
};

export const Header = ({
  gridSize,
  zoom,
  onGridSizeChange,
  onZoomChange,
  onSave,
  isSaving,
  onToggleLayers,
}: HeaderProps) => {
  const [isGridDropdownOpen, setIsGridDropdownOpen] = useState(false);
  const [isZoomDropdownOpen, setIsZoomDropdownOpen] = useState(false);

  return (
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
                      onGridSizeChange(size);
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
                    onPress={() => {
                      onZoomChange(zoomLevel);
                      setIsZoomDropdownOpen(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{zoomLevel}%</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.iconButtons}>
            {/* Layer Toggle Button */}
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onToggleLayers}
            >
              <MaterialCommunityIcons
                name="layers"
                size={ICON_SIZE}
                color="#fff"
              />
            </TouchableOpacity>

            {/* Save Button */}
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onSave}
              disabled={isSaving}
            >
              <MaterialCommunityIcons
                name="content-save"
                size={ICON_SIZE}
                color={isSaving ? "#666" : "#fff"}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: 10,
    paddingBottom: 5,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    flex: 1,
  },
  dropdownContainer: {
    position: "relative",
    zIndex: 1000,
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
    minWidth: 45,
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
  iconButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: "auto",
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#333",
  },
});
