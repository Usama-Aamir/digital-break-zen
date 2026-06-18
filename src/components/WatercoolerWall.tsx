import { useEffect, useState, useRef } from "react";
import { Heart, Trash2, Image as ImageIcon, Video, X } from "lucide-react";
import { useLanguage } from "@/lib/language";
import { useAuth } from "@/lib/auth";
import { getPublishedWatercoolerPosts, createWatercoolerPost, deleteOwnWatercoolerPost, getWatercoolerDisplayName } from "@/lib/watercoolerPosts";

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
  },
  {
    id: "starter-2",
    text: "My coffee has done more work than me today.",
    mediaType: null,
    category: "Office Pain",
    timestamp: Date.now(),
    isStarter: true,
    liked: false,
  },
  {
    id: "starter-3",
    text: "Deadline is tomorrow. My brain left yesterday.",
    mediaType: null,
    category: "Study Stress",
    timestamp: Date.now(),
    isStarter: true,
    liked: false,
  },
  {
    id: "starter-4",
    text: "Let's circle back = nobody knows what's going on.",
    mediaType: null,
    category: "Corporate Translation",
    timestamp: Date.now(),
    isStarter: true,
    liked: false,
  },
  {
    id: "starter-5",
    text: "Currently pretending the spreadsheet makes sense.",
    mediaType: null,
    category: "Random Vibes",
    timestamp: Date.now(),
    isStarter: true,
    liked: false,
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
  const [usingLocalStorage, setUsingLocalStorage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load posts from Supabase or localStorage on mount
  useEffect(() => {
    async function loadPosts() {
      if (isConfigured) {
        setIsLoading(true);
        const { posts: cloudPosts, error } = await getPublishedWatercoolerPosts();
        if (error || cloudPosts.length === 0) {
          // Fallback to localStorage if Supabase fails or has no posts
          setUsingLocalStorage(true);
          loadLocalStoragePosts();
        } else {
          // Convert cloud posts to local Post format
          const convertedPosts: Post[] = cloudPosts.map((post) => ({
            id: post.id,
            text: post.body,
            mediaType: null, // Media not implemented in cloud yet
            category: post.mood_tag || "Random Vibes",
            timestamp: new Date(post.created_at).getTime(),
            isStarter: false,
            liked: false,
          }));
          setPosts(converted);
        }
        setIsLoading(false);
      } else {
        setUsingLocalStorage(true);
        loadLocalStoragePosts();
      }
    }

    loadPosts();
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

    // Check file type
    if (file.type.startsWith("image/")) {
      setMediaType("image");
    } else if (file.type.startsWith("video/")) {
      setMediaType("video");
    } else {
      setError(t("unsupportedMedia"));
      return;
    }

    // Check file size
    const maxSize = mediaType === "video" ? 10 * 1024 * 1024 : 3 * 1024 * 1024;
    if (file.size > maxSize) {
      setError(t("mediaTooLarge"));
      return;
    }

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

    // If logged in and using Supabase, post to cloud
    if (user && isConfigured && !usingLocalStorage) {
      setError(null);
      const { post: cloudPost, error } = await createWatercoolerPost(user.id, {
        body: text.trim(),
        nickname: user.email?.split("@")[0] || undefined,
        mood_tag: category,
      });

      if (error) {
        setError(t("watercoolerPostError"));
        return;
      }

      setSuccessMessage(t("watercoolerPostPublished"));
      setTimeout(() => setSuccessMessage(null), 3000);

      // Refresh posts from cloud
      const { posts: refreshedPosts } = await getPublishedWatercoolerPosts();
      if (refreshedPosts) {
        const convertedPosts: Post[] = refreshedPosts.map((post) => ({
          id: post.id,
          text: post.body,
          mediaType: null,
          category: post.mood_tag || "Random Vibes",
          timestamp: new Date(post.created_at).getTime(),
          isStarter: false,
          liked: false,
        }));
        setPosts(convertedPosts);
      }

      setText("");
      setCategory("Random Vibes");
      removeMedia();
    } else {
      // Fallback to localStorage
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
      };

      setPosts([newPost, ...posts]);
      setText("");
      setCategory("Random Vibes");
      removeMedia();
    }
  };

  const handleLike = (id: string) => {
    setPosts(posts.map((post) => 
      post.id === id ? { ...post, liked: !post.liked } : post
    ));
  };

  const handleDelete = (id: string) => {
    setPosts(posts.filter((post) => post.id !== id));
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
                disabled={isPostDisabled}
                className="px-5 py-2 bg-gradient-to-r from-pink-300 to-cyan-300 text-slate-700 rounded-lg font-semibold text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {t("postToWatercooler")}
              </button>
            </div>

            <p className="mt-3 text-xs text-muted-foreground text-center">
              {t("mediaComingSoon")}
            </p>
          </>
        )}
      </div>

      {/* Posts Feed */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm">
              {t("noWatercoolerPostsYet")}
            </p>
            <p className="text-muted-foreground text-xs mt-2">
              {t("noWatercoolerPostsText")}
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
                  {(() => {
                    // Try to load the media URL, if it fails show expired message
                    try {
                      if (post.mediaType === "image") {
                        return (
                          <img
                            src={post.mediaUrl}
                            alt="Post media"
                            className="w-full max-h-[300px] object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                              (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                            }}
                          />
                        );
                      } else if (post.mediaType === "video") {
                        return (
                          <video
                            src={post.mediaUrl}
                            controls
                            className="w-full max-h-[300px]"
                            onError={(e) => {
                              (e.target as HTMLVideoElement).style.display = "none";
                              (e.target as HTMLVideoElement).nextElementSibling?.classList.remove("hidden");
                            }}
                          />
                        );
                      }
                    } catch (e) {
                      console.error("[WatercoolerWall] Media load error:", e);
                    }
                    return null;
                  })()}
                  <div className="hidden p-4 text-center text-sm text-muted-foreground">
                    {t("mediaPreviewExpired")}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mt-3">
                <button
                  onClick={() => handleLike(post.id)}
                  className="flex items-center gap-1.5 text-xs text-foreground/70 hover:text-foreground transition-all"
                >
                  <Heart
                    className={`h-4 w-4 ${
                      post.liked ? "fill-red-500 text-red-500" : ""
                    }`}
                  />
                  {post.liked ? t("liked") : t("like")}
                </button>

                {!post.isStarter && (
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-500 transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                    {t("delete")}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
