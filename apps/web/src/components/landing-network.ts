export type NetworkDepth = 0 | 1 | 2;

export type NetworkNode = {
  id: number;
  depth: NetworkDepth;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  radius: number;
  opacity: number;
  tone: "mint" | "white";
  offsetX: number;
  offsetY: number;
};

export type NetworkPointer = {
  x: number;
  y: number;
  active: boolean;
};

export type NetworkConnection = {
  from: NetworkNode;
  to: NetworkNode;
  opacity: number;
};

const MIN_NODES = 24;
const MOBILE_NODE_CAP = 38;
const DESKTOP_NODE_CAP = 72;
const NODE_AREA = 22_000;

function createSeededRandom(seed: number) {
  let state = seed >>> 0;

  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

export function getNetworkNodeCount(width: number, height: number) {
  const cap = width < 768 ? MOBILE_NODE_CAP : DESKTOP_NODE_CAP;
  return Math.min(cap, Math.max(MIN_NODES, Math.round((width * height) / NODE_AREA)));
}

export function createNetworkNodes(width: number, height: number, seed = 3_120_2019) {
  const random = createSeededRandom(seed);
  const count = getNetworkNodeCount(width, height);
  const nodes: NetworkNode[] = [];

  for (let index = 0; index < count; index += 1) {
    const depth = (index % 3) as NetworkDepth;
    const angle = random() * Math.PI * 2;
    const speedRange = [2.8, 4.6, 7.2] as const;
    const speed = speedRange[depth] * (0.72 + random() * 0.56);

    nodes.push({
      id: index,
      depth,
      x: random() * width,
      y: random() * height,
      velocityX: Math.cos(angle) * speed,
      velocityY: Math.sin(angle) * speed,
      radius: 0.8 + depth * 0.24 + random() * 0.42,
      opacity: 0.21 + random() * 0.04,
      tone: random() > 0.36 ? "mint" : "white",
      offsetX: 0,
      offsetY: 0,
    });
  }

  return nodes;
}

export function calculatePointerRepulsion(
  node: Pick<NetworkNode, "id" | "depth" | "x" | "y">,
  pointer: NetworkPointer | null,
  radius = 104,
  maximumOffset = 6,
) {
  if (!pointer?.active) return { x: 0, y: 0 };

  const deltaX = node.x - pointer.x;
  const deltaY = node.y - pointer.y;
  const distance = Math.hypot(deltaX, deltaY);
  if (distance >= radius) return { x: 0, y: 0 };

  const depthFactor = [0.64, 0.82, 1][node.depth];
  const strength = (1 - distance / radius) * maximumOffset * depthFactor;
  const fallbackAngle = node.id * 2.399963229728653;
  const directionX = distance > 0.001 ? deltaX / distance : Math.cos(fallbackAngle);
  const directionY = distance > 0.001 ? deltaY / distance : Math.sin(fallbackAngle);

  return { x: directionX * strength, y: directionY * strength };
}

export function advanceNetworkNode(
  node: NetworkNode,
  deltaSeconds: number,
  width: number,
  height: number,
  pointer: NetworkPointer | null,
) {
  const safeDelta = Math.min(Math.max(deltaSeconds, 0), 0.05);
  const margin = 12;
  node.x += node.velocityX * safeDelta;
  node.y += node.velocityY * safeDelta;

  if (node.x < -margin) node.x = width + margin;
  if (node.x > width + margin) node.x = -margin;
  if (node.y < -margin) node.y = height + margin;
  if (node.y > height + margin) node.y = -margin;

  const target = calculatePointerRepulsion(node, pointer);
  const smoothing = 1 - Math.exp(-safeDelta * 5.5);
  node.offsetX += (target.x - node.offsetX) * smoothing;
  node.offsetY += (target.y - node.offsetY) * smoothing;

  return node;
}

function isHeroQuietZone(x: number, y: number, width: number, height: number) {
  return x > width * 0.05 && x < width * 0.58 && y > height * 0.12 && y < height * 0.78;
}

export function getNodeOpacity(node: NetworkNode, width: number, height: number) {
  const x = node.x + node.offsetX;
  const y = node.y + node.offsetY;
  return isHeroQuietZone(x, y, width, height) ? Math.max(0.15, node.opacity * 0.76) : node.opacity;
}

export function findNetworkConnections(
  nodes: NetworkNode[],
  width: number,
  height: number,
  maximumDistance = 132,
  maximumConnectionsPerNode = 3,
) {
  const candidates: Array<NetworkConnection & { distance: number }> = [];

  for (let fromIndex = 0; fromIndex < nodes.length; fromIndex += 1) {
    for (let toIndex = fromIndex + 1; toIndex < nodes.length; toIndex += 1) {
      const from = nodes[fromIndex];
      const to = nodes[toIndex];
      const fromX = from.x + from.offsetX;
      const fromY = from.y + from.offsetY;
      const toX = to.x + to.offsetX;
      const toY = to.y + to.offsetY;
      const distance = Math.hypot(fromX - toX, fromY - toY);

      if (distance > maximumDistance) continue;

      const midpointX = (fromX + toX) / 2;
      const midpointY = (fromY + toY) / 2;
      const proximity = 1 - distance / maximumDistance;
      const opacity = isHeroQuietZone(midpointX, midpointY, width, height)
        ? 0.15
        : 0.15 + proximity * 0.07;
      candidates.push({ from, to, distance, opacity });
    }
  }

  candidates.sort((left, right) => left.distance - right.distance);
  const degrees = new Map<number, number>();
  const connections: NetworkConnection[] = [];

  for (const candidate of candidates) {
    const fromDegree = degrees.get(candidate.from.id) ?? 0;
    const toDegree = degrees.get(candidate.to.id) ?? 0;
    if (fromDegree >= maximumConnectionsPerNode || toDegree >= maximumConnectionsPerNode) continue;

    connections.push({ from: candidate.from, to: candidate.to, opacity: candidate.opacity });
    degrees.set(candidate.from.id, fromDegree + 1);
    degrees.set(candidate.to.id, toDegree + 1);
  }

  return connections;
}

export function shouldAnimateNetwork(paused: boolean, reducedMotion: boolean, pageVisible: boolean) {
  return !paused && !reducedMotion && pageVisible;
}
