import { Canvas } from "@shopify/react-native-skia";
import * as MediaLibrary from "expo-media-library";
import React, { useRef } from "react";
import {
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ViewShot from "react-native-view-shot";
import { Pixel } from "../hooks/usePixelEditor";
import { PixelCanvas } from "./PixelCanvas";

type SpritesheetPreviewProps = {
  isVisible: boolean;
  onClose: () => void;
  spritesheet: Pixel[];
  gridSize: number;
  columns: number;
  rows: number;
};

export const SpritesheetPreview: React.FC<SpritesheetPreviewProps> = ({
  isVisible,
  onClose,
  spritesheet,
  gridSize,
  columns,
  rows,
}) => {
  const windowWidth = Dimensions.get("window").width;
  const previewSize = Math.min(windowWidth * 0.8, 400);
  const pixelSize = previewSize / (gridSize * columns);
  const viewShotRef = useRef<ViewShot>(null);

  const handleSave = async () => {
    try {
      if (!viewShotRef.current?.capture) {
        alert("Unable to save: ViewShot not ready");
        return;
      }

      const uri = await viewShotRef.current.capture();

      if (!uri) {
        alert("Failed to capture spritesheet");
        return;
      }

      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync("Spritesheets", asset, false);

      alert("Spritesheet saved to gallery!");
      onClose();
    } catch (error) {
      console.error("Error saving spritesheet:", error);
      alert(
        `Failed to save spritesheet: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  return (
    <Modal visible={isVisible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Spritesheet Preview</Text>

          <View style={styles.previewContainer}>
            <ViewShot ref={viewShotRef} options={{ format: "png", quality: 1 }}>
              <Canvas
                style={{
                  width: previewSize,
                  height: previewSize * (rows / columns),
                  backgroundColor: "#fff",
                }}
              >
                <PixelCanvas
                  pixels={spritesheet}
                  gridSize={gridSize * columns}
                  pixelSize={pixelSize}
                  showGrid={false}
                />
              </Canvas>
            </ViewShot>
          </View>

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.button} onPress={onClose}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
            >
              <Text style={styles.buttonText}>Save to Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
    maxWidth: 500,
    alignItems: "center",
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  previewContainer: {
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 20,
    backgroundColor: "#fff",
  },
  buttons: {
    flexDirection: "row",
    gap: 10,
  },
  button: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#666",
    minWidth: 100,
    alignItems: "center",
  },
  saveButton: {
    backgroundColor: "#6366F1",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
});
