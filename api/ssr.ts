import { createClient } from "@supabase/supabase-js";

type Req = {
  headers: Record<string, string | string[] | undefined>;
  query?: Record<string, string | string[] | undefined>;
};

type Res = {
  status: (code: number) => Res;
  setHeader: (name: string, value: string) => void;
  send: (body: string) => void;
};

function firstHeader(value: string | string[] | undefined): string | undefined {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeJsonForScriptTag(data: object): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

function stripSeo(html: string): string {
  html = html.replace(/<title[^>]*>[\s\S]*?<\/title>/gi, "");

  html = html.replace(
    /<meta\s+[^>]*(?:name|property)=(?:\"|')?(?:title|description|keywords|robots|twitter:[^\"'>\s]+|og:[^\"'>\s]+)(?:\"|')?[^>]*>/gi,
    ""
  );

  html = html.replace(/<link\s+[^>]*rel=(?:\"|')canonical(?:\"|')[^>]*>/gi, "");

  html = html.replace(/<script[^>]*id=(?:\"|')structured-data(?:\"|')[^>]*>[\s\S]*?<\/script>/gi, "");

  return html;
}

function buildSeoBlock(args: {
  title: string;
  description: string;
  keywords: string;
  canonical: string;
  ogUrl: string;
  ogType: string;
  siteName: string;
  ogImage: string;
  ogLogo: string;
  twitterImage: string;
  twitterHandle?: string;
  structuredData?: object;
  robots?: string;
  extraMeta?: string;
}): string {
  const {
    title,
    description,
    keywords,
    canonical,
    ogUrl,
    ogType,
    siteName,
    ogImage,
    ogLogo,
    twitterImage,
    twitterHandle,
    structuredData,
    robots,
    extraMeta,
  } = args;

  const sd = structuredData ? safeJsonForScriptTag(structuredData) : "";

  return `<title>${escapeHtml(title)}</title>
<meta name="title" content="${escapeHtml(title)}" />
<meta name="description" content="${escapeHtml(description)}" />
<meta name="keywords" content="${escapeHtml(keywords)}" />
${robots ? `<meta name="robots" content="${escapeHtml(robots)}" />` : ""}
<meta property="og:type" content="${escapeHtml(ogType)}" />
<meta property="og:site_name" content="${escapeHtml(siteName)}" />
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(description)}" />
<meta property="og:image" content="${escapeHtml(ogImage)}" />
<meta property="og:logo" content="${escapeHtml(ogLogo)}" />
<meta property="og:url" content="${escapeHtml(ogUrl)}" />
${extraMeta ? extraMeta : ""}
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(title)}" />
<meta name="twitter:description" content="${escapeHtml(description)}" />
<meta name="twitter:image" content="${escapeHtml(twitterImage)}" />
${twitterHandle ? `<meta name="twitter:site" content="${escapeHtml(twitterHandle)}" />` : ""}
<link rel="canonical" href="${escapeHtml(canonical)}" />
${structuredData ? `<script id="structured-data" type="application/ld+json">${sd}</script>` : ""}`;
}

function extractOgLogo(data: any, baseUrl: string): string {
  return `${baseUrl}/favicon.png`;
}

function extractSiteName(data: any): string {
  const org = data?.organization_schema?.name;
  if (typeof org === "string" && org.trim().length) return org;
  const web = data?.website_schema?.name;
  if (typeof web === "string" && web.trim().length) return web;
  return "GroupTherapy Records";
}

function stripAndTruncate(value: string | undefined, maxLen = 160): string | undefined {
  if (!value) return undefined;
  const text = value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return undefined;
  return text.length > maxLen ? `${text.slice(0, maxLen - 1).trim()}…` : text;
}

function sectionMeta(siteName: string, slug: string): { title?: string; description?: string } {
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
    case "awards":
      return { title: `Awards | ${siteName}`, description: "Awards and nominations." };
    case "tours":
      return { title: `Tours | ${siteName}`, description: "Tours and appearances." };
    default:
      return {};
  }
}

function isAbsoluteUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function toAbsoluteUrl(value: string, baseUrl: string): string {
  const v = value.trim();
  if (!v) return v;
  if (isAbsoluteUrl(v)) return v;
  if (v.startsWith("/")) return `${baseUrl}${v}`;
  return `${baseUrl}/${v}`;
}

function uniqKeywords(values: Array<string | undefined | null>): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of values) {
    const v = typeof raw === "string" ? raw.trim() : "";
    if (!v) continue;
    const key = v.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out;
}

export default async function handler(req: Req, res: Res) {
  try {
    const host =
      firstHeader(req.headers["x-forwarded-host"]) ||
      firstHeader(req.headers["host"]) ||
      "localhost";
    const proto =
      firstHeader(req.headers["x-forwarded-proto"]) ||
      (host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https");

    const pathParam = (req.query?.path || "") as string | string[];
    const rawPath = Array.isArray(pathParam) ? pathParam[0] || "" : pathParam;
    const pathname = rawPath ? `/${rawPath.replace(/^\/+/, "")}` : "/";

    const baseUrl = `${proto}://${host}`;
    const canonical = `${baseUrl}${pathname}`;

    const templateResp = await fetch(`${baseUrl}/index.html`, {
      headers: { "user-agent": "ssr-seo-bot" },
    });
    const template = await templateResp.text();

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      const title = "GroupTherapy Records - Electronic Music Label";
      const description =
        "The sound of tomorrow, today. Discover cutting-edge electronic music from the world's most innovative artists. Releases, events, radio, and more.";
      const keywords = "electronic music, record label, house music, techno";
      const ogImage = `${baseUrl}/favicon.png`;
      const ogLogo = `${baseUrl}/favicon.png`;
      const twitterImage = `${baseUrl}/favicon.png`;

      const path = pathname.replace(/^\//, "");
      const siteName = "GroupTherapy Records";
      const section = path.split("/")[0] || "";
      const sectionResolved = section ? sectionMeta(siteName, section) : {};

      const seoBlock = buildSeoBlock({
        title: sectionResolved.title || title,
        description: sectionResolved.description || description,
        keywords,
        canonical,
        ogUrl: canonical,
        ogType: "website",
        siteName,
        ogImage,
        ogLogo,
        twitterImage,
      });

      const cleaned = stripSeo(template);
      const withSeo = cleaned.replace(/<head(\s[^>]*)?>/i, (m) => `${m}\n${seoBlock}\n`);

      res.status(200);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=0, s-maxage=60");
      res.send(withSeo);
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data } = await supabase
      .from("seo_settings")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) {
      const title = "GroupTherapy Records - Electronic Music Label";
      const description =
        "The sound of tomorrow, today. Discover cutting-edge electronic music from the world's most innovative artists. Releases, events, radio, and more.";
      const keywords = "electronic music, record label, house music, techno";
      const ogImage = `${baseUrl}/favicon.png`;
      const ogLogo = `${baseUrl}/favicon.png`;
      const twitterImage = `${baseUrl}/favicon.png`;

      const path = pathname.replace(/^\//, "");
      const siteName = "GroupTherapy Records";
      const section = path.split("/")[0] || "";
      const sectionResolved = section ? sectionMeta(siteName, section) : {};

      const seoBlock = buildSeoBlock({
        title: sectionResolved.title || title,
        description: sectionResolved.description || description,
        keywords,
        canonical,
        ogUrl: canonical,
        ogType: "website",
        siteName,
        ogImage,
        ogLogo,
        twitterImage,
      });

      const cleaned = stripSeo(template);
      const withSeo = cleaned.replace(/<head(\s[^>]*)?>/i, (m) => `${m}\n${seoBlock}\n`);

      res.status(200);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=0, s-maxage=60");
      res.send(withSeo);
      return;
    }

    const siteName = extractSiteName(data);

    const fallbackTitle = data.default_title || "GroupTherapy Records - Electronic Music Label";
    const fallbackDescription =
      data.default_description ||
      "The sound of tomorrow, today. Discover cutting-edge electronic music from the world's most innovative artists. Releases, events, radio, and more.";
    const baseKeywords = Array.isArray(data.default_keywords)
      ? (data.default_keywords as unknown[]).map((k) => (typeof k === "string" ? k : "")).filter(Boolean)
      : ["electronic music", "record label", "house music", "techno"];

    let title = fallbackTitle;
    let description = fallbackDescription;
    let ogType = "website";
    let routeKeywords: string[] = [];
    let extraMeta = "";

    const path = pathname.replace(/^\//, "");
    const seg = path.split("/").filter(Boolean);
    const first = seg[0] || "";
    const second = seg[1] || "";

    let routeImage: string | undefined;

    if (first === "news" && second) {
      const { data: p } = await supabase
        .from("posts")
        .select(
          "title, meta_title, meta_description, excerpt, content, cover_url, og_image_url, tags, category, author_name, published_at, created_at"
        )
        .eq("slug", second)
        .eq("published", true)
        .limit(1)
        .maybeSingle();

      if (p) {
        title = `${p.meta_title || p.title} | ${siteName}`;
        description = p.meta_description || p.excerpt || stripAndTruncate(p.content) || fallbackDescription;
        routeImage = p.og_image_url || p.cover_url || undefined;
        ogType = "article";

        routeKeywords = uniqKeywords([
          ...baseKeywords,
          siteName,
          p.category,
          ...(Array.isArray(p.tags) ? p.tags : []),
          p.author_name,
          p.title,
        ]);

        const publishedTime = p.published_at || p.created_at;
        if (publishedTime) {
          extraMeta += `\n<meta property="article:published_time" content="${escapeHtml(new Date(publishedTime).toISOString())}" />`;
        }
        if (p.author_name) {
          extraMeta += `\n<meta property="article:author" content="${escapeHtml(String(p.author_name))}" />`;
        }
      }
    } else if (first === "releases" && second) {
      const { data: r } = await supabase
        .from("releases")
        .select("title, artist_name, type, release_date, cover_url, genres, created_at")
        .eq("slug", second)
        .eq("published", true)
        .limit(1)
        .maybeSingle();

      if (r) {
        title = `${r.title} | ${siteName}`;
        description =
          stripAndTruncate(`${r.artist_name} • ${r.type}${r.release_date ? ` • ${r.release_date}` : ""}", 160) ||
          fallbackDescription;
        routeImage = r.cover_url || undefined;
        ogType = "music.album";

        routeKeywords = uniqKeywords([
          ...baseKeywords,
          siteName,
          r.artist_name,
          r.title,
          r.type,
          ...(Array.isArray(r.genres) ? r.genres : []),
        ]);
      }
    } else if (first === "events" && second) {
      const { data: e } = await supabase
        .from("events")
        .select("title, description, venue, city, country, date, image_url, created_at")
        .eq("slug", second)
        .eq("published", true)
        .limit(1)
        .maybeSingle();

      if (e) {
        title = `${e.title} | ${siteName}`;
        description =
          e.description || stripAndTruncate(`${e.city}${e.country ? `, ${e.country}` : ""} • ${e.date}") || fallbackDescription;
        routeImage = e.image_url || undefined;

        routeKeywords = uniqKeywords([
          ...baseKeywords,
          siteName,
          e.title,
          e.venue,
          e.city,
          e.country,
          "events",
        ]);
      }
    } else if (first === "artists" && second) {
      const { data: a } = await supabase
        .from("artists")
        .select("name, bio, image_url, created_at")
        .eq("slug", second)
        .limit(1)
        .maybeSingle();

      if (a) {
        title = `${a.name} | ${siteName}`;
        description = stripAndTruncate(a.bio) || fallbackDescription;
        routeImage = a.image_url || undefined;
        ogType = "profile";

        routeKeywords = uniqKeywords([...baseKeywords, siteName, a.name, "artists"]);
      }
    } else if (["terms", "privacy", "cookies"].includes(first)) {
      const { data: sp } = await supabase
        .from("static_pages")
        .select("title, content, meta_title, meta_description, updated_at, created_at")
        .eq("slug", first)
        .eq("published", true)
        .limit(1)
        .maybeSingle();

      if (sp) {
        title = `${sp.meta_title || sp.title} | ${siteName}`;
        description = sp.meta_description || stripAndTruncate(sp.content) || fallbackDescription;

        routeKeywords = uniqKeywords([...baseKeywords, siteName, sp.title, first]);
      }
    } else if (first) {
      const sectionResolved = sectionMeta(siteName, first);
      if (sectionResolved.title) title = sectionResolved.title;
      if (sectionResolved.description) description = sectionResolved.description;

      routeKeywords = uniqKeywords([...baseKeywords, siteName, first]);
    }

    const resolvedKeywords = (routeKeywords.length ? routeKeywords : baseKeywords).join(", ");

    const headScripts = typeof data.head_scripts === "string" ? data.head_scripts : "";
    const bodyScripts = typeof data.body_scripts === "string" ? data.body_scripts : "";

    const robots = "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

    const ogImageRaw = routeImage || data.og_image || `${baseUrl}/favicon.png`;
    const ogImage = toAbsoluteUrl(String(ogImageRaw), baseUrl);
    const ogLogo = extractOgLogo(data, baseUrl);
    const twitterImageRaw = routeImage || data.twitter_image || data.og_image || `${baseUrl}/favicon.png`;
    const twitterImage = toAbsoluteUrl(String(twitterImageRaw), baseUrl);
    const twitterHandle = data.twitter_handle || undefined;

    const schemas = [data.organization_schema, data.website_schema, data.music_group_schema].filter(Boolean);
    const structuredData = schemas.length
      ? {
          "@context": "https://schema.org",
          "@graph": schemas,
        }
      : undefined;

    const seoBlock = buildSeoBlock({
      title,
      description,
      keywords: resolvedKeywords,
      canonical,
      ogUrl: canonical,
      ogType,
      siteName,
      ogImage,
      ogLogo,
      twitterImage,
      twitterHandle,
      structuredData,
      robots,
      extraMeta,
    });

    const cleaned = stripSeo(template);
    const withSeo = cleaned.replace(
      /<head(\s[^>]*)?>/i,
      (m) => `${m}\n${seoBlock}\n${headScripts ? `${headScripts}\n` : ""}`
    );

    const withSeoAndBody = bodyScripts
      ? withSeo.replace(/<body(\s[^>]*)?>/i, (m) => `${m}\n${bodyScripts}\n`)
      : withSeo;

    res.status(200);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=60");
    res.send(withSeoAndBody);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    res.status(200);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=60");
    res.send(`<!doctype html><html><head><title>GroupTherapy</title><meta name="description" content="${escapeHtml(msg)}" /></head><body><div id="root"></div></body></html>`);
  }
}
