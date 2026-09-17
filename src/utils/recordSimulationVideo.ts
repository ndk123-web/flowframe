import {
  getSmoothStepPath,
  getBezierPath,
  getStraightPath,
  Position,
  type Node,
  type Edge,
} from "@xyflow/react";
import { NODE_FLAVORS } from "@/components/ComponentIcons";

export interface RecordSimulationOptions {
  nodes: Node[];
  edges: Edge[];
  frameGroups: Array<{
    timestamp: number;
    frames: Array<{
      from: string;
      to: string;
      action?: string;
      requestId?: string;
      [key: string]: any;
    }>;
  }>;
  theme?: "light" | "dark";
  videoFormat?: "webm" | "mp4";
  speed?: number;
  bgPattern?: "dots" | "lines" | "cross" | "none";
  resolution?: "720p" | "1080p" | "1440p";
  connectionStyle?: "default" | "smooth" | "straight";
  selectedNodeId?: string | null;
  includeSelection?: boolean;
  watermark?: "none" | "branded";
  showPorts?: boolean;
  onProgress?: (percent: number, status: string) => void;
  onComplete?: (blob: Blob, url: string, ext: string) => void;
  onError?: (err: Error) => void;
}

// Accent colors from workspace CustomNode in app/workspace/page.tsx
const ACCENT_COLORS: Record<
  string,
  { ring: string; glow: string; accent: string; dot: string }
> = {
  client: {
    ring: "rgba(59,130,246,0.5)",
    glow: "rgba(59,130,246,0.1)",
    accent: "#2563eb",
    dot: "#3b82f6",
  },
  "api-gateway": {
    ring: "rgba(217,70,239,0.6)",
    glow: "rgba(217,70,239,0.12)",
    accent: "#a21caf",
    dot: "#d946ef",
  },
  "load-balancer": {
    ring: "rgba(59,130,246,0.6)",
    glow: "rgba(59,130,246,0.12)",
    accent: "#1d4ed8",
    dot: "#3b82f6",
  },
  server: {
    ring: "rgba(16,185,129,0.6)",
    glow: "rgba(16,185,129,0.12)",
    accent: "#059669",
    dot: "#10b981",
  },
  redis: {
    ring: "rgba(245,158,11,0.6)",
    glow: "rgba(245,158,11,0.12)",
    accent: "#d97706",
    dot: "#f59e0b",
  },
  postgres: {
    ring: "rgba(6,182,212,0.6)",
    glow: "rgba(6,182,212,0.12)",
    accent: "#0e7490",
    dot: "#06b6d4",
  },
  storage: {
    ring: "rgba(234,179,8,0.6)",
    glow: "rgba(234,179,8,0.12)",
    accent: "#a16207",
    dot: "#eab308",
  },
  dns: {
    ring: "rgba(99,102,241,0.6)",
    glow: "rgba(99,102,241,0.12)",
    accent: "#4338ca",
    dot: "#6366f1",
  },
  cdn: {
    ring: "rgba(20,184,166,0.6)",
    glow: "rgba(20,184,166,0.12)",
    accent: "#0f766e",
    dot: "#14b8a6",
  },
  "message-queue": {
    ring: "rgba(236,72,153,0.6)",
    glow: "rgba(236,72,153,0.12)",
    accent: "#be185d",
    dot: "#ec4899",
  },
  pubsub: {
    ring: "rgba(99,102,241,0.6)",
    glow: "rgba(99,102,241,0.12)",
    accent: "#4338ca",
    dot: "#6366f1",
  },
};

const TYPE_DISPLAY_NAMES: Record<string, string> = {
  client: "Client Device",
  "api-gateway": "API Gateway",
  "load-balancer": "Load Balancer",
  server: "Application Server",
  redis: "Redis Cache",
  postgres: "PostgreSQL Database",
  storage: "Object Storage",
  dns: "DNS Resolver",
  cdn: "Edge CDN",
  "message-queue": "Message Queue",
  pubsub: "Event Pub/Sub",
};

