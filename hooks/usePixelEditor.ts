import * as ScreenOrientation from "expo-screen-orientation";
import { useCallback, useEffect, useState } from "react";
import { PixelArtFile } from "../utils/fileSystem";
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

const getPixelKey = (x: number, y: number) => `${x},${y}`;
const parsePixelKey = (key: string) => {
  const [x, y] = key.split(",").map(Number);
  return { x, y };
};

export type ToolType = "pen" | "eraser" | "fill" | "rotate" | "flip";
export type ActionType = "draw" | "erase" | "fill" | "clear" | "layer";

interface HistoryEntry {
  layers: Layer[];
  activeLayerId: string;
  action: ActionType;
  tool: ToolType;
  timestamp: number;
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
  const [brushSize, setBrushSize] = useState(1);
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
      if (historyIndex >= 0) {
        const currentState = JSON.stringify(history[historyIndex].layers);
        const newState = JSON.stringify(newLayers);
        if (currentState === newState) return;
      }

      const newHistory = history.slice(0, historyIndex + 1);

      newHistory.push({
        layers: JSON.parse(JSON.stringify(newLayers)),
        activeLayerId,
        action,
        tool: currentTool,
        timestamp: Date.now(),
      });

      if (newHistory.length > 50) {
        newHistory.shift();
      } else {
        setHistoryIndex(newHistory.length - 1);
      }

