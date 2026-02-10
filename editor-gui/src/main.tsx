import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { ThemeProvider } from "./contexts/theme-context";
import { AccessibilityProvider } from "./contexts/accessibility-context";
import { SettingsProvider } from "./contexts/settings-context";
import "./index.css";

// Permanently hide the CopilotKit inspector / dev-console floating button.
// This uses the same storage key that CopilotKit's ConsoleTrigger checks.
if (typeof window !== "undefined") {
  try {
    window.localStorage.setItem("cpk:inspector:hidden", "1");
  } catch {
    // ignore storage errors
  }
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AccessibilityProvider>
          <SettingsProvider>
            <App />
          </SettingsProvider>
        </AccessibilityProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
