const YOUTUBE_VIDEO_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;
const YOUTUBE_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be']);

/**
 * Validates a user-supplied URL is actually a YouTube video link and
 * returns a safe, canonical embed URL for it — or null if it isn't one.
 * Never pass an untrusted string straight into an <iframe src>: it lets
 * whoever controls that field frame arbitrary third-party pages inside the
 * app (phishing overlay, clickjacking) instead of just embedding a video.
 */
export function getSafeYoutubeEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
  if (!YOUTUBE_HOSTS.has(parsed.hostname)) return null;

  let videoId: string | null = null;
  if (parsed.hostname === 'youtu.be') {
    videoId = parsed.pathname.slice(1);
  } else if (parsed.pathname === '/watch') {
    videoId = parsed.searchParams.get('v');
  } else if (parsed.pathname.startsWith('/embed/')) {
    videoId = parsed.pathname.slice('/embed/'.length);
  }

  if (!videoId || !YOUTUBE_VIDEO_ID_PATTERN.test(videoId)) return null;

  return `https://www.youtube.com/embed/${videoId}`;
}
