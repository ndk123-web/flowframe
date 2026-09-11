workspace_file = "app/workspace/page.tsx"

with open(workspace_file, "r", encoding="utf-8") as f:
    code = f.read()

# 1. Add Ctrl+B keyboard shortcut
old_keys = """      if (e.key === "Escape") {
        setSelectedNodeId(null);
        setIsAIAssistantOpen(false);
        setShowLogsDrawer(false);
      }"""

new_keys = """      if (e.key === "Escape") {
        setSelectedNodeId(null);
        setIsAIAssistantOpen(false);
        setShowLogsDrawer(false);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setIsSidebarCollapsed((prev) => !prev);
      }"""

if old_keys in code:
    code = code.replace(old_keys, new_keys, 1)
    print("Added Ctrl+B shortcut for sidebar toggle")
else:
    print("WARNING: old_keys not found")

# 2. Update aside styles to support collapsing to width 0
old_aside = """        <aside
          className={`flex flex-col z-10 shrink-0 h-full overflow-hidden transition-all duration-300 relative border-r border-[var(--border)] bg-[var(--surface)] ${
            isSidebarFloating
              ? "absolute rounded-2xl shadow-2xl border"
              : "relative"
          } ${"max-md:fixed max-md:top-0 max-md:left-0 max-md:z-30 max-md:w-72 max-md:h-full max-md:shadow-2xl max-md:transition-transform max-md:duration-300"} ${
            isSidebarOpenMobile
              ? "max-md:translate-x-0"
              : "max-md:-translate-x-full"
          }`}
          style={{
            width: isSidebarFloating ? 288 : sidebarWidth,
            left: isSidebarFloating ? sidebarPosition.x : undefined,
            top: isSidebarFloating ? sidebarPosition.y : undefined,
            height: isSidebarFloating ? "calc(100vh - 160px)" : "100%",
          }}
        >"""

new_aside = """        <aside
          className={`flex flex-col z-10 shrink-0 h-full overflow-hidden transition-all duration-300 relative border-r border-[var(--border)] bg-[var(--surface)] ${
            isSidebarFloating
              ? "absolute rounded-2xl shadow-2xl border"
              : "relative"
          } ${"max-md:fixed max-md:top-0 max-md:left-0 max-md:z-30 max-md:w-72 max-md:h-full max-md:shadow-2xl max-md:transition-transform max-md:duration-300"} ${
            isSidebarOpenMobile
              ? "max-md:translate-x-0"
              : "max-md:-translate-x-full"
          } ${isSidebarCollapsed && !isSidebarFloating ? "w-0 !border-r-0 opacity-0 pointer-events-none" : ""}`}
          style={{
            width: isSidebarFloating ? 288 : isSidebarCollapsed ? 0 : sidebarWidth,
            left: isSidebarFloating ? sidebarPosition.x : undefined,
            top: isSidebarFloating ? sidebarPosition.y : undefined,
            height: isSidebarFloating ? "calc(100vh - 160px)" : "100%",
          }}
        >"""

if old_aside in code:
    code = code.replace(old_aside, new_aside, 1)
    print("Updated aside styling for smooth collapse")
else:
    print("WARNING: old_aside not found")

# 3. Add Collapse button in sidebar header
old_sidebar_header = """            <div className="flex items-center gap-1 bg-[var(--surface-muted)] p-1 rounded-xl border border-[var(--border)]">
              <button
                type="button"
                onClick={() => setSidebarTab("library")}
                className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  sidebarTab === "library"
                    ? "bg-[var(--surface)] text-[color:var(--accent)] shadow-sm border border-[var(--border)] font-bold"
                    : "text-[color:var(--foreground)]/60 hover:text-[color:var(--foreground)]"
                }`}
              >
                <span>🎨</span>
                <span>Library</span>
              </button>
              <button
                type="button"
                onClick={() => setSidebarTab("editor")}
                className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  sidebarTab === "editor"
                    ? "bg-[var(--surface)] text-[color:var(--accent)] shadow-sm border border-[var(--border)] font-bold"
                    : "text-[color:var(--foreground)]/60 hover:text-[color:var(--foreground)]"
                }`}
              >
                <span>⚡</span>
                <span>Code Editor</span>
              </button>
            </div>"""

