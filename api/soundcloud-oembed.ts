import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const url = req.query.url as string;

  if (!url) {
    return res.status(400).json({ error: 'Missing url param' });
  }

  try {
    const oembedUrl = `https://soundcloud.com/oembed?url=${encodeURIComponent(url)}&format=json`;

    const response = await fetch(oembedUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; myapp/1.0)' },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'SoundCloud request failed' });
    }

    const data = await response.json();
    return res.json(data);

  } catch {
    return res.status(500).json({ error: 'Proxy fetch failed' });
  }
}