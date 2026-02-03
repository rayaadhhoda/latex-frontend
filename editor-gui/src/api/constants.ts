/**
 * API Configuration Constants
 */

export const API_BASE_URL = "http://127.0.0.1:8765";

export const API_ENDPOINTS = {
  HEALTH: "/health",
  INIT: "/init",
  COMPILE: "/compile",
  CHAT: "/chat",
  FILES: "/files",
  PDF: "/pdf",
  CONFIG: "/config",
  NUKE: "/nuke",
  CHATBOT: "/copilotkit",
} as const;
