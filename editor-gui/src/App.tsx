import { Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import Onboarding from "./pages/onboarding";
import Home from "./pages/home";
import SelectDir from "./pages/select-dir";
import Editor from "./pages/editor";

function App() {
  return (
    <main className="min-h-svh">
      <Toaster />
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