// SVG Path icon drawers matching ComponentIcons.tsx in FlowFrame
function drawComponentVectorIcon(
  ctx: CanvasRenderingContext2D,
  type: string,
  boxX: number,
  boxY: number,
  boxSize: number,
  color: string,
) {
  ctx.save();
  ctx.translate(boxX, boxY);
  const scale = boxSize / 24;
  ctx.scale(scale, scale);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.8;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const norm = String(type || "").toLowerCase();
  switch (norm) {
    case "client": {
      ctx.strokeRect(2, 3, 20, 13);
      ctx.beginPath();
      ctx.moveTo(9, 21);
      ctx.lineTo(15, 21);
      ctx.moveTo(12, 16);
      ctx.lineTo(12, 21);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(5, 6);
      ctx.lineTo(8, 6);
      ctx.moveTo(10, 6);
      ctx.lineTo(19, 6);
      ctx.stroke();
      break;
    }
    case "api-gateway": {
      ctx.strokeRect(3, 3, 18, 18);
      ctx.beginPath();
      ctx.moveTo(12, 3);
      ctx.lineTo(12, 9);
      ctx.moveTo(12, 15);
      ctx.lineTo(12, 21);
      ctx.moveTo(10, 12);
      ctx.lineTo(14, 12);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(12, 12, 3.5, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case "load-balancer": {
      ctx.beginPath();
      ctx.arc(12, 12, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(12, 3);
      ctx.lineTo(12, 9);
      ctx.moveTo(12, 15);
      ctx.lineTo(12, 21);
      ctx.moveTo(3, 12);
      ctx.lineTo(9, 12);
      ctx.moveTo(15, 12);
      ctx.lineTo(21, 12);
      ctx.stroke();
      break;
    }
    case "server": {
      ctx.strokeRect(2, 4, 20, 7);
      ctx.strokeRect(2, 13, 20, 7);
      ctx.beginPath();
      ctx.moveTo(5, 7.5);
      ctx.lineTo(13, 7.5);
      ctx.moveTo(5, 16.5);
      ctx.lineTo(13, 16.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(17, 7.5, 1, 0, Math.PI * 2);
      ctx.arc(19, 7.5, 1, 0, Math.PI * 2);
      ctx.arc(17, 16.5, 1, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "redis":
    case "redis_cache": {
      ctx.beginPath();
      ctx.moveTo(3, 7);
      ctx.lineTo(12, 3);
      ctx.lineTo(21, 7);
      ctx.lineTo(12, 11);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(3, 12);
      ctx.lineTo(12, 16);
      ctx.lineTo(21, 12);
      ctx.moveTo(3, 17);
      ctx.lineTo(12, 21);
      ctx.lineTo(21, 17);
      ctx.stroke();
      break;
    }
    case "postgres":
    case "postgres_database": {
      ctx.beginPath();
      ctx.ellipse(12, 6, 8, 3, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(4, 6);
      ctx.lineTo(4, 18);
      ctx.ellipse(12, 18, 8, 3, 0, 0, Math.PI, false);
      ctx.lineTo(20, 6);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(12, 12, 8, 3, 0, 0, Math.PI, false);
      ctx.stroke();
      break;
    }
    case "storage":
    case "cloud_storage": {
      ctx.beginPath();
      ctx.arc(12, 10, 5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(6, 15);
      ctx.lineTo(18, 15);
      ctx.moveTo(12, 12);
      ctx.lineTo(12, 18);
      ctx.stroke();
      break;
    }
    case "dns": {
      ctx.beginPath();
      ctx.arc(12, 12, 9, 0, Math.PI * 2);
      ctx.moveTo(3, 12);
      ctx.lineTo(21, 12);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(12, 12, 5, 9, 0, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case "cdn": {
      ctx.beginPath();
      ctx.arc(12, 5, 2.5, 0, Math.PI * 2);
      ctx.arc(5, 17, 2.5, 0, Math.PI * 2);
      ctx.arc(19, 17, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(12, 7.5);
      ctx.lineTo(5, 14.5);
      ctx.moveTo(12, 7.5);
      ctx.lineTo(19, 14.5);
      ctx.stroke();
      break;
    }
    case "message-queue": {
      ctx.strokeRect(3, 4, 18, 4);
      ctx.strokeRect(3, 10, 18, 4);
      ctx.strokeRect(3, 16, 18, 4);
      break;
    }
    case "pubsub": {
      ctx.beginPath();
      ctx.arc(12, 12, 8, 0, Math.PI * 2);
      ctx.moveTo(12, 4);
      ctx.lineTo(12, 20);
      ctx.moveTo(4, 12);
      ctx.lineTo(20, 12);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(12, 12, 3, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    default: {
      ctx.strokeRect(4, 4, 16, 16);
      ctx.beginPath();
      ctx.moveTo(4, 4);
      ctx.lineTo(20, 20);
      ctx.stroke();
      break;
    }
  }
  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.arcTo(x + w, y, x + w, y + radius, radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.arcTo(x + w, y + h, x + w - radius, y + h, radius);
  ctx.lineTo(x + radius, y + h);
  ctx.arcTo(x, y + h, x, y + h - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
}

function drawCylinder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  accent: string,
  cardBg: string,
  cardBorder: string,
) {
  const ry = Math.min(h * 0.18, 12);
  const bodyH = h - ry * 2;

  ctx.fillStyle = cardBg;
  ctx.beginPath();
  ctx.moveTo(x, y + ry);
  ctx.lineTo(x, y + ry + bodyH);
  ctx.ellipse(x + w / 2, y + ry + bodyH, w / 2, ry, 0, 0, Math.PI, false);
  ctx.lineTo(x + w, y + ry);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = cardBg;
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + ry, w / 2, ry, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = cardBorder;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y + ry);
  ctx.lineTo(x, y + ry + bodyH);
  ctx.ellipse(x + w / 2, y + ry + bodyH, w / 2, ry, 0, 0, Math.PI, false);
  ctx.lineTo(x + w, y + ry);
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + ry, w / 2, ry, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = `color-mix(in srgb, ${cardBorder} 70%, ${accent} 30%)`;
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + ry + bodyH * 0.5, w / 2, ry, 0, 0, Math.PI, false);
  ctx.stroke();
}

/**
 * High-Fidelity 1:1 Workspace Video Exporter
 * Renders an exact replica of the FlowFrame ReactFlow workspace
 * at 1080p 60 FPS directly into a downloadable WebM / MP4 video.
 */
export async function recordSimulationVideo({
  nodes,
  edges,
  frameGroups,
  theme = "dark",
  videoFormat = "webm",
  speed = 1,
  bgPattern = "dots",
  resolution = "1080p",
  connectionStyle = "default",
  selectedNodeId,
  includeSelection = true,
  watermark = "branded",
  showPorts = true,
  onProgress,
  onComplete,
  onError,
}: RecordSimulationOptions): Promise<() => void> {
  let isCancelled = false;

  const cancelRecording = () => {
    isCancelled = true;
  };

  try {
    if (nodes.length === 0) {
      throw new Error("Cannot record empty canvas. Add at least one node.");
    }

    let width = 1920;
    let height = 1080;
    let bitrate = 8000000;

    if (resolution === "720p") {
      width = 1280;
      height = 720;
      bitrate = 4500000;
    } else if (resolution === "1440p") {
      width = 2560;
      height = 1440;
      bitrate = 16000000;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { alpha: false });

    if (!ctx) {
      throw new Error("Unable to create canvas 2D rendering context.");
    }

    if (typeof canvas.captureStream !== "function") {
      throw new Error("canvas.captureStream is not supported in this browser.");
    }

    // 1. Calculate Diagram Bounding Box & Viewport Scale (exact match to fitView)
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    nodes.forEach((n) => {
      const isShape = n.type === "shapeNode";
      const x = n.position?.x ?? 0;
      const y = n.position?.y ?? 0;
      const defaultW = isShape ? 320 : 190;
      const defaultH = isShape ? 220 : 64;
      const w = Number(n.measured?.width ?? (n.style?.width as number) ?? defaultW);
      const h = Number(n.measured?.height ?? (n.style?.height as number) ?? defaultH);

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + w);
      maxY = Math.max(maxY, y + h);
    });

    const paddingX = 140;
    const paddingY = 120;
    const spanW = Math.max(maxX - minX, 400);
    const spanH = Math.max(maxY - minY, 240);

    const scale = Math.min(
      (width - paddingX * 2) / spanW,
      (height - paddingY * 2) / spanH,
      1.25,
    );

    const offsetX = (width - spanW * scale) / 2 - minX * scale;
    const offsetY = (height - spanH * scale) / 2 - minY * scale;

    interface MappedNode {
      id: string;
      x: number;
      y: number;
      w: number;
      h: number;
      label: string;
      type: string;
      flavor?: string;
      flavorShortLabel?: string;
      hasTarget: boolean;
      hasSource: boolean;
      isCylinder: boolean;
      isShapeNode: boolean;
      shapeColor?: string;
      colors: { ring: string; glow: string; accent: string; dot: string };
      leftHandle: { x: number; y: number };
      rightHandle: { x: number; y: number };
      topHandle: { x: number; y: number };
      bottomHandle: { x: number; y: number };
    }

    const nodeMap = new Map<string, MappedNode>();

    nodes.forEach((n) => {
      const isShape = n.type === "shapeNode";
      const rawX = n.position?.x ?? 0;
      const rawY = n.position?.y ?? 0;
      const rawW = Number(n.measured?.width ?? (n.style?.width as number) ?? (isShape ? 320 : 190));
      const rawH = Number(n.measured?.height ?? (n.style?.height as number) ?? (isShape ? 220 : 64));

      const x = rawX * scale + offsetX;
      const y = rawY * scale + offsetY;
      const w = rawW * scale;
      const h = rawH * scale;

      // Authentic FlowFrame type normalization & inference
      let nType = String(n.data?.type || "").toLowerCase().trim();
      if (!nType || nType === "customnode" || nType === "default") {
        const lbl = String(n.data?.label || n.id || "").toLowerCase();
        if (lbl.includes("client") || n.id.includes("client")) nType = "client";
        else if (lbl.includes("gateway") || lbl.includes("gw") || n.id.includes("gw")) nType = "api-gateway";
        else if (lbl.includes("balancer") || lbl.includes("lb") || n.id.includes("lb")) nType = "load-balancer";
        else if (lbl.includes("redis") || lbl.includes("cache") || n.id.includes("redis")) nType = "redis";
        else if (lbl.includes("postgres") || lbl.includes("database") || lbl.includes("db") || lbl.includes("sql") || n.id.includes("db")) nType = "postgres";
        else if (lbl.includes("queue") || lbl.includes("mq") || lbl.includes("rabbit") || lbl.includes("kafka") || n.id.includes("queue")) nType = "message-queue";
        else if (lbl.includes("pubsub") || lbl.includes("topic") || lbl.includes("sns") || n.id.includes("pubsub")) nType = "pubsub";
        else if (lbl.includes("storage") || lbl.includes("s3") || lbl.includes("bucket") || n.id.includes("storage")) nType = "storage";
        else if (lbl.includes("dns") || n.id.includes("dns")) nType = "dns";
        else if (lbl.includes("cdn") || lbl.includes("edge") || n.id.includes("cdn")) nType = "cdn";
        else nType = "server";
      }

      const colors = ACCENT_COLORS[nType] || ACCENT_COLORS.server;
      const isCylinder = nType === "postgres" || nType === "database" || n.data?.shape === "cylinder";
      const hasTarget = nType !== "client";
      const hasSource = nType !== "redis" && nType !== "postgres" && nType !== "storage";

      const flavorId = (n.data?.flavor as string) || undefined;
      let flavorShortLabel = "";
      if (flavorId && NODE_FLAVORS[nType]) {
        const match = NODE_FLAVORS[nType].find((f) => f.id === flavorId);
        flavorShortLabel = match ? match.shortLabel : flavorId;
      }

      nodeMap.set(n.id, {
        id: n.id,
        x,
        y,
        w,
        h,
        label: (n.data?.label as string) || n.id,
        type: nType,
        flavor: flavorId,
        flavorShortLabel,
        hasTarget,
        hasSource,
        isCylinder,
        isShapeNode: isShape,
        shapeColor: (n.data?.color as string) || "#3b82f6",
        colors,
        leftHandle: { x, y: y + h / 2 },
        rightHandle: { x: x + w, y: y + h / 2 },
        topHandle: { x: x + w / 2, y },
        bottomHandle: { x: x + w / 2, y: y + h },
      });
    });

    const isDark = theme === "dark";
    const canvasBg = isDark ? "#0a0c10" : "#f8fafc";
    const dotColor = isDark ? "rgba(148, 163, 184, 0.12)" : "rgba(15, 23, 42, 0.08)";
    const cardBg = isDark ? "#11141d" : "#ffffff";
    const cardBorder = isDark ? "rgba(255, 255, 255, 0.10)" : "rgba(15, 23, 42, 0.12)";
    const textColor = isDark ? "#f8fafc" : "#0f172a";
    const subtextColor = isDark ? "rgba(248, 250, 252, 0.50)" : "rgba(15, 23, 42, 0.50)";
    const edgeInactiveStroke = isDark ? "#334155" : "#cbd5e1";

    // Setup MediaRecorder
    const stream = canvas.captureStream(60);
    let mimeType = videoFormat === "mp4" ? "video/mp4" : "video/webm;codecs=vp9";
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8")) {
        mimeType = "video/webm;codecs=vp8";
      } else if (MediaRecorder.isTypeSupported("video/webm")) {
        mimeType = "video/webm";
      } else if (MediaRecorder.isTypeSupported("video/mp4")) {
        mimeType = "video/mp4";
      } else {
        mimeType = "";
      }
    }

    const recorder = mimeType
      ? new MediaRecorder(stream, { mimeType, videoBitsPerSecond: bitrate })
      : new MediaRecorder(stream);

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const finalMime = recorder.mimeType || (videoFormat === "mp4" ? "video/mp4" : "video/webm");
      const blob = new Blob(chunks, { type: finalMime });
      const url = URL.createObjectURL(blob);
      const ext = videoFormat === "mp4" && finalMime.includes("mp4") ? "mp4" : "webm";

      const a = document.createElement("a");
      a.href = url;
      a.download = `flowframe-simulation-${Date.now()}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      onProgress?.(100, "Simulation video ready!");
      onComplete?.(blob, url, ext);
    };

    recorder.start(250);

    // Pre-calculate authentic edge paths using @xyflow/react matching workspace connectionStyle
    interface EdgePathData {
      svgPath: string;
      path2d: Path2D;
      pathElement: SVGPathElement;
      totalLength: number;
      reverseSvgPath: string;
      reversePathElement: SVGPathElement;
      reverseTotalLength: number;
    }

    const edgePathMap = new Map<string, EdgePathData>();

    edges.forEach((edge) => {
      const src = nodeMap.get(edge.source);
      const tgt = nodeMap.get(edge.target);
      if (!src || !tgt) return;

      const p0 = src.rightHandle;
      const p3 = tgt.leftHandle;

      const [svgPath] =
        connectionStyle === "straight"
          ? getStraightPath({
              sourceX: p0.x,
              sourceY: p0.y,
              targetX: p3.x,
              targetY: p3.y,
            })
          : connectionStyle === "smooth"
            ? getBezierPath({
                sourceX: p0.x,
                sourceY: p0.y,
                sourcePosition: Position.Right,
                targetX: p3.x,
                targetY: p3.y,
                targetPosition: Position.Left,
              })
            : getSmoothStepPath({
                sourceX: p0.x,
                sourceY: p0.y,
                sourcePosition: Position.Right,
                targetX: p3.x,
                targetY: p3.y,
                targetPosition: Position.Left,
                borderRadius: 12 * scale,
                offset: 20 * scale,
              });

      const [reverseSvgPath] =
        connectionStyle === "straight"
          ? getStraightPath({
              sourceX: p3.x,
              sourceY: p3.y,
              targetX: p0.x,
              targetY: p0.y,
            })
          : connectionStyle === "smooth"
            ? getBezierPath({
                sourceX: p3.x,
                sourceY: p3.y,
                sourcePosition: Position.Left,
                targetX: p0.x,
                targetY: p0.y,
                targetPosition: Position.Right,
              })
            : getSmoothStepPath({
                sourceX: p3.x,
                sourceY: p3.y,
                sourcePosition: Position.Left,
                targetX: p0.x,
                targetY: p0.y,
                targetPosition: Position.Right,
                borderRadius: 12 * scale,
                offset: 20 * scale,
              });

      const pathEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
      pathEl.setAttribute("d", svgPath);
      const totalLength = pathEl.getTotalLength ? pathEl.getTotalLength() : 100;
      const path2d = new Path2D(svgPath);

      const reversePathEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
      reversePathEl.setAttribute("d", reverseSvgPath);
      const reverseTotalLength = reversePathEl.getTotalLength ? reversePathEl.getTotalLength() : 100;

      edgePathMap.set(edge.id, {
        svgPath,
        path2d,
        pathElement: pathEl,
        totalLength,
        reverseSvgPath,
        reversePathElement: reversePathEl,
        reverseTotalLength,
      });
    });

    // 2. Base Canvas Renderer: 100% exact replica of FlowFrame ReactFlow Canvas
    const drawCanvas = (
      activeNodeIds: Set<string>,
      activeEdgeIds: Map<string, { reverseMotion: boolean }>,
      pingPhase = 0,
    ) => {
      ctx.fillStyle = canvasBg;
      ctx.fillRect(0, 0, width, height);

      // ReactFlow Background Pattern (dots / lines / cross / none)
      const resScale = width / 1920;
      if (bgPattern === "dots") {
        ctx.fillStyle = dotColor;
        const dotSpacing = Math.max(16, 20 * scale);
        for (let gx = 0; gx < width; gx += dotSpacing) {
          for (let gy = 0; gy < height; gy += dotSpacing) {
            ctx.beginPath();
            ctx.arc(gx, gy, 1.2 * resScale, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      } else if (bgPattern === "lines") {
        ctx.strokeStyle = isDark ? "rgba(148, 163, 184, 0.08)" : "rgba(15, 23, 42, 0.07)";
        ctx.lineWidth = Math.max(0.8, 1.0 * resScale);
        const lineSpacing = Math.max(28, 36 * scale);
        ctx.beginPath();
        for (let gx = 0; gx < width; gx += lineSpacing) {
          ctx.moveTo(gx, 0);
          ctx.lineTo(gx, height);
        }
        for (let gy = 0; gy < height; gy += lineSpacing) {
          ctx.moveTo(0, gy);
          ctx.lineTo(width, gy);
        }
        ctx.stroke();
      } else if (bgPattern === "cross") {
        ctx.strokeStyle = isDark ? "rgba(148, 163, 184, 0.16)" : "rgba(15, 23, 42, 0.13)";
        ctx.lineWidth = Math.max(0.9, 1.2 * resScale);
        const crossSpacing = Math.max(28, 36 * scale);
        const arm = 3.5 * resScale;
        ctx.beginPath();
        for (let gx = 0; gx < width; gx += crossSpacing) {
          for (let gy = 0; gy < height; gy += crossSpacing) {
            ctx.moveTo(gx - arm, gy);
            ctx.lineTo(gx + arm, gy);
            ctx.moveTo(gx, gy - arm);
            ctx.lineTo(gx, gy + arm);
          }
        }
        ctx.stroke();
      }

      // Draw Shape Nodes in the background
      nodeMap.forEach((n) => {
        if (!n.isShapeNode) return;
        const color = n.shapeColor || "#3b82f6";
        ctx.fillStyle = `color-mix(in srgb, ${color} 8%, transparent)`;
        roundRect(ctx, n.x, n.y, n.w, n.h, 12 * scale);
        ctx.fill();

        ctx.strokeStyle = `color-mix(in srgb, ${color} 45%, transparent)`;
        ctx.lineWidth = 2.0;
        ctx.setLineDash([6, 6]);
        ctx.stroke();
        ctx.setLineDash([]);

        if (n.label) {
          ctx.fillStyle = isDark ? "#ffffff" : "#0f172a";
          ctx.font = `bold ${(11 * scale).toFixed(1)}px Inter, sans-serif`;
          ctx.fillText(n.label, n.x + 12 * scale, n.y + n.h - 10 * scale);
        }
      });

      // Draw Edges using exact Path2D from ReactFlow getSmoothStepPath
      edges.forEach((edge) => {
        const edgeData = edgePathMap.get(edge.id);
        if (!edgeData) return;

        const activeState = activeEdgeIds.get(edge.id);
        const isActive = Boolean(activeState);
        const isReverse = activeState?.reverseMotion ?? false;

        const strokeColor = isActive
          ? isReverse
            ? "#f59e0b"
            : "#3b82f6"
          : edgeInactiveStroke;
        const strokeWidth = isActive ? 2.5 * scale : 1.8 * scale;
        const strokeOpacity = isActive ? 0.95 : 0.4;

        ctx.save();
        ctx.globalAlpha = strokeOpacity;
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
        ctx.stroke(edgeData.path2d);

        // Arrow marker head pointing along path vector into target handle
        if (edgeData.totalLength > 8) {
          const ptEnd = edgeData.pathElement.getPointAtLength(edgeData.totalLength);
          const ptPrev = edgeData.pathElement.getPointAtLength(
            Math.max(0, edgeData.totalLength - 6 * scale),
          );
          const angle = Math.atan2(ptEnd.y - ptPrev.y, ptEnd.x - ptPrev.x);

          ctx.fillStyle = strokeColor;
          ctx.beginPath();
          ctx.moveTo(ptEnd.x, ptEnd.y);
          ctx.lineTo(
            ptEnd.x - 8 * scale * Math.cos(angle - Math.PI / 6),
            ptEnd.y - 8 * scale * Math.sin(angle - Math.PI / 6),
          );
          ctx.lineTo(
            ptEnd.x - 8 * scale * Math.cos(angle + Math.PI / 6),
            ptEnd.y - 8 * scale * Math.sin(angle + Math.PI / 6),
          );
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      });

      // Draw Custom Nodes matching CustomNode JSX
      nodeMap.forEach((n) => {
        if (n.isShapeNode) return;

        const accent = n.colors.accent;
        const isActive = activeNodeIds.has(n.id);
        const isSelected = Boolean(includeSelection && selectedNodeId && n.id === selectedNodeId);

        ctx.save();

        if (n.isCylinder) {
          drawCylinder(ctx, n.x, n.y, n.w, n.h, accent, cardBg, cardBorder);
        } else {
          ctx.shadowColor = "rgba(0, 0, 0, 0.12)";
          ctx.shadowBlur = 8;
          ctx.shadowOffsetY = 2;

          ctx.fillStyle = cardBg;
          roundRect(ctx, n.x, n.y, n.w, n.h, 12 * scale);
          ctx.fill();

          ctx.shadowColor = "transparent";

          if (isSelected) {
            // Glowing outer selection ring matching ReactFlow
            ctx.strokeStyle = n.colors.ring;
            ctx.lineWidth = 3.5 * scale;
            roundRect(
              ctx,
              n.x - 2.5 * scale,
              n.y - 2.5 * scale,
              n.w + 5 * scale,
              n.h + 5 * scale,
              14 * scale,
            );
            ctx.stroke();

            // Accent border
            ctx.strokeStyle = accent;
            ctx.lineWidth = 2.0 * scale;
            roundRect(ctx, n.x, n.y, n.w, n.h, 12 * scale);
            ctx.stroke();
          } else if (isActive) {
            ctx.strokeStyle = accent;
            ctx.lineWidth = 2.0 * scale;
            ctx.stroke();

            ctx.strokeStyle = n.colors.ring;
            ctx.lineWidth = 3.5 * scale;
            roundRect(
              ctx,
              n.x - 2 * scale,
              n.y - 2 * scale,
              n.w + 4 * scale,
              n.h + 4 * scale,
              14 * scale,
            );
            ctx.stroke();
          } else {
            ctx.strokeStyle = `color-mix(in srgb, ${cardBorder} 80%, ${accent} 20%)`;
            ctx.lineWidth = 1.2 * scale;
            ctx.stroke();
          }
        }

        // Left Component Icon Container
        const iconBoxSize = 26 * scale;
        const iconX = n.x + 10 * scale;
        const iconY = n.y + (n.h - iconBoxSize) / 2;

        ctx.fillStyle = `color-mix(in srgb, transparent 88%, ${accent})`;
        roundRect(ctx, iconX, iconY, iconBoxSize, iconBoxSize, 7 * scale);
        ctx.fill();

        drawComponentVectorIcon(
          ctx,
          n.type,
          iconX + 3 * scale,
          iconY + 3 * scale,
          iconBoxSize - 6 * scale,
          accent,
        );

        // Labels
        const textStartX = n.x + 44 * scale;

        ctx.fillStyle = textColor;
        ctx.font = `600 ${(12.5 * scale).toFixed(1)}px Inter, system-ui, sans-serif`;
        const labelText = n.label.length > 18 ? n.label.slice(0, 17) + "…" : n.label;
        ctx.fillText(labelText, textStartX, n.y + 23 * scale);

        // Sublabel: Display flavor label or exact readable component type name
        const sublabel = n.flavorShortLabel || TYPE_DISPLAY_NAMES[n.type] || "Component Node";
        ctx.fillStyle = subtextColor;
        ctx.font = `500 ${(9.5 * scale).toFixed(1)}px Inter, system-ui, sans-serif`;
        ctx.fillText(sublabel, textStartX, n.y + (n.type === "client" ? 36 * scale : 39 * scale));

        // Client Run Flow Pill Badge matching Cobalt Blue theme
        if (n.type === "client") {
          const badgeX = textStartX;
          const badgeY = n.y + 40 * scale;
          const badgeW = 70 * scale;
          const badgeH = 14 * scale;
          ctx.fillStyle = "rgba(37, 99, 235, 0.12)";
          roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 4 * scale);
          ctx.fill();
          ctx.strokeStyle = "rgba(37, 99, 235, 0.3)";
          ctx.lineWidth = 1 * scale;
          ctx.stroke();

          ctx.fillStyle = "#3b82f6";
          ctx.font = `700 ${(7.5 * scale).toFixed(1)}px monospace`;
          ctx.fillText("▶ Run Flow", badgeX + 5 * scale, badgeY + 10 * scale);
        }

        // Right Brand Flavor Badge
        if (n.flavor && !n.isCylinder) {
          const brandSize = 20 * scale;
          const brandX = n.x + n.w - brandSize - 10 * scale;
          const brandY = n.y + (n.h - brandSize) / 2;

          ctx.fillStyle = `color-mix(in srgb, ${cardBg} 80%, ${accent})`;
          roundRect(ctx, brandX, brandY, brandSize, brandSize, 5 * scale);
          ctx.fill();
          ctx.strokeStyle = `color-mix(in srgb, ${cardBorder} 70%, ${accent})`;
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.fillStyle = accent;
          ctx.font = `bold ${(8 * scale).toFixed(1)}px Inter, sans-serif`;
          ctx.textAlign = "center";
          ctx.fillText(n.flavor.slice(0, 4).toUpperCase(), brandX + brandSize / 2, brandY + brandSize * 0.68);
          ctx.textAlign = "start";
        }

        // Selection Resizer Handles (Corners) matching NodeResizer in ReactFlow
        if (isSelected) {
          const handleR = 3.5 * scale;
          const corners = [
            { x: n.x, y: n.y },
            { x: n.x + n.w, y: n.y },
            { x: n.x, y: n.y + n.h },
            { x: n.x + n.w, y: n.y + n.h },
          ];
          corners.forEach((c) => {
            ctx.beginPath();
            ctx.arc(c.x, c.y, handleR, 0, Math.PI * 2);
            ctx.fillStyle = accent;
            ctx.fill();
            ctx.lineWidth = 1.5 * scale;
            ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
            ctx.stroke();
          });
        }

        // Active Node Pulse Radar Ping
        if (isActive) {
          const pingX = n.x + n.w - 4 * scale;
          const pingY = n.y - 4 * scale;

          const waveRadius = 3 * scale + pingPhase * 9 * scale;
          const waveAlpha = Math.max(0, 0.85 - pingPhase * 0.85);

          ctx.fillStyle = `color-mix(in srgb, ${n.colors.dot} ${Math.round(waveAlpha * 100)}%, transparent)`;
          ctx.beginPath();
          ctx.arc(pingX, pingY, waveRadius, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = n.colors.dot;
          ctx.beginPath();
          ctx.arc(pingX, pingY, 3.5 * scale, 0, Math.PI * 2);
          ctx.fill();
        }

        // Target handle (Left)
        if (showPorts && n.type !== "client") {
          ctx.fillStyle = n.colors.dot;
          ctx.beginPath();
          ctx.arc(n.leftHandle.x, n.leftHandle.y, 4 * scale, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = isDark ? "#0f172a" : "#ffffff";
          ctx.lineWidth = 2 * scale;
          ctx.stroke();
        }

        // Source handle (Right)
        if (showPorts && n.type !== "redis" && n.type !== "postgres" && n.type !== "storage") {
          ctx.fillStyle = n.colors.dot;
          ctx.beginPath();
          ctx.arc(n.rightHandle.x, n.rightHandle.y, 4 * scale, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = isDark ? "#0f172a" : "#ffffff";
          ctx.lineWidth = 2 * scale;
          ctx.stroke();
        }

        ctx.restore();
      });

      // Optional FlowFrame Watermark Badge
      if (watermark === "branded") {
        const badgeW = 168 * resScale;
        const badgeH = 34 * resScale;
        const bx = width - badgeW - 24 * resScale;
        const by = height - badgeH - 20 * resScale;

        ctx.save();
        ctx.fillStyle = isDark ? "rgba(15, 23, 42, 0.85)" : "rgba(255, 255, 255, 0.9)";
        ctx.strokeStyle = isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(15, 23, 42, 0.12)";
        ctx.lineWidth = 1.2;
        roundRect(ctx, bx, by, badgeW, badgeH, 8 * resScale);
        ctx.fill();
        ctx.stroke();

        // Cobalt blue indicator
        ctx.fillStyle = "#3b82f6";
        ctx.beginPath();
        ctx.arc(bx + 16 * resScale, by + badgeH / 2, 4.5 * resScale, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = isDark ? "#ffffff" : "#0f172a";
        ctx.font = `bold ${(12 * resScale).toFixed(1)}px Inter, sans-serif`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText("FlowFrame", bx + 26 * resScale, by + badgeH / 2);

        ctx.fillStyle = isDark ? "rgba(255, 255, 255, 0.55)" : "rgba(15, 23, 42, 0.55)";
        ctx.font = `600 ${(10 * resScale).toFixed(1)}px Inter, sans-serif`;
        ctx.fillText(`· ${resolution}`, bx + 98 * resScale, by + badgeH / 2);
        ctx.restore();
      }
    };

    // 3. Execution Animation Engine: 100% exact match to ReactFlow PacketEdge & duration
    const fps = 60;
    const baseDuration = Math.max(0.7, 1.0 / speed);
    const totalHops = frameGroups.length;

    // Initial Diagram Hold (0.6s)
    onProgress?.(5, "Rendering canvas state...");
    const introFrames = Math.round(0.6 * fps);
    for (let f = 0; f < introFrames; f++) {
      if (isCancelled) break;
      drawCanvas(new Set(), new Map(), 0);
      await new Promise((r) => setTimeout(r, 1000 / fps));
    }

    // Run Simulation Hops
    for (let groupIdx = 0; groupIdx < totalHops; groupIdx++) {
      if (isCancelled) break;

      const group = frameGroups[groupIdx];
      const frames = group.frames || [];

      // Determine active nodes & edges matching app/workspace/page.tsx animatedEdges
      const activeNodeIds = new Set<string>();
      const activeEdgeMap = new Map<string, { reverseMotion: boolean; packetCount: number }>();

      frames.forEach((frame) => {
        if (frame.from) activeNodeIds.add(frame.from);
        if (frame.to) activeNodeIds.add(frame.to);

        const directEdge = edges.find((e) => e.source === frame.from && e.target === frame.to);
        const reverseEdge = edges.find((e) => e.source === frame.to && e.target === frame.from);

        if (directEdge) {
          const prev = activeEdgeMap.get(directEdge.id);
          activeEdgeMap.set(directEdge.id, {
            reverseMotion: false,
            packetCount: prev ? prev.packetCount + 1 : 1,
          });
        } else if (reverseEdge) {
          const prev = activeEdgeMap.get(reverseEdge.id);
          activeEdgeMap.set(reverseEdge.id, {
            reverseMotion: true,
            packetCount: prev ? prev.packetCount + 1 : 1,
          });
        }
      });

      const hopFrames = Math.round(baseDuration * fps);

      for (let f = 0; f < hopFrames; f++) {
        if (isCancelled) break;

        const t = f / hopFrames;
        const pingPhase = (f % 30) / 30;

        drawCanvas(activeNodeIds, activeEdgeMap, pingPhase);

        // Render traveling Packet Train along exact ReactFlow SVG edge paths
        activeEdgeMap.forEach((info, edgeId) => {
          const edgeData = edgePathMap.get(edgeId);
          if (!edgeData) return;

          const isReverseMotion = info.reverseMotion;
          const pathEl = isReverseMotion
            ? edgeData.reversePathElement
            : edgeData.pathElement;
          const pathLen = isReverseMotion
            ? edgeData.reverseTotalLength
            : edgeData.totalLength;
          if (!pathEl || pathLen <= 0) return;

          const packetTrainCount = Math.max(
            1,
            Math.min(info.packetCount, 3),
          );

          for (let pIdx = 0; pIdx < packetTrainCount; pIdx++) {
            const staggerDelay = pIdx * 0.12;
            const effectiveT = (t * baseDuration - staggerDelay) / baseDuration;

            if (effectiveT >= 0 && effectiveT <= 1) {
              const currentDistance = effectiveT * pathLen;
              const pt = pathEl.getPointAtLength(currentDistance);

              const packetRadius = Math.max(2.5, (4.5 - pIdx * 0.5) * scale);
              const packetAlpha = Math.max(0.45, 0.95 - pIdx * 0.16);

              ctx.save();
              ctx.globalAlpha = packetAlpha;

              ctx.shadowColor = isReverseMotion
                ? "rgba(245, 158, 11, 0.95)"
                : "rgba(139, 92, 246, 0.95)";
              ctx.shadowBlur = 8 * scale;

              ctx.fillStyle = isReverseMotion ? "#f59e0b" : "#3b82f6";
              ctx.beginPath();
              ctx.arc(pt.x, pt.y, packetRadius, 0, Math.PI * 2);
              ctx.fill();

              ctx.restore();
            }
          }
        });

        const progressPercent = Math.round(
          10 + (groupIdx / totalHops) * 80 + (t / totalHops) * 80,
        );
        onProgress?.(
          progressPercent,
          `Rendering step ${groupIdx + 1} of ${totalHops}...`,
        );

        await new Promise((r) => setTimeout(r, 1000 / fps));
      }
    }

    // Final Architecture State Hold (1.0s)
    const outroFrames = Math.round(1.0 * fps);
    for (let f = 0; f < outroFrames; f++) {
      if (isCancelled) break;
      drawCanvas(new Set(), new Map(), 0);
      await new Promise((r) => setTimeout(r, 1000 / fps));
    }

    onProgress?.(98, "Finalizing simulation video encode...");

    if (recorder.state !== "inactive") {
      recorder.stop();
    }
  } catch (err: any) {
    console.error("Video recording error:", err);
    onError?.(err);
  }

  return cancelRecording;
}
