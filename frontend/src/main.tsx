import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { ThemeProvider } from "./contexts/theme-context";
import { AccessibilityProvider } from "./contexts/accessibility-context";
import { AuthProvider } from "./contexts/auth-context";
import { SettingsProvider } from "./contexts/settings-context";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./index.css";
import "@copilotkit/react-core/v2/styles.css";
import "./copilot-theme-overrides.css";

// Permanently hide the CopilotKit inspector / dev-console floating button.
// This uses the same storage key that CopilotKit's ConsoleTrigger checks.
if (typeof window !== "undefined") {
  try {
    window.localStorage.setItem("cpk:inspector:hidden", "1");
  } catch {
    // ignore storage errors
  }
}

// Forward Rust/Tauri logs to the webview devtools console when running in Tauri.
if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) {
  import("@tauri-apps/plugin-log")
    .then(({ attachConsole }) => attachConsole())
    .catch(() => {
      // ignore logger initialization errors
    });
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AccessibilityProvider>
          <SettingsProvider>
            <AuthProvider>
              <TooltipProvider>
                <App />
              </TooltipProvider>
            </AuthProvider>
          </SettingsProvider>
        </AccessibilityProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
