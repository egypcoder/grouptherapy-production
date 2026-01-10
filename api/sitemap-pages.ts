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

function urlset(urls: { loc: string; lastmod?: string; changefreq?: string; priority?: number }[]): string {
  const items = urls
    .map((u) => {
      const lastmod = u.lastmod ? `<lastmod>${xmlEscape(u.lastmod)}</lastmod>` : "";
      const changefreq = u.changefreq ? `<changefreq>${xmlEscape(u.changefreq)}</changefreq>` : "";
      const priority = typeof u.priority === "number" ? `<priority>${u.priority.toFixed(1)}</priority>` : "";
      return `<url><loc>${xmlEscape(u.loc)}</loc>${lastmod}${changefreq}${priority}</url>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${items}</urlset>`;
}

export default async function handler(req: Req, res: Res) {
  const host = firstHeader(req.headers["x-forwarded-host"]) || firstHeader(req.headers["host"]) || "grouptherapyeg.com";
  const proto =
    firstHeader(req.headers["x-forwarded-proto"]) ||
    (host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https");
  const baseUrl = `${proto}://${host}`;

  const now = new Date().toISOString();

  const urls: { loc: string; lastmod?: string; changefreq?: string; priority?: number }[] = [
    { loc: `${baseUrl}/`, changefreq: "daily", priority: 1.0, lastmod: now },
    { loc: `${baseUrl}/radio`, changefreq: "weekly", priority: 0.7, lastmod: now },
    { loc: `${baseUrl}/releases`, changefreq: "daily", priority: 0.9, lastmod: now },
    { loc: `${baseUrl}/events`, changefreq: "daily", priority: 0.9, lastmod: now },
    { loc: `${baseUrl}/artists`, changefreq: "weekly", priority: 0.8, lastmod: now },
    { loc: `${baseUrl}/videos`, changefreq: "weekly", priority: 0.8, lastmod: now },
    { loc: `${baseUrl}/playlists`, changefreq: "weekly", priority: 0.6, lastmod: now },
    { loc: `${baseUrl}/awards`, changefreq: "weekly", priority: 0.6, lastmod: now },
    { loc: `${baseUrl}/about`, changefreq: "yearly", priority: 0.5, lastmod: now },
    { loc: `${baseUrl}/contact`, changefreq: "yearly", priority: 0.5, lastmod: now },
    { loc: `${baseUrl}/promote-your-release`, changefreq: "yearly", priority: 0.5, lastmod: now },
    { loc: `${baseUrl}/promote-your-event`, changefreq: "yearly", priority: 0.5, lastmod: now },
    { loc: `${baseUrl}/news`, changefreq: "daily", priority: 0.8, lastmod: now },
    { loc: `${baseUrl}/press`, changefreq: "yearly", priority: 0.4, lastmod: now },
    { loc: `${baseUrl}/careers`, changefreq: "weekly", priority: 0.5, lastmod: now },
    { loc: `${baseUrl}/tours`, changefreq: "weekly", priority: 0.5, lastmod: now },
    { loc: `${baseUrl}/terms`, changefreq: "yearly", priority: 0.2, lastmod: now },
    { loc: `${baseUrl}/privacy`, changefreq: "yearly", priority: 0.2, lastmod: now },
    { loc: `${baseUrl}/cookies`, changefreq: "yearly", priority: 0.2, lastmod: now },
  ];

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data } = await supabase
      .from("static_pages")
      .select("slug, updated_at, created_at")
      .eq("published", true)
      .order("updated_at", { ascending: false });

    if (Array.isArray(data)) {
      data.forEach((p: any) => {
        const slug = typeof p.slug === "string" ? p.slug : "";
        if (!slug) return;
        if (["terms", "privacy", "cookies"].includes(slug)) return;
        const lastmodRaw = p.updated_at || p.created_at;
        const lastmod = lastmodRaw ? new Date(lastmodRaw).toISOString() : undefined;
        urls.push({ loc: `${baseUrl}/${slug}`, changefreq: "yearly", priority: 0.3, lastmod });
      });
    }
  }

  const xml = urlset(urls);

  if (process.env.NODE_ENV !== "production") res.setHeader("X-Sitemap-Count", String(urls.length));

  res.status(200);
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=3600");
  res.send(xml);
}
