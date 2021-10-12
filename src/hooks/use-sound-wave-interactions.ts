import { RefObject, useRef } from "react";
import { ISoundWaveProps, ISoundWavePropsWithData } from "../types";
import { getCurrentSampleX, getPointsCount, getZoomedInViewPointsCount } from "../utils/sound-wave-helpers";

// Padding is necessary, as the zoom box might become almost a line for high zoom levels.
const ZOOM_AREA_INTERACTION_MARGIN = 30; // px

export const useSoundWaveInteractions = (canvasRef: RefObject<HTMLCanvasElement>, data: Float32Array, props: ISoundWaveProps) => {
  const { width, zoom, onProgressUpdate } = props;
  const isDraggingActive = useRef(false);

  // Just to keep things simple, provide one props object to all the helpers.
  const propsWithData: ISoundWavePropsWithData = { ...props, data };

  const getRelativeMouseX = (e: { clientX: number }) => {
    return e.clientX - (canvasRef.current?.offsetLeft || 0);
  };

  const handlePointerDown = (downEvent: React.PointerEvent) => {
    const startPointerX = getRelativeMouseX(downEvent);
    const currentPointX = getCurrentSampleX(propsWithData);
    const zoomAreaX1 = currentPointX - ZOOM_AREA_INTERACTION_MARGIN;
    const zoomAreaX2 = getCurrentSampleX(propsWithData) + width / zoom + ZOOM_AREA_INTERACTION_MARGIN;
    const zoomedInViewPointsCount = getZoomedInViewPointsCount(propsWithData);
    const pointsCount = getPointsCount(propsWithData);
    const zoomedInViewPadding = width * zoomedInViewPointsCount / pointsCount;

    if (startPointerX >= zoomAreaX1 && startPointerX <= zoomAreaX2) {
      isDraggingActive.current = true;
      document.body.style.cursor = "grab";
      const offset = startPointerX - currentPointX;

      const handleDragging = (moveEvent: PointerEvent) => {
        const pointerX = getRelativeMouseX(moveEvent);
        onProgressUpdate?.(Math.max(0, Math.min(1, (pointerX - offset) / (width - zoomedInViewPadding))));
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
    const zoomAreaX1 = getCurrentSampleX(propsWithData) - ZOOM_AREA_INTERACTION_MARGIN;
    const zoomAreaX2 = getCurrentSampleX(propsWithData) + width / zoom + ZOOM_AREA_INTERACTION_MARGIN;

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
