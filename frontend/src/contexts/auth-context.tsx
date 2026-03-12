import { useEffect, useState, type ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { onOpenUrl } from "@tauri-apps/plugin-deep-link";
import { AuthKitProvider, useAuth } from "@workos-inc/authkit-react";
import { WORKOS_CLIENT_ID } from "@/api/auth-keys";
import {
  exchangeCodeForToken,
  WORKOS_ACCESS_TOKEN_KEY,
  WORKOS_REFRESH_TOKEN_KEY,
} from "@/lib/auth";

const WORKOS_CODE_VERIFIER_KEY = "workos:code-verifier";

function parseAuthCallbackUrl(url: string): URLSearchParams | null {
  try {
    const parsed = new URL(url);
    if (
      parsed.protocol === "spartan-write:" &&
      parsed.hostname === "auth-callback"
    ) {
      return parsed.searchParams;
    }
  } catch {
    // ignore
  }
  return null;
}

function RedirectWhenUnauthenticated({ children }: { children: ReactNode }) {
  const { isLoading, user } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    if (isLoading || user) return;
    if (pathname !== "/onboarding") {
      navigate("/onboarding", { replace: true });
    }
  }, [isLoading, user, pathname, navigate]);


  useEffect(() => {
    console.log("user", user);
  }, [user]);

  return <>{children}</>;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [authKey, setAuthKey] = useState(0);



  useEffect(() => {
    let unlisten: (() => void) | undefined;

    onOpenUrl((urls: string[]) => {
      for (const url of urls) {
        const params = parseAuthCallbackUrl(url);
        if (params) {
          const code = params.get("code");
          const codeVerifier = window.sessionStorage.getItem(
            WORKOS_CODE_VERIFIER_KEY
          );
          if (code && codeVerifier) {
            exchangeCodeForToken(code, codeVerifier)
              .then(({ accessToken, refreshToken }) => {
                window.sessionStorage.removeItem(WORKOS_CODE_VERIFIER_KEY);
                window.localStorage.setItem(WORKOS_ACCESS_TOKEN_KEY, accessToken);
                window.localStorage.setItem(
                  WORKOS_REFRESH_TOKEN_KEY,
                  refreshToken
                );
                setAuthKey((k) => k + 1);
              })
              .catch((err) => {
                console.error("Auth code exchange failed:", err);
              });
          } else {
            console.warn(
              "Auth callback missing code or code_verifier in sessionStorage"
            );
          }
          navigate("/dashboard");
          return;
        }
      }
    }).then((fn) => {
      unlisten = fn;
    });

    return () => {
      unlisten?.();
    };
  }, [navigate]);

  return (
    <AuthKitProvider
      key={authKey}
      clientId={WORKOS_CLIENT_ID}
      redirectUri="spartan-write://auth-callback">
      <RedirectWhenUnauthenticated>{children}</RedirectWhenUnauthenticated>
    </AuthKitProvider>
  );
}
