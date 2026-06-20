import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useLanguage } from "@/lib/language";
import { useAuth } from "@/lib/auth";
import { getAllWatercoolerPostsForAdmin, updateWatercoolerPostStatus } from "@/lib/watercoolerPosts";
import { useState, useEffect } from "react";
import { Eye, EyeOff, Trash2 } from "lucide-react";

const ADMIN_EMAIL = "aamirusama8@gmail.com";

export const Route = createFileRoute("/admin-watercooler")({
  head: () => ({
    meta: [
      { title: "Watercooler Moderation | The Digital Breakroom" },
      { name: "description", content: "Review reported and public Watercooler posts." },
    ],
  }),
  component: AdminWatercooler,
});

function AdminWatercooler() {
  const { t } = useLanguage();
  const { user, isConfigured } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check if user is admin
  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (!isConfigured) {
      return;
    }

    if (!user) {
      // Redirect to auth if not logged in
      navigate({ to: "/auth" });
      return;
    }

    if (!isAdmin) {
      // Show access denied if not admin
      return;
    }

    loadPosts();
  }, [user, isConfigured, isAdmin, navigate, statusFilter]);

  async function loadPosts() {
    if (!isAdmin) return;

    setIsLoading(true);
    setError(null);

    try {
      const { posts: adminPosts, error: fetchError } = await getAllWatercoolerPostsForAdmin(
        statusFilter === "all" ? undefined : statusFilter
      );

      if (fetchError) {
        setError(fetchError);
      } else {
        setPosts(adminPosts || []);
      }
    } catch (e) {
      setError("Could not load posts for moderation.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUpdateStatus(postId: string, status: "published" | "hidden" | "deleted", hiddenReason?: string) {
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await updateWatercoolerPostStatus(postId, status, hiddenReason);

      if (error) {
        setError(t("moderationActionError"));
        return;
      }

      setSuccessMessage(
        status === "hidden" ? t("postHidden") :
        status === "published" ? t("postUnhidden") :
        t("postMarkedDeleted")
      );
      setTimeout(() => setSuccessMessage(null), 3000);

      await loadPosts();
    } catch (e) {
      setError(t("moderationActionError"));
    } finally {
      setIsLoading(false);
    }
  }

  if (!isConfigured) {
    return (
      <AppShell>
        <div className="max-w-md mx-auto px-4 py-12">
          <div className="glass-card rounded-2xl p-8 text-center">
            <h1 className="text-2xl font-display font-bold text-foreground mb-4">
              Setup Required
            </h1>
            <p className="text-muted-foreground mb-6">
              {t("supabaseNotConfigured")}
            </p>
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
            <h1 className="text-2xl font-display font-bold text-foreground mb-4">
              Sign In Required
            </h1>
            <p className="text-muted-foreground mb-6">
              You must be signed in to access this page.
            </p>
            <button
              onClick={() => navigate({ to: "/auth" })}
              className="px-6 py-3 bg-gradient-to-r from-[var(--gradient-mint)] to-[var(--gradient-lav)] text-foreground rounded-full font-semibold hover:opacity-95 transition-opacity shadow-[var(--shadow-glow)]"
            >
              Sign In
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!isAdmin) {
    return (
      <AppShell>
        <div className="max-w-md mx-auto px-4 py-12">
          <div className="glass-card rounded-2xl p-8 text-center">
            <h1 className="text-2xl font-display font-bold text-foreground mb-4">
              Access Denied
            </h1>
            <p className="text-muted-foreground mb-6">
              You do not have permission to access this page.
            </p>
            <button
              onClick={() => navigate({ to: "/" })}
              className="px-6 py-3 bg-gradient-to-r from-[var(--gradient-mint)] to-[var(--gradient-lav)] text-foreground rounded-full font-semibold hover:opacity-95 transition-opacity shadow-[var(--shadow-glow)]"
            >
              Back to Home
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            {t("watercoolerModeration")}
          </h1>
          <p className="text-muted-foreground">
            {t("watercoolerModerationSubtitle")}
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-100/50 border border-green-200/50 rounded-xl text-sm text-green-700">
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100/50 border border-red-200/50 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              statusFilter === "all"
                ? "bg-gradient-to-r from-[var(--gradient-mint)] to-[var(--gradient-lav)] text-foreground"
                : "bg-white/50 hover:bg-white/70 text-foreground/80"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter("published")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              statusFilter === "published"
                ? "bg-gradient-to-r from-[var(--gradient-mint)] to-[var(--gradient-lav)] text-foreground"
                : "bg-white/50 hover:bg-white/70 text-foreground/80"
            }`}
          >
            {t("published")}
          </button>
          <button
            onClick={() => setStatusFilter("hidden")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              statusFilter === "hidden"
                ? "bg-gradient-to-r from-[var(--gradient-mint)] to-[var(--gradient-lav)] text-foreground"
                : "bg-white/50 hover:bg-white/70 text-foreground/80"
            }`}
          >
            {t("hidden")}
          </button>
          <button
            onClick={() => setStatusFilter("deleted")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              statusFilter === "deleted"
                ? "bg-gradient-to-r from-[var(--gradient-mint)] to-[var(--gradient-lav)] text-foreground"
                : "bg-white/50 hover:bg-white/70 text-foreground/80"
            }`}
          >
            {t("deleted")}
          </button>
          <button
            onClick={() => setStatusFilter("reported")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              statusFilter === "reported"
                ? "bg-gradient-to-r from-[var(--gradient-mint)] to-[var(--gradient-lav)] text-foreground"
                : "bg-white/50 hover:bg-white/70 text-foreground/80"
            }`}
          >
            {t("reportedPosts")}
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 mx-auto mb-4 border-4 border-[var(--gradient-mint)] border-t-transparent rounded-full"></div>
            <p className="text-muted-foreground">Loading posts...</p>
          </div>
        )}

        {/* Posts List */}
        {!isLoading && posts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No posts found for this filter.</p>
          </div>
        )}

        {!isLoading && posts.length > 0 && (
          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="glass-card rounded-2xl p-6 border border-white/30"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium px-2.5 py-1 bg-white/50 rounded-full text-foreground/80">
                        {post.mood_tag || "Random Vibes"}
                      </span>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        post.status === "published" ? "bg-green-100 text-green-700" :
                        post.status === "hidden" ? "bg-yellow-100 text-yellow-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {post.status}
                      </span>
                      {post.report_count > 0 && (
                        <span className="text-xs font-medium px-2.5 py-1 bg-orange-100 text-orange-700 rounded-full">
                          {post.report_count} {t("reportCount")}
                        </span>
                      )}
                    </div>
                    <p className="text-foreground text-sm mb-2 leading-relaxed">
                      {post.body}
                    </p>
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium">{post.nickname || "Anonymous"}</span>
                      {" • "}
                      {new Date(post.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Media Preview */}
                {post.media_url && post.media_type && (
                  <div className="mb-4 rounded-xl overflow-hidden bg-white/20">
                    {post.media_type === "image" ? (
                      <img
                        src={post.media_url}
                        alt="Post media"
                        className="w-full max-h-[200px] object-contain"
                      />
                    ) : (
                      <video
                        src={post.media_url}
                        controls
                        className="w-full max-h-[200px]"
                      />
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-white/20">
                  {post.status === "published" && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(post.id, "hidden", "Hidden by admin")}
                        className="flex items-center gap-1.5 px-3 py-2 bg-yellow-50 hover:bg-yellow-100 rounded-lg border border-yellow-200 text-xs font-medium text-yellow-700 transition-all"
                      >
                        <EyeOff className="h-3.5 w-3.5" />
                        {t("hidePost")}
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(post.id, "deleted")}
                        className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 text-xs font-medium text-red-700 transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {t("markDeleted")}
                      </button>
                    </>
                  )}
                  {post.status === "hidden" && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(post.id, "published")}
                        className="flex items-center gap-1.5 px-3 py-2 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 text-xs font-medium text-green-700 transition-all"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        {t("unhidePost")}
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(post.id, "deleted")}
                        className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 text-xs font-medium text-red-700 transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {t("markDeleted")}
                      </button>
                    </>
                  )}
                  {post.status === "deleted" && (
                    <button
                      onClick={() => handleUpdateStatus(post.id, "published")}
                      className="flex items-center gap-1.5 px-3 py-2 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 text-xs font-medium text-green-700 transition-all"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      {t("unhidePost")}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
