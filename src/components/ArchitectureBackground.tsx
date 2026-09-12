"use client";

import React, { useEffect, useRef, useId } from "react";

interface ArchitectureBackgroundProps {
  variant?: "hero" | "dashboard" | "section";
  className?: string;
}

// ── Vertical Top-to-Bottom Architecture Node Coordinates (800 x 860 Canvas) ──
// Center spine at X = 400. Topology flows vertically downwards:
// Client ↓ API Gateway ↓ Load Balancer ↓ Server 1 ───── Redis ↓ Server 2 ↓ PostgreSQL
const V_NODES = {
  client: { id: "v-client", label: "CLIENT", role: "web / api client", x: 340, y: 70, w: 120, h: 46 },
  gateway: { id: "v-gateway", label: "API GATEWAY", role: "reverse proxy", x: 335, y: 190, w: 130, h: 46 },
  lb: { id: "v-lb", label: "LOAD BALANCER", role: "round-robin", x: 330, y: 310, w: 140, h: 46 },
  server1: { id: "v-server1", label: "SERVER 1", role: "app cluster alpha", x: 260, y: 440, w: 120, h: 46 },
  redis: { id: "v-redis", label: "REDIS", role: "in-memory cache", x: 480, y: 440, w: 110, h: 46 },
  server2: { id: "v-server2", label: "SERVER 2", role: "app cluster beta", x: 260, y: 570, w: 120, h: 46 },
  postgres: { id: "v-postgres", label: "POSTGRESQL", role: "primary database", x: 330, y: 700, w: 140, h: 46 },
};

type LegDef = {
  edgeId: string;
  targetNodeId: string;
  durationMs: number;
  pauseMs: number;
  type: "line" | "bezier";
  p0: [number, number];
  p1: [number, number];
  p2?: [number, number];
  p3?: [number, number];
};

// Flow A: Cache Route (Client ↓ Gateway ↓ LB ↓ Server 1 ─────► Redis)
const VERTICAL_FLOW_A: LegDef[] = [
  {
    edgeId: "v-edge-c-gw",
    targetNodeId: "v-gateway",
    durationMs: 800,
    pauseMs: 260,
    type: "line",
    p0: [400, 116],
    p1: [400, 190],
  },
  {
    edgeId: "v-edge-gw-lb",
    targetNodeId: "v-lb",
    durationMs: 800,
    pauseMs: 260,
    type: "line",
    p0: [400, 236],
    p1: [400, 310],
  },
  {
    edgeId: "v-edge-lb-s1",
    targetNodeId: "v-server1",
    durationMs: 850,
    pauseMs: 260,
    type: "bezier",
    p0: [365, 356],
    p1: [365, 400],
    p2: [320, 400],
    p3: [320, 440],
  },
  {
    edgeId: "v-edge-s1-redis",
    targetNodeId: "v-redis",
    durationMs: 800,
    pauseMs: 450,
    type: "line",
    p0: [380, 463],
    p1: [480, 463],
  },
];

// Flow B: Database Route (Client ↓ Gateway ↓ LB ↓ Server 2 ↓ PostgreSQL)
const VERTICAL_FLOW_B: LegDef[] = [
  {
    edgeId: "v-edge-c-gw",
    targetNodeId: "v-gateway",
    durationMs: 800,
    pauseMs: 260,
    type: "line",
    p0: [400, 116],
    p1: [400, 190],
  },
  {
    edgeId: "v-edge-gw-lb",
    targetNodeId: "v-lb",
    durationMs: 800,
    pauseMs: 260,
    type: "line",
    p0: [400, 236],
    p1: [400, 310],
  },
  {
    edgeId: "v-edge-lb-s2",
    targetNodeId: "v-server2",
    durationMs: 950,
    pauseMs: 260,
    type: "bezier",
    p0: [435, 356],
    p1: [455, 460],
    p2: [410, 520],
    p3: [360, 570],
  },
  {
    edgeId: "v-edge-s2-pg",
    targetNodeId: "v-postgres",
    durationMs: 800,
    pauseMs: 450,
    type: "bezier",
    p0: [320, 616],
    p1: [320, 660],
    p2: [370, 660],
    p3: [370, 700],
  },
];

