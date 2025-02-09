import { MaterialCommunityIcons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Layer } from "../hooks/usePixelEditor";

interface LayerPanelProps {
  layers: Layer[];
  activeLayerId: string;
  onAddLayer: () => void;
  onDeleteLayer: (id: string) => void;
  onDuplicateLayer: (id: string) => void;
  onLayerVisibilityChange: (id: string, visible: boolean) => void;
  onLayerOpacityChange: (id: string, opacity: number) => void;
  onLayerSelect: (id: string) => void;
  onRenameLayer: (id: string, name: string) => void;
}

export const LayerPanel: React.FC<LayerPanelProps> = ({
  layers,
  activeLayerId,
  onAddLayer,
  onDeleteLayer,
  onDuplicateLayer,
  onLayerVisibilityChange,
  onLayerOpacityChange,
  onLayerSelect,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Layers</Text>
        <TouchableOpacity onPress={onAddLayer} style={styles.addButton}>
          <MaterialCommunityIcons name="plus" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.layerList}>
        {layers.map((layer) => (
          <View
            key={layer.id}
            style={[
              styles.layerItem,
              layer.id === activeLayerId && styles.activeLayer,
            ]}
          >
            <TouchableOpacity
              style={styles.visibilityButton}
              onPress={() => onLayerVisibilityChange(layer.id, !layer.visible)}
            >
              <MaterialCommunityIcons
                name={layer.visible ? "eye" : "eye-off"}
                size={20}
                color="#fff"
              />
            </TouchableOpacity>

            <View style={styles.layerInfo}>
              <TouchableOpacity onPress={() => onLayerSelect(layer.id)}>
                <Text style={styles.layerName}>{layer.name}</Text>
              </TouchableOpacity>
              <View style={styles.opacityContainer}>
                <MaterialCommunityIcons
                  name="opacity"
                  size={16}
                  color="#9CA3AF"
                />
                <Slider
                  style={styles.opacitySlider}
                  value={layer.opacity}
                  onValueChange={(value) =>
                    onLayerOpacityChange(layer.id, value)
                  }
                  minimumValue={0}
                  maximumValue={1}
                  step={0.1}
                  minimumTrackTintColor="#6366F1"
                  maximumTrackTintColor="#4B5563"
                  thumbTintColor="#6366F1"
                />
                <Text style={styles.opacityValue}>
                  {Math.round(layer.opacity * 100)}%
                </Text>
              </View>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                onPress={() => onDuplicateLayer(layer.id)}
                style={styles.actionButton}
              >
                <MaterialCommunityIcons
                  name="content-copy"
                  size={20}
                  color="#fff"
                />
              </TouchableOpacity>

              {layers.length > 1 && (
                <TouchableOpacity
                  onPress={() => onDeleteLayer(layer.id)}
                  style={styles.actionButton}
                >
                  <MaterialCommunityIcons
                    name="delete"
                    size={20}
                    color="#ff4444"
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1F2937",
    borderRadius: 8,
    padding: 12,
    width: 300,
    maxHeight: 400,
    position: "absolute",
    right: 16,
    top: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  addButton: {
    padding: 4,
  },
  layerList: {
    flex: 1,
  },
  layerItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    backgroundColor: "#374151",
    borderRadius: 4,
    marginBottom: 8,
  },
  activeLayer: {
    backgroundColor: "#4B5563",
    borderColor: "#6366F1",
    borderWidth: 1,
  },
  visibilityButton: {
    padding: 4,
  },
  layerInfo: {
    flex: 1,
    marginLeft: 8,
  },
  layerName: {
    color: "#fff",
    fontSize: 14,
    marginBottom: 4,
  },
  opacityContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  opacitySlider: {
    flex: 1,
    height: 20,
  },
  opacityValue: {
    color: "#9CA3AF",
    fontSize: 12,
    minWidth: 35,
  },
  actions: {
    flexDirection: "row",
  },
  actionButton: {
    padding: 4,
    marginLeft: 4,
  },
});
