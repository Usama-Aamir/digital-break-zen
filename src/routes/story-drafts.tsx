import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useLanguage } from "@/lib/language";
import { useAuth } from "@/lib/auth";
import {
  getLocalDrafts,
  getCloudDrafts,
  deleteLocalDraft,
  deleteCloudDraft,
  syncLocalDraftsToCloud,
  copyTextToClipboard,
  type StoryDraft,
} from "@/lib/storyDrafts";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/story-drafts")({
  head: () => ({
    meta: [
      { title: "Saved Story Drafts | The Digital Breakroom" },
      { name: "description", content: "Manage locally saved workplace stories, student struggles, funny rants, and tiny wins before community publishing launches." },
    ],
  }),
  component: StoryDraftsPage,
});

function StoryDraftsPage() {
  const { t } = useLanguage();
  const { user, isConfigured } = useAuth();
  const [drafts, setDrafts] = useState<StoryDraft[]>([]);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [isCloud, setIsCloud] = useState(false);

  useEffect(() => {
    loadDrafts();
  }, [user, isConfigured]);

  const loadDrafts = async () => {
    setLoading(true);
    setError(null);

    if (user && isConfigured) {
      // Load from cloud
      const { drafts: cloudDrafts, error: loadError } = await getCloudDrafts(user.id);
      if (loadError) {
        setError(loadError);
        // Fallback to local drafts on error
        const localDrafts = getLocalDrafts();
        setDrafts(localDrafts);
        setIsCloud(false);
      } else {
        setDrafts(cloudDrafts);
        setIsCloud(true);
      }
    } else {
      // Load from local storage
      const localDrafts = getLocalDrafts();
      setDrafts(localDrafts);
      setIsCloud(false);
    }

    setLoading(false);
  };

  const handleDeleteDraft = async (id: string) => {
    if (isCloud && user) {
      const { error } = await deleteCloudDraft(id, user.id);
      if (error) {
        setError(error);
        return;
      }
    } else {
      deleteLocalDraft(id);
    }

    setDrafts(drafts.filter((draft) => draft.id !== id));
  };

  const handleCopyDraft = async (draft: StoryDraft) => {
    const textToCopy = `${draft.title}\n\n${draft.body}`;
    const success = await copyTextToClipboard(textToCopy);
    if (success) {
      setCopySuccess(draft.id);
      setTimeout(() => setCopySuccess(null), 2000);
    }
  };

  const handleSyncDrafts = async () => {
    if (!user) return;

    const { error } = await syncLocalDraftsToCloud(user.id);
    if (error) {
      setError(error);
    } else {
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 3000);
      // Reload drafts
      loadDrafts();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getExcerpt = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-display font-bold text-foreground mb-4">
            {t("savedDrafts")}
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            {t("noDraftsText")}
          </p>
        </div>

        {/* Privacy Notice */}
        <div className="glass-card rounded-2xl p-4 mb-8 bg-gradient-to-br from-blue-100/30 to-purple-100/30 border-blue-200/30">
          <p className="text-sm text-muted-foreground text-center">
            {user && isConfigured ? t("draftsSavedToAccountNotice") : t("draftsSavedLocallyNotice")}
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="glass-card rounded-2xl p-8 text-center">
            <div className="animate-spin w-8 h-8 mx-auto mb-4 border-4 border-[var(--gradient-mint)] border-t-transparent rounded-full"></div>
            <p className="text-muted-foreground">Loading drafts...</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="glass-card rounded-2xl p-4 mb-8 bg-gradient-to-br from-red-100/30 to-orange-100/30 border-red-200/30">
            <p className="text-sm text-red-700 text-center">
              {error}
            </p>
          </div>
        )}

        {/* Sync Success Message */}
        {syncSuccess && (
          <div className="glass-card rounded-2xl p-4 mb-8 bg-gradient-to-br from-green-100/30 to-teal-100/30 border-green-200/30">
            <p className="text-sm text-green-700 text-center">
              {t("localDraftsSynced")}
            </p>
          </div>
        )}

        {/* Sync Button - Only show when logged in and local drafts exist */}
        {!loading && user && isConfigured && getLocalDrafts().length > 0 && (
          <div className="glass-card rounded-2xl p-4 mb-8 bg-gradient-to-br from-teal-100/30 to-cyan-100/30 border-teal-200/30">
            <p className="text-sm text-muted-foreground text-center mb-3">
              You have local drafts that can be synced to your account.
            </p>
            <div className="text-center">
              <button
                onClick={handleSyncDrafts}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-400 to-cyan-400 text-white rounded-full text-sm font-semibold hover:opacity-95 transition-opacity shadow-[var(--shadow-glow)]"
              >
                {t("syncLocalDrafts")}
              </button>
            </div>
          </div>
        )}

        {/* Sign-in CTA - Only show when logged out */}
        {!loading && !user && isConfigured && (
          <div className="glass-card rounded-2xl p-4 mb-8 bg-gradient-to-br from-green-100/30 to-teal-100/30 border-green-200/30">
            <p className="text-sm text-muted-foreground text-center mb-3">
              {t("signInToSyncDrafts")}
            </p>
            <div className="text-center">
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[var(--gradient-mint)] to-[var(--gradient-lav)] text-foreground rounded-full text-sm font-semibold hover:opacity-95 transition-opacity shadow-[var(--shadow-glow)]"
              >
                {t("signIn")}
              </Link>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && drafts.length === 0 && (
          <div className="glass-card rounded-2xl p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto bg-gradient-to-r from-[var(--gradient-mint)] to-[var(--gradient-lav)] rounded-full flex items-center justify-center opacity-50">
                <svg className="w-8 h-8 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-display font-bold text-foreground mb-4">
              {t("noDraftsYet")}
            </h2>
            <p className="text-muted-foreground mb-6">
              {t("noDraftsText")}
            </p>
            <Link
              to="/submit-story"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[var(--gradient-mint)] to-[var(--gradient-lav)] text-foreground rounded-full font-semibold hover:opacity-95 transition-opacity shadow-[var(--shadow-glow)]"
            >
              {t("backToSubmitStory")}
            </Link>
          </div>
        )}

        {/* Drafts Grid */}
        {!loading && drafts.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2">
            {drafts.map((draft) => (
              <div key={draft.id} className="glass-card rounded-2xl p-6 hover:scale-[1.02] transition-transform duration-300">
                {/* Header */}
                <div className="mb-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-xl font-display font-bold text-foreground">
                      {draft.title}
                    </h3>
                    <span className="inline-block text-xs font-semibold px-2 py-1 bg-blue-100/50 border border-blue-200/50 text-blue-700 rounded-full">
                      {isCloud ? t("cloudDraft") : t("localDraft")}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="inline-block text-xs font-semibold px-3 py-1 bg-gradient-to-r from-[var(--gradient-mint)] to-[var(--gradient-lav)] text-foreground rounded-full">
                      {draft.category}
                    </span>
                    <span className="inline-block text-xs font-semibold px-3 py-1 bg-white/40 border border-white/30 text-muted-foreground rounded-full">
                      {draft.mood_tag}
                    </span>
                    {draft.anonymous && (
                      <span className="inline-block text-xs font-semibold px-3 py-1 bg-purple-100/50 border border-purple-200/50 text-purple-700 rounded-full">
                        Anonymous
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Updated: {formatDate(draft.updated_at)}
                  </p>
                </div>

                {/* Excerpt */}
                <p className="text-sm text-muted-foreground mb-6 line-clamp-3">
                  {getExcerpt(draft.body)}
                </p>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCopyDraft(draft)}
                    className="flex-1 px-4 py-2 bg-white/40 border border-white/30 text-foreground rounded-xl text-sm font-medium hover:bg-white/60 transition-colors"
                  >
                    {copySuccess === draft.id ? t("draftCopied") : t("copyDraft")}
                  </button>
                  <button
                    onClick={() => handleDeleteDraft(draft.id)}
                    className="px-4 py-2 bg-red-100/50 border border-red-200/50 text-red-700 rounded-xl text-sm font-medium hover:bg-red-200/50 transition-colors"
                  >
                    {t("deleteDraft")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Back Link */}
        {!loading && drafts.length > 0 && (
          <div className="text-center mt-8">
            <Link to="/submit-story" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t("backToSubmitStory")}
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}