new_sidebar_header = """            <div className="flex items-center gap-1 bg-[var(--surface-muted)] p-1 rounded-xl border border-[var(--border)]">
              <button
                type="button"
                onClick={() => setSidebarTab("library")}
                className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  sidebarTab === "library"
                    ? "bg-[var(--surface)] text-[color:var(--accent)] shadow-sm border border-[var(--border)] font-bold"
                    : "text-[color:var(--foreground)]/60 hover:text-[color:var(--foreground)]"
                }`}
              >
                <span>🎨</span>
                <span>Library</span>
              </button>
              <button
                type="button"
                onClick={() => setSidebarTab("editor")}
                className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  sidebarTab === "editor"
                    ? "bg-[var(--surface)] text-[color:var(--accent)] shadow-sm border border-[var(--border)] font-bold"
                    : "text-[color:var(--foreground)]/60 hover:text-[color:var(--foreground)]"
                }`}
              >
                <span>⚡</span>
                <span>Code Editor</span>
              </button>
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed(true)}
                className="p-1.5 rounded-lg hover:bg-[var(--surface)] text-[color:var(--foreground)]/50 hover:text-[color:var(--foreground)] transition cursor-pointer shrink-0"
                title="Collapse Sidebar (Ctrl+B)"
                aria-label="Collapse Sidebar"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </div>"""

if old_sidebar_header in code:
    code = code.replace(old_sidebar_header, new_sidebar_header, 1)
    print("Added Collapse button in sidebar header")
else:
    print("WARNING: old_sidebar_header not found")

# 4. Add floating Open Sidebar button on canvas when collapsed
old_mobile_btn = """          {/* Mobile Sidebar Hamburger Toggle */}
          <button
            type="button"
            onClick={() => setIsSidebarOpenMobile(true)}
            className="md:hidden absolute top-4 left-4 z-20 bg-[var(--surface)] border border-[var(--border)] p-2.5 rounded-xl shadow-lg hover:bg-[var(--surface-muted)] cursor-pointer flex items-center justify-center text-sm font-bold"
            title="Open Shapes Library"
          >
            ☰
          </button>"""

new_mobile_and_desktop_btn = """          {/* Mobile Sidebar Hamburger Toggle */}
          <button
            type="button"
            onClick={() => setIsSidebarOpenMobile(true)}
            className="md:hidden absolute top-4 left-4 z-20 bg-[var(--surface)] border border-[var(--border)] p-2.5 rounded-xl shadow-lg hover:bg-[var(--surface-muted)] cursor-pointer flex items-center justify-center text-sm font-bold"
            title="Open Shapes Library"
          >
            ☰
          </button>

          {/* Floating Open Sidebar Button (Visible when desktop sidebar is collapsed) */}
          {isSidebarCollapsed && (
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(false)}
              className="hidden md:flex absolute top-4 left-4 z-20 items-center gap-2 px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-xl shadow-xl hover:bg-[var(--surface-muted)] text-xs font-semibold text-[color:var(--foreground)] transition cursor-pointer animate-fade-in pointer-events-auto group"
              title="Open Shapes & Code Sidebar (Ctrl+B)"
            >
              <svg className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              <span>Sidebar</span>
              <span className="text-[10px] text-blue-400 font-bold">▶</span>
            </button>
          )}"""

if old_mobile_btn in code:
    code = code.replace(old_mobile_btn, new_mobile_and_desktop_btn, 1)
    print("Added floating Open Sidebar button on canvas")
else:
    print("WARNING: old_mobile_btn not found")

with open(workspace_file, "w", encoding="utf-8") as f:
    f.write(code)

print("apply_sidebar_toggle completed successfully.")
