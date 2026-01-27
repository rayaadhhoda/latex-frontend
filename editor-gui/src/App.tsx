import { Routes, Route } from "react-router-dom";
import Onboarding from "./pages/onboarding";
import Home from "./pages/home";

function App() {
  return (
    <main className="min-h-screen">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/onboarding" element={<Onboarding />} />
      </Routes>
    </main>
  );
}

export default App;
