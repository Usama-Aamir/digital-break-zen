import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useLanguage } from "@/lib/language";
import { useState } from "react";

export const Route = createFileRoute("/submit-story")({
  head: () => ({
    meta: [
      { title: "Submit Your Story | The Digital Breakroom" },
      { name: "description", content: "Share interest in submitting a workplace story, student struggle, office rant, or tiny win to The Digital Breakroom community." },
    ],
  }),
  component: SubmitStoryPage,
});

function SubmitStoryPage() {
  const { t } = useLanguage();
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [storyType, setStoryType] = useState("");
  const [storyIdea, setStoryIdea] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Draft fields
  const [draftTitle, setDraftTitle] = useState("");
  const [draftCategory, setDraftCategory] = useState("");
  const [draftMoodTag, setDraftMoodTag] = useState("");
  const [draftBody, setDraftBody] = useState("");
  const [draftAnonymous, setDraftAnonymous] = useState(false);
  const [draftSuccess, setDraftSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!nickname || !email || !storyType || !storyIdea || !consent) {
      setError(t("storyRequiredError"));
      return;
    }

    // Save to localStorage
    const submission = {
      nickname,
      email,
      storyType,
      storyIdea,
      consent,
      submittedAt: new Date().toISOString(),
    };

    localStorage.setItem("digital-breakroom-story-interest", JSON.stringify(submission));
    setSuccess(true);
  };

  const handleSaveDraft = () => {
    if (!draftTitle || !draftCategory || !draftMoodTag || !draftBody) {
      setError(t("storyRequiredError"));
      return;
    }

    const draft = {
      id: crypto.randomUUID(),
      title: draftTitle,
      category: draftCategory,
      moodTag: draftMoodTag,
      body: draftBody,
      anonymous: draftAnonymous,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const existingDrafts = JSON.parse(localStorage.getItem("digital-breakroom-story-drafts") || "[]");
    existingDrafts.push(draft);
    localStorage.setItem("digital-breakroom-story-drafts", JSON.stringify(existingDrafts));

    // Clear draft fields
    setDraftTitle("");
    setDraftCategory("");
    setDraftMoodTag("");
    setDraftBody("");
    setDraftAnonymous(false);

    setDraftSuccess(true);
    setTimeout(() => setDraftSuccess(false), 3000);
  };

  if (success) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="glass-card rounded-2xl p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto bg-gradient-to-r from-[var(--gradient-mint)] to-[var(--gradient-lav)] rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h1 className="text-3xl font-display font-bold text-foreground mb-4">
              {t("storySaved")}
            </h1>
            <p className="text-muted-foreground mb-8">
              {t("storyComingSoonNotice")}
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
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-display font-bold text-foreground mb-4">
            {t("submitStoryTitle")}
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            {t("submitStorySubtitle")}
          </p>
        </div>

        {/* Coming Soon Notice */}
        <div className="glass-card rounded-2xl p-4 mb-8 bg-gradient-to-br from-purple-100/30 to-pink-100/30 border-purple-200/30">
          <p className="text-sm text-muted-foreground text-center">
            {t("storyComingSoonNotice")}
          </p>
        </div>

        {/* Form */}
        <div className="glass-card rounded-2xl p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-100/50 border border-red-200/50 rounded-xl p-4 text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Nickname */}
            <div>
              <label htmlFor="nickname" className="block text-sm font-medium text-foreground mb-2">
                {t("storyNickname")} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/40 border border-white/30 backdrop-blur-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--gradient-mint)] transition-all"
                placeholder="Your nickname"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                {t("storyEmail")} <span className="text-red-500">*</span>
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

            {/* Story Type */}
            <div>
              <label htmlFor="storyType" className="block text-sm font-medium text-foreground mb-2">
                {t("storyType")} <span className="text-red-500">*</span>
              </label>
              <select
                id="storyType"
                value={storyType}
                onChange={(e) => setStoryType(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/40 border border-white/30 backdrop-blur-md text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--gradient-mint)] transition-all"
              >
                <option value="">Select a story type</option>
                <option value="workplace">Workplace story</option>
                <option value="student">Student story</option>
                <option value="funny">Funny office moment</option>
                <option value="burnout">Burnout recovery</option>
                <option value="anonymous">Anonymous rant</option>
              </select>
            </div>

            {/* Story Idea */}
            <div>
              <label htmlFor="storyIdea" className="block text-sm font-medium text-foreground mb-2">
                {t("storyIdea")} <span className="text-red-500">*</span>
              </label>
              <textarea
                id="storyIdea"
                value={storyIdea}
                onChange={(e) => setStoryIdea(e.target.value)}
                rows={6}
                className="w-full px-4 py-3 rounded-xl bg-white/40 border border-white/30 backdrop-blur-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--gradient-mint)] transition-all resize-none"
                placeholder="Share your story idea..."
              />
            </div>

            {/* Consent Checkbox */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="consent"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-1 w-5 h-5 rounded border-white/30 bg-white/40 focus:ring-2 focus:ring-[var(--gradient-mint)]"
              />
              <label htmlFor="consent" className="text-sm text-muted-foreground leading-relaxed">
                {t("storyConsent")} <span className="text-red-500">*</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full px-6 py-4 bg-gradient-to-r from-[var(--gradient-mint)] to-[var(--gradient-lav)] text-foreground rounded-xl font-semibold hover:opacity-95 transition-opacity shadow-[var(--shadow-glow)]"
            >
              {t("storySubmit")}
            </button>
          </form>
        </div>

        {/* Back Link */}
        <div className="text-center mt-8">
          <Link to="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Back to Blog
          </Link>
        </div>

        {/* Draft Writer Section */}
        <div className="mt-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-display font-bold text-foreground mb-4">
              {t("draftTitle")}
            </h2>
            <p className="text-muted-foreground">
              Write and save your story drafts locally before publishing.
            </p>
          </div>

          {/* Privacy Notice */}
          <div className="glass-card rounded-2xl p-4 mb-8 bg-gradient-to-br from-blue-100/30 to-purple-100/30 border-blue-200/30">
            <p className="text-sm text-muted-foreground text-center">
              {t("draftPrivacyNotice")}
            </p>
          </div>

          {/* Draft Form */}
          <div className="glass-card rounded-2xl p-6 sm:p-8">
            <div className="space-y-6">
              {/* Draft Success Message */}
              {draftSuccess && (
                <div className="bg-green-100/50 border border-green-200/50 rounded-xl p-4 text-green-700 text-sm">
                  {t("draftSaved")}
                </div>
              )}

              {/* Draft Title */}
              <div>
                <label htmlFor="draftTitle" className="block text-sm font-medium text-foreground mb-2">
                  {t("draftStoryTitle")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="draftTitle"
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/40 border border-white/30 backdrop-blur-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--gradient-mint)] transition-all"
                  placeholder="Your draft title"
                />
              </div>

              {/* Draft Category */}
              <div>
                <label htmlFor="draftCategory" className="block text-sm font-medium text-foreground mb-2">
                  {t("draftCategory")} <span className="text-red-500">*</span>
                </label>
                <select
                  id="draftCategory"
                  value={draftCategory}
                  onChange={(e) => setDraftCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/40 border border-white/30 backdrop-blur-md text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--gradient-mint)] transition-all"
                >
                  <option value="">Select a category</option>
                  <option value="Workplace story">Workplace story</option>
                  <option value="Student story">Student story</option>
                  <option value="Funny office moment">Funny office moment</option>
                  <option value="Burnout recovery">Burnout recovery</option>
                  <option value="Anonymous rant">Anonymous rant</option>
                  <option value="Tiny win">Tiny win</option>
                </select>
              </div>

              {/* Draft Mood Tag */}
              <div>
                <label htmlFor="draftMoodTag" className="block text-sm font-medium text-foreground mb-2">
                  {t("draftMoodTag")} <span className="text-red-500">*</span>
                </label>
                <select
                  id="draftMoodTag"
                  value={draftMoodTag}
                  onChange={(e) => setDraftMoodTag(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/40 border border-white/30 backdrop-blur-md text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--gradient-mint)] transition-all"
                >
                  <option value="">Select a mood tag</option>
                  <option value="Frustrated">Frustrated</option>
                  <option value="Tired">Tired</option>
                  <option value="Demotivated">Demotivated</option>
                  <option value="Happy">Happy</option>
                  <option value="Fun">Fun</option>
                  <option value="Reflective">Reflective</option>
                </select>
              </div>

              {/* Draft Body */}
              <div>
                <label htmlFor="draftBody" className="block text-sm font-medium text-foreground mb-2">
                  {t("draftBody")} <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="draftBody"
                  value={draftBody}
                  onChange={(e) => setDraftBody(e.target.value)}
                  rows={12}
                  className="w-full px-4 py-3 rounded-xl bg-white/40 border border-white/30 backdrop-blur-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--gradient-mint)] transition-all resize-none"
                  placeholder="Write your full story here..."
                />
              </div>

              {/* Anonymous Toggle */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="draftAnonymous"
                  checked={draftAnonymous}
                  onChange={(e) => setDraftAnonymous(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-white/30 bg-white/40 focus:ring-2 focus:ring-[var(--gradient-mint)]"
                />
                <label htmlFor="draftAnonymous" className="text-sm text-muted-foreground leading-relaxed">
                  {t("draftAnonymous")}
                </label>
              </div>

              {/* Save Draft Button */}
              <button
                type="button"
                onClick={handleSaveDraft}
                className="w-full px-6 py-4 bg-gradient-to-r from-blue-400 to-purple-400 text-white rounded-xl font-semibold hover:opacity-95 transition-opacity shadow-[var(--shadow-glow)]"
              >
                {t("saveDraft")}
              </button>

              {/* View Drafts Link */}
              <div className="text-center">
                <Link to="/story-drafts" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t("viewDrafts")} →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
