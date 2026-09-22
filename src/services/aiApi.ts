import { handleApiResponse } from "@/services/authApi";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export interface AiDiagramContext {
  dsl?: string;
  node_count?: number;
  edge_count?: number;
  selected_node_id?: string | null;
}

export interface AiChatPayload {
  workspace_id: string;
  diagram_id: string;
  mode: "ask" | "analyze" | "modify";
  think?: boolean;
  message: string;
  context?: AiDiagramContext;
}

export interface AiUsageDTO {
  used: number;
  limit: number;
  remaining: number;
}

export interface AiChatResponseDTO {
  mode: "ask" | "analyze" | "modify";
  status: "success" | "error";
  message: string;
  flow?: string | null;
  explanation?: string | null;
  thought_process?: string | null;
  usage: AiUsageDTO;
}

export interface AiHistoryItemDTO {
  id: string;
  role: "user" | "assistant";
  mode: "ask" | "analyze" | "modify";
  message: string;
  flow?: string | null;
  explanation?: string | null;
  thought_process?: string | null;
  created_at: string;
}

export interface AiHistoryResponseDTO {
  messages: AiHistoryItemDTO[];
  usage: AiUsageDTO;
}

/**
 * Send an AI chat request to the Rust backend
 */
export async function sendAiChat(
  payload: AiChatPayload,
  token: string
): Promise<AiChatResponseDTO> {
  const res = await fetch(`${API_BASE_URL}/api/ai/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  return handleApiResponse<AiChatResponseDTO>(
    res,
    `AI request failed with status: ${res.status}`
  );
}

/**
 * Fetch authoritative user AI usage limit from the Rust backend
 */
export async function getAiUsage(token: string): Promise<AiUsageDTO> {
  const res = await fetch(`${API_BASE_URL}/api/ai/usage`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  return handleApiResponse<AiUsageDTO>(
    res,
    `Failed to fetch AI usage: ${res.status}`
  );
}

/**
 * Fetch isolated conversation history for a specific workspace and diagram
 */
export async function getAiHistory(
  workspaceId: string,
  diagramId: string,
  token: string
): Promise<AiHistoryResponseDTO> {
  const params = new URLSearchParams({
    workspace_id: workspaceId,
    diagram_id: diagramId,
  });

  const res = await fetch(`${API_BASE_URL}/api/ai/history?${params.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  return handleApiResponse<AiHistoryResponseDTO>(
    res,
    `Failed to fetch AI history: ${res.status}`
  );
}
