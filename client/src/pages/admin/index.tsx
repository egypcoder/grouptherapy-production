import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Music,
  Users,
  Calendar,
  FileText,
  Radio,
  ListMusic,
  Video,
  Mail,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  TrendingUp,
  Eye,
  Play,
  Heart,
  BarChart3,
  Globe,
  Clock,
  MousePointerClick,
  UserCheck,
  Send,
  Ticket,
  MessageSquareQuote,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { MetricsChart } from "@/components/metrics-chart";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { queryFunctions } from "@/lib/queryClient";
import type { Release, Event, Post, RadioShow, Artist, Contact, AnalyticsSummary, NewsletterSubscriber, Playlist, Video as VideoType, Career, Tour } from "@/lib/database";
import { useAuth } from "@/lib/auth-context";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const sidebarLinks = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/releases", icon: Music, label: "Releases" },
  { href: "/admin/artists", icon: Users, label: "Artists" },
  { href: "/admin/events", icon: Calendar, label: "Events" },
  { href: "/admin/tours", icon: TrendingUp, label: "Tours" },
  { href: "/admin/posts", icon: FileText, label: "Blog / News" },
  { href: "/admin/radio", icon: Radio, label: "Radio Shows" },
  { href: "/admin/playlists", icon: ListMusic, label: "Playlists" },
  { href: "/admin/videos", icon: Video, label: "Videos" },
  { href: "/admin/testimonials", icon: MessageSquareQuote, label: "Testimonials" },
  { href: "/admin/awards", icon: Trophy, label: "Awards" },
  { href: "/admin/careers", icon: Heart, label: "Careers" },
  { href: "/admin/press-kit", icon: Play, label: "Press Kit" },
  { href: "/admin/static-pages", icon: FileText, label: "Static Pages" },
  { href: "/admin/contacts", icon: Mail, label: "Messages" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
  { href: "/admin/seo-settings", icon: Globe, label: "SEO Settings" },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout, username } = useAuth();

  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ["contacts"],
    queryFn: queryFunctions.contacts,
    refetchInterval: 30000,
  });

  const newMessageCount = contacts.filter((c) => c.status === "new").length;

  async function handleLogout() {
    await logout();
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-background/80 backdrop-blur-xl border-b border-border/50 flex items-center justify-between px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="rounded-full"
          data-testid="button-admin-menu"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        <span className="font-semibold text-sm">
          GROUP<span className="text-primary">THERAPY</span>
        </span>
        <ThemeToggle />
      </header>

      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-full w-60 bg-sidebar/50 backdrop-blur-xl border-r border-sidebar-border/50 transform transition-transform duration-300",
          "lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="h-14 flex items-center px-5 border-b border-sidebar-border/50">
            <Link href="/" className="font-semibold">
              GROUP<span className="text-primary">THERAPY</span>
            </Link>
          </div>

          <nav className="flex-1 overflow-y-auto py-3 px-3">
            <div className="space-y-0.5">
              {sidebarLinks.map((link) => {
                const isActive = location === link.href || 
                  (link.href !== "/admin" && location.startsWith(link.href));
                const showBadge = link.label === "Messages" && newMessageCount > 0;
                return (
                  <Link key={link.href} href={link.href}>
                    <button
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                        isActive 
                          ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                          : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                      )}
                      onClick={() => setSidebarOpen(false)}
                      data-testid={`link-admin-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <link.icon className={cn("h-4 w-4", isActive && "text-primary")} />
                      {link.label}
                      {showBadge && (
                        <span className="ml-auto h-5 min-w-[20px] flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-medium px-1.5">
                          {newMessageCount > 9 ? "9+" : newMessageCount}
                        </span>
                      )}
                    </button>
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="p-3 border-t border-sidebar-border/50 space-y-0.5">
            <Link href="/">
              <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors" data-testid="link-admin-view-site">
                <Eye className="h-4 w-4" />
                View Site
              </button>
            </Link>
            <button 
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
              data-testid="button-admin-logout"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="lg:pl-60 pt-14 lg:pt-0 min-h-screen">
        <div className="hidden lg:flex h-14 items-center justify-between px-6 border-b border-border/50 bg-background/50 backdrop-blur-sm">
          <div className="text-sm text-muted-foreground">
            Welcome back, <span className="font-medium text-foreground">{username || "Admin"}</span>
          </div>
          <ThemeToggle />
        </div>
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}

export default function AdminDashboard() {
  const { data: releases = [] } = useQuery<Release[]>({
    queryKey: ["releases"],
    queryFn: queryFunctions.releases,
  });

  const { data: artists = [] } = useQuery<Artist[]>({
    queryKey: ["artists"],
    queryFn: queryFunctions.artists,
  });

  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ["events"],
    queryFn: queryFunctions.events,
  });

  const { data: posts = [] } = useQuery<Post[]>({
    queryKey: ["posts"],
    queryFn: queryFunctions.posts,
  });

  const { data: radioShows = [] } = useQuery<RadioShow[]>({
    queryKey: ["radioShows"],
    queryFn: queryFunctions.radioShows,
  });

  const { data: playlists = [] } = useQuery<Playlist[]>({
    queryKey: ["playlists"],
    queryFn: queryFunctions.playlists,
  });

  const { data: videos = [] } = useQuery<VideoType[]>({
    queryKey: ["videos"],
    queryFn: queryFunctions.videos,
  });

  const { data: careers = [] } = useQuery<Career[]>({
    queryKey: ["careers"],
    queryFn: queryFunctions.careers,
  });

  const { data: tours = [] } = useQuery<Tour[]>({
    queryKey: ["tours"],
    queryFn: queryFunctions.tours,
  });

  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ["contacts"],
    queryFn: queryFunctions.contacts,
  });

  const { data: newsletterSubs = [] } = useQuery<NewsletterSubscriber[]>({
    queryKey: ["newsletterSubscribers"],
    queryFn: queryFunctions.newsletterSubscribers,
  });

  const { data: analytics } = useQuery<AnalyticsSummary>({
    queryKey: ["analyticsSummary"],
    queryFn: queryFunctions.analyticsSummary,
    refetchInterval: 60000,
  });

  const publishedReleases = releases.filter(r => r.published);
  const upcomingEvents = events.filter(e => new Date(e.date) > new Date());
  const activeSubscribers = newsletterSubs.filter(s => s.active);

  const primaryStats = [
    { 
      label: "Total Page Views", 
      value: analytics?.totalPageViews?.toLocaleString() || "0", 
      change: `${analytics?.todayPageViews || 0} today`, 
      icon: Eye,
      color: "text-blue-500"
    },
    { 
      label: "This Month", 
      value: analytics?.monthPageViews?.toLocaleString() || "0", 
      change: `${analytics?.weekPageViews || 0} this week`, 
      icon: BarChart3,
      color: "text-green-500"
    },
    { 
      label: "Newsletter Subscribers", 
      value: activeSubscribers.length.toString(), 
      change: `${newsletterSubs.length} total`, 
      icon: Mail,
      color: "text-purple-500"
    },
    { 
      label: "Contact Submissions", 
      value: analytics?.contactSubmissions?.toString() || contacts.length.toString(), 
      change: `${analytics?.newContactSubmissions || contacts.filter(c => c.status === 'new').length} new`, 
      icon: Send,
      color: "text-orange-500"
    },
  ];

  const secondaryStats = [
    { 
      label: "Total Releases", 
      value: releases.length.toString(), 
      change: `${publishedReleases.length} published`, 
      icon: Music,
      color: "text-pink-500"
    },
    { 
      label: "Active Artists", 
      value: artists.length.toString(), 
      change: "All time", 
      icon: Users,
      color: "text-cyan-500"
    },
    { 
      label: "Event RSVPs", 
      value: analytics?.totalRsvps?.toString() || events.reduce((acc, e) => acc + (e.rsvpCount || 0), 0).toString(), 
      change: `${upcomingEvents.length} upcoming`, 
      icon: Ticket,
      color: "text-amber-500"
    },
    { 
      label: "Radio Listens", 
      value: analytics?.totalRadioListens?.toString() || "0", 
      change: formatDuration(analytics?.totalRadioDuration || 0) + " total", 
      icon: Radio,
      color: "text-red-500"
    },
  ];

  const contentCounts = [
    { label: "Releases", count: releases.length, icon: Music, href: "/admin/releases" },
    { label: "Artists", count: artists.length, icon: Users, href: "/admin/artists" },
    { label: "Events", count: events.length, icon: Calendar, href: "/admin/events" },
    { label: "Posts", count: posts.length, icon: FileText, href: "/admin/posts" },
    { label: "Radio Shows", count: radioShows.length, icon: Radio, href: "/admin/radio" },
    { label: "Playlists", count: playlists.length, icon: ListMusic, href: "/admin/playlists" },
    { label: "Videos", count: videos.length, icon: Video, href: "/admin/videos" },
    { label: "Careers", count: careers.length, icon: Heart, href: "/admin/careers" },
    { label: "Tours", count: tours.length, icon: TrendingUp, href: "/admin/tours" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight" data-testid="text-admin-title">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Overview of your record label performance
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {primaryStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="border-border/50">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                      <p className="text-2xl font-semibold tracking-tight">{stat.value}</p>
                      <p className="text-xs text-primary font-medium">{stat.change}</p>
                    </div>
                    <div className={cn("h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center", stat.color)}>
                      <stat.icon className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {secondaryStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.05 }}
            >
              <Card className="border-border/50">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                      <p className="text-2xl font-semibold tracking-tight">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.change}</p>
                    </div>
                    <div className={cn("h-10 w-10 rounded-xl bg-muted flex items-center justify-center", stat.color)}>
                      <stat.icon className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-5">
          <Card className="border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
              <CardDescription className="text-xs">Common tasks at your fingertips</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <Link href="/admin/releases/new">
                <Button variant="outline" size="sm" className="w-full justify-start gap-2 h-9 text-sm rounded-lg border-border/50" data-testid="button-quick-new-release">
                  <Music className="h-4 w-4 text-primary" />
                  New Release
                </Button>
              </Link>
              <Link href="/admin/events/new">
                <Button variant="outline" size="sm" className="w-full justify-start gap-2 h-9 text-sm rounded-lg border-border/50" data-testid="button-quick-new-event">
                  <Calendar className="h-4 w-4 text-primary" />
                  New Event
                </Button>
              </Link>
              <Link href="/admin/posts/new">
                <Button variant="outline" size="sm" className="w-full justify-start gap-2 h-9 text-sm rounded-lg border-border/50" data-testid="button-quick-new-post">
                  <FileText className="h-4 w-4 text-primary" />
                  New Post
                </Button>
              </Link>
              <Link href="/admin/radio">
                <Button variant="outline" size="sm" className="w-full justify-start gap-2 h-9 text-sm rounded-lg border-border/50" data-testid="button-quick-new-show">
                  <Radio className="h-4 w-4 text-primary" />
                  New Show
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
              <CardDescription className="text-xs">Latest updates from your content</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {publishedReleases.slice(0, 2).map((release) => (
                  <div
                    key={release.id}
                    className="flex items-start justify-between gap-4 pb-3 border-b border-border/50 last:border-0 last:pb-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Release published</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {release.title} - {release.artistName}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {release.releaseDate ? new Date(release.releaseDate).toLocaleDateString() : "-"}
                    </span>
                  </div>
                ))}
                {upcomingEvents.slice(0, 1).map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start justify-between gap-4 pb-3 border-b border-border/50 last:border-0 last:pb-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Event scheduled</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {event.title}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(event.date).toLocaleDateString()}
                    </span>
                  </div>
                ))}
                {posts.slice(0, 1).map((post) => (
                  <div
                    key={post.id}
                    className="flex items-start justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Blog post {post.published ? 'published' : 'drafted'}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {post.title}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(post.publishedAt || post.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
                {releases.length === 0 && events.length === 0 && posts.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No recent activity
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {analytics?.pageViewsByDay && analytics.pageViewsByDay.length > 0 ? (
            <MetricsChart
              title="Page Views Trend"
              description="Daily page views over the last 30 days"
              data={analytics.pageViewsByDay.slice(-14).map((day) => ({
                label: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                value: day.views,
              }))}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Page Views Trend</CardTitle>
                <CardDescription>Daily page views over time</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center py-8">
                  No page view data yet. Analytics will appear as visitors browse your site.
                </p>
              </CardContent>
            </Card>
          )}

          {analytics?.topPages && analytics.topPages.length > 0 ? (
            <MetricsChart
              title="Top Pages"
              description="Most visited pages this month"
              data={analytics.topPages.slice(0, 8).map((page) => ({
                label: page.path === '/' ? 'Home' : page.path,
                value: page.views,
              }))}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Top Pages</CardTitle>
                <CardDescription>Most visited pages</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center py-8">
                  No page data yet. Analytics will appear as visitors browse your site.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {analytics?.topReleases && analytics.topReleases.length > 0 ? (
            <MetricsChart
              title="Top Releases"
              description="Most clicked releases this month"
              data={analytics.topReleases.map((release) => ({
                label: release.name,
                value: release.clicks,
              }))}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Top Releases</CardTitle>
                <CardDescription>Most clicked releases</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center py-8">
                  No release click data yet. Analytics will appear when users click on release links.
                </p>
              </CardContent>
            </Card>
          )}

          {analytics?.topReferrers && analytics.topReferrers.length > 0 ? (
            <MetricsChart
              title="Top Referrers"
              description="Where your visitors come from"
              data={analytics.topReferrers.map((ref) => ({
                label: ref.referrer,
                value: ref.count,
              }))}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Top Referrers</CardTitle>
                <CardDescription>Where your visitors come from</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center py-8">
                  No referrer data yet. This will show traffic sources once visitors arrive from other sites.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {analytics?.radioShowStats && analytics.radioShowStats.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Radio className="h-5 w-5" />
                Radio Show Analytics
              </CardTitle>
              <CardDescription>Listener statistics for your radio shows</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Show Name</TableHead>
                    <TableHead className="text-right">Total Listens</TableHead>
                    <TableHead className="text-right">Avg Duration</TableHead>
                    <TableHead className="text-right">Total Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.radioShowStats.map((show) => (
                    <TableRow key={show.showId}>
                      <TableCell className="font-medium">{show.showName}</TableCell>
                      <TableCell className="text-right">{show.listens}</TableCell>
                      <TableCell className="text-right">{formatDuration(show.avgDuration)}</TableCell>
                      <TableCell className="text-right">{formatDuration(show.totalDuration)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Content Overview</CardTitle>
            <CardDescription>Total content across all sections</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-9 gap-4">
              {contentCounts.map((item) => (
                <Link key={item.label} href={item.href}>
                  <div className="flex flex-col items-center p-4 rounded-md border hover:bg-muted/50 transition-colors cursor-pointer group text-center">
                    <item.icon className="h-6 w-6 text-muted-foreground mb-2" />
                    <p className="text-2xl font-bold">{item.count}</p>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
