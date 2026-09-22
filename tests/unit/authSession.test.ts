import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  isAuthError,
  isJwtExpired,
  handleSessionExpired,
  handleApiResponse,
  _resetSessionExpiryLock,
} from "../../src/services/authApi";
import { useAuthStore } from "../../src/store/useAuthStore";
import { useToastStore } from "../../src/store/useToastStore";
import { useSessionModalStore } from "../../src/store/useSessionModalStore";

describe("Auth Session Expiry & Detection", () => {
  beforeEach(() => {
    _resetSessionExpiryLock();
    useAuthStore.setState({
      token: "mock-token",
      user: { id: "u1", email: "user@example.com", type_of_signin: "email" },
      isAuthenticated: true,
    });
    useToastStore.setState({ toasts: [] });
    useSessionModalStore.setState({ isOpen: false, message: "" });
  });

  describe("isAuthError()", () => {
    it("detects HTTP 401 as an auth error", () => {
      expect(isAuthError(401)).toBe(true);
      expect(isAuthError(401, "Random error")).toBe(true);
    });

    it("detects 'Invalid or expired access token' regardless of status code", () => {
      expect(isAuthError(403, "Invalid or expired access token")).toBe(true);
      expect(isAuthError(400, "invalid or expired access token")).toBe(true);
      expect(isAuthError(500, "Error: Invalid or expired access token in header")).toBe(true);
    });

    it("detects other token expiration / unauthorized messages", () => {
      expect(isAuthError(403, "Token expired")).toBe(true);
      expect(isAuthError(403, "jwt expired")).toBe(true);
      expect(isAuthError(403, "Unauthorized")).toBe(true);
      expect(isAuthError(403, "invalid access token")).toBe(true);
    });

    it("returns false for standard business/system errors", () => {
      expect(isAuthError(404, "Workspace not found")).toBe(false);
      expect(isAuthError(500, "Database connection failed")).toBe(false);
      expect(isAuthError(400, "Validation failed: name is required")).toBe(false);
    });
  });

  describe("isJwtExpired()", () => {
    it("returns true for null or empty tokens", () => {
      expect(isJwtExpired(null)).toBe(true);
      expect(isJwtExpired("")).toBe(true);
      expect(isJwtExpired(undefined)).toBe(true);
    });

    it("returns false for non-JWT strings to allow backend verification", () => {
      expect(isJwtExpired("simple-opaque-token")).toBe(false);
    });

    it("returns true for a JWT whose expiration date is in the past", () => {
      const pastExp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const payload = Buffer.from(JSON.stringify({ exp: pastExp, sub: "user1" })).toString("base64");
      const expiredJwt = `eyJhbGciOiJIUzI1NiJ9.${payload}.signature`;
      expect(isJwtExpired(expiredJwt)).toBe(true);
    });

    it("returns false for a JWT whose expiration date is well in the future", () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour in future
      const payload = Buffer.from(JSON.stringify({ exp: futureExp, sub: "user1" })).toString("base64");
      const validJwt = `eyJhbGciOiJIUzI1NiJ9.${payload}.signature`;
      expect(isJwtExpired(validJwt)).toBe(false);
    });
  });

  describe("handleSessionExpired()", () => {
    it("logs out user, opens session modal, and adds error toast", () => {
      handleSessionExpired("Invalid or expired access token");

      const authState = useAuthStore.getState();
      expect(authState.token).toBeNull();
      expect(authState.user).toBeNull();
      expect(authState.isAuthenticated).toBe(false);

      const modalState = useSessionModalStore.getState();
      expect(modalState.isOpen).toBe(true);
      expect(modalState.message).toContain("session has expired");

      const toastState = useToastStore.getState();
      expect(toastState.toasts.length).toBeGreaterThanOrEqual(1);
      expect(toastState.toasts[0].type).toBe("error");
    });
  });

  describe("handleApiResponse()", () => {
    it("returns parsed JSON when response is ok", async () => {
      const mockResponse = new Response(JSON.stringify({ success: true, count: 5 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });

      const result = await handleApiResponse<any>(mockResponse);
      expect(result).toEqual({ success: true, count: 5 });
    });

    it("triggers logout and modal when response is 401 Unauthorized", async () => {
      const mockResponse = new Response(
        JSON.stringify({ error: "Invalid or expired access token" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );

      await expect(handleApiResponse(mockResponse)).rejects.toThrow("Invalid or expired access token");

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useSessionModalStore.getState().isOpen).toBe(true);
    });
  });
});
