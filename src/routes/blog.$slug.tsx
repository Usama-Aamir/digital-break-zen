import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { getPostBySlug } from "@/lib/blog";
import { useLanguage } from "@/lib/language";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/blog/$slug")({
  head: () => ({
    meta: [
      { title: "Article — The Digital Breakroom" },
      { name: "description", content: "Read helpful articles about office stress relief, study breaks, and workplace wellness." },
    ],
  }),
  component: BlogArticlePage,
});

function BlogArticlePage() {
  const { t } = useLanguage();
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const post = getPostBySlug(slug);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  };

  if (!post) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto">
          <div className="glass-card rounded-2xl p-8 text-center">
            <h1 className="text-2xl font-display font-bold text-foreground mb-4">
              {t("articleNotFound")}
            </h1>
            <p className="text-muted-foreground mb-6">
              The article you're looking for doesn't exist or has been removed.
            </p>
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[var(--gradient-mint)] to-[var(--gradient-lav)] text-foreground rounded-full font-semibold hover:opacity-95 transition-opacity shadow-[var(--shadow-glow)]"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("backToBlog")}
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto">
        {/* Back to Blog */}
        <div className="mb-6">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("backToBlog")}
          </Link>
        </div>

        {/* Article Card */}
        <div className="glass-card rounded-2xl p-6 sm:p-8 mb-8">
          {/* Category Pill */}
          <div className="mb-4">
            <span className="inline-block text-xs font-semibold px-3 py-1 bg-gradient-to-r from-[var(--gradient-mint)] to-[var(--gradient-lav)] text-foreground rounded-full">
              {post.category}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">
            {post.title}
          </h1>

          {/* Description */}
          <p className="text-lg text-muted-foreground mb-6">
            {post.description}
          </p>

          {/* Date */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8 pb-8 border-b border-white/20">
            <span>{formatDate(post.date)}</span>
          </div>

          {/* Article Content */}
          <div className="prose prose-lg max-w-none">
            {post.content.map((paragraph, index) => (
              <p key={index} className="mb-4 text-foreground/90 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        {/* CTA Card */}
        <div className="glass-card rounded-2xl p-6 sm:p-8 bg-gradient-to-br from-pink-100/40 to-cyan-100/40">
          <h2 className="text-2xl font-display font-bold text-foreground mb-3">
            {t("needBreakNow")}
          </h2>
          <p className="text-muted-foreground mb-6">
            Open The Digital Breakroom and take a tiny reset.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-300 to-cyan-300 text-slate-700 rounded-full font-semibold hover:shadow-lg transition-all shadow-md"
          >
            {t("openBreakroom")}
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
