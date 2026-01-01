 
import { useEffect } from "react";
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
  title,
  description,
  keywords,
  image,
  type = "website",
  author,
  publishedTime,
  modifiedTime,
  canonicalUrl,
  noindex = false,
  structuredData,
}: SEOProps) {
  const [location] = useLocation();
  const fullUrl = `https://grouptherapy.com${location}`;
  const canonical = canonicalUrl || fullUrl;

  const { data: seoSettings } = useQuery({
    queryKey: ["seoSettings"],
    queryFn: () => db.seoSettings.get(),
  });

  const resolvedTitle = title ?? seoSettings?.defaultTitle ?? "GroupTherapy Records - Electronic Music Label";
  const resolvedDescription =
    description ??
    seoSettings?.defaultDescription ??
    "The sound of tomorrow, today. Discover cutting-edge electronic music from the world's most innovative artists. Releases, events, radio, and more.";
  const resolvedKeywords =
    keywords ??
    (seoSettings?.defaultKeywords?.length ? seoSettings.defaultKeywords : undefined) ??
    ["electronic music", "record label", "house music", "techno", "DJ", "music events", "music releases", "independent label"];

  const ogImageRaw = image ?? seoSettings?.ogImage ?? "https://grouptherapy.com/og-image.jpg";
  const twitterImageRaw = image ?? seoSettings?.twitterImage ?? seoSettings?.ogImage ?? "https://grouptherapy.com/og-image.jpg";
  const resolvedOgImage = resolveMediaUrl(ogImageRaw, "full");
  const resolvedTwitterImage = resolveMediaUrl(twitterImageRaw, "full");

  const twitterHandle = seoSettings?.twitterHandle?.trim() || undefined;
  const resolvedStructuredData = structuredData ?? undefined;

  useEffect(() => {
    // Set document title
    document.title = resolvedTitle;

    // Update meta tags
    updateMetaTag("description", resolvedDescription);
    updateMetaTag("keywords", resolvedKeywords.join(", "));
    
    // Open Graph tags
    updateMetaTag("og:title", resolvedTitle, "property");
    updateMetaTag("og:description", resolvedDescription, "property");
    updateMetaTag("og:image", resolvedOgImage, "property");
    updateMetaTag("og:url", fullUrl, "property");
    updateMetaTag("og:type", type, "property");
    updateMetaTag("og:site_name", "GroupTherapy Records", "property");

    // Twitter Card tags
    updateMetaTag("twitter:card", "summary_large_image");
    updateMetaTag("twitter:title", resolvedTitle);
    updateMetaTag("twitter:description", resolvedDescription);
    updateMetaTag("twitter:image", resolvedTwitterImage);
    if (twitterHandle) updateMetaTag("twitter:site", twitterHandle);

    // Additional SEO tags
    if (author) updateMetaTag("author", author);
    if (publishedTime) updateMetaTag("article:published_time", publishedTime, "property");
    if (modifiedTime) updateMetaTag("article:modified_time", modifiedTime, "property");

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
    resolvedTwitterImage,
    twitterHandle,
    fullUrl,
    type,
    author,
    publishedTime,
    modifiedTime,
    canonical,
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
