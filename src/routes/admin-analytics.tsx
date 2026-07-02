import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useLanguage } from "@/lib/language";
import { useAuth } from "@/lib/auth";
import { useState, useEffect, useMemo } from "react";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import {
  isAdminUser,
  getAdminOverviewMetrics,
  getEngagementMetrics,
  getContentMetrics,
  getGameMetrics,
  getRewardsMetrics,
  getRecentActivity,
  getTopUsersByXP,
  getTopWatercoolerPosts,
  AdminOverviewMetrics,
  AdminEngagementMetrics,
  AdminContentMetrics,
  AdminGameMetrics,
  AdminRewardsMetrics,
  AdminRecentActivity,
  AdminTopUser,
  AdminTopWatercoolerPost,
} from "@/lib/adminAnalytics";
import {
  Users,
  Activity,
  BookOpen,
  MessageSquare,
  Gamepad2,
  Trophy,
  Shield,
  Bell,
  TrendingUp,
  Clock,
  ArrowRight,
  BarChart3,
} from "lucide-react";

export const Route = createFileRoute("/admin-analytics")({
  head: () => ({
    meta: [
      { title: "Admin Analytics | The Digital Breakroom" },
      { name: "description", content: "Track users, engagement, games, rewards, and moderation." },
    ],
  }),
  component: AdminAnalyticsPage,
});

