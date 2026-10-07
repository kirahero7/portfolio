import { MediaType } from '../types';

/**
 * Detect media type from URL
 */
export function detectMediaType(url: string): MediaType {
  const cleanUrl = (url || '').trim().toLowerCase();

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
  if (cleanUrl.endsWith('.gif') || cleanUrl.includes('.gif?')) {
    return 'gif';
  }

  // Direct video file
  if (
    cleanUrl.endsWith('.mp4') ||
    cleanUrl.endsWith('.webm') ||
    cleanUrl.endsWith('.ogg') ||
    cleanUrl.endsWith('.mov') ||
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
  const trimmed = url.trim();
  if (trimmed.includes('youtu.be/')) {
    return trimmed.split('youtu.be/')[1]?.split(/[?#]/)[0] || '';
  }
  if (trimmed.includes('youtube.com/watch')) {
    try {
      const parsed = new URL(trimmed);
      return parsed.searchParams.get('v') || '';
    } catch {
      const match = trimmed.match(/[?&]v=([^&#]+)/);
      return match ? match[1] : '';
    }
  }
  if (trimmed.includes('youtube.com/shorts/')) {
    return trimmed.split('youtube.com/shorts/')[1]?.split(/[?#]/)[0] || '';
  }
  if (trimmed.includes('youtube.com/embed/')) {
    return trimmed.split('youtube.com/embed/')[1]?.split(/[?#]/)[0] || '';
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

  let videoId = '';

  if (trimmed.includes('youtu.be/')) {
    videoId = trimmed.split('youtu.be/')[1]?.split(/[?#]/)[0] || '';
  } else if (trimmed.includes('youtube.com/watch')) {
    try {
      const parsed = new URL(trimmed);
      videoId = parsed.searchParams.get('v') || '';
    } catch {
      const match = trimmed.match(/[?&]v=([^&#]+)/);
      videoId = match ? match[1] : '';
    }
  } else if (trimmed.includes('youtube.com/shorts/')) {
    videoId = trimmed.split('youtube.com/shorts/')[1]?.split(/[?#]/)[0] || '';
  } else if (trimmed.includes('youtube.com/embed/')) {
    videoId = trimmed.split('youtube.com/embed/')[1]?.split(/[?#]/)[0] || '';
  }

  if (!videoId) {
    return trimmed; // fallback
  }

  const params = new URLSearchParams({
    rel: '0',
    modestbranding: '1',
    enablejsapi: '1',
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
