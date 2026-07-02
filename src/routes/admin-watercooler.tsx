import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useLanguage } from "@/lib/language";
import { useAuth } from "@/lib/auth";
import { useIsAdmin } from "@/lib/useIsAdmin";
import { getAllWatercoolerPostsForAdmin, updateWatercoolerPostStatus } from "@/lib/watercoolerPosts";
import { useState, useEffect } from "react";
import { Eye, EyeOff, Trash2 } from "lucide-react";

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
  const { loading, isConfigured } = useAuth();
  const { isAdmin, user } = useIsAdmin();
  const [posts, setPosts] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin) {
      loadPosts();
    }
  }, [isAdmin, statusFilter]);

  async function loadPosts() {
    if (!isAdmin) return;

    setIsLoading(true);
    setLoadError(null);

    try {
      const { posts: adminPosts, error: fetchError } = await getAllWatercoolerPostsForAdmin(
        statusFilter === "all" ? undefined : statusFilter
      );

      if (fetchError) {
        setLoadError(fetchError);
      } else {
        setPosts(adminPosts || []);
      }
    } catch (e) {
      setLoadError("Could not load posts for moderation.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUpdateStatus(postId: string, status: "published" | "hidden" | "deleted", hiddenReason?: string) {
    setIsUpdating(true);
    setUpdateError(null);
    setSuccessMessage(null);

    try {
      const { error } = await updateWatercoolerPostStatus(postId, status, hiddenReason);

      if (error) {
        setUpdateError(error);
        return;
      }

      setSuccessMessage(
        status === "hidden" ? t("postHidden") :
        status === "published" ? t("postUnhidden") :
        t("postMarkedDeleted")
      );

      await loadPosts();

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (e) {
      setUpdateError(t("moderationActionError"));
    } finally {
      setIsUpdating(false);
    }
  }

  if (!isConfigured) {
    return (
      <AppShell>
        <div className="max-w-4xl mx-auto px-4 py-12">
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
        <div className="max-w-4xl mx-auto px-4 py-12">
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
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="glass-card rounded-2xl p-8 text-center">
            <h1 className="text-3xl font-display font-bold text-foreground mb-4">
              {t("adminSignInRequired")}
            </h1>
            <p className="text-muted-foreground mb-6">
              {t("adminOnlyArea")}
            </p>
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[var(--gradient-mint)] to-[var(--gradient-lav)] text-foreground rounded-full font-semibold hover:opacity-95 transition-opacity shadow-[var(--shadow-glow)]"
            >
              {t("signIn")}
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!isAdmin) {
    return (
      <AppShell>
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="glass-card rounded-2xl p-8 text-center">
            <h1 className="text-3xl font-display font-bold text-foreground mb-4">
              {t("accessDenied")}
            </h1>
            <p className="text-muted-foreground mb-6">
              {t("adminOnlyArea")}
            </p>
            <Link
              to="/account"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[var(--gradient-mint)] to-[var(--gradient-lav)] text-foreground rounded-full font-semibold hover:opacity-95 transition-opacity shadow-[var(--shadow-glow)]"
            >
              Back to Account
            </Link>
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
        {updateError && (
          <div className="glass-card rounded-2xl p-4 mb-6 bg-gradient-to-br from-red-100/30 to-orange-100/30 border-red-200/30">
            <p className="text-sm text-red-700 text-center">
              {updateError}
            </p>
          </div>
        )}

        {/* Filter Buttons */}
        <div className="glass-card rounded-2xl p-4 mb-6 bg-white/40 border border-white/30 backdrop-blur-md">
          <div className="flex flex-wrap gap-2 justify-center">
            {["all", "published", "hidden", "deleted", "reported"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  statusFilter === status
                    ? "bg-gradient-to-r from-[var(--gradient-mint)] to-[var(--gradient-lav)] text-foreground shadow-[var(--shadow-glow)]"
                    : "bg-white/60 text-muted-foreground hover:bg-white/80"
                }`}
              >
                {status === "all" ? "All" :
                 status === "published" ? t("published") :
                 status === "hidden" ? t("hidden") :
                 status === "deleted" ? t("deleted") :
                 t("reportedPosts")}
              </button>
            ))}
          </div>
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
        {!isLoading && !loadError && posts.length === 0 && (
          <div className="glass-card rounded-2xl p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-display font-bold text-foreground mb-2">
              {t("noModerationItems")}
            </h2>
            <p className="text-muted-foreground mb-6">
              {t("noModerationItemsText")}
            </p>
          </div>
        )}

        {!isLoading && !loadError && posts.length > 0 && (
          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="glass-card rounded-2xl p-6 bg-white/40 border border-white/30 backdrop-blur-md hover:scale-[1.01] transition-transform"
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
                <div className="flex flex-wrap gap-2">
                  {post.status === "published" && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(post.id, "hidden", "Hidden by admin")}
                        disabled={isUpdating}
                        className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-full text-sm font-semibold hover:opacity-95 transition-opacity shadow-[var(--shadow-glow)] disabled:opacity-50"
                      >
                        {t("hidePost")}
                      </button>
                      <button
                        onClick={() => setConfirmDelete(post.id)}
                        disabled={isUpdating}
                        className="px-4 py-2 bg-gradient-to-r from-red-400 to-pink-400 text-white rounded-full text-sm font-semibold hover:opacity-95 transition-opacity shadow-[var(--shadow-glow)] disabled:opacity-50"
                      >
                        {t("markDeleted")}
                      </button>
                      {confirmDelete === post.id && (
                        <span className="inline-flex items-center gap-2 text-sm">
                          <span className="text-red-600 font-medium">Confirm?</span>
                          <button
                            onClick={() => {
                              setConfirmDelete(null);
                              handleUpdateStatus(post.id, "deleted");
                            }}
                            className="px-3 py-1 bg-red-500 text-white rounded-full text-xs font-semibold hover:bg-red-600"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-xs font-semibold hover:bg-gray-300"
                          >
                            No
                          </button>
                        </span>
                      )}
                    </>
                  )}
                  {post.status === "hidden" && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(post.id, "published")}
                        disabled={isUpdating}
                        className="px-4 py-2 bg-gradient-to-r from-green-400 to-emerald-400 text-white rounded-full text-sm font-semibold hover:opacity-95 transition-opacity shadow-[var(--shadow-glow)] disabled:opacity-50"
                      >
                        {t("unhidePost")}
                      </button>
                      <button
                        onClick={() => setConfirmDelete(post.id)}
                        disabled={isUpdating}
                        className="px-4 py-2 bg-gradient-to-r from-red-400 to-pink-400 text-white rounded-full text-sm font-semibold hover:opacity-95 transition-opacity shadow-[var(--shadow-glow)] disabled:opacity-50"
                      >
                        {t("markDeleted")}
                      </button>
                      {confirmDelete === post.id && (
                        <span className="inline-flex items-center gap-2 text-sm">
                          <span className="text-red-600 font-medium">Confirm?</span>
                          <button
                            onClick={() => {
                              setConfirmDelete(null);
                              handleUpdateStatus(post.id, "deleted");
                            }}
                            className="px-3 py-1 bg-red-500 text-white rounded-full text-xs font-semibold hover:bg-red-600"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-xs font-semibold hover:bg-gray-300"
                          >
                            No
                          </button>
                        </span>
                      )}
                    </>
                  )}
                  {post.status === "deleted" && (
                    <button
                      onClick={() => handleUpdateStatus(post.id, "published")}
                      disabled={isUpdating}
                      className="px-4 py-2 bg-gradient-to-r from-green-400 to-emerald-400 text-white rounded-full text-sm font-semibold hover:opacity-95 transition-opacity shadow-[var(--shadow-glow)] disabled:opacity-50"
                    >
                      {t("unhidePost")}
                    </button>
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
