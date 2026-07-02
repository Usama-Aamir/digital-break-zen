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
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-white/30 z-50 md:hidden safe-area-pb"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around px-1 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center justify-center gap-1 min-w-[3.5rem] px-2 py-2 rounded-xl transition-colors active:scale-95 ${
                active
                  ? "text-foreground bg-black/5"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span className="text-[10px] sm:text-xs font-medium leading-tight text-center line-clamp-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
