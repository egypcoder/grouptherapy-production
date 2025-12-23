import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Calendar, Ticket, Clock, Filter, Grid, List as ListIcon, Map, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { PageHero } from "@/components/hero-section";
import { SEOHead, generateStructuredData } from "@/components/seo-head";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { db, type Event } from "@/lib/database";
import { EventCountdown } from "@/components/event-countdown";

const demoEvents: Partial<Event>[] = [
  {
    id: "1",
    title: "GroupTherapy Sessions Vol. 1",
    venue: "Warehouse 23",
    city: "London",
    country: "UK",
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    imageUrl: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=600&h=400&fit=crop",
    ticketUrl: "#",
    ticketPrice: "25",
    featured: true,
    description: "An immersive night of electronic music featuring our top artists.",
  },
  {
    id: "2",
    title: "Summer Festival 2024",
    venue: "Victoria Park",
    city: "Manchester",
    country: "UK",
    date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    imageUrl: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&h=400&fit=crop",
    ticketUrl: "#",
    ticketPrice: "45",
    description: "A full day of outdoor music with multiple stages.",
  },
  {
    id: "3",
    title: "Club Night: Neon Pulse",
    venue: "The Underground",
    city: "Berlin",
    country: "Germany",
    date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    imageUrl: "https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?w=600&h=400&fit=crop",
    ticketUrl: "#",
    ticketPrice: "20",
    featured: true,
    description: "Techno night with Neon Pulse headlining.",
  },
  {
    id: "4",
    title: "Rooftop Sessions",
    venue: "Sky Lounge",
    city: "Amsterdam",
    country: "Netherlands",
    date: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
    imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&h=400&fit=crop",
    ticketUrl: "#",
    ticketPrice: "30",
    description: "Sunset vibes with deep house and panoramic views.",
  },
  {
    id: "5",
    title: "Past Event: New Year's Eve",
    venue: "The Grand",
    city: "Paris",
    country: "France",
    date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    imageUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&h=400&fit=crop",
    description: "Ring in the new year with GroupTherapy.",
  },
];

export default function EventsPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list" | "map">("grid");
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("upcoming");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: events } = useQuery<Event[]>({
    queryKey: ["events"],
    queryFn: () => db.events.getAll(),
  });

  const displayEvents = events?.length ? events : demoEvents;

  const filteredEvents = displayEvents.filter((event) => {
    const matchesSearch =
      event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.city?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const isPast = event.date ? new Date(event.date) < new Date() : false;
    
    if (filter === "upcoming") return matchesSearch && !isPast;
    if (filter === "past") return matchesSearch && isPast;
    return matchesSearch;
  });

  const sortedEvents = [...filteredEvents].sort((a, b) => {
    const dateA = new Date(a.date || 0).getTime();
    const dateB = new Date(b.date || 0).getTime();
    return filter === "past" ? dateB - dateA : dateA - dateB;
  });

  const formatDate = (date: Date | string | null) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (date: Date | string | null) => {
    if (!date) return "";
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen">
      <PageHero
        title="Events"
        subtitle="Experience GroupTherapy live"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)} className="flex-1">
            <TabsList>
              <TabsTrigger value="upcoming" data-testid="tab-upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="past" data-testid="tab-past">Past</TabsTrigger>
              <TabsTrigger value="all" data-testid="tab-all">All</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex gap-2">
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48"
              data-testid="input-search-events"
            />
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("grid")}
                data-testid="button-events-grid"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("list")}
                data-testid="button-events-list"
              >
                <ListIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Results */}
        <p className="text-sm text-muted-foreground mb-6">
          {sortedEvents.length} {filter === "past" ? "past" : filter === "upcoming" ? "upcoming" : ""} events
        </p>

        {/* Events Display */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <EventCard event={event as Event} formatDate={formatDate} formatTime={formatTime} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {sortedEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <EventListCard event={event as Event} formatDate={formatDate} formatTime={formatTime} />
              </motion.div>
            ))}
          </div>
        )}

        {sortedEvents.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No events found</p>
          </div>
        )}
      </div>
    </div>
  );
}

