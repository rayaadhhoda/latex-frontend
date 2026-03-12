import { useEffect, useState } from "react";
import { WORKOS_CLIENT_ID } from "@/api/auth-keys";

export const WORKOS_ACCESS_TOKEN_KEY = "workos:access-token";
export const WORKOS_REFRESH_TOKEN_KEY = "workos:refresh-token";

/** Refresh interval: 50 min (tokens typically expire in 60 min) */
const TOKEN_REFRESH_INTERVAL_MS = 50 * 60 * 1000;

export function getWorkosAccessToken(): string | null {
  return typeof window !== "undefined"
    ? window.localStorage.getItem(WORKOS_ACCESS_TOKEN_KEY)
    : null;
}

export function getWorkosRefreshToken(): string | null {
  return typeof window !== "undefined"
    ? window.localStorage.getItem(WORKOS_REFRESH_TOKEN_KEY)
    : null;
}

export async function exchangeCodeForToken(
  code: string,
  codeVerifier: string
): Promise<{ accessToken: string; refreshToken: string; user: unknown }> {
  const res = await fetch("https://api.workos.com/user_management/authenticate", {
    method: "POST",
    headers: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: WORKOS_CLIENT_ID,
      grant_type: "authorization_code",
      code,
      code_verifier: codeVerifier,
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error_description ?? "Code exchange failed");
  }
  const data = await res.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    user: data.user,
  };
}

export async function refreshAccessToken(): Promise<{
  accessToken: string;
  refreshToken: string;
} | null> {
  const refreshToken = getWorkosRefreshToken();
  if (!refreshToken) return null;

  const res = await fetch("https://api.workos.com/user_management/authenticate", {
    method: "POST",
    headers: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: WORKOS_CLIENT_ID,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) return null;

  const data = await res.json();
  const accessToken = data.access_token;
  const newRefreshToken = data.refresh_token;
  if (!accessToken || !newRefreshToken) return null;

  if (typeof window !== "undefined") {
    window.localStorage.setItem(WORKOS_ACCESS_TOKEN_KEY, accessToken);
    window.localStorage.setItem(WORKOS_REFRESH_TOKEN_KEY, newRefreshToken);
  }
  return { accessToken, refreshToken: newRefreshToken };
}

export function useTokenRefresh(
  onTokenRefreshed?: (token: string) => void
): string | null {
  const [token, setToken] = useState<string | null>(getWorkosAccessToken);

  useEffect(() => {
    const refresh = async () => {
      const result = await refreshAccessToken();
      if (result) {
        setToken(result.accessToken);
        onTokenRefreshed?.(result.accessToken);
      }
    };

    refresh(); // Refresh immediately on mount (handles expired token from previous session)
    const id = setInterval(refresh, TOKEN_REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [onTokenRefreshed]);

  return token;
}
