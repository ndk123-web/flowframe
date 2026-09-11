import re

workspace_file = "app/workspace/page.tsx"

with open(workspace_file, "r", encoding="utf-8") as f:
    code = f.read()

print("Original code length:", len(code))

# 1. Add AIAssistantDrawer import
if "import AIAssistantDrawer" not in code:
    code = code.replace(
        'import SiteHeader from "@/components/SiteHeader";',
        'import SiteHeader from "@/components/SiteHeader";\nimport AIAssistantDrawer from "@/components/AIAssistantDrawer";'
    )

# 2. Update CustomNode to support active glowing ring, dynamic action pill, quiet state
old_custom_node_start = """  return (
    <div
      className="relative flex items-center justify-center transition-all duration-200"
      style={{
        width: "100%",
        height: "100%",
        minWidth: isDiamond ? 120 : isCircle ? 90 : 180,
        filter: selected ? `drop-shadow(0 0 10px ${colors.ring})` : undefined,
      }}
    >"""

new_custom_node_start = """  return (
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

if old_custom_node_start in code:
    code = code.replace(old_custom_node_start, new_custom_node_start, 1)
    print("Updated CustomNode wrapper")
else:
    print("WARNING: CustomNode wrapper not found")

# Update CustomNode Shape Container border & boxShadow for active state
old_shape_container = """      <div
        className="w-full h-full flex items-center justify-center overflow-hidden"
        style={{
          background: `linear-gradient(135deg, var(--surface) 0%, color-mix(in srgb, var(--surface) 92%, ${colors.accent}) 100%)`,
          border: `1.5px solid color-mix(in srgb, var(--border) 80%, ${colors.accent})`,
          boxShadow: selected
            ? `0 0 0 2px ${colors.ring}, 0 4px 20px ${colors.glow}`
            : `0 2px 8px ${colors.glow}`,
          ...shapeStyle,
          ...(isCylinder
            ? {
                boxShadow: `${selected ? `0 0 0 2px ${colors.ring}, ` : ""}0 2px 8px ${colors.glow}, inset 0 -3px 0 color-mix(in srgb, var(--border) 60%, ${colors.accent})`,
              }
            : {}),
        }}
      >"""

new_shape_container = """      <div
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

if old_shape_container in code:
    code = code.replace(old_shape_container, new_shape_container, 1)
    print("Updated CustomNode shape container")
else:
    print("WARNING: CustomNode shape container not found")

# Update CustomNode active badges: add action pill and ready badge
old_pulse_dot = """      {/* Active pulse dot */}
      {data.isActive && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3 pointer-events-none">
          <span
            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
            style={{ background: colors.dot }}
          />
          <span
            className="relative inline-flex rounded-full h-3 w-3"
            style={{ background: colors.dot }}
          />
        </span>
      )}"""

new_pulse_dot = """      {/* Active pulse dot */}
      {data.isActive && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3 pointer-events-none">
          <span
            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
            style={{ background: colors.dot }}
          />
          <span
            className="relative inline-flex rounded-full h-3 w-3"
            style={{ background: colors.dot }}
          />
        </span>
      )}

      {/* Dynamic Active Action Pill */}
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

if old_pulse_dot in code:
    code = code.replace(old_pulse_dot, new_pulse_dot, 1)
    print("Updated CustomNode active badge and ready pill")
else:
    print("WARNING: CustomNode pulse dot not found")

# 3. Add state variables for showLogsDrawer and isAIAssistantOpen
old_states = """  // Playback Simulation States
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [frameIndex, setFrameIndex] = useState(0);"""

new_states = """  // Playback Simulation States
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [frameIndex, setFrameIndex] = useState(0);

  // Collapsible Logs Drawer & AI Assistant States
  const [showLogsDrawer, setShowLogsDrawer] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);"""

if old_states in code:
    code = code.replace(old_states, new_states, 1)
    print("Added showLogsDrawer and isAIAssistantOpen states")
else:
    print("WARNING: Playback Simulation States not found")

# 4. Update keydown listener for Escape and Space shortcuts
old_keydown = """  // Keyboard shortcut Ctrl+S / Cmd+S for quick save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSaveDiagramToBackend();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [workspaceId, diagramId, token, nodes, edges, nodeConfigs]);"""

new_keydown = """  // Keyboard shortcuts: Ctrl+S to save, Esc to dismiss panels, Space to play/pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSaveDiagramToBackend();
      }
      if (e.key === "Escape") {
        setSelectedNodeId(null);
        setIsAIAssistantOpen(false);
        setShowLogsDrawer(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [workspaceId, diagramId, token, nodes, edges, nodeConfigs]);"""

