"use client";

import { Pause, Play } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import styles from "./landing-atmosphere.module.css";
import {
  advanceNetworkNode,
  createNetworkNodes,
  findNetworkConnections,
  getNodeOpacity,
  shouldAnimateNetwork,
  type NetworkNode,
  type NetworkPointer,
} from "./landing-network";

const MINT_NODE = "122 203 163";
const WHITE_NODE = "255 255 255";

function drawNetwork(
  context: CanvasRenderingContext2D,
  nodes: NetworkNode[],
  width: number,
  height: number,
) {
  context.clearRect(0, 0, width, height);

  for (const connection of findNetworkConnections(nodes, width, height)) {
    context.beginPath();
    context.moveTo(connection.from.x + connection.from.offsetX, connection.from.y + connection.from.offsetY);
    context.lineTo(connection.to.x + connection.to.offsetX, connection.to.y + connection.to.offsetY);
    context.strokeStyle = `rgb(73 139 105 / ${connection.opacity})`;
    context.lineWidth = 0.7;
    context.stroke();
  }

  for (const node of nodes) {
    const x = node.x + node.offsetX;
    const y = node.y + node.offsetY;
    const color = node.tone === "mint" ? MINT_NODE : WHITE_NODE;

    context.beginPath();
    context.arc(x, y, node.radius * 2.4, 0, Math.PI * 2);
    context.fillStyle = "rgb(87 167 126 / 0.15)";
    context.fill();

    context.beginPath();
    context.arc(x, y, node.radius, 0, Math.PI * 2);
    context.fillStyle = `rgb(${color} / ${getNodeOpacity(node, width, height)})`;
    context.fill();
  }
}

export function LandingAtmosphere() {
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(paused);
  const animationControlsRef = useRef<{ syncPausedState: (isPaused: boolean) => void } | null>(null);

  useEffect(() => {
    pausedRef.current = paused;
    animationControlsRef.current?.syncPausedState(paused);
  }, [paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const precisePointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const pointer: NetworkPointer = { x: 0, y: 0, active: false };
    let nodes: NetworkNode[] = [];
    let width = 0;
    let height = 0;
    let frameId: number | null = null;
    let lastFrameTime: number | null = null;
    let prefersReducedMotion = reducedMotionQuery.matches;

    const render = () => drawNetwork(context, nodes, width, height);

    const stopAnimation = () => {
      if (frameId !== null) cancelAnimationFrame(frameId);
      frameId = null;
      lastFrameTime = null;
    };

    const scheduleAnimation = () => {
      if (
        frameId === null &&
        shouldAnimateNetwork(pausedRef.current, prefersReducedMotion, document.visibilityState !== "hidden")
      ) {
        frameId = requestAnimationFrame(animate);
      }
    };

    const animate = (time: number) => {
      frameId = null;
      const deltaSeconds = lastFrameTime === null ? 0 : (time - lastFrameTime) / 1000;
      lastFrameTime = time;
      for (const node of nodes) advanceNetworkNode(node, deltaSeconds, width, height, pointer);
      render();
      scheduleAnimation();
    };

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      width = Math.max(1, Math.round(bounds.width));
      height = Math.max(1, Math.round(bounds.height));
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      nodes = createNetworkNodes(width, height);
      render();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") stopAnimation();
      else scheduleAnimation();
    };

    const handleMotionPreference = (event: MediaQueryListEvent) => {
      prefersReducedMotion = event.matches;
      setReducedMotion(event.matches);
      if (event.matches) {
        stopAnimation();
        render();
      } else {
        scheduleAnimation();
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!precisePointerQuery.matches || prefersReducedMotion) return;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;
    };

    const handlePointerLeave = () => {
      pointer.active = false;
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    reducedMotionQuery.addEventListener("change", handleMotionPreference);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", handlePointerLeave);
    setReducedMotion(prefersReducedMotion);
    resize();
    scheduleAnimation();
    animationControlsRef.current = {
      syncPausedState(isPaused) {
        if (isPaused) {
          stopAnimation();
          render();
        } else {
          scheduleAnimation();
        }
      },
    };

    return () => {
      animationControlsRef.current = null;
      stopAnimation();
      resizeObserver.disconnect();
      reducedMotionQuery.removeEventListener("change", handleMotionPreference);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pointermove", handlePointerMove);
      document.documentElement.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, []);

  return <>
    <div aria-hidden="true" className={styles.scene} data-paused={paused} data-reduced-motion={reducedMotion}>
      <canvas className={styles.canvas} ref={canvasRef} data-testid="landing-network" />
      <div className={styles.fallback} />
    </div>
    {!reducedMotion ? (
      <button type="button" className={styles.control} aria-pressed={paused} onClick={() => setPaused(!paused)}>
        {paused ? <Play size={14} aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />}
        {paused ? "Activar fondo" : "Pausar fondo"}
      </button>
    ) : null}
  </>;
}
