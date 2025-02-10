import * as FileSystem from "expo-file-system";
import { Layer } from "../hooks/usePixelEditor";

export interface PixelArtFile {
  version: string;
  gridSize: number;
  layers: Layer[];
  timestamp: number;
}

const PIXEL_ART_DIR = `${FileSystem.documentDirectory}pixel-art/`;

export const ensureDirectoryExists = async () => {
  const dirInfo = await FileSystem.getInfoAsync(PIXEL_ART_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(PIXEL_ART_DIR, { intermediates: true });
  }
};

export const savePixelArt = async (
  fileName: string,
  gridSize: number,
  layers: Layer[]
): Promise<string> => {
  await ensureDirectoryExists();

  const fileData: PixelArtFile = {
    version: "1.0",
    gridSize,
    layers,
    timestamp: Date.now(),
  };

  const filePath = `${PIXEL_ART_DIR}${fileName}.json`;
  await FileSystem.writeAsStringAsync(filePath, JSON.stringify(fileData));
  return filePath;
};

export const loadPixelArt = async (
  fileName: string
): Promise<PixelArtFile | null> => {
  const filePath = `${PIXEL_ART_DIR}${fileName}.json`;
  try {
    const fileContent = await FileSystem.readAsStringAsync(filePath);
    return JSON.parse(fileContent) as PixelArtFile;
  } catch (error) {
    console.error("Error loading pixel art:", error);
    return null;
  }
};

export const listPixelArtFiles = async (): Promise<string[]> => {
  await ensureDirectoryExists();
  const files = await FileSystem.readDirectoryAsync(PIXEL_ART_DIR);
  return files
    .filter((file) => file.endsWith(".json"))
    .map((file) => file.replace(".json", ""));
};

export const deletePixelArtFile = async (fileName: string): Promise<void> => {
  const filePath = `${PIXEL_ART_DIR}${fileName}.json`;
  await FileSystem.deleteAsync(filePath);
};
