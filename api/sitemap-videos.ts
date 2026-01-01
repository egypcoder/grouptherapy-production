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

function urlsetWithImagesAndVideos(
  urls: {
    loc: string;
    lastmod?: string;
    images?: { loc: string; title?: string }[];
    videos?: {
      thumbnailLoc?: string;
      title: string;
      description?: string;
      contentLoc?: string;
      playerLoc?: string;
    }[];
  }[]
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

      const videos = (u.videos || [])
        .map((v) => {
          const thumb = v.thumbnailLoc ? `<video:thumbnail_loc>${xmlEscape(v.thumbnailLoc)}</video:thumbnail_loc>` : "";
          const desc = v.description ? `<video:description>${xmlEscape(v.description)}</video:description>` : "";
          const contentLoc = v.contentLoc ? `<video:content_loc>${xmlEscape(v.contentLoc)}</video:content_loc>` : "";
          const playerLoc = v.playerLoc ? `<video:player_loc>${xmlEscape(v.playerLoc)}</video:player_loc>` : "";
          return `<video:video>${thumb}<video:title>${xmlEscape(v.title)}</video:title>${desc}${contentLoc}${playerLoc}</video:video>`;
        })
        .join("");

      return `<url><loc>${xmlEscape(u.loc)}</loc>${lastmod}${images}${videos}</url>`;
    })
    .join("");

  return (
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">${items}</urlset>`
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
    res.send(urlsetWithImagesAndVideos([]));
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabase
    .from("videos")
    .select("slug, created_at, updated_at, title, description, thumbnail_url, video_url, youtube_id")
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (error || !data) {
    res.status(200);
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=3600");
    res.send(urlsetWithImagesAndVideos([]));
    return;
  }

  const mostRecent = data
    .map((v: any) => v.updated_at || v.created_at)
    .filter(Boolean)
    .map((d: any) => new Date(d).getTime())
    .reduce((acc: number, ts: number) => (ts > acc ? ts : acc), 0);

  const videos = data.map((v: any) => {
    const playerLoc = v.youtube_id ? `https://www.youtube.com/watch?v=${v.youtube_id}` : undefined;
    const contentLoc = v.video_url || undefined;
    return {
      thumbnailLoc: v.thumbnail_url || undefined,
      title: v.title || "Video",
      description: v.description || undefined,
      contentLoc,
      playerLoc,
    };
  });

  const images = data.reduce((acc: { loc: string; title?: string }[], v: any) => {
    if (!v?.thumbnail_url) return acc;
    acc.push({
      loc: String(v.thumbnail_url),
      title: v.title ? String(v.title) : undefined,
    });
    return acc;
  }, []);

  const urls = [
    {
      loc: `${baseUrl}/videos`,
      lastmod: mostRecent ? new Date(mostRecent).toISOString() : undefined,
      images,
      videos,
    },
  ];

  res.status(200);
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=3600");
  res.send(urlsetWithImagesAndVideos(urls));
}
