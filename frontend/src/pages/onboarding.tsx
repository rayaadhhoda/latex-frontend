import { useState } from "react";
import { useAuth } from "@workos-inc/authkit-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function Onboarding() {
  const { signIn, getSignInUrl, isLoading } = useAuth();
  const [isOpening, setIsOpening] = useState(false);

  const handleSignIn = async () => {
    try {
      setIsOpening(true);
      const url = await getSignInUrl();
      try {
        const { open } = await import("@tauri-apps/plugin-shell");
        await open(url);
      } catch {
        await signIn();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setIsOpening(false);
    }
  };

  const busy = isLoading || isOpening;

  return (
    <div>
      Onboarding
      <Button onClick={handleSignIn} disabled={busy}>
        {busy ? "Signing in…" : "Sign in"}
      </Button>
    </div>
  );
}
