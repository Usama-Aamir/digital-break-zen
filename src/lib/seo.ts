export const SITE_URL = "https://digital-break-zen.aamirusama8.workers.dev";

export interface BlogPostForSEO {
  title: string;
  slug: string;
  date: string;
  category: string;
  description: string;
  tags?: string[];
}

export function getBlogJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Breakroom Blog | The Digital Breakroom",
    description: "Workplace stress relief, office humor, student break ideas, burnout-friendly micro-breaks, and calming tools for tired brains.",
    url: `${SITE_URL}/blog`,
  };
}

export function getArticleJsonLd(post: BlogPostForSEO) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: "The Digital Breakroom",
    publisher: "The Digital Breakroom",
    keywords: post.tags?.join(", ") || post.category,
    mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
  };
}
