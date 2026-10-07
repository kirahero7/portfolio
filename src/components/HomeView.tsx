import React from 'react';
import { CategoryKey, HomeVideoItem, Project, SiteConfig } from '../types';
import { getYouTubeEmbedUrl, getVimeoEmbedUrl, detectMediaType } from '../utils/mediaUtils';
import { Play, Layers, Cpu, Radio, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface HomeViewProps {
  config: SiteConfig;
  projects: Project[];
  onSelectCategory: (cat: CategoryKey) => void;
  onOpenProject: (project: Project) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  config,
  projects,
  onSelectCategory,
}) => {
  // Normalize home videos list: only include items with a valid non-empty URL
  const rawVideos: HomeVideoItem[] = (config.homeVideos && config.homeVideos.length > 0)
    ? config.homeVideos
    : (config.showreelUrl && config.showreelUrl.trim().length > 0)
      ? [
          {
            id: 'default-video',
            title: config.showreelTitle || '2026 SHOWREEL',
            url: config.showreelUrl.trim(),
            description: config.showreelDescription || '',
          },
        ]
      : [];

  // Filter out any entries that don't have a valid URL (有連結就有影片，沒有連結時完全不留空方塊)
  const homeVideos = rawVideos.filter((video) => video.url && video.url.trim().length > 0);

  const renderSingleVideoEmbed = (url: string, title?: string) => {
    if (!url || !url.trim()) return null;
    const mediaType = detectMediaType(url);

    if (mediaType === 'youtube') {
      const embedUrl = getYouTubeEmbedUrl(url, true);
      return (
        <iframe
          src={embedUrl}
          title={title || 'Showreel YouTube'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="w-full h-full border-0 absolute inset-0"
        />
      );
    }

    if (mediaType === 'vimeo') {
      const embedUrl = getVimeoEmbedUrl(url, true);
      return (
        <iframe
          src={embedUrl}
          title={title || 'Showreel Vimeo'}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="w-full h-full border-0 absolute inset-0"
        />
      );
    }

    if (mediaType === 'video') {
      return (
        <video
          src={url}
          controls
          autoPlay
          muted
          loop
          className="w-full h-full object-cover absolute inset-0"
        />
      );
    }

    // Default image preview if image link provided
    return (
      <div className="relative w-full h-full bg-[#1b2633] flex items-center justify-center group overflow-hidden">
        <img
          src={url}
          alt={title || 'Showreel Preview'}
          className="w-full h-full object-cover opacity-80 group-hover:opacity-90 transition-opacity duration-300"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
          <div className="w-20 h-20 rounded-full border-2 border-white/80 flex items-center justify-center text-white bg-black/30 backdrop-blur-sm group-hover:scale-105 group-hover:bg-white group-hover:text-black transition-all">
            <Play className="w-8 h-8 fill-current ml-1" />
          </div>
        </div>
      </div>
    );
  };

  const homeMainTitle = config.categories?.home?.title || config.showreelTitle || '2026 SHOWREEL';
  const homeSubTitle = config.categories?.home?.enName || config.showreelSubtitle || 'Interactive Media & Motion Design Highlight';
  const personalBio = config.personalBio !== undefined ? config.personalBio : config.categories?.home?.description;

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
      className="w-full max-w-6xl mx-auto px-4 sm:px-8 pb-16"
    >
      {/* 進入後主標題 (中文/主標) & 進入後副標題 (英文/副標) & 個人簡介 */}
      <div className="mb-8">
        <h2 className="text-xl sm:text-2xl font-bold tracking-wider text-white uppercase">
          {homeMainTitle}
        </h2>
        {homeSubTitle && (
          <p className="text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase mt-0.5 font-mono">
            {homeSubTitle}
          </p>
        )}
        {personalBio && (
          <div className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed max-w-3xl">
            <p className="whitespace-pre-line">{personalBio}</p>
          </div>
        )}
      </div>

      {/* 單一直排往下新增的多組內嵌影音 (有填寫影片網址時才顯示，無網址時完全隱藏不留空方塊) */}
      {homeVideos.length > 0 && (
        <div className="space-y-12">
          {homeVideos.map((video, index) => (
            <div key={video.id || index} className="w-full space-y-4">
              {/* Showreel 主標題 (若有多部影片且有填寫獨立標題時顯示) */}
              {video.title && (
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold tracking-[0.15em] text-slate-200 uppercase">
                    {video.title}
                  </h3>
                </div>
              )}

              {/* 16:9 內嵌影片視窗 */}
              <div className="w-full relative aspect-video bg-[#1a2533] overflow-hidden border border-slate-700/60 shadow-2xl">
                {renderSingleVideoEmbed(video.url, video.title)}
              </div>

              {/* 影片簡介文字 */}
              {video.description && (
                <div className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-3xl pt-1">
                  <p className="whitespace-pre-line">{video.description}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Quick Category Jump Section */}
      <div className="mt-16 pt-8 border-t border-slate-800/80">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xs font-semibold tracking-[0.25em] text-slate-400 uppercase">
            作品分類導覽 (CATEGORIES)
          </h3>
          <span className="text-xs text-slate-500">共 {projects.length} 件專案</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => onSelectCategory('motion')}
            className="group p-5 bg-[#182330] hover:bg-[#1f2e40] border border-slate-700/60 hover:border-slate-400 text-left transition-all flex flex-col justify-between h-40"
          >
            <div>
              <div className="flex items-center justify-between text-slate-400 group-hover:text-white mb-2">
                <Layers className="w-5 h-5" />
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
              <h4 className="text-lg font-bold text-white tracking-wider">
                {config.categories?.motion?.name || '動態影像/錄像'}
              </h4>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                {config.categories?.motion?.enName || 'MOTION GRAPHICS & VIDEO'}
              </p>
            </div>
            <div className="text-xs text-slate-500 font-mono">
              {projects.filter((p) => p.category === 'motion').length} 件專案
            </div>
          </button>

          <button
            onClick={() => onSelectCategory('device')}
            className="group p-5 bg-[#182330] hover:bg-[#1f2e40] border border-slate-700/60 hover:border-slate-400 text-left transition-all flex flex-col justify-between h-40"
          >
            <div>
              <div className="flex items-center justify-between text-slate-400 group-hover:text-white mb-2">
                <Cpu className="w-5 h-5" />
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
              <h4 className="text-lg font-bold text-white tracking-wider">
                {config.categories?.device?.name || '互動裝置/介面'}
              </h4>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                {config.categories?.device?.enName || 'INTERACTIVE INSTALLATIONS & INTERFACES'}
              </p>
            </div>
            <div className="text-xs text-slate-500 font-mono">
              {projects.filter((p) => p.category === 'device').length} 件專案
            </div>
          </button>

          <button
            onClick={() => onSelectCategory('wall')}
            className="group p-5 bg-[#182330] hover:bg-[#1f2e40] border border-slate-700/60 hover:border-slate-400 text-left transition-all flex flex-col justify-between h-40"
          >
            <div>
              <div className="flex items-center justify-between text-slate-400 group-hover:text-white mb-2">
                <Radio className="w-5 h-5" />
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
              <h4 className="text-lg font-bold text-white tracking-wider">
                {config.categories?.wall?.name || '互動螢幕/投影'}
              </h4>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                {config.categories?.wall?.enName || 'INTERACTIVE SCREENS & PROJECTIONS'}
              </p>
            </div>
            <div className="text-xs text-slate-500 font-mono">
              {projects.filter((p) => p.category === 'wall').length} 件專案
            </div>
          </button>
        </div>
      </div>
    </motion.section>
  );
};

