/**
 * API Configuration Constants
 */

export const API_BASE_URL = "http://127.0.0.1:8765";

export const API_ENDPOINTS = {
  HEALTH: "/health",
  TEMPLATES: "/templates",
  INIT: "/init",
  COMPILE: "/compile",
  CHAT: "/chat",
  UPLOAD_IMAGE: "/upload-image",
  FILES: "/files",
  FILES_CONTENT: "/files/content",
  PDF: "/pdf",
  CONFIG: "/config",
  NUKE: "/nuke",
  CHATBOT: "/chatbot",
} as const;
