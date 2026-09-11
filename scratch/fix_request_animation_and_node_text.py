workspace_file = "app/workspace/page.tsx"

with open(workspace_file, "r", encoding="utf-8") as f:
    code = f.read()

# 1. Revert CustomNode wrapper to remove dimming/quieting and scaling
target_wrapper_old = """  return (
    <div
      className="relative flex items-center justify-center transition-all duration-300"
      style={{
        width: "100%",
        height: "100%",
        minWidth: isDiamond ? 120 : isCircle ? 90 : 180,
        opacity: data.hasAnyActive && !data.isActive ? 0.42 : 1,
        filter: data.hasAnyActive && !data.isActive
          ? "grayscale(0.4) brightness(0.85)"
          : selected
          ? `drop-shadow(0 0 12px ${colors.ring})`
          : undefined,
        transform: data.isActive ? "scale(1.03)" : "scale(1)",
        transition: "opacity 0.25s ease, filter 0.25s ease, transform 0.25s ease",
      }}
    >"""

target_wrapper_clean = """  return (
    <div
      className="relative flex items-center justify-center transition-all duration-200"
      style={{
        width: "100%",
        height: "100%",
        minWidth: isDiamond ? 120 : isCircle ? 90 : 180,
        filter: selected ? `drop-shadow(0 0 10px ${colors.ring})` : undefined,
      }}
    >"""

if target_wrapper_old in code:
    code = code.replace(target_wrapper_old, target_wrapper_clean, 1)
    print("Fixed: Reverted CustomNode wrapper to 100% solid opacity without dimming/scaling.")
else:
    print("WARNING: target_wrapper_old not found")

# 2. Shape Container clean subtle active glow
target_shape_old = """      <div
        className="w-full h-full flex items-center justify-center overflow-hidden transition-all duration-200"
        style={{
          background: `linear-gradient(135deg, var(--surface) 0%, color-mix(in srgb, var(--surface) 92%, ${colors.accent}) 100%)`,
          border: data.isActive
            ? `2px solid ${colors.dot}`
            : `1.5px solid color-mix(in srgb, var(--border) 80%, ${colors.accent})`,
          boxShadow: data.isActive
            ? `0 0 0 3px ${colors.dot}40, 0 0 24px ${colors.glow}, 0 8px 24px rgba(0,0,0,0.5)`
            : selected
            ? `0 0 0 2px ${colors.ring}, 0 4px 20px ${colors.glow}`
            : `0 2px 8px ${colors.glow}`,
          ...shapeStyle,
          ...(isCylinder
            ? {
                boxShadow: `${data.isActive ? `0 0 0 3px ${colors.dot}40, ` : selected ? `0 0 0 2px ${colors.ring}, ` : ""}0 2px 8px ${colors.glow}, inset 0 -3px 0 color-mix(in srgb, var(--border) 60%, ${colors.accent})`,
              }
            : {}),
        }}
      >"""

target_shape_clean = """      <div
        className="w-full h-full flex items-center justify-center overflow-hidden transition-all duration-200"
        style={{
          background: `linear-gradient(135deg, var(--surface) 0%, color-mix(in srgb, var(--surface) 92%, ${colors.accent}) 100%)`,
          border: data.isActive
            ? `2px solid ${colors.dot}`
            : `1.5px solid color-mix(in srgb, var(--border) 80%, ${colors.accent})`,
          boxShadow: selected
            ? `0 0 0 2px ${colors.ring}, 0 4px 20px ${colors.glow}`
            : data.isActive
            ? `0 0 0 2px ${colors.dot}, 0 2px 12px ${colors.glow}`
            : `0 2px 8px ${colors.glow}`,
          ...shapeStyle,
          ...(isCylinder
            ? {
                boxShadow: `${selected ? `0 0 0 2px ${colors.ring}, ` : ""}0 2px 8px ${colors.glow}, inset 0 -3px 0 color-mix(in srgb, var(--border) 60%, ${colors.accent})`,
              }
            : {}),
        }}
      >"""

if target_shape_old in code:
    code = code.replace(target_shape_old, target_shape_clean, 1)
    print("Fixed: Shape container styling cleaned up.")
else:
    print("WARNING: target_shape_old not found")

# 3. Remove text pills underneath each node (action pill and ready pill)
target_under_node_old = """      {/* Dynamic Active Action Pill */}
      {data.isActive && (
        <div className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[9.5px] font-mono font-bold bg-blue-600 text-white shadow-xl border border-blue-400/50 whitespace-nowrap flex items-center gap-1.5 z-40 animate-pulse pointer-events-none">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
          <span>{data.activeAction || "Processing"}</span>
        </div>
      )}

      {/* Dynamic Status / Ready Pill when not actively transmitting */}
      {!data.isActive && !isCircle && !isDiamond && data.type !== "client" && (
        <span className="absolute -bottom-2 right-2 px-1.5 py-0.2 rounded text-[8px] font-mono text-emerald-400/80 bg-emerald-500/10 border border-emerald-500/20 pointer-events-none">
          ● Ready
        </span>
      )}"""

