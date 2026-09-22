import { handleApiResponse } from "@/services/authApi";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export interface WorkspaceDTO {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  env: "DEV" | "PROD" | "STAGING";
  color?: string;
  icon_type?: string;
  diagrams_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateWorkspacePayload {
  name: string;
  description?: string;
  env?: "DEV" | "PROD" | "STAGING";
  color?: string;
  icon_type?: string;
}

export interface UpdateWorkspacePayload {
  name?: string;
  description?: string;
  env?: "DEV" | "PROD" | "STAGING";
  color?: string;
  icon_type?: string;
}

export async function getUserWorkspaces(token: string): Promise<WorkspaceDTO[]> {
  const res = await fetch(`${API_BASE_URL}/api/workspaces`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  return handleApiResponse<WorkspaceDTO[]>(res, "Failed to fetch workspaces");
}

export async function getWorkspaceById(workspaceId: string, token: string): Promise<WorkspaceDTO> {
  const res = await fetch(`${API_BASE_URL}/api/workspaces/${workspaceId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  return handleApiResponse<WorkspaceDTO>(res, "Failed to fetch workspace details");
}

export async function createWorkspace(
  payload: CreateWorkspacePayload,
  token: string
): Promise<WorkspaceDTO> {
  const res = await fetch(`${API_BASE_URL}/api/workspaces`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  return handleApiResponse<WorkspaceDTO>(res, "Failed to create workspace");
}

export async function updateWorkspace(
  workspaceId: string,
  payload: UpdateWorkspacePayload,
  token: string
): Promise<WorkspaceDTO> {
  const res = await fetch(`${API_BASE_URL}/api/workspaces/${workspaceId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  return handleApiResponse<WorkspaceDTO>(res, "Failed to update workspace");
}

export async function deleteWorkspace(workspaceId: string, token: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/workspaces/${workspaceId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  await handleApiResponse<any>(res, "Failed to delete workspace");
}
