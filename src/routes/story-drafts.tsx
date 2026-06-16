import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useLanguage } from "@/lib/language";
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

interface StoryDraft {
  id: string;
  title: string;
  category: string;
  moodTag: string;
  body: string;
  anonymous: boolean;
  createdAt: string;
  updatedAt: string;
}

function StoryDraftsPage() {
  const { t } = useLanguage();
  const [drafts, setDrafts] = useState<StoryDraft[]>([]);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  useEffect(() => {
    const savedDrafts = localStorage.getItem("digital-breakroom-story-drafts");
    if (savedDrafts) {
      setDrafts(JSON.parse(savedDrafts));
    }
  }, []);

  const handleDeleteDraft = (id: string) => {
    const updatedDrafts = drafts.filter((draft) => draft.id !== id);
    setDrafts(updatedDrafts);
    localStorage.setItem("digital-breakroom-story-drafts", JSON.stringify(updatedDrafts));
  };

  const handleCopyDraft = (draft: StoryDraft) => {
    const textToCopy = `${draft.title}\n\n${draft.body}`;
    navigator.clipboard.writeText(textToCopy);
    setCopySuccess(draft.id);
    setTimeout(() => setCopySuccess(null), 2000);
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
            {t("draftPrivacyNotice")}
          </p>
        </div>

        {/* Empty State */}
        {drafts.length === 0 && (
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
        {drafts.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2">
            {drafts.map((draft) => (
              <div key={draft.id} className="glass-card rounded-2xl p-6 hover:scale-[1.02] transition-transform duration-300">
                {/* Header */}
                <div className="mb-4">
                  <h3 className="text-xl font-display font-bold text-foreground mb-2">
                    {draft.title}
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="inline-block text-xs font-semibold px-3 py-1 bg-gradient-to-r from-[var(--gradient-mint)] to-[var(--gradient-lav)] text-foreground rounded-full">
                      {draft.category}
                    </span>
                    <span className="inline-block text-xs font-semibold px-3 py-1 bg-white/40 border border-white/30 text-muted-foreground rounded-full">
                      {draft.moodTag}
                    </span>
                    {draft.anonymous && (
                      <span className="inline-block text-xs font-semibold px-3 py-1 bg-purple-100/50 border border-purple-200/50 text-purple-700 rounded-full">
                        Anonymous
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Updated: {formatDate(draft.updatedAt)}
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
        {drafts.length > 0 && (
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
