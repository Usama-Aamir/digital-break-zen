import { useNavigate } from "@tanstack/react-router";
import { useMood, useLocalizedMoodMeta } from "@/lib/mood";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/lib/language";
import { SidebarNav } from "@/components/SidebarNav";
import { MobileNav } from "@/components/MobileNav";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
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
      className="min-h-screen flex transition-[background] duration-700"
      style={meta ? { background: meta.bg, backgroundAttachment: "fixed" } : undefined}
    >
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-shrink-0">
        <SidebarNav />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-40 px-4 sm:px-6 pt-4">
          <nav className="glass-card mx-auto max-w-5xl rounded-full px-3 sm:px-5 py-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="h-7 w-7 shrink-0 rounded-full bg-[image:var(--gradient-hero)] shadow-[var(--shadow-glow)]" />
              <span className="font-display font-bold text-[clamp(0.8rem,3.2vw,1rem)] text-foreground whitespace-nowrap">
                Digital Breakroom
              </span>
            </div>

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
            </div>
          </nav>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-4 sm:px-6 py-8 max-w-6xl mx-auto w-full pb-20 md:pb-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="py-6 text-center text-xs text-muted-foreground">
          {t("takeBreath")}
        </footer>
      </div>

      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}