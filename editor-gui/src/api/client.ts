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

export async function health(
  options?: RequestInit,
): Promise<ApiResponse<{ status: string; version: string }>> {
  return request("/health", options);
}

export async function initProject(
  dir: string,
  template: string = "default",
  options?: RequestInit,
): Promise<ApiResponse<{ message: string }>> {
  return request("/init", {
    method: "POST",
    body: JSON.stringify({ dir, template }),
    ...options,
  });
}

export async function compileProject(
  dir: string,
  options?: RequestInit,
): Promise<ApiResponse<{ result: string }>> {
  return request("/compile", {
    method: "POST",
    body: JSON.stringify({ dir }),
    ...options,
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

export async function listFiles(
  dir: string,
  options?: RequestInit,
): Promise<ApiResponse<{ files: string[] }>> {
  return request(`/files?dir=${encodeURIComponent(dir)}`, options);
}

export async function getPDF(
  dir: string,
  options?: RequestInit,
): Promise<Uint8Array> {
  const res = await fetch(
    `${API_BASE}/pdf?dir=${encodeURIComponent(dir)}`,
    options,
  );

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error("PDF not found");
    }
    const error = await res.json();
    throw new Error(error.detail || `HTTP error ${res.status}`);
  }

  const buffer = await res.arrayBuffer();
  return new Uint8Array(buffer);
}

export interface ConfigData {
  openai_api_base?: string;
  openai_api_key?: string;
  openai_api_model?: string;
  full_name?: string;
}

export async function getConfig(
  key?: string,
  options?: RequestInit,
): Promise<ApiResponse<{ config: ConfigData }>> {
  const endpoint = key ? `/config?key=${encodeURIComponent(key)}` : "/config";
  return request(endpoint, options);
}

export async function updateConfig(
  config: Partial<ConfigData>
): Promise<ApiResponse<{ config: ConfigData }>> {
  return request("/config", {
    method: "POST",
    body: JSON.stringify(config),
  });
}

export async function nukeConfig(): Promise<ApiResponse<{ message: string }>> {
  return request("/nuke", {
    method: "POST",
  });
}
