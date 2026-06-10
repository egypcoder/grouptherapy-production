/**
 * SoundCloud oEmbed proxy
 * Fetches SoundCloud metadata server-side and normalizes the response
 * 
 * Usage: GET /api/soundcloud-oembed?url=<encoded-soundcloud-url>
 * Returns: { title, author_name, thumbnail_url, ... }
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

    // Use noembed as primary source
    const noembed = `https://noembed.com/embed?url=${encodeURIComponent(url)}`;

    const response = await fetch(noembed, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (compatible; GroupTherapy/1.0)',
        'Accept': 'application/json'
      },
    });

    if (!response.ok) {
      console.error('noembed request failed:', response.status);
      return res.status(response.status).json({ 
        error: `Failed to fetch metadata: ${response.status}`,
      });
    }

    let data = await response.json();
    
    // Normalize noembed response to match SoundCloud oEmbed format
    // noembed returns: { title, author_name, thumbnail_url }
    // We need: { title, author_name, thumbnail_url }
    // They should match, but let's ensure proper mapping
    
    const normalized = {
      title: data.title || '',
      author_name: data.author_name || data.author || '',
      thumbnail_url: data.thumbnail_url || '',
      // Include other useful fields
      html: data.html || '',
      height: data.height || 0,
      width: data.width || 0,
      url: url,
    };

    console.log('SoundCloud metadata fetched:', {
      title: normalized.title,
      author_name: normalized.author_name,
      thumbnail_url: normalized.thumbnail_url,
    });

    return res.status(200).json(normalized);

  } catch (err) {
    console.error('SoundCloud proxy error:', err);
    return res.status(500).json({ 
      error: 'Proxy fetch failed',
      details: err instanceof Error ? err.message : 'Unknown error'
    });
  }
}
