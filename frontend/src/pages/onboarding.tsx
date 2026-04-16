import { useState } from "react";
import { useAuth } from "@workos-inc/authkit-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Navigate } from "react-router-dom";
import BrandLogo from "@/components/brand-logo";

export default function Onboarding() {
  const { signIn, getSignInUrl, isLoading, user } = useAuth();
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

  if (!busy && user) {
    console.log(`Welcome, ${user.firstName} ${user.lastName}!`);
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#003366] to-[#001733] relative overflow-hidden">
      {/* Decorative large faint text in the background */}
      <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none opacity-[0.03]">
         <span className="text-[20vw] font-black text-white leading-none tracking-tighter mix-blend-overlay">SJSU</span>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center gap-8 p-12 rounded-3xl bg-white/5 border border-white/10 shadow-2xl backdrop-blur-md">
        <BrandLogo size="lg" sjsuColors={true} />
        <Button 
          onClick={handleSignIn} 
          disabled={busy}
          className="w-[200px] h-12 text-base font-semibold bg-[#E5A823] hover:bg-[#D4981C] text-[#001A36] border-none shadow-[0_4px_14px_0_rgba(229,168,35,0.39)] hover:shadow-[0_6px_20px_rgba(229,168,35,0.23)] hover:-translate-y-0.5 transition-all duration-200"
        >
          {busy ? "Signing in…" : "Sign in"}
        </Button>
      </div>
    </div>
  );
}
