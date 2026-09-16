import React from "react";

// ─── Visual Node Socket Pins (Mimics React Flow Handles) ─────────────────────
export function NodeSocket({
  position = "left",
  active = false,
  className = "",
}: {
  position?: "left" | "right" | "top" | "bottom";
  active?: boolean;
  className?: string;
}) {
  const posClasses = {
    left: "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2",
    right: "right-0 top-1/2 translate-x-1/2 -translate-y-1/2",
    top: "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2",
    bottom: "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2",
  }[position];

  return (
    <span
      className={`absolute z-10 w-2.5 h-2.5 rounded-full border-2 transition-all duration-200 pointer-events-none ${
        active
          ? "border-[var(--accent)] bg-[var(--surface)] ring-2 ring-[var(--accent)]/30"
          : "border-[var(--border-strong)] bg-[var(--surface)] group-hover:border-[var(--accent)]"
      } ${posClasses} ${className}`}
      aria-hidden="true"
    />
  );
}

// ─── Vertical Section Flow Connector (Curved SVG Bezier) ──────────────────────
export function VerticalFlowConnector({
  label,
  height = 56,
}: {
  label?: string;
  height?: number;
}) {
  return (
    <div className="relative flex flex-col items-center justify-center py-2 select-none pointer-events-none">
      <svg
        width="24"
        height={height}
        viewBox={`0 0 24 ${height}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-[var(--border-strong)] overflow-visible"
      >
        {/* Subtle glowing animated packet */}
        <line
          x1="12"
          y1="0"
          x2="12"
          y2={height}
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
        <circle cx="12" cy="0" r="3" fill="#3b82f6" filter="drop-shadow(0 0 4px #3b82f6)">
          <animate
            attributeName="cy"
            values={`0;${height}`}
            dur="2.4s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.2;1;0.2"
            dur="2.4s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
      {label && (
        <span className="mt-1 px-2 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-widest text-[color:var(--muted)] bg-[var(--surface)] border border-[var(--border)] shadow-xs">
          {label}
        </span>
      )}
    </div>
  );
}

// ─── Curved Flow Line (Horizontal Bezier) ─────────────────────────────────────
export function HorizontalFlowConnector({
  className = "",
  direction = "right",
}: {
  className?: string;
  direction?: "right" | "left";
}) {
  return (
    <div className={`hidden md:flex items-center justify-center ${className} select-none pointer-events-none`}>
      <svg
        width="48"
        height="16"
        viewBox="0 0 48 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-[var(--border-strong)]"
      >
        <path
          d={direction === "right" ? "M 0 8 C 24 8, 24 8, 48 8" : "M 48 8 C 24 8, 24 8, 0 8"}
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="3 3"
        />
        <circle cx="24" cy="8" r="2.5" fill="#3b82f6">
          <animate
            attributeName="cx"
            values={direction === "right" ? "0;48" : "48;0"}
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
    </div>
  );
}

// ─── Core Architecture Pipeline (Build → Configure → Simulate → Observe → Understand) ──
export interface PipelineStep {
  num: string;
  name: string;
  sub: string;
  active?: boolean;
}

export const ARCHITECTURE_PIPELINE_STEPS: PipelineStep[] = [
  { num: "01", name: "BUILD", sub: "Topology & Canvas Nodes" },
  { num: "02", name: "CONFIGURE", sub: "Routing & Thresholds" },
  { num: "03", name: "SIMULATE", sub: "Deterministic Traffic Injection" },
  { num: "04", name: "OBSERVE", sub: "Packet Inspection & Event Hops" },
  { num: "05", name: "UNDERSTAND", sub: "Distributed Failure Recovery" },
];

export function ArchitecturePipeline({
  steps = ARCHITECTURE_PIPELINE_STEPS,
  activeStep = 0,
}: {
  steps?: PipelineStep[];
  activeStep?: number;
}) {
  return (
    <div className="relative w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5 shadow-sm overflow-hidden">
      {/* Background Micro Dot Grid */}
      <div className="pointer-events-none absolute inset-0 dot-grid opacity-15" />

      {/* Header bar */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-[color:var(--foreground)]">
            Execution Pipeline Architecture
          </span>
        </div>
        <span className="text-[10px] font-mono text-[color:var(--muted)]">
          FlowFrame Deterministic Runtime Workflow
        </span>
      </div>

      {/* Pipeline Stages Rail */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
        {steps.map((step, idx) => {
          const isCurrent = idx === activeStep;
          return (
            <div
              key={step.num}
              className={`relative rounded-xl border p-3 transition-all duration-200 group select-none ${
                isCurrent
                  ? "border-[var(--accent)] bg-[var(--bg-elevated)] ring-1 ring-[var(--accent)]/30 shadow-xs"
                  : "border-[var(--border)] bg-[var(--bg)] hover:border-[var(--accent)]/40 hover:bg-[var(--bg-elevated)]"
              }`}
            >
              {/* Sockets on step edges */}
              <NodeSocket position="left" active={isCurrent} />
              <NodeSocket position="right" active={isCurrent} />

              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] font-mono font-bold text-[color:var(--accent)]">
                  {step.num}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]/40 group-hover:bg-[var(--accent)] transition-colors" />
              </div>

              <p className="text-xs font-bold tracking-tight text-[color:var(--foreground)] group-hover:text-[color:var(--accent)] transition-colors">
                {step.name}
              </p>
              <p className="text-[10px] font-mono text-[color:var(--muted)] leading-tight mt-0.5">
                {step.sub}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Compact Mini Topology Preview (e.g. for Cards) ──────────────────────────
export function MiniTopology({
  nodes,
}: {
  nodes: { label: string; type: "client" | "gateway" | "lb" | "server" | "cache" | "db" }[];
}) {
  const getBadgeStyle = (type: string) => {
    switch (type) {
      case "client":
        return "border-sky-500/30 bg-sky-500/10 text-sky-400";
      case "gateway":
        return "border-indigo-500/30 bg-indigo-500/10 text-indigo-400";
      case "lb":
        return "border-blue-500/30 bg-blue-500/10 text-blue-400";
      case "server":
        return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
      case "cache":
        return "border-amber-500/30 bg-amber-500/10 text-amber-400";
      case "db":
        return "border-cyan-500/30 bg-cyan-500/10 text-cyan-400";
      default:
        return "border-[var(--border)] bg-[var(--surface-muted)] text-[color:var(--foreground)]";
    }
  };

  return (
    <div className="flex items-center flex-wrap gap-1.5 py-1.5 px-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] font-mono text-[10px]">
      {nodes.map((node, i) => (
        <React.Fragment key={i}>
          <span
            className={`px-1.5 py-0.5 rounded border font-semibold ${getBadgeStyle(node.type)}`}
          >
            {node.label}
          </span>
          {i < nodes.length - 1 && (
            <span className="text-[color:var(--muted)] text-[9px] select-none">──▶</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Dynamic Interactive Mini Topology Canvas for Hero ───────────────────────
export function InteractiveTopologyHero() {
  return (
    <div className="relative w-full h-[280px] sm:h-[320px] rounded-2xl border border-[var(--border-strong)] bg-[var(--surface)] shadow-2xl overflow-hidden p-4 flex flex-col justify-between select-none">
      {/* Background Dot Grid */}
      <div className="pointer-events-none absolute inset-0 dot-grid opacity-25" />

      {/* Mini Window Top Bar */}
      <div className="relative z-10 flex items-center justify-between pb-2 border-b border-[var(--border)] font-mono text-[10px] text-[color:var(--muted)]">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
          <span className="ml-1 text-[color:var(--foreground)] font-semibold">
            mesh-topology.flow
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Simulation Active</span>
        </div>
      </div>

      {/* SVG Canvas Topology Graph with Curved Bezier Connections */}
      <div className="relative z-10 flex-1 flex items-center justify-between px-2 sm:px-4 py-3">
        {/* Client Node */}
        <div className="flex flex-col items-center gap-1">
          <div className="relative rounded-xl border border-sky-500/40 bg-[var(--bg)] px-3 py-2 text-center shadow-xs">
            <NodeSocket position="right" active />
            <span className="text-[10px] font-mono font-bold text-sky-400">Client</span>
            <p className="text-[8px] font-mono text-[color:var(--muted)]">2 req/s</p>
          </div>
        </div>

        {/* Curved Connection Path */}
        <svg
          className="flex-1 h-20 overflow-visible text-[var(--border-strong)]"
          viewBox="0 0 100 40"
          preserveAspectRatio="none"
        >
          <path
            d="M 0 20 C 50 20, 50 20, 100 20"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
          <circle cx="50" cy="20" r="3" fill="#3b82f6" filter="drop-shadow(0 0 3px #3b82f6)">
            <animate attributeName="cx" values="0;100" dur="1.8s" repeatCount="indefinite" />
          </circle>
        </svg>

        {/* Load Balancer Node */}
        <div className="flex flex-col items-center gap-1">
          <div className="relative rounded-xl border border-blue-500/40 bg-[var(--bg)] px-3 py-2 text-center shadow-xs">
            <NodeSocket position="left" active />
            <NodeSocket position="right" active />
            <span className="text-[10px] font-mono font-bold text-blue-400">Balancer</span>
            <p className="text-[8px] font-mono text-[color:var(--muted)]">Round Robin</p>
          </div>
        </div>

        {/* Forked Connection Paths */}
        <svg
          className="flex-1 h-28 overflow-visible text-[var(--border-strong)]"
          viewBox="0 0 100 80"
          preserveAspectRatio="none"
        >
          {/* Upper Fork to Server 1 */}
          <path
            d="M 0 40 C 40 40, 60 15, 100 15"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
          <circle cx="50" cy="28" r="2.5" fill="#3b82f6">
            <animate attributeName="cx" values="0;100" dur="2.2s" repeatCount="indefinite" />
            <animate attributeName="cy" values="40;15" dur="2.2s" repeatCount="indefinite" />
          </circle>

          {/* Lower Fork to Server 2 */}
          <path
            d="M 0 40 C 40 40, 60 65, 100 65"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
          <circle cx="50" cy="52" r="2.5" fill="#3b82f6">
            <animate attributeName="cx" values="0;100" dur="2.2s" repeatCount="indefinite" />
            <animate attributeName="cy" values="40;65" dur="2.2s" repeatCount="indefinite" />
          </circle>
        </svg>

        {/* Server Nodes Cluster & Cache */}
        <div className="flex flex-col gap-3">
          <div className="relative rounded-xl border border-emerald-500/40 bg-[var(--bg)] px-2.5 py-1.5 text-center shadow-xs">
            <NodeSocket position="left" active />
            <NodeSocket position="right" active />
            <span className="text-[9px] font-mono font-bold text-emerald-400">Server 1</span>
            <p className="text-[8px] font-mono text-emerald-400/80">200 OK</p>
          </div>
          <div className="relative rounded-xl border border-emerald-500/40 bg-[var(--bg)] px-2.5 py-1.5 text-center shadow-xs">
            <NodeSocket position="left" active />
            <NodeSocket position="right" active />
            <span className="text-[9px] font-mono font-bold text-emerald-400">Server 2</span>
            <p className="text-[8px] font-mono text-emerald-400/80">200 OK</p>
          </div>
        </div>

        {/* Final Connection to Cache */}
        <svg
          className="w-12 h-16 overflow-visible text-[var(--border-strong)]"
          viewBox="0 0 50 40"
          preserveAspectRatio="none"
        >
          <path
            d="M 0 20 C 25 20, 25 20, 50 20"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
          <circle cx="25" cy="20" r="2" fill="#f59e0b">
            <animate attributeName="cx" values="0;50" dur="1.5s" repeatCount="indefinite" />
          </circle>
        </svg>

        {/* Redis Cache */}
        <div className="relative rounded-xl border border-amber-500/40 bg-[var(--bg)] px-2.5 py-2 text-center shadow-xs">
          <NodeSocket position="left" active />
          <span className="text-[9px] font-mono font-bold text-amber-400">Redis</span>
          <p className="text-[8px] font-mono text-amber-400/80">Hit: 88%</p>
        </div>
      </div>

      {/* Mini Telemetry Status Footer */}
      <div className="relative z-10 flex items-center justify-between pt-2 border-t border-[var(--border)] font-mono text-[9px] text-[color:var(--muted)]">
        <span>Latency: 14ms (p95)</span>
        <span>Packets Routed: 1,420</span>
        <span className="text-[color:var(--accent)] font-semibold">Zero Drops</span>
      </div>
    </div>
  );
}
