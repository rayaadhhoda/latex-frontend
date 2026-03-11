import { useEffect, useState, type ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { onOpenUrl } from "@tauri-apps/plugin-deep-link";
import { AuthKitProvider, useAuth } from "@workos-inc/authkit-react";
import { VITE_WORKOS_CLIENT_ID } from "@/api/auth-keys";
import { getConfig, updateConfig } from "@/api/client";
import { exchangeCodeForToken } from "@/lib/auth";

const WORKOS_CODE_VERIFIER_KEY = "workos:code-verifier";
const WORKOS_REFRESH_TOKEN_KEY = "workos:refresh-token";

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

  // On load: sync refresh token from /config API into localStorage
  useEffect(() => {
    getConfig("workos_refresh_token")
      .then((res) => {
        const token = res.data?.config?.workos_refresh_token;
        if (token) {
          window.localStorage.setItem(WORKOS_REFRESH_TOKEN_KEY, token);
          setAuthKey((k) => k + 1);
        }
      })
      .catch(() => {
        // Sidecar may not be running yet; ignore
      });
  }, []);

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
              .then(({ refreshToken }) => {
                window.sessionStorage.removeItem(WORKOS_CODE_VERIFIER_KEY);
                window.localStorage.setItem(
                  WORKOS_REFRESH_TOKEN_KEY,
                  refreshToken
                );
                updateConfig({ workos_refresh_token: refreshToken }).catch(
                  () => { }
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
          navigate("/editor");
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
      clientId={VITE_WORKOS_CLIENT_ID}
      redirectUri="spartan-write://auth-callback"
      devMode={true}>
      <RedirectWhenUnauthenticated>{children}</RedirectWhenUnauthenticated>
    </AuthKitProvider>
  );
}
