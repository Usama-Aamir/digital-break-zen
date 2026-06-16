import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { getAllPosts, getFeaturedPosts } from "@/lib/blog";
import { useLanguage } from "@/lib/language";
import { SITE_URL, getBlogJsonLd } from "@/lib/seo";
import { useState } from "react";
import { Search, X } from "lucide-react";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Breakroom Blog | The Digital Breakroom" },
      { name: "description", content: "Workplace stress relief, office humor, student break ideas, burnout-friendly micro-breaks, and calming tools for tired brains." },
      { property: "og:title", content: "Breakroom Blog | The Digital Breakroom" },
      { property: "og:description", content: "Workplace stress relief, office humor, student break ideas, burnout-friendly micro-breaks, and calming tools for tired brains." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/blog` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Breakroom Blog | The Digital Breakroom" },
      { name: "twitter:description", content: "Workplace stress relief, office humor, student break ideas, burnout-friendly micro-breaks, and calming tools for tired brains." },
    ],
    links: [
      { rel: "canonical", href: `${SITE_URL}/blog` },
    ],
    scripts: [
      {
        type: "application/ld+json",
        innerHTML: JSON.stringify(getBlogJsonLd()),
      },
    ],
  }),
  component: BlogPage,
});

function BlogPage() {
  const { t } = useLanguage();
  const location = useLocation();
  const isBlogIndex = location.pathname === "/blog";
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const allPosts = getAllPosts();
  const featuredPosts = getFeaturedPosts();
  const nonFeaturedPosts = allPosts.filter((post) => !post.featured);

  // If not on /blog index, render outlet for child routes
  if (!isBlogIndex) {
    return <Outlet />;
  }

  // Filter posts based on search and category
  const filterPosts = (posts: ReturnType<typeof getAllPosts>) => {
    return posts.filter((post) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        post.title.toLowerCase().includes(searchLower) ||
        post.description.toLowerCase().includes(searchLower) ||
        post.category.toLowerCase().includes(searchLower) ||
        post.content.some((paragraph) => paragraph.toLowerCase().includes(searchLower));

      // Category filter
      const matchesFilter = selectedFilter === "All" || post.category === selectedFilter;

      return matchesSearch && matchesFilter;
    });
  };

  const filteredFeaturedPosts = filterPosts(featuredPosts);
  const filteredNonFeaturedPosts = filterPosts(nonFeaturedPosts);
  const hasResults = filteredFeaturedPosts.length > 0 || filteredNonFeaturedPosts.length > 0;

  // Get unique categories from all posts
  const categories = Array.from(new Set(allPosts.map((post) => post.category)));
  const filters = ["All", ...categories];

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  };

  const BlogCard = ({ post }: { post: ReturnType<typeof getAllPosts>[number] }) => (
    <div className="glass-card rounded-2xl p-6 hover:scale-[1.02] transition-transform duration-300">
      <div className="mb-3">
        <span className="inline-block text-xs font-semibold px-3 py-1 bg-gradient-to-r from-[var(--gradient-mint)] to-[var(--gradient-lav)] text-foreground rounded-full">
          {post.category}
        </span>
      </div>
      <h3 className="text-lg font-display font-bold text-foreground mb-2">
        {post.title}
      </h3>
      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
        {post.description}
      </p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {formatDate(post.date)}
        </span>
        <Link
          to="/blog/$slug"
          params={{ slug: post.slug }}
          className="text-xs font-semibold text-foreground/80 hover:text-foreground transition-colors"
        >
          {t("readArticle")} →
        </Link>
      </div>
    </div>
  );

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-display font-bold text-foreground mb-4">
            {t("blogTitle")}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("blogSubtitle")}
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder={t("blogSearchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-12 py-3 rounded-2xl bg-white/40 border border-white/30 backdrop-blur-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--gradient-mint)] transition-all"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Chips */}
        <div className="mb-8">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedFilter === filter
                    ? "bg-gradient-to-r from-[var(--gradient-mint)] to-[var(--gradient-lav)] text-foreground shadow-[var(--shadow-soft)]"
                    : "bg-white/40 border border-white/30 text-muted-foreground hover:bg-white/60"
                }`}
              >
                {filter === "All" ? t("allFilter") : filter}
              </button>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {!hasResults && (
          <div className="glass-card rounded-2xl p-8 text-center mb-8">
            <h2 className="text-2xl font-display font-bold text-foreground mb-4">
              {t("noPostsFound")}
            </h2>
            <p className="text-muted-foreground mb-6">
              {t("tryDifferentKeyword")}
            </p>
            <button
              onClick={handleClearSearch}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[var(--gradient-mint)] to-[var(--gradient-lav)] text-foreground rounded-full font-semibold hover:opacity-95 transition-opacity shadow-[var(--shadow-glow)]"
            >
              <X className="h-4 w-4" />
              {t("clearSearch")}
            </button>
          </div>
        )}

        {/* Featured Reads */}
        {filteredFeaturedPosts.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-display font-bold text-foreground mb-6">
              {t("featuredReads")}
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {filteredFeaturedPosts.map((post) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>
          </div>
        )}

        {/* All Posts */}
        {filteredNonFeaturedPosts.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-display font-bold text-foreground mb-6">
              {t("allPosts")}
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {filteredNonFeaturedPosts.map((post) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>
          </div>
        )}

        {/* Coming Soon CTA */}
        <div className="glass-card rounded-2xl p-6 sm:p-8 bg-gradient-to-br from-purple-100/40 to-pink-100/40">
          <h2 className="text-2xl font-display font-bold text-foreground mb-3">
            Want to share your own workplace story?
          </h2>
          <p className="text-muted-foreground mb-6">
            Community blog submissions are coming soon.
          </p>
          <button
            disabled
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-300 to-pink-300 text-slate-700 rounded-full font-semibold opacity-50 cursor-not-allowed"
          >
            Coming soon
          </button>
        </div>
      </div>
    </AppShell>
  );
}
