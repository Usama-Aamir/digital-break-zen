import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useLanguage } from "@/lib/language";
import { useAuth } from "@/lib/auth";
import { getUserStorySubmissions, getSubmissionStatusLabel } from "@/lib/storySubmissions";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/my-submissions")({
  head: () => ({
    meta: [
      { title: "My Submissions | The Digital Breakroom" },
      { name: "description", content: "Track your community stories submitted for review." },
    ],
  }),
  component: MySubmissionsPage,
});

function MySubmissionsPage() {
  const { t } = useLanguage();
  const { user, loading, isConfigured } = useAuth();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user && isConfigured) {
      loadSubmissions();
    }
  }, [user, isConfigured]);

  async function loadSubmissions() {
    if (!user) return;
    
    setIsLoading(true);
    setLoadError(null);
    
    const { submissions: data, error } = await getUserStorySubmissions(user.id);
    
    if (error) {
      setLoadError(error);
    } else {
      setSubmissions(data);
    }
    
    setIsLoading(false);
  }

  if (!isConfigured) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto px-4 py-12">
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
        <div className="max-w-2xl mx-auto px-4 py-12">
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
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="glass-card rounded-2xl p-8 text-center">
            <h1 className="text-3xl font-display font-bold text-foreground mb-4">
              {t("mySubmissions")}
            </h1>
            <p className="text-muted-foreground mb-6">
              {t("mySubmissionsSubtitle")}
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
            {t("mySubmissions")}
          </h1>
          <p className="text-lg text-muted-foreground">
            {t("mySubmissionsSubtitle")}
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="glass-card rounded-2xl p-8 text-center mb-6">
            <div className="animate-spin w-8 h-8 mx-auto mb-4 border-4 border-[var(--gradient-mint)] border-t-transparent rounded-full"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        )}

        {/* Error State */}
        {loadError && (
          <div className="glass-card rounded-2xl p-6 mb-6 bg-gradient-to-br from-red-100/30 to-orange-100/30 border-red-200/30">
            <p className="text-sm text-muted-foreground text-center">
              {loadError}
            </p>
          </div>
        )}

        {/* Submissions List */}
        {!isLoading && !loadError && submissions.length === 0 && (
          <div className="glass-card rounded-2xl p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-display font-bold text-foreground mb-2">
              {t("noSubmissionsYet")}
            </h2>
            <p className="text-muted-foreground mb-6">
              {t("noSubmissionsText")}
            </p>
            <Link
              to="/submit-story"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[var(--gradient-mint)] to-[var(--gradient-lav)] text-foreground rounded-full font-semibold hover:opacity-95 transition-opacity shadow-[var(--shadow-glow)]"
            >
              {t("submitStoryTitle")}
            </Link>
          </div>
        )}

        {/* Submissions Cards */}
        {!isLoading && !loadError && submissions.length > 0 && (
          <div className="space-y-4">
            {submissions.map((submission) => (
              <div
                key={submission.id}
                className="glass-card rounded-2xl p-6 bg-white/40 border border-white/30 backdrop-blur-md hover:scale-[1.02] transition-transform"
              >
                {/* Title and Status */}
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-display font-bold text-foreground">
                    {submission.title}
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      submission.status === "pending"
                        ? "bg-yellow-100/80 text-yellow-700"
                        : submission.status === "approved"
                        ? "bg-green-100/80 text-green-700"
                        : submission.status === "rejected"
                        ? "bg-red-100/80 text-red-700"
                        : "bg-gray-100/80 text-gray-700"
                    }`}
                  >
                    {getSubmissionStatusLabel(submission.status)}
                  </span>
                </div>

                {/* Story Type and Category */}
                <div className="flex items-center gap-4 mb-3 text-sm text-muted-foreground">
                  <span>{submission.story_type}</span>
                  <span>•</span>
                  <span>{submission.category}</span>
                </div>

                {/* Excerpt */}
                <p className="text-sm text-foreground/90 mb-4 line-clamp-2">
                  {submission.body}
                </p>

                {/* Date */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {new Date(submission.created_at).toLocaleDateString()}
                  </span>
                  {submission.anonymous && (
                    <span className="italic">Anonymous</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Back Link */}
        <div className="text-center mt-8">
          <Link to="/account" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Back to Account
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
