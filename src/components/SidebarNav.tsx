import { Link, useLocation } from "@tanstack/react-router";
import { useLanguage } from "@/lib/language";
import { useAuth } from "@/lib/auth";
import { getCurrentUserProfile, getDisplayName } from "@/lib/profiles";
import { getPendingGameInviteCount } from "@/lib/multiplayerGames";
import { useState, useEffect } from "react";
import { 
  Home, 
  MessageSquare, 
  BookOpen, 
  PenTool, 
  FileText, 
  FolderOpen, 
  User, 
  LayoutGrid, 
  Gamepad2,
  Shield,
  Coffee,
  Users,
  MessageCircle,
  Trophy
} from "lucide-react";

interface NavItem {
  label: string;
  to: string;
  icon: React.ElementType;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export function SidebarNav() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const location = useLocation();
  const [profile, setProfile] = useState<any>(null);
  const [pendingInviteCount, setPendingInviteCount] = useState(0);
  const isAdmin = user?.email === "aamirusama8@gmail.com";

  useEffect(() => {
    async function loadData() {
      if (user) {
        const userProfile = await getCurrentUserProfile(user.id);
        setProfile(userProfile);
        
        const inviteCountData = await getPendingGameInviteCount(user.id);
        if (inviteCountData.count !== undefined) {
          setPendingInviteCount(inviteCountData.count);
        }
      }
    }
    loadData();
  }, [user]);

  const navSections: NavSection[] = [
    {
      title: t("mainNavigation"),
      items: [
        { label: t("home"), to: "/", icon: Home },
        { label: t("watercoolerWall"), to: "/watercooler", icon: MessageSquare },
        { label: t("communityStories"), to: "/community-stories", icon: BookOpen },
        { label: t("submitStory"), to: "/submit-story", icon: PenTool },
      ],
    },
    {
      title: t("personal"),
      items: [
        { label: t("myBreakroom"), to: "/my-breakroom", icon: Coffee },
        { label: t("rewards"), to: "/rewards", icon: Trophy },
        { label: t("friends"), to: "/friends", icon: Users },
        { label: t("messages"), to: "/messages", icon: MessageCircle },
        { label: t("cloudDraftsTitle"), to: "/story-drafts", icon: FileText },
        { label: t("mySubmissions"), to: "/my-submissions", icon: FolderOpen },
        { label: t("accountTitle"), to: "/account", icon: User },
      ],
    },
    {
      title: t("explore"),
      items: [
        { label: t("blog"), to: "/blog", icon: LayoutGrid },
        { label: t("breakTools"), to: "/", icon: LayoutGrid },
        { label: t("multiplayerGames"), to: "/games-multiplayer", icon: Gamepad2 },
      ],
    },
  ];

  if (isAdmin) {
    navSections.push({
      title: t("admin"),
      items: [
        { label: t("adminModeration"), to: "/admin-submissions", icon: Shield },
        { label: t("watercoolerModeration"), to: "/admin-watercooler", icon: Shield },
      ],
    });
  }

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="flex flex-col h-full bg-white/50 backdrop-blur-xl border-r border-white/30">
      {/* Brand */}
      <div className="p-6 border-b border-white/20">
        <h1 className="text-2xl font-display font-bold text-foreground mb-1">
          Digital Breakroom
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("resetShareBreathe")}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        {navSections.map((section) => (
          <div key={section.title}>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-3">
              {section.title}
            </h3>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const showBadge = item.to === "/games-multiplayer" && pendingInviteCount > 0;
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                        isActive(item.to)
                          ? "bg-gradient-to-r from-blue-400/20 to-purple-400/20 text-foreground font-medium"
                          : "text-muted-foreground hover:bg-white/50 hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-sm">{item.label}</span>
                      {showBadge && (
                        <span className="ml-auto px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                          {pendingInviteCount}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Profile Block */}
      <div className="p-4 border-t border-white/20">
        {user ? (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/30 border border-white/20">
            {profile?.avatar_url ? (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-xl">
                {profile.avatar_url}
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-xl">
                👤
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {profile?.display_name || getDisplayName(profile, user.email)}
              </p>
              {profile?.username && (
                <p className="text-xs text-muted-foreground truncate">@{profile.username}</p>
              )}
            </div>
            <Link
              to="/account" as any
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <User className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <Link
            to="/auth"
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-400 to-purple-400 text-white text-sm font-medium hover:opacity-95 transition-opacity"
          >
            {t("signIn")}
          </Link>
        )}
      </div>
    </div>
  );
}
