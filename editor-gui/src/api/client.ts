const API_BASE = "http://127.0.0.1:8765";

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  detail?: string;
}

async function request<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || `HTTP error ${res.status}`);
  }

  return res.json();
}

export async function health(): Promise<ApiResponse<{ status: string; version: string }>> {
  return request("/health");
}

export async function initProject(
  dir: string,
  template: string = "default"
): Promise<ApiResponse<{ message: string }>> {
  return request("/init", {
    method: "POST",
    body: JSON.stringify({ dir, template }),
  });
}

export async function compileProject(
  dir: string
): Promise<ApiResponse<{ result: string }>> {
  return request("/compile", {
    method: "POST",
    body: JSON.stringify({ dir }),
  });
}

export async function chat(
  dir: string,
  query: string
): Promise<ApiResponse<{ response: string }>> {
  return request("/chat", {
    method: "POST",
    body: JSON.stringify({ dir, query }),
  });
}

export async function getConfig(
  key?: string
): Promise<ApiResponse<{ config: string }>> {
  const endpoint = key ? `/config?key=${encodeURIComponent(key)}` : "/config";
  return request(endpoint);
}

export async function nukeConfig(): Promise<ApiResponse<{ message: string }>> {
  return request("/nuke", {
    method: "POST",
  });
}
