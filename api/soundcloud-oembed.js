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

    // Try official SoundCloud oEmbed API first
    let data = null;
    let lastError = null;

    // Attempt 1: Direct SoundCloud oEmbed with browser User-Agent
    try {
      const oembedUrl = `https://soundcloud.com/oembed?url=${encodeURIComponent(url)}&format=json`;
      const response = await fetch(oembedUrl, {
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
      });

      if (response.ok) {
        data = await response.json();
        console.log('✓ SoundCloud oEmbed success:', {
          title: data.title,
          author_name: data.author_name,
          thumbnail_url: data.thumbnail_url?.substring(0, 50) + '...',
        });
      } else {
        lastError = `SoundCloud API returned ${response.status}`;
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'Unknown error';
    }

    // Attempt 2: Try noembed.com if SoundCloud failed
    if (!data || !data.title) {
      try {
        console.log('Attempting noembed.com...');
        const noembed = `https://noembed.com/embed?url=${encodeURIComponent(url)}`;
        const response = await fetch(noembed);

        if (response.ok) {
          const noembed_data = await response.json();
          if (noembed_data.title) {
            data = noembed_data;
            console.log('✓ noembed.com success');
          }
        }
      } catch (err) {
        console.log('noembed.com failed:', err instanceof Error ? err.message : 'Unknown error');
      }
    }

    // If still no data, return error
    if (!data || !data.title) {
      console.error('Failed to fetch SoundCloud metadata. Last error:', lastError);
      return res.status(502).json({ 
        error: 'Could not fetch SoundCloud metadata',
        details: lastError || 'Service returned empty data'
      });
    }

    // Normalize response
    const normalized = {
      title: data.title || '',
      author_name: data.author_name || '',
      thumbnail_url: data.thumbnail_url || '',
      html: data.html || '',
      height: data.height || 0,
      width: data.width || 0,
      url: url,
    };

    console.log('SoundCloud metadata normalized:', {
      title: normalized.title,
      author_name: normalized.author_name,
      thumbnail_url: normalized.thumbnail_url?.substring(0, 50) + '...',
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
