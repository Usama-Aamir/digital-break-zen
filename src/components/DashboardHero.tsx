import { Link } from "@tanstack/react-router";
import { useLanguage } from "@/lib/language";
import { useAuth } from "@/lib/auth";
import { getCurrentUserProfile, getDisplayName } from "@/lib/profiles";
import { User } from "lucide-react";
import { useState, useEffect } from "react";

export function DashboardHero() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      if (user) {
        const profile = await getCurrentUserProfile(user.id);
        const name = getDisplayName(profile, user.email);
        setDisplayName(name);
        setAvatar(profile?.avatar_url || null);
      }
    }
    loadProfile();
  }, [user]);

  return (
    <div className="mb-8">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-2">
            {user ? (
              displayName ? (
                `${t("welcomeBack")}, ${displayName}`
              ) : (
                t("welcomeBack")
              )
            ) : (
              t("welcomeToBreakroom")
            )}
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-xl">
            {t("dashboardSubtitle")}
          </p>
        </div>
        <Link
          to="/account"
          className="shrink-0 p-3 rounded-full bg-white/40 hover:bg-white/60 border border-white/30 transition-all shadow-[var(--shadow-soft)]"
          aria-label={t("openAccount")}
        >
          {avatar ? (
            <span className="text-2xl">{avatar}</span>
          ) : (
            <User className="h-5 w-5 text-foreground/70" />
          )}
        </Link>
      </div>
    </div>
  );
}
