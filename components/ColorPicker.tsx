import { Slider } from "@miblanchard/react-native-slider";
import {
  Canvas,
  LinearGradient,
  Path,
  Rect,
  vec,
} from "@shopify/react-native-skia";
import { useCallback, useState } from "react";
import {
  Dimensions,
  GestureResponderEvent,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type ColorPickerProps = {
  isVisible: boolean;
  onClose: () => void;
  onSelectColor: (color: string) => void;
  initialColor?: string;
};

const PICKER_SIZE = Math.min(300, Dimensions.get("window").width * 0.7);

export const ColorPicker = ({
  isVisible,
  onClose,
  onSelectColor,
  initialColor = "#FF0000",
}: ColorPickerProps) => {
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(100);
  const [lightness, setLightness] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

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

  const handleColorPickerPress = (event: GestureResponderEvent) => {
    const { locationX, locationY } = event.nativeEvent;
    const newHue = (locationX / PICKER_SIZE) * 360;
    const newSaturation = 100 - (locationY / PICKER_SIZE) * 100;

    setHue(Math.max(0, Math.min(360, newHue)));
    setSaturation(Math.max(0, Math.min(100, newSaturation)));
  };

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

          <View style={styles.pickerContainer}>
            <View
              style={styles.colorPickerWrapper}
              onStartShouldSetResponder={() => true}
              onResponderGrant={(e) => {
                setIsDragging(true);
                handleColorPickerPress(e);
              }}
              onResponderMove={handleColorPickerPress}
              onResponderRelease={() => setIsDragging(false)}
            >
              <Canvas style={styles.colorPicker}>
                {/* Hue gradient background */}
                <Rect x={0} y={0} width={PICKER_SIZE} height={PICKER_SIZE}>
                  <LinearGradient
                    start={vec(0, 0)}
                    end={vec(PICKER_SIZE, 0)}
                    colors={[
                      "#FF0000",
                      "#FFFF00",
                      "#00FF00",
                      "#00FFFF",
                      "#0000FF",
                      "#FF00FF",
                      "#FF0000",
                    ]}
                  />
                </Rect>
                {/* Saturation overlay */}
                <Rect x={0} y={0} width={PICKER_SIZE} height={PICKER_SIZE}>
                  <LinearGradient
                    start={vec(0, PICKER_SIZE)}
                    end={vec(0, 0)}
                    colors={["#FFFFFF", "rgba(255, 255, 255, 0)"]}
                  />
                </Rect>
                {/* Selection indicator */}
                <Path
                  path={`M ${(hue / 360) * PICKER_SIZE} ${
                    PICKER_SIZE - (saturation / 100) * PICKER_SIZE
                  } h 10 v 10 h -10 Z`}
                  color="#FFFFFF"
                  style="stroke"
                  strokeWidth={2}
                />
              </Canvas>
            </View>
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
    width: "90%",
    maxWidth: 400,
    alignItems: "center",
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
  pickerContainer: {
    marginBottom: 20,
    alignItems: "center",
  },
  colorPickerWrapper: {
    width: PICKER_SIZE,
    height: PICKER_SIZE,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#fff",
  },
  colorPicker: {
    width: PICKER_SIZE,
    height: PICKER_SIZE,
  },
  sliderContainer: {
    width: "100%",
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
