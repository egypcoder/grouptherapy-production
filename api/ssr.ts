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
  ogImage: string;
  twitterImage: string;
  twitterHandle?: string;
  structuredData?: object;
}): string {
  const {
    title,
    description,
    keywords,
    canonical,
    ogUrl,
    ogImage,
    twitterImage,
    twitterHandle,
    structuredData,
  } = args;

  const sd = structuredData ? safeJsonForScriptTag(structuredData) : "";

  return `<title>${escapeHtml(title)}</title>
<meta name="title" content="${escapeHtml(title)}" />
<meta name="description" content="${escapeHtml(description)}" />
<meta name="keywords" content="${escapeHtml(keywords)}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="GroupTherapy Records" />
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(description)}" />
<meta property="og:image" content="${escapeHtml(ogImage)}" />
<meta property="og:url" content="${escapeHtml(ogUrl)}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(title)}" />
<meta name="twitter:description" content="${escapeHtml(description)}" />
<meta name="twitter:image" content="${escapeHtml(twitterImage)}" />
${twitterHandle ? `<meta name="twitter:site" content="${escapeHtml(twitterHandle)}" />` : ""}
<link rel="canonical" href="${escapeHtml(canonical)}" />
${structuredData ? `<script id="structured-data" type="application/ld+json">${sd}</script>` : ""}`;
}

export default async function handler(req: Req, res: Res) {
  try {
    const host =
      firstHeader(req.headers["x-forwarded-host"]) ||
      firstHeader(req.headers["host"]) ||
      "localhost";
    const proto = firstHeader(req.headers["x-forwarded-proto"]) || "https";

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
      res.status(200);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=0, s-maxage=60");
      res.send(template);
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
      res.status(200);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=0, s-maxage=60");
      res.send(template);
      return;
    }

    const title = data.default_title || "GroupTherapy Records - Electronic Music Label";
    const description =
      data.default_description ||
      "The sound of tomorrow, today. Discover cutting-edge electronic music from the world's most innovative artists. Releases, events, radio, and more.";
    const keywords = Array.isArray(data.default_keywords)
      ? data.default_keywords.join(", ")
      : "electronic music, record label, house music, techno";

    const ogImage = data.og_image || `${baseUrl}/favicon.png`;
    const twitterImage = data.twitter_image || data.og_image || `${baseUrl}/favicon.png`;
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
      keywords,
      canonical,
      ogUrl: canonical,
      ogImage,
      twitterImage,
      twitterHandle,
      structuredData,
    });

    const cleaned = stripSeo(template);
    const withSeo = cleaned.replace(/<head(\s[^>]*)?>/i, (m) => `${m}\n${seoBlock}\n`);

    res.status(200);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=60");
    res.send(withSeo);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    res.status(200);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=60");
    res.send(`<!doctype html><html><head><title>GroupTherapy</title><meta name="description" content="${escapeHtml(msg)}" /></head><body><div id="root"></div></body></html>`);
  }
}
