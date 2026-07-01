import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useLanguage } from "@/lib/language";
import { useAuth } from "@/lib/auth";
import { useState, useEffect } from "react";
import { getUserActivitySummary, getRecentUserActivity, getWeeklyMoodSummary, getUserContributionSummary, type ActivitySummary, type MoodSummary, type ContributionSummary, type UserActivity } from "@/lib/userActivity";
import { getCurrentUserProfile } from "@/lib/profiles";
import { awardXP, getUserXP } from "@/lib/gamification";
import { Flame, MessageSquare, Heart, FileText, TrendingUp, Calendar, Coffee, Smile, Target, Zap, ArrowRight, CheckCircle, Star, Trophy } from "lucide-react";

export const Route = createFileRoute("/my-breakroom")({
  head: () => ({
    meta: [
      { title: "My Breakroom | The Digital Breakroom" },
      { name: "description", content: "See your activity, streaks, and weekly progress in your personal breakroom." },
    ],
  }),
  component: MyBreakroomPage,
});

function MyBreakroomPage() {
  const { t } = useLanguage();
  const { user, isConfigured } = useAuth();
  const [displayName, setDisplayName] = useState<string>("");
  const [activitySummary, setActivitySummary] = useState<ActivitySummary | null>(null);
  const [moodSummary, setMoodSummary] = useState<MoodSummary | null>(null);
  const [contributionSummary, setContributionSummary] = useState<ContributionSummary | null>(null);
  const [recentActivity, setRecentActivity] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasCompletedBreakToday, setHasCompletedBreakToday] = useState(false);
  const [userXP, setUserXP] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      if (!user || !isConfigured) {
        setLoading(false);
        return;
      }

      try {
        const profile = await getCurrentUserProfile(user.id);
        setDisplayName(profile?.display_name || profile?.username || "");

        const [summaryData, moodData, contributionData, activityData, xpData] = await Promise.all([
          getUserActivitySummary(user.id),
          getWeeklyMoodSummary(user.id),
          getUserContributionSummary(user.id),
          getRecentUserActivity(user.id, 10),
          getUserXP(user.id),
        ]);

        if (summaryData.summary) setActivitySummary(summaryData.summary);
        if (moodData.summary) setMoodSummary(moodData.summary);
        if (contributionData.summary) setContributionSummary(contributionData.summary);
        if (activityData.activities) setRecentActivity(activityData.activities);
        if (xpData.userXP) setUserXP(xpData.userXP);
        
        // Check if break already completed today
        const lastBreakKey = `breakroom_last_break_${user.id}`;
        const lastBreak = localStorage.getItem(lastBreakKey);
        const today = new Date().toISOString().split('T')[0];
        setHasCompletedBreakToday(lastBreak === today);
      } catch (err) {
        console.warn("Failed to load breakroom data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user, isConfigured]);

  const handleCompleteBreak = () => {
    if (!user || hasCompletedBreakToday) return;
    
    const today = new Date().toISOString().split('T')[0];
    const lastBreakKey = `breakroom_last_break_${user.id}`;
    localStorage.setItem(lastBreakKey, today);
    setHasCompletedBreakToday(true);
    
    // Award XP for break completion
    awardXP(user.id, 'break_completed').catch(err => {
      console.warn('Failed to award break_completed XP:', err);
    });
  };

  // Show sign-in CTA for logged-out users
  if (!user) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="glass-card rounded-2xl p-8 text-center">
            <div className="mb-6">
              <Coffee className="w-16 h-16 mx-auto text-foreground/50" />
            </div>
            <h1 className="text-3xl font-display font-bold text-foreground mb-4">
              {t("myBreakroom")}
            </h1>
            <p className="text-muted-foreground mb-8">
              {t("myBreakroomSubtitle")}
            </p>
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[var(--gradient-mint)] to-[var(--gradient-lav)] text-foreground rounded-full font-semibold hover:opacity-95 transition-opacity shadow-[var(--shadow-glow)]"
            >
              {t("signIn")}
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <AppShell>
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto border-4 border-foreground/20 border-t-foreground rounded-full animate-spin mb-4"></div>
            <p className="text-muted-foreground">Loading your breakroom...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  // Show empty state for no activity
  const hasActivity = activitySummary?.breaksThisWeek > 0 || contributionSummary?.postsCreated > 0;

  if (!hasActivity) {
    return (
      <AppShell>
        <div className="max-w-6xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-display font-bold text-foreground mb-2">
              {displayName ? `Welcome back, ${displayName}` : t("myBreakroom")}
            </h1>
            <p className="text-muted-foreground">
              {t("myBreakroomSubtitle")}
            </p>
          </div>

          {/* Empty State */}
          <div className="glass-card rounded-2xl p-12 text-center">
            <Coffee className="w-20 h-20 mx-auto text-foreground/30 mb-6" />
            <h2 className="text-2xl font-display font-bold text-foreground mb-4">
              {t("noActivityYet")}
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              {t("startFirstBreak")}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/watercooler"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[var(--gradient-mint)] to-[var(--gradient-lav)] text-foreground rounded-full font-semibold hover:opacity-95 transition-opacity shadow-[var(--shadow-glow)]"
              >
                <MessageSquare className="w-4 h-4" />
                {t("openWatercooler")}
              </Link>
              <Link
                to="/submit-story"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/40 border border-white/30 text-foreground rounded-full font-semibold hover:bg-white/60 transition-all"
              >
                <FileText className="w-4 h-4" />
                {t("submitStory")}
              </Link>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  // Show full dashboard
  const getEncouragement = () => {
    if (activitySummary?.currentStreak > 0) {
      return {
        icon: <Flame className="w-6 h-6 text-orange-500" />,
        text: t("encouragementStreak").replace("{streak}", activitySummary.currentStreak.toString()),
      };
    } else if (activitySummary?.breaksThisWeek > 5) {
      return {
        icon: <TrendingUp className="w-6 h-6 text-green-500" />,
        text: t("encouragementActive"),
      };
    } else {
      return {
        icon: <Smile className="w-6 h-6 text-blue-500" />,
        text: t("encouragementLow"),
      };
    }
  };

  const encouragement = getEncouragement();

  const getActivityLabel = (activity: UserActivity) => {
    switch (activity.activity_type) {
      case "mood_checkin":
        return t("activityMoodCheckin");
      case "watercooler_post":
        return t("activityWatercoolerPost");
      case "watercooler_like":
        return t("activityWatercoolerLike");
      case "watercooler_comment":
        return t("activityWatercoolerComment");
      case "story_submission":
        return t("activityStorySubmission");
      default:
        return activity.activity_type;
    }
  };

  const formatActivityDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    if (isToday) {
      return t("today");
    }
    
    const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} ${t("days")} ago`;
    return date.toLocaleDateString();
  };

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-foreground mb-2">
            {displayName ? `Welcome back, ${displayName}` : t("myBreakroom")}
          </h1>
          <p className="text-muted-foreground">
            {t("myBreakroomSubtitle")}
          </p>
        </div>

        {/* Encouragement Card */}
        <div className="glass-card rounded-2xl p-6 mb-8 bg-gradient-to-br from-green-100/30 to-teal-100/30 border-green-200/30">
          <div className="flex items-center gap-4">
            {encouragement.icon}
            <p className="text-foreground font-medium">{encouragement.text}</p>
          </div>
        </div>

        {/* Complete Break Card */}
        <div className="mb-8">
          <div className="glass-card rounded-2xl p-6 bg-gradient-to-br from-orange-100/30 to-yellow-100/30 border-orange-200/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${hasCompletedBreakToday ? 'bg-green-500' : 'bg-orange-500'}`}>
                  {hasCompletedBreakToday ? <CheckCircle className="w-6 h-6 text-white" /> : <Zap className="w-6 h-6 text-white" />}
                </div>
                <div>
                  <h3 className="text-lg font-display font-bold text-foreground mb-1">
                    {hasCompletedBreakToday ? t("breakCompletedToday") : t("completeBreak")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {hasCompletedBreakToday ? t("comeBackTomorrow") : t("earnXpForBreak")}
                  </p>
                </div>
              </div>
              {!hasCompletedBreakToday && (
                <button
                  onClick={handleCompleteBreak}
                  className="px-6 py-3 bg-gradient-to-r from-orange-400 to-yellow-400 text-white rounded-full font-semibold hover:opacity-95 transition-opacity shadow-[var(--shadow-glow)] flex items-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  {t("completeBreak")}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* XP Summary Card */}
        <div className="mb-8">
          <div className="glass-card rounded-2xl p-6 bg-gradient-to-br from-purple-100/30 to-pink-100/30 border-purple-200/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-display font-bold text-foreground mb-1">
                    {t("yourProgress")}
                  </h3>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium text-foreground">
                      {t("level")} {userXP?.level || 1} • {userXP?.total_xp || 0} {t("xp")}
                    </span>
                  </div>
                </div>
              </div>
              <Link
                to="/rewards"
                className="px-4 py-2 bg-gradient-to-r from-purple-400 to-pink-400 text-white rounded-full text-sm font-semibold hover:opacity-95 transition-opacity shadow-[var(--shadow-glow)] flex items-center gap-2"
              >
                {t("viewRewards")}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Weekly Snapshot Cards */}
        <div className="mb-8">
          <h2 className="text-2xl font-display font-bold text-foreground mb-4">
            {t("weeklySnapshot")}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="glass-card rounded-xl p-4 text-center">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold text-foreground">{activitySummary?.breaksThisWeek || 0}</p>
              <p className="text-xs text-muted-foreground">{t("breaksThisWeek")}</p>
            </div>
            <div className="glass-card rounded-xl p-4 text-center">
              <Smile className="w-8 h-8 mx-auto mb-2 text-purple-500" />
              <p className="text-2xl font-bold text-foreground">{activitySummary?.moodCheckins || 0}</p>
              <p className="text-xs text-muted-foreground">{t("moodCheckins")}</p>
            </div>
            <div className="glass-card rounded-xl p-4 text-center">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold text-foreground">{activitySummary?.watercoolerContributions || 0}</p>
              <p className="text-xs text-muted-foreground">{t("watercoolerContributions")}</p>
            </div>
            <div className="glass-card rounded-xl p-4 text-center">
              <FileText className="w-8 h-8 mx-auto mb-2 text-orange-500" />
              <p className="text-2xl font-bold text-foreground">{activitySummary?.storiesSubmitted || 0}</p>
              <p className="text-xs text-muted-foreground">{t("storiesSubmitted")}</p>
            </div>
            <div className="glass-card rounded-xl p-4 text-center">
              <Flame className="w-8 h-8 mx-auto mb-2 text-red-500" />
              <p className="text-2xl font-bold text-foreground">{activitySummary?.currentStreak || 0}</p>
              <p className="text-xs text-muted-foreground">{t("currentStreak")}</p>
            </div>
          </div>
        </div>

        {/* Mood Summary */}
        <div className="mb-8">
          <h2 className="text-2xl font-display font-bold text-foreground mb-4">
            {t("moodSummary")}
          </h2>
          <div className="glass-card rounded-xl p-6">
            <div className="grid grid-cols-5 gap-4">
              <div className="text-center">
                <div className="h-24 bg-blue-100 rounded-lg mb-2 flex items-end justify-center pb-2">
                  <div 
                    className="bg-blue-500 rounded-t transition-all" 
                    style={{ height: `${Math.min((moodSummary?.calm || 0) * 20, 100)}%`, width: '60%' }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Calm</p>
                <p className="text-sm font-bold text-foreground">{moodSummary?.calm || 0}</p>
              </div>
              <div className="text-center">
                <div className="h-24 bg-purple-100 rounded-lg mb-2 flex items-end justify-center pb-2">
                  <div 
                    className="bg-purple-500 rounded-t transition-all" 
                    style={{ height: `${Math.min((moodSummary?.focus || 0) * 20, 100)}%`, width: '60%' }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Focus</p>
                <p className="text-sm font-bold text-foreground">{moodSummary?.focus || 0}</p>
              </div>
              <div className="text-center">
                <div className="h-24 bg-yellow-100 rounded-lg mb-2 flex items-end justify-center pb-2">
                  <div 
                    className="bg-yellow-500 rounded-t transition-all" 
                    style={{ height: `${Math.min((moodSummary?.happy || 0) * 20, 100)}%`, width: '60%' }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Happy</p>
                <p className="text-sm font-bold text-foreground">{moodSummary?.happy || 0}</p>
              </div>
              <div className="text-center">
                <div className="h-24 bg-red-100 rounded-lg mb-2 flex items-end justify-center pb-2">
                  <div 
                    className="bg-red-500 rounded-t transition-all" 
                    style={{ height: `${Math.min((moodSummary?.energize || 0) * 20, 100)}%`, width: '60%' }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Energize</p>
                <p className="text-sm font-bold text-foreground">{moodSummary?.energize || 0}</p>
              </div>
              <div className="text-center">
                <div className="h-24 bg-teal-100 rounded-lg mb-2 flex items-end justify-center pb-2">
                  <div 
                    className="bg-teal-500 rounded-t transition-all" 
                    style={{ height: `${Math.min((moodSummary?.reflect || 0) * 20, 100)}%`, width: '60%' }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Reflect</p>
                <p className="text-sm font-bold text-foreground">{moodSummary?.reflect || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Your Contributions */}
        <div className="mb-8">
          <h2 className="text-2xl font-display font-bold text-foreground mb-4">
            {t("yourContributions")}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="glass-card rounded-xl p-4 text-center">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold text-foreground">{contributionSummary?.postsCreated || 0}</p>
              <p className="text-xs text-muted-foreground">{t("postsCreated")}</p>
            </div>
            <div className="glass-card rounded-xl p-4 text-center">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold text-foreground">{contributionSummary?.repliesWritten || 0}</p>
              <p className="text-xs text-muted-foreground">{t("repliesWritten")}</p>
            </div>
            <div className="glass-card rounded-xl p-4 text-center">
              <Heart className="w-8 h-8 mx-auto mb-2 text-red-500" />
              <p className="text-2xl font-bold text-foreground">{contributionSummary?.postsLiked || 0}</p>
              <p className="text-xs text-muted-foreground">{t("postsLiked")}</p>
            </div>
            <div className="glass-card rounded-xl p-4 text-center">
              <FileText className="w-8 h-8 mx-auto mb-2 text-orange-500" />
              <p className="text-2xl font-bold text-foreground">{contributionSummary?.storiesSubmitted || 0}</p>
              <p className="text-xs text-muted-foreground">{t("storiesSubmitted")}</p>
            </div>
            <div className="glass-card rounded-xl p-4 text-center">
              <FileText className="w-8 h-8 mx-auto mb-2 text-purple-500" />
              <p className="text-2xl font-bold text-foreground">{contributionSummary?.draftsSaved || 0}</p>
              <p className="text-xs text-muted-foreground">{t("draftsSaved")}</p>
            </div>
          </div>
        </div>

        {/* Recent Activity Timeline */}
        <div className="mb-8">
          <h2 className="text-2xl font-display font-bold text-foreground mb-4">
            {t("recentActivity")}
          </h2>
          <div className="glass-card rounded-xl p-6">
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-4 pb-4 border-b border-white/20 last:border-0 last:pb-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[var(--gradient-mint)] to-[var(--gradient-lav)] flex items-center justify-center flex-shrink-0">
                      <Zap className="w-5 h-5 text-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground font-medium">{getActivityLabel(activity)}</p>
                      <p className="text-xs text-muted-foreground">{formatActivityDate(activity.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">{t("noActivityYet")}</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground mb-4">
            {t("quickActions")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Link
              to="/watercooler"
              className="glass-card rounded-xl p-4 hover:bg-white/40 transition-all group"
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="w-6 h-6 text-blue-500" />
                <div className="flex-1">
                  <p className="text-foreground font-medium">{t("openWatercooler")}</p>
                  <p className="text-xs text-muted-foreground">Chat with the community</p>
                </div>
                <ArrowRight className="w-4 h-4 text-foreground/30 group-hover:text-foreground transition-colors" />
              </div>
            </Link>
            <Link
              to="/submit-story"
              className="glass-card rounded-xl p-4 hover:bg-white/40 transition-all group"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-orange-500" />
                <div className="flex-1">
                  <p className="text-foreground font-medium">{t("submitStory")}</p>
                  <p className="text-xs text-muted-foreground">Share your story</p>
                </div>
                <ArrowRight className="w-4 h-4 text-foreground/30 group-hover:text-foreground transition-colors" />
              </div>
            </Link>
            <Link
              to="/"
              className="glass-card rounded-xl p-4 hover:bg-white/40 transition-all group"
            >
              <div className="flex items-center gap-3">
                <Coffee className="w-6 h-6 text-green-500" />
                <div className="flex-1">
                  <p className="text-foreground font-medium">{t("startCalmBreak")}</p>
                  <p className="text-xs text-muted-foreground">Relax and recharge</p>
                </div>
                <ArrowRight className="w-4 h-4 text-foreground/30 group-hover:text-foreground transition-colors" />
              </div>
            </Link>
            <Link
              to="/watercooler"
              className="glass-card rounded-xl p-4 hover:bg-white/40 transition-all group"
            >
              <div className="flex items-center gap-3">
                <Target className="w-6 h-6 text-purple-500" />
                <div className="flex-1">
                  <p className="text-foreground font-medium">{t("writeTinyWin")}</p>
                  <p className="text-xs text-muted-foreground">Celebrate small wins</p>
                </div>
                <ArrowRight className="w-4 h-4 text-foreground/30 group-hover:text-foreground transition-colors" />
              </div>
            </Link>
            <Link
              to="/my-submissions"
              className="glass-card rounded-xl p-4 hover:bg-white/40 transition-all group"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-teal-500" />
                <div className="flex-1">
                  <p className="text-foreground font-medium">{t("viewMySubmissions")}</p>
                  <p className="text-xs text-muted-foreground">See your stories</p>
                </div>
                <ArrowRight className="w-4 h-4 text-foreground/30 group-hover:text-foreground transition-colors" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
