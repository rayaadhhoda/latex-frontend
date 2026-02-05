import { API_BASE_URL, API_ENDPOINTS } from "./constants";

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  detail?: string;
}

async function request<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
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
  return request(API_ENDPOINTS.HEALTH, options);
}

export async function initProject(
  dir: string,
  template: string = "default",
  options?: RequestInit,
): Promise<ApiResponse<{ message: string }>> {
  return request(API_ENDPOINTS.INIT, {
    method: "POST",
    body: JSON.stringify({ dir, template }),
    ...options,
  });
}

export async function compileProject(
  dir: string,
  options?: RequestInit,
): Promise<ApiResponse<{ result: string }>> {
  return request(API_ENDPOINTS.COMPILE, {
    method: "POST",
    body: JSON.stringify({ dir }),
    ...options,
  });
}

export async function chat(
  dir: string,
  query: string
): Promise<ApiResponse<{ response: string }>> {
  return request(API_ENDPOINTS.CHAT, {
    method: "POST",
    body: JSON.stringify({ dir, query }),
  });
}

export async function listFiles(
  dir: string,
  options?: RequestInit,
): Promise<ApiResponse<{ files: string[] }>> {
  return request(`${API_ENDPOINTS.FILES}?dir=${encodeURIComponent(dir)}`, options);
}

export async function getPDF(
  dir: string,
  options?: RequestInit,
): Promise<Uint8Array> {
  const res = await fetch(
    `${API_BASE_URL}${API_ENDPOINTS.PDF}?dir=${encodeURIComponent(dir)}`,
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
  const endpoint = key ? `${API_ENDPOINTS.CONFIG}?key=${encodeURIComponent(key)}` : API_ENDPOINTS.CONFIG;
  return request(endpoint, options);
}

export async function updateConfig(
  config: Partial<ConfigData>
): Promise<ApiResponse<{ config: ConfigData }>> {
  return request(API_ENDPOINTS.CONFIG, {
    method: "POST",
    body: JSON.stringify(config),
  });
}

export async function nukeConfig(): Promise<ApiResponse<{ message: string }>> {
  return request(API_ENDPOINTS.NUKE, {
    method: "POST",
  });
}

export async function getFileContent(
  dir: string,
  file: string,
  options?: RequestInit,
): Promise<ApiResponse<{ content: string; file: string }>> {
  return request(
    `${API_ENDPOINTS.FILES}/content?dir=${encodeURIComponent(dir)}&file=${encodeURIComponent(file)}`,
    options,
  );
}

export async function updateFileContent(
  dir: string,
  file: string,
  content: string,
  options?: RequestInit,
): Promise<ApiResponse<{ message: string }>> {
  return request(`${API_ENDPOINTS.FILES}/content`, {
    method: "PUT",
    body: JSON.stringify({ dir, file, content }),
    ...options,
  });
}
