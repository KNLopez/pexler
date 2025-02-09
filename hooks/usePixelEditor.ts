import * as ScreenOrientation from "expo-screen-orientation";
import { useCallback, useEffect, useState } from "react";

export type Pixel = {
  x: number;
  y: number;
  color: string;
};

export type ToolType = "pen" | "eraser" | "fill";
export type ActionType = "draw" | "erase" | "fill" | "clear";

interface HistoryEntry {
  pixels: Pixel[];
  action: ActionType;
}

export const usePixelEditor = (initialGridSize: number = 32) => {
  const [gridSize, setGridSize] = useState(initialGridSize);
  const [pixels, setPixels] = useState<Pixel[]>([]);
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
    (newPixels: Pixel[], action: ActionType) => {
      setHistory((prev) => [
        ...prev.slice(0, historyIndex + 1),
        { pixels: [...newPixels], action },
      ]);
      setHistoryIndex((prev) => prev + 1);
    },
    [historyIndex]
  );

  const handlePixelPress = useCallback(
    (x: number, y: number, canvasSize: number) => {
      const scaledSize = canvasSize * (zoom / 100);
      const pixelSize = scaledSize / gridSize;

      // Convert the clicked coordinates to grid coordinates
      // First, normalize the coordinates to the canvas size
      const normalizedX = (x / scaledSize) * canvasSize;
      const normalizedY = (y / scaledSize) * canvasSize;

      // Then calculate the grid position
      const gridX = Math.floor((normalizedX / canvasSize) * gridSize);
      const gridY = Math.floor((normalizedY / canvasSize) * gridSize);

      // Ensure we're within grid bounds
      if (gridX < 0 || gridX >= gridSize || gridY < 0 || gridY >= gridSize)
        return;

      setPixels((prev) => {
        let newPixels = [...prev];

        if (currentTool === "eraser") {
          newPixels = prev.filter((p) => !(p.x === gridX && p.y === gridY));
          addToHistory(newPixels, "erase");
        } else if (currentTool === "fill") {
          const targetColor = prev.find(
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

              const existingPixel = prev.find(
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

          floodFill(gridX, gridY);
          addToHistory(newPixels, "fill");
        } else {
          const filtered = prev.filter(
            (p) => !(p.x === gridX && p.y === gridY)
          );
          newPixels = [
            ...filtered,
            { x: gridX, y: gridY, color: currentColor },
          ];
          addToHistory(newPixels, "draw");
        }

        return newPixels;
      });
    },
    [currentColor, currentTool, gridSize, zoom, addToHistory]
  );

  const clearCanvas = useCallback(() => {
    setPixels([]);
    addToHistory([], "clear");
  }, [addToHistory]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex((prev) => prev - 1);
      setPixels(history[historyIndex - 1].pixels);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex((prev) => prev + 1);
      setPixels(history[historyIndex + 1].pixels);
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

  const constrainPanOffset = useCallback(
    (
      offset: { x: number; y: number },
      canvasSize: number,
      currentZoom: number
    ) => {
      const scaledSize = canvasSize * (currentZoom / 100);

      const diffX = scaledSize - canvasSize;
      const diffY = scaledSize - canvasSize;

      return {
        x: Math.max(Math.min(offset.x, 0), -diffX),
        y: Math.max(Math.min(offset.y, 0), -diffY),
      };
    },
    []
  );

  const handlePanMove = useCallback(
    (dx: number, dy: number, canvasSize: number) => {
      if (isPanning) {
        setPanOffset((prev) => {
          const newOffset = {
            x: prev.x + dx,
            y: prev.y + dy,
          };
          return constrainPanOffset(newOffset, canvasSize, zoom);
        });
      }
    },
    [isPanning, zoom, constrainPanOffset]
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
      const constrainedZoom = Math.max(minZoom, Math.min(newZoom, 200));
      setZoom(constrainedZoom);

      const centeredOffset = centerGrid(canvasSize, constrainedZoom);
      setPanOffset(centeredOffset);

      return constrainedZoom;
    },
    [calculateMinZoom, centerGrid]
  );

  return {
    gridSize,
    pixels,
    currentColor,
    currentTool,
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
    constrainPanOffset,
  };
};
