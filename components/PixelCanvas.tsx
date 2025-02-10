import { Group, Rect } from "@shopify/react-native-skia";
import { Pixel, Selection } from "../hooks/usePixelEditor";

type PixelCanvasProps = {
  pixels: Pixel[];
  gridSize: number;
  pixelSize: number;
  showGrid?: boolean;
  selection?: Selection;
};

export const PixelCanvas = ({
  pixels,
  gridSize,
  pixelSize,
  showGrid = true,
  selection,
}: PixelCanvasProps) => {
  return (
    <Group>
      {/* Grid lines - only show if showGrid is true */}
      {showGrid && (
        <Group>
          {Array.from({ length: gridSize + 1 }).map((_, i) => (
            <Group key={i}>
              <Rect
                x={i * pixelSize}
                y={0}
                width={1}
                height={gridSize * pixelSize}
                color="rgba(0,0,0,0.1)"
              />
              <Rect
                x={0}
                y={i * pixelSize}
                width={gridSize * pixelSize}
                height={1}
                color="rgba(0,0,0,0.1)"
              />
            </Group>
          ))}
        </Group>
      )}

      {/* Colored pixels */}
      <Group>
        {pixels.map((pixel, index) => (
          <Rect
            key={index}
            x={pixel.x * pixelSize}
            y={pixel.y * pixelSize}
            width={pixelSize}
            height={pixelSize}
            color={pixel.color}
          />
        ))}
      </Group>

      {/* Selection box */}
      {selection?.start && selection?.end && (
        <Group>
          <Rect
            x={selection.start.x * pixelSize}
            y={selection.start.y * pixelSize}
            width={(selection.end.x - selection.start.x + 1) * pixelSize}
            height={(selection.end.y - selection.start.y + 1) * pixelSize}
            color="rgba(99, 102, 241, 0.2)"
          />
          <Rect
            x={selection.start.x * pixelSize}
            y={selection.start.y * pixelSize}
            width={(selection.end.x - selection.start.x + 1) * pixelSize}
            height={(selection.end.y - selection.start.y + 1) * pixelSize}
            style="stroke"
            strokeWidth={2}
            color="rgb(99, 102, 241)"
          />
        </Group>
      )}
    </Group>
  );
};
