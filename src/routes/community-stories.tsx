import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useLanguage } from "@/lib/language";
import { getApprovedCommunityStories, getPublicAuthorName } from "@/lib/publicStories";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/community-stories")({
  head: () => ({
    meta: [
      { title: "Community Stories | The Digital Breakroom" },
      { name: "description", content: "Real workplace and study moments shared by the community." },
    ],
  }),
  component: CommunityStoriesPage,
});

function CommunityStoriesPage() {
  const { t } = useLanguage();
  const [stories, setStories] = useState<any[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedStories, setExpandedStories] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadStories();
  }, []);

  async function loadStories() {
    setIsLoading(true);
    setLoadError(null);
    
    const { stories: data, error } = await getApprovedCommunityStories();
    
    if (error) {
      setLoadError(error);
    } else {
      setStories(data);
    }
    
    setIsLoading(false);
  }

  function toggleExpand(storyId: string) {
    const newExpanded = new Set(expandedStories);
    if (newExpanded.has(storyId)) {
      newExpanded.delete(storyId);
    } else {
      newExpanded.add(storyId);
    }
    setExpandedStories(newExpanded);
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-display font-bold text-foreground mb-4">
            {t("communityStories")}
          </h1>
          <p className="text-lg text-muted-foreground">
            {t("communityStoriesSubtitle")}
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

        {/* Empty State */}
        {!isLoading && !loadError && stories.length === 0 && (
          <div className="glass-card rounded-2xl p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-display font-bold text-foreground mb-2">
              {t("noCommunityStoriesYet")}
            </h2>
            <p className="text-muted-foreground mb-6">
              {t("noCommunityStoriesText")}
            </p>
            <Link
              to="/submit-story"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[var(--gradient-mint)] to-[var(--gradient-lav)] text-foreground rounded-full font-semibold hover:opacity-95 transition-opacity shadow-[var(--shadow-glow)]"
            >
              {t("submitStoryTitle")}
            </Link>
          </div>
        )}

        {/* Stories List */}
        {!isLoading && !loadError && stories.length > 0 && (
          <div className="space-y-4">
            {stories.map((story) => {
              const isExpanded = expandedStories.has(story.id);
              const authorName = getPublicAuthorName(story);
              const bodyPreview = story.body.length > 300 ? story.body.substring(0, 300) + "..." : story.body;

              return (
                <div
                  key={story.id}
                  className="glass-card rounded-2xl p-6 bg-white/40 border border-white/30 backdrop-blur-md hover:scale-[1.01] transition-transform"
                >
                  {/* Header: Title and Category */}
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-display font-bold text-foreground">
                      {story.title}
                    </h3>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-100/80 to-pink-100/80 text-purple-700">
                      {story.category}
                    </span>
                  </div>

                  {/* Meta Information */}
                  <div className="flex flex-wrap gap-4 mb-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">{t("sharedBy")}: </span>
                      <span className="text-foreground font-medium">{authorName}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Type: </span>
                      <span className="text-foreground font-medium">{story.story_type}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Mood: </span>
                      <span className="text-foreground font-medium">{story.mood_tag}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Date: </span>
                      <span className="text-foreground font-medium">
                        {new Date(story.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="mb-4">
                    <p className="text-sm text-foreground/90 whitespace-pre-wrap bg-white/30 rounded-xl p-4">
                      {isExpanded ? story.body : bodyPreview}
                    </p>
                  </div>

                  {/* Read More/Less Button */}
                  {story.body.length > 300 && (
                    <button
                      onClick={() => toggleExpand(story.id)}
                      className="text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors"
                    >
                      {isExpanded ? t("showLess") : t("readMore")}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

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
