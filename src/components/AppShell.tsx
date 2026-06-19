import { useNavigate } from "@tanstack/react-router";
import { useMood, useLocalizedMoodMeta } from "@/lib/mood";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/lib/language";
import { SidebarNav } from "@/components/SidebarNav";
import { MobileNav } from "@/components/MobileNav";
import { useAuth } from "@/lib/auth";
import { getCurrentUserProfile, isProfileComplete } from "@/lib/profiles";
import { useState, useEffect } from "react";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { mood, clearMood } = useMood();
  const meta = useLocalizedMoodMeta(mood);
  const { t } = useLanguage();
  const { user, isConfigured } = useAuth();
  const [showProfileBanner, setShowProfileBanner] = useState(false);

  // Check if user has incomplete profile
  useEffect(() => {
    async function checkProfile() {
      if (user && isConfigured) {
        const profile = await getCurrentUserProfile(user.id);
        if (!isProfileComplete(profile)) {
          setShowProfileBanner(true);
        } else {
          setShowProfileBanner(false);
        }
      } else {
        setShowProfileBanner(false);
      }
    }
    checkProfile();
  }, [user, isConfigured]);

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

        {/* Profile Completion Banner */}
        {showProfileBanner && (
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4">
            <div className="glass-card rounded-xl p-4 flex items-center justify-between gap-4 border-2 border-yellow-300/50 bg-yellow-50/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-yellow-200 flex items-center justify-center">
                  <svg className="h-5 w-5 text-yellow-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-foreground">{t("setupYourProfile")}</p>
                  <p className="text-sm text-muted-foreground">{t("profileSubtitle")}</p>
                </div>
              </div>
              <button
                onClick={() => navigate({ to: "/onboarding" as any })}
                className="px-4 py-2 bg-gradient-to-r from-[var(--gradient-mint)] to-[var(--gradient-lav)] text-foreground rounded-full text-sm font-semibold hover:opacity-95 transition-opacity shadow-[var(--shadow-glow)]"
              >
                {t("completeProfile")}
              </button>
            </div>
          </div>
        )}

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