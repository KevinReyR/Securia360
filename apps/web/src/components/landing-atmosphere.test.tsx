// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LandingAtmosphere } from "./landing-atmosphere";

const canvasContext = {
  arc: vi.fn(),
  beginPath: vi.fn(),
  clearRect: vi.fn(),
  fill: vi.fn(),
  fillStyle: "",
  lineTo: vi.fn(),
  lineWidth: 1,
  moveTo: vi.fn(),
  setTransform: vi.fn(),
  stroke: vi.fn(),
  strokeStyle: "",
} as unknown as CanvasRenderingContext2D;

let prefersReducedMotion = false;
let visibilityState: DocumentVisibilityState = "visible";
let resizeDisconnected = false;

class ResizeObserverMock {
  observe = vi.fn();
  disconnect = vi.fn(() => {
    resizeDisconnected = true;
  });
  unobserve = vi.fn();
}

describe("LandingAtmosphere", () => {
  beforeEach(() => {
    prefersReducedMotion = false;
    visibilityState = "visible";
    resizeDisconnected = false;
    vi.stubGlobal("ResizeObserver", ResizeObserverMock);
    vi.stubGlobal("requestAnimationFrame", vi.fn(() => 17));
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(canvasContext);
    vi.spyOn(HTMLCanvasElement.prototype, "getBoundingClientRect").mockReturnValue({
      bottom: 900,
      height: 900,
      left: 0,
      right: 1280,
      top: 0,
      width: 1280,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    vi.stubGlobal("matchMedia", vi.fn((query: string) => ({
      matches: query.includes("prefers-reduced-motion") ? prefersReducedMotion : true,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })));
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => visibilityState,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("pauses, resumes, and releases animation resources", () => {
    const view = render(<LandingAtmosphere />);
    const control = screen.getByRole("button", { name: "Pausar fondo" });

    expect(requestAnimationFrame).toHaveBeenCalled();
    fireEvent.click(control);
    expect(cancelAnimationFrame).toHaveBeenCalledWith(17);
    expect(screen.getByRole("button", { name: "Activar fondo" })).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: "Activar fondo" }));
    expect(requestAnimationFrame).toHaveBeenCalledTimes(2);

    visibilityState = "hidden";
    document.dispatchEvent(new Event("visibilitychange"));
    expect(cancelAnimationFrame).toHaveBeenCalled();

    visibilityState = "visible";
    document.dispatchEvent(new Event("visibilitychange"));
    expect(requestAnimationFrame).toHaveBeenCalledTimes(3);

    view.unmount();
    expect(resizeDisconnected).toBe(true);
  });

  it("renders a static network and removes the motion control for reduced motion", () => {
    prefersReducedMotion = true;
    render(<LandingAtmosphere />);

    expect(screen.queryByRole("button", { name: "Pausar fondo" })).not.toBeInTheDocument();
    expect(requestAnimationFrame).not.toHaveBeenCalled();
    expect(screen.getByTestId("landing-network")).toBeInTheDocument();
  });
});
