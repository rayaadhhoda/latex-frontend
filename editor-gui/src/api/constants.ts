/**
 * API Configuration Constants
 */

export const API_BASE_URL = "http://127.0.0.1:8765";

export const API_ENDPOINTS = {
  HEALTH: "/content/health",
  INIT: "/content/init",
  COMPILE: "/content/compile",
  CHAT: "/content/chat",
  FILES: "/content/files",
  PDF: "/content/pdf",
  CONFIG: "/content/config",
  NUKE: "/content/nuke",
  CHATBOT: "/chatbot",
} as const;
