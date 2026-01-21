import { createClient } from "@supabase/supabase-js";

type Req = {
  headers: Record<string, string | string[] | undefined>;
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

function canonicalBaseUrl(reqHost: string, reqProto: string): string {
  const envBase =
    process.env.VITE_SITE_URL ||
    process.env.SITE_URL ||
    process.env.PUBLIC_SITE_URL;
  const raw = (envBase && envBase.trim().length ? envBase.trim() : `${reqProto}://${reqHost}`).replace(/\/$/, "");
  try {
    const u = new URL(raw);
    const host = u.host.toLowerCase();
    if (host === "grouptherapyeg.com") u.host = "www.grouptherapyeg.com";
    if (u.protocol === "http:" && !u.hostname.includes("localhost") && !u.hostname.includes("127.0.0.1")) {
      u.protocol = "https:";
    }
    return u.toString().replace(/\/$/, "");
  } catch {
    return raw;
  }
}

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function urlsetWithImages(
  urls: { loc: string; lastmod?: string; images?: { loc: string; title?: string }[] }[]
): string {
  const items = urls
    .map((u) => {
      const lastmod = u.lastmod ? `<lastmod>${xmlEscape(u.lastmod)}</lastmod>` : "";
      const images = (u.images || [])
        .filter((img) => img.loc)
        .map((img) => {
          const title = img.title ? `<image:title>${xmlEscape(img.title)}</image:title>` : "";
          return `<image:image><image:loc>${xmlEscape(img.loc)}</image:loc>${title}</image:image>`;
        })
        .join("");

      return `<url><loc>${xmlEscape(u.loc)}</loc>${lastmod}${images}</url>`;
    })
    .join("");

  return (
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${items}</urlset>`
  );
}

export default async function handler(req: Req, res: Res) {
  const host = firstHeader(req.headers["x-forwarded-host"]) || firstHeader(req.headers["host"]) || "grouptherapyeg.com";
  const proto = firstHeader(req.headers["x-forwarded-proto"]) || (host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https");
  const baseUrl = canonicalBaseUrl(host, proto);

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    if (process.env.NODE_ENV !== "production") res.setHeader("X-Sitemap-Reason", "missing_supabase_env");
    if (process.env.NODE_ENV !== "production") res.setHeader("X-Sitemap-Count", "0");
    res.status(200);
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=3600");
    res.send(urlsetWithImages([]));
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabase
    .from("events")
    .select("slug, created_at, image_url, title, date")
    .eq("published", true)
    .order("date", { ascending: false });

  if (error || !data) {
    if (process.env.NODE_ENV !== "production") res.setHeader("X-Sitemap-Reason", error?.message ? `supabase_error:${String(error.message).slice(0, 120)}` : "no_data");
    if (process.env.NODE_ENV !== "production") res.setHeader("X-Sitemap-Count", "0");
    res.status(200);
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=3600");
    res.send(urlsetWithImages([]));
    return;
  }

  const urls = data.map((e: any) => {
    const lastmod = e.date || e.created_at;
    return {
      loc: `${baseUrl}/events/${e.slug}`,
      lastmod: lastmod ? new Date(lastmod).toISOString() : undefined,
      images: e.image_url ? [{ loc: e.image_url, title: e.title || undefined }] : [],
    };
  });

  if (process.env.NODE_ENV !== "production") res.setHeader("X-Sitemap-Count", String(urls.length));

  res.status(200);
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=3600");
  res.send(urlsetWithImages(urls));
}
