import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Home, CircleDot, Layers, Grid3x3, Music2, Palmtree, Scissors, Sparkles, Menu, Worm } from "lucide-react";
import type { ReactNode } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMood, useLocalizedMoodMeta } from "@/lib/mood";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/lib/language";

const nav = [
  { to: "/", label: "Home", icon: Home },
  { to: "/bubbles", label: "Bubbles", icon: CircleDot },
  { to: "/match", label: "Match", icon: Layers },
  { to: "/2048", label: "2048", icon: Grid3x3 },
  { to: "/melody", label: "Melody", icon: Music2 },
  { to: "/vacation", label: "Vacation", icon: Palmtree },
  { to: "/shredder", label: "Shredder", icon: Scissors },
  { to: "/bingo", label: "Bingo", icon: Sparkles },
  { to: "/snake", label: "ZenSnake", icon: Worm },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { mood, clearMood } = useMood();
  const meta = useLocalizedMoodMeta(mood);
  const { t } = useLanguage();

  const handleChangeMood = () => {
    clearMood();
    navigate({ to: "/" });
  };

  return (
    <div
      className="min-h-screen flex flex-col transition-[background] duration-700"
      style={meta ? { background: meta.bg, backgroundAttachment: "fixed" } : undefined}
    >
      <header className="sticky top-0 z-40 px-4 sm:px-6 pt-4">
        <nav className="glass-card mx-auto max-w-5xl rounded-full px-3 sm:px-5 py-2 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2 px-2 group min-w-0">
            <span className="h-7 w-7 shrink-0 rounded-full bg-[image:var(--gradient-hero)] shadow-[var(--shadow-glow)] group-hover:scale-110 transition-transform" />
            <span className="font-display font-bold text-[clamp(0.8rem,3.2vw,1rem)] text-foreground whitespace-nowrap">
              The Digital Breakroom
            </span>
          </Link>

          <div className="flex items-center gap-2 shrink-0">
            <LanguageSwitcher />
            {meta && (
              <button
                onClick={handleChangeMood}
                aria-label="Change mood"
                title="Change mood"
                className="flex items-center gap-1.5 rounded-full bg-white/70 hover:bg-white px-3 py-1.5 text-xs font-semibold text-foreground/80 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-glow)] transition-all border border-white/70"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: meta.dot }}
                  aria-hidden
                />
                <span className="hidden sm:inline">Change mood</span>
                <span className="sm:hidden">{meta.emoji}</span>
              </button>
            )}
            <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Open menu"
              className="shrink-0 rounded-full p-2 text-foreground hover:bg-white/40 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Menu className="h-5 w-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={12}
              className="w-56 rounded-3xl border border-white/60 bg-white/90 backdrop-blur-xl p-2 shadow-[var(--shadow-soft)]"
            >
              {nav.map(({ to, label, icon: Icon }) => {
                const active = pathname === to;
                return (
                  <DropdownMenuItem key={to} asChild className="rounded-2xl focus:bg-white/60">
                    <Link
                      to={to}
                      className={`flex items-center gap-3 px-3 py-2 text-sm font-medium cursor-pointer ${
                        active
                          ? "bg-[image:var(--gradient-lav)] text-foreground shadow-[var(--shadow-soft)]"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{label}</span>
                    </Link>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </nav>
      </header>
      <main className="flex-1 px-4 sm:px-6 py-8 max-w-6xl mx-auto w-full">{children}</main>
      <footer className="py-6 text-center text-xs text-muted-foreground">
        {t("takeBreath")}
      </footer>
    </div>
  );
}