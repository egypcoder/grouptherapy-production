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

function sitemapIndex(urls: { loc: string; lastmod?: string }[]): string {
  const items = urls
    .map((u) => {
      const lastmod = u.lastmod ? `<lastmod>${xmlEscape(u.lastmod)}</lastmod>` : "";
      return `<sitemap><loc>${xmlEscape(u.loc)}</loc>${lastmod}</sitemap>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>` +
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${items}</sitemapindex>`;
}

export default async function handler(req: Req, res: Res) {
  const host = firstHeader(req.headers["x-forwarded-host"]) || firstHeader(req.headers["host"]) || "grouptherapyeg.com";
  const proto =
    firstHeader(req.headers["x-forwarded-proto"]) ||
    (host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https");
  const baseUrl = `${proto}://${host}`;

  const now = new Date().toISOString();

  const xml = sitemapIndex([
    { loc: `${baseUrl}/sitemap-pages.xml`, lastmod: now },
    { loc: `${baseUrl}/sitemap-posts.xml`, lastmod: now },
    { loc: `${baseUrl}/sitemap-releases.xml`, lastmod: now },
    { loc: `${baseUrl}/sitemap-events.xml`, lastmod: now },
    { loc: `${baseUrl}/sitemap-artists.xml`, lastmod: now },
    { loc: `${baseUrl}/sitemap-videos.xml`, lastmod: now },
  ]);

  if (process.env.NODE_ENV !== "production") res.setHeader("X-Sitemap-Count", "6");

  res.status(200);
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=3600");
  res.send(xml);
}
