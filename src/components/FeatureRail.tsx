import { Link } from "@tanstack/react-router";
import { useLanguage } from "@/lib/language";
import { useAuth } from "@/lib/auth";
import { MessageSquare, BookOpen, PenTool, FileText, Newspaper, Clock, Target, Wind, Gamepad2 } from "lucide-react";

interface Feature {
  id: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  titleKey: string;
  labelKey: string;
  gradient: string;
}

const FEATURES: Feature[] = [
  {
    id: "watercooler",
    to: "/watercooler",
    icon: MessageSquare,
    titleKey: "featureWatercooler",
    labelKey: "communityPulse",
    gradient: "from-blue-400 to-indigo-400",
  },
  {
    id: "community-stories",
    to: "/community-stories",
    icon: BookOpen,
    titleKey: "featureCommunityStories",
    labelKey: "communityPulse",
    gradient: "from-purple-400 to-pink-400",
  },
  {
    id: "submit-story",
    to: "/submit-story",
    icon: PenTool,
    titleKey: "featureSubmitStory",
    labelKey: "communityPulse",
    gradient: "from-pink-400 to-rose-400",
  },
  {
    id: "drafts",
    to: "/story-drafts",
    icon: FileText,
    titleKey: "featureDrafts",
    labelKey: "personalSpace",
    gradient: "from-amber-400 to-orange-400",
  },
  {
    id: "submissions",
    to: "/my-submissions",
    icon: Newspaper,
    titleKey: "featureSubmissions",
    labelKey: "personalSpace",
    gradient: "from-emerald-400 to-teal-400",
  },
  {
    id: "blog",
    to: "/blog",
    icon: Newspaper,
    titleKey: "featureBlog",
    labelKey: "exploreBreakroom",
    gradient: "from-cyan-400 to-blue-400",
  },
  {
    id: "focus",
    to: "/match",
    icon: Target,
    titleKey: "featureFocus",
    labelKey: "exploreBreakroom",
    gradient: "from-violet-400 to-purple-400",
  },
  {
    id: "breathe",
    to: "/",
    icon: Wind,
    titleKey: "featureBreathe",
    labelKey: "exploreBreakroom",
    gradient: "from-teal-400 to-emerald-400",
  },
  {
    id: "games",
    to: "/bubbles",
    icon: Gamepad2,
    titleKey: "featureGames",
    labelKey: "exploreBreakroom",
    gradient: "from-rose-400 to-pink-400",
  },
];

export function FeatureRail() {
  const { t } = useLanguage();
  const { user } = useAuth();

  // Filter features based on auth state
  const filteredFeatures = FEATURES.filter((feature) => {
    if (!user && (feature.id === "drafts" || feature.id === "submissions")) {
      return false;
    }
    return true;
  });

  return (
    <div className="mb-8">
      <h2 className="text-sm font-semibold text-muted-foreground tracking-wide uppercase mb-3">
        {t("exploreBreakroom")}
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
        {filteredFeatures.map((feature) => {
          const Icon = feature.icon;
          return (
            <Link
              key={feature.id}
              to={feature.to}
              className="flex-shrink-0 w-32 sm:w-36 snap-start"
            >
              <div className="glass-card rounded-2xl p-4 bg-white/40 hover:bg-white/60 border border-white/30 transition-all hover:scale-[1.02] hover:shadow-[var(--shadow-glow)]">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-gradient-to-br ${feature.gradient} text-white shadow-[var(--shadow-soft)]`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-display font-semibold text-foreground text-sm mb-1">
                  {t(feature.titleKey)}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {t(feature.labelKey)}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
