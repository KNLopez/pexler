import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  deletePixelArtFile,
  listPixelArtFiles,
  loadPixelArt,
  PixelArtFile,
} from "../utils/fileSystem";

type FileManagerModalProps = {
  isVisible: boolean;
  onClose: () => void;
  onLoad: (data: PixelArtFile) => void;
  onSave: (fileName: string) => Promise<void>;
};

export const FileManagerModal: React.FC<FileManagerModalProps> = ({
  isVisible,
  onClose,
  onLoad,
  onSave,
}) => {
  const [files, setFiles] = useState<string[]>([]);
  const [newFileName, setNewFileName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isVisible) {
      refreshFileList();
    }
  }, [isVisible]);

  const refreshFileList = async () => {
    const fileList = await listPixelArtFiles();
    setFiles(fileList);
  };

  const handleSave = async () => {
    if (!newFileName.trim()) {
      Alert.alert("Error", "Please enter a file name");
      return;
    }

    try {
      setIsLoading(true);
      await onSave(newFileName.trim());
      setNewFileName("");
      await refreshFileList();
      Alert.alert("Success", "File saved successfully!");
    } catch (error) {
      Alert.alert("Error", "Failed to save file");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoad = async (fileName: string) => {
    try {
      setIsLoading(true);
      const data = await loadPixelArt(fileName);
      if (data) {
        onLoad(data);
        onClose();
      } else {
        Alert.alert("Error", "Failed to load file");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load file");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (fileName: string) => {
    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete "${fileName}"?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deletePixelArtFile(fileName);
              await refreshFileList();
            } catch (error) {
              Alert.alert("Error", "Failed to delete file");
            }
          },
        },
      ]
    );
  };

  return (
    <Modal visible={isVisible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>File Manager</Text>

          <View style={styles.saveSection}>
            <TextInput
              style={styles.input}
              placeholder="Enter file name..."
              placeholderTextColor="#666"
              value={newFileName}
              onChangeText={setNewFileName}
            />
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.fileList}>
            {files.map((fileName) => (
              <View key={fileName} style={styles.fileItem}>
                <Text style={styles.fileName}>{fileName}</Text>
                <View style={styles.fileActions}>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => handleLoad(fileName)}
                  >
                    <MaterialCommunityIcons
                      name="folder-open"
                      size={24}
                      color="#fff"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => handleDelete(fileName)}
                  >
                    <MaterialCommunityIcons
                      name="delete"
                      size={24}
                      color="#ff4444"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>

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
    maxHeight: "80%",
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  saveSection: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    backgroundColor: "#444",
    borderRadius: 8,
    padding: 10,
    color: "#fff",
    fontSize: 16,
  },
  fileList: {
    maxHeight: 300,
    marginBottom: 20,
  },
  fileItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#444",
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  fileName: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
  },
  fileActions: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    padding: 8,
  },
  button: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#666",
    alignItems: "center",
  },
  saveButton: {
    backgroundColor: "#6366F1",
    paddingHorizontal: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
});