function AdminAnalyticsPage() {
  const { t } = useLanguage();
  const { user, loading, isConfigured } = useAuth();
  const isAdmin = user && isAdminUser(user.email);

  const [overview, setOverview] = useState<AdminOverviewMetrics | null>(null);
  const [engagement, setEngagement] = useState<AdminEngagementMetrics | null>(null);
  const [content, setContent] = useState<AdminContentMetrics | null>(null);
  const [games, setGames] = useState<AdminGameMetrics | null>(null);
  const [rewards, setRewards] = useState<AdminRewardsMetrics | null>(null);
  const [recentActivity, setRecentActivity] = useState<AdminRecentActivity[]>([]);
  const [topUsers, setTopUsers] = useState<AdminTopUser[]>([]);
  const [topPosts, setTopPosts] = useState<AdminTopWatercoolerPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin) {
      loadAnalytics();
    }
  }, [isAdmin]);

  async function loadAnalytics() {
    setIsLoading(true);
    setLoadError(null);

    try {
      const [
        overviewRes,
        engagementRes,
        contentRes,
        gamesRes,
        rewardsRes,
        activityRes,
        topUsersRes,
        topPostsRes,
      ] = await Promise.all([
        getAdminOverviewMetrics(),
        getEngagementMetrics(),
        getContentMetrics(),
        getGameMetrics(),
        getRewardsMetrics(),
        getRecentActivity(20),
        getTopUsersByXP(10),
        getTopWatercoolerPosts(10),
      ]);

      if (overviewRes.error) setLoadError(overviewRes.error);
      if (engagementRes.error && !loadError) setLoadError(engagementRes.error);

      setOverview(overviewRes.metrics);
      setEngagement(engagementRes.metrics);
      setContent(contentRes.metrics);
      setGames(gamesRes.metrics);
      setRewards(rewardsRes.metrics);
      setRecentActivity(activityRes.activity);
      setTopUsers(topUsersRes.users);
      setTopPosts(topPostsRes.posts);
    } catch (err) {
      console.error("[admin-analytics] load failed:", err);
      setLoadError("Could not load analytics data.");
    } finally {
      setIsLoading(false);
    }
  }

  const formatNumber = (n: number) => {
    return new Intl.NumberFormat().format(n || 0);
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "watercooler_post":
        return <MessageSquare className="h-4 w-4" />;
      case "story_submission":
        return <BookOpen className="h-4 w-4" />;
      case "game_result":
        return <Gamepad2 className="h-4 w-4" />;
      case "xp_event":
        return <Trophy className="h-4 w-4" />;
      case "notification":
        return <Bell className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  if (!isConfigured) {
    return (
      <AppShell>
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="glass-card rounded-2xl p-8 text-center">
            <h1 className="text-2xl font-display font-bold text-foreground mb-4">
              Setup Required
            </h1>
            <p className="text-muted-foreground mb-6">{t("supabaseNotConfigured")}</p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[var(--gradient-mint)] to-[var(--gradient-lav)] text-foreground rounded-full font-semibold hover:opacity-95 transition-opacity shadow-[var(--shadow-glow)]"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  if (loading) {
    return (
      <AppShell>
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="mb-8">
            <h1 className="text-4xl font-display font-bold text-foreground mb-2">{t("adminAnalytics")}</h1>
            <p className="text-lg text-muted-foreground">{t("adminAnalyticsSubtitle")}</p>
          </div>
          <LoadingState rows={4} />
        </div>
      </AppShell>
    );
  }

  if (!user) {
    return (
      <AppShell>
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="glass-card rounded-2xl p-8 text-center">
            <h1 className="text-3xl font-display font-bold text-foreground mb-4">
              {t("adminSignInRequired")}
            </h1>
            <p className="text-muted-foreground mb-6">{t("adminOnlyArea")}</p>
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

  if (!isAdmin) {
    return (
      <AppShell>
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="glass-card rounded-2xl p-8 text-center">
            <h1 className="text-3xl font-display font-bold text-foreground mb-4">{t("accessDenied")}</h1>
            <p className="text-muted-foreground mb-6">{t("adminOnly")}</p>
            <Link
              to="/account"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[var(--gradient-mint)] to-[var(--gradient-lav)] text-foreground rounded-full font-semibold hover:opacity-95 transition-opacity shadow-[var(--shadow-glow)]"
            >
              Back to Account
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-display font-bold text-foreground mb-4">{t("adminAnalytics")}</h1>
          <p className="text-lg text-muted-foreground">{t("adminAnalyticsSubtitle")}</p>
        </div>

        {/* Error */}
        {loadError && (
          <div className="glass-card rounded-2xl p-4 mb-6 bg-gradient-to-br from-red-100/30 to-orange-100/30 border-red-200/30">
            <p className="text-sm text-red-700 text-center">{loadError}</p>
          </div>
        )}

        {/* Loading overlay */}
        {isLoading && <LoadingState rows={2} className="mb-6" />}

        {/* Overview KPI Grid */}
        <section className="mb-10">
          <h2 className="text-2xl font-display font-bold text-foreground mb-4 flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            {t("overview")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              icon={<Users className="h-5 w-5" />}
              label={t("totalUsers")}
              value={formatNumber(overview?.totalUsers || 0)}
              sub={t("activeToday") + ": " + formatNumber(overview?.usersCreatedToday || 0)}
              color="from-blue-100/30 to-indigo-100/30"
            />
            <KpiCard
              icon={<MessageSquare className="h-5 w-5" />}
              label={t("watercoolerPosts")}
              value={formatNumber(overview?.totalWatercoolerPosts || 0)}
              sub={t("usersThisWeek") + ": " + formatNumber(overview?.usersCreatedThisWeek || 0)}
              color="from-cyan-100/30 to-blue-100/30"
            />
            <KpiCard
              icon={<BookOpen className="h-5 w-5" />}
              label={t("stories")}
              value={formatNumber(overview?.totalStories || 0)}
              sub={""}
              color="from-orange-100/30 to-amber-100/30"
            />
            <KpiCard
              icon={<Activity className="h-5 w-5" />}
              label={t("messages")}
              value={formatNumber(overview?.totalMessages || 0)}
              sub={""}
              color="from-green-100/30 to-teal-100/30"
            />
            <KpiCard
              icon={<Gamepad2 className="h-5 w-5" />}
              label={t("gamesPlayed")}
              value={formatNumber(overview?.totalGamesFinished || 0)}
              sub={""}
              color="from-purple-100/30 to-violet-100/30"
            />
            <KpiCard
              icon={<Trophy className="h-5 w-5" />}
              label={t("xpAwarded")}
              value={formatNumber(overview?.totalXpAwarded || 0)}
              sub={""}
              color="from-yellow-100/30 to-orange-100/30"
            />
            <KpiCard
              icon={<TrendingUp className="h-5 w-5" />}
              label={t("badgesEarned")}
              value={formatNumber(overview?.totalNotifications || 0)}
              sub={""}
              color="from-pink-100/30 to-rose-100/30"
            />
            <KpiCard
              icon={<Bell className="h-5 w-5" />}
              label={t("notifications")}
              value={formatNumber(overview?.totalNotifications || 0)}
              sub={"Unread: " + formatNumber(overview?.unreadNotifications || 0)}
              color="from-red-100/30 to-pink-100/30"
            />
          </div>
        </section>

        {/* Engagement & Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          {/* Engagement */}
          <section className="glass-card rounded-2xl p-6">
            <h2 className="text-xl font-display font-bold text-foreground mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5" />
              {t("engagement")}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <MetricItem label={t("moodCheckIns")} value={formatNumber(engagement?.moodCheckIns || 0)} />
              <MetricItem label={t("breakActivities")} value={formatNumber(engagement?.breakActivities || 0)} />
              <MetricItem label={t("watercoolerComments")} value={formatNumber(engagement?.watercoolerComments || 0)} />
              <MetricItem label={t("likes")} value={formatNumber(engagement?.likes || 0)} />
              <MetricItem label={t("friendRequests")} value={formatNumber(engagement?.friendRequests || 0)} />
              <MetricItem label={t("friendships")} value={formatNumber(engagement?.friendships || 0)} />
              <MetricItem label={t("messages")} value={formatNumber(engagement?.messagesSent || 0)} />
              <MetricItem label={t("gamesPlayed")} value={formatNumber(engagement?.gamesPlayed || 0)} />
              <MetricItem label={t("xpAwarded")} value={formatNumber(engagement?.rewardsEvents || 0)} />
            </div>
          </section>

          {/* Content & Moderation */}
          <section className="glass-card rounded-2xl p-6">
            <h2 className="text-xl font-display font-bold text-foreground mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {t("contentModeration")}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
              <MetricItem label={t("pendingStories")} value={formatNumber(content?.pendingStories || 0)} />
              <MetricItem label={t("approvedStories")} value={formatNumber(content?.approvedStories || 0)} />
              <MetricItem label={t("rejectedStories")} value={formatNumber(content?.rejectedStories || 0)} />
              <MetricItem label={t("watercoolerPosts")} value={formatNumber(content?.watercoolerPosts || 0)} />
              <MetricItem label={t("reportedPosts")} value={formatNumber(content?.reportsPending || 0)} />
              <MetricItem label={"Media Posts"} value={formatNumber(content?.mediaPosts || 0)} />
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/admin-submissions"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-400 to-red-400 text-white rounded-full text-sm font-semibold hover:opacity-95 transition-opacity"
              >
                {t("storyModeration")} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/admin-watercooler"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-400 to-blue-400 text-white rounded-full text-sm font-semibold hover:opacity-95 transition-opacity"
              >
                {t("watercoolerModeration")} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>
        </div>

        {/* Games & Rewards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          {/* Games */}
          <section className="glass-card rounded-2xl p-6">
            <h2 className="text-xl font-display font-bold text-foreground mb-4 flex items-center gap-2">
              <Gamepad2 className="h-5 w-5" />
              {t("gamesAnalytics")}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <MetricItem label={t("waitingRooms")} value={formatNumber(games?.roomsWaiting || 0)} />
              <MetricItem label={t("activeRooms")} value={formatNumber(games?.roomsActive || 0)} />
              <MetricItem label={t("finishedGames")} value={formatNumber(games?.roomsFinished || 0)} />
              <MetricItem label={t("pendingInvites")} value={formatNumber(games?.invitesPending || 0)} />
              <MetricItem label={"Invites Accepted"} value={formatNumber(games?.invitesAccepted || 0)} />
              <MetricItem label={"Results"} value={formatNumber(games?.gameResults || 0)} />
              <MetricItem label={"Wins"} value={formatNumber(games?.wins || 0)} />
              <MetricItem label={"Draws"} value={formatNumber(games?.draws || 0)} />
            </div>
          </section>

          {/* Rewards */}
          <section className="glass-card rounded-2xl p-6">
            <h2 className="text-xl font-display font-bold text-foreground mb-4 flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              {t("rewardsAnalytics")}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <MetricItem label={t("xpAwarded")} value={formatNumber(rewards?.totalXpEvents || 0)} />
              <MetricItem label={t("badgesEarned")} value={formatNumber(rewards?.totalBadgesEarned || 0)} />
              <MetricItem label={"Users with XP"} value={formatNumber(rewards?.usersWithXp || 0)} />
              <MetricItem label={t("averageLevel")} value={formatNumber(rewards?.averageLevel || 0)} />
              <MetricItem label={t("topLevel")} value={formatNumber(rewards?.topLevel || 0)} />
              <MetricItem label={"Weekly XP"} value={formatNumber(rewards?.totalWeeklyXp || 0)} />
            </div>
          </section>
        </div>

        {/* Top Users by XP */}
        <section className="mb-10">
          <h2 className="text-2xl font-display font-bold text-foreground mb-4 flex items-center gap-2">
            <Trophy className="h-6 w-6" />
            {t("topUsers")}
          </h2>
          <div className="glass-card rounded-2xl overflow-hidden">
            {topUsers.length === 0 ? (
              <EmptyState icon={Trophy} title="No user data available" subtitle="Users will appear here once they earn XP." />
            ) : (
              <div className="divide-y divide-border/30">
                {topUsers.map((u, index) => (
                  <div key={u.user_id} className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors">
                    <div className="w-8 text-center font-bold text-muted-foreground">{index + 1}</div>
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[var(--gradient-mint)] to-[var(--gradient-lav)] flex items-center justify-center text-foreground font-bold">
                      {u.display_name ? u.display_name.charAt(0).toUpperCase() : "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">
                        {u.display_name || u.username || "Anonymous"}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {u.username ? `@${u.username}` : "No username"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">Lv. {u.level}</p>
                      <p className="text-sm text-muted-foreground">{formatNumber(u.total_xp)} XP</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Top Watercooler Posts */}
        <section className="mb-10">
          <h2 className="text-2xl font-display font-bold text-foreground mb-4 flex items-center gap-2">
            <MessageSquare className="h-6 w-6" />
            Top Watercooler Posts
          </h2>
          <div className="glass-card rounded-2xl overflow-hidden">
            {topPosts.length === 0 ? (
              <EmptyState icon={MessageSquare} title="No watercooler posts available" subtitle="Posts will appear here once the community starts sharing." />
            ) : (
              <div className="divide-y divide-border/30">
                {topPosts.map((p) => (
                  <div key={p.id} className="p-4 hover:bg-white/5 transition-colors">
                    <p className="text-foreground mb-2 line-clamp-2">{p.body}</p>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between text-sm text-muted-foreground gap-1">
                      <span className="truncate">{p.nickname || "Anonymous"}</span>
                      <span className="flex items-center gap-3 flex-wrap">
                        <span className="flex items-center gap-1">{formatNumber(p.likes_count)} likes</span>
                        <span className="flex items-center gap-1">{formatNumber(p.comments_count)} comments</span>
                        <span>{formatDate(p.created_at)}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Recent Activity */}
        <section className="mb-10">
          <h2 className="text-2xl font-display font-bold text-foreground mb-4 flex items-center gap-2">
            <Clock className="h-6 w-6" />
            {t("recentActivity")}
          </h2>
          <div className="glass-card rounded-2xl overflow-hidden">
            {recentActivity.length === 0 ? (
              <EmptyState icon={Clock} title="No recent activity" subtitle="Activity will appear here as users interact with the app." />
            ) : (
              <div className="divide-y divide-border/30">
                {recentActivity.map((a) => (
                  <div key={`${a.type}-${a.id}`} className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors">
                    <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-muted-foreground">
                      {getActivityIcon(a.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground truncate">{a.title}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(a.created_at)}</p>
                    </div>
                    {a.link_path && (
                      <Link
                        to={a.link_path}
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        View <ArrowRight className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="text-2xl font-display font-bold text-foreground mb-4">{t("quickActions")}</h2>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/admin-submissions"
              className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-orange-400 to-red-400 text-white rounded-full font-semibold hover:opacity-95 transition-opacity"
            >
              <Shield className="h-4 w-4" />
              {t("storyModeration")}
            </Link>
            <Link
              to="/admin-watercooler"
              className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-cyan-400 to-blue-400 text-white rounded-full font-semibold hover:opacity-95 transition-opacity"
            >
              <Shield className="h-4 w-4" />
              {t("watercoolerModeration")}
            </Link>
            <Link
              to="/rewards"
              className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-full font-semibold hover:opacity-95 transition-opacity"
            >
              <Trophy className="h-4 w-4" />
              {t("rewards")}
            </Link>
            <Link
              to="/notifications"
              className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-pink-400 to-red-400 text-white rounded-full font-semibold hover:opacity-95 transition-opacity"
            >
              <Bell className="h-4 w-4" />
              {t("notifications")}
            </Link>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function KpiCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <div className={`glass-card rounded-2xl p-4 sm:p-5 bg-gradient-to-br ${color} border-white/20`}>
      <div className="flex items-center gap-2 mb-2 sm:mb-3 text-muted-foreground">
        {icon}
        <span className="text-xs sm:text-sm font-medium line-clamp-1">{label}</span>
      </div>
      <div className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-1">{value}</div>
      {sub && <div className="text-xs sm:text-sm text-muted-foreground line-clamp-1">{sub}</div>}
    </div>
  );
}

function MetricItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/5 p-3">
      <div className="text-xl sm:text-2xl font-display font-bold text-foreground mb-1">{value}</div>
      <div className="text-xs sm:text-sm text-muted-foreground line-clamp-1">{label}</div>
    </div>
  );
}
