import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getConfig } from "../api/client";
import Dashboard from "../components/dashboard";

export default function Home() {
  const [returningUser, setReturningUser] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const POLL_TIMEOUT = 5000;
    const POLL_INTERVAL = 500;
    let timeoutId: ReturnType<typeof setTimeout>;

    const poll = async () => {
      const startTime = Date.now();

      while (Date.now() - startTime < POLL_TIMEOUT) {
        try {
          const res = await getConfig();
          const fullName = res.data?.config?.full_name;
          setReturningUser(!!fullName);
          setIsLoading(false);
          return;
        } catch (err) {
          console.error(err);
          await new Promise((r) => {
            timeoutId = setTimeout(r, POLL_INTERVAL);
          });
        }
      }

      setReturningUser(false);
      setIsLoading(false);
    };

    poll();

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!returningUser) {
    return <Navigate to="/onboarding" />;
  }

  return <Dashboard />;
}
