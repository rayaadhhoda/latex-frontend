import { Navigate } from "react-router-dom";

export default function Home() {
  const returningUser = false;
  if (!returningUser) {
    return <Navigate to="/onboarding" />;
  }
  return <Navigate to="/select-project" />;
}
