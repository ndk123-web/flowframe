"use client";

import React from "react";

/**
 * Restrained distributed-system background visualization for FlowFrame.
 * Client ──→ API Gateway ──→ Load Balancer ──→ Server ──→ Redis & PostgreSQL
 * Minimal movement, subtle packet trace, low contrast, non-interactive.
 */
export default function DashboardAmbientArchitecture() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden select-none z-0"
    >
      <svg
        className="w-full h-full opacity-[0.05] dark:opacity-[0.10] transition-opacity duration-500"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Subtle grid pattern */}
          <pattern
            id="ambient-grid"
            width="48"
            height="48"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 48 0 L 0 0 0 48"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.75"
              className="text-foreground/30"
            />
          </pattern>

          {/* Linear gradient for connection paths */}
          <linearGradient id="flow-line-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
            <stop offset="50%" stopColor="currentColor" stopOpacity="0.8" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.3" />
          </linearGradient>
        </defs>

        {/* Background Grid */}
        <rect width="100%" height="100%" fill="url(#ambient-grid)" />

        {/* ── Network Topology Structure ── */}
        <g className="text-foreground font-mono text-[10px] font-semibold" stroke="currentColor" strokeWidth="1.2">
          {/* 1. Client Node */}
          <g transform="translate(140, 180)">
            <rect x="0" y="0" width="110" height="48" rx="8" fill="transparent" />
            <text x="55" y="24" textAnchor="middle" dominantBaseline="middle" stroke="none" fill="currentColor" className="text-[11px] font-bold">
              CLIENT
            </text>
            <text x="55" y="38" textAnchor="middle" stroke="none" fill="currentColor" opacity="0.6" className="text-[9px]">
              REST / HTTP:80
            </text>
          </g>

          {/* Path: Client -> Gateway */}
          <path d="M 250 204 L 380 204" fill="none" strokeDasharray="4 4" />

          {/* 2. API Gateway */}
          <g transform="translate(380, 180)">
            <rect x="0" y="0" width="130" height="48" rx="8" fill="transparent" />
            <text x="65" y="24" textAnchor="middle" dominantBaseline="middle" stroke="none" fill="currentColor" className="text-[11px] font-bold">
              API GATEWAY
            </text>
            <text x="65" y="38" textAnchor="middle" stroke="none" fill="currentColor" opacity="0.6" className="text-[9px]">
              Route Matcher
            </text>
          </g>

          {/* Path: Gateway -> Load Balancer */}
          <path d="M 510 204 L 640 204" fill="none" strokeDasharray="4 4" />

          {/* 3. Load Balancer */}
          <g transform="translate(640, 180)">
            <rect x="0" y="0" width="130" height="48" rx="8" fill="transparent" />
            <text x="65" y="24" textAnchor="middle" dominantBaseline="middle" stroke="none" fill="currentColor" className="text-[11px] font-bold">
              LOAD BALANCER
            </text>
            <text x="65" y="38" textAnchor="middle" stroke="none" fill="currentColor" opacity="0.6" className="text-[9px]">
              Round-Robin
            </text>
          </g>

          {/* Path: LB -> Server 1 & Server 2 */}
          <path d="M 770 204 L 840 204 L 840 140 L 900 140" fill="none" strokeDasharray="4 4" />
          <path d="M 770 204 L 840 204 L 840 270 L 900 270" fill="none" strokeDasharray="4 4" />

          {/* 4. App Server Cluster */}
          <g transform="translate(900, 116)">
            <rect x="0" y="0" width="120" height="48" rx="8" fill="transparent" />
            <text x="60" y="24" textAnchor="middle" dominantBaseline="middle" stroke="none" fill="currentColor" className="text-[11px] font-bold">
              SERVER #1
            </text>
            <text x="60" y="38" textAnchor="middle" stroke="none" fill="currentColor" opacity="0.6" className="text-[9px]">
              Active Worker
            </text>
          </g>

          <g transform="translate(900, 246)">
            <rect x="0" y="0" width="120" height="48" rx="8" fill="transparent" />
            <text x="60" y="24" textAnchor="middle" dominantBaseline="middle" stroke="none" fill="currentColor" className="text-[11px] font-bold">
              SERVER #2
            </text>
            <text x="60" y="38" textAnchor="middle" stroke="none" fill="currentColor" opacity="0.6" className="text-[9px]">
              Active Worker
            </text>
          </g>

          {/* Path: Server -> Cache & DB */}
          <path d="M 1020 140 L 1140 140" fill="none" strokeDasharray="4 4" />
          <path d="M 1020 270 L 1080 270 L 1080 340 L 1140 340" fill="none" strokeDasharray="4 4" />

          {/* 5. Redis Cache */}
          <g transform="translate(1140, 116)">
            <rect x="0" y="0" width="120" height="48" rx="8" fill="transparent" />
            <text x="60" y="24" textAnchor="middle" dominantBaseline="middle" stroke="none" fill="currentColor" className="text-[11px] font-bold">
              REDIS CACHE
            </text>
            <text x="60" y="38" textAnchor="middle" stroke="none" fill="currentColor" opacity="0.6" className="text-[9px]">
              LRU · TTL 60s
            </text>
          </g>

          {/* 6. Postgres Database */}
          <g transform="translate(1140, 316)">
            <rect x="0" y="0" width="130" height="48" rx="8" fill="transparent" />
            <text x="65" y="24" textAnchor="middle" dominantBaseline="middle" stroke="none" fill="currentColor" className="text-[11px] font-bold">
              POSTGRESQL
            </text>
            <text x="65" y="38" textAnchor="middle" stroke="none" fill="currentColor" opacity="0.6" className="text-[9px]">
              Connection Pool: 10
            </text>
          </g>

          {/* ── Subtle Request Trace Packet (Periodically moves across path) ── */}
          <circle r="3.5" fill="#3b82f6" stroke="#60a5fa" strokeWidth="1">
            <animateMotion
              path="M 250 204 L 380 204 L 510 204 L 640 204 L 770 204 L 840 204 L 840 140 L 900 140 L 1020 140 L 1140 140"
              dur="8s"
              repeatCount="indefinite"
            />
          </circle>
          <circle r="3" fill="#3b82f6" stroke="#60a5fa" strokeWidth="1" opacity="0.7">
            <animateMotion
              path="M 250 204 L 380 204 L 510 204 L 640 204 L 770 204 L 840 204 L 840 270 L 900 270 L 1080 270 L 1080 340 L 1140 340"
              dur="10s"
              begin="3s"
              repeatCount="indefinite"
            />
          </circle>
        </g>
      </svg>
    </div>
  );
}
