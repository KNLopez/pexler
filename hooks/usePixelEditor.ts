import * as ScreenOrientation from "expo-screen-orientation";
import { useCallback, useEffect, useState } from "react";
import { MirrorMode, useMirror } from "./useMirror";

export type { MirrorMode };
export type Pixel = {
  x: number;
  y: number;
  color: string;
};

export type Layer = {
  id: string;
  name: string;
  pixels: Pixel[];
  visible: boolean;
  opacity: number;
};

export type ToolType = "pen" | "eraser" | "fill";
export type ActionType = "draw" | "erase" | "fill" | "clear" | "layer";

interface HistoryEntry {
  layers: Layer[];
  activeLayerId: string;
  action: ActionType;
}

export const usePixelEditor = (initialGridSize: number = 32) => {
  const [gridSize, setGridSize] = useState(initialGridSize);
  const { mirrorMode, setMirrorMode, getMirroredPositions } =
    useMirror(gridSize);
  const [layers, setLayers] = useState<Layer[]>([
    {
      id: "layer-1",
      name: "Layer 1",
      pixels: [],
      visible: true,
      opacity: 1,
    },
  ]);
  const [activeLayerId, setActiveLayerId] = useState("layer-1");
  const [currentColor, setCurrentColor] = useState("#6366F1");
  const [currentTool, setCurrentTool] = useState<ToolType>("pen");
  const [zoom, setZoom] = useState(100);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isPanning, setIsPanning] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    async function enableRotation() {
      await ScreenOrientation.unlockAsync();
    }
    enableRotation();

    return () => {
      // No need to lock orientation on cleanup
    };
  }, []);

  const addToHistory = useCallback(
    (newLayers: Layer[], action: ActionType) => {
      setHistory((prev) => [
        ...prev.slice(0, historyIndex + 1),
        {
          layers: JSON.parse(JSON.stringify(newLayers)),
          activeLayerId,
          action,
        },
      ]);
      setHistoryIndex((prev) => prev + 1);
    },
    [historyIndex, activeLayerId]
  );

  const addLayer = useCallback(() => {
    const newLayer: Layer = {
      id: `layer-${layers.length + 1}`,
      name: `Layer ${layers.length + 1}`,
      pixels: [],
      visible: true,
      opacity: 1,
    };

    setLayers((prev) => {
      const newLayers = [...prev, newLayer];
      addToHistory(newLayers, "layer");
      return newLayers;
    });
    setActiveLayerId(newLayer.id);
  }, [layers.length, addToHistory]);

  const deleteLayer = useCallback(
    (layerId: string) => {
      if (layers.length <= 1) return;

      setLayers((prev) => {
        const newLayers = prev.filter((l) => l.id !== layerId);
        addToHistory(newLayers, "layer");
        return newLayers;
      });

      if (layerId === activeLayerId) {
        setActiveLayerId(layers[layers.length - 2].id);
      }
    },
    [layers, activeLayerId, addToHistory]
  );

  const duplicateLayer = useCallback(
    (layerId: string) => {
      const layerToDuplicate = layers.find((l) => l.id === layerId);
      if (!layerToDuplicate) return;

      const newLayer: Layer = {
        id: `layer-${layers.length + 1}`,
        name: `${layerToDuplicate.name} Copy`,
        pixels: JSON.parse(JSON.stringify(layerToDuplicate.pixels)),
        visible: true,
        opacity: 1,
      };

      setLayers((prev) => {
        const newLayers = [...prev, newLayer];
        addToHistory(newLayers, "layer");
        return newLayers;
      });
      setActiveLayerId(newLayer.id);
    },
    [layers, addToHistory]
  );

  const updateLayer = useCallback(
    (layerId: string, updates: Partial<Layer>) => {
      setLayers((prev) => {
        const newLayers = prev.map((layer) =>
          layer.id === layerId ? { ...layer, ...updates } : layer
        );
        addToHistory(newLayers, "layer");
        return newLayers;
      });
    },
    [addToHistory]
  );

  const getVisiblePixels = useCallback(() => {
    return layers
      .filter((layer) => layer.visible)
      .flatMap((layer) =>
        layer.pixels.map((pixel) => ({
          ...pixel,
          opacity: layer.opacity,
        }))
      );
  }, [layers]);

  const handlePixelPress = useCallback(
    (x: number, y: number, canvasSize: number) => {
      const scaledSize = canvasSize * (zoom / 100);

      const normalizedX = (x / scaledSize) * canvasSize;
      const normalizedY = (y / scaledSize) * canvasSize;

      const gridX = Math.floor((normalizedX / canvasSize) * gridSize);
      const gridY = Math.floor((normalizedY / canvasSize) * gridSize);

      if (gridX < 0 || gridX >= gridSize || gridY < 0 || gridY >= gridSize)
        return;

      setLayers((prev) => {
        const newLayers = prev.map((layer) => {
          if (layer.id !== activeLayerId) return layer;

          let newPixels = [...layer.pixels];
          const mirroredPositions = getMirroredPositions(gridX, gridY);

          if (currentTool === "eraser") {
            newPixels = layer.pixels.filter(
              (p) =>
                !mirroredPositions.some((mp) => mp.x === p.x && mp.y === p.y)
            );
          } else if (currentTool === "fill") {
            const targetColor = layer.pixels.find(
              (p) => p.x === gridX && p.y === gridY
            )?.color;
            const floodFill = (startX: number, startY: number) => {
              const stack = [{ x: startX, y: startY }];
              const filled = new Set<string>();

              while (stack.length > 0) {
                const current = stack.pop()!;
                const key = `${current.x},${current.y}`;

                if (filled.has(key)) continue;
                if (
                  current.x < 0 ||
                  current.x >= gridSize ||
                  current.y < 0 ||
                  current.y >= gridSize
                )
                  continue;

                const existingPixel = layer.pixels.find(
                  (p) => p.x === current.x && p.y === current.y
                );
                if (
                  targetColor
                    ? existingPixel?.color === targetColor
                    : !existingPixel
                ) {
                  filled.add(key);
                  newPixels = newPixels.filter(
                    (p) => !(p.x === current.x && p.y === current.y)
                  );
                  newPixels.push({
                    x: current.x,
                    y: current.y,
                    color: currentColor,
                  });

                  stack.push({ x: current.x + 1, y: current.y });
                  stack.push({ x: current.x - 1, y: current.y });
                  stack.push({ x: current.x, y: current.y + 1 });
                  stack.push({ x: current.x, y: current.y - 1 });
                }
              }
            };

            // Apply flood fill to all mirrored positions
            mirroredPositions.forEach((pos) => {
              floodFill(pos.x, pos.y);
            });
          } else {
            // Remove any existing pixels at the mirrored positions
            newPixels = newPixels.filter(
              (p) =>
                !mirroredPositions.some((mp) => mp.x === p.x && mp.y === p.y)
            );
            // Add new pixels at all mirrored positions
            mirroredPositions.forEach((pos) => {
              newPixels.push({
                x: pos.x,
                y: pos.y,
                color: currentColor,
              });
            });
          }

          return { ...layer, pixels: newPixels };
        });

        addToHistory(newLayers, currentTool === "eraser" ? "erase" : "draw");
        return newLayers;
      });
    },
    [
      currentColor,
      currentTool,
      gridSize,
      zoom,
      activeLayerId,
      addToHistory,
      getMirroredPositions,
    ]
  );

  const clearCanvas = useCallback(() => {
    setLayers((prev) => {
      const newLayers = prev.map((layer) => ({
        ...layer,
        pixels: [],
      }));
      addToHistory(newLayers, "clear");
      return newLayers;
    });
  }, [addToHistory]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex((prev) => prev - 1);
      const historyEntry = history[historyIndex - 1];
      setLayers(historyEntry.layers);
      setActiveLayerId(historyEntry.activeLayerId);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex((prev) => prev + 1);
      const historyEntry = history[historyIndex + 1];
      setLayers(historyEntry.layers);
      setActiveLayerId(historyEntry.activeLayerId);
    }
  }, [history, historyIndex]);

  const changeGridSize = useCallback(
    (newSize: number) => {
      setGridSize(newSize);
      clearCanvas();
    },
    [clearCanvas]
  );

  const handlePanStart = useCallback(() => {
    setIsPanning(true);
  }, []);

  const calculateMinZoom = useCallback((canvasSize: number) => {
    return Math.ceil((canvasSize / canvasSize) * 100);
  }, []);

  const handlePanMove = useCallback(
    (dx: number, dy: number, canvasSize: number) => {
      if (!isPanning) return;

      setPanOffset((prev) => {
        const newOffset = {
          x: prev.x + dx,
          y: prev.y + dy,
        };
        return newOffset;
      });
    },
    [zoom, isPanning]
  );

  const handlePanEnd = useCallback(() => {
    setIsPanning(false);
  }, []);

  const centerGrid = useCallback((canvasSize: number, currentZoom: number) => {
    const scaledSize = canvasSize * (currentZoom / 100);
    const centerOffset = (scaledSize - canvasSize) / 2;
    return { x: -centerOffset, y: -centerOffset };
  }, []);

  const setZoomConstrained = useCallback(
    (newZoom: number, canvasSize: number) => {
      const minZoom = calculateMinZoom(canvasSize);
      const constrainedZoom = Math.max(minZoom, Math.min(newZoom, 1000));
      setZoom(constrainedZoom);

      const centeredOffset = centerGrid(canvasSize, constrainedZoom);
      setPanOffset(centeredOffset);

      return constrainedZoom;
    },
    [calculateMinZoom, centerGrid]
  );

  return {
    gridSize,
    pixels: getVisiblePixels(),
    layers,
    activeLayerId,
    currentColor,
    currentTool,
    mirrorMode,
    setMirrorMode,
    zoom,
    panOffset,
    handlePixelPress,
    setCurrentColor,
    setCurrentTool,
    changeGridSize,
    clearCanvas,
    undo,
    redo,
    setZoom,
    handlePanStart,
    handlePanMove,
    handlePanEnd,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    setPanOffset,
    setZoomConstrained,
    calculateMinZoom,
    addLayer,
    deleteLayer,
    duplicateLayer,
    updateLayer,
    setActiveLayerId,
  };
};
