import "@testing-library/jest-dom/vitest";

// @puckeditor/core (via usePuck) pulls in @dnd-kit which expects ResizeObserver.
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
