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

export async function getUserWorkspaces(token: string): Promise<WorkspaceDTO[]> {
  const res = await fetch(`${API_BASE_URL}/api/workspaces`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch workspaces");
  }

  return res.json();
}

export async function getWorkspaceById(workspaceId: string, token: string): Promise<WorkspaceDTO> {
  const res = await fetch(`${API_BASE_URL}/api/workspaces/${workspaceId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch workspace details");
  }

  return res.json();
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

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to create workspace");
  }

  return res.json();
}

export async function deleteWorkspace(workspaceId: string, token: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/workspaces/${workspaceId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to delete workspace");
  }
}
