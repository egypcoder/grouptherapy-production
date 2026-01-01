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
  const host = firstHeader(req.headers["x-forwarded-host"]) || firstHeader(req.headers["host"]) || "grouptherapy.com";
  const proto = firstHeader(req.headers["x-forwarded-proto"]) || "https";
  const baseUrl = `${proto}://${host}`;

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    res.status(200);
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=3600");
    res.send(urlsetWithImages([]));
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabase
    .from("artists")
    .select("slug, created_at, image_url, name")
    .order("created_at", { ascending: false });

  if (error || !data) {
    res.status(200);
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=3600");
    res.send(urlsetWithImages([]));
    return;
  }

  const urls = data.map((a: any) => {
    const lastmod = a.created_at;
    return {
      loc: `${baseUrl}/artists/${a.slug}`,
      lastmod: lastmod ? new Date(lastmod).toISOString() : undefined,
      images: a.image_url ? [{ loc: a.image_url, title: a.name || undefined }] : [],
    };
  });

  res.status(200);
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=3600");
  res.send(urlsetWithImages(urls));
}
