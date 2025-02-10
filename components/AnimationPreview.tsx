import { Canvas } from "@shopify/react-native-skia";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Layer } from "../hooks/usePixelEditor";
import { PixelCanvas } from "./PixelCanvas";

type AnimationPreviewProps = {
  isVisible: boolean;
  onClose: () => void;
  layers: Layer[];
  gridSize: number;
};

export const AnimationPreview: React.FC<AnimationPreviewProps> = ({
  isVisible,
  onClose,
  layers,
  gridSize,
}) => {
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const windowWidth = Dimensions.get("window").width;
  const previewSize = Math.min(windowWidth * 0.8, 400);
  const pixelSize = previewSize / gridSize;

  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setCurrentFrameIndex((prev) => (prev + 1) % layers.length);
    }, 200); // 200ms per frame (5fps)

    return () => clearInterval(interval);
  }, [isVisible, layers.length]);

  const currentFrame = layers[currentFrameIndex]?.pixels || [];

  return (
    <Modal visible={isVisible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Animation Preview</Text>

          <View style={styles.previewContainer}>
            <Canvas style={{ width: previewSize, height: previewSize }}>
              <PixelCanvas
                pixels={currentFrame}
                gridSize={gridSize}
                pixelSize={pixelSize}
                showGrid={false}
              />
            </Canvas>
          </View>

          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
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
  button: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#666",
    minWidth: 100,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
});