if target_under_node_old in code:
    code = code.replace(target_under_node_old, "", 1)
    print("Fixed: Removed text underneath each node (action pill and ready pill removed completely).")
else:
    print("WARNING: target_under_node_old not found")

# 4. Replace PacketEdge with ultra-smooth continuous radiant request packet
target_packet_edge_old = """function PacketEdge(props: EdgeProps) {
  const {
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style,
    markerEnd,
    data,
  } = props;

  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 10,
  });

  const isActive = Boolean(data?.active);
  const duration = Number(data?.packetDuration ?? 1.8);
  const isReverseMotion = Boolean(data?.reverseMotion);
  const count = Math.max(1, Math.min(Number(data?.packetCount ?? 1), 4));
  const frameIndex = Number(data?.frameIndex ?? 0);

  const animateRefs = useRef<Array<any>>([]);

  useEffect(() => {
    if (isActive) {
      animateRefs.current.forEach((ref, index) => {
        if (ref) {
          try {
            if (typeof ref.beginElementAt === "function") {
              ref.beginElementAt(index * 0.12);
            } else if (typeof ref.beginElement === "function") {
              ref.beginElement();
            }
          } catch (e) {
            console.error("Error starting SMIL animation:", e);
          }
        }
      });
    }
  }, [isActive, frameIndex]);

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeOpacity: isActive ? 0.95 : 0.4,
          transition: "stroke-opacity 150ms ease",
        }}
      />
      {isActive &&
        Array.from({ length: count }).map((_, index) => (
          <circle
            key={`${props.id}-${index}-${edgePath}-${frameIndex}`}
            r={4.5 - index * 0.5}
            fill={packetColor(isReverseMotion)}
            cx="0"
            cy="0"
            style={{
              filter: isReverseMotion
                ? "drop-shadow(0 0 5px rgba(245,158,11,0.85))"
                : "drop-shadow(0 0 5px rgba(139,92,246,0.85))",
              opacity: Math.max(0.45, 0.9 - index * 0.15),
            }}
          >
            <animateMotion
              ref={(el) => {
                animateRefs.current[index] = el;
              }}
              dur={`${duration}s`}
              repeatCount={data?.isPlaying ? "1" : "indefinite"}
              fill="freeze"
              begin={`${index * 0.12}s`}
              path={edgePath}
              keyPoints={isReverseMotion ? "1;0" : "0;1"}
              keyTimes="0;1"
              calcMode="linear"
            />
          </circle>
        ))}
    </>
  );
}"""

target_packet_edge_new = """function PacketEdge(props: EdgeProps) {
  const {
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style,
    markerEnd,
    data,
  } = props;

  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 10,
  });

  const isActive = Boolean(data?.active);
  const duration = Number(data?.packetDuration ?? 1.2);
  const isReverseMotion = Boolean(data?.reverseMotion);

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: isActive ? packetColor(isReverseMotion) : style?.stroke,
          strokeWidth: isActive ? 2.5 : 1.8,
          strokeOpacity: isActive ? 1 : 0.45,
          transition: "stroke-opacity 150ms ease, stroke-width 150ms ease",
        }}
      />
      {isActive && (
        <g>
          {/* Glowing outer halo */}
          <circle
            r={7}
            fill={packetColor(isReverseMotion)}
            opacity={0.35}
            style={{
              filter: isReverseMotion
                ? "drop-shadow(0 0 6px rgba(245,158,11,0.9))"
                : "drop-shadow(0 0 6px rgba(59,130,246,0.9))",
            }}
          >
            <animateMotion
              dur={`${duration}s`}
              repeatCount="indefinite"
              path={edgePath}
              keyPoints={isReverseMotion ? "1;0" : "0;1"}
              keyTimes="0;1"
              calcMode="linear"
            />
          </circle>

          {/* Main radiant request packet */}
          <circle
            r={4.5}
            fill={packetColor(isReverseMotion)}
            style={{
              filter: isReverseMotion
                ? "drop-shadow(0 0 8px rgba(245,158,11,1))"
                : "drop-shadow(0 0 8px rgba(59,130,246,1))",
            }}
          >
            <animateMotion
              dur={`${duration}s`}
              repeatCount="indefinite"
              path={edgePath}
              keyPoints={isReverseMotion ? "1;0" : "0;1"}
              keyTimes="0;1"
              calcMode="linear"
            />
          </circle>

          {/* Bright white energy core */}
          <circle r={2} fill="#ffffff">
            <animateMotion
              dur={`${duration}s`}
              repeatCount="indefinite"
              path={edgePath}
              keyPoints={isReverseMotion ? "1;0" : "0;1"}
              keyTimes="0;1"
              calcMode="linear"
            />
          </circle>
        </g>
      )}
    </>
  );
}"""

