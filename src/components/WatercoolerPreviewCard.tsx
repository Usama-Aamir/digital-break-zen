import { Link } from "@tanstack/react-router";
import { useLanguage } from "@/lib/language";
import { MessageSquare, Users, Zap } from "lucide-react";

export function WatercoolerPreviewCard() {
  const { t } = useLanguage();

  return (
    <div className="glass-card rounded-2xl p-5 bg-gradient-to-br from-blue-100/30 to-indigo-100/30 border-blue-200/30 hover:scale-[1.01] transition-transform">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-display font-bold text-foreground">
            {t("watercoolerWall")}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {t("watercoolerPreviewSubtitle")}
          </p>
        </div>
        <div className="flex gap-2">
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-white/50 text-foreground/80 border border-white/30">
            Public
          </span>
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-white/50 text-foreground/80 border border-white/30">
            Community
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          <span>Quick posts</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MessageSquare className="h-3.5 w-3.5" />
          <span>Shared moments</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Zap className="h-3.5 w-3.5" />
          <span>Tiny wins</span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-4">
        {t("shareTinyWin")}
      </p>

      <Link
        to="/watercooler"
        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-400 to-indigo-400 text-white rounded-full text-sm font-semibold hover:opacity-95 transition-opacity shadow-[var(--shadow-glow)]"
      >
        {t("openWatercooler")}
      </Link>
    </div>
  );
}
