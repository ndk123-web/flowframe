"use client";

/**
 * ArchDiagram
 *
 * A single fixed-viewBox SVG component that renders:
 *   Client → LoadBalancer → Server1
 *                        ↘ Server2
 *
 * All coordinates live inside a 700 × 300 viewBox.
 * Node label positions + connector endpoints are derived
 * from the same constants, so they are always perfectly aligned.
 */

import { motion } from "framer-motion";
import { useEffect, useId, useState } from "react";

// ─── Layout constants (viewBox 700 × 320) ──────────────────────────
const W = 700;
const H = 320;

// Node centre-points  (3 servers, evenly spaced vertically)
const CLIENT = { x: 80,  y: H / 2 };
const LB     = { x: 290, y: H / 2 };
const S1     = { x: 560, y: 60  };   // top
const S2     = { x: 560, y: H / 2 }; // middle
const S3     = { x: 560, y: H - 60 }; // bottom

// Card dimensions
const NODE_W = 130;
const NODE_H = 40;
const NODE_RX = 10; // border-radius

// Helper: top-left of a card from its centre
const cardX = (cx: number) => cx - NODE_W / 2;
const cardY = (cy: number) => cy - NODE_H / 2;

// ─── Packet animation keyframes ────────────────────────────────────
// Segment 1: CLIENT → LB
// Segment 2a: LB → S1
// Segment 2b: LB → S2
// We animate cx/cy through those waypoints.

interface PacketProps {
  toServer: "s1" | "s2" | "s3";
  duration: number;
  delay?: number;
  active?: boolean;
  uid: string;
  emphasis?: number;
}

function Packet({
  toServer,
  duration,
  delay = 0,
  active = true,
  uid,
  emphasis = 1,
}: PacketProps) {
  const target = toServer === "s1" ? S1 : toServer === "s2" ? S2 : S3;

  // cx: Client → LB → target
  const cxFrames = [CLIENT.x, LB.x, target.x];
  // cy: follows same waypoints
  const cyFrames = [CLIENT.y, LB.y, target.y];

  return (
    <motion.circle
      r={5.5}
      fill={`url(#packetGrad-${uid})`}
      style={{ filter: `drop-shadow(0 0 ${7 + emphasis * 2}px rgba(139,92,246,0.86))` }}
      animate={
        active
          ? {
              cx: cxFrames,
              cy: cyFrames,
              opacity: [0, 0.42 * emphasis, 0.78 * emphasis, 0.14],
            }
          : { opacity: 0 }
      }
      transition={{
        duration,
        repeat: Infinity,
        ease: "linear",
        delay,
        times: [0, 0.48, 0.98, 1],
      }}
    />
  );
}

// ─── Node card (foreignObject lets us use HTML text styling inside SVG) ──
interface NodeProps {
  cx: number;
  cy: number;
  label: string;
  accent?: boolean;
  floatDelay?: number;
}

function Node({ cx, cy, label, accent = false, floatDelay = 0 }: NodeProps) {
  const x = cardX(cx);
  const y = cardY(cy);

  return (
    <motion.g
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: floatDelay }}
    >
      <rect
        x={x}
        y={y}
        width={NODE_W}
        height={NODE_H}
        rx={NODE_RX}
        fill="var(--surface)"
        stroke={accent ? "rgba(99,102,241,0.55)" : "var(--border)"}
        strokeWidth={accent ? 1.5 : 1}
      />
      {/* glow on accent node */}
      {accent && (
        <rect
          x={x}
          y={y}
          width={NODE_W}
          height={NODE_H}
          rx={NODE_RX}
          fill="rgba(99,102,241,0.06)"
        />
      )}
      <text
        x={cx}
        y={cy + 5}
        textAnchor="middle"
        fontSize={13}
        fontWeight={500}
        fontFamily="var(--font-geist-sans), SF Pro Text, sans-serif"
        fill="var(--foreground)"
      >
        {label}
      </text>
    </motion.g>
  );
}

// ─── Connector line ─────────────────────────────────────────────────
interface ConnectorProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  delay?: number;
  uid: string;
}

function Connector({ x1, y1, x2, y2, delay = 0, uid }: ConnectorProps) {
  return (
    <motion.line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={`url(#lineGrad-${uid})`}
      strokeWidth={1.7}
      strokeLinecap="round"
      animate={{ strokeOpacity: [0.33, 0.72, 0.33] }}
      transition={{ duration: 5.4, repeat: Infinity, ease: "easeInOut", delay }}
    />
  );
}

