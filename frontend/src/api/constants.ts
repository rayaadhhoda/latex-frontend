/**
 * API Configuration Constants
 */

export const SERVER_API_BASE_URL = "http://127.0.0.1:8767";
export const SIDECAR_API_BASE_URL = "http://127.0.0.1:8768";

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
  MOVE_IMAGE_TO_PROJECT: "/move-image-to-project",
} as const;
