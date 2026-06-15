import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { useLanguage } from "@/lib/language";

interface Meme {
  title: string;
  url: string;
  postLink: string;
  subreddit: string;
  author: string;
  nsfw: boolean;
  spoiler: boolean;
}

interface MemeApiResponse {
  memes: Meme[];
}

export function OfficeMemeScroller() {
  const { t } = useLanguage();
  const [memes, setMemes] = useState<Meme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [likedMemes, setLikedMemes] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchMemes = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("https://meme-api.com/gimme/workmemes/50");
        if (!response.ok) {
          throw new Error("Failed to fetch memes");
        }
        const data: MemeApiResponse = await response.json();
        
        // Filter out unsafe items defensively
        const safeMemes = data.memes.filter(
          (meme) => !meme.nsfw && !meme.spoiler && meme.url
        );
        
        setMemes(safeMemes);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load memes");
      } finally {
        setLoading(false);
      }
    };

    fetchMemes();
  }, []);

  const toggleLike = (url: string) => {
    setLikedMemes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(url)) {
        newSet.delete(url);
      } else {
        newSet.add(url);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="glass-card rounded-3xl p-6">
        <h2 className="text-xl font-display font-bold text-foreground mb-2">
          {t("officeMemesTitle")}
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          {t("officeMemesSubtitle")}
        </p>
        <div className="h-[75vh] md:h-[600px] overflow-hidden">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-full mb-4 rounded-2xl bg-white/30 animate-pulse"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card rounded-3xl p-6">
        <h2 className="text-xl font-display font-bold text-foreground mb-2">
          {t("officeMemesTitle")}
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          {t("officeMemesSubtitle")}
        </p>
        <div className="h-[75vh] md:h-[600px] flex items-center justify-center">
          <div className="text-center">
            <p className="text-foreground/80 mb-4">{t("memeLoadError")}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-white/70 rounded-xl hover:bg-white transition-all shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-glow)] text-sm font-semibold text-foreground/80"
            >
              {t("tryAgain")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (memes.length === 0) {
    return (
      <div className="glass-card rounded-3xl p-6">
        <h2 className="text-xl font-display font-bold text-foreground mb-2">
          {t("officeMemesTitle")}
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          {t("officeMemesSubtitle")}
        </p>
        <div className="h-[75vh] md:h-[600px] flex items-center justify-center">
          <p className="text-foreground/80">{t("loadingMemes")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-3xl p-6">
      <h2 className="text-xl font-display font-bold text-foreground mb-2">
        {t("officeMemesTitle")}
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        {t("officeMemesSubtitle")}
      </p>
      <div className="h-[75vh] md:h-[600px] overflow-y-auto snap-y snap-mandatory overscroll-contain rounded-2xl">
        {memes.map((meme, index) => (
          <div
            key={`${meme.url}-${index}`}
            className="snap-start h-full mb-4 last:mb-0"
          >
            <div className="relative h-full rounded-2xl overflow-hidden bg-white/20">
              <img
                src={meme.url}
                alt={meme.title || "Office meme"}
                className="w-full h-full object-contain"
                loading="lazy"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    {meme.title && (
                      <p className="text-white text-sm font-medium truncate">
                        {meme.title}
                      </p>
                    )}
                    {meme.subreddit && (
                      <p className="text-white/70 text-xs">
                        r/{meme.subreddit}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => toggleLike(meme.url)}
                    className="ml-3 flex-shrink-0 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-all"
                    aria-label={likedMemes.has(meme.url) ? t("liked") : t("like")}
                  >
                    <Heart
                      className={`h-5 w-5 ${
                        likedMemes.has(meme.url)
                          ? "fill-red-500 text-red-500"
                          : "text-white"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
