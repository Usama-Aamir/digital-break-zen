import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useLanguage } from "@/lib/language";
import { useAuth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/adminSubmissions";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Your Account | The Digital Breakroom" },
      { name: "description", content: "Manage your Digital Breakroom profile and future community stories." },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { t } = useLanguage();
  const { user, loading, signOut, isConfigured } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user && isAdminEmail(user.email);

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/auth" });
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

  if (loading) {
    return (
      <AppShell>
        <div className="max-w-md mx-auto px-4 py-12">
          <div className="glass-card rounded-2xl p-8 text-center">
            <div className="animate-spin w-8 h-8 mx-auto mb-4 border-4 border-[var(--gradient-mint)] border-t-transparent rounded-full"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!user) {
    return (
      <AppShell>
        <div className="max-w-md mx-auto px-4 py-12">
          <div className="glass-card rounded-2xl p-8 text-center">
            <h1 className="text-3xl font-display font-bold text-foreground mb-4">
              {t("accountTitle")}
            </h1>
            <p className="text-muted-foreground mb-6">
              {t("accountSubtitle")}
            </p>
            <p className="text-muted-foreground mb-6">
              {t("notSignedIn")}
            </p>
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[var(--gradient-mint)] to-[var(--gradient-lav)] text-foreground rounded-full font-semibold hover:opacity-95 transition-opacity shadow-[var(--shadow-glow)]"
            >
              {t("goToSignIn")}
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-display font-bold text-foreground mb-4">
            {t("accountTitle")}
          </h1>
          <p className="text-lg text-muted-foreground">
            {t("accountSubtitle")}
          </p>
        </div>

        {/* Account Card */}
        <div className="glass-card rounded-2xl p-6 sm:p-8 mb-6">
          <div className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                {t("email")}
              </label>
              <p className="text-foreground font-medium">{user.email}</p>
            </div>

            {/* User ID */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                User ID
              </label>
              <p className="text-foreground font-mono text-sm">
                {user.id.slice(0, 8)}...{user.id.slice(-4)}
              </p>
            </div>

            {/* Sign Out Button */}
            <button
              onClick={handleSignOut}
              className="w-full px-6 py-4 bg-gradient-to-r from-red-300 to-pink-300 text-slate-700 rounded-xl font-semibold hover:opacity-95 transition-opacity"
            >
              {t("signOut")}
            </button>
          </div>
        </div>

        {/* Cloud Drafts Card */}
        <div className="glass-card rounded-2xl p-6 bg-gradient-to-br from-teal-100/30 to-cyan-100/30 border-teal-200/30 mb-6">
          <h3 className="text-lg font-display font-bold text-foreground mb-2">
            {t("cloudDraftsTitle")}
          </h3>
          <p className="text-muted-foreground mb-4">
            Your saved story drafts can now sync to your account.
          </p>
          <Link
            to="/story-drafts"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-400 to-cyan-400 text-white rounded-full text-sm font-semibold hover:opacity-95 transition-opacity shadow-[var(--shadow-glow)]"
          >
            View Drafts →
          </Link>
        </div>

        {/* My Submissions Card */}
        <div className="glass-card rounded-2xl p-6 bg-gradient-to-br from-purple-100/30 to-pink-100/30 border-purple-200/30 mb-6">
          <h3 className="text-lg font-display font-bold text-foreground mb-2">
            {t("mySubmissions")}
          </h3>
          <p className="text-muted-foreground mb-4">
            {t("mySubmissionsSubtitle")}
          </p>
          <Link
            to="/my-submissions"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-400 to-pink-400 text-white rounded-full text-sm font-semibold hover:opacity-95 transition-opacity shadow-[var(--shadow-glow)]"
          >
            {t("viewSubmissions")} →
          </Link>
        </div>

        {/* Admin Moderation Card - Only for admin */}
        {isAdmin && (
          <div className="glass-card rounded-2xl p-6 bg-gradient-to-br from-orange-100/30 to-red-100/30 border-orange-200/30 mb-6">
            <h3 className="text-lg font-display font-bold text-foreground mb-2">
              {t("adminModeration")}
            </h3>
            <p className="text-muted-foreground mb-4">
              {t("reviewPendingStories")}
            </p>
            <Link
              to="/admin-submissions"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-400 to-red-400 text-white rounded-full text-sm font-semibold hover:opacity-95 transition-opacity shadow-[var(--shadow-glow)]"
            >
              {t("openModeration")} →
            </Link>
          </div>
        )}

        {/* Community Stories Card */}
        <div className="glass-card rounded-2xl p-6 bg-gradient-to-br from-blue-100/30 to-indigo-100/30 border-blue-200/30 mb-6">
          <h3 className="text-lg font-display font-bold text-foreground mb-2">
            {t("communityStories")}
          </h3>
          <p className="text-muted-foreground mb-4">
            {t("realCommunityMoments")}
          </p>
          <Link
            to="/community-stories"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-400 to-indigo-400 text-white rounded-full text-sm font-semibold hover:opacity-95 transition-opacity shadow-[var(--shadow-glow)]"
          >
            {t("browseStories")} →
          </Link>
        </div>

        {/* Watercooler Wall Card */}
        <div className="glass-card rounded-2xl p-6 bg-gradient-to-br from-purple-100/30 to-pink-100/30 border-purple-200/30 mb-6">
          <h3 className="text-lg font-display font-bold text-foreground mb-2">
            {t("watercoolerWall")}
          </h3>
          <p className="text-muted-foreground mb-4">
            {t("watercoolerPreviewSubtitle")}
          </p>
          <Link
            to="/watercooler"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-400 to-pink-400 text-white rounded-full text-sm font-semibold hover:opacity-95 transition-opacity shadow-[var(--shadow-glow)]"
          >
            {t("openWatercooler")} →
          </Link>
        </div>

        {/* Coming Soon Notice */}
        <div className="glass-card rounded-2xl p-6 bg-gradient-to-br from-blue-100/30 to-purple-100/30 border-blue-200/30">
          <h3 className="text-lg font-display font-bold text-foreground mb-2">
            Coming Soon
          </h3>
          <p className="text-muted-foreground">
            {t("communityPublishingSoon")}
          </p>
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
