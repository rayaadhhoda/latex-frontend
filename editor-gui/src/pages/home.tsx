import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getConfig } from "../api/client";

export default function Home() {
  const [returningUser, setReturningUser] = useState<boolean | null>(null);

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
          console.log(res);
          setReturningUser(!!fullName);
          return;
        } catch (err) {
          console.error(err);
          await new Promise((r) => {
            timeoutId = setTimeout(r, POLL_INTERVAL);
          });
        }
      }

      setReturningUser(false);
    };

    poll();

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  if (returningUser === null) {
    return <div>Loading...</div>; // Loading
  }

  if (!returningUser) {
    return <Navigate to="/onboarding" />;
  }
  return <Navigate to="/select-dir" />;
}
