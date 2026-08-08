import { AuthResponse } from "@/store/useAuthStore";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export interface AuthCredentials {
  email: string;
  password: string;
  type_of_signin?: string;
}

export interface FirebaseSyncPayload {
  email: string;
  firebase_uid: string;
  type_of_signin?: string;
  name?: string;
  avatar?: string;
  id_token?: string;
}

export async function signInApi(credentials: AuthCredentials): Promise<AuthResponse> {
  const payload = {
    email: credentials.email,
    password: credentials.password,
    type_of_signin: credentials.type_of_signin || "email",
  };

  const response = await fetch(`${API_BASE_URL}/api/auth/signin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMessage = "Sign in failed";
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.detail || errorData.message || errorMessage;
    } catch {
      errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  const data: AuthResponse = await response.json();
  return data;
}

export async function signUpApi(credentials: AuthCredentials): Promise<AuthResponse> {
  const payload = {
    email: credentials.email,
    password: credentials.password,
    type_of_signin: credentials.type_of_signin || "email",
  };

  const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMessage = "Sign up failed";
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.detail || errorData.message || errorMessage;
    } catch {
      errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  const data: AuthResponse = await response.json();
  return data;
}

export async function syncFirebaseUserApi(payload: FirebaseSyncPayload): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/sync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMessage = "User sync failed";
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.detail || errorData.message || errorMessage;
    } catch {
      errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  const data: AuthResponse = await response.json();
  return data;
}
