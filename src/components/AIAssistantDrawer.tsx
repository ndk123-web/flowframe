"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import type { Node, Edge } from "@xyflow/react";
import {
  FiCpu,
  FiX,
  FiCheck,
  FiPlay,
  FiTrash2,
  FiCopy,
  FiArrowRight,
  FiMaximize2,
  FiMinimize2,
  FiSend,
  FiCode,
  FiAlertTriangle,
  FiZap,
  FiLayers,
  FiHelpCircle,
  FiSearch,
  FiCheckCircle,
  FiLock,
  FiChevronLeft,
} from "react-icons/fi";
import { Sparkles } from "lucide-react";
import FlowFrameCodeEditor from "./FlowFrameCodeEditor";
import { compileDSL } from "@/DSL";
import { diagramToDsl } from "@/utils/diagramToDsl";
import {
  sendAiChat,
  getAiUsage,
  getAiHistory,
  type AiUsageDTO,
  type AiChatPayload,
} from "@/services/aiApi";
import { useAuthStore } from "@/store/useAuthStore";

export interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: Node[];
  edges: Edge[];
  nodeConfigs: Record<string, any>;
  onApplyDsl: (code: string, explanation: string) => void;
  onRunSimulation?: () => void;
  theme?: "light" | "dark";
  initialPrompt?: string;
  initialThink?: boolean;
  selectedNode?: Node | null;
  onSelectNode?: (nodeId: string | null) => void;
  workspaceId?: string;
  diagramId?: string;
  token?: string | null;
  isSandbox?: boolean;
}

export type AIMode = "ask" | "analyze" | "modify";

export interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  mode?: AIMode;
  dsl?: string;
  architectureTitle?: string;
  applied?: boolean;
  rejected?: boolean;
  compileError?: string | null;
  thoughtProcess?: string;
  thoughtTime?: string;
  targetComponent?: string;
}

