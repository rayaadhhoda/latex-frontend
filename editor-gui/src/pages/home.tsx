import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getConfig } from "../api/client";

export default function Home() {
  const [returningUser, setReturningUser] = useState<boolean | null>(null);
  const controller = new AbortController();

  useEffect(() => {
    (async () => {
      try {
        const res = await getConfig(null, { signal: controller.signal });
        const fullName = res.data?.config?.full_name;
        console.log(res);
        setReturningUser(!!fullName);
      } catch (err) {
        console.error(err);
        setReturningUser(false);
      }
    })();
    return () => controller.abort();
  }, []);

  if (returningUser === null) {
    return null; // Loading
  }

  if (!returningUser) {
    return <Navigate to="/onboarding" />;
  }
  return <Navigate to="/select-project" />;
}
