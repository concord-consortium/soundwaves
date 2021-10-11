import { RefObject, useRef } from "react";
import { ISoundWaveProps } from "../types";
import { getCurrentSampleX } from "../utils/sound-wave-helpers";

// Padding is necessary, as the zoom box might become almost a line for high zoom levels.
const ZOOM_AREA_INTERACTION_MARGIN = 20; // px

export const useSoundWaveInteractions = (canvasRef: RefObject<HTMLCanvasElement>, props: ISoundWaveProps) => {
  const { width, zoom, onProgressUpdate } = props;
  const isDraggingActive = useRef(false);

  const getRelativeMouseX = (e: { clientX: number }) => {
    return e.clientX - (canvasRef.current?.offsetLeft || 0);
  };

  const handlePointerDown = (downEvent: React.PointerEvent) => {
    const startPointerX = getRelativeMouseX(downEvent);
    const currentPointX = getCurrentSampleX(props);
    const zoomAreaX1 = currentPointX - ZOOM_AREA_INTERACTION_MARGIN;
    const zoomAreaX2 = getCurrentSampleX(props) + width / zoom + ZOOM_AREA_INTERACTION_MARGIN;

    if (startPointerX >= zoomAreaX1 && startPointerX <= zoomAreaX2) {
      isDraggingActive.current = true;
      document.body.style.cursor = "grab";
      const offset = startPointerX - currentPointX;

      const handleDragging = (moveEvent: PointerEvent) => {
        const pointerX = getRelativeMouseX(moveEvent);
        onProgressUpdate?.(Math.max(0, Math.min(1, (pointerX - offset) / width)));
      };

      const handleDragEnd = () => {
        document.removeEventListener("pointermove", handleDragging);
        document.removeEventListener("pointerup", handleDragEnd);
        isDraggingActive.current = false;
        document.body.style.cursor = "default";
      };

      document.addEventListener<"pointermove">("pointermove", handleDragging);
      document.addEventListener<"pointerup">("pointerup", handleDragEnd);
    }
  };

  const handlePointerMove = (moveEvent: React.PointerEvent) => {
    const pointerX = getRelativeMouseX(moveEvent);
    const zoomAreaX1 = getCurrentSampleX(props) - ZOOM_AREA_INTERACTION_MARGIN;
    const zoomAreaX2 = getCurrentSampleX(props) + width / zoom + ZOOM_AREA_INTERACTION_MARGIN;

    if (!isDraggingActive.current && canvasRef.current) {
      if (pointerX >= zoomAreaX1 && pointerX <= zoomAreaX2) {
        canvasRef.current.style.cursor = "grab";
      } else {
        canvasRef.current.style.cursor = "default";
      }
    }
  };

  return { handlePointerDown, handlePointerMove };
};
