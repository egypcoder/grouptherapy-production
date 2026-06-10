/**
 * Fetch SoundCloud metadata via backend proxy
 * Uses /api/soundcloud-oembed?url=... to bypass browser CORS/403 errors
 */
async function fetchSoundCloudMetadata(url: string): Promise<FetchedMetadata | null> {
  try {
    // Use backend proxy
    const proxyUrl = `/api/soundcloud-oembed?url=${encodeURIComponent(url)}`;
    console.log('Fetching from proxy:', proxyUrl);
    
    const response = await fetch(proxyUrl);
    console.log('Proxy response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to fetch SoundCloud metadata: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Proxy response data:', data);

    // Normalize thumbnail URL to get larger image
    let coverUrl = data.thumbnail_url || '';
    if (coverUrl) {
      coverUrl = coverUrl.replace('-large', '-t500x500');
    }

    const metadata: FetchedMetadata = {
      title: data.title || '',
      artistName: data.author_name || '',
      coverUrl,
      sourceUrl: url,
      source: 'soundcloud',
    };

    console.log('Normalized metadata:', metadata);

    return metadata;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('SoundCloud fetch error:', errorMessage);
    return null;
  }
}