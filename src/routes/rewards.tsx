import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useLanguage } from "@/lib/language";
import { useAuth } from "@/lib/auth";
import { useState, useEffect } from "react";
import { 
  getUserXP, 
  getUserBadges, 
  getBadgeDefinitions, 
  getRecentXPEvents, 
  getLeaderboard, 
  getFriendLeaderboard,
  type UserXP,
  type UserBadge,
  type Badge,
  type XPEvent,
  type LeaderboardEntry 
} from "@/lib/gamification";
import { getCurrentUserProfile, getDisplayName } from "@/lib/profiles";
import { Trophy, Star, Flame, TrendingUp, MessageSquare, Gamepad2, FileText, Coffee, Smile, Users, Zap, Award, Lock, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/rewards")({
  head: () => ({
    meta: [
      { title: "Rewards & Progress | The Digital Breakroom" },
      { name: "description", content: "Earn XP for healthy breaks, social moments, and games." },
    ],
  }),
  component: RewardsPage,
});

function RewardsPage() {
  const { t } = useLanguage();
  const { user, isConfigured } = useAuth();
  const [userXP, setUserXP] = useState<UserXP | null>(null);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [ recentXPEvents, setRecentXPEvents] = useState<XPEvent[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardType, setLeaderboardType] = useState<'weekly' | 'all_time' | 'friends'>('weekly');
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user || !isConfigured) {
        setLoading(false);
        return;
      }

      try {
        const profileData = await getCurrentUserProfile(user.id);
        setProfile(profileData);

        const [xpData, badgesData, allBadgesData, eventsData] = await Promise.all([
          getUserXP(user.id),
          getUserBadges(user.id),
          getBadgeDefinitions(),
          getRecentXPEvents(user.id, 10),
        ]);

        if (xpData.userXP) setUserXP(xpData.userXP);
        if (badgesData.userBadges) setUserBadges(badgesData.userBadges);
        if (allBadgesData.badges) setAllBadges(allBadgesData.badges);
        if (eventsData.events) setRecentXPEvents(eventsData.events);

        // Load initial leaderboard
        const leaderboardData = await getLeaderboard('weekly', 20);
        if (leaderboardData.leaderboard) setLeaderboard(leaderboardData.leaderboard);
      } catch (err) {
        console.warn("Failed to load rewards data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user, isConfigured]);

  useEffect(() => {
    async function loadLeaderboard() {
      if (!user) return;

      let data;
      if (leaderboardType === 'friends') {
        data = await getFriendLeaderboard(user.id, 'weekly', 20);
      } else {
        data = await getLeaderboard(leaderboardType, 20);
      }

      if (data.leaderboard) setLeaderboard(data.leaderboard);
    }

    loadLeaderboard();
  }, [leaderboardType, user]);

  // Show sign-in CTA for logged-out users
  if (!user) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="glass-card rounded-2xl p-8 text-center">
            <div className="mb-6">
              <Trophy className="w-16 h-16 mx-auto text-foreground/50" />
            </div>
            <h1 className="text-3xl font-display font-bold text-foreground mb-4">
              {t("rewards")}
            </h1>
            <p className="text-muted-foreground mb-8">
              {t("rewardsSubtitle")}
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
            <p className="text-muted-foreground">Loading rewards...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  const earnedBadgeKeys = new Set(userBadges.map(ub => ub.badge.badge_key));
  const earnedBadges = allBadges.filter(b => earnedBadgeKeys.has(b.badge_key));
  const lockedBadges = allBadges.filter(b => !earnedBadgeKeys.has(b.badge_key));

  const getXPProgress = () => {
    if (!userXP) return 0;
    const xpForCurrentLevel = (userXP.level - 1) * 100;
    const xpForNextLevel = userXP.level * 100;
    const progress = ((userXP.total_xp - xpForCurrentLevel) / 100) * 100;
    return Math.min(progress, 100);
  };

  const getXPToNextLevel = () => {
    if (!userXP) return 100;
    const xpForNextLevel = userXP.level * 100;
    return xpForNextLevel - userXP.total_xp;
  };

  const formatEventTime = (dateString: string) => {
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

  const getEventLabel = (eventType: string) => {
    const labels: Record<string, string> = {
      mood_check_in: t("moodCheckin"),
      watercooler_post: t("watercoolerPost"),
      watercooler_comment: t("watercoolerComment"),
      story_submitted: t("storySubmitted"),
      game_played: t("gamePlayed"),
      game_won: t("gameWon"),
      game_draw: t("gameDraw"),
      friend_added: t("friendAdded"),
      message_sent: t("messageSent"),
      break_completed: t("breakCompleted"),
    };
    return labels[eventType] || eventType;
  };

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-foreground mb-2">
            {t("rewards")}
          </h1>
          <p className="text-muted-foreground">
            {t("rewardsSubtitle")}
          </p>
        </div>

        {/* XP Summary Card */}
        <div className="glass-card rounded-2xl p-6 mb-8 bg-gradient-to-br from-purple-100/30 to-pink-100/30 border-purple-200/30">
          <div className="flex items-center gap-6 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-3xl">
              {profile?.avatar_url || '👤'}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-display font-bold text-foreground mb-1">
                {getDisplayName(profile, user.email)}
              </h2>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <span className="text-lg font-semibold text-foreground">
                  {t("level")} {userXP?.level || 1}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-white/30 rounded-xl">
              <p className="text-3xl font-bold text-foreground">{userXP?.total_xp || 0}</p>
              <p className="text-sm text-muted-foreground">{t("totalXp")}</p>
            </div>
            <div className="text-center p-4 bg-white/30 rounded-xl">
              <p className="text-3xl font-bold text-foreground">{userXP?.weekly_xp || 0}</p>
              <p className="text-sm text-muted-foreground">{t("weeklyXp")}</p>
            </div>
            <div className="text-center p-4 bg-white/30 rounded-xl">
              <Flame className="w-6 h-6 mx-auto mb-2 text-orange-500" />
              <p className="text-3xl font-bold text-foreground">{userXP?.current_streak || 0}</p>
              <p className="text-sm text-muted-foreground">{t("currentStreak")}</p>
            </div>
            <div className="text-center p-4 bg-white/30 rounded-xl">
              <TrendingUp className="w-6 h-6 mx-auto mb-2 text-green-500" />
              <p className="text-3xl font-bold text-foreground">{userXP?.longest_streak || 0}</p>
              <p className="text-sm text-muted-foreground">{t("longestStreak")}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-2">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">{t("progress")}</span>
              <span className="text-foreground font-medium">{getXPToNextLevel()} {t("xpToNextLevel")}</span>
            </div>
            <div className="h-3 bg-white/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-400 to-pink-400 transition-all duration-500"
                style={{ width: `${getXPProgress()}%` }}
              />
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="mb-8">
          <h2 className="text-2xl font-display font-bold text-foreground mb-4">
            {t("badges")}
          </h2>
          
          {/* Earned Badges */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-3">{t("earnedBadges")}</h3>
            {earnedBadges.length === 0 ? (
              <div className="glass-card rounded-xl p-6 text-center">
                <Award className="w-12 h-12 mx-auto text-foreground/30 mb-3" />
                <p className="text-muted-foreground">{t("noBadgesYet")}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {earnedBadges.map(badge => (
                  <div key={badge.id} className="glass-card rounded-xl p-4 text-center bg-gradient-to-br from-yellow-100/30 to-orange-100/30 border-yellow-200/30">
                    <div className="text-4xl mb-2">{badge.icon}</div>
                    <p className="font-semibold text-foreground text-sm">{badge.name}</p>
                    <p className="text-xs text-muted-foreground">{badge.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Locked Badges */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">{t("lockedBadges")}</h3>
            {lockedBadges.length === 0 ? (
              <p className="text-muted-foreground">{t("allBadgesUnlocked")}</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {lockedBadges.map(badge => (
                  <div key={badge.id} className="glass-card rounded-xl p-4 text-center bg-white/20 border-white/30 opacity-60">
                    <div className="text-4xl mb-2 grayscale">{badge.icon}</div>
                    <p className="font-semibold text-foreground text-sm">{badge.name}</p>
                    <p className="text-xs text-muted-foreground">{badge.description}</p>
                    <Lock className="w-4 h-4 mx-auto mt-2 text-muted-foreground" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent XP Activity */}
        <div className="mb-8">
          <h2 className="text-2xl font-display font-bold text-foreground mb-4">
            {t("recentXpActivity")}
          </h2>
          <div className="glass-card rounded-xl p-6">
            {recentXPEvents.length === 0 ? (
              <p className="text-muted-foreground text-center">{t("noXpActivityYet")}</p>
            ) : (
              <div className="space-y-3">
                {recentXPEvents.map(event => (
                  <div key={event.id} className="flex items-center justify-between p-3 bg-white/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Zap className="w-5 h-5 text-yellow-500" />
                      <div>
                        <p className="font-medium text-foreground">{getEventLabel(event.event_type)}</p>
                        <p className="text-xs text-muted-foreground">{formatEventTime(event.created_at)}</p>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-green-600">+{event.xp_amount} XP</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="mb-8">
          <h2 className="text-2xl font-display font-bold text-foreground mb-4">
            {t("leaderboard")}
          </h2>
          
          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setLeaderboardType('weekly')}
              className={`px-4 py-2 rounded-full font-medium transition-all ${
                leaderboardType === 'weekly'
                  ? 'bg-gradient-to-r from-purple-400 to-pink-400 text-white'
                  : 'bg-white/30 text-muted-foreground hover:bg-white/40'
              }`}
            >
              {t("weekly")}
            </button>
            <button
              onClick={() => setLeaderboardType('all_time')}
              className={`px-4 py-2 rounded-full font-medium transition-all ${
                leaderboardType === 'all_time'
                  ? 'bg-gradient-to-r from-purple-400 to-pink-400 text-white'
                  : 'bg-white/30 text-muted-foreground hover:bg-white/40'
              }`}
            >
              {t("allTime")}
            </button>
            <button
              onClick={() => setLeaderboardType('friends')}
              className={`px-4 py-2 rounded-full font-medium transition-all ${
                leaderboardType === 'friends'
                  ? 'bg-gradient-to-r from-purple-400 to-pink-400 text-white'
                  : 'bg-white/30 text-muted-foreground hover:bg-white/40'
              }`}
            >
              {t("friends")}
            </button>
          </div>

          <div className="glass-card rounded-xl p-6">
            {leaderboard.length === 0 ? (
              <p className="text-muted-foreground text-center">{t("noLeaderboardData")}</p>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((entry, index) => {
                  const isCurrentUser = entry.user_id === user.id;
                  return (
                    <div 
                      key={entry.user_id}
                      className={`flex items-center gap-4 p-3 rounded-lg ${
                        isCurrentUser ? 'bg-gradient-to-r from-purple-100/50 to-pink-100/50 border border-purple-200/50' : 'bg-white/20'
                      }`}
                    >
                      <span className="w-8 text-center font-bold text-foreground">#{index + 1}</span>
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-lg">
                        {entry.avatar_url || '👤'}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{entry.display_name || entry.username || 'Anonymous'}</p>
                        <p className="text-xs text-muted-foreground">{t("level")} {entry.level}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-foreground">{leaderboardType === 'weekly' ? entry.weekly_xp : entry.total_xp} XP</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* CTA Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/watercooler"
            className="glass-card rounded-xl p-6 bg-gradient-to-br from-blue-100/30 to-cyan-100/30 border-blue-200/30 hover:opacity-95 transition-opacity"
          >
            <div className="flex items-center gap-4">
              <MessageSquare className="w-8 h-8 text-blue-500" />
              <div>
                <h3 className="font-bold text-foreground">{t("postOnWatercooler")}</h3>
                <p className="text-sm text-muted-foreground">{t("earnXpForPosts")}</p>
              </div>
              <ArrowRight className="w-5 h-5 text-foreground ml-auto" />
            </div>
          </Link>

          <Link
            to="/games-multiplayer"
            className="glass-card rounded-xl p-6 bg-gradient-to-br from-orange-100/30 to-yellow-100/30 border-orange-200/30 hover:opacity-95 transition-opacity"
          >
            <div className="flex items-center gap-4">
              <Gamepad2 className="w-8 h-8 text-orange-500" />
              <div>
                <h3 className="font-bold text-foreground">{t("playMultiplayer")}</h3>
                <p className="text-sm text-muted-foreground">{t("earnXpForGames")}</p>
              </div>
              <ArrowRight className="w-5 h-5 text-foreground ml-auto" />
            </div>
          </Link>

          <Link
            to="/submit-story"
            className="glass-card rounded-xl p-6 bg-gradient-to-br from-green-100/30 to-teal-100/30 border-green-200/30 hover:opacity-95 transition-opacity"
          >
            <div className="flex items-center gap-4">
              <FileText className="w-8 h-8 text-green-500" />
              <div>
                <h3 className="font-bold text-foreground">{t("submitStory")}</h3>
                <p className="text-sm text-muted-foreground">{t("earnXpForStories")}</p>
              </div>
              <ArrowRight className="w-5 h-5 text-foreground ml-auto" />
            </div>
          </Link>

          <Link
            to="/my-breakroom"
            className="glass-card rounded-xl p-6 bg-gradient-to-br from-purple-100/30 to-pink-100/30 border-purple-200/30 hover:opacity-95 transition-opacity"
          >
            <div className="flex items-center gap-4">
              <Coffee className="w-8 h-8 text-purple-500" />
              <div>
                <h3 className="font-bold text-foreground">{t("checkInMood")}</h3>
                <p className="text-sm text-muted-foreground">{t("earnXpForBreaks")}</p>
              </div>
              <ArrowRight className="w-5 h-5 text-foreground ml-auto" />
            </div>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
