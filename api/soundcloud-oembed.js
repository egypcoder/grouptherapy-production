/**
 * SoundCloud oEmbed proxy
 * Fetches SoundCloud metadata server-side to bypass browser CORS/403 errors
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

    // Call SoundCloud oEmbed API server-side
    const oembedUrl = `https://soundcloud.com/oembed?url=${encodeURIComponent(url)}&format=json`;

    const response = await fetch(oembedUrl, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (compatible; GroupTherapy/1.0)' 
      },
    });

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
