import { useRoute, Link } from "wouter";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowLeft, Calendar, MapPin, ExternalLink } from "lucide-react";
import { SiSpotify, SiInstagram, SiSoundcloud, SiYoutube, SiX } from "react-icons/si";
import { useQuery } from "@tanstack/react-query";
import { useRef } from "react";
import { db, type Artist, type Release, type Event } from "@/lib/database";
import { SEOHead, generateStructuredData } from "@/components/seo-head";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

const demoArtist: Artist = {
  id: "1",
  name: "Luna Wave",
  slug: "luna-wave",
  bio: "Electronic producer known for atmospheric soundscapes and driving beats that transport listeners to otherworldly dimensions. With a career spanning over a decade, Luna Wave has become a cornerstone of the electronic music scene, performing at major festivals and releasing critically acclaimed albums.",
  imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=1000&fit=crop",
  featured: true,
  socialLinks: { instagram: "#", spotify: "#", soundcloud: "#", youtube: "#", twitter: "#" },
  createdAt: new Date().toISOString(),
};

const demoReleases: Partial<Release>[] = [
  {
    id: "1",
    title: "Midnight Dreams EP",
    artistName: "Luna Wave",
    coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop",
    releaseDate: "2024-06-15",
    type: "EP",
    spotifyUrl: "#",
  },
  {
    id: "2",
    title: "Echoes of Tomorrow",
    artistName: "Luna Wave",
    coverUrl: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&h=300&fit=crop",
    releaseDate: "2024-03-20",
    type: "Album",
    spotifyUrl: "#",
  },
];

const demoEvents: Partial<Event>[] = [
  {
    id: "1",
    title: "Summer Festival 2025",
    venue: "Main Stage",
    city: "London",
    country: "UK",
    date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    imageUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=300&fit=crop",
  },
];