// Cubic Bezier interpolation
function getCubicBezier(
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
  t: number
): [number, number] {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  const t2 = t * t;
  const t3 = t2 * t;

  const x = mt3 * p0[0] + 3 * mt2 * t * p1[0] + 3 * mt * t2 * p2[0] + t3 * p3[0];
  const y = mt3 * p0[1] + 3 * mt2 * t * p1[1] + 3 * mt * t2 * p2[1] + t3 * p3[1];
  return [x, y];
}

// Gentle quadratic ease-in-out
function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

export default function ArchitectureBackground({
  variant = "hero",
  className = "",
}: ArchitectureBackgroundProps) {
  const id = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const packetRef = useRef<SVGCircleElement>(null);

  // Dashboard uses longer quiet pauses between requests
  const idlePauseMs = variant === "dashboard" ? 4200 : 2500;

  useEffect(() => {
    // Respect reduced motion: If the user prefers reduced motion, stay static
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const svg = svgRef.current;
    const packet = packetRef.current;
    if (!svg || !packet) return;

    let isDisposed = false;
    let animFrameId: number | null = null;
    let timerId: ReturnType<typeof setTimeout> | null = null;
    let flowIndex = 0; // Alternates between Flow A and Flow B

    // Helper to highlight / unhighlight SVG elements directly
    const setEdgeActive = (edgeId: string, active: boolean) => {
      const el = svg.querySelector(`[data-edge="${edgeId}"]`) as SVGPathElement | null;
      if (el) {
        if (active) {
          el.setAttribute("stroke", "#3b82f6");
          el.setAttribute("stroke-width", "1.6");
          el.setAttribute("stroke-opacity", "1");
        } else {
          el.setAttribute("stroke", "currentColor");
          el.setAttribute("stroke-width", "1.2");
          el.setAttribute("stroke-opacity", "0.4");
        }
      }
    };

    const setNodeActive = (nodeId: string, active: boolean) => {
      const rect = svg.querySelector(`[data-node="${nodeId}"] rect`) as SVGRectElement | null;
      const dot = svg.querySelector(`[data-node="${nodeId}"] circle`) as SVGCircleElement | null;
      if (rect) {
        if (active) {
          rect.setAttribute("stroke", "#3b82f6");
          rect.setAttribute("stroke-width", "1.6");
        } else {
          rect.setAttribute("stroke", "currentColor");
          rect.setAttribute("stroke-width", "1");
        }
      }
      if (dot) {
        dot.setAttribute("fill", active ? "#3b82f6" : "currentColor");
      }
    };

    const runFlow = () => {
      if (isDisposed) return;

      const currentFlow = flowIndex % 2 === 0 ? VERTICAL_FLOW_A : VERTICAL_FLOW_B;
      flowIndex++;

      let legIndex = 0;

      const executeLeg = () => {
        if (isDisposed) return;

        if (legIndex >= currentFlow.length) {
          // Flow completed: Hide packet, reset all nodes to static resting state
          packet.setAttribute("opacity", "0");
          timerId = setTimeout(runFlow, idlePauseMs);
          return;
        }

        const leg = currentFlow[legIndex];

        // Highlight active connection edge
        setEdgeActive(leg.edgeId, true);

        // Show packet
        packet.setAttribute("opacity", "1");
        packet.setAttribute("cx", String(leg.p0[0]));
        packet.setAttribute("cy", String(leg.p0[1]));

        const startTime = performance.now();

        const step = (now: number) => {
          if (isDisposed) return;

          const elapsed = now - startTime;
          const rawProgress = Math.min(elapsed / leg.durationMs, 1);
          const t = easeInOut(rawProgress);

          let currentX = leg.p0[0];
          let currentY = leg.p0[1];

          if (leg.type === "line") {
            currentX = leg.p0[0] + (leg.p1[0] - leg.p0[0]) * t;
            currentY = leg.p0[1] + (leg.p1[1] - leg.p0[1]) * t;
          } else if (leg.type === "bezier" && leg.p2 && leg.p3) {
            const pt = getCubicBezier(leg.p0, leg.p1, leg.p2, leg.p3, t);
            currentX = pt[0];
            currentY = pt[1];
          }

          packet.setAttribute("cx", String(currentX));
          packet.setAttribute("cy", String(currentY));

          if (rawProgress < 1) {
            animFrameId = requestAnimationFrame(step);
          } else {
            // Packet reached target node
            setEdgeActive(leg.edgeId, false);
            setNodeActive(leg.targetNodeId, true);

            timerId = setTimeout(() => {
              if (isDisposed) return;
              setNodeActive(leg.targetNodeId, false);
              legIndex++;
              executeLeg();
            }, leg.pauseMs);
          }
        };

        animFrameId = requestAnimationFrame(step);
      };

      // Start leg 0
      executeLeg();
    };

    // Initial brief 1000ms delay before first request begins
    timerId = setTimeout(runFlow, 1000);

    return () => {
      isDisposed = true;
      if (animFrameId !== null) cancelAnimationFrame(animFrameId);
      if (timerId !== null) clearTimeout(timerId);
    };
  }, [idlePauseMs]);

  // Restrained opacity settings:
  // Dashboard is ultra-faint to guarantee 100% readability over dense cards.
  // Hero & section are subtly visible, framing the content without competing.
  const containerOpacity =
    variant === "dashboard"
      ? "opacity-15 dark:opacity-20"
      : variant === "section"
      ? "opacity-25 dark:opacity-35"
      : "opacity-25 dark:opacity-35";

  const rootPlacement =
    variant === "hero"
      ? "absolute top-0 left-0 right-0 h-[880px]"
      : "absolute inset-0";

  const svgAspect = variant === "hero" ? "xMidYMin meet" : "xMidYMid meet";

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none ${rootPlacement} overflow-hidden select-none -z-0 hidden sm:block ${className}`}
    >
      {/* Soft radial vignette so vertical topology fades gently towards page boundaries */}
      <div
        className={`w-full h-full text-slate-400 dark:text-slate-600 transition-opacity duration-300 ${containerOpacity}`}
        style={{
          maskImage:
            "radial-gradient(ellipse 85% 85% at 50% 50%, black 35%, transparent 92%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 85% 85% at 50% 50%, black 35%, transparent 92%)",
        }}
      >
        <svg
          ref={svgRef}
          className="w-full h-full max-w-[860px] mx-auto min-h-[680px]"
          viewBox="0 0 800 840"
          preserveAspectRatio={svgAspect}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Ambient Technical Dot Matrix Pattern */}
            <pattern
              id={`arch-v-dot-grid-${id}`}
              x="0"
              y="0"
              width="32"
              height="32"
              patternUnits="userSpaceOnUse"
            >
              <circle
                cx="16"
                cy="16"
                r="0.8"
                className="fill-current opacity-30"
              />
            </pattern>
          </defs>

          {/* Background Grid Pattern */}
          <rect width="100%" height="100%" fill={`url(#arch-v-dot-grid-${id})`} />

          {/* ── VERTICAL CONNECTION LINES ───────────────────────────── */}
          {/* L1: Client ↓ API Gateway */}
          <path
            data-edge="v-edge-c-gw"
            d="M 400 116 L 400 190"
            className="transition-colors duration-200"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeOpacity="0.4"
          />
          {/* Downward indicator: Client ↓ Gateway */}
          <path
            d="M 397 151 L 400 155 L 403 151"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeOpacity="0.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* L2: API Gateway ↓ Load Balancer */}
          <path
            data-edge="v-edge-gw-lb"
            d="M 400 236 L 400 310"
            className="transition-colors duration-200"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeOpacity="0.4"
          />
          {/* Downward indicator: Gateway ↓ LB */}
          <path
            d="M 397 271 L 400 275 L 403 271"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeOpacity="0.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* L3_A: Load Balancer ↓ Server 1 */}
          <path
            data-edge="v-edge-lb-s1"
            d="M 365 356 C 365 400, 320 400, 320 440"
            className="transition-colors duration-200"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeOpacity="0.4"
          />

          {/* L3_B: Load Balancer ↓ Server 2 */}
          <path
            data-edge="v-edge-lb-s2"
            d="M 435 356 C 455 460, 410 520, 360 570"
            className="transition-colors duration-200"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeOpacity="0.4"
          />

          {/* L4_A: Server 1 ───── Redis (Horizontal Cache Link) */}
          <path
            data-edge="v-edge-s1-redis"
            d="M 380 463 L 480 463"
            className="transition-colors duration-200"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeOpacity="0.4"
          />
          {/* Rightward indicator: Server 1 ─────► Redis */}
          <path
            d="M 428 460 L 432 463 L 428 466"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeOpacity="0.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Inter-Cluster Link: Server 1 ↓ Server 2 */}
          <path
            d="M 320 486 L 320 570"
            stroke="currentColor"
            strokeWidth="1"
            strokeOpacity="0.25"
            strokeDasharray="3 3"
          />
          {/* Downward indicator: Server 1 ↓ Server 2 */}
          <path
            d="M 317 526 L 320 530 L 323 526"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeOpacity="0.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* L4_B: Server 2 ↓ PostgreSQL */}
          <path
            data-edge="v-edge-s2-pg"
            d="M 320 616 C 320 660, 370 660, 370 700"
            className="transition-colors duration-200"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeOpacity="0.4"
          />

          {/* Optional Direct Server 1 ↓ PostgreSQL connection bus */}
          <path
            d="M 350 486 C 350 630, 430 630, 430 700"
            stroke="currentColor"
            strokeWidth="1"
            strokeOpacity="0.2"
            strokeDasharray="3 3"
          />

          {/* ── RECEPTACLE SOCKETS (DISCREET 2px PINS) ──────────────── */}
          <circle cx="400" cy="116" r="2" fill="currentColor" opacity="0.6" />
          <circle cx="400" cy="190" r="2" fill="currentColor" opacity="0.6" />
          <circle cx="400" cy="236" r="2" fill="currentColor" opacity="0.6" />
          <circle cx="400" cy="310" r="2" fill="currentColor" opacity="0.6" />
          <circle cx="365" cy="356" r="2" fill="currentColor" opacity="0.6" />
          <circle cx="435" cy="356" r="2" fill="currentColor" opacity="0.6" />
          <circle cx="320" cy="440" r="2" fill="currentColor" opacity="0.6" />
          <circle cx="380" cy="463" r="2" fill="currentColor" opacity="0.6" />
          <circle cx="480" cy="463" r="2" fill="currentColor" opacity="0.6" />
          <circle cx="320" cy="486" r="2" fill="currentColor" opacity="0.6" />
          <circle cx="320" cy="570" r="2" fill="currentColor" opacity="0.6" />
          <circle cx="360" cy="570" r="2" fill="currentColor" opacity="0.6" />
          <circle cx="320" cy="616" r="2" fill="currentColor" opacity="0.6" />
          <circle cx="370" cy="700" r="2" fill="currentColor" opacity="0.6" />
          <circle cx="430" cy="700" r="2" fill="currentColor" opacity="0.6" />

          {/* ── THE SINGLE MOVING REQUEST INDICATOR ─────────────────── */}
          {/* Exactly ONE small technical solid moving circle. No neon, no fuzzy glow */}
          <circle
            ref={packetRef}
            r="3"
            cx="400"
            cy="116"
            fill="#3b82f6"
            opacity="0"
            className="transition-opacity duration-150"
          />

          {/* ── VERTICAL NODES (TOP-TO-BOTTOM ENGINEERING WATERFALL) ── */}
          {/* 1. Node: Client */}
          <g data-node={V_NODES.client.id} transform={`translate(${V_NODES.client.x}, ${V_NODES.client.y})`}>
            <rect
              width={V_NODES.client.w}
              height={V_NODES.client.h}
              rx="6"
              className="fill-[var(--surface)] transition-colors duration-200"
              fillOpacity="0.75"
              stroke="currentColor"
              strokeWidth="1"
            />
            <circle cx="12" cy="14" r="2" fill="currentColor" opacity="0.7" />
            <text x="20" y="17" className="fill-[var(--foreground)] font-mono text-[9px] font-bold tracking-wider opacity-85">
              {V_NODES.client.label}
            </text>
            <text x="12" y="33" className="fill-[var(--muted)] font-mono text-[7.5px] opacity-70">
              {V_NODES.client.role}
            </text>
          </g>

          {/* 2. Node: API Gateway */}
          <g data-node={V_NODES.gateway.id} transform={`translate(${V_NODES.gateway.x}, ${V_NODES.gateway.y})`}>
            <rect
              width={V_NODES.gateway.w}
              height={V_NODES.gateway.h}
              rx="6"
              className="fill-[var(--surface)] transition-colors duration-200"
              fillOpacity="0.75"
              stroke="currentColor"
              strokeWidth="1"
            />
            <circle cx="12" cy="14" r="2" fill="currentColor" opacity="0.7" />
            <text x="20" y="17" className="fill-[var(--foreground)] font-mono text-[9px] font-bold tracking-wider opacity-85">
              {V_NODES.gateway.label}
            </text>
            <text x="12" y="33" className="fill-[var(--muted)] font-mono text-[7.5px] opacity-70">
              {V_NODES.gateway.role}
            </text>
          </g>

          {/* 3. Node: Load Balancer */}
          <g data-node={V_NODES.lb.id} transform={`translate(${V_NODES.lb.x}, ${V_NODES.lb.y})`}>
            <rect
              width={V_NODES.lb.w}
              height={V_NODES.lb.h}
              rx="6"
              className="fill-[var(--surface)] transition-colors duration-200"
              fillOpacity="0.75"
              stroke="currentColor"
              strokeWidth="1"
            />
            <circle cx="12" cy="14" r="2" fill="currentColor" opacity="0.7" />
            <text x="20" y="17" className="fill-[var(--foreground)] font-mono text-[9px] font-bold tracking-wider opacity-85">
              {V_NODES.lb.label}
            </text>
            <text x="12" y="33" className="fill-[var(--muted)] font-mono text-[7.5px] opacity-70">
              {V_NODES.lb.role}
            </text>
          </g>

          {/* 4. Node: Server 1 (Alpha) */}
          <g data-node={V_NODES.server1.id} transform={`translate(${V_NODES.server1.x}, ${V_NODES.server1.y})`}>
            <rect
              width={V_NODES.server1.w}
              height={V_NODES.server1.h}
              rx="6"
              className="fill-[var(--surface)] transition-colors duration-200"
              fillOpacity="0.75"
              stroke="currentColor"
              strokeWidth="1"
            />
            <circle cx="12" cy="14" r="2" fill="currentColor" opacity="0.7" />
            <text x="20" y="17" className="fill-[var(--foreground)] font-mono text-[9px] font-bold tracking-wider opacity-85">
              {V_NODES.server1.label}
            </text>
            <text x="12" y="33" className="fill-[var(--muted)] font-mono text-[7.5px] opacity-70">
              {V_NODES.server1.role}
            </text>
          </g>

          {/* 5. Node: Redis Cache (Connected horizontally to Server 1) */}
          <g data-node={V_NODES.redis.id} transform={`translate(${V_NODES.redis.x}, ${V_NODES.redis.y})`}>
            <rect
              width={V_NODES.redis.w}
              height={V_NODES.redis.h}
              rx="6"
              className="fill-[var(--surface)] transition-colors duration-200"
              fillOpacity="0.75"
              stroke="currentColor"
              strokeWidth="1"
            />
            <circle cx="12" cy="14" r="2" fill="currentColor" opacity="0.7" />
            <text x="20" y="17" className="fill-[var(--foreground)] font-mono text-[9px] font-bold tracking-wider opacity-85">
              {V_NODES.redis.label}
            </text>
            <text x="12" y="33" className="fill-[var(--muted)] font-mono text-[7.5px] opacity-70">
              {V_NODES.redis.role}
            </text>
          </g>

          {/* 6. Node: Server 2 (Beta) */}
          <g data-node={V_NODES.server2.id} transform={`translate(${V_NODES.server2.x}, ${V_NODES.server2.y})`}>
            <rect
              width={V_NODES.server2.w}
              height={V_NODES.server2.h}
              rx="6"
              className="fill-[var(--surface)] transition-colors duration-200"
              fillOpacity="0.75"
              stroke="currentColor"
              strokeWidth="1"
            />
            <circle cx="12" cy="14" r="2" fill="currentColor" opacity="0.7" />
            <text x="20" y="17" className="fill-[var(--foreground)] font-mono text-[9px] font-bold tracking-wider opacity-85">
              {V_NODES.server2.label}
            </text>
            <text x="12" y="33" className="fill-[var(--muted)] font-mono text-[7.5px] opacity-70">
              {V_NODES.server2.role}
            </text>
          </g>

          {/* 7. Node: PostgreSQL Database */}
          <g data-node={V_NODES.postgres.id} transform={`translate(${V_NODES.postgres.x}, ${V_NODES.postgres.y})`}>
            <rect
              width={V_NODES.postgres.w}
              height={V_NODES.postgres.h}
              rx="6"
              className="fill-[var(--surface)] transition-colors duration-200"
              fillOpacity="0.75"
              stroke="currentColor"
              strokeWidth="1"
            />
            <circle cx="12" cy="14" r="2" fill="currentColor" opacity="0.7" />
            <text x="20" y="17" className="fill-[var(--foreground)] font-mono text-[9px] font-bold tracking-wider opacity-85">
              {V_NODES.postgres.label}
            </text>
            <text x="12" y="33" className="fill-[var(--muted)] font-mono text-[7.5px] opacity-70">
              {V_NODES.postgres.role}
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
}
