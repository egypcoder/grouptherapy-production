import { useRoute, Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, User, Tag, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { db, type Post } from "@/lib/database";
import { SEOHead, generateStructuredData } from "@/components/seo-head";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";

function estimateReadTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

export default function PostDetailPage() {
  const [, params] = useRoute("/news/:slug");
  const slug = params?.slug;

  const { data: post, isLoading } = useQuery<Post | null>({
    queryKey: ["post", slug],
    queryFn: async () => {
      if (!slug) return null;
      const bySlug = await db.posts.getBySlug(slug);
      if (bySlug) return bySlug;
      return db.posts.getById(slug);
    },
    enabled: !!slug,
  });

  const { data: relatedPosts } = useQuery<Post[]>({
    queryKey: ["related-posts", post?.category],
    queryFn: async () => {
      if (!post?.category) return [];
      const allPosts = await db.posts.getAll();
      return allPosts
        .filter(p => p.published && p.category === post.category && p.id !== post.id)
        .slice(0, 3);
    },
    enabled: !!post?.category,
  });

  const postSchema = post ? generateStructuredData("Article", {
    headline: post.title,
    description: post.excerpt,
    image: post.coverUrl || post.ogImageUrl,
    datePublished: post.publishedAt || post.createdAt,
    author: {
      "@type": "Person",
      name: post.authorName || "GroupTherapy Records",
    },
    publisher: {
      "@type": "Organization",
      name: "GroupTherapy Records",
    },
  }) : null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Article Not Found</h1>
          <Link href="/news">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to News
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const readTime = post.content ? estimateReadTime(post.content) : 0;

  return (
    <div className="min-h-screen">
      <SEOHead
        title={post.metaTitle || `${post.title} - GroupTherapy Records`}
        description={post.metaDescription || post.excerpt || `Read ${post.title} on GroupTherapy Records`}
        keywords={post.tags || [post.category, "news", "music"]}
        structuredData={postSchema}
      />

      <div className="relative">
        {post.coverUrl && (
          <div className="absolute inset-0 h-[50vh] overflow-hidden">
            <img
              src={post.coverUrl}
              alt={post.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background" />
          </div>
        )}

        <div className={`relative pt-24 pb-12 px-4 sm:px-6 lg:px-8 ${post.coverUrl ? '' : 'bg-muted/30'}`}>
          <div className="max-w-4xl mx-auto">
            <Link href="/news">
              <Button variant="ghost" className={`mb-8 ${post.coverUrl ? 'text-white hover:text-white hover:bg-white/10' : ''}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to News
              </Button>
            </Link>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Badge variant="secondary" className="mb-4">
                {post.category}
              </Badge>

              <h1 className={`text-3xl md:text-5xl font-bold mb-6 ${post.coverUrl ? 'text-white' : ''}`}>
                {post.title}
              </h1>

              <div className={`flex flex-wrap items-center gap-6 ${post.coverUrl ? 'text-white/80' : 'text-muted-foreground'}`}>
                {post.authorName && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{post.authorName}</span>
                  </div>
                )}
                {(post.publishedAt || post.createdAt) && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{format(new Date(post.publishedAt || post.createdAt), "MMMM d, yyyy")}</span>
                  </div>
                )}
                {readTime > 0 && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{readTime} min read</span>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <article className="md:col-span-3">
            {post.excerpt && (
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                {post.excerpt}
              </p>
            )}

            {post.content && (
              <div className="prose prose-lg prose-invert max-w-none">
                {post.content.split('\n').map((paragraph, index) => (
                  paragraph.trim() && (
                    <p key={index} className="mb-4 text-foreground leading-relaxed">
                      {paragraph}
                    </p>
                  )
                ))}
              </div>
            )}

            {post.tags && post.tags.length > 0 && (
              <div className="mt-12 pt-8 border-t">
                <div className="flex items-center gap-2 mb-4">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Tags</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag, i) => (
                    <Badge key={i} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </article>

          <aside className="space-y-6">
            {relatedPosts && relatedPosts.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-4">Related Articles</h3>
                  <div className="space-y-4">
                    {relatedPosts.map((relatedPost) => (
                      <Link key={relatedPost.id} href={`/news/${relatedPost.slug || relatedPost.id}`}>
                        <div className="group">
                          {relatedPost.coverUrl && (
                            <div className="aspect-video rounded overflow-hidden mb-2">
                              <img
                                src={relatedPost.coverUrl}
                                alt={relatedPost.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            </div>
                          )}
                          <h4 className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-2">
                            {relatedPost.title}
                          </h4>
                          {relatedPost.publishedAt && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(relatedPost.publishedAt), "MMM d, yyyy")}
                            </p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