if old_keydown in code:
    code = code.replace(old_keydown, new_keydown, 1)
    print("Updated keyboard shortcuts")
else:
    print("WARNING: Keydown listener not found")

# 5. Update styledNodes to pass hasAnyActive, activeAction, activeRole
old_styled_nodes = """  // Node highlight style mapping
  const styledNodes = useMemo(() => {
    return nodes.map((node) => {
      const isSelected = node.id === selectedNodeId;
      const isActive = currentFrames.some(
        (f) => f.from === node.id || f.to === node.id,
      );
      const isShape = node.type === "shapeNode";

      return {
        ...node,
        type: node.type || "customNode",
        selected: isSelected,
        style: isShape ? { ...node.style, zIndex: -1 } : undefined,
        data: {
          ...node.data,
          isActive,
        },
      };
    });
  }, [nodes, selectedNodeId, currentFrames]);"""

new_styled_nodes = """  // Node highlight style mapping with active quieting and dynamic state
  const styledNodes = useMemo(() => {
    const hasAnyActive = isPlaying && currentFrames.length > 0;
    return nodes.map((node) => {
      const isSelected = node.id === selectedNodeId;
      const activeFrame = currentFrames.find(
        (f) => f.from === node.id || f.to === node.id,
      );
      const isActive = Boolean(activeFrame);
      const isShape = node.type === "shapeNode";

      return {
        ...node,
        type: node.type || "customNode",
        selected: isSelected,
        style: isShape ? { ...node.style, zIndex: -1 } : undefined,
        data: {
          ...node.data,
          isActive,
          hasAnyActive,
          activeAction: activeFrame?.action,
          activeRole: activeFrame ? (activeFrame.to === node.id ? "target" : "source") : null,
        },
      };
    });
  }, [nodes, selectedNodeId, currentFrames, isPlaying]);"""

if old_styled_nodes in code:
    code = code.replace(old_styled_nodes, new_styled_nodes, 1)
    print("Updated styledNodes mapping")
else:
    print("WARNING: styledNodes not found")

# 6. Add handleApplyAIDsl callback function
target_fn_anchor = "  // Compile & Execute DSL script from Monaco Editor"
ai_apply_dsl_code = """  // Apply AI Generated FlowFrame DSL Architecture
  const handleApplyAIDsl = useCallback(
    (code: string, explanation: string) => {
      try {
        if (!code || code.trim().length === 0) {
          setValidationWarning("AI generated empty DSL code.");
          return;
        }
        const output = compileDSL(code);
        if (!output.nodes || output.nodes.length === 0) {
          setValidationWarning("No components generated from AI architecture.");
          return;
        }

        setNodes(output.nodes);
        setEdges(output.edges);
        setNodeConfigs(output.nodeConfigs);
        setDslCode(code);
        setValidationWarning(null);
        setSuccessToast(explanation || "Architecture generated by AI Architect! ⚡");

        const firstClient = output.nodes.find((n: any) => n.data?.type === "client");
        if (firstClient) {
          handleStartSimulation(firstClient.id, output.nodes, output.edges, output.nodeConfigs);
        }
        setTimeout(() => {
          fitView({ duration: 600 });
        }, 150);
      } catch (err: any) {
        setValidationWarning(`AI DSL Error: ${err.message || err}`);
      }
    },
    [setNodes, setEdges, setNodeConfigs, setDslCode, handleStartSimulation, fitView],
  );

  // Compile & Execute DSL script from Monaco Editor"""

if target_fn_anchor in code:
    code = code.replace(target_fn_anchor, ai_apply_dsl_code, 1)
    print("Added handleApplyAIDsl callback")
else:
    print("WARNING: target_fn_anchor not found")

# 7. Add Empty Canvas State inside the ReactFlow container (after canvas loading overlay)
old_tip = """            {/* Interactive Canvas Tip / First-Time Hint Banner */}"""

