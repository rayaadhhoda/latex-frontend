import { Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { useAccessibility } from "./contexts/accessibility-context";
import Onboarding from "./pages/onboarding";
import Home from "./pages/home";
import Editor from "./pages/editor";
import NewProject from "./pages/new-project";

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
        <Route path="/editor" element={<Editor />} />
        <Route path="/new-project" element={<NewProject />} />
      </Routes>
    </main>
  );
}

export default App;
