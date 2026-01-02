 import { useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { db } from "@/lib/database";
import { resolveMediaUrl } from "@/lib/media";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  type?: "website" | "article" | "music.song" | "music.album" | "profile";
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  canonicalUrl?: string;
  noindex?: boolean;
  structuredData?: object;
}

export function SEOHead({
  canonicalUrl,
  noindex = false,
}: SEOProps) {
  const [location] = useLocation();
  const origin = typeof window !== "undefined" ? window.location.origin : "https://grouptherapyeg.com";
  const rawLocation = typeof location === "string" ? location : "/";
  const cleanPath = (rawLocation.split("?").shift() ?? "/").split("#").shift() ?? "/";
  const fullUrl = `${origin}${cleanPath}`;
  const nonEmpty = (value: unknown): string | undefined => {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  };

  const isAbsoluteUrl = (value: string): boolean => /^https?:\/\//i.test(value);

  const toAbsoluteUrl = (value: string, baseUrl: string): string => {
    const v = value.trim();
    if (!v) return v;
    if (isAbsoluteUrl(v)) return v;
    if (v.startsWith("/")) return `${baseUrl}${v}`;
    return `${baseUrl}/${v}`;
  };

  const canonical = nonEmpty(canonicalUrl) || fullUrl;

  const { data: seoSettings } = useQuery({
    queryKey: ["seoSettings"],
    queryFn: () => db.seoSettings.get(),
  });

  const siteName =
    nonEmpty((seoSettings?.organizationSchema as any)?.name) ||
    nonEmpty((seoSettings?.websiteSchema as any)?.name) ||
    "GroupTherapy Records";

  const route = useMemo(() => {
    const loc = typeof location === "string" ? location : "/";
    const clean = loc.split("?")[0] || "/";
    const cleanNoHash = clean.split("#")[0] || "/";
    const seg = cleanNoHash.split("/").filter(Boolean);
    const first = seg[0] || "";
    const second = seg[1] || "";

    if (!first) return { kind: "home" as const };

    if (first === "news" && second) return { kind: "post" as const, slug: second };
    if (first === "releases" && second) return { kind: "release" as const, slug: second };
    if (first === "events" && second) return { kind: "event" as const, slug: second };
    if (first === "artists" && second) return { kind: "artist" as const, slug: second };

    if (["terms", "privacy", "cookies"].includes(first)) return { kind: "static" as const, slug: first };

    return { kind: "section" as const, slug: first };
  }, [location]);

  const { data: post } = useQuery({
    queryKey: ["seoRoute", "post", (route as any).slug],
    queryFn: () => db.posts.getBySlug((route as any).slug),
    enabled: route.kind === "post" && !!(route as any).slug,
  });

  const { data: release } = useQuery({
    queryKey: ["seoRoute", "release", (route as any).slug],
    queryFn: () => db.releases.getBySlug((route as any).slug),
    enabled: route.kind === "release" && !!(route as any).slug,
  });

  const { data: event } = useQuery({
    queryKey: ["seoRoute", "event", (route as any).slug],
    queryFn: () => db.events.getBySlug((route as any).slug),
    enabled: route.kind === "event" && !!(route as any).slug,
  });

  const { data: artist } = useQuery({
    queryKey: ["seoRoute", "artist", (route as any).slug],
    queryFn: () => db.artists.getBySlug((route as any).slug),
    enabled: route.kind === "artist" && !!(route as any).slug,
  });

  const { data: staticPage } = useQuery({
    queryKey: ["seoRoute", "static", (route as any).slug],
    queryFn: () => db.staticPages.getBySlug((route as any).slug),
    enabled: (route.kind === "static" || route.kind === "section") && !!(route as any).slug,
  });

  const stripAndTruncate = (value: string | undefined, maxLen = 160): string | undefined => {
    if (!value) return undefined;
    const text = value
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!text) return undefined;
    return text.length > maxLen ? `${text.slice(0, maxLen - 1).trim()}…` : text;
  };

  const sectionMeta = (slug: string | undefined): { title?: string; description?: string } => {
    switch (slug) {
      case "news":
        return { title: `News | ${siteName}`, description: "Latest updates, announcements, and stories." };
      case "releases":
        return { title: `Releases | ${siteName}`, description: "Discover new and featured music releases." };
      case "events":
        return { title: `Events | ${siteName}`, description: "Upcoming shows, parties, and community gatherings." };
      case "artists":
        return { title: `Artists | ${siteName}`, description: "Explore our roster and featured artists." };
      case "videos":
        return { title: `Videos | ${siteName}`, description: "Watch music videos, live sets, and label content." };
      case "playlists":
        return { title: `Playlists | ${siteName}`, description: "Curated playlists and mixes." };
      case "radio":
        return { title: `Radio | ${siteName}`, description: "Live radio and recorded shows." };
      case "about":
        return { title: `About | ${siteName}`, description: "Learn more about the label and our mission." };
      case "contact":
        return { title: `Contact | ${siteName}`, description: "Get in touch with the team." };
      case "press":
        return { title: `Press | ${siteName}`, description: "Press resources, assets, and contact information." };
      case "careers":
        return { title: `Careers | ${siteName}`, description: "Open roles and opportunities." };
      case "tours":
        return { title: `Tours | ${siteName}`, description: "Tours and appearances." };
      case "awards":
        return { title: `Awards | ${siteName}`, description: "Awards and nominations." };
      default:
        return {};
    }
  };

  const fallbackTitle = nonEmpty(seoSettings?.defaultTitle) || "GroupTherapy Records - Electronic Music Label";
  const fallbackDescription =
    nonEmpty(seoSettings?.defaultDescription) ||
    "The sound of tomorrow, today. Discover cutting-edge electronic music from the world's most innovative artists. Releases, events, radio, and more.";

  const routeTitle = (() => {
    if (route.kind === "post" && post) return `${post.metaTitle || post.title} | ${siteName}`;
    if (route.kind === "release" && release) return `${release.title} | ${siteName}`;
    if (route.kind === "event" && event) return `${event.title} | ${siteName}`;
    if (route.kind === "artist" && artist) return `${artist.name} | ${siteName}`;
    if ((route.kind === "static" || route.kind === "section") && staticPage) {
      const t = nonEmpty((staticPage as any).metaTitle) || nonEmpty((staticPage as any).title);
      if (!t) return undefined;
      return nonEmpty((staticPage as any).metaTitle) ? t : `${t} | ${siteName}`;
    }
    if (route.kind === "home") return fallbackTitle;
    if (route.kind === "section") return sectionMeta((route as any).slug).title;
    return undefined;
  })();

  const routeDescription = (() => {
    if (route.kind === "post" && post) return post.metaDescription || post.excerpt || stripAndTruncate(post.content);
    if (route.kind === "release" && release)
      return stripAndTruncate(`${release.artistName} • ${release.type}${release.releaseDate ? ` • ${release.releaseDate}` : ""}`, 160);
    if (route.kind === "event" && event)
      return event.description || stripAndTruncate(`${event.city}${event.country ? `, ${event.country}` : ""} • ${event.date}`);
    if (route.kind === "artist" && artist) return stripAndTruncate(artist.bio) || fallbackDescription;
    if (route.kind === "static" && staticPage) {
      return (
        nonEmpty((staticPage as any).metaDescription) ||
        stripAndTruncate((staticPage as any).content) ||
        fallbackDescription
      );
    }
    if (route.kind === "section" && staticPage) {
      return nonEmpty((staticPage as any).metaDescription) || fallbackDescription;
    }
    if (route.kind === "section") return sectionMeta((route as any).slug).description;
    return undefined;
  })();

  const resolvedTitle = routeTitle || fallbackTitle;
  const resolvedDescription = routeDescription || fallbackDescription;
  const resolvedKeywords =
    (seoSettings?.defaultKeywords?.length ? seoSettings.defaultKeywords : undefined) ??
    ["electronic music", "record label", "house music", "techno", "DJ", "music events", "music releases", "independent label"];

  const routeImage = (() => {
    if (route.kind === "post" && post) return post.ogImageUrl || post.coverUrl;
    if (route.kind === "release" && release) return release.coverUrl;
    if (route.kind === "event" && event) return event.imageUrl;
    if (route.kind === "artist" && artist) return artist.imageUrl;
    return undefined;
  })();

  const ogImageRaw = routeImage || seoSettings?.ogImage || `${origin}/favicon.png`;
  const twitterImageRaw = routeImage || seoSettings?.twitterImage || seoSettings?.ogImage || `${origin}/favicon.png`;
  const resolvedOgImage = resolveMediaUrl(ogImageRaw, "full");
  const resolvedTwitterImage = resolveMediaUrl(twitterImageRaw, "full");

  const ogType = (() => {
    if (route.kind === "post") return "article";
    if (route.kind === "release") return "music.album";
    if (route.kind === "artist") return "profile";
    return "website";
  })();

  const ogLogoRaw =
    nonEmpty((seoSettings?.organizationSchema as any)?.logo) ||
    nonEmpty((seoSettings?.websiteSchema as any)?.logo) ||
    `${origin}/favicon.png`;

  const resolvedOgLogo = resolveMediaUrl(toAbsoluteUrl(String(ogLogoRaw), origin), "full");

  const twitterHandle = nonEmpty(seoSettings?.twitterHandle);

  const resolvedStructuredData = (() => {
    const schemas = [seoSettings?.organizationSchema, seoSettings?.websiteSchema, seoSettings?.musicGroupSchema].filter(Boolean);
    if (!schemas.length) return undefined;
    return {
      "@context": "https://schema.org",
      "@graph": schemas,
    };
  })();

  useEffect(() => {
    // Set document title
    document.title = resolvedTitle;

    // Update meta tags
    updateMetaTag("title", resolvedTitle);
    updateMetaTag("description", resolvedDescription);
    updateMetaTag("keywords", resolvedKeywords.join(", "));

    updateMetaTag("name", resolvedTitle, "itemprop");
    updateMetaTag("description", resolvedDescription, "itemprop");
    updateMetaTag("image", resolvedOgImage, "itemprop");
    
    // Open Graph tags
    updateMetaTag("og:title", resolvedTitle, "property");
    updateMetaTag("og:description", resolvedDescription, "property");
    updateMetaTag("og:image", resolvedOgImage, "property");
    updateMetaTag("og:logo", resolvedOgLogo, "property");
    updateMetaTag("og:url", canonical, "property");
    updateMetaTag("og:type", ogType, "property");
    updateMetaTag("og:site_name", siteName, "property");

    // Twitter Card tags
    updateMetaTag("twitter:card", "summary_large_image");
    updateMetaTag("twitter:title", resolvedTitle);
    updateMetaTag("twitter:description", resolvedDescription);
    updateMetaTag("twitter:image", resolvedTwitterImage);
    if (twitterHandle) updateMetaTag("twitter:site", twitterHandle);

    // Canonical URL
    updateLinkTag("canonical", canonical);

    // Robots meta
    if (noindex) {
      updateMetaTag("robots", "noindex, nofollow");
    } else {
      updateMetaTag("robots", "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1");
    }

    // Structured data
    if (resolvedStructuredData) {
      updateStructuredData(resolvedStructuredData);
    }
  }, [
    resolvedTitle,
    resolvedDescription,
    resolvedKeywords,
    resolvedOgImage,
    resolvedOgLogo,
    resolvedTwitterImage,
    twitterHandle,
    canonical,
    ogType,
    siteName,
    noindex,
    resolvedStructuredData,
  ]);

  return null;
}

function updateMetaTag(name: string, content: string, attribute: string = "name") {
  let element = document.querySelector(`meta[${attribute}="${name}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function updateLinkTag(rel: string, href: string) {
  let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", rel);
    document.head.appendChild(element);
  }
  element.href = href;
}

function updateStructuredData(data: object) {
  const id = "structured-data";
  let script = document.getElementById(id);
  if (!script) {
    script = document.createElement("script");
    script.id = id;
    (script as HTMLScriptElement).type = "application/ld+json";
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}

export function generateStructuredData(type: string, data: any) {
  const baseData = {
    "@context": "https://schema.org",
    "@type": type,
    ...data,
  };
  return baseData;
}
