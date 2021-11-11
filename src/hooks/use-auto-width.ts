import { useEffect } from "react";
import ResizeObserver from "resize-observer-polyfill";

interface IConfig {
  container: HTMLElement | null;
  onWidthChange: (newWidth: number) => void;
}

export const useAutoWidth = ({ container, onWidthChange }: IConfig) => {
  useEffect(() => {
    if (!container) {
      return;
    }
    // TypeScript doesn't seem to have types of the native ResizeObserver yet. Use types coming from polyfill.
    const NativeResizeObserver = (window as any).ResizeObserver as new (callback: ResizeObserverCallback) => ResizeObserver;

    const observer = new (NativeResizeObserver || ResizeObserver)(entries => {
      const entry = entries[0];
      // scrollWidth describes min width of the container necessary to avoid scrollbars.
      // It works better than offsetWidth (e.g. when we have some elements with `float:right` css props).
      // Note that this works correctly in all browsers only when CSS overflow is set to "hidden".
      const width = entry?.target?.scrollWidth;
      if (width && width > 0) {
        onWidthChange(Math.ceil(width));
      }
    });

    // Set overflowX=hidden style to make sure that scrollWidth reports correct value.
    // See: https://www.pivotaltracker.com/story/show/174256088
    const prevOverflowStyle = container.style.overflowX;
    container.style.overflowX = "hidden";
    observer.observe(container);
    // Cleanup function.
    return () => {
      observer.disconnect();
      container.style.overflowX = prevOverflowStyle;
      observer.observe(container);
    };
  }, [container, onWidthChange]);
};
