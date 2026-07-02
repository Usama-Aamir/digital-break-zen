import { Link } from "@tanstack/react-router";
import { useLanguage } from "@/lib/language";
import { useAuth } from "@/lib/auth";
import { useIsAdmin } from "@/lib/useIsAdmin";
import { FileText, Newspaper, Shield, LogIn } from "lucide-react";

export function PersonalActivityCards() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();

  // If user is logged out, show sign-in CTA
  if (!user) {
    return (
      <div className="glass-card rounded-2xl p-6 bg-gradient-to-br from-blue-100/30 to-indigo-100/30 border-blue-200/30">
        <h3 className="text-lg font-display font-bold text-foreground mb-2">
          {t("saveAndJoin")}
        </h3>
        <p className="text-muted-foreground mb-4">
          {t("saveAndJoinText")}
        </p>
        <Link
          to="/auth"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-400 to-indigo-400 text-white rounded-full text-sm font-semibold hover:opacity-95 transition-opacity shadow-[var(--shadow-glow)]"
        >
          <LogIn className="h-4 w-4" />
          {t("signIn")}
        </Link>
      </div>
    );
  }

  // If user is logged in, show personal activity cards
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-muted-foreground tracking-wide uppercase">
        {t("personalSpace")}
      </h3>
      
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          to="/story-drafts"
          className="glass-card rounded-2xl p-5 bg-white/40 hover:bg-white/60 border border-white/30 transition-all hover:scale-[1.01] hover:shadow-[var(--shadow-glow)]"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-amber-400 to-orange-400 text-white shadow-[var(--shadow-soft)]">
              <FileText className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-display font-semibold text-foreground mb-1">
                {t("featureDrafts")}
              </h4>
              <p className="text-xs text-muted-foreground">
                {t("personalSpace")}
              </p>
            </div>
          </div>
        </Link>

        <Link
          to="/my-submissions"
          className="glass-card rounded-2xl p-5 bg-white/40 hover:bg-white/60 border border-white/30 transition-all hover:scale-[1.01] hover:shadow-[var(--shadow-glow)]"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-emerald-400 to-teal-400 text-white shadow-[var(--shadow-soft)]">
              <Newspaper className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-display font-semibold text-foreground mb-1">
                {t("featureSubmissions")}
              </h4>
              <p className="text-xs text-muted-foreground">
                {t("personalSpace")}
              </p>
            </div>
          </div>
        </Link>

        {isAdmin && (
          <Link
            to="/admin-submissions"
            className="glass-card rounded-2xl p-5 bg-white/40 hover:bg-white/60 border border-white/30 transition-all hover:scale-[1.01] hover:shadow-[var(--shadow-glow)]"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-purple-400 to-pink-400 text-white shadow-[var(--shadow-soft)]">
                <Shield className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-display font-semibold text-foreground mb-1">
                  Admin Moderation
                </h4>
                <p className="text-xs text-muted-foreground">
                  Review and approve community stories
                </p>
              </div>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}
