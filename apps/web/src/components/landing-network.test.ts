import { describe, expect, it } from "vitest";
import {
  advanceNetworkNode,
  calculatePointerRepulsion,
  createNetworkNodes,
  findNetworkConnections,
  getNetworkNodeCount,
  shouldAnimateNetwork,
  type NetworkNode,
} from "./landing-network";

function node(overrides: Partial<NetworkNode> & Pick<NetworkNode, "id" | "x" | "y">): NetworkNode {
  return {
    depth: 1,
    velocityX: 4,
    velocityY: 0,
    radius: 1,
    opacity: 0.22,
    tone: "mint",
    offsetX: 0,
    offsetY: 0,
    ...overrides,
  };
}

describe("landing node network", () => {
  it("generates deterministic nodes across three depth layers", () => {
    const first = createNetworkNodes(1280, 900, 42);
    const second = createNetworkNodes(1280, 900, 42);

    expect(first).toEqual(second);
    expect(new Set(first.map((item) => item.depth))).toEqual(new Set([0, 1, 2]));
  });

  it("limits density for mobile and desktop viewports", () => {
    expect(getNetworkNodeCount(360, 800)).toBeGreaterThanOrEqual(24);
    expect(getNetworkNodeCount(360, 4000)).toBeLessThanOrEqual(38);
    expect(getNetworkNodeCount(2560, 1600)).toBeLessThanOrEqual(72);
  });

  it("moves by elapsed time and clamps long frame gaps", () => {
    const current = node({ id: 1, x: 100, y: 100, velocityX: 10 });
    advanceNetworkNode(current, 0.02, 500, 500, null);
    expect(current.x).toBeCloseTo(100.2);

    advanceNetworkNode(current, 3, 500, 500, null);
    expect(current.x).toBeCloseTo(100.7);
  });

  it("wraps nodes without allowing them to drift out of the canvas", () => {
    const current = node({ id: 1, x: 520, y: 100, velocityX: 10 });
    advanceNetworkNode(current, 0.05, 500, 500, null);
    expect(current.x).toBe(-12);
  });

  it("keeps cursor repulsion within six pixels and disables it outside the radius", () => {
    const close = calculatePointerRepulsion(
      node({ id: 1, depth: 2, x: 50, y: 50 }),
      { x: 49, y: 50, active: true },
    );
    expect(Math.hypot(close.x, close.y)).toBeLessThanOrEqual(6);

    const far = calculatePointerRepulsion(
      node({ id: 2, x: 250, y: 250 }),
      { x: 0, y: 0, active: true },
    );
    expect(far).toEqual({ x: 0, y: 0 });
  });

  it("connects only nearby nodes and caps each node degree", () => {
    const nodes = [
      node({ id: 1, x: 0, y: 0 }),
      node({ id: 2, x: 10, y: 0 }),
      node({ id: 3, x: 20, y: 0 }),
      node({ id: 4, x: 30, y: 0 }),
      node({ id: 5, x: 500, y: 500 }),
    ];
    const connections = findNetworkConnections(nodes, 800, 600, 40, 2);
    const degrees = new Map<number, number>();

    for (const connection of connections) {
      expect(Math.hypot(connection.from.x - connection.to.x, connection.from.y - connection.to.y)).toBeLessThanOrEqual(40);
      degrees.set(connection.from.id, (degrees.get(connection.from.id) ?? 0) + 1);
      degrees.set(connection.to.id, (degrees.get(connection.to.id) ?? 0) + 1);
    }

    expect(Math.max(...degrees.values())).toBeLessThanOrEqual(2);
    expect(connections.some(({ from, to }) => from.id === 5 || to.id === 5)).toBe(false);
  });

  it("honors pause, page visibility, and reduced motion", () => {
    expect(shouldAnimateNetwork(false, false, true)).toBe(true);
    expect(shouldAnimateNetwork(true, false, true)).toBe(false);
    expect(shouldAnimateNetwork(false, true, true)).toBe(false);
    expect(shouldAnimateNetwork(false, false, false)).toBe(false);
  });
});
