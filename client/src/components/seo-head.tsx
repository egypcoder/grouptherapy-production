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

  const { data: seoSettings, isFetched: seoSettingsFetched } = useQuery({
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

  const { data: post, isFetched: postFetched } = useQuery({
    queryKey: ["seoRoute", "post", (route as any).slug],
    queryFn: () => db.posts.getBySlug((route as any).slug),
    enabled: route.kind === "post" && !!(route as any).slug,
  });

  const { data: release, isFetched: releaseFetched } = useQuery({
    queryKey: ["seoRoute", "release", (route as any).slug],
    queryFn: () => db.releases.getBySlug((route as any).slug),
    enabled: route.kind === "release" && !!(route as any).slug,
  });

  const { data: event, isFetched: eventFetched } = useQuery({
    queryKey: ["seoRoute", "event", (route as any).slug],
    queryFn: () => db.events.getBySlug((route as any).slug),
    enabled: route.kind === "event" && !!(route as any).slug,
  });

  const { data: artist, isFetched: artistFetched } = useQuery({
    queryKey: ["seoRoute", "artist", (route as any).slug],
    queryFn: () => db.artists.getBySlug((route as any).slug),
    enabled: route.kind === "artist" && !!(route as any).slug,
  });

  const { data: staticPage, isFetched: staticPageFetched } = useQuery({
    queryKey: ["seoRoute", "static", (route as any).slug],
    queryFn: () => db.staticPages.getBySlug((route as any).slug),
    enabled: (route.kind === "static" || route.kind === "section") && !!(route as any).slug,
  });

  const safeIsoDate = (value: unknown): string | undefined => {
    if (!value) return undefined;
    const d = new Date(String(value));
    if (Number.isNaN(d.getTime())) return undefined;
    return d.toISOString();
  };

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
  const resolvedOgImage = resolveMediaUrl(toAbsoluteUrl(String(ogImageRaw), origin), "full");
  const resolvedTwitterImage = resolveMediaUrl(toAbsoluteUrl(String(twitterImageRaw), origin), "full");

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
    const baseSchemas = [seoSettings?.organizationSchema, seoSettings?.websiteSchema, seoSettings?.musicGroupSchema].filter(Boolean);
    const contentSchemas: any[] = [];

    if (route.kind === "post" && post) {
      const datePublished = safeIsoDate((post as any).publishedAt || (post as any).createdAt);
      contentSchemas.push({
        "@type": "BlogPosting",
        headline: String(post.metaTitle || post.title),
        description: String(post.metaDescription || post.excerpt || stripAndTruncate(post.content, 200) || fallbackDescription),
        image: routeImage ? [toAbsoluteUrl(String(routeImage), origin)] : undefined,
        datePublished,
        dateModified: datePublished,
        author: (post as any).authorName ? { "@type": "Person", name: String((post as any).authorName) } : undefined,
        mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
        url: canonical,
      });
    }

    if (route.kind === "release" && release) {
      const releaseDate = safeIsoDate((release as any).releaseDate || (release as any).createdAt);
      contentSchemas.push({
        "@type": "MusicAlbum",
        name: String((release as any).title),
        byArtist: { "@type": "MusicGroup", name: String((release as any).artistName) },
        datePublished: releaseDate,
        image: routeImage ? [toAbsoluteUrl(String(routeImage), origin)] : undefined,
        url: canonical,
      });
    }

    if (route.kind === "event" && event) {
      const startTime = safeIsoDate((event as any).date || (event as any).createdAt);
      const endTime = safeIsoDate((event as any).endDate);
      contentSchemas.push({
        "@type": "Event",
        name: String((event as any).title),
        description: (event as any).description ? String((event as any).description) : undefined,
        startDate: startTime,
        endDate: endTime,
        url: canonical,
        image: routeImage ? [toAbsoluteUrl(String(routeImage), origin)] : undefined,
        location: {
          "@type": "Place",
          name: (event as any).venue ? String((event as any).venue) : undefined,
          address: {
            "@type": "PostalAddress",
            streetAddress: (event as any).address ? String((event as any).address) : undefined,
            addressLocality: (event as any).city ? String((event as any).city) : undefined,
            addressCountry: (event as any).country ? String((event as any).country) : undefined,
          },
        },
      });
    }

    if (route.kind === "artist" && artist) {
      contentSchemas.push({
        "@type": "Person",
        name: String((artist as any).name),
        description: (artist as any).bio ? String((artist as any).bio) : undefined,
        image: routeImage ? [toAbsoluteUrl(String(routeImage), origin)] : undefined,
        url: canonical,
      });
    }

    const schemas = [...baseSchemas, ...contentSchemas].filter(Boolean);
    if (!schemas.length) return undefined;
    return {
      "@context": "https://schema.org",
      "@graph": schemas,
    };
  })();

  const routeDataReady = (() => {
    if (!seoSettingsFetched) return false;
    if (route.kind === "post") return postFetched;
    if (route.kind === "release") return releaseFetched;
    if (route.kind === "event") return eventFetched;
    if (route.kind === "artist") return artistFetched;
    if (route.kind === "static" || route.kind === "section") return staticPageFetched;
    return true;
  })();

  useEffect(() => {
    if (!routeDataReady) return;

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

    // Dynamic date meta tags (remove when not applicable)
    const removeMetaTag = (name: string, attribute: string = "name") => {
      const el = document.querySelector(`meta[${attribute}="${name}"]`);
      if (el && el.parentNode) el.parentNode.removeChild(el);
    };

    removeMetaTag("article:published_time", "property");
    removeMetaTag("article:author", "property");
    removeMetaTag("music:release_date", "property");
    removeMetaTag("event:start_time", "property");
    removeMetaTag("event:end_time", "property");
    removeMetaTag("og:updated_time", "property");

    if (route.kind === "post" && post) {
      const published = safeIsoDate((post as any).publishedAt || (post as any).createdAt);
      if (published) {
        updateMetaTag("article:published_time", published, "property");
        updateMetaTag("og:updated_time", published, "property");
      }
      if ((post as any).authorName) {
        updateMetaTag("article:author", String((post as any).authorName), "property");
      }
    }

    if (route.kind === "release" && release) {
      const releaseDate = safeIsoDate((release as any).releaseDate || (release as any).createdAt);
      if (releaseDate) {
        updateMetaTag("music:release_date", releaseDate, "property");
        updateMetaTag("og:updated_time", releaseDate, "property");
      }
    }

    if (route.kind === "event" && event) {
      const startTime = safeIsoDate((event as any).date || (event as any).createdAt);
      const endTime = safeIsoDate((event as any).endDate);
      if (startTime) {
        updateMetaTag("event:start_time", startTime, "property");
        updateMetaTag("og:updated_time", startTime, "property");
      }
      if (endTime) updateMetaTag("event:end_time", endTime, "property");
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
    routeDataReady,
    post,
    release,
    event,
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
  script.textContent = JSON.stringify(data).replace(/</g, "\\u003c");
}

export function generateStructuredData(type: string, data: any) {
  const baseData = {
    "@context": "https://schema.org",
    "@type": type,
    ...data,
  };
  return baseData;
}
