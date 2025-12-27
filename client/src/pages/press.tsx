import { useQuery } from "@tanstack/react-query";
import { PageHero } from "@/components/hero-section";
import { Loader2 } from "lucide-react";
import { db, type StaticPage } from "@/lib/database";

export default function PressPage() {
  const {
    data: page,
    isLoading,
    error,
  } = useQuery<StaticPage | null>({
    queryKey: ["staticPage", "press"],
    queryFn: () => db.staticPages.getBySlug("press"),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
          <p className="text-muted-foreground">
            The page you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <PageHero
        title={page.title || "Press"}
        subtitle={page.metaDescription || ""}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div
          className="prose prose-lg dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: page.content || "" }}
        />
      </div>
    </div>
  );
}
