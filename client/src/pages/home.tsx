import { motion, useInView, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { HeroSection } from "@/components/hero-section";
import { ReleasesCarousel } from "@/components/releases-carousel";
import { EventsCarousel } from "@/components/events-carousel";
import { PlaylistsSection } from "@/components/playlists-section";
import { PostsCarousel } from "@/components/posts-carousel";
import { AwardEntryCard } from "@/components/award-entry-card";
import { FeaturedArtists } from "@/components/featured-artists";
import { NewsletterSection } from "@/components/newsletter-section";
import { TestimonialsSection } from "@/components/testimonials-section";
import { SEOHead, generateStructuredData } from "@/components/seo-head";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import {
  db,
  type Release,
  type Event,
  type Playlist,
  type Artist,
  type Post,
  type SiteSettings,
  type MarqueeItem,
  type StatItem,
  type AwardPeriod,
  type AwardEntry,
} from "@/lib/database";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import {
  Users,
  Disc3,
  Radio,
  Headphones,
  Music2,
  Mic,
  Heart,
  Star,
  Globe,
  Calendar,
  Trophy,
  Play,
  Vote,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Disc3,
  Radio,
  Music2,
  Users,
  Play,
  Headphones,
  Mic,
  Heart,
  Star,
  Globe,
  Calendar,
  Trophy,
};

function AnimatedCounter({
  value,
  suffix = "",
  prefix = "",
  duration = 2,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { duration: duration * 1000 });
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (isInView) {
      motionValue.set(value);
    }
  }, [isInView, value, motionValue]);

  useEffect(() => {
    const unsubscribe = springValue.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = `${prefix}${Math.floor(latest)}${suffix}`;
      }
    });
    return unsubscribe;
  }, [springValue, prefix, suffix]);

  return (
    <span ref={ref} className="stat-number">
      {prefix}0{suffix}
    </span>
  );
}

