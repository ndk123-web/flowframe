const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export interface DiagramDTO {
  id: string;
  workspace_id: string;
  user_id: string;
  title: string;
  description?: string;
  version: string;
  nodes: any[];
  edges: any[];
  configs: Record<string, any>;
  viewport?: Record<string, any>;
  nodes_count: number;
  edges_count: number;
  created_at: string;
  updated_at: string;
}

export interface RecentDiagramDTO {
  id: string;
  workspace_id: string;
  workspace_name: string;
  title: string;
  env: string;
  nodes_count: number;
  updated_at: string;
}

export interface CreateDiagramPayload {
  title: string;
  description?: string;
  version?: string;
  nodes?: any[];
  edges?: any[];
  configs?: Record<string, any>;
  viewport?: Record<string, any>;
}

export interface UpdateDiagramPayload {
  title?: string;
  description?: string;
  version?: string;
  nodes?: any[];
  edges?: any[];
  configs?: Record<string, any>;
  viewport?: Record<string, any>;
}

export async function getRecentDiagrams(token: string): Promise<RecentDiagramDTO[]> {
  const res = await fetch(`${API_BASE_URL}/api/diagrams/recent`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch recent diagrams");
  }

  return res.json();
}

export async function getWorkspaceDiagrams(
  workspaceId: string,
  token: string
): Promise<DiagramDTO[]> {
  const res = await fetch(`${API_BASE_URL}/api/workspaces/${workspaceId}/diagrams`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch diagrams");
  }

  return res.json();
}

export async function getDiagramById(
  workspaceId: string,
  diagramId: string,
  token: string
): Promise<DiagramDTO> {
  const res = await fetch(
    `${API_BASE_URL}/api/workspaces/${workspaceId}/diagrams/${diagramId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch diagram details");
  }

  return res.json();
}

export async function createDiagram(
  workspaceId: string,
  payload: CreateDiagramPayload,
  token: string
): Promise<DiagramDTO> {
  const res = await fetch(`${API_BASE_URL}/api/workspaces/${workspaceId}/diagrams`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to create diagram");
  }

  return res.json();
}

export async function updateDiagram(
  workspaceId: string,
  diagramId: string,
  payload: UpdateDiagramPayload,
  token: string
): Promise<DiagramDTO> {
  const res = await fetch(
    `${API_BASE_URL}/api/workspaces/${workspaceId}/diagrams/${diagramId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to save diagram");
  }

  return res.json();
}

export async function deleteDiagram(
  workspaceId: string,
  diagramId: string,
  token: string
): Promise<void> {
  const res = await fetch(
    `${API_BASE_URL}/api/workspaces/${workspaceId}/diagrams/${diagramId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to delete diagram");
  }
}