      setHistory(newHistory);
    },
    [history, historyIndex, activeLayerId, currentTool]
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
      const index = layers.findIndex((l) => l.id === layerId);
      if (!layerToDuplicate) return;

      const newLayer: Layer = {
        id: `layer-${Date.now()}`,
        name: `${layerToDuplicate.name.split(" ")[0]} ${index + 1}`,
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

  const getBrushPixels = useCallback(
    (centerX: number, centerY: number) => {
      const pixels: { x: number; y: number }[] = [];
      const offset = Math.floor(brushSize / 2);

      for (let y = -offset; y < brushSize - offset; y++) {
        for (let x = -offset; x < brushSize - offset; x++) {
          const newX = centerX + x;
          const newY = centerY + y;

          // Check if the pixel is within the grid bounds
          if (newX >= 0 && newX < gridSize && newY >= 0 && newY < gridSize) {
            pixels.push({ x: newX, y: newY });
          }
        }
      }

      return pixels;
    },
    [brushSize, gridSize]
  );

  const floodFill = useCallback(
    (
      startX: number,
      startY: number,
      targetColor: string,
      replacementColor: string,
      existingPixels: Pixel[]
    ) => {
      if (targetColor === replacementColor) return existingPixels;

      // Create a map of existing pixels for faster lookup
      const pixelMap = new Map(
        existingPixels.map((p) => [getPixelKey(p.x, p.y), p.color])
      );

      const visited = new Set<string>();
      const queue: Array<[number, number]> = [[startX, startY]];
      const newPixels = new Set<string>();

      const isInBounds = (x: number, y: number) =>
        x >= 0 && x < gridSize && y >= 0 && y < gridSize;

      while (queue.length > 0) {
        const [x, y] = queue.pop()!;
        const key = getPixelKey(x, y);

        if (visited.has(key)) continue;
        visited.add(key);

        const currentColor = pixelMap.get(key) || "transparent";
        if (currentColor !== targetColor) continue;

        newPixels.add(key);

        // Check 4-connected neighbors
        const neighbors = [
          [x + 1, y],
          [x - 1, y],
          [x, y + 1],
          [x, y - 1],
        ];

        for (const [nx, ny] of neighbors) {
          if (isInBounds(nx, ny)) {
            queue.push([nx, ny]);
          }
        }
      }

      // Create new pixels array with filled pixels
      const resultPixels = [...existingPixels];

      // Remove pixels that will be replaced
      resultPixels.forEach((p, index) => {
        if (newPixels.has(getPixelKey(p.x, p.y))) {
          resultPixels[index] = { ...p, color: replacementColor };
        }
      });

      // Add new pixels for empty spaces that were filled
      newPixels.forEach((key) => {
        if (!pixelMap.has(key)) {
          const { x, y } = parsePixelKey(key);
          resultPixels.push({ x, y, color: replacementColor });
        }
      });

      return resultPixels;
    },
    [gridSize]
  );

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

          mirroredPositions.forEach((pos) => {
            const brushPixels = getBrushPixels(pos.x, pos.y);
            console.log(currentTool);
            switch (currentTool) {
              case "eraser":
                newPixels = newPixels.filter(
                  (p) => !brushPixels.some((bp) => bp.x === p.x && bp.y === p.y)
                );
                break;
              case "pen":
                // Remove any existing pixels in the brush area
                newPixels = newPixels.filter(
                  (p) => !brushPixels.some((bp) => bp.x === p.x && bp.y === p.y)
                );

                brushPixels.forEach((bp) => {
                  newPixels.push({
                    x: bp.x,
                    y: bp.y,
                    color: currentColor,
                  });
                });
                break;
              case "fill":
                const activeLayer = prev.find((l) => l.id === activeLayerId);
                if (!activeLayer) return prev;

                const targetPixel = activeLayer.pixels.find(
                  (p) => p.x === gridX && p.y === gridY
                );
                const targetColor = targetPixel?.color || "transparent";

                newPixels = floodFill(
                  gridX,
                  gridY,
                  targetColor,
                  currentColor,
                  activeLayer.pixels
                );

                return prev.map((layer) =>
                  layer.id === activeLayerId
                    ? { ...layer, pixels: newPixels }
                    : layer
                );

                break;
              default:
                break;
            }

            // if (currentTool === "eraser") {
            //   newPixels = newPixels.filter(
            //     (p) => !brushPixels.some((bp) => bp.x === p.x && bp.y === p.y)
            //   );
            // } else if (currentTool === "pen") {
            //   // Remove any existing pixels in the brush area
            //   newPixels = newPixels.filter(
            //     (p) => !brushPixels.some((bp) => bp.x === p.x && bp.y === p.y)
            //   );
            //   // Add new pixels
            //   brushPixels.forEach((bp) => {
            //     newPixels.push({
            //       x: bp.x,
            //       y: bp.y,
            //       color: currentColor,
            //     });
            //   });
            // }
          });

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
      getBrushPixels,
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
      const historyEntry = history[historyIndex - 1];
      if (historyEntry) {
        setHistoryIndex((prev) => prev - 1);
        setLayers(JSON.parse(JSON.stringify(historyEntry.layers)));
        setActiveLayerId(historyEntry.activeLayerId);
      }
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const historyEntry = history[historyIndex + 1];
      if (historyEntry) {
        setHistoryIndex((prev) => prev + 1);
        setLayers(JSON.parse(JSON.stringify(historyEntry.layers)));
        setActiveLayerId(historyEntry.activeLayerId);
      }
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

  const centerGrid = useCallback(() => {
    setZoom(100);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  const setZoomConstrained = useCallback(
    (newZoom: number, canvasSize: number) => {
      const minZoom = calculateMinZoom(canvasSize);
      const constrainedZoom = Math.max(minZoom, Math.min(newZoom, 1000));

      // Calculate the center point of the current view
      const currentCenter = {
        x: -panOffset.x + canvasSize / 2,
        y: -panOffset.y + canvasSize / 2,
      };

      // Calculate the scaling factor
      const scale = constrainedZoom / zoom;

      // Calculate new center after zoom
      const newCenter = {
        x: currentCenter.x * scale,
        y: currentCenter.y * scale,
      };

      // Calculate new offset to maintain the center point
      const newOffset = {
        x: -(newCenter.x - canvasSize / 2),
        y: -(newCenter.y - canvasSize / 2),
      };

      setZoom(constrainedZoom);
      setPanOffset(newOffset);

      return constrainedZoom;
    },
    [calculateMinZoom, zoom, panOffset]
  );

  const loadFromFile = useCallback((data: PixelArtFile) => {
    setGridSize(data.gridSize);
    setLayers(data.layers);
    setActiveLayerId(data.layers[0]?.id || "layer-1");
    setZoom(100);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  const rotatePixels = useCallback(
    (direction: "cw" | "ccw") => {
      setLayers((prev) => {
        const newLayers = prev.map((layer) => {
          if (layer.id !== activeLayerId) return layer;

          const rotatedPixels = layer.pixels.map((pixel) => {
            if (direction === "cw") {
              return {
                ...pixel,
                x: gridSize - 1 - pixel.y,
                y: pixel.x,
              };
            } else {
              return {
                ...pixel,
                x: pixel.y,
                y: gridSize - 1 - pixel.x,
              };
            }
          });

          return { ...layer, pixels: rotatedPixels };
        });

        addToHistory(newLayers, "draw");
        return newLayers;
      });
    },
    [activeLayerId, gridSize, addToHistory]
  );

  const flipPixels = useCallback(
    (direction: "horizontal" | "vertical") => {
      setLayers((prev) => {
        const newLayers = prev.map((layer) => {
          if (layer.id !== activeLayerId) return layer;

          const flippedPixels = layer.pixels.map((pixel) => {
            if (direction === "horizontal") {
              return {
                ...pixel,
                x: gridSize - 1 - pixel.x,
              };
            } else {
              return {
                ...pixel,
                y: gridSize - 1 - pixel.y,
              };
            }
          });

          return { ...layer, pixels: flippedPixels };
        });

        addToHistory(newLayers, "draw");
        return newLayers;
      });
    },
    [activeLayerId, gridSize, addToHistory]
  );

  return {
    gridSize,
    pixels: getVisiblePixels(),
    layers,
    activeLayerId,
    currentColor,
    currentTool,
    brushSize,
    setBrushSize,
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
    loadFromFile,
    rotatePixels,
    flipPixels,
    centerGrid,
  };
};
