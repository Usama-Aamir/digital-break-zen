import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { getAllPosts, getFeaturedPosts } from "@/lib/blog";
import { useLanguage } from "@/lib/language";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Breakroom Blog — The Digital Breakroom" },
      { name: "description", content: "Tiny reads for tired brains, office chaos, and better breaks." },
    ],
  }),
  component: BlogPage,
});

function BlogPage() {
  const { t } = useLanguage();
  const allPosts = getAllPosts();
  const featuredPosts = getFeaturedPosts();
  const nonFeaturedPosts = allPosts.filter((post) => !post.featured);

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
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-display font-bold text-foreground mb-4">
            {t("blogTitle")}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("blogSubtitle")}
          </p>
        </div>

        {/* Featured Reads */}
        {featuredPosts.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-display font-bold text-foreground mb-6">
              {t("featuredReads")}
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {featuredPosts.map((post) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>
          </div>
        )}

        {/* All Posts */}
        {nonFeaturedPosts.length > 0 && (
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground mb-6">
              {t("allPosts")}
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {nonFeaturedPosts.map((post) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
