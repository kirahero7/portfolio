import { MediaType } from '../types';

/**
 * Detect media type from URL
 */
export function detectMediaType(url: string): MediaType {
  const cleanUrl = (url || '').trim().toLowerCase();
  const mediaPath = cleanUrl.split(/[?#]/, 1)[0];

  if (!cleanUrl) return 'image';

  // YouTube detection
  if (
    cleanUrl.includes('youtube.com') ||
    cleanUrl.includes('youtu.be') ||
    cleanUrl.includes('youtube-nocookie.com')
  ) {
    return 'youtube';
  }

  // Vimeo detection
  if (cleanUrl.includes('vimeo.com')) {
    return 'vimeo';
  }

  // GIF detection
  if (mediaPath.endsWith('.gif')) {
    return 'gif';
  }

  // Direct video file
  if (
    /\.(?:mp4|webm|ogg|mov)$/.test(mediaPath) ||
    cleanUrl.startsWith('data:video/')
  ) {
    return 'video';
  }

  // Default to image (JPG, PNG, WebP, SVG, base64)
  return 'image';
}

/**
 * Extract YouTube video ID
 */
export function getYouTubeId(url: string): string {
  if (!url) return '';
  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');

    if (host === 'youtu.be') {
      return parsed.pathname.split('/').filter(Boolean)[0] || '';
    }

    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      const queryId = parsed.searchParams.get('v');
      if (queryId) return queryId;

      const pathMatch = parsed.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?#]+)/);
      return pathMatch?.[1] || '';
    }
  } catch {
    return '';
  }

  return '';
}

/**
 * Get visual thumbnail for any media item (Image, YouTube, GIF, Video)
 */
export function getMediaThumbnailUrl(item?: { type?: string; url?: string; thumbnail?: string } | null): string {
  if (!item || !item.url) return '';
  if (item.thumbnail) return item.thumbnail;
  const type = item.type || detectMediaType(item.url);
  if (type === 'youtube') {
    const yId = getYouTubeId(item.url);
    if (yId) return `https://img.youtube.com/vi/${yId}/hqdefault.jpg`;
  }
  return item.url;
}

/**
 * Convert any YouTube URL (watch, shorts, embed, shortlink) to an embed URL
 */
export function getYouTubeEmbedUrl(url: string, autoplay = false): string {
  if (!url) return '';
  const trimmed = url.trim();
  const videoId = getYouTubeId(trimmed);

  if (!videoId) {
    return trimmed; // fallback
  }

  const params = new URLSearchParams({
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
  });
  if (autoplay) {
    params.set('autoplay', '1');
    params.set('mute', '1');
  }

  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

/**
 * Convert Vimeo URL to embed URL
 */
export function getVimeoEmbedUrl(url: string, autoplay = false): string {
  if (!url) return '';
  const trimmed = url.trim();

  if (trimmed.includes('player.vimeo.com/video/')) {
    return trimmed;
  }

  // Match vimeo.com/123456789
  const match = trimmed.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)/);
  const videoId = match ? match[3] : '';

  if (!videoId) {
    return trimmed;
  }

  const params = new URLSearchParams({
    color: 'ffffff',
    title: '0',
    byline: '0',
    portrait: '0',
  });
  if (autoplay) {
    params.set('autoplay', '1');
    params.set('muted', '1');
  }

  return `https://player.vimeo.com/video/${videoId}?${params.toString()}`;
}

/**
 * Convert File to Base64 Data URL
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}
