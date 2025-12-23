import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import { RadioProvider } from "@/lib/radio-context";
import { AuthProvider } from "@/lib/auth-context";
import { ProtectedRoute } from "@/components/protected-route";
import { Navigation } from "@/components/navigation";
import { GlobalRadioPlayer } from "@/components/radio-player";
import { Footer } from "@/components/footer";
import { db } from "@/lib/database";

import HomePage from "@/pages/home";
import RadioPage from "@/pages/radio";
import ReleasesPage from "@/pages/releases";
import ReleaseDetailPage from "@/pages/release-detail";
import EventsPage from "@/pages/events";
import EventDetailPage from "@/pages/event-detail";
import ArtistsPage from "@/pages/artists";
import ArtistDetailPage from "@/pages/artist-detail";
import VideosPage from "@/pages/videos";
import AboutPage from "@/pages/about";
import ContactPage from "@/pages/contact";
import NewsPage from "@/pages/news";
import PostDetailPage from "@/pages/post-detail";
import PressPage from "@/pages/press";
import CareersPage from "@/pages/careers";
import ToursPage from "@/pages/tours";
import StaticPageView from "@/pages/static-page";
import PlaylistsPage from "@/pages/playlists";
import AwardsPage from "@/pages/awards";

import AdminLogin from "@/pages/admin/login";
import AdminDashboard from "@/pages/admin/index";
import AdminReleases from "@/pages/admin/releases";
import AdminEvents from "@/pages/admin/events";
import AdminPosts from "@/pages/admin/posts";
import AdminContacts from "@/pages/admin/contacts";
import AdminSettings from "@/pages/admin/settings";
import AdminVideos from "@/pages/admin/videos";
import AdminPlaylists from "@/pages/admin/playlists";
import AdminRadioShows from "@/pages/admin/radio-shows";
import AdminArtists from "@/pages/admin/artists";
import AdminCareers from "@/pages/admin/careers";
import AdminTours from "@/pages/admin/tours";
import AdminPressKit from "@/pages/admin/press-kit";
import AdminStaticPages from "@/pages/admin/static-pages";
import AdminTestimonials from "@/pages/admin/testimonials";
import AdminAwards from "@/pages/admin/awards";
import AdminSeoSettings from "@/pages/admin/seo-settings";
import AdminNewsletters from "@/pages/admin/newsletters";

import NotFound from "@/pages/not-found";


function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return null;
}

function AnalyticsTracker() {
  const [location] = useLocation();

  useEffect(() => {
    if (!location.startsWith('/admin')) {
      db.analytics.trackPageView(location, document.title);
    }
  }, [location]);

  return null;
}

function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navigation />
      <main className="min-h-screen">{children}</main>
      <Footer />
      <GlobalRadioPlayer />
    </>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/">
        <PublicLayout>
          <HomePage />
        </PublicLayout>
      </Route>
      <Route path="/radio">
        <PublicLayout>
          <RadioPage />
        </PublicLayout>
      </Route>
      <Route path="/releases">
        <PublicLayout>
          <ReleasesPage />
        </PublicLayout>
      </Route>
      <Route path="/releases/:slug">
        <PublicLayout>
          <ReleaseDetailPage />
        </PublicLayout>
      </Route>
      <Route path="/events">
        <PublicLayout>
          <EventsPage />
        </PublicLayout>
      </Route>
      <Route path="/events/:slug">
        <PublicLayout>
          <EventDetailPage />
        </PublicLayout>
      </Route>
      <Route path="/artists">
        <PublicLayout>
          <ArtistsPage />
        </PublicLayout>
      </Route>
      <Route path="/artists/:slug">
        <PublicLayout>
          <ArtistDetailPage />
        </PublicLayout>
      </Route>
      <Route path="/videos">
        <PublicLayout>
          <VideosPage />
        </PublicLayout>
      </Route>
      <Route path="/playlists">
        <PublicLayout>
          <PlaylistsPage />
        </PublicLayout>
      </Route>
      <Route path="/awards">
        <PublicLayout>
          <AwardsPage />
        </PublicLayout>
      </Route>
      <Route path="/about">
        <PublicLayout>
          <AboutPage />
        </PublicLayout>
      </Route>
      <Route path="/contact">
        <PublicLayout>
          <ContactPage />
        </PublicLayout>
      </Route>
      <Route path="/news">
        <PublicLayout>
          <NewsPage />
        </PublicLayout>
      </Route>
      <Route path="/news/:slug">
        <PublicLayout>
          <PostDetailPage />
        </PublicLayout>
      </Route>
      <Route path="/press">
        <PublicLayout>
          <PressPage />
        </PublicLayout>
      </Route>
      <Route path="/careers">
        <PublicLayout>
          <CareersPage />
        </PublicLayout>
      </Route>
      <Route path="/tours">
        <PublicLayout>
          <ToursPage />
        </PublicLayout>
      </Route>
      <Route path="/terms">
        <PublicLayout>
          <StaticPageView />
        </PublicLayout>
      </Route>
      <Route path="/privacy">
        <PublicLayout>
          <StaticPageView />
        </PublicLayout>
      </Route>
      <Route path="/cookies">
        <PublicLayout>
          <StaticPageView />
        </PublicLayout>
      </Route>

      <Route path="/admin/login" component={AdminLogin} />

      <Route path="/admin">
        <ProtectedRoute>
          <AdminDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/releases">
        <ProtectedRoute>
          <AdminReleases />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/releases/:id">
        <ProtectedRoute>
          <AdminReleases />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/events">
        <ProtectedRoute>
          <AdminEvents />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/events/:id">
        <ProtectedRoute>
          <AdminEvents />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/posts">
        <ProtectedRoute>
          <AdminPosts />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/posts/:id">
        <ProtectedRoute>
          <AdminPosts />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/contacts">
        <ProtectedRoute>
          <AdminContacts />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/settings">
        <ProtectedRoute>
          <AdminSettings />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/videos">
        <ProtectedRoute>
          <AdminVideos />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/playlists">
        <ProtectedRoute>
          <AdminPlaylists />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/radio">
        <ProtectedRoute>
          <AdminRadioShows />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/artists">
        <ProtectedRoute>
          <AdminArtists />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/careers">
        <ProtectedRoute>
          <AdminCareers />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/tours">
        <ProtectedRoute>
          <AdminTours />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/press-kit">
        <ProtectedRoute>
          <AdminPressKit />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/static-pages">
        <ProtectedRoute>
          <AdminStaticPages />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/testimonials">
        <ProtectedRoute>
          <AdminTestimonials />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/awards">
        <ProtectedRoute>
          <AdminAwards />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/seo-settings">
        <ProtectedRoute>
          <AdminSeoSettings />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/newsletters">
        <ProtectedRoute>
          <AdminNewsletters />
        </ProtectedRoute>
      </Route>

      <Route>
        <PublicLayout>
          <NotFound />
        </PublicLayout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="Group Therapy-theme">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RadioProvider>
            <TooltipProvider>
              <ScrollToTop />
              <AnalyticsTracker />
              <Router />
              <Toaster />
            </TooltipProvider>
          </RadioProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;