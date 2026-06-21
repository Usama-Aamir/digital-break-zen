import { useEffect, useState, useRef } from "react";
import { Heart, Trash2, Image as ImageIcon, Video, X, Flag, MessageCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useLanguage } from "@/lib/language";
import { useAuth } from "@/lib/auth";
import { getPublishedWatercoolerPosts, createWatercoolerPost, deleteOwnWatercoolerPost, getWatercoolerDisplayName, reportWatercoolerPost, likeWatercoolerPost, unlikeWatercoolerPost, getUserLikedPostIds, getCommentsForPost, createWatercoolerComment, deleteOwnWatercoolerComment, getTrendingWatercoolerPosts } from "@/lib/watercoolerPosts";
import { getCurrentUserProfile, getDisplayName } from "@/lib/profiles";
import { uploadWatercoolerMedia, validateWatercoolerMedia, getWatercoolerMediaType } from "@/lib/watercoolerMedia";
import { trackUserActivity } from "@/lib/userActivity";

type MediaType = "image" | "video" | null;

interface Post {
  id: string;
  text: string;
  mediaType: MediaType;
  mediaUrl?: string; // Session-based URL from URL.createObjectURL
  mediaName?: string;
  category: string;
  timestamp: number;
  isStarter: boolean;
  liked: boolean;
  likesCount: number;
  userId?: string; // For ownership check
}

interface Comment {
  id: string;
  post_id: string;
  user_id: string | null;
  nickname: string | null;
  body: string;
  created_at: string;
}

const CATEGORIES = [
  "Office Pain",
  "Study Stress",
  "Corporate Translation",
  "Tiny Win",
  "Random Vibes",
  "Meme Drop",
  "Clip Dump",
] as const;

const STARTER_POSTS: Post[] = [
  {
    id: "starter-1",
    text: "This meeting could have been a WhatsApp message.",
    mediaType: null,
    category: "Office Pain",
    timestamp: Date.now(),
    isStarter: true,
    liked: false,
    likesCount: 0,
  },
  {
    id: "starter-2",
    text: "My coffee has done more work than me today.",
    mediaType: null,
    category: "Office Pain",
    timestamp: Date.now(),
    isStarter: true,
    liked: false,
    likesCount: 0,
  },
  {
    id: "starter-3",
    text: "Deadline is tomorrow. My brain left yesterday.",
    mediaType: null,
    category: "Study Stress",
    timestamp: Date.now(),
    isStarter: true,
    liked: false,
    likesCount: 0,
  },
  {
    id: "starter-4",
    text: "Let's circle back = nobody knows what's going on.",
    mediaType: null,
    category: "Corporate Translation",
    timestamp: Date.now(),
    isStarter: true,
    liked: false,
    likesCount: 0,
  },
  {
    id: "starter-5",
    text: "Currently pretending the spreadsheet makes sense.",
    mediaType: null,
    category: "Random Vibes",
    timestamp: Date.now(),
    isStarter: true,
    liked: false,
    likesCount: 0,
  },
];

const STORAGE_KEY = "watercooler_posts";

