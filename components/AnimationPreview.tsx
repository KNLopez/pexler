import { Canvas } from "@shopify/react-native-skia";
import React, { useEffect, useRef, useState } from "react";
import { Dimensions, Modal, StyleSheet, Text, View } from "react-native";
import ViewShot from "react-native-view-shot";
import { Layer } from "../hooks/usePixelEditor";
import { PixelCanvas } from "./PixelCanvas";

type AnimationPreviewProps = {
  isVisible: boolean;
  onClose: () => void;
  layers: Layer[];
  gridSize: number;
  hasMediaPermission: boolean;
};

export const AnimationPreview: React.FC<AnimationPreviewProps> = ({
  isVisible,
  onClose,
  layers,
  gridSize,
  hasMediaPermission,
}) => {
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const windowWidth = Dimensions.get("window").width;
  const previewSize = Math.min(windowWidth * 0.8, 400);
  const pixelSize = previewSize / gridSize;
  const viewShotRef = useRef<ViewShot>(null);

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
            <ViewShot ref={viewShotRef} options={{ format: "png", quality: 1 }}>
              <Canvas
                style={{
                  width: previewSize,
                  height: previewSize,
                  backgroundColor: "#fff",
                }}
              >
                <PixelCanvas
                  pixels={currentFrame}
                  gridSize={gridSize}
                  pixelSize={pixelSize}
                  showGrid={false}
                />
              </Canvas>
            </ViewShot>
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
