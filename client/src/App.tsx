import type React from "react";
import { Suspense, lazy, useEffect } from "react";
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
import { ChatProvider } from "@/lib/chat-context";
import { ChatMiniNotification } from "@/components/chat-mini-notification";
import { ChatFullMode } from "@/components/chat-full-mode";
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

const AdminLogin = lazy(() => import("@/pages/admin/login"));
const AdminDashboard = lazy(() => import("@/pages/admin/index"));
const AdminReleases = lazy(() => import("@/pages/admin/releases"));
const AdminEvents = lazy(() => import("@/pages/admin/events"));
const AdminPosts = lazy(() => import("@/pages/admin/posts"));
const AdminContacts = lazy(() => import("@/pages/admin/contacts"));
const AdminSettings = lazy(() => import("@/pages/admin/settings"));
const AdminVideos = lazy(() => import("@/pages/admin/videos"));
const AdminPlaylists = lazy(() => import("@/pages/admin/playlists"));
const AdminRadioShows = lazy(() => import("@/pages/admin/radio-shows"));
const AdminArtists = lazy(() => import("@/pages/admin/artists"));
const AdminCareers = lazy(() => import("@/pages/admin/careers"));
const AdminTours = lazy(() => import("@/pages/admin/tours"));
const AdminPressKit = lazy(() => import("@/pages/admin/press-kit"));
const AdminStaticPages = lazy(() => import("@/pages/admin/static-pages"));
const AdminTestimonials = lazy(() => import("@/pages/admin/testimonials"));
const AdminAwards = lazy(() => import("@/pages/admin/awards"));
const AdminSeoSettings = lazy(() => import("@/pages/admin/seo-settings"));
const AdminNewsletters = lazy(() => import("@/pages/admin/newsletters"));

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
      <ChatProvider>
        <main className="min-h-screen">{children}</main>
        <ChatFullMode />
        <ChatMiniNotification />
        <GlobalRadioPlayer />
      </ChatProvider>
      <Footer />
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

      <Route path="/admin/login">
        <Suspense fallback={null}>
          <AdminLogin />
        </Suspense>
      </Route>

      <Route path="/admin">
        <ProtectedRoute>
          <Suspense fallback={null}>
            <AdminDashboard />
          </Suspense>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/releases">
        <ProtectedRoute>
          <Suspense fallback={null}>
            <AdminReleases />
          </Suspense>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/releases/:id">
        <ProtectedRoute>
          <Suspense fallback={null}>
            <AdminReleases />
          </Suspense>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/events">
        <ProtectedRoute>
          <Suspense fallback={null}>
            <AdminEvents />
          </Suspense>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/events/:id">
        <ProtectedRoute>
          <Suspense fallback={null}>
            <AdminEvents />
          </Suspense>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/posts">
        <ProtectedRoute>
          <Suspense fallback={null}>
            <AdminPosts />
          </Suspense>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/posts/:id">
        <ProtectedRoute>
          <Suspense fallback={null}>
            <AdminPosts />
          </Suspense>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/contacts">
        <ProtectedRoute>
          <Suspense fallback={null}>
            <AdminContacts />
          </Suspense>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/settings">
        <ProtectedRoute>
          <Suspense fallback={null}>
            <AdminSettings />
          </Suspense>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/videos">
        <ProtectedRoute>
          <Suspense fallback={null}>
            <AdminVideos />
          </Suspense>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/playlists">
        <ProtectedRoute>
          <Suspense fallback={null}>
            <AdminPlaylists />
          </Suspense>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/radio">
        <ProtectedRoute>
          <Suspense fallback={null}>
            <AdminRadioShows />
          </Suspense>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/artists">
        <ProtectedRoute>
          <Suspense fallback={null}>
            <AdminArtists />
          </Suspense>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/careers">
        <ProtectedRoute>
          <Suspense fallback={null}>
            <AdminCareers />
          </Suspense>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/tours">
        <ProtectedRoute>
          <Suspense fallback={null}>
            <AdminTours />
          </Suspense>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/press-kit">
        <ProtectedRoute>
          <Suspense fallback={null}>
            <AdminPressKit />
          </Suspense>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/static-pages">
        <ProtectedRoute>
          <Suspense fallback={null}>
            <AdminStaticPages />
          </Suspense>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/testimonials">
        <ProtectedRoute>
          <Suspense fallback={null}>
            <AdminTestimonials />
          </Suspense>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/awards">
        <ProtectedRoute>
          <Suspense fallback={null}>
            <AdminAwards />
          </Suspense>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/seo-settings">
        <ProtectedRoute>
          <Suspense fallback={null}>
            <AdminSeoSettings />
          </Suspense>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/newsletters">
        <ProtectedRoute>
          <Suspense fallback={null}>
            <AdminNewsletters />
          </Suspense>
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