if target_packet_edge_old in code:
    code = code.replace(target_packet_edge_old, target_packet_edge_new, 1)
    print("Fixed: Replaced PacketEdge with continuous, highly visible 3-layer glowing packet.")
else:
    print("WARNING: target_packet_edge_old not found")

# 5. Update animatedEdges to keep incoming edge active during internal node processing steps
target_animated_edges_old = """    for (const frame of currentFrames) {
      // Find all edges that match this transmission step
      const directEdge = edges.find(
        (e) => e.source === frame.from && e.target === frame.to,
      );
      const reverseEdge = edges.find(
        (e) => e.source === frame.to && e.target === frame.from,
      );

      if (directEdge) {
        const resolvedEdgeId = directEdge.id;
        const previous = edgeState.get(resolvedEdgeId);
        if (!previous) {
          edgeState.set(resolvedEdgeId, {
            reverseMotion: false,
            packetCount: 1,
          });
        } else {
          edgeState.set(resolvedEdgeId, {
            reverseMotion: previous.reverseMotion,
            packetCount: previous.packetCount + 1,
          });
        }
      } else if (reverseEdge) {
        const resolvedEdgeId = reverseEdge.id;
        const previous = edgeState.get(resolvedEdgeId);
        if (!previous) {
          edgeState.set(resolvedEdgeId, {
            reverseMotion: true,
            packetCount: 1,
          });
        } else {
          edgeState.set(resolvedEdgeId, {
            reverseMotion: previous.reverseMotion || true,
            packetCount: previous.packetCount + 1,
          });
        }
      }
    }"""

target_animated_edges_new = """    for (const frame of currentFrames) {
      if (!frame) continue;

      // Find all edges that match this transmission step
      const directEdge = edges.find(
        (e) => e.source === frame.from && e.target === frame.to,
      );
      const reverseEdge = edges.find(
        (e) => e.source === frame.to && e.target === frame.from,
      );

      if (directEdge) {
        edgeState.set(directEdge.id, {
          reverseMotion: false,
          packetCount: 1,
        });
      } else if (reverseEdge) {
        edgeState.set(reverseEdge.id, {
          reverseMotion: true,
          packetCount: 1,
        });
      } else if (frame.from && frame.to && frame.from === frame.to) {
        // Internal node processing step (e.g. Server processing, Cache check)
        // Keep the incoming edge to this node active so the request packet stays visible!
        const incomingEdge = edges.find((e) => e.target === frame.from);
        if (incomingEdge && !edgeState.has(incomingEdge.id)) {
          edgeState.set(incomingEdge.id, {
            reverseMotion: false,
            packetCount: 1,
          });
        }
      }
    }"""

if target_animated_edges_old in code:
    code = code.replace(target_animated_edges_old, target_animated_edges_new, 1)
    print("Fixed: Updated animatedEdges to keep incoming edge active during node processing frames.")
else:
    print("WARNING: target_animated_edges_old not found")

# 6. Ensure type: "packet" is always set on all edges in animatedEdges
target_edge_map_old = """    return edges.map((edge) => {
      const active = edgeState.has(edge.id);
      const reverseMotion = edgeState.get(edge.id)?.reverseMotion ?? false;
      const speedAdjustedDuration = active ? 1.0 / speed : 1.8 / speed;

      return {
        ...edge,
        data: {
          active,
          reverseMotion,
          packetCount: edgeState.get(edge.id)?.packetCount ?? 1,
          packetDuration: speedAdjustedDuration,
          isPlaying,
          frameIndex,
        },
        style: {
          stroke: active ? packetColor(reverseMotion) : inactiveStroke,
          strokeWidth: active ? 2.5 : 1.8,
        },
      };
    });"""

target_edge_map_new = """    return edges.map((edge) => {
      const active = edgeState.has(edge.id);
      const reverseMotion = edgeState.get(edge.id)?.reverseMotion ?? false;
      const speedAdjustedDuration = active ? 1.0 / speed : 1.8 / speed;

      return {
        ...edge,
        type: "packet",
        data: {
          active,
          reverseMotion,
          packetCount: edgeState.get(edge.id)?.packetCount ?? 1,
          packetDuration: speedAdjustedDuration,
          isPlaying,
          frameIndex,
        },
        style: {
          stroke: active ? packetColor(reverseMotion) : inactiveStroke,
          strokeWidth: active ? 2.5 : 1.8,
        },
      };
    });"""

if target_edge_map_old in code:
    code = code.replace(target_edge_map_old, target_edge_map_new, 1)
    print("Fixed: Ensured type: 'packet' is always set on all animated edges.")
else:
    print("WARNING: target_edge_map_old not found")

with open(workspace_file, "w", encoding="utf-8") as f:
    f.write(code)

print("All fixes applied successfully.")
