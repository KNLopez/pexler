import { useCallback, useState } from "react";

export type MirrorMode = "none" | "horizontal" | "vertical" | "both";

interface Position {
  x: number;
  y: number;
}

export const useMirror = (gridSize: number) => {
  const [mirrorMode, setMirrorMode] = useState<MirrorMode>("none");

  const getMirroredPositions = useCallback(
    (x: number, y: number): Position[] => {
      const positions: Position[] = [{ x, y }];

      if (mirrorMode === "horizontal" || mirrorMode === "both") {
        positions.push({ x: gridSize - 1 - x, y });
      }

      if (mirrorMode === "vertical" || mirrorMode === "both") {
        positions.push({ x, y: gridSize - 1 - y });
      }

      if (mirrorMode === "both") {
        positions.push({ x: gridSize - 1 - x, y: gridSize - 1 - y });
      }

      // Remove duplicates
      return Array.from(new Set(positions.map((p) => `${p.x},${p.y}`))).map(
        (coord) => {
          const [px, py] = coord.split(",").map(Number);
          return { x: px, y: py };
        }
      );
    },
    [gridSize, mirrorMode]
  );

  return {
    mirrorMode,
    setMirrorMode,
    getMirroredPositions,
  };
};
