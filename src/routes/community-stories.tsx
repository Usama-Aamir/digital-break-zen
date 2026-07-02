import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useLanguage } from "@/lib/language";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { getApprovedCommunityStories, getPublicAuthorName } from "@/lib/publicStories";
import { useState, useEffect } from "react";
import { BookOpen, FileText } from "lucide-react";

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
        {isLoading && <LoadingState rows={3} className="mb-6" />}

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
          <EmptyState
            icon={BookOpen}
            title={t("noCommunityStoriesYet")}
            subtitle={t("noCommunityStoriesText")}
            action={
              <Link
                to="/submit-story"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[var(--gradient-mint)] to-[var(--gradient-lav)] text-foreground rounded-full font-semibold hover:opacity-95 transition-opacity shadow-[var(--shadow-glow)]"
              >
                <FileText className="h-4 w-4" />
                {t("submitStoryTitle")}
              </Link>
            }
          />
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
                  className="glass-card rounded-2xl p-4 sm:p-6 bg-white/40 border border-white/30 backdrop-blur-md hover:scale-[1.01] transition-transform"
                >
                  {/* Header: Title and Category */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 gap-2">
                    <h3 className="text-lg font-display font-bold text-foreground flex-1 min-w-0">
                      {story.title}
                    </h3>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-100/80 to-pink-100/80 text-purple-700 shrink-0 self-start">
                      {story.category}
                    </span>
                  </div>

                  {/* Meta Information */}
                  <div className="flex flex-wrap gap-x-4 gap-y-2 mb-4 text-sm">
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
