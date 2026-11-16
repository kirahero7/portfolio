import React, { useState } from 'react';
import { ExternalLink, Play } from 'lucide-react';
import { getYouTubeEmbedUrl, getYouTubeId } from '../utils/mediaUtils';

interface YouTubeEmbedProps {
  url: string;
  title: string;
  autoplay?: boolean;
}

export const YouTubeEmbed: React.FC<YouTubeEmbedProps> = ({
  url,
  title,
  autoplay = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoId = getYouTubeId(url);

  if (!videoId) {
    return (
      <iframe
        src={getYouTubeEmbedUrl(url, autoplay)}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
        className="w-full h-full border-0 absolute inset-0"
      />
    );
  }

  if (isPlaying) {
    return (
      <iframe
        src={getYouTubeEmbedUrl(url, autoplay)}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
        className="w-full h-full border-0 absolute inset-0"
      />
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      <img
        src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
        alt={`${title} 影片預覽`}
        className="h-full w-full object-contain"
        onError={(event) => {
          const image = event.currentTarget;
          if (!image.src.endsWith('/0.jpg')) {
            image.src = `https://img.youtube.com/vi/${videoId}/0.jpg`;
          }
        }}
      />
      <button
        type="button"
        onClick={() => setIsPlaying(true)}
        aria-label={`播放影片：${title}`}
        className="absolute inset-0 flex items-center justify-center bg-black/20 text-white transition-colors hover:bg-black/35"
      >
        <span className="flex h-16 w-16 items-center justify-center rounded-full border border-white/80 bg-red-600 shadow-xl transition-transform hover:scale-110">
          <Play className="ml-1 h-7 w-7 fill-current" />
        </span>
      </button>
      <a
        href={`https://www.youtube.com/watch?v=${videoId}`}
        target="_blank"
        rel="noreferrer"
        aria-label="在 YouTube 開啟影片"
        title="在 YouTube 開啟影片"
        className="absolute right-3 top-3 z-10 rounded bg-black/75 p-2 text-white hover:bg-black"
      >
        <ExternalLink className="h-4 w-4" />
      </a>
    </div>
  );
};