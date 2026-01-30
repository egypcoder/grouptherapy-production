import { useRef } from "react";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { useCarouselAutoplay } from "@/hooks/use-carousel-autoplay";
import type { Video } from "@/lib/database";
import { resolveMediaUrl } from "@/lib/media";

interface VideosCarouselProps {
  videos: Video[];
  title?: string;
  autoPlay?: boolean;
  autoPlayIntervalMs?: number;
}

export function VideosCarousel({
  videos = [],
  title = "",
  autoPlay = true,
  autoPlayIntervalMs = 6000,
}: VideosCarouselProps) {
  if (videos.length === 0) return null;

  const scrollRef = useRef<HTMLDivElement>(null);

  useCarouselAutoplay({
    scrollRef,
    enabled: !!autoPlay,
    intervalMs: autoPlayIntervalMs,
    scrollByPx: 340,
  });

  return (
    <section>
      {title ? (
        <div className="max-w-7xl mx-auto px-6 md:px-8 mb-8">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">{title}</h2>
        </div>
      ) : null}

      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto scrollbar-hide pb-4 px-6 md:px-8 snap-x snap-mandatory overflow-y-hidden"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {videos.map((video, index) => (
          <motion.div
            key={video.id || index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05, duration: 0.4 }}
            className="flex-shrink-0 w-[280px] md:w-[340px] snap-start"
          >
            <VideoCard video={video} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function VideoCard({ video }: { video: Video }) {
  const href = "/videos";

  const categoryLabel = video.category ? video.category.replace(/-/g, " ") : "Video";

  return (
    <Link href={href}>
      <div className="group block cursor-pointer" data-testid={`card-video-${video.id}`}>
        <div className="relative aspect-video rounded-2xl overflow-hidden bg-muted mb-4">
          {video.thumbnailUrl ? (
            <img
              src={resolveMediaUrl(video.thumbnailUrl, "card")}
              alt={video.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/20 flex items-center justify-center">
              <Play className="h-12 w-12 text-muted-foreground/50" />
            </div>
          )}

          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="h-14 w-14 rounded-full bg-white text-black flex items-center justify-center">
              <Play className="h-6 w-6 ml-0.5" fill="black" />
            </div>
          </div>

          {video.duration ? (
            <span className="absolute bottom-3 right-3 px-2 py-1 text-xs font-medium bg-black/80 text-white rounded">
              {video.duration}
            </span>
          ) : null}

          <Badge className="absolute top-3 left-3 rounded-full" variant="secondary">
            {categoryLabel}
          </Badge>
        </div>

        <h3 className="font-medium text-base line-clamp-2 group-hover:text-primary transition-colors">
          {video.title}
        </h3>
        {video.artistName ? (
          <p className="text-sm text-muted-foreground truncate">{video.artistName}</p>
        ) : null}
      </div>
    </Link>
  );
}
