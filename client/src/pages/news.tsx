import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Calendar, Tag, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { PageHero } from "@/components/hero-section";
import { SEOHead, generateStructuredData } from "@/components/seo-head";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { db, type Post } from "@/lib/database";

const demoPosts: Partial<Post>[] = [
  {
    id: "1",
    title: "GroupTherapy Announces Summer Festival 2024 Lineup",
    slug: "summer-festival-2024-lineup",
    excerpt: "Get ready for the biggest GroupTherapy event yet! We're thrilled to reveal the full lineup for our annual summer festival.",
    coverUrl: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&h=400&fit=crop",
    category: "events",
    publishedAt: new Date("2024-03-01").toISOString(),
    featured: true,
    authorName: "GroupTherapy Team",
  },
  {
    id: "2",
    title: "Luna Wave Drops New Album 'Midnight Sessions'",
    slug: "luna-wave-midnight-sessions",
    excerpt: "After two years in the making, Luna Wave delivers her most ambitious project to date with 'Midnight Sessions'.",
    coverUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=400&fit=crop",
    category: "releases",
    publishedAt: new Date("2024-02-28").toISOString(),
    featured: true,
    authorName: "Sarah Chen",
  },
  {
    id: "3",
    title: "Behind the Scenes: GroupTherapy Radio Studio",
    slug: "behind-the-scenes-radio-studio",
    excerpt: "Take an exclusive tour of our state-of-the-art radio studio where the magic happens 24/7.",
    coverUrl: "https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=800&h=400&fit=crop",
    category: "features",
    publishedAt: new Date("2024-02-25").toISOString(),
    authorName: "Marcus Rivera",
  },
  {
    id: "4",
    title: "Interview: Neon Pulse on the Evolution of Techno",
    slug: "neon-pulse-interview",
    excerpt: "We sat down with Neon Pulse to discuss the past, present, and future of techno music.",
    coverUrl: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=400&fit=crop",
    category: "interviews",
    publishedAt: new Date("2024-02-20").toISOString(),
    authorName: "Alex Thompson",
  },
  {
    id: "5",
    title: "New Partnership with Pioneer DJ Announced",
    slug: "pioneer-dj-partnership",
    excerpt: "GroupTherapy Records partners with Pioneer DJ to bring cutting-edge technology to our artists and events.",
    coverUrl: "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=800&h=400&fit=crop",
    category: "news",
    publishedAt: new Date("2024-02-15").toISOString(),
    authorName: "Emma Wilson",
  },
  {
    id: "6",
    title: "Circuit Breaker World Tour Dates Revealed",
    slug: "circuit-breaker-world-tour",
    excerpt: "Circuit Breaker announces a 30-date world tour supporting his latest album 'Velocity'.",
    coverUrl: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&h=400&fit=crop",
    category: "events",
    publishedAt: new Date("2024-02-10").toISOString(),
    authorName: "GroupTherapy Team",
  },
];

const categories = ["all", "news", "releases", "events", "interviews", "features"];

export default function NewsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { data: posts } = useQuery<Post[]>({
    queryKey: ["posts"],
    queryFn: () => db.posts.getPublished(),
  });

  const displayPosts = posts?.length ? posts : demoPosts;

  const filteredPosts = displayPosts.filter((post) => {
    const matchesSearch =
      post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredPosts = filteredPosts.filter((p) => p.featured);
  const regularPosts = filteredPosts.filter((p) => !p.featured);

  const formatDate = (date: Date | string | null) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const blogSchema = generateStructuredData("Blog", {
    name: "GroupTherapy Radar",
    description: "News, interviews, and stories from the world of electronic music",
    blogPost: displayPosts.slice(0, 10).map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      description: post.excerpt,
      image: post.coverUrl,
      datePublished: post.publishedAt,
      author: {
        "@type": "Person",
        name: post.authorName,
      },
    })),
  });

  return (
    <div className="min-h-screen">
      <SEOHead
        title="News & Articles - GroupTherapy Radar | Electronic Music News"
        description="Stay updated with the latest electronic music news, artist interviews, release announcements, and behind-the-scenes stories from GroupTherapy Records."
        keywords={["electronic music news", "DJ interviews", "music industry news", "album announcements", "artist features", "music blog"]}
        structuredData={blogSchema}
      />
      
      <PageHero
        title="GroupTherapy Radar"
        subtitle="News, interviews, and stories from the world of electronic music"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-news"
            />
          </div>
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="overflow-x-auto">
              {categories.map((cat) => (
                <TabsTrigger key={cat} value={cat} className="capitalize" data-testid={`tab-${cat}`}>
                  {cat}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Featured Posts */}
        {featuredPosts.length > 0 && selectedCategory === "all" && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Featured Stories</h2>
            <div className="grid lg:grid-cols-2 gap-6">
              {featuredPosts.slice(0, 2).map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <FeaturedPostCard post={post as Post} formatDate={formatDate} />
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* All Posts */}
        <section>
          <h2 className="text-2xl font-bold mb-6">
            {selectedCategory === "all" ? "Latest Articles" : `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}`}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularPosts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <PostCard post={post as Post} formatDate={formatDate} />
              </motion.div>
            ))}
          </div>
        </section>

        {filteredPosts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No articles found</p>
          </div>
        )}
      </div>
    </div>
  );
}

function FeaturedPostCard({
  post,
  formatDate,
}: {
  post: Post;
  formatDate: (date: Date | string | null) => string;
}) {
  return (
    <Link href={`/news/${post.slug || post.id}`}>
      <Card className="overflow-hidden group h-full bg-background" data-testid={`card-post-featured-${post.id}`}>
        <div className="relative aspect-[16/9] overflow-hidden bg-muted">
          {post.coverUrl ? (
            <img
              src={post.coverUrl}
              alt={post.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-muted" />
          )}
          {post.category && (
            <div className="absolute top-4 left-4">
              <span className="px-2 py-1 text-[10px] font-medium bg-background/90 text-foreground rounded-full uppercase tracking-wide border border-border/50">
                {post.category}
              </span>
            </div>
          )}
        </div>
        <CardContent className="p-5">
          <h3 className="text-xl md:text-2xl font-semibold tracking-tight leading-snug group-hover:text-primary transition-colors">
            {post.title}
          </h3>
          {post.excerpt && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
              {post.excerpt}
            </p>
          )}
          <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(post.publishedAt ?? null)}
            </span>
            <span className="flex items-center gap-1 font-medium">
              Read
              <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function PostCard({
  post,
  formatDate,
}: {
  post: Post;
  formatDate: (date: Date | string | null) => string;
}) {
  return (
    <Link href={`/news/${post.slug || post.id}`}>
      <Card className="overflow-hidden group h-full bg-background" data-testid={`card-post-${post.id}`}>
        <div className="relative aspect-[3/2] overflow-hidden bg-muted">
          {post.coverUrl ? (
            <img
              src={post.coverUrl}
              alt={post.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-muted" />
          )}
          {post.category && (
            <div className="absolute top-3 left-3">
              <span className="px-2 py-1 text-[10px] font-medium bg-background/90 text-foreground rounded-full uppercase tracking-wide border border-border/50">
                {post.category}
              </span>
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {post.title}
          </h3>
          {post.excerpt && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
              {post.excerpt}
            </p>
          )}
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-4">
            <span>{formatDate(post.publishedAt ?? null)}</span>
            <span className="flex items-center gap-1 font-medium group-hover:text-foreground transition-colors">
              Read
              <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
