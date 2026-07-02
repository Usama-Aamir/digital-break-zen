import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useLanguage } from "@/lib/language";
import { useAuth } from "@/lib/auth";
import { getCurrentUserProfile, isProfileComplete } from "@/lib/profiles";
import { getFriendlyErrorMessage } from "@/lib/errorUtils";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "");

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign In | The Digital Breakroom" },
      { name: "description", content: "Sign in to your Digital Breakroom account to save drafts and prepare for community story publishing." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { t } = useLanguage();
  const { signIn, signUp, isConfigured, user } = useAuth();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Auto-redirect if already logged in
  useEffect(() => {
    if (user && isConfigured) {
      async function checkProfile() {
        if (!user) return;
        const profile = await getCurrentUserProfile(user.id);
        if (isProfileComplete(profile)) {
          navigate({ to: "/" });
        } else {
          navigate({ to: "/onboarding" as any });
        }
      }
      checkProfile();
    }
  }, [user, isConfigured, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!email || !password) {
      setError(t("authError"));
      setLoading(false);
      return;
    }

    if (isSignUp) {
      const result = await signUp(email, password);
      if (result.error) {
        setError(getFriendlyErrorMessage(result.error));
      } else if (result.needsEmailConfirmation) {
        setSuccess(t("checkEmailConfirm"));
        setEmail("");
        setPassword("");
        setIsSignUp(false);
      } else {
        // Sign up successful and user is logged in
        setSuccess(t("redirectingToAccount"));
        setTimeout(async () => {
          if (user) {
            const profile = await getCurrentUserProfile(user.id);
            if (isProfileComplete(profile)) {
              navigate({ to: "/" });
            } else {
              navigate({ to: "/onboarding" as any });
            }
          } else {
            // Session might not be ready yet, wait and check again
            setTimeout(async () => {
              const { data: { user: delayedUser } } = await supabase.auth.getUser();
              if (delayedUser) {
                const profile = await getCurrentUserProfile(delayedUser.id);
                if (isProfileComplete(profile)) {
                  navigate({ to: "/" });
                } else {
                  navigate({ to: "/onboarding" as any });
                }
              } else {
                navigate({ to: "/" });
              }
            }, 500);
          }
        }, 500);
      }
    } else {
      const result = await signIn(email, password);
      if (result.error) {
        setError(getFriendlyErrorMessage(result.error));
      } else {
        // Sign in successful
        setSuccess(t("redirectingToAccount"));
        setTimeout(async () => {
          if (user) {
            const profile = await getCurrentUserProfile(user.id);
            if (isProfileComplete(profile)) {
              navigate({ to: "/" });
            } else {
              navigate({ to: "/onboarding" as any });
            }
          } else {
            // Session might not be ready yet, wait and check again
            setTimeout(async () => {
              const { data: { user: delayedUser } } = await supabase.auth.getUser();
              if (delayedUser) {
                const profile = await getCurrentUserProfile(delayedUser.id);
                if (isProfileComplete(profile)) {
                  navigate({ to: "/" });
                } else {
                  navigate({ to: "/onboarding" as any });
                }
              } else {
                navigate({ to: "/" });
              }
            }, 500);
          }
        }, 500);
      }
    }

    setLoading(false);
  };

  if (!isConfigured) {
    return (
      <AppShell>
        <div className="max-w-md mx-auto px-4 py-12">
          <div className="glass-card rounded-2xl p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto bg-gradient-to-r from-yellow-100 to-orange-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground mb-4">
              Setup Required
            </h1>
            <p className="text-muted-foreground mb-6">
              {t("supabaseNotConfigured")}
            </p>
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

  return (
    <AppShell>
      <div className="max-w-md mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-display font-bold text-foreground mb-4">
            {t("authTitle")}
          </h1>
          <p className="text-lg text-muted-foreground">
            {t("authSubtitle")}
          </p>
        </div>

        {/* Auth Card */}
        <div className="glass-card rounded-2xl p-6 sm:p-8">
          {/* Toggle */}
          <div className="flex mb-6 bg-white/20 rounded-xl p-1">
            <button
              onClick={() => setIsSignUp(false)}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                !isSignUp
                  ? "bg-white/40 text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("signIn")}
            </button>
            <button
              onClick={() => setIsSignUp(true)}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                isSignUp
                  ? "bg-white/40 text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("signUp")}
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Message */}
            {error && (
              <div className="bg-red-100/50 border border-red-200/50 rounded-xl p-4 text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-green-100/50 border border-green-200/50 rounded-xl p-4 text-green-700 text-sm">
                {success}
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                {t("email")}
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/40 border border-white/30 backdrop-blur-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--gradient-mint)] transition-all"
                placeholder="your@email.com"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                {t("password")}
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/40 border border-white/30 backdrop-blur-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--gradient-mint)] transition-all"
                placeholder="••••••••"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-4 bg-gradient-to-r from-[var(--gradient-mint)] to-[var(--gradient-lav)] text-foreground rounded-xl font-semibold hover:opacity-95 transition-opacity shadow-[var(--shadow-glow)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Loading..." : isSignUp ? t("signUp") : t("signIn")}
            </button>
          </form>
        </div>

        {/* Back Link */}
        <div className="text-center mt-8">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