function EventCard({
  event,
  formatDate,
  formatTime,
}: {
  event: Event;
  formatDate: (date: Date | string | null) => string;
  formatTime: (date: Date | string | null) => string;
}) {
  const isPast = event.date ? new Date(event.date) < new Date() : false;
  const dateObj = event.date ? new Date(event.date) : null;
  const month = dateObj ? dateObj.toLocaleDateString("en-US", { month: "short" }) : "";
  const day = dateObj ? dateObj.getDate().toString() : "";

  return (
    <Link href={`/events/${event.slug || event.id}`}>
      <div 
        className={cn(
          "group cursor-pointer rounded-2xl overflow-hidden bg-card border border-border/50 hover:border-border hover:shadow-lg transition-all",
          isPast && "opacity-70"
        )} 
        data-testid={`card-event-${event.id}`}
      >
        <div className="relative aspect-[16/10] overflow-hidden">
          {event.imageUrl ? (
            <img
              src={event.imageUrl}
              alt={event.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-muted" />
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          <div className="absolute top-4 left-4 bg-card border border-border rounded-xl px-3 py-2 text-center min-w-[52px]">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              {month}
            </div>
            <div className="text-xl font-bold text-card-foreground leading-none">
              {day}
            </div>
          </div>

          {event.featured && !isPast && (
            <Badge className="absolute top-4 right-4 rounded-full" variant="default">
              Featured
            </Badge>
          )}
          {isPast && (
            <Badge variant="secondary" className="absolute top-4 right-4 rounded-full">Past</Badge>
          )}
        </div>

        <div className="p-5">
          <h3 className="font-semibold text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors" data-testid={`text-event-title-${event.id}`}>
            {event.title}
          </h3>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              <span className="truncate" data-testid={`text-event-location-${event.id}`}>
                {event.city}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span data-testid={`text-event-date-${event.id}`}>
                {event.venue}
              </span>
            </div>
          </div>

          {event.date && (
            <div className="mt-3">
              <EventCountdown targetDate={event.date} variant="compact" />
            </div>
          )}

          {event.ticketPrice && !isPast && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
              <span className="font-semibold text-primary" data-testid={`text-event-price-${event.id}`}>
                From ${event.ticketPrice}
              </span>
              {event.ticketUrl ? (
                <span 
                  className="text-sm text-muted-foreground group-hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.open(event.ticketUrl, '_blank');
                  }}
                >
                  Get Tickets
                  <ArrowRight className="h-4 w-4" />
                </span>
              ) : (
                <span className="text-sm text-muted-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                  Get Tickets
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

function EventListCard({
  event,
  formatDate,
  formatTime,
}: {
  event: Event;
  formatDate: (date: Date | string | null) => string;
  formatTime: (date: Date | string | null) => string;
}) {
  const isPast = event.date ? new Date(event.date) < new Date() : false;
  const dateObj = event.date ? new Date(event.date) : null;

  return (
    <Link href={`/events/${event.slug || event.id}`}>
      <div 
        className={cn(
          "overflow-hidden cursor-pointer rounded-2xl bg-card border border-border/50 hover:border-border hover:shadow-lg transition-all group",
          isPast && "opacity-70"
        )} 
        data-testid={`card-event-list-${event.id}`}
      >
        <div className="flex flex-col sm:flex-row">
          <div className="relative w-full sm:w-48 aspect-video sm:aspect-square flex-shrink-0 overflow-hidden">
            {event.imageUrl ? (
              <img
                src={event.imageUrl}
                alt={event.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-muted" />
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            <div className="absolute top-2 left-2 bg-card border border-border rounded-lg px-2 py-1 text-center">
              <div className="text-xs font-bold text-card-foreground">
                {dateObj ? dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}
              </div>
            </div>
          </div>

          <div className="flex-1 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-4 mb-2">
                <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{event.title}</h3>
                {event.featured && !isPast && <Badge className="rounded-full">Featured</Badge>}
                {isPast && <Badge variant="secondary" className="rounded-full">Past</Badge>}
              </div>
              
              {event.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {event.description}
                </p>
              )}

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  <span className="truncate">{event.city}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(event.date)}</span>
                </div>
                {event.date && formatTime(event.date) && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    <span>{formatTime(event.date)}</span>
                  </div>
                )}
                {event.date && (
                  <EventCountdown targetDate={event.date} variant="compact" />
                )}
              </div>
            </div>

            {!isPast && event.ticketPrice && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                <span className="font-semibold text-primary">From ${event.ticketPrice}</span>
                {event.ticketUrl ? (
                  <span 
                    className="text-sm text-muted-foreground group-hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      window.open(event.ticketUrl, '_blank');
                    }}
                  >
                    Get Tickets
                    <ArrowRight className="h-4 w-4" />
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                    Get Tickets
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