function StatsSection({ statsItems }: { statsItems: StatItem[] }) {
  return (
    <section className="py-24 md:py-32 relative">
      <div className="max-w-6xl mx-auto px-6 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight mb-4">
            Growing the future of <span className="gradient-text">music</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Our numbers tell the story of a community united by sound.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {statsItems.map((stat, index) => {
            const Icon = iconMap[stat.icon] || Users;
            return (
              <motion.div
                key={stat.label || index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="text-center group"
              >
                <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-4xl md:text-5xl font-semibold mb-2">
                  <AnimatedCounter
                    value={stat.value}
                    suffix={stat.suffix}
                    prefix={stat.prefix || ""}
                  />
                </div>
                <div className="text-sm text-muted-foreground uppercase tracking-wider">
                  {stat.label}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function SectionHeader({
  title,
  highlight,
  description,
  action,
}: {
  title: string;
  highlight: string;
  description?: string;
  action?: { label: string; href: string };
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12"
    >
      <div>
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-2">
          {title} <span className="gradient-text">{highlight}</span>
        </h2>
        {description && (
          <p className="text-muted-foreground max-w-lg">{description}</p>
        )}
      </div>
      {action && (
        <Link href={action.href}>
          <motion.span
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors cursor-pointer"
            whileHover={{ x: 4 }}
          >
            {action.label}
            <ArrowRight className="w-4 h-4" />
          </motion.span>
        </Link>
      )}
    </motion.div>
  );
}

function AwardsSection({
  entries,
  hasActiveVoting,
  periodId,
}: {
  entries: AwardEntry[];
  hasActiveVoting: boolean;
  periodId?: string;
}) {
  const { toast } = useToast();
  const [votedEntries, setVotedEntries] = useState<Set<string>>(new Set());
  const [fingerprint, setFingerprint] = useState<string>("");

  useEffect(() => {
    // Generate fingerprint for duplicate vote prevention
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.textBaseline = "top";
      ctx.font = "14px Arial";
      ctx.fillText("fingerprint", 2, 2);
    }
    const nav = navigator;
    const data = [
      nav.userAgent,
      nav.language,
      screen.width,
      screen.height,
      screen.colorDepth,
      new Date().getTimezoneOffset(),
      nav.platform,
    ].join("|");
    setFingerprint(btoa(data));
    
    const stored = localStorage.getItem("voted_entries_home");
    if (stored) {
      try {
        setVotedEntries(new Set(JSON.parse(stored)));
      } catch {}
    }
  }, []);

  const voteMutation = useMutation({
    mutationFn: async (entryId: string) => {
      if (!periodId) throw new Error("No voting period available");
      return db.awards.votes.submit(entryId, periodId, undefined, fingerprint);
    },
    onSuccess: (_, entryId) => {
      const newVoted = new Set(votedEntries);
      newVoted.add(entryId);
      setVotedEntries(newVoted);
      localStorage.setItem("voted_entries_home", JSON.stringify([...newVoted]));
      queryClient.invalidateQueries({ queryKey: ["featuredAwardEntries"] });
      toast({
        title: "Vote Submitted!",
        description: "Thank you for voting. Your voice matters!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Vote Failed",
        description: error.message || "Unable to submit vote. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleVote = (entryId: string) => {
    if (!periodId) {
      toast({
        title: "No Active Voting",
        description: "There is no active voting period.",
        variant: "destructive",
      });
      return;
    }
    if (votedEntries.has(entryId)) {
      toast({
        title: "Already Voted",
        description: "You have already voted for this entry.",
        variant: "destructive",
      });
      return;
    }
    voteMutation.mutate(entryId);
  };

  // Calculate total votes for percentage
  const totalVotes = entries.reduce((sum, entry) => sum + (entry.voteCount || 0), 0);

  if (!hasActiveVoting || entries.length === 0) return null;

  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10"
        >
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-muted-foreground">
              <Trophy className="w-4 h-4 text-primary" />
              Therapy Awards
            </div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
              Voting is <span className="gradient-text">live</span>
            </h2>
            <p className="text-muted-foreground max-w-xl">
              Vote for your favorites, make them win the battle.
            </p>
          </div>

          <Link href="/awards">
            <Button variant="outline" size="lg" className="rounded-full px-7">
              View Awards
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          {entries.map((entry, index) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <AwardEntryCard
                entry={entry}
                onVote={() => handleVote(entry.id)}
                hasVoted={votedEntries.has(entry.id)}
                isVoting={voteMutation.isPending}
                totalVotes={totalVotes}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

const defaultMarqueeItems: MarqueeItem[] = [
  { text: "New Release: ECHOES EP", icon: "Disc3" },
  { text: "Live Radio 24/7", icon: "Radio" },
  { text: "Summer Tour 2025", icon: "Music2" },
  { text: "50+ Artists Worldwide", icon: "Users" },
];

const defaultStatsItems: StatItem[] = [
  { value: 50, suffix: "+", prefix: "", label: "Artists", icon: "Users" },
  { value: 200, suffix: "+", prefix: "", label: "Releases", icon: "Disc3" },
  { value: 24, suffix: "/7", prefix: "", label: "Radio", icon: "Radio" },
  { value: 1, suffix: "M+", prefix: "", label: "Streams", icon: "Headphones" },
];

export default function HomePage() {
  const { data: releases } = useQuery<Release[]>({
    queryKey: ["releases", "published", { limit: 10 }],
    queryFn: () => db.releases.getPublishedPage(10, 0),
  });

  const { data: events } = useQuery<Event[]>({
    queryKey: ["events", "upcoming"],
    queryFn: () => db.events.getUpcoming(),
  });

  const { data: playlists } = useQuery<Playlist[]>({
    queryKey: ["playlists", "featured", "published", { limit: 24 }],
    queryFn: () => db.playlists.getFeaturedPublishedPage(24, 0),
  });

  const { data: posts } = useQuery<Post[]>({
    queryKey: ["posts", "published", { limit: 12 }],
    queryFn: () => db.posts.getPublishedPage(12, 0),
  });

  const { data: artists } = useQuery<Artist[]>({
    queryKey: ["artists", "featured"],
    queryFn: () => db.artists.getFeatured(),
  });

  const { data: siteSettings } = useQuery<SiteSettings | null>({
    queryKey: ["siteSettings"],
    queryFn: () => db.siteSettings.get(),
  });

  const { data: activeVotingPeriods = [] } = useQuery<AwardPeriod[]>({
    queryKey: ["activeVotingPeriods"],
    queryFn: () => db.awards.periods.getActiveVoting(),
  });

  const { data: featuredEntries = [] } = useQuery<AwardEntry[]>({
    queryKey: ["featuredAwardEntries", activeVotingPeriods],
    queryFn: async () => {
      const firstPeriod = activeVotingPeriods[0];
      if (!firstPeriod) return [];
      const entries = await db.awards.entries.getByPeriodId(firstPeriod.id);
      return entries.slice(0, 3);
    },
    enabled: activeVotingPeriods.length > 0,
  });

  const heroTitle = siteSettings?.heroTitle || "GROUPTHERAPY";
  const heroTag = siteSettings?.heroTag || "Electronic Music Label";
  const heroSubtitle =
    siteSettings?.heroSubtitle ||
    "The future of electronic music, curated for you.";
  const heroBackgroundImage = siteSettings?.heroBackgroundImage || undefined;
  const heroCtaText = siteSettings?.heroCtaText || "Explore Releases";
  const heroCtaLink = siteSettings?.heroCtaLink || "/releases";
  const showHeroRadio = siteSettings?.showHeroRadio ?? true;
  const statsItems = siteSettings?.statsItems?.length
    ? siteSettings.statsItems
    : defaultStatsItems;

  const heroStats = statsItems.slice(0, 3).map((stat) => ({
    value: `${stat.prefix || ""}${stat.value}${stat.suffix || ""}`,
    label: stat.label,
  }));

  const organizationSchema = generateStructuredData("Organization", {
    name: "GroupTherapy Records",
    url: "https://grouptherapy.com",
    logo: "https://grouptherapy.com/logo.png",
    description:
      "Independent electronic music record label pushing the boundaries of sound",
    sameAs: [
      "https://www.instagram.com/grouptherapyrecords",
      "https://twitter.com/grouptherapy",
      "https://www.youtube.com/grouptherapyrecords",
    ],
  });

  return (
    <div className="min-h-screen">
      <SEOHead
        title="GroupTherapy Records | Electronic Music Label"
        description="Discover the future of electronic music with GroupTherapy Records. Stream new releases, find upcoming events, listen to 24/7 radio."
        keywords={[
          "electronic music label",
          "house music",
          "techno",
          "DJ events",
          "music releases",
        ]}
        structuredData={organizationSchema}
      />

      <HeroSection
        heroTag={heroTag}
        title={heroTitle}
        subtitle={heroSubtitle}
        backgroundImage={heroBackgroundImage}
        backgroundVideo={siteSettings?.heroBackgroundVideo}
        backgroundType={siteSettings?.heroBackgroundType}
        ctaText={heroCtaText}
        ctaLink={heroCtaLink}
        showRadio={showHeroRadio}
        heroStats={heroStats}
      />

      <StatsSection statsItems={statsItems} />

      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <SectionHeader
            title="Fresh"
            highlight="Drops"
            description="The latest releases from our roster"
            action={{ label: "View All Releases", href: "/releases" }}
          />
        </div>
        <ReleasesCarousel
          releases={releases || []}
          title=""
          autoPlay={true}
          showViewAll={false}
        />
      </section>

      {/* Only show artists section if there are featured artists */}
      {artists && artists.filter((a) => a.featured).length > 0 && (
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="max-w-7xl mx-auto px-6 md:px-8">
            <SectionHeader
              title="Our"
              highlight="Artists"
              description="The creative minds behind the sound"
              action={{ label: "Meet The Artists", href: "/artists" }}
            />
          </div>
          <FeaturedArtists
            artists={artists?.filter((a) => a.featured) || []}
            title=""
          />
        </section>
      )}

      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <SectionHeader
            title="Upcoming"
            highlight="Events"
            description="Experience the music live"
            action={{ label: "View All Events", href: "/events" }}
          />
          <EventsCarousel events={events || []} title="" showViewAll={false} />
        </div>
      </section>

      <section className="py-16 md:py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <SectionHeader
            title="Curated"
            highlight="Playlists"
            description="Handpicked selections for every mood"
            action={{ label: "View All Playlists", href: "/playlists" }}
          />
        </div>
        <PlaylistsSection playlists={playlists || []} title="" autoPlay={true} />
      </section>

      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <SectionHeader
            title="Latest"
            highlight="News"
            description="Stay updated with the latest from the label"
            action={{ label: "View All News", href: "/news" }}
          />
        </div>
        <PostsCarousel posts={(posts || []).slice(0, 8)} autoPlay={true} />
      </section>

      <TestimonialsSection />

      <AwardsSection
        entries={featuredEntries}
        hasActiveVoting={activeVotingPeriods.length > 0}
        periodId={activeVotingPeriods[0]?.id}
      />

      <NewsletterSection />

      <section className="py-24 md:py-32">
        <div className="max-w-4xl mx-auto px-6 md:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-8">
              <Radio className="w-6 h-6" />
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight mb-6">
              Stay in the <span className="gradient-text">loop</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
              Get the latest news, interviews, and behind-the-scenes content
              from the label.
            </p>
            <Link href="/news">
              <motion.span
                className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-primary text-primary-foreground rounded-full font-medium text-base hover:shadow-lg hover:shadow-primary/25 transition-all cursor-pointer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                data-testid="link-news-cta"
              >
                Read Latest News
                <ArrowRight className="w-4 h-4" />
              </motion.span>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