// ─── Public component ───────────────────────────────────────────────
interface ArchDiagramProps {
  /** If false packets freeze in place (Pause button) */
  active?: boolean;
  /** Multiplies packet speed */
  speed?: number;
  /** Optional external frame index to drive route emphasis */
  frameIndex?: number;
  className?: string;
}

export default function ArchDiagram({
  active = true,
  speed = 1,
  frameIndex,
  className = "",
}: ArchDiagramProps) {
  const uid = useId().replace(/:/g, "-");
  const baseDuration = 4.6 / speed;
  const [internalFrame, setInternalFrame] = useState(0);

  useEffect(() => {
    if (typeof frameIndex === "number" || !active) {
      return;
    }
    const id = setInterval(() => {
      setInternalFrame((prev) => (prev + 1) % 3);
    }, 2200 / speed);
    return () => clearInterval(id);
  }, [active, frameIndex, speed]);

  const routeIndex = typeof frameIndex === "number" ? frameIndex % 3 : internalFrame;
  const activeRoute: "s1" | "s2" | "s3" =
    routeIndex === 0 ? "s1" : routeIndex === 1 ? "s2" : "s3";

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full h-full ${className}`}
      aria-label="Client → LoadBalancer → Server1 / Server2 / Server3 architecture diagram"
    >
      <defs>
        {/* gradient for connector lines — userSpaceOnUse so horizontal lines render correctly */}
        <linearGradient id={`lineGrad-${uid}`} x1="0" y1="0" x2={W} y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.9" />
        </linearGradient>

        {/* gradient for packets */}
        <radialGradient id={`packetGrad-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#6366f1" />
        </radialGradient>
      </defs>

      {/* ── Connectors ── */}
      {/* Client right-edge → LB left-edge */}
      <Connector
        x1={CLIENT.x + NODE_W / 2}
        y1={CLIENT.y}
        x2={LB.x - NODE_W / 2}
        y2={LB.y}
        delay={0}
        uid={uid}
      />
      {/* LB right-edge → S1 left-edge */}
      <Connector
        x1={LB.x + NODE_W / 2}
        y1={LB.y}
        x2={S1.x - NODE_W / 2}
        y2={S1.y}
        delay={0.2}
        uid={uid}
      />
      {/* LB right-edge → S2 left-edge */}
      <Connector
        x1={LB.x + NODE_W / 2}
        y1={LB.y}
        x2={S2.x - NODE_W / 2}
        y2={S2.y}
        delay={0.35}
        uid={uid}
      />
      {/* LB right-edge → S3 left-edge */}
      <Connector
        x1={LB.x + NODE_W / 2}
        y1={LB.y}
        x2={S3.x - NODE_W / 2}
        y2={S3.y}
        delay={0.5}
        uid={uid}
      />

      <Node cx={CLIENT.x} cy={CLIENT.y} label="Client" floatDelay={0} />
      <Node cx={LB.x} cy={LB.y} label="LoadBalancer" accent floatDelay={0.6} />
      <Node cx={S1.x} cy={S1.y} label="Server 1" accent={activeRoute === "s1"} floatDelay={1.1} />
      <Node cx={S2.x} cy={S2.y} label="Server 2" accent={activeRoute === "s2"} floatDelay={1.7} />
      <Node cx={S3.x} cy={S3.y} label="Server 3" accent={activeRoute === "s3"} floatDelay={2.2} />

      {/* Continuous ambient streams with frame-driven emphasis */}
      <Packet
        toServer="s1"
        duration={baseDuration}
        delay={0}
        active={active}
        uid={uid}
        emphasis={activeRoute === "s1" ? 1.25 : 0.7}
      />
      <Packet
        toServer="s2"
        duration={baseDuration + 0.28}
        delay={1.1}
        active={active}
        uid={uid}
        emphasis={activeRoute === "s2" ? 1.25 : 0.7}
      />
      <Packet
        toServer="s3"
        duration={baseDuration + 0.52}
        delay={2.15}
        active={active}
        uid={uid}
        emphasis={activeRoute === "s3" ? 1.25 : 0.7}
      />
      <Packet toServer="s1" duration={baseDuration + 0.8} delay={3.1} active={active} uid={uid} emphasis={0.65} />
      <Packet toServer="s2" duration={baseDuration + 1.1} delay={3.9} active={active} uid={uid} emphasis={0.65} />
      <Packet toServer="s3" duration={baseDuration + 1.35} delay={4.7} active={active} uid={uid} emphasis={0.65} />
    </svg>
  );
}
