import { Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { useAccessibility } from "./contexts/accessibility-context";
import Onboarding from "./pages/onboarding";
import Home from "./pages/home";
import SelectDir from "./pages/select-dir";
import Editor from "./pages/editor";

function ScreenReaderAnnouncer() {
  const { screenReader } = useAccessibility();
  
  if (!screenReader) return null;
  
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
      id="screen-reader-announcer"
    />
  );
}

function App() {
  return (
    <main className="min-h-svh">
      <Toaster />
      <ScreenReaderAnnouncer />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/select-dir" element={<SelectDir />} />
        <Route path="/editor" element={<Editor />} />
      </Routes>
    </main>
  );
}

export default App;