new_empty_and_tip = """            {/* Empty Canvas Onboarding State */}
            {nodes.length === 0 && !isLoadingDiagram && (
              <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none p-4">
                <div className="pointer-events-auto max-w-md w-full bg-[var(--surface)]/95 backdrop-blur-2xl border border-[var(--border)] rounded-3xl p-8 shadow-2xl text-center flex flex-col items-center gap-5 animate-fade-in">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-inner">
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500" />
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <h2 className="text-lg font-bold tracking-tight text-[color:var(--foreground)]">
                      Build your first architecture
                    </h2>
                    <p className="text-xs text-[color:var(--foreground)]/60 leading-relaxed max-w-sm">
                      Model distributed systems, trace request flows hop-by-hop, and simulate real-time caching, load balancing, and failure scenarios.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full">
                    <button
                      type="button"
                      onClick={() => loadTemplate("cacheAside")}
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>📄</span>
                      <span>Load Template</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsAIAssistantOpen(true)}
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-bold border border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>✨</span>
                      <span>Ask AI Architect</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const cId = `client_${new ShortUniqueId({ length: 4 })()}`;
                      const sId = `server_${new ShortUniqueId({ length: 4 })()}`;
                      const starterNodes: Node[] = [
                        {
                          id: cId,
                          type: "customNode",
                          position: { x: 140, y: 240 },
                          data: {
                            label: "Client 1",
                            type: "client",
                            ip: "192.168.1.10",
                            port: 3000,
                            flavor: "fetch",
                          },
                        },
                        {
                          id: sId,
                          type: "customNode",
                          position: { x: 440, y: 240 },
                          data: {
                            label: "API Server",
                            type: "server",
                            ip: "10.0.0.1",
                            port: 8080,
                            flavor: "node",
                          },
                        },
                      ];
                      const starterEdges: Edge[] = [
                        {
                          id: `e_${cId}_${sId}`,
                          source: cId,
                          target: sId,
                          type: "animatedFlowEdge",
                        },
                      ];
                      setNodes(starterNodes);
                      setEdges(starterEdges);
                      setSuccessToast("Blank canvas initialized with Client & Server!");
                    }}
                    className="text-[11px] font-mono text-[color:var(--foreground)]/45 hover:text-blue-400 transition cursor-pointer"
                  >
                    + Start with Blank Starter
                  </button>
                </div>
              </div>
            )}

            {/* Interactive Canvas Tip / First-Time Hint Banner */}"""

if old_tip in code:
    code = code.replace(old_tip, new_empty_and_tip, 1)
    print("Added Empty Canvas Onboarding State")
else:
    print("WARNING: old_tip not found")

# 8. Add AI Architect button in the top-right overlay
old_top_overlay_end = """              {workspaceId && diagramId && (
                <>
                  <div className="h-4 w-px bg-[var(--border)] my-auto" />
                  <button
                    type="button"
                    onClick={handleSaveDiagramToBackend}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-500/20 transition cursor-pointer disabled:opacity-50"
                    title="Save diagram to MongoDB (Ctrl+S / Cmd+S)"
                  >
                    <span>💾</span>
                    <span>{isSaving ? "Saving..." : "Save"}</span>
                  </button>
                </>
              )}
            </div>"""

new_top_overlay_end = """              {workspaceId && diagramId && (
                <>
                  <div className="h-4 w-px bg-[var(--border)] my-auto" />
                  <button
                    type="button"
                    onClick={handleSaveDiagramToBackend}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-500/20 transition cursor-pointer disabled:opacity-50"
                    title="Save diagram to MongoDB (Ctrl+S / Cmd+S)"
                  >
                    <span>💾</span>
                    <span>{isSaving ? "Saving..." : "Save"}</span>
                  </button>
                </>
              )}

              <div className="h-4 w-px bg-[var(--border)] my-auto hidden sm:block" />

              {/* AI Architecture Assistant Trigger */}
              <button
                type="button"
                onClick={() => setIsAIAssistantOpen((prev) => !prev)}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition cursor-pointer ${
                  isAIAssistantOpen
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30"
                    : "bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 border border-blue-500/30"
                }`}
                title="AI Architecture Assistant (Create, Modify, Audit, Explain)"
              >
                <span>✨</span>
                <span className="hidden sm:inline">AI Architect</span>
              </button>
            </div>"""

if old_top_overlay_end in code:
    code = code.replace(old_top_overlay_end, new_top_overlay_end, 1)
    print("Added AI Architect trigger in top overlay")
else:
    print("WARNING: old_top_overlay_end not found")

# 9. Replace the bottom docked terminal panel with:
#    - Floating Simulation Control Dock
#    - Collapsible Slide-Up Logs Drawer
#    - AIAssistantDrawer component
old_bottom_dock_pattern = re.compile(
    r'\{/\* Bottom Docked Playback / Timeline Terminal Panel \*/\}[\s\S]*?\{/\* Welcome Modal & Template Picker Dialog \*/\}',
    re.MULTILINE
)

