import React from "react";

interface IconProps {
  className?: string;
  type: string;
}

export function ComponentIcon({ type, className = "w-5 h-5" }: IconProps) {
  const normalizedType = String(type || "").toLowerCase();

  switch (normalizedType) {
    case "client":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.8}
          stroke="currentColor"
          className={className}
        >
          {/* Monitor Screen Frame */}
          <rect x="2" y="3" width="20" height="13" rx="2" />
          {/* Stand */}
          <path d="M9 21h6" />
          <path d="M12 16v5" />
          {/* Browser Address Bar Mockup */}
          <line x1="5" y1="6" x2="8" y2="6" strokeWidth={1.5} />
          <line x1="10" y1="6" x2="19" y2="6" strokeWidth={1.5} opacity={0.6} />
          {/* Screen Content mock lines */}
          <rect x="5" y="9" width="6" height="4" rx="0.5" opacity={0.7} />
          <line x1="13" y1="9" x2="19" y2="9" strokeWidth={1.5} opacity={0.5} />
          <line x1="13" y1="11" x2="17" y2="11" strokeWidth={1.5} opacity={0.5} />
        </svg>
      );

    case "dns":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.8}
          stroke="currentColor"
          className={className}
        >
          {/* Globe Outline */}
          <circle cx="12" cy="12" r="10" />
          {/* Latitudes & Longitudes */}
          <path d="M2 12h20" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          {/* Domain name resolution map lines */}
          <path d="M16.5 7.5h.01M7.5 16.5h.01" strokeWidth={3} strokeLinecap="round" />
        </svg>
      );

    case "cdn":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.8}
          stroke="currentColor"
          className={className}
        >
          {/* Global edge circles (3 nodes) */}
          <circle cx="12" cy="5" r="3" />
          <circle cx="5" cy="17" r="3" />
          <circle cx="19" cy="17" r="3" />
          {/* Interconnecting data stream paths */}
          <path d="M9 7l-2.5 7M15 7l2.5 7M8 17h8" strokeDasharray="2 2" />
          {/* Circular transmission waves */}
          <path d="M12 11a2.5 2.5 0 0 1 0 5" opacity={0.8} />
          <circle cx="12" cy="13" r="1" fill="currentColor" />
        </svg>
      );

    case "api-gateway":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.8}
          stroke="currentColor"
          className={className}
        >
          {/* Outer Gate/Security frame */}
          <rect x="3" y="3" width="18" height="18" rx="3" />
          {/* Entry/Exit route splitters */}
          <path d="M12 3v6M12 15v6" />
          {/* Central controller hub / shield */}
          <circle cx="12" cy="12" r="3.5" fill="currentColor" fillOpacity={0.12} />
          <path d="M10 12h4" />
        </svg>
      );

    case "load-balancer":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.8}
          stroke="currentColor"
          className={className}
        >
          {/* Central balance hub */}
          <circle cx="12" cy="12" r="3" fill="currentColor" />
          {/* Balancing arrows / splits */}
          <path d="M12 3v6M12 15v6M3 12h6M15 12h6" />
          {/* Distribution directional arcs */}
          <path d="M7 6.5C8.3 5 10.1 4 12 4s3.7 1 5 2.5" />
          <path d="M17 17.5c-1.3 1.5-3.1 2.5-5 2.5s-3.7-1-5-2.5" />
        </svg>
      );

    case "server":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.8}
          stroke="currentColor"
          className={className}
        >
          {/* Rack Server 1 (Top unit) */}
          <rect x="2" y="4" width="20" height="7" rx="1.5" />
          <line x1="5" y1="7.5" x2="13" y2="7.5" strokeWidth={1.5} opacity={0.7} />
          <circle cx="17" cy="7.5" r="0.75" fill="currentColor" />
          <circle cx="19" cy="7.5" r="0.75" fill="currentColor" />

          {/* Rack Server 2 (Bottom unit) */}
          <rect x="2" y="13" width="20" height="7" rx="1.5" />
          <line x1="5" y1="16.5" x2="13" y2="16.5" strokeWidth={1.5} opacity={0.7} />
          <circle cx="17" cy="16.5" r="0.75" fill="currentColor" />
          <circle cx="19" cy="16.5" r="0.75" fill="currentColor" opacity={0.5} />
        </svg>
      );

    case "redis":
    case "redis_cache":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.8}
          stroke="currentColor"
          className={className}
        >
          {/* Stacked Cache memory grids */}
          <path d="M3 7l9-4 9 4-9 4-9-4z" fill="currentColor" fillOpacity={0.1} />
          <path d="M3 12l9 4 9-4M3 17l9 4 9-4" />
          {/* Speed flash lightning bolt */}
          <path
            d="M13 6l-4 6h5v6l4-6h-5V6z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth={1.2}
            className="text-amber-400"
          />
        </svg>
      );

    case "postgres":
    case "postgres_database":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.8}
          stroke="currentColor"
          className={className}
        >
          {/* Relational Database Cylinder grid */}
          <path d="M12 22c5.523 0 10-1.79 10-4V6c0-2.21-4.477-4-10-4S2 3.79 2 6v12c0 2.21 4.477 4 10 4z" />
          <path d="M22 6c0 2.21-4.477 4-10 4S2 8.21 2 6M2 12c0 2.21 4.477 4 10 4s10-1.79 10-4" />
          {/* Cylinder structure table rows */}
          <line x1="7" y1="12" x2="17" y2="12" strokeWidth={1.2} opacity={0.6} />
          <line x1="7" y1="18" x2="17" y2="18" strokeWidth={1.2} opacity={0.6} />
        </svg>
      );

    case "storage":
    case "storage_system":
    case "cloud_storage":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.8}
          stroke="currentColor"
          className={className}
        >
          {/* Storage Cloud outline */}
          <path d="M18 10h.01M12 6c-3 0-5 2-5 5H6c-1.7 0-3 1.3-3 3s1.3 3 3 3h12c2.2 0 4-1.8 4-4s-1.8-4-4-4h-1c-.5-1.8-2-3-4-3z" />
          {/* Upload bucket arrows */}
          <path d="M12 12v4M9 14l3-3 3 3" />
        </svg>
      );

    default:
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.8}
          stroke="currentColor"
          className={className}
        >
          {/* Default gear settings configuration icon */}
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      );
  }
}
