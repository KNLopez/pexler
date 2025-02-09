import { Group, Rect } from "@shopify/react-native-skia";
import { Pixel } from "../hooks/usePixelEditor";

type PixelCanvasProps = {
  pixels: Pixel[];
  gridSize: number;
  pixelSize: number;
  showGrid?: boolean;
};

export const PixelCanvas = ({
  pixels,
  gridSize,
  pixelSize,
  showGrid = true,
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
    </Group>
  );
};
