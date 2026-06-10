/**
 * SoundCloud oEmbed proxy
 * Fetches SoundCloud metadata server-side to bypass browser CORS/403 errors
 * Uses cors-anywhere or allorigins as fallback
 * 
 * Usage: GET /api/soundcloud-oembed?url=<encoded-soundcloud-url>
 * Returns: { title, author_name, thumbnail_url, ... } or { error: "..." }
 */

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const url = req.query.url;

  if (!url) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  try {
    // Validate it's a SoundCloud URL
    if (!url.includes('soundcloud.com')) {
      return res.status(400).json({ error: 'URL must be a SoundCloud link' });
    }

    // Try the official SoundCloud oEmbed endpoint first
    const oembedUrl = `https://soundcloud.com/oembed?url=${encodeURIComponent(url)}&format=json`;

    let response = await fetch(oembedUrl, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (compatible; GroupTherapy/1.0)'
      },
    });

    // If blocked, try with allorigins CORS proxy
    if (!response.ok && response.status === 403) {
      const corsProxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(oembedUrl)}`;
      response = await fetch(corsProxyUrl, {
        headers: { 
          'User-Agent': 'Mozilla/5.0 (compatible; GroupTherapy/1.0)'
        },
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ 
        error: `SoundCloud API error: ${response.status}`,
        details: errorText 
      });
    }

    const data = await response.json();
    
    // Return the oEmbed data
    return res.status(200).json(data);

  } catch (err) {
    console.error('SoundCloud proxy error:', err);
    return res.status(500).json({ 
      error: 'Proxy fetch failed',
      details: err instanceof Error ? err.message : 'Unknown error'
    });
  }
}