export default function AIAssistantDrawer({
  isOpen,
  onClose,
  nodes,
  edges,
  nodeConfigs,
  onApplyDsl,
  onRunSimulation,
  initialPrompt,
  initialThink,
  selectedNode,
  onSelectNode,
  workspaceId,
  diagramId,
  token: propToken,
  isSandbox: propIsSandbox,
}: AIAssistantDrawerProps) {
  // 3 Modes Only: "ask" | "analyze" | "modify" (Create / Modify)
  const [mode, setMode] = useState<AIMode>("ask");
  const [input, setInput] = useState("");
  const [thinkEnabled, setThinkEnabled] = useState(initialThink ?? true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [usage, setUsage] = useState<AiUsageDTO | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const { token: authStoreToken, isAuthenticated, user } = useAuthStore();
  const token = propToken || authStoreToken;
  const isLoggedIn = Boolean(token && (isAuthenticated || user));
  const router = useRouter();
  const pathname = usePathname() || "";

  // Dedicated check for public sandbox environment
  const isSandbox = Boolean(
    propIsSandbox ||
    !workspaceId ||
    !diagramId ||
    pathname === "/workspace" ||
    pathname.startsWith("/workspace?")
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Guarantee valid 24-hex ObjectIds for MongoDB backend
  const effectiveWorkspaceId = useMemo(() => {
    return workspaceId && /^[0-9a-fA-F]{24}$/.test(workspaceId)
      ? workspaceId
      : "000000000000000000000001";
  }, [workspaceId]);

  const effectiveDiagramId = useMemo(() => {
    return diagramId && /^[0-9a-fA-F]{24}$/.test(diagramId)
      ? diagramId
      : "000000000000000000000002";
  }, [diagramId]);

  // Sync initialThink if changed from outside
  useEffect(() => {
    if (initialThink !== undefined) {
      setThinkEnabled(initialThink);
    }
  }, [initialThink]);

  // Prefill initial prompt if passed from dashboard or URL query
  useEffect(() => {
    if (isOpen && initialPrompt && initialPrompt.trim().length > 0) {
      setInput(initialPrompt);
      setMode("modify");
    }
  }, [isOpen, initialPrompt]);

  // Load authoritative usage and history from backend on open / diagram change
  useEffect(() => {
    if (!isOpen || isSandbox) return;

    if (token) {
      // 1. Fetch latest usage limit
      getAiUsage(token)
        .then((u) => setUsage(u))
        .catch((err) => console.warn("Could not fetch AI usage:", err));

      // 2. Fetch isolated chat history for this workspace + diagram
      getAiHistory(effectiveWorkspaceId, effectiveDiagramId, token)
        .then((hist) => {
          if (hist.usage) setUsage(hist.usage);
          if (Array.isArray(hist.messages) && hist.messages.length > 0) {
            const mapped: ChatMessage[] = hist.messages.map((m) => {
              let compileErr: string | null = null;
              if (m.flow) {
                try {
                  compileDSL(m.flow);
                } catch (err: any) {
                  compileErr = err.message || "DSL syntax error";
                }
              }
              return {
                id: m.id,
                sender: m.role === "assistant" ? "assistant" : "user",
                text: m.message || m.explanation || "",
                mode: (m.mode as AIMode) || "modify",
                dsl: m.flow || undefined,
                compileError: compileErr,
                thoughtProcess: m.thought_process || undefined,
              };
            });
            setMessages(mapped);
          }
        })
        .catch((err) => console.warn("Could not load AI history:", err));
    }
  }, [isOpen, token, effectiveWorkspaceId, effectiveDiagramId]);

  // Auto-scroll messages to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isGenerating, isOpen]);

  // Focus input on drawer open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const hasUserChat = messages.length > 0;
  const isLimitReached = usage !== null && usage.remaining <= 0;

  // Curated Starter Questions for each of the 3 modes
  const starterQuestions = useMemo(() => {
    if (selectedNode) {
      const label = (selectedNode.data?.label as string) || selectedNode.id;
      return [
        {
          mode: "ask" as const,
          label: `How does request and data flow through ${label}?`,
          prompt: `Explain the exact role and data flow through ${label} in this architecture.`,
        },
        {
          mode: "analyze" as const,
          label: `Analyze failure dynamics & bottlenecks for ${label}`,
          prompt: `Analyze failure dynamics, capacity limits, and bottlenecks for ${label}.`,
        },
        {
          mode: "modify" as const,
          label: `Scale ${label} with redundant cluster & load balancer`,
          prompt: `Scale ${label} by placing a round-robin load balancer in front with redundant instances.`,
        },
        {
          mode: "modify" as const,
          label: `Attach an in-memory Redis cache to ${label}`,
          prompt: `Attach a Redis cache to ${label} implementing a high-throughput Cache-Aside pattern.`,
        },
      ];
    }

    return [
      {
        mode: "ask" as const,
        label: "What is a Load Balancer & how does caching work?",
        prompt: "Explain how load balancers and cache-aside layers interact in distributed systems.",
      },
      {
        mode: "analyze" as const,
        label: "Analyze canvas topology for bottlenecks & single points of failure",
        prompt: "Analyze the current canvas topology for bottlenecks, single points of failure, and unrouted components.",
      },
      {
        mode: "modify" as const,
        label: "Create a Round-Robin Load-Balanced Cluster",
        prompt: "Create a high availability round-robin load balanced cluster with multiple application servers.",
      },
      {
        mode: "modify" as const,
        label: "Build a Cache-Aside pattern with Redis & PostgreSQL",
        prompt: "Build a Cache-Aside pattern with Redis and PostgreSQL database fallback.",
      },
    ];
  }, [selectedNode]);

  if (!isOpen) return null;

  // Clear conversation in UI
  const handleClearChat = () => {
    setMessages([]);
  };

  // Quick action chip click
  const handleQuickAction = (actionPrompt: string, targetMode: AIMode) => {
    if (isSandbox) return;
    if (!isLoggedIn) {
      router.push("/signin");
      return;
    }
    setMode(targetMode);
    setInput(actionPrompt);
    setTimeout(() => {
      submitPrompt(actionPrompt, targetMode);
    }, 50);
  };

  // Submit prompt logic
  const submitPrompt = async (userPromptText?: string, forcedMode?: AIMode) => {
    if (isSandbox) return;
    if (!isLoggedIn || !token) {
      router.push("/signin");
      return;
    }

    const textToSubmit = (userPromptText ?? input).trim();
    if (!textToSubmit || isGenerating) return;

    if (isLimitReached) {
      return;
    }

    const currentMode = forcedMode ?? mode;
    const userMsgId = `usr-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: "user",
      text: textToSubmit,
      mode: currentMode,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsGenerating(true);

    // Current canvas DSL serialized as context
    const currentDsl = diagramToDsl(nodes, edges, nodeConfigs);

    try {
      const payload: AiChatPayload = {
        workspace_id: effectiveWorkspaceId,
        diagram_id: effectiveDiagramId,
        mode: currentMode,
        think: thinkEnabled,
        message: textToSubmit,
        context: {
          dsl: currentDsl,
          node_count: nodes.length,
          edge_count: edges.length,
          selected_node_id: selectedNode?.id || null,
        },
      };

      const res = await sendAiChat(payload, token);

      // Update authoritative usage limit from server
      if (res.usage) {
        setUsage(res.usage);
      }

      let effectiveMessage = res.message || res.explanation || "Response generated.";
      let effectiveFlow = res.flow && res.flow.trim().length > 0 ? res.flow : undefined;
      let effectiveThought = res.thought_process || undefined;
      let effectiveMode = (res.mode as AIMode) || currentMode;

      // Smart Safety Unpack: if flow wasn't extracted by server but message contains raw JSON
      if (!effectiveFlow && typeof effectiveMessage === "string" && effectiveMessage.includes('"flow"')) {
        try {
          const firstB = effectiveMessage.indexOf("{");
          const lastB = effectiveMessage.lastIndexOf("}");
          if (firstB !== -1 && lastB > firstB) {
            const parsed = JSON.parse(effectiveMessage.slice(firstB, lastB + 1));
            if (parsed.flow && typeof parsed.flow === "string" && parsed.flow.trim().length > 0) {
              effectiveFlow = parsed.flow;
            }
            if (parsed.message && typeof parsed.message === "string") {
              effectiveMessage = parsed.message;
            }
            if (parsed.thought_process && typeof parsed.thought_process === "string") {
              effectiveThought = parsed.thought_process;
            }
            if (parsed.mode) {
              effectiveMode = parsed.mode as AIMode;
            }
          }
        } catch (_) {}
      }

      // DSL validation via compileDSL (FlowFrame DSL Interpreter)
      let compileError: string | null = null;
      if (effectiveFlow && effectiveFlow.trim().length > 0) {
        // Auto-sanitize hyphens in node identifiers (e.g. client-1 -> client_1) while preserving -> connection arrows
        effectiveFlow = effectiveFlow.replace(/\b([a-zA-Z0-9_]+)-(?!>)([a-zA-Z0-9_]+)\b/g, "$1_$2");

        try {
          const compiled = compileDSL(effectiveFlow);
          if (!compiled.nodes || compiled.nodes.length === 0) {
            compileError = "No valid nodes parsed in generated DSL.";
          }
        } catch (err: any) {
          compileError = err.message || "DSL syntax error";
        }
      }

      // Format response
      const assistantMsg: ChatMessage = {
        id: `ast-${Date.now()}`,
        sender: "assistant",
        text: effectiveMessage,
        mode: effectiveMode,
        dsl: effectiveFlow,
        compileError,
        thoughtProcess: effectiveThought,
        thoughtTime: thinkEnabled ? "Gemini Flash" : undefined,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errMsg = err.message || "Failed to process AI request.";

      if (errMsg.includes("429") || errMsg.toLowerCase().includes("limit reached")) {
        setUsage((prev) => (prev ? { ...prev, remaining: 0, used: prev.limit } : { used: 5, limit: 5, remaining: 0 }));
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            sender: "assistant",
            text: "You have reached your limit of 5 free AI requests. Upgrade for unlimited AI architecture generation, analysis, and modifications.",
            mode: currentMode,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            sender: "assistant",
            text: `AI Request Error: ${errMsg}`,
            mode: currentMode,
          },
        ]);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Explicit User Action: Apply Changes to Canvas
  const handleApplyArchitecture = (msgId: string, dsl: string, explanation: string) => {
    onApplyDsl(dsl, explanation);
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, applied: true, rejected: false } : m))
    );
  };

  // Explicit User Action: Reject Proposed Changes
  const handleRejectArchitecture = (msgId: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, rejected: true, applied: false } : m))
    );
  };

  const handleCopyDsl = (msgId: string, dsl: string) => {
    navigator.clipboard.writeText(dsl);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper to parse inline markdown: **bold**, `code`, *italic*, [link](url)
  const parseInlineMarkdown = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    const pattern = /(\*\*(.*?)\*\*|`(.*?)`|\*(.*?)\*|\[([^\]]+)\]\(([^)]+)\))/g;
    let match: RegExpExecArray | null;
    let lastIndex = 0;
    let key = 0;

    while ((match = pattern.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }

      const fullMatch = match[1];
      if (fullMatch.startsWith("**")) {
        parts.push(
          <strong key={`b-${key++}`} className="font-semibold text-foreground">
            {match[2]}
          </strong>
        );
      } else if (fullMatch.startsWith("`")) {
        parts.push(
          <code
            key={`c-${key++}`}
            className="px-1 py-0.5 rounded bg-muted/70 text-primary border border-border/50 font-mono text-[10.5px]"
          >
            {match[3]}
          </code>
        );
      } else if (fullMatch.startsWith("*")) {
        parts.push(
          <em key={`i-${key++}`} className="italic text-foreground/90">
            {match[4]}
          </em>
        );
      } else if (fullMatch.startsWith("[")) {
        const isExternal = match[6].startsWith("http");
        parts.push(
          <a
            key={`a-${key++}`}
            href={match[6]}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
            className="text-primary hover:underline font-medium"
          >
            {match[5]}
          </a>
        );
      }

      lastIndex = pattern.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  // Block-level Markdown Renderer (Headings, Tables, Lists, Blockquotes, Dividers)
  const renderMarkdownBlocks = (markdown: string, blockKeyPrefix: string): React.ReactNode => {
    const lines = markdown.split("\n");
    const elements: React.ReactNode[] = [];
    let i = 0;
    let elemKey = 0;

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      // 1. Table Detection
      if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
        const tableLines: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
          tableLines.push(lines[i].trim());
          i++;
        }

        if (tableLines.length >= 1) {
          const headerLine = tableLines[0];
          const hasSeparator = tableLines.length > 1 && tableLines[1].replace(/[-|:\s]/g, "") === "";
          const rowLines = hasSeparator ? tableLines.slice(2) : tableLines.slice(1);

          const parseRow = (r: string) =>
            r
              .slice(1, -1)
              .split("|")
              .map((c) => c.trim());

          const headers = parseRow(headerLine);

          elements.push(
            <div
              key={`${blockKeyPrefix}-tbl-${elemKey++}`}
              className="overflow-x-auto my-2 rounded-lg border border-border/70 bg-card/40 shadow-2xs"
            >
              <table className="w-full text-[11px] text-left border-collapse">
                <thead className="bg-muted/50 text-foreground font-mono font-bold uppercase tracking-wider text-[10px] border-b border-border/70">
                  <tr>
                    {headers.map((h, hi) => (
                      <th
                        key={hi}
                        className="px-2.5 py-1.5 border-r border-border/40 last:border-r-0 whitespace-nowrap"
                      >
                        {parseInlineMarkdown(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-sans">
                  {rowLines.map((rowText, ri) => {
                    const cells = parseRow(rowText);
                    return (
                      <tr key={ri} className="hover:bg-muted/20 transition-colors">
                        {cells.map((cell, ci) => (
                          <td
                            key={ci}
                            className="px-2.5 py-1.5 border-r border-border/30 last:border-r-0 text-foreground/85 leading-snug"
                          >
                            {parseInlineMarkdown(cell)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
          continue;
        }
      }

      // 2. Headings
      if (trimmed.startsWith("### ")) {
        elements.push(
          <h3
            key={`${blockKeyPrefix}-h3-${elemKey++}`}
            className="text-[11.5px] font-bold text-primary mt-2.5 mb-1 flex items-center gap-1.5 font-mono"
          >
            {parseInlineMarkdown(trimmed.slice(4))}
          </h3>
        );
        i++;
        continue;
      }
      if (trimmed.startsWith("## ")) {
        elements.push(
          <h2
            key={`${blockKeyPrefix}-h2-${elemKey++}`}
            className="text-xs font-bold text-foreground mt-3 mb-1 pb-1 border-b border-border/40 uppercase tracking-wide font-mono"
          >
            {parseInlineMarkdown(trimmed.slice(3))}
          </h2>
        );
        i++;
        continue;
      }
      if (trimmed.startsWith("# ")) {
        elements.push(
          <h1
            key={`${blockKeyPrefix}-h1-${elemKey++}`}
            className="text-sm font-bold text-foreground mt-3 mb-1.5 pb-1 border-b border-border/50 font-sans"
          >
            {parseInlineMarkdown(trimmed.slice(2))}
          </h1>
        );
        i++;
        continue;
      }
      if (trimmed.startsWith("#### ")) {
        elements.push(
          <h4
            key={`${blockKeyPrefix}-h4-${elemKey++}`}
            className="text-[11px] font-semibold text-foreground/90 mt-2 mb-0.5 font-sans"
          >
            {parseInlineMarkdown(trimmed.slice(5))}
          </h4>
        );
        i++;
        continue;
      }

      // 3. Blockquotes
      if (trimmed.startsWith("> ")) {
        elements.push(
          <blockquote
            key={`${blockKeyPrefix}-bq-${elemKey++}`}
            className="border-l-2 border-primary/70 bg-primary/5 pl-2.5 py-1 my-1.5 rounded-r text-[11.5px] text-muted-foreground italic leading-relaxed"
          >
            {parseInlineMarkdown(trimmed.slice(2))}
          </blockquote>
        );
        i++;
        continue;
      }

      // 4. Horizontal Dividers
      if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
        elements.push(
          <hr key={`${blockKeyPrefix}-hr-${elemKey++}`} className="my-2.5 border-border/60" />
        );
        i++;
        continue;
      }

      // 5. Unordered Lists (- or *)
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        elements.push(
          <li
            key={`${blockKeyPrefix}-li-${elemKey++}`}
            className="ml-4 list-disc text-xs text-foreground/85 leading-relaxed my-0.5"
          >
            {parseInlineMarkdown(trimmed.slice(2))}
          </li>
        );
        i++;
        continue;
      }

      // 6. Numbered Lists (1. 2. etc)
      const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
      if (numMatch) {
        elements.push(
          <li
            key={`${blockKeyPrefix}-oli-${elemKey++}`}
            className="ml-4 list-decimal text-xs text-foreground/85 leading-relaxed my-0.5"
          >
            {parseInlineMarkdown(numMatch[2])}
          </li>
        );
        i++;
        continue;
      }

      // 7. Empty line
      if (trimmed === "") {
        elements.push(<div key={`${blockKeyPrefix}-gap-${elemKey++}`} className="h-1" />);
        i++;
        continue;
      }

      // 8. Normal Paragraph
      elements.push(
        <p
          key={`${blockKeyPrefix}-p-${elemKey++}`}
          className="text-xs text-foreground/90 leading-relaxed font-sans my-1"
        >
          {parseInlineMarkdown(line)}
        </p>
      );
      i++;
    }

    return elements;
  };

  // Helper to render markdown text and embed FlowFrameCodeEditor for any code blocks
  const renderMessageBody = (text: string, msgId: string) => {
    if (!text.includes("```")) {
      return (
        <div className="space-y-0.5 text-xs text-foreground">
          {renderMarkdownBlocks(text, msgId)}
        </div>
      );
    }

    const segments: React.ReactNode[] = [];
    const codeRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    let lastPos = 0;
    let match: RegExpExecArray | null;

    while ((match = codeRegex.exec(text)) !== null) {
      const precedingText = text.slice(lastPos, match.index);
      if (precedingText.trim()) {
        segments.push(
          <div key={`txt-${lastPos}`} className="space-y-0.5">
            {renderMarkdownBlocks(precedingText, `${msgId}-pre-${lastPos}`)}
          </div>
        );
      }

      const lang = match[1]?.trim() || "dsl";
      const codeSnippet = match[2]?.trim() || "";
      const snippetId = `${msgId}-snippet-${match.index}`;
      const isDsl =
        lang === "dsl" ||
        lang === "flow" ||
        codeSnippet.includes("define ") ||
        codeSnippet.includes("connect ");

      segments.push(
        <div
          key={`code-${match.index}`}
          className="rounded-xl border border-[var(--border)] bg-[#121215] overflow-hidden my-2.5 shadow-md text-left"
        >
          <div className="px-3 py-1.5 border-b border-[var(--border)] bg-[#18181b] flex items-center justify-between text-[10.5px] font-mono text-muted-foreground">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <FiCode className="size-3.5 text-primary" />
              <span>{isDsl ? "FlowFrame DSL" : lang.toUpperCase()}</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono font-semibold uppercase">
                {lang || "dsl"}
              </span>
              <button
                type="button"
                onClick={() => handleCopyDsl(snippetId, codeSnippet)}
                className="text-xs hover:text-foreground text-muted-foreground transition cursor-pointer flex items-center gap-1"
                title="Copy snippet"
              >
                <FiCopy className="size-3" />
                <span>{copiedId === snippetId ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>

          <div className="overflow-hidden">
            <FlowFrameCodeEditor
              value={codeSnippet}
              readOnly={true}
              fontSize={12}
              minHeight="auto"
              maxHeight="220px"
              theme="dark"
            />
          </div>

          {isDsl && (
            <div className="p-1.5 border-t border-[var(--border)] bg-[#18181b] flex justify-end">
              <button
                type="button"
                onClick={() =>
                  handleApplyArchitecture(
                    snippetId,
                    codeSnippet,
                    "Code snippet applied to canvas"
                  )
                }
                className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-1 cursor-pointer transition shadow-2xs"
              >
                <FiCheck className="size-3" />
                <span>Apply to Canvas</span>
              </button>
            </div>
          )}
        </div>
      );

      lastPos = match.index + match[0].length;
    }

    const trailingText = text.slice(lastPos);
    if (trailingText.trim()) {
      segments.push(
        <div key={`txt-${lastPos}`} className="space-y-0.5">
          {renderMarkdownBlocks(trailingText, `${msgId}-post-${lastPos}`)}
        </div>
      );
    }

    return <div className="space-y-1">{segments}</div>;
  };

  return (
    <aside
      className={`fixed inset-y-0 right-0 z-50 w-full transition-all duration-200 ${
        isExpanded
          ? "sm:w-[560px] md:w-[620px] lg:w-[680px]"
          : "sm:w-[390px] md:w-[380px] lg:w-[410px]"
      } md:static md:z-20 md:h-full md:max-h-full bg-[var(--surface)] border-l border-[var(--border)] flex flex-col shrink-0 select-text overflow-hidden shadow-xl md:shadow-none`}
      data-testid="relay-assistant-panel"
      aria-label="Relay Architecture Assistant"
    >
      {/* ── Mobile Top Quick Navigation Bar (Explicit Back to Canvas for mobile screens) ── */}
      <div className="md:hidden flex items-center justify-between px-3.5 py-2.5 bg-[var(--bg-elevated)] border-b border-[var(--border)] shrink-0 select-none shadow-xs">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/15 hover:bg-primary/25 text-primary border border-primary/30 text-xs font-semibold transition cursor-pointer active:scale-95 shadow-2xs"
          aria-label="Back to Canvas"
        >
          <FiChevronLeft className="size-4" />
          <span>Back to Canvas</span>
        </button>

        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-[var(--bg)] border border-[var(--border)] transition cursor-pointer active:scale-95 text-xs font-medium"
          title="Close Assistant"
          aria-label="Close Assistant"
        >
          <FiX className="size-4 text-rose-400" />
          <span>Close</span>
        </button>
      </div>

      {/* ── 1. Top Header with Active Relay Indicator & Credit Pill ── */}
      <div className="h-14 px-3.5 border-b border-[var(--border)] flex items-center justify-between shrink-0 bg-[var(--surface)]">
        <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
          <div className="relative size-8 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shrink-0 shadow-2xs">
            <Sparkles className="size-4" />
            <span
              className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-blue-500 border-2 border-[var(--surface)]"
              title="Relay AI Online"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-foreground tracking-tight truncate">
                Relay AI
              </span>
              {selectedNode && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20 truncate max-w-[90px]">
                  {(selectedNode.data?.label as string) || selectedNode.id}
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground truncate leading-tight hidden xs:block sm:block">
              Architecture Copilot · 3 Modes
            </p>
          </div>
        </div>

        {/* Top Right Controls & Usage Credit Badge */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {isSandbox ? (
            <div
              className="flex items-center gap-1.5 px-2.5 py-0.5 text-amber-400 text-[10.5px] font-mono font-medium select-none"
              title="Relay AI is locked in public Sandbox. Switch to a Dashboard Workspace."
            >
              {/* <FiLock className="size-3" />
              <span>Sandbox (Locked)</span> */}
            </div>
          ) : !isLoggedIn ? (
            <Link
              href="/signin"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[10.5px] font-mono font-medium transition cursor-pointer"
              title="Sign in to unlock Relay AI"
            >
              <FiLock className="size-3" />
              <span>Sign In</span>
            </Link>
          ) : (
            /* AI Usage Badge: AI: X/5 */
            <div
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10.5px] font-mono font-medium transition select-none ${
                isLimitReached
                  ? "border-red-500/40 bg-red-500/10 text-red-400"
                  : "border-primary/30 bg-primary/10 text-primary"
              }`}
              title={
                usage
                  ? `${usage.remaining} of ${usage.limit} free requests remaining`
                  : "5 free requests per user"
              }
            >
              <FiZap className="size-3" />
              <span>AI: {usage ? `${usage.used}/${usage.limit}` : "0/5"}</span>
            </div>
          )}

          {messages.length > 0 && (
            <button
              type="button"
              onClick={handleClearChat}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-[var(--bg-elevated)] transition cursor-pointer"
              title="Clear conversation"
              aria-label="Clear conversation"
            >
              <FiTrash2 className="size-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="hidden md:flex p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-[var(--bg-elevated)] transition cursor-pointer"
            title={isExpanded ? "Collapse width" : "Expand width"}
            aria-label={isExpanded ? "Collapse width" : "Expand width"}
          >
            {isExpanded ? (
              <FiMinimize2 className="size-3.5" />
            ) : (
              <FiMaximize2 className="size-3.5" />
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1 p-1.5 sm:px-2 sm:py-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-[var(--bg-elevated)] transition cursor-pointer border border-transparent hover:border-[var(--border)]"
            title="Close Assistant (Esc)"
            aria-label="Close Assistant"
          >
            <FiX className="size-4 text-foreground" />
            <span className="text-xs font-semibold sm:hidden">Close</span>
          </button>
        </div>
      </div>

      {/* ── 2. Conversation Stream & Main Body Suggestions ── */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin">
        {isSandbox ? (
          /* ── Sandbox Lock Banner Screen ── */
          <div className="max-w-md mx-auto py-6 sm:py-8 space-y-5 animate-in fade-in duration-200 text-center select-none">
            <div className="size-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 shadow-sm">
              <FiLock className="size-7" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10.5px] font-mono font-semibold uppercase tracking-wider">
                Sandbox Playground
              </div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
                Relay AI Copilot is Locked in Sandbox
              </h2>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                Yeh public sandbox environment hai. Relay AI context-based architecture generation aur simulation engine keval authenticated <strong>Dashboard Workspaces</strong> ke sath chalta hai.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-left space-y-2 text-xs text-muted-foreground">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <FiZap className="size-3.5 text-amber-400" />
                <span>Dashboard Workspace Features:</span>
              </div>
              <ul className="space-y-1.5 list-disc list-inside text-[11.5px] leading-relaxed">
                <li>Cloud-saved topologies and architecture versions</li>
                <li>5 free Relay AI credits per user account</li>
                <li>Deep Reasoning (Think mode) and 1-click DSL canvas deployment</li>
              </ul>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
              >
                <span>Go to Dashboard</span>
                <FiArrowRight className="size-3.5" />
              </Link>
              {!isLoggedIn && (
                <Link
                  href="/signin"
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[var(--border)] hover:bg-[var(--bg-elevated)] text-foreground text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <FiLock className="size-3" />
                  <span>Sign In</span>
                </Link>
              )}
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[var(--border)] hover:bg-[var(--bg-elevated)] text-muted-foreground hover:text-foreground text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <FiChevronLeft className="size-3.5" />
                <span>Back to Canvas</span>
              </button>
            </div>
          </div>
        ) : !hasUserChat ? (
          <div className="max-w-md mx-auto py-3 space-y-5 animate-in fade-in duration-200">
            <div className="text-center space-y-1.5 select-none">
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
                Ask Relay about your Architecture
              </h2>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                Ask technical questions, analyze failure dynamics, or propose live FlowFrame DSL topologies.
              </p>
            </div>

            {/* Curated 3-Mode Starter Cards */}
            <div className="space-y-2.5">
              {starterQuestions.map((q) => {
                const badgeLabel =
                  q.mode === "ask"
                    ? "Ask"
                    : q.mode === "analyze"
                    ? "Analyze"
                    : "Create / Modify";

                return (
                  <button
                    type="button"
                    key={q.prompt}
                    disabled={isGenerating || isLimitReached}
                    onClick={() => handleQuickAction(q.prompt, q.mode)}
                    className="w-full p-3 px-3.5 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)]/70 hover:bg-[var(--bg-elevated)] hover:border-primary/50 text-left flex items-center justify-between gap-3 group transition-all cursor-pointer shadow-2xs hover:shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9.5px] uppercase font-mono font-bold tracking-wide px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                          {badgeLabel}
                        </span>
                        {!isLoggedIn && (
                          <span className="text-[9.5px] font-mono text-amber-400 flex items-center gap-1">
                            <FiLock className="size-2.5" />
                            <span>Sign in required</span>
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors leading-snug block truncate">
                        {q.label}
                      </span>
                    </div>
                    {isLoggedIn ? (
                      <FiArrowRight className="size-4 text-muted-foreground/60 group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
                    ) : (
                      <FiLock className="size-3.5 text-amber-400/80 group-hover:text-amber-400 transition-all shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Message Turns */}
        {messages.map((m) => (
          <div key={m.id} className="space-y-1.5">
            {m.sender === "user" ? (
              /* User Turn */
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground select-none">
                  <span className="size-1.5 rounded-full bg-muted-foreground/60" />
                  <span>You</span>
                  {m.mode && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-muted/40 text-muted-foreground font-normal">
                      {m.mode === "modify"
                        ? "CREATE / MODIFY"
                        : m.mode.toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="text-xs text-foreground font-normal leading-relaxed pl-2.5 border-l-2 border-border/80 whitespace-pre-wrap">
                  {m.text}
                </div>
              </div>
            ) : (
              /* Assistant Turn */
              <div className="space-y-2 pt-2 border-t border-[var(--border)]/50">
                <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider text-primary select-none">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="size-3 text-primary" />
                    <span>Relay</span>
                    {m.mode && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-primary/10 text-primary font-normal">
                        {m.mode === "modify"
                          ? "PROPOSED TOPOLOGY"
                          : m.mode.toUpperCase()}
                      </span>
                    )}
                  </div>
                  {m.thoughtTime && (
                    <span className="text-muted-foreground/70 lowercase font-normal">
                      reasoned with {m.thoughtTime}
                    </span>
                  )}
                </div>

                {/* Collapsible Extended Reasoning / Thinking Process */}
                {m.thoughtProcess && (
                  <details className="rounded border border-[var(--border)] bg-[var(--bg-elevated)]/50 text-[11px] font-mono group overflow-hidden">
                    <summary className="px-2.5 py-1.5 cursor-pointer text-foreground/80 font-semibold flex items-center justify-between select-none hover:bg-[var(--bg-elevated)] transition">
                      <span className="flex items-center gap-1.5">
                        <FiCpu className="size-3 text-primary animate-pulse" />
                        <span>Architectural Reasoning Trace</span>
                      </span>
                      <span className="text-[9px] opacity-70 group-open:rotate-180 transition-transform">
                        ▼
                      </span>
                    </summary>
                    <div className="px-3 py-2 text-muted-foreground border-t border-[var(--border)]/60 whitespace-pre-wrap leading-relaxed text-[10.5px]">
                      {m.thoughtProcess}
                    </div>
                  </details>
                )}

                {/* Response Text */}
                <div className="text-xs text-foreground leading-relaxed pl-2.5 border-l-2 border-primary/40 space-y-2">
                  {renderMessageBody(m.text, m.id)}

                  {/* Canvas Protection: Proposed FlowFrame DSL Preview */}
                  {m.dsl && (
                    <div className="rounded-xl border border-[var(--border)] bg-[#121215] overflow-hidden my-2.5 shadow-md">
                      {/* Card Header with DSL validation indicator */}
                      <div className="px-3 py-1.5 border-b border-[var(--border)] bg-[#18181b] flex items-center justify-between text-[10.5px] font-mono text-muted-foreground">
                        <span className="font-semibold text-foreground flex items-center gap-1.5">
                          <FiCode className="size-3.5 text-primary" />
                          <span>Proposed Architecture DSL</span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          {m.compileError ? (
                            <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 font-mono font-semibold flex items-center gap-1">
                              <FiAlertTriangle className="size-2.5" />
                              <span>Syntax Warning</span>
                            </span>
                          ) : (
                            <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-mono font-semibold flex items-center gap-1">
                              <FiCheckCircle className="size-2.5" />
                              <span>DSL Validated</span>
                            </span>
                          )}
                          <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono font-semibold uppercase">
                            DSL
                          </span>
                        </div>
                      </div>

                      {/* Compilation Error Notice if any */}
                      {m.compileError && (
                        <div className="p-2 bg-amber-500/10 border-b border-amber-500/20 text-[10.5px] font-mono text-amber-400">
                          {m.compileError}
                        </div>
                      )}

                      {/* CodeMirror 6 with FlowFrame DSL Syntax Highlighting */}
                      <div className="overflow-hidden">
                        <FlowFrameCodeEditor
                          value={m.dsl}
                          readOnly={true}
                          fontSize={12}
                          minHeight="auto"
                          maxHeight="250px"
                          theme="dark"
                        />
                      </div>

                      {/* Canvas Protection Action Bar: Explicit Apply or Reject */}
                      <div className="p-2 border-t border-[var(--border)] bg-[#18181b] flex items-center gap-2 justify-between flex-wrap">
                        <div className="text-[10px] font-mono text-muted-foreground">
                          {m.applied ? (
                            <span className="text-emerald-400 font-medium flex items-center gap-1">
                              <FiCheck className="size-3" />
                              Applied to Canvas
                            </span>
                          ) : m.rejected ? (
                            <span className="text-muted-foreground flex items-center gap-1">
                              <FiX className="size-3" />
                              Proposed changes dismissed
                            </span>
                          ) : (
                            <span className="text-muted-foreground/75">
                              Canvas is protected until applied
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopyDsl(m.id, m.dsl!)}
                            className="px-2.5 py-1 rounded text-[11px] font-mono font-medium border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-muted)] text-foreground flex items-center gap-1 cursor-pointer transition"
                            title="Copy DSL Code"
                          >
                            <FiCopy className="size-3" />
                            <span>{copiedId === m.id ? "Copied" : "Copy"}</span>
                          </button>

                          {!m.applied && !m.rejected && (
                            <button
                              type="button"
                              onClick={() => handleRejectArchitecture(m.id)}
                              className="px-2.5 py-1 rounded text-[11px] font-medium border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-muted)] text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer transition"
                              title="Dismiss proposed changes without touching canvas"
                            >
                              <FiX className="size-3" />
                              <span>Reject</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              handleApplyArchitecture(
                                m.id,
                                m.dsl!,
                                m.text || "AI Architecture applied to canvas"
                              )
                            }
                            className={`px-3 py-1 rounded text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition shadow-2xs ${
                              m.applied
                                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium"
                                : "bg-primary text-primary-foreground hover:bg-primary/90"
                            }`}
                          >
                            <FiCheck className="size-3.5" />
                            <span>{m.applied ? "Applied" : "Apply Changes"}</span>
                          </button>

                          {onRunSimulation && (
                            <button
                              type="button"
                              onClick={() => {
                                if (!m.applied) {
                                  handleApplyArchitecture(
                                    m.id,
                                    m.dsl!,
                                    m.text || "AI Architecture applied to canvas"
                                  );
                                }
                                setTimeout(() => onRunSimulation(), 250);
                              }}
                              className="px-2.5 py-1 rounded text-[11px] font-medium border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-muted)] text-foreground flex items-center gap-1.5 cursor-pointer transition"
                              title="Run Simulation on Canvas"
                            >
                              <FiPlay className="size-3 text-primary fill-current" />
                              <span>Run</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* AI Generating Indicator */}
        {isGenerating && (
          <div className="pt-2 border-t border-[var(--border)]/50 space-y-1.5 animate-in fade-in duration-150 select-none">
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-primary">
              <Sparkles className="size-3 animate-pulse text-primary" />
              <span>Relay AI</span>
            </div>
            <div className="flex items-center gap-2.5 pl-2.5 text-xs text-muted-foreground font-mono">
              <div className="flex items-center justify-center size-3.5 shrink-0">
                <span className="size-2 rounded-full bg-primary animate-chatgpt-pulse shrink-0" />
              </div>
              <span>
                {mode === "modify"
                  ? "Synthesizing FlowFrame DSL architecture…"
                  : mode === "analyze"
                  ? "Analyzing topology for bottlenecks & failures…"
                  : "Formulating technical architecture response…"}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── 3. Bottom Composer with Exactly Three Modes ── */}
      <div className="p-2.5 border-t border-[var(--border)] bg-[var(--surface)] shrink-0 space-y-2">
        {/* Exactly 3 Modes: ASK, ANALYZE, CREATE / MODIFY */}
        <div className="flex items-center justify-between gap-1.5 select-none">
          <div className="flex items-center p-0.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] text-[11px]">
            <button
              type="button"
              disabled={isGenerating}
              onClick={() => setMode("ask")}
              className={`px-3 py-1 rounded-md text-[11px] font-medium transition cursor-pointer flex items-center gap-1.5 ${
                mode === "ask"
                  ? "bg-primary/10 text-primary border border-primary/30 font-semibold shadow-2xs"
                  : "text-muted-foreground hover:text-foreground border border-transparent"
              }`}
              title="Ask technical questions (Canvas will never mutate)"
            >
              <FiHelpCircle className="size-3" />
              <span>Ask</span>
            </button>

            <button
              type="button"
              disabled={isGenerating}
              onClick={() => setMode("analyze")}
              className={`px-3 py-1 rounded-md text-[11px] font-medium transition cursor-pointer flex items-center gap-1.5 ${
                mode === "analyze"
                  ? "bg-primary/10 text-primary border border-primary/30 font-semibold shadow-2xs"
                  : "text-muted-foreground hover:text-foreground border border-transparent"
              }`}
              title="Analyze bottlenecks & topology (Canvas will never mutate)"
            >
              <FiSearch className="size-3" />
              <span>Analyze</span>
            </button>

            <button
              type="button"
              disabled={isGenerating}
              onClick={() => setMode("modify")}
              className={`px-3 py-1 rounded-md text-[11px] font-medium transition cursor-pointer flex items-center gap-1.5 ${
                mode === "modify"
                  ? "bg-primary/10 text-primary border border-primary/30 font-semibold shadow-2xs"
                  : "text-muted-foreground hover:text-foreground border border-transparent"
              }`}
              title="Create or modify topologies with explicit preview"
            >
              <FiLayers className="size-3" />
              <span>Create / Modify</span>
            </button>
          </div>
        </div>

        {/* If in sandbox: display locked card */}
        {isSandbox ? (
          <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-center space-y-2 select-none animate-in fade-in duration-200">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-400">
              <FiLock className="size-3.5" />
              <span>Sandbox Mode — Relay AI Disabled</span>
            </div>
            <p className="text-[11.5px] text-muted-foreground leading-relaxed max-w-sm mx-auto">
              Sandbox playground par AI generation allowed nahi hai. Cloud workspace open karein to generate or modify architectures.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xs transition-all cursor-pointer"
            >
              <span>Open Dashboard Workspace</span>
              <FiArrowRight className="size-3" />
            </Link>
          </div>
        ) : !isLoggedIn ? (
          <div className="p-4 rounded-2xl border border-primary/20 bg-gradient-to-b from-primary/10 via-[var(--bg-elevated)] to-[var(--surface)] text-center space-y-2.5 shadow-md select-none animate-in fade-in duration-200">
            <div className="size-9 mx-auto rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shadow-2xs">
              <FiLock className="size-4" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs sm:text-sm font-bold text-foreground">
                Sign in to Prompt Relay AI
              </h4>
              <p className="text-[11px] text-muted-foreground max-w-xs mx-auto leading-relaxed">
                Only logged in users can prompt the Relay Architecture Assistant. Sign in to access your 5 free AI requests.
              </p>
            </div>
            <Link
              href="/signin"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xs transition-all cursor-pointer"
            >
              <span>Sign In to Continue</span>
              <FiArrowRight className="size-3.5" />
            </Link>
          </div>
        ) : (
          <>
            {/* Limit Warning Banner if exhausted */}
            {isLimitReached && (
              <div className="p-2 rounded-xl border border-red-500/30 bg-red-500/10 text-[11px] text-red-400 flex items-center justify-between select-none">
                <span className="flex items-center gap-1.5 font-medium">
                  <FiAlertTriangle className="size-3.5 shrink-0" />
                  <span>Free AI limit reached (5/5). Upgrade for unlimited requests.</span>
                </span>
              </div>
            )}

            {/* Input Textarea Form */}
            <div className="relative rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/20 transition-all p-2.5 space-y-1.5 shadow-2xs">
              <textarea
                ref={textareaRef}
                rows={2}
                disabled={isGenerating || isLimitReached}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (!isGenerating && input.trim() && !isLimitReached) {
                      submitPrompt();
                    }
                  }
                }}
                placeholder={
                  isLimitReached
                    ? "5 free requests used. Upgrade your plan for unlimited AI."
                    : isGenerating
                    ? "Processing architecture request…"
                    : mode === "modify"
                    ? selectedNode
                      ? `Modify ${(selectedNode.data?.label as string) || selectedNode.id} or attach components…`
                      : "Describe topology to generate (e.g. Add Redis cache between server and postgres)…"
                    : mode === "analyze"
                    ? selectedNode
                      ? `Analyze failure impact or scaling bottlenecks for ${(selectedNode.data?.label as string) || selectedNode.id}…`
                      : "Ask Relay to analyze bottlenecks, single points of failure, or unrouted nodes…"
                    : selectedNode
                    ? `Ask Relay about ${(selectedNode.data?.label as string) || selectedNode.id}…`
                    : "Ask Relay about distributed architecture concepts, protocols, or flow…"
                }
                className="w-full bg-transparent resize-none text-xs sm:text-[13px] text-foreground placeholder:text-muted-foreground/55 focus:outline-none leading-relaxed max-h-32 px-1 disabled:opacity-50"
              />

              <div className="flex items-center justify-between gap-2 pt-1 border-t border-[var(--border)]/40 text-[10.5px] font-mono text-muted-foreground select-none">
                <span className="truncate text-muted-foreground/50 text-[10px]">
                  {isLimitReached
                    ? "AI requests paused"
                    : "Enter to send · Shift+Enter newline"}
                </span>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Think Toggle */}
                  <button
                    type="button"
                    onClick={() => setThinkEnabled(!thinkEnabled)}
                    className={`px-2 py-0.5 rounded-lg border font-mono text-[10px] font-medium transition cursor-pointer flex items-center gap-1 select-none ${
                      thinkEnabled
                        ? "bg-primary/10 border-primary/30 text-primary font-semibold shadow-2xs ring-1 ring-primary/20"
                        : "bg-transparent border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
                    }`}
                    title={
                      thinkEnabled
                        ? "Deep Architectural Reasoning: ON"
                        : "Deep Architectural Reasoning: OFF"
                    }
                  >
                    <FiCpu
                      className={`size-3 ${
                        thinkEnabled ? "text-primary animate-pulse" : "text-muted-foreground"
                      }`}
                    />
                    <span>Think</span>
                    <span
                      className={`size-1 rounded-full ${
                        thinkEnabled ? "bg-primary" : "bg-muted-foreground/50"
                      }`}
                    />
                  </button>

                  {/* Send Button */}
                  <button
                    type="button"
                    disabled={!input.trim() || isGenerating || isLimitReached}
                    onClick={() => submitPrompt()}
                    className="size-7 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center cursor-pointer shadow-xs disabled:opacity-30 disabled:cursor-not-allowed transition-all shrink-0 font-bold"
                    title="Send message"
                    aria-label="Send message"
                  >
                    {isGenerating ? (
                      <div className="size-3.5 rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground animate-spin" />
                    ) : (
                      <FiSend className="size-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground/60 text-center select-none pt-0.5">
              AI can make mistakes. Verify important details in canvas topology before applying.
            </p>
          </>
        )}
      </div>
    </aside>
  );
}
