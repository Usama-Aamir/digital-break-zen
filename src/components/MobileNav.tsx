import { Link, useLocation } from "@tanstack/react-router";
import { useLanguage } from "@/lib/language";
import { Home, MessageSquare, BookOpen, PenTool, User } from "lucide-react";

interface NavItem {
  label: string;
  to: string;
  icon: React.ElementType;
}

export function MobileNav() {
  const { t } = useLanguage();
  const location = useLocation();

  const navItems: NavItem[] = [
    { label: t("home"), to: "/", icon: Home },
    { label: t("watercoolerWall"), to: "/watercooler", icon: MessageSquare },
    { label: t("communityStories"), to: "/community-stories", icon: BookOpen },
    { label: t("submitStory"), to: "/submit-story", icon: PenTool },
    { label: t("accountTitle"), to: "/account", icon: User },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-white/30 z-50 md:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                isActive(item.to)
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
