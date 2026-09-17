// Test setup file
import { vi } from 'vitest'

// jsdom lacks ResizeObserver, which Puck's drag-and-drop layer (@dnd-kit/dom)
// requires at import time. Provide a minimal stub before any test module loads.
class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

if (typeof globalThis.ResizeObserver === 'undefined') {
  vi.stubGlobal('ResizeObserver', ResizeObserverStub)
}
