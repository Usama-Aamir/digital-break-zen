import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useLanguage } from "@/lib/language";
import { useAuth } from "@/lib/auth";
import { useState, useEffect } from "react";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  subscribeToNotifications,
  type Notification,
  type NotificationType,
  formatActorName,
} from "@/lib/notifications";
import {
  Bell,
  UserPlus,
  MessageSquare,
  Gamepad2,
  Award,
  Star,
  FileText,
  CheckCircle,
  XCircle,
  Heart,
  Reply,
  Megaphone,
  RefreshCw,
  CheckCheck,
  Trash2,
  Filter,
  Trophy,
  Users,
  Coffee,
  BookOpen,
} from "lucide-react";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications | The Digital Breakroom" },
      { name: "description", content: "Stay updated on messages, friends, games, and rewards." },
    ],
  }),
  component: NotificationsPage,
});

type FilterType = "all" | "unread" | "social" | "games" | "rewards" | "stories" | "watercooler";

const FILTER_MAP: Record<Exclude<FilterType, "all" | "unread">, NotificationType[]> = {
  social: ["friend_request", "friend_accepted", "direct_message"],
  games: ["game_invite", "game_invite_accepted", "game_invite_rejected"],
  rewards: ["badge_unlocked", "xp_earned"],
  stories: ["story_approved", "story_rejected"],
  watercooler: ["watercooler_reply", "watercooler_like"],
};

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case "friend_request":
    case "friend_accepted":
      return UserPlus;
    case "direct_message":
      return MessageSquare;
    case "game_invite":
    case "game_invite_accepted":
    case "game_invite_rejected":
      return Gamepad2;
    case "badge_unlocked":
      return Award;
    case "xp_earned":
      return Star;
    case "story_approved":
      return CheckCircle;
    case "story_rejected":
      return XCircle;
    case "watercooler_reply":
      return Reply;
    case "watercooler_like":
      return Heart;
    default:
      return Megaphone;
  }
}

function getRelativeTime(dateString: string, t: (key: string) => string) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

function NotificationsPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = async () => {
    if (!user) return;

    try {
      const [notificationsData, countData] = await Promise.all([
        getNotifications(user.id, 50),
        getUnreadNotificationCount(user.id),
      ]);

      if (notificationsData.notifications) {
        setNotifications(notificationsData.notifications);
      }
      if (countData.count !== undefined) {
        setUnreadCount(countData.count);
      }
    } catch (err) {
      console.warn("Failed to load notifications:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const channel = subscribeToNotifications(user.id, (payload) => {
      if (payload.event === "INSERT" || payload.event === "UPDATE") {
        loadNotifications();
      }
    });

    const interval = setInterval(() => {
      loadNotifications();
    }, 30000);

    return () => {
      if (channel) {
        channel.unsubscribe();
      }
      clearInterval(interval);
    };
  }, [user]);

  const handleMarkRead = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    await markNotificationRead(notificationId);
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    await markAllNotificationsRead(user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    await deleteNotification(notificationId);
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await markNotificationRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.is_read;
    return FILTER_MAP[filter].includes(n.type);
  });

  const filterTabs: { key: FilterType; label: string; icon: React.ElementType }[] = [
    { key: "all", label: t("allFilter"), icon: Filter },
    { key: "unread", label: t("unread"), icon: Bell },
    { key: "social", label: t("social"), icon: Users },
    { key: "games", label: t("games"), icon: Gamepad2 },
    { key: "rewards", label: t("rewards"), icon: Trophy },
    { key: "stories", label: t("stories"), icon: BookOpen },
    { key: "watercooler", label: t("watercooler"), icon: Coffee },
  ];

  if (!user) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="glass-card rounded-2xl p-8 text-center">
            <Bell className="w-16 h-16 mx-auto text-foreground/50 mb-4" />
            <h1 className="text-3xl font-display font-bold text-foreground mb-4">
              {t("notifications")}
            </h1>
            <p className="text-muted-foreground mb-8">{t("notificationsSubtitle")}</p>
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

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-display font-bold text-foreground mb-2">
              {t("notifications")}
            </h1>
            <p className="text-muted-foreground">{t("notificationsSubtitle")}</p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <span className="px-3 py-1 bg-red-500 text-white rounded-full text-sm font-semibold">
                {unreadCount} {t("unread")}
              </span>
            )}
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <button
            onClick={() => {
              setRefreshing(true);
              loadNotifications();
            }}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white/30 rounded-full text-sm font-medium hover:bg-white/50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            {t("refresh") || "Refresh"}
          </button>
          <button
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            className="flex items-center gap-2 px-4 py-2 bg-white/30 rounded-full text-sm font-medium hover:bg-white/50 transition-colors disabled:opacity-50"
          >
            <CheckCheck className="w-4 h-4" />
            {t("markAllRead")}
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {filterTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
                  filter === tab.key
                    ? "bg-gradient-to-r from-blue-400 to-purple-400 text-white"
                    : "bg-white/30 text-muted-foreground hover:bg-white/50"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="line-clamp-1">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {loading ? (
            <LoadingState rows={3} />
          ) : filteredNotifications.length === 0 ? (
            <EmptyState
              icon={Bell}
              title={filter === "unread" ? t("allCaughtUp") : t("noNotifications")}
              subtitle={filter === "unread" ? t("allCaughtUp") : t("notificationsSubtitle")}
            />
          ) : (
            filteredNotifications.map((notification) => {
              const Icon = getNotificationIcon(notification.type);
              const actorName = formatActorName(notification.actor_profile);
              const linkPath = notification.link_path || undefined;
              const content = (
                <div
                  className={`glass-card rounded-xl p-4 transition-all hover:bg-white/40 ${
                    !notification.is_read ? "bg-blue-50/30 border-blue-200/30" : "bg-white/20"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      !notification.is_read ? "bg-blue-500" : "bg-foreground/10"
                    }`}>
                      <Icon className={`w-5 h-5 ${!notification.is_read ? "text-white" : "text-foreground/60"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-semibold text-foreground text-sm mb-1">
                            {notification.title}
                          </p>
                          {notification.body && (
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {notification.body}
                            </p>
                          )}
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{getRelativeTime(notification.created_at, t)}</span>
                            {notification.actor_profile && (
                              <span className="flex items-center gap-1">
                                <span className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-xs">
                                  {notification.actor_profile.avatar_url || "👤"}
                                </span>
                                {actorName}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {!notification.is_read && (
                            <button
                              onClick={(e) => handleMarkRead(e, notification.id)}
                              className="p-2 hover:bg-white/50 rounded-lg transition-colors text-blue-500"
                              aria-label={t("markAllRead")}
                              title={t("markAllRead")}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={(e) => handleDelete(e, notification.id)}
                            className="p-2 hover:bg-white/50 rounded-lg transition-colors text-red-500"
                            aria-label={t("delete")}
                            title={t("delete")}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    {!notification.is_read && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></span>
                    )}
                  </div>
                </div>
              );

              return linkPath ? (
                <Link
                  key={notification.id}
                  to={linkPath}
                  onClick={() => handleNotificationClick(notification)}
                  className="block"
                >
                  {content}
                </Link>
              ) : (
                <div key={notification.id} onClick={() => handleNotificationClick(notification)} className="cursor-pointer">
                  {content}
                </div>
              );
            })
          )}
        </div>
      </div>
    </AppShell>
  );
}