new_bottom_dock = """{/* Floating Simulation Control Dock */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 pointer-events-auto max-w-[96vw]">
            {/* Timeline Path Breadcrumb (shown when simulation has frames) */}
            {simulationFrames.length > 0 && currentFrames.length > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-blue-500/30 bg-[var(--surface)]/90 backdrop-blur-md shadow-lg text-[10px] font-mono text-blue-300 animate-fade-in">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
                <span className="font-semibold text-white/90">Path:</span>
                <div className="flex items-center gap-1">
                  {currentFrames.slice(0, 2).map((f: any, i: number) => (
                    <span key={i} className="flex items-center gap-1">
                      <span className="text-slate-300">{nodes.find((n) => n.id === f.from)?.data?.label || f.from}</span>
                      <span className="text-blue-400">──▶</span>
                      <span className="text-emerald-300 font-bold">{nodes.find((n) => n.id === f.to)?.data?.label || f.to}</span>
                      {f.action && <span className="text-amber-300/90 text-[9px]">({f.action})</span>}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Main Control Pill */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 p-2 px-3 sm:px-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-xl shadow-2xl">
              {/* State Badge */}
              <div
                className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 border ${
                  simulationFrames.length === 0
                    ? "bg-slate-800/60 text-slate-400 border-slate-700/60"
                    : isPlaying
                    ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
                    : frameIndex >= frameGroups.length - 1
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                    : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    simulationFrames.length === 0
                      ? "bg-slate-500"
                      : isPlaying
                      ? "bg-blue-400 animate-ping"
                      : frameIndex >= frameGroups.length - 1
                      ? "bg-emerald-400"
                      : "bg-amber-400"
                  }`}
                />
                <span>
                  {simulationFrames.length === 0
                    ? "IDLE"
                    : isPlaying
                    ? `RUNNING ${frameGroups.length > 0 ? `(${frameIndex + 1}/${frameGroups.length})` : ""}`
                    : frameIndex >= frameGroups.length - 1
                    ? "COMPLETE"
                    : `PAUSED (${frameIndex + 1}/${frameGroups.length})`}
                </span>
              </div>

              <div className="h-5 w-px bg-[var(--border)] hidden sm:block" />

              {/* Playback Buttons */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    if (simulationFrames.length === 0) {
                      handleStartSimulation();
                    } else {
                      setIsPlaying((prev) => !prev);
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 transition cursor-pointer flex items-center gap-1.5"
                  title={isPlaying ? "Pause Simulation (Space)" : "Run / Resume Simulation (Space)"}
                >
                  {isPlaying ? (
                    <>
                      <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                      </svg>
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      <span>{simulationFrames.length === 0 ? "Run Flow" : "Resume"}</span>
                    </>
                  )}
                </button>

                {/* Prev / Next Step Buttons */}
                <button
                  type="button"
                  onClick={goToPreviousFrame}
                  disabled={frameIndex <= 0 || simulationFrames.length === 0}
                  className="p-1.5 sm:px-2 rounded-xl text-xs font-semibold border border-[var(--border)] bg-[var(--surface-muted)] hover:bg-[var(--surface)] text-[color:var(--foreground)] disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
                  title="Previous Hop"
                >
                  ◀
                </button>
                <button
                  type="button"
                  onClick={goToNextFrame}
                  disabled={frameIndex >= frameGroups.length - 1 || simulationFrames.length === 0}
                  className="p-1.5 sm:px-2 rounded-xl text-xs font-semibold border border-[var(--border)] bg-[var(--surface-muted)] hover:bg-[var(--surface)] text-[color:var(--foreground)] disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
                  title="Next Hop"
                >
                  ▶
                </button>

                {/* Reset */}
                <button
                  type="button"
                  onClick={resetPlayback}
                  className="p-1.5 sm:px-2 rounded-xl text-xs font-semibold border border-[var(--border)] bg-[var(--surface-muted)] hover:bg-[var(--surface)] text-[color:var(--foreground)]/70 hover:text-[color:var(--foreground)] transition cursor-pointer"
                  title="Reset to Start"
                >
                  ↺
                </button>
              </div>

              <div className="h-5 w-px bg-[var(--border)] hidden sm:block" />

              {/* Speed Selector */}
              <div className="flex items-center gap-0.5 bg-[var(--surface-muted)] p-0.5 rounded-xl border border-[var(--border)]">
                {[1, 2, 4].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSpeed(s)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold transition cursor-pointer ${
                      speed === s
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/40 shadow-sm"
                        : "text-[color:var(--foreground)]/50 hover:text-[color:var(--foreground)]"
                    }`}
                    title={`Set simulation speed to ${s}x`}
                  >
                    {s}x
                  </button>
                ))}
              </div>

              <div className="h-5 w-px bg-[var(--border)] hidden sm:block" />

              {/* Instant Request Trigger */}
              <button
                type="button"
                onClick={() => {
                  handleStartSimulation();
                  setFrameIndex(0);
                  setIsPlaying(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md shadow-blue-500/20 transition cursor-pointer"
                title="Send new request simulation"
              >
                <span>⚡</span>
                <span className="hidden sm:inline">Send Request</span>
              </button>

              <div className="h-5 w-px bg-[var(--border)] hidden sm:block" />

              {/* Events Drawer Toggle */}
              <button
                type="button"
                onClick={() => setShowLogsDrawer((prev) => !prev)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                  showLogsDrawer
                    ? "bg-blue-500/20 text-blue-400 border-blue-500/50 shadow-sm"
                    : "border-[var(--border)] bg-[var(--surface-muted)] text-[color:var(--foreground)]/70 hover:text-[color:var(--foreground)]"
                }`}
                title={showLogsDrawer ? "Hide Execution Logs" : "Show Execution Logs"}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Events ({accumulatedFrames.length})</span>
                <span className="text-[10px]">{showLogsDrawer ? "▼" : "▲"}</span>
              </button>
            </div>
          </div>

          {/* Slide-Up Logs & Events Drawer */}
          {showLogsDrawer && (
            <motion.div
              initial={{ y: 150, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 150, opacity: 0 }}
              className="absolute bottom-0 left-0 right-0 z-30 max-h-[42vh] flex flex-col rounded-t-3xl border-t border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-2xl shadow-2xl p-4 gap-3 overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-[var(--border)]/70 pb-3 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[color:var(--foreground)]">
                    Simulation Execution Stream
                  </h3>
                  <span className="text-[10px] font-mono text-[color:var(--foreground)]/45">
                    Frame {simulationFrames.length > 0 ? frameIndex + 1 : 0} of {simulationFrames.length}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-[11px] text-[color:var(--foreground)]/70 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hideResponse}
                      onChange={() => setHideResponse((prev) => !prev)}
                      className="accent-blue-500"
                    />
                    <span>Hide Return Packets</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-[11px] text-[color:var(--foreground)]/70 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={parallelResponse}
                      onChange={() => setParallelResponse((prev) => !prev)}
                      className="accent-blue-500"
                    />
                    <span>Parallel</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowLogsDrawer(false)}
                    className="h-6 w-6 rounded-full hover:bg-[var(--surface-muted)] text-[color:var(--foreground)]/50 hover:text-[color:var(--foreground)] flex items-center justify-center text-xs font-bold transition cursor-pointer"
                    aria-label="Close logs drawer"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Timeline scrubber */}
              <Timeline
                frameIndex={frameIndex}
                frameGroups={frameGroups}
                onSeek={(idx) => {
                  setIsPlaying(false);
                  setFrameIndex(idx);
                }}
                theme={theme}
              />

              {/* Log entries container */}
              <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin rounded-xl border border-[var(--border)]/60 bg-[var(--surface-muted)]/40 p-2.5">
                <DebugPanel
                  currentFrames={accumulatedFrames}
                  frameIndex={frameIndex}
                  theme={theme}
                />
              </div>
            </motion.div>
          )}

          {/* AI Architecture Assistant Slide-Over Drawer */}
          <AIAssistantDrawer
            isOpen={isAIAssistantOpen}
            onClose={() => setIsAIAssistantOpen(false)}
            nodes={nodes}
            edges={edges}
            nodeConfigs={nodeConfigs}
            onApplyDsl={handleApplyAIDsl}
            onRunSimulation={() => {
              handleStartSimulation();
              setFrameIndex(0);
              setIsPlaying(true);
            }}
            theme={theme}
          />
        </div>

        {/* Welcome Modal & Template Picker Dialog */}"""

if old_bottom_dock_pattern.search(code):
    code = old_bottom_dock_pattern.sub(new_bottom_dock, code, count=1)
    print("Replaced bottom docked terminal panel with Floating Dock + Slide-up Logs Drawer + AI Assistant Drawer")
else:
    print("WARNING: old_bottom_dock_pattern not matched")

with open(workspace_file, "w", encoding="utf-8") as f:
    f.write(code)

print("Updated code written successfully. New length:", len(code))