export function WatercoolerWall() {
  const { t } = useLanguage();
  const { user, isConfigured } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [text, setText] = useState("");
  const [category, setCategory] = useState("Random Vibes");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<MediaType>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [usingLocalStorage, setUsingLocalStorage] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [isReporting, setIsReporting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Social features state
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [trendingPosts, setTrendingPosts] = useState<Post[]>([]);

  // Load posts from Supabase or localStorage on mount
  useEffect(() => {
    async function loadPosts() {
      console.log("[watercooler] load posts");
      if (isConfigured) {
        setIsLoading(true);
        const { posts: cloudPosts, error } = await getPublishedWatercoolerPosts();
        if (error) {
          // Fallback to localStorage only if Supabase fails
          setUsingLocalStorage(true);
          loadLocalStoragePosts();
        } else {
          // Convert cloud posts to local Post format (empty array is fine)
          const convertedPosts: Post[] = cloudPosts.map((post) => ({
            id: post.id,
            text: post.body,
            mediaType: post.media_type as MediaType,
            mediaUrl: post.media_url || undefined,
            category: post.mood_tag || "Random Vibes",
            timestamp: new Date(post.created_at).getTime(),
            isStarter: false,
            liked: false,
            likesCount: post.likes_count || 0,
            userId: post.user_id || undefined,
          }));
          setPosts(convertedPosts);
          setUsingLocalStorage(false);

          // Load liked post IDs for current user
          if (user) {
            console.log("[watercooler] load liked ids");
            const postIds = convertedPosts.map(p => p.id);
            const { likedPostIds } = await getUserLikedPostIds(user.id, postIds);
            setLikedPostIds(new Set(likedPostIds));
          }
        }
        setIsLoading(false);
      } else {
        setUsingLocalStorage(true);
        loadLocalStoragePosts();
      }
    }

    loadPosts();
  }, [isConfigured, user?.id]);

  // Load trending posts
  useEffect(() => {
    async function loadTrending() {
      console.log("[watercooler] load trending");
      if (isConfigured) {
        const { posts: trending } = await getTrendingWatercoolerPosts();
        if (trending.length > 0) {
          const convertedTrending: Post[] = trending.map((post) => ({
            id: post.id,
            text: post.body,
            mediaType: post.media_type as MediaType,
            mediaUrl: post.media_url || undefined,
            category: post.mood_tag || "Random Vibes",
            timestamp: new Date(post.created_at).getTime(),
            isStarter: false,
            liked: false,
            likesCount: post.likes_count || 0,
            userId: post.user_id || undefined,
          }));
          setTrendingPosts(convertedTrending);
        }
      }
    }

    loadTrending();
  }, [isConfigured]);

  function loadLocalStoragePosts() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedPosts = JSON.parse(stored) as Post[];
        setPosts(parsedPosts);
      } else {
        setPosts(STARTER_POSTS);
      }
    } catch (e) {
      console.error("[WatercoolerWall] Failed to load posts:", e);
      setPosts(STARTER_POSTS);
    }
  }

  // Save posts to localStorage whenever they change (only if using localStorage)
  useEffect(() => {
    if (usingLocalStorage && posts.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
      } catch (e) {
        console.error("[WatercoolerWall] Failed to save posts:", e);
      }
    }
  }, [posts, usingLocalStorage]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Use the new validation function
    const validation = validateWatercoolerMedia(file);
    if (!validation.valid) {
      // Map validation errors to i18n keys
      const errorMap: Record<string, string> = {
        imageTooLarge: t("imageTooLarge"),
        videoTooLarge: t("videoTooLarge"),
        unsupportedMediaType: t("unsupportedMediaType"),
      };
      setError(errorMap[validation.error] || t("mediaValidationError"));
      return;
    }

    setMediaType(validation.mediaType);
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handlePost = async () => {
    if (!text.trim() && !mediaFile) return;

    // If not logged in, show sign-in CTA and don't clear text
    if (!user) {
      setError(t("signInToPost"));
      return;
    }

    // If logged in and Supabase is configured, post to cloud
    if (isConfigured) {
      setError(null);
      setIsPosting(true);

      try {
        // Upload media first if selected
        let mediaUrl: string | null = null;
        let mediaTypeResult: 'image' | 'video' | null = null;

        if (mediaFile) {
          const { result, error: uploadError } = await uploadWatercoolerMedia(user.id, mediaFile);
          if (uploadError || !result) {
            setError(t("mediaUploadError"));
            setIsPosting(false);
            return;
          }
          mediaUrl = result.publicUrl;
          mediaTypeResult = result.mediaType;
        }

        // Get user profile for display name
        const profile = await getCurrentUserProfile(user.id);
        const displayName = getDisplayName(profile, user.email);

        const payload = {
          body: text.trim(),
          nickname: displayName,
          mood_tag: category,
          media_url: mediaUrl || undefined,
          media_type: mediaTypeResult || undefined,
        };

        console.info("[watercooler] creating cloud post", payload);

        const { post: cloudPost, error } = await createWatercoolerPost(user.id, payload);

        if (error) {
          console.error("[watercooler] create post failed", error);
          setError("Could not publish your post. Your typed text is still safe.");
          setIsPosting(false);
          return;
        }

        console.info("[watercooler] cloud post created", cloudPost);

        // Track watercooler post activity (fire-and-forget)
        void trackUserActivity({
          userId: user.id,
          activityType: 'watercooler_post',
          moodTag: category,
        }).catch(console.warn);

        setSuccessMessage(t("watercoolerPostPublished"));
        setTimeout(() => setSuccessMessage(null), 3000);

        // Prepend the new post to state instead of refetching
        if (cloudPost) {
          const newPost: Post = {
            id: cloudPost.id,
            text: cloudPost.body,
            mediaType: cloudPost.media_type as MediaType,
            mediaUrl: cloudPost.media_url || undefined,
            category: cloudPost.mood_tag || "Random Vibes",
            timestamp: new Date(cloudPost.created_at).getTime(),
            isStarter: false,
            liked: false,
            likesCount: cloudPost.likes_count || 0,
            userId: cloudPost.user_id || undefined,
          };
          setPosts([newPost, ...posts]);
        }

        // Only clear text and media after successful post
        setText("");
        setCategory("Random Vibes");
        removeMedia();
      } catch (e) {
        console.error("[watercooler] post failed with exception", e);
        setError("Could not publish your post. Your typed text is still safe.");
      } finally {
        setIsPosting(false);
      }
    } else {
      // Fallback to localStorage only when Supabase is not configured
      const newPost: Post = {
        id: `post-${Date.now()}`,
        text: text.trim(),
        mediaType,
        mediaUrl: mediaPreview || undefined,
        mediaName: mediaFile?.name,
        category,
        timestamp: Date.now(),
        isStarter: false,
        liked: false,
        likesCount: 0,
      };

      setPosts([newPost, ...posts]);
      setText("");
      setCategory("Random Vibes");
      removeMedia();
    }
  };

  const handleLike = async (id: string) => {
    if (!user) {
      setError(t("signInToLike"));
      return;
    }

    if (usingLocalStorage) {
      // LocalStorage fallback - just toggle local state
      setPosts(posts.map((post) => 
        post.id === id ? { ...post, liked: !post.liked } : post
      ));
      return;
    }

    // Supabase - call API
    const isLiked = likedPostIds.has(id);
    const { error } = isLiked
      ? await unlikeWatercoolerPost(id, user.id)
      : await likeWatercoolerPost(id, user.id);

    if (error) {
      setError(error);
      return;
    }

    // Track watercooler like activity (only on like, not unlike) - fire-and-forget
    if (!isLiked) {
      void trackUserActivity({
        userId: user.id,
        activityType: 'watercooler_like',
      }).catch(console.warn);
    }

    // Update local state optimistically
    const newLikedPostIds = new Set(likedPostIds);
    if (isLiked) {
      newLikedPostIds.delete(id);
    } else {
      newLikedPostIds.add(id);
    }
    setLikedPostIds(newLikedPostIds);

    // Update posts with new like count
    setPosts(posts.map((post) => 
      post.id === id 
        ? { ...post, liked: !isLiked, likesCount: post.likesCount + (isLiked ? -1 : 1) }
        : post
    ));
  };

  const handleToggleComments = async (postId: string) => {
    if (!user) {
      setError(t("signInToReply"));
      return;
    }

    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId);
      setExpandedComments(newExpanded);
    } else {
      newExpanded.add(postId);
      setExpandedComments(newExpanded);

      // Load comments if not already loaded
      if (!comments[postId] && !usingLocalStorage) {
        const { comments: postComments } = await getCommentsForPost(postId);
        setComments(prev => ({ ...prev, [postId]: postComments }));
      }
    }
  };

  const handlePostComment = async (postId: string) => {
    if (!user) {
      setError(t("signInToReply"));
      return;
    }

    const text = commentText[postId]?.trim();
    if (!text) return;

    if (usingLocalStorage) {
      // LocalStorage fallback - not supported for comments
      setError("Comments require Supabase");
      return;
    }

    setIsPostingComment(true);
    setError(null);

    try {
      const profile = await getCurrentUserProfile(user.id);
      const nickname = profile?.display_name || profile?.username || null;

      const { comment, error } = await createWatercoolerComment(
        postId,
        user.id,
        nickname,
        text
      );

      if (error) {
        setError(error);
        return;
      }

      if (comment) {
        // Track watercooler comment activity (fire-and-forget)
        void trackUserActivity({
          userId: user.id,
          activityType: 'watercooler_comment',
        }).catch(console.warn);

        setComments(prev => ({
          ...prev,
          [postId]: [...(prev[postId] || []), comment]
        }));
        setCommentText(prev => ({ ...prev, [postId]: "" }));
        setSuccessMessage(t("replyPosted"));
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (e) {
      setError(t("replyError"));
    } finally {
      setIsPostingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string, postId: string) => {
    if (!user) return;

    if (usingLocalStorage) {
      setError("Comments require Supabase");
      return;
    }

    try {
      const { error } = await deleteOwnWatercoolerComment(commentId, user.id);
      if (error) {
        setError(error);
        return;
      }

      setComments(prev => ({
        ...prev,
        [postId]: prev[postId]?.filter(c => c.id !== commentId) || []
      }));
      setSuccessMessage(t("replyDeleted"));
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (e) {
      setError(t("replyDeleteError"));
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    
    setIsDeleting(true);
    setError(null);

    try {
      const { error } = await deleteOwnWatercoolerPost(id, user.id);
      if (error) {
        setError(t("postDeleteError"));
        return;
      }

      setSuccessMessage(t("postDeleted"));
      setTimeout(() => setSuccessMessage(null), 3000);

      // Remove the deleted post from state instead of refetching
      setPosts(posts.filter(post => post.id !== id));

      setDeleteConfirm(null);
    } catch (e) {
      setError(t("postDeleteError"));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReport = async () => {
    if (!user || !showReportDialog) return;

    setIsReporting(true);
    setError(null);

    try {
      const { error } = await reportWatercoolerPost(
        showReportDialog,
        user.id,
        reportReason,
        reportDetails || undefined
      );

      if (error) {
        setError(t("reportError"));
        return;
      }

      setSuccessMessage(t("reportSubmitted"));
      setTimeout(() => setSuccessMessage(null), 3000);
      setShowReportDialog(null);
      setReportReason("");
      setReportDetails("");
    } catch (e) {
      setError(t("reportError"));
    } finally {
      setIsReporting(false);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const isPostDisabled = !text.trim() && !mediaFile;

  return (
    <div className="glass-card rounded-3xl p-6">
      <h2 className="text-xl font-display font-bold text-foreground mb-2">
        {t("watercoolerWall")}
      </h2>
      <p className="text-sm text-muted-foreground mb-2">
        {t("watercoolerSubtitle")}
      </p>

      {/* Public notice */}
      {isConfigured && !usingLocalStorage && (
        <p className="text-xs text-muted-foreground mb-6">
          {t("watercoolerPublicNotice")}
        </p>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="text-center py-4">
          <div className="animate-spin w-6 h-6 mx-auto mb-2 border-4 border-[var(--gradient-mint)] border-t-transparent rounded-full"></div>
          <p className="text-xs text-muted-foreground">Loading...</p>
        </div>
      )}

      {/* Success message */}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-100/50 border border-green-200/50 rounded-xl text-sm text-green-700">
          {successMessage}
        </div>
      )}

      {/* Composer */}
      <div className="mb-8 p-5 bg-white/30 rounded-2xl border border-white/30">
        {/* Sign-in CTA for logged-out users */}
        {!user && isConfigured && !usingLocalStorage && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-3">
              {t("signInToPostWatercooler")}
            </p>
            <a
              href="/auth"
              className="inline-block px-4 py-2 bg-gradient-to-r from-[var(--gradient-mint)] to-[var(--gradient-lav)] text-foreground rounded-full text-sm font-semibold hover:opacity-95 transition-opacity shadow-[var(--shadow-glow)]"
            >
              {t("signIn")}
            </a>
          </div>
        )}

        {/* Post composer for logged-in users or localStorage mode */}
        {(user || usingLocalStorage) && (
          <>
            <div className="flex items-start gap-3 mb-3">
              <textarea
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  setError(null);
                }}
                placeholder={t("watercoolerPostPlaceholder")}
                maxLength={180}
                className="flex-1 bg-transparent border-0 resize-none focus:outline-none text-foreground placeholder:text-muted-foreground/50 text-sm min-h-[80px]"
              />
              
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="text-xs bg-white/50 border border-white/30 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-white/30 whitespace-nowrap"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground">
                {text.length}/180
              </span>
            </div>

            {/* Media Preview */}
            {mediaPreview && (
              <div className="mb-4 relative rounded-xl overflow-hidden bg-white/20">
                {mediaType === "image" ? (
                  <img
                    src={mediaPreview}
                    alt="Preview"
                    className="w-full max-h-[200px] object-contain"
                  />
                ) : (
                  <video
                    src={mediaPreview}
                    controls
                    className="w-full max-h-[200px]"
                  />
                )}
                <button
                  onClick={removeMedia}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full text-white transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
                {mediaFile && (
                  <p className="absolute bottom-2 left-2 text-xs text-white/80 bg-black/50 px-2 py-1 rounded">
                    {mediaFile.name}
                  </p>
                )}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <p className="mb-3 text-xs text-red-500/80">
                {error}
              </p>
            )}

            {/* Action Row */}
            <div className="flex items-center justify-between pt-3 border-t border-white/20">
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white/50 hover:bg-white/70 rounded-lg border border-white/30 transition-all text-xs font-medium text-foreground/80"
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  {t("uploadImage")}
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white/50 hover:bg-white/70 rounded-lg border border-white/30 transition-all text-xs font-medium text-foreground/80"
                >
                  <Video className="h-3.5 w-3.5" />
                  {t("uploadVideo")}
                </button>
                {mediaFile && (
                  <button
                    onClick={removeMedia}
                    className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-all text-xs font-medium text-red-600"
                  >
                    <X className="h-3.5 w-3.5" />
                    {t("removeMedia")}
                  </button>
                )}
              </div>

              <button
                onClick={handlePost}
                disabled={isPostDisabled || isPosting}
                className="px-5 py-2 bg-gradient-to-r from-pink-300 to-cyan-300 text-slate-700 rounded-lg font-semibold text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {isPosting ? "Posting..." : t("postToWatercooler")}
              </button>
            </div>

            {/* Media public notice */}
            {isConfigured && !usingLocalStorage && (
              <p className="mt-3 text-xs text-muted-foreground text-center">
                {t("mediaPublicNotice")}
              </p>
            )}
          </>
        )}
      </div>

      {/* Trending Section */}
      {trendingPosts.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <span className="text-lg">🔥</span>
            {t("trendingThisWeek")}
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {trendingPosts.map((post) => (
              <div
                key={post.id}
                className="flex-shrink-0 w-48 p-3 bg-white/30 rounded-xl border border-white/30 hover:bg-white/40 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-1 mb-2">
                  <Heart className="h-3 w-3 text-red-500" />
                  <span className="text-xs text-foreground/70">{post.likesCount}</span>
                </div>
                <p className="text-xs text-foreground line-clamp-2">{post.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Posts Feed */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-foreground font-medium mb-2">
              {t("quietBreakroom")}
            </p>
            <p className="text-muted-foreground text-sm">
              {t("startFirstTinyWin")}
            </p>
          </div>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className="p-4 bg-white/30 rounded-2xl border border-white/30 hover:bg-white/40 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs font-medium px-2.5 py-1 bg-white/50 rounded-full text-foreground/80">
                  {post.category}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatTimestamp(post.timestamp)}
                </span>
              </div>

              {post.text && (
                <p className="text-foreground text-sm mb-3 leading-relaxed">
                  {post.text}
                </p>
              )}

              {/* Media Display */}
              {post.mediaUrl && post.mediaType && (
                <div className="mb-3 rounded-xl overflow-hidden bg-white/20">
                  {post.mediaType === "image" ? (
                    <img
                      src={post.mediaUrl}
                      alt="Post media"
                      className="w-full max-h-[300px] object-contain"
                    />
                  ) : (
                    <video
                      src={post.mediaUrl}
                      controls
                      className="w-full max-h-[300px]"
                    />
                  )}
                </div>
              )}

              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleLike(post.id)}
                    className="flex items-center gap-1.5 text-xs text-foreground/70 hover:text-foreground transition-all"
                  >
                    <Heart
                      className={`h-4 w-4 ${
                        likedPostIds.has(post.id) ? "fill-red-500 text-red-500" : ""
                      }`}
                    />
                    {post.likesCount > 0 && <span>{post.likesCount}</span>}
                  </button>

                  <button
                    onClick={() => handleToggleComments(post.id)}
                    className="flex items-center gap-1.5 text-xs text-foreground/70 hover:text-foreground transition-all"
                  >
                    <MessageCircle className="h-4 w-4" />
                    {comments[post.id]?.length || 0}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {/* Report button for logged-in users */}
                  {user && !post.isStarter && (
                    <button
                      onClick={() => {
                        if (!user) {
                          setError(t("signInToPost"));
                          return;
                        }
                        setShowReportDialog(post.id);
                      }}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-orange-500 transition-all"
                    >
                      <Flag className="h-4 w-4" />
                      {t("reportPost")}
                    </button>
                  )}

                  {/* Delete button only for post owners */}
                  {!post.isStarter && post.userId === user?.id && (
                    <button
                      onClick={() => setDeleteConfirm(post.id)}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-500 transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                      {t("deletePost")}
                    </button>
                  )}
                </div>
              </div>

              {/* Comments Section */}
              {expandedComments.has(post.id) && (
                <div className="mt-4 pt-4 border-t border-white/20">
                  {/* Existing Comments */}
                  {comments[post.id]?.length > 0 ? (
                    <div className="space-y-3 mb-4">
                      {comments[post.id].slice(0, 3).map((comment) => (
                        <div key={comment.id} className="flex gap-2 items-start">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-xs font-medium text-white shrink-0">
                            {comment.nickname?.[0] || "?"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium text-foreground">
                                {comment.nickname || "Anonymous"}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatTimestamp(new Date(comment.created_at).getTime())}
                              </span>
                            </div>
                            <p className="text-xs text-foreground/80">{comment.body}</p>
                            {comment.user_id === user?.id && (
                              <button
                                onClick={() => handleDeleteComment(comment.id, post.id)}
                                className="mt-1 text-xs text-muted-foreground hover:text-red-500 transition-colors"
                              >
                                {t("deleteReply")}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                      {comments[post.id]?.length > 3 && (
                        <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                          {t("viewMoreReplies")}
                        </button>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground mb-4">
                      {t("noRepliesYet")}
                    </p>
                  )}

                  {/* Comment Input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={commentText[post.id] || ""}
                      onChange={(e) => setCommentText(prev => ({ ...prev, [post.id]: e.target.value }))}
                      placeholder={t("writeReply")}
                      className="flex-1 px-3 py-2 bg-white/50 rounded-lg border border-white/30 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                      onKeyPress={(e) => e.key === "Enter" && handlePostComment(post.id)}
                    />
                    <button
                      onClick={() => handlePostComment(post.id)}
                      disabled={!commentText[post.id]?.trim() || isPostingComment}
                      className="px-3 py-2 bg-gradient-to-r from-blue-400 to-purple-400 text-white rounded-lg text-xs font-medium hover:opacity-95 transition-opacity disabled:opacity-50"
                    >
                      {t("postReply")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Report Dialog */}
      {showReportDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-2xl p-6 max-w-md w-full bg-white/90">
            <h3 className="text-lg font-display font-bold text-foreground mb-2">
              {t("reportPost")}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t("reportReason")}
            </p>
            
            <div className="space-y-2 mb-4">
              <label className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/50 cursor-pointer border border-transparent hover:border-white/30">
                <input
                  type="radio"
                  name="reportReason"
                  value="Spam"
                  checked={reportReason === "Spam"}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-4 h-4"
                />
                <span className="text-sm">{t("reportSpam")}</span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/50 cursor-pointer border border-transparent hover:border-white/30">
                <input
                  type="radio"
                  name="reportReason"
                  value="Harassment"
                  checked={reportReason === "Harassment"}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-4 h-4"
                />
                <span className="text-sm">{t("reportHarassment")}</span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/50 cursor-pointer border border-transparent hover:border-white/30">
                <input
                  type="radio"
                  name="reportReason"
                  value="Inappropriate media"
                  checked={reportReason === "Inappropriate media"}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-4 h-4"
                />
                <span className="text-sm">{t("reportInappropriateMedia")}</span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/50 cursor-pointer border border-transparent hover:border-white/30">
                <input
                  type="radio"
                  name="reportReason"
                  value="Other"
                  checked={reportReason === "Other"}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-4 h-4"
                />
                <span className="text-sm">{t("reportOther")}</span>
              </label>
            </div>

            <textarea
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              placeholder="Additional details (optional)"
              className="w-full px-3 py-2 rounded-lg bg-white/50 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/30 text-sm min-h-[80px]"
              maxLength={500}
            />

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  setShowReportDialog(null);
                  setReportReason("");
                  setReportDetails("");
                }}
                className="flex-1 px-4 py-2 bg-white/50 hover:bg-white/70 rounded-lg border border-white/30 text-sm font-medium text-foreground transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleReport}
                disabled={!reportReason || isReporting}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-400 to-red-400 text-white rounded-lg text-sm font-medium transition-all hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isReporting ? "Submitting..." : t("submitReport")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-2xl p-6 max-w-sm w-full bg-white/90">
            <h3 className="text-lg font-display font-bold text-foreground mb-2">
              {t("deletePost")}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t("deletePostConfirm")}
            </p>
            
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 bg-white/50 hover:bg-white/70 rounded-lg border border-white/30 text-sm font-medium text-foreground transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? "Deleting..." : t("deletePost")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