export default function ArtistDetailPage() {
  const [match, params] = useRoute("/artists/:slug");
  const slug = params?.slug;

  const heroRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroImageY = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const heroImageScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);

  const { data: artist, isLoading: artistLoading } = useQuery<Artist | null>({
    queryKey: ["artist", slug],
    queryFn: async () => {
      if (!slug) return null;
      const bySlug = await db.artists.getBySlug(slug);
      if (bySlug) return bySlug;
      return db.artists.getById(slug);
    },
    enabled: !!slug,
  });

  const { data: allReleases } = useQuery<Release[]>({
    queryKey: ["releases-all"],
    queryFn: () => db.releases.getAll(),
  });

  const { data: allEvents } = useQuery<Event[]>({
    queryKey: ["events-all"],
    queryFn: () => db.events.getAll(),
  });

  const displayArtist = artist || demoArtist;
  
  const artistReleases = allReleases?.filter(
    (r) => r.published && (r.artistName?.toLowerCase() === displayArtist.name?.toLowerCase() || r.artistId === displayArtist.id)
  ) || (artist ? [] : demoReleases);

  const artistEvents = allEvents?.filter(
    (e) => e.published && e.artistIds?.includes(displayArtist.id) && new Date(e.date) >= new Date()
  ) || (artist ? [] : demoEvents);

  const artistSchema = generateStructuredData("MusicGroup", {
    name: displayArtist.name,
    description: displayArtist.bio,
    image: displayArtist.imageUrl,
    sameAs: [
      displayArtist.socialLinks?.spotify,
      displayArtist.socialLinks?.instagram,
      displayArtist.socialLinks?.soundcloud,
      displayArtist.socialLinks?.youtube,
      displayArtist.socialLinks?.twitter,
    ].filter(Boolean),
  });

  if (artistLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SEOHead
        title={`${displayArtist.name} - GroupTherapy Records`}
        description={displayArtist.bio || `Discover ${displayArtist.name} on GroupTherapy Records`}
        keywords={[displayArtist.name, "electronic music", "DJ", "producer"]}
        structuredData={artistSchema}
      />

      <div ref={heroRef} className="relative">
        <div className="absolute inset-0 h-[60vh] overflow-hidden">
          {displayArtist.imageUrl ? (
            <motion.img
              src={displayArtist.imageUrl}
              alt={displayArtist.name}
              className="w-full h-full object-cover"
              style={{ y: heroImageY, scale: heroImageScale }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/30 to-muted" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background" />
        </div>

        <div className="relative pt-24 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <Link href="/artists">
              <Button variant="ghost" className="mb-8 text-white hover:text-white hover:bg-white/10">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Artists
              </Button>
            </Link>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col md:flex-row gap-8 items-start"
            >
              <div className="w-48 h-48 md:w-64 md:h-64 rounded-lg overflow-hidden shadow-2xl flex-shrink-0">
                {displayArtist.imageUrl ? (
                  <img
                    src={displayArtist.imageUrl}
                    alt={displayArtist.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/30 to-muted" />
                )}
              </div>

              <div className="flex-1 text-white">
                <h1 className="text-4xl md:text-6xl font-bold mb-4">{displayArtist.name}</h1>
                {displayArtist.bio && (
                  <p className="text-lg text-white/80 max-w-2xl mb-6 leading-relaxed">
                    {displayArtist.bio}
                  </p>
                )}

                <div className="flex items-center gap-4">
                  {displayArtist.socialLinks?.spotify && (
                    <a
                      href={displayArtist.socialLinks.spotify}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-12 w-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-[#1DB954] text-white transition-colors"
                    >
                      <SiSpotify className="h-6 w-6" />
                    </a>
                  )}
                  {displayArtist.socialLinks?.instagram && (
                    <a
                      href={displayArtist.socialLinks.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-12 w-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-pink-500 text-white transition-colors"
                    >
                      <SiInstagram className="h-6 w-6" />
                    </a>
                  )}
                  {displayArtist.socialLinks?.soundcloud && (
                    <a
                      href={displayArtist.socialLinks.soundcloud}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-12 w-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-orange-500 text-white transition-colors"
                    >
                      <SiSoundcloud className="h-6 w-6" />
                    </a>
                  )}
                  {displayArtist.socialLinks?.youtube && (
                    <a
                      href={displayArtist.socialLinks.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-12 w-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-red-600 text-white transition-colors"
                    >
                      <SiYoutube className="h-6 w-6" />
                    </a>
                  )}
                  {displayArtist.socialLinks?.twitter && (
                    <a
                      href={displayArtist.socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-12 w-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-neutral-800 text-white transition-colors"
                    >
                      <SiX className="h-6 w-6" />
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {artistReleases.length > 0 && (
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-8">Releases</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {artistReleases.map((release, index) => (
                <motion.div
                  key={release.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group"
                >
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-muted mb-3">
                    {release.coverUrl ? (
                      <img
                        src={release.coverUrl}
                        alt={release.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-muted" />
                    )}
                    {release.spotifyUrl && (
                      <a
                        href={release.spotifyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <SiSpotify className="h-12 w-12 text-[#1DB954]" />
                      </a>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-1">
                    {release.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {release.type} {release.releaseDate && `• ${format(new Date(release.releaseDate), "yyyy")}`}
                  </p>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {artistEvents.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-8">Upcoming Events</h2>
            <div className="grid gap-4">
              {artistEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-6 p-4 rounded-lg bg-card hover:bg-card/80 transition-colors"
                >
                  {event.imageUrl && (
                    <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={event.imageUrl}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">{event.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {event.date && format(new Date(event.date), "MMM d, yyyy")}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {event.venue}, {event.city}
                      </span>
                    </div>
                  </div>
                  <Link href={`/events/${event.slug || event.id}`}>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Details
                    </Button>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {artistReleases.length === 0 && artistEvents.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No releases or events found for this artist.</p>
          </div>
        )}
      </div>
    </div>
  );
}
