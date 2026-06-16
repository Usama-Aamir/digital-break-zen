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
      </div>
    </AppShell>
  );
}
