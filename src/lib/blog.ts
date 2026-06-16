export interface BlogPost {
  title: string;
  slug: string;
  date: string;
  category: string;
  featured: boolean;
  description: string;
}

// Static blog metadata - will be replaced with dynamic markdown parsing in future phase
const POSTS: BlogPost[] = [
  {
    title: "Quick Office Break Ideas",
    slug: "quick-office-break-ideas",
    date: "2024-01-15",
    category: "Productivity",
    featured: true,
    description: "Short, effective break ideas for busy office workers.",
  },
  {
    title: "Signs You Need a Mental Break",
    slug: "signs-you-need-a-mental-break",
    date: "2024-01-20",
    category: "Mental Health",
    featured: true,
    description: "Recognizing when it's time to step back and recharge.",
  },
  {
    title: "Funny Office Stress Relief Games",
    slug: "funny-office-stress-relief-games",
    date: "2024-01-25",
    category: "Fun",
    featured: false,
    description: "Lighthearted games to relieve workplace stress.",
  },
  {
    title: "Student Study Break Ideas",
    slug: "student-study-break-ideas",
    date: "2024-02-01",
    category: "Study Tips",
    featured: true,
    description: "Effective break strategies for students during study sessions.",
  },
  {
    title: "Corporate Burnout in Malaysia",
    slug: "corporate-burnout-malaysia",
    date: "2024-02-10",
    category: "Workplace",
    featured: true,
    description: "Understanding and addressing burnout in Malaysian corporate culture.",
  },
];

export function getAllPosts(): BlogPost[] {
  return POSTS.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return POSTS.find((post) => post.slug === slug);
}

export function getFeaturedPosts(): BlogPost[] {
  return POSTS.filter((post) => post.featured).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
