import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/language";
import { getCurrentUserProfile, upsertUserProfile, isProfileComplete, type Profile } from "@/lib/profiles";
import { Check } from "lucide-react";

const AVATARS = ["🌿", "☕", "💻", "🎧", "🧘", "⚡", "😂", "📚"];
const ROLES = ["Student", "Office worker", "Remote worker", "Team lead", "Freelancer", "Just here to breathe"];
const MOODS = ["Calm", "Focus", "Happy", "Energize", "Reflect"];

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Set up your profile | The Digital Breakroom" },
      { name: "description", content: "Create your identity for the Breakroom community." },
    ],
  }),
  component: Onboarding,
});

function Onboarding() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingProfile, setExistingProfile] = useState<Profile | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");
  const [mood, setMood] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0]);

  useEffect(() => {
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }

    async function loadProfile() {
      if (!user) return;
      try {
        const profile = await getCurrentUserProfile(user.id);
        setExistingProfile(profile);
        
        if (profile) {
          setDisplayName(profile.display_name || "");
          setUsername(profile.username || "");
          setRole(profile.role_label || "");
          setMood(profile.preferred_mood || "");
          setAvatar(profile.avatar_url || AVATARS[0]);
        }
      } catch (e) {
        console.error("[Onboarding] Error loading profile:", e);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !displayName.trim()) return;

    setSaving(true);
    setError(null);

    try {
      await upsertUserProfile(user.id, {
        email: user.email,
        display_name: displayName.trim(),
        username: username.trim() || null,
        role_label: role || null,
        preferred_mood: mood || null,
        avatar_url: avatar,
        onboarding_completed: true,
      });

      setSuccess(true);
      setTimeout(() => {
        navigate({ to: "/" });
      }, 1500);
    } catch (e) {
      console.error("[Onboarding] Error saving profile:", e);
      setError(t("profileSaveError"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-white/30 border-t-white/60 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  const isEdit = !!existingProfile?.onboarding_completed;

  return (
    <AppShell>
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="glass-card rounded-3xl p-8 bg-gradient-to-br from-blue-100/30 to-purple-100/30 border-blue-200/30">
          {/* Header */}
          <div className="text-center mb-8">
            <span className="inline-block text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-white/50 rounded-full px-3 py-1 mb-4">
              {t("stepOneOfOne")}
            </span>
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">
              {isEdit ? t("updateYourProfile") : t("setupYourProfile")}
            </h1>
            <p className="text-muted-foreground text-sm">
              {t("profileSubtitle")}
            </p>
          </div>

          {success ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-400 flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-white" />
              </div>
              <p className="text-foreground font-semibold text-lg mb-2">
                {t("profileSaved")}
              </p>
              <p className="text-muted-foreground text-sm">
                Redirecting to dashboard...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Display name */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t("displayName")} *
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={t("whatShouldWeCallYou")}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/50 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 text-foreground placeholder:text-muted-foreground/50 text-sm"
                />
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t("username")}
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t("usernamePlaceholder")}
                  className="w-full px-4 py-3 rounded-xl bg-white/50 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 text-foreground placeholder:text-muted-foreground/50 text-sm"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t("roleVibe")}
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/50 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 text-foreground text-sm"
                >
                  <option value="">Select an option...</option>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* Preferred mood */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t("preferredMood")}
                </label>
                <select
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/50 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 text-foreground text-sm"
                >
                  <option value="">Select an option...</option>
                  {MOODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Avatar */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t("chooseAvatar")}
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {AVATARS.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setAvatar(a)}
                      className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl transition-all ${
                        avatar === a
                          ? "bg-gradient-to-br from-blue-400 to-purple-400 scale-110 shadow-[var(--shadow-glow)]"
                          : "bg-white/50 hover:bg-white/70 border border-white/30"
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error */}
              {error && (
                <p className="text-sm text-red-500/80 text-center">
                  {error}
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={saving || !displayName.trim()}
                className="w-full py-3 px-6 bg-gradient-to-r from-blue-400 to-purple-400 text-white rounded-xl font-semibold text-sm transition-all hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-[var(--shadow-glow)]"
              >
                {saving ? "Saving..." : t("saveProfile")}
              </button>
            </form>
          )}
        </div>
      </div>
    </AppShell>
  );
}
