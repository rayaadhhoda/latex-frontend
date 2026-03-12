import { useAuth } from "@workos-inc/authkit-react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import TopNavigation from "@/components/top-navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WORKOS_ACCESS_TOKEN_KEY, WORKOS_REFRESH_TOKEN_KEY } from "@/lib/auth";

function getInitials(firstName: string | null, lastName: string | null): string {
  const first = (firstName ?? "").trim();
  const last = (lastName ?? "").trim();
  if (first && last) {
    return `${first[0]}${last[0]}`.toUpperCase();
  }
  if (first) return first.slice(0, 2).toUpperCase();
  if (last) return last.slice(0, 2).toUpperCase();
  return "U";
}

function getDisplayName(firstName: string | null, lastName: string | null): string {
  const name = [firstName, lastName].filter(Boolean).join(" ").trim();
  return name || "User";
}

export default function Settings() {
  const { user, isLoading, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    signOut({ returnTo: "/onboarding", navigate: false });
    window.localStorage.removeItem(WORKOS_ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(WORKOS_REFRESH_TOKEN_KEY);
    navigate("/onboarding", { replace: true });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen">
        <TopNavigation />
        <div className="flex-1 overflow-auto flex items-center justify-center p-6">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen">
      <TopNavigation />
      <div className="flex-1 overflow-auto flex items-start justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-center gap-4">
              <Avatar size="lg" className="size-14">
                <AvatarImage src={user.profilePictureUrl ?? undefined} alt={getDisplayName(user.firstName, user.lastName)} />
                <AvatarFallback>{getInitials(user.firstName, user.lastName)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-0.5 min-w-0">
                <p className="font-medium truncate">{getDisplayName(user.firstName, user.lastName)}</p>
                <p className="text-sm text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
            <Button variant="outline" className="w-full justify-center gap-2" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Log out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
