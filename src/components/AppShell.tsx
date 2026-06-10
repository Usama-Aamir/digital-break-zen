import { Link, useRouterState } from "@tanstack/react-router";
import { Home, CircleDot, Layers, Grid3x3, Music2, Palmtree, Scissors, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

const nav = [
  { to: "/", label: "Home", icon: Home },
  { to: "/bubbles", label: "Bubbles", icon: CircleDot },
  { to: "/match", label: "Match", icon: Layers },
  { to: "/2048", label: "2048", icon: Grid3x3 },
  { to: "/melody", label: "Melody", icon: Music2 },
  { to: "/vacation", label: "Vacation", icon: Palmtree },
  { to: "/shredder", label: "Shredder", icon: Scissors },
  { to: "/bingo", label: "Bingo", icon: Sparkles },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 px-4 sm:px-6 pt-4">
        <nav className="glass-card mx-auto max-w-5xl rounded-full px-3 sm:px-5 py-2 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 px-2 group">
            <span className="h-7 w-7 rounded-full bg-[image:var(--gradient-hero)] shadow-[var(--shadow-glow)] group-hover:scale-110 transition-transform" />
            <span className="font-display font-bold text-sm sm:text-base text-foreground">
              The Digital Breakroom
            </span>
          </Link>
          <ul className="flex items-center gap-1 flex-wrap justify-end">
            {nav.map(({ to, label, icon: Icon }) => {
              const active = pathname === to;
              return (
                <li key={to}>
                  <Link
                    to={to}
                    className={`flex items-center gap-1.5 rounded-full px-2.5 sm:px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-all ${
                      active
                        ? "bg-[image:var(--gradient-lav)] text-foreground shadow-[var(--shadow-soft)]"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/40"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>
      <main className="flex-1 px-4 sm:px-6 py-8 max-w-6xl mx-auto w-full">{children}</main>
      <footer className="py-6 text-center text-xs text-muted-foreground">
        Take a breath. You're doing great. 🌿
      </footer>
    </div>
  );
}