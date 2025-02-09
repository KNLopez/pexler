import { Slider } from "@miblanchard/react-native-slider";
import { useCallback, useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type ColorPickerProps = {
  isVisible: boolean;
  onClose: () => void;
  onSelectColor: (color: string) => void;
  initialColor?: string;
};

export const ColorPicker = ({
  isVisible,
  onClose,
  onSelectColor,
  initialColor = "#FF0000",
}: ColorPickerProps) => {
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(100);
  const [lightness, setLightness] = useState(50);

  const hslToHex = useCallback((h: number, s: number, l: number) => {
    l /= 100;
    const a = (s * Math.min(l, 1 - l)) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color)
        .toString(16)
        .padStart(2, "0");
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }, []);

  const currentColor = hslToHex(hue, saturation, lightness);

  const handleConfirm = () => {
    onSelectColor(currentColor);
    onClose();
  };

  return (
    <Modal visible={isVisible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Color Picker</Text>

          <View style={styles.colorPreview}>
            <View
              style={[styles.previewBox, { backgroundColor: currentColor }]}
            />
            <Text style={styles.colorHex}>{currentColor}</Text>
          </View>

          <View style={styles.sliderContainer}>
            <Text style={styles.label}>Hue</Text>
            <Slider
              value={hue}
              onValueChange={(value) =>
                setHue(Array.isArray(value) ? value[0] : value)
              }
              minimumValue={0}
              maximumValue={360}
              minimumTrackTintColor="#000"
              maximumTrackTintColor="#000"
              thumbTintColor={currentColor}
            />
          </View>

          <View style={styles.sliderContainer}>
            <Text style={styles.label}>Saturation</Text>
            <Slider
              value={saturation}
              onValueChange={(value) =>
                setSaturation(Array.isArray(value) ? value[0] : value)
              }
              minimumValue={0}
              maximumValue={100}
              minimumTrackTintColor="#000"
              maximumTrackTintColor="#000"
              thumbTintColor={currentColor}
            />
          </View>

          <View style={styles.sliderContainer}>
            <Text style={styles.label}>Lightness</Text>
            <Slider
              value={lightness}
              onValueChange={(value) =>
                setLightness(Array.isArray(value) ? value[0] : value)
              }
              minimumValue={0}
              maximumValue={100}
              minimumTrackTintColor="#000"
              maximumTrackTintColor="#000"
              thumbTintColor={currentColor}
            />
          </View>

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.button} onPress={onClose}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={handleConfirm}
            >
              <Text style={styles.buttonText}>Confirm</Text>
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
    width: "80%",
    maxWidth: 400,
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  colorPreview: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 10,
  },
  previewBox: {
    width: 50,
    height: 50,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#fff",
  },
  colorHex: {
    color: "#fff",
    fontSize: 16,
    textTransform: "uppercase",
  },
  sliderContainer: {
    marginBottom: 20,
  },
  label: {
    color: "#fff",
    marginBottom: 8,
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  button: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#666",
  },
  confirmButton: {
    backgroundColor: "#6366F1",
  },
  buttonText: {
    color: "#fff",
  },
});
