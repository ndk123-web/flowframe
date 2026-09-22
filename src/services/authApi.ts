import { AuthResponse, useAuthStore } from "@/store/useAuthStore";
import { useToastStore } from "@/store/useToastStore";
import { useSessionModalStore } from "@/store/useSessionModalStore";

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

/**
 * Detects if an HTTP response status or message indicates an invalid or expired token.
 */
export function isAuthError(status: number, message?: string): boolean {
  if (status === 401) return true;
  if (!message) return false;
  const lower = message.toLowerCase();
  return (
    lower.includes("invalid or expired access token") ||
    lower.includes("expired access token") ||
    lower.includes("invalid access token") ||
    lower.includes("token expired") ||
    lower.includes("token is expired") ||
    lower.includes("token has expired") ||
    lower.includes("jwt expired") ||
    lower.includes("unauthorized") ||
    lower.includes("unauthenticated")
  );
}

/**
 * Safely inspects a JWT string's exp timestamp in milliseconds against current time.
 */
export function isJwtExpired(token: string | null | undefined): boolean {
  if (!token) return true;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const parsed = JSON.parse(jsonPayload);
    if (typeof parsed.exp === "number") {
      return Date.now() >= parsed.exp * 1000 - 5000;
    }
  } catch {
    return false;
  }
  return false;
}

let isHandlingExpiry = false;

export function _resetSessionExpiryLock(): void {
  isHandlingExpiry = false;
}

/**
 * Proactively clears state, logs out the user, shows an error toast, and triggers the Session Expired popup modal.
 */
export function handleSessionExpired(
  reason?: string,
  redirect: boolean = false
): void {
  if (isHandlingExpiry) return;
  isHandlingExpiry = true;

  const displayMessage =
    reason && reason.toLowerCase().includes("expired")
      ? "Your session has expired. Please sign in again."
      : "Invalid or expired access token. Please sign in again.";

  // 1. Immediately log out from Zustand and remove localStorage state
  try {
    useAuthStore.getState().logout();
  } catch (e) {
    console.error("Failed to clear auth state:", e);
  }

  // 2. Trigger high-visibility toast
  try {
    useToastStore.getState().showToast(displayMessage, "error");
  } catch (e) {
    console.error("Failed to show toast:", e);
  }

  // 3. Open the Session Expired popup modal
  try {
    useSessionModalStore.getState().openModal(displayMessage);
  } catch (e) {
    console.error("Failed to open session modal:", e);
  }

  // 4. Optionally navigate to signin if redirect requested
  if (redirect && typeof window !== "undefined") {
    const pathname = window.location.pathname;
    if (!pathname.startsWith("/signin") && !pathname.startsWith("/signup")) {
      window.location.href = "/signin?expired=true";
    }
  }

  setTimeout(() => {
    isHandlingExpiry = false;
  }, 2500);
}

/**
 * Universal response handler for authenticated API endpoints.
 * Automatically catches 401s / invalid token messages, logs out, and displays popup.
 */
export async function handleApiResponse<T>(
  response: Response,
  fallbackMessage: string = "Request failed"
): Promise<T> {
  if (!response.ok) {
    let errorMessage = fallbackMessage;
    try {
      const errorData = await response.json();
      errorMessage =
        errorData.error ||
        errorData.detail ||
        errorData.message ||
        errorMessage;
    } catch {
      errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
    }

    if (response.status === 401 || isAuthError(response.status, errorMessage)) {
      handleSessionExpired(errorMessage);
    }

    throw new Error(errorMessage);
  }

  return response.json();
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

  return handleApiResponse<AuthResponse>(response, "Sign in failed");
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

  return handleApiResponse<AuthResponse>(response, "Sign up failed");
}

export async function syncFirebaseUserApi(payload: FirebaseSyncPayload): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/sync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleApiResponse<AuthResponse>(response, "User sync failed");
}
