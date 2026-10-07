import React from 'react';
import { CategoryKey, Project, SiteConfig } from '../types';
import { Plus, Play, Image as ImageIcon, Sparkles, Video } from 'lucide-react';
import { motion } from 'motion/react';
import { getMediaThumbnailUrl } from '../utils/mediaUtils';

interface ProjectGridProps {
  category: CategoryKey;
  config: SiteConfig;
  projects: Project[];
  isAdminAuthenticated?: boolean;
  onOpenProject: (project: Project) => void;
  onAddNewProject: (category: 'motion' | 'device' | 'wall') => void;
}

export const ProjectGrid: React.FC<ProjectGridProps> = ({
  category,
  config,
  projects,
  isAdminAuthenticated = false,
  onOpenProject,
  onAddNewProject,
}) => {
  const validCategory = (category === 'motion' || category === 'device' || category === 'wall')
    ? category
    : 'motion';

  const defaultTitles: Record<string, { name: string; enName: string }> = {
    motion: { name: '動態影像/錄像', enName: 'MOTION GRAPHICS & VIDEO' },
    device: { name: '互動裝置/介面', enName: 'INTERACTIVE INSTALLATIONS & INTERFACES' },
    wall: { name: '互動螢幕/投影', enName: 'INTERACTIVE SCREENS & PROJECTIONS' },
  };

  const catConfig = config.categories?.[validCategory];
  const title = catConfig?.name || defaultTitles[validCategory]?.name || '作品列表';
  const enName = catConfig?.enName || defaultTitles[validCategory]?.enName || 'PROJECTS';

  return (
    <motion.div
      key={category}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="w-full max-w-6xl mx-auto px-4 sm:px-8 pb-16"
    >
      {/* Category sub-header: Chinese first, English below as requested */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-wider text-white">
            {title}
          </h2>
          {enName && (
            <p className="text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase mt-0.5 font-mono">
              {enName}
            </p>
          )}
        </div>

        {isAdminAuthenticated && (
          <button
            onClick={() => onAddNewProject(validCategory)}
            className="text-xs text-slate-300 hover:text-white bg-[#1b2633] hover:bg-[#253446] border border-slate-600/80 px-3 py-1.5 rounded transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>新增專案</span>
          </button>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="w-full py-20 border border-dashed border-slate-700 text-center flex flex-col items-center justify-center bg-[#182330]/50">
          <ImageIcon className="w-12 h-12 text-slate-500 mb-3" />
          <p className="text-lg text-slate-300">此分類目前尚無作品</p>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            {isAdminAuthenticated
              ? '點擊下方按鈕即可快速上傳圖片、GIF 或嵌入 YouTube/Vimeo'
              : '作品展示籌備中，敬請期待'}
          </p>
          {isAdminAuthenticated && (
            <button
              onClick={() => onAddNewProject(validCategory)}
              className="px-4 py-2 bg-white text-black font-semibold text-sm hover:bg-slate-200 transition-colors"
            >
              + 立即新增專案
            </button>
          )}
        </div>
      ) : (
        /* 2-Column Grid as shown exactly in Comp 1_000001, 000002, 000003 */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
          {projects.map((project, index) => {
            const hasVideo =
              project.coverMedia?.type === 'video' ||
              project.coverMedia?.type === 'youtube' ||
              project.coverMedia?.type === 'vimeo' ||
              project.mediaList?.some(
                (m) => m.type === 'youtube' || m.type === 'vimeo' || m.type === 'video'
              );

            const hasGif =
              project.coverMedia?.type === 'gif' ||
              project.mediaList?.some((m) => m.type === 'gif');

            return (
              <div
                key={project.id || index}
                onClick={() => onOpenProject(project)}
                className="group cursor-pointer flex flex-col"
              >
                {/* 16:9 Thumbnail Box matching mockup's clean rectangular card */}
                <div className="relative w-full aspect-video bg-[#1e2938] border border-slate-700/60 overflow-hidden group-hover:border-slate-400 transition-colors duration-200">
                  {project.coverMedia?.url ? (
                    <img
                      src={getMediaThumbnailUrl(project.coverMedia)}
                      alt={project.title}
                      className="w-full h-full object-cover block"
                      onError={(e) => {
                        // Fallback placeholder
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=800&auto=format&fit=crop';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-[#202b3a] flex items-center justify-center text-slate-500">
                      <ImageIcon className="w-12 h-12" />
                    </div>
                  )}

                  {/* Badges for Video / GIF / Multi-media count */}
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 pointer-events-none">
                    {hasVideo && (
                      <span className="bg-black/75 backdrop-blur-sm text-[11px] font-mono tracking-wider text-slate-200 px-2 py-0.5 border border-white/20 flex items-center gap-1">
                        <Play className="w-2.5 h-2.5 fill-current" /> VIDEO
                      </span>
                    )}
                    {hasGif && (
                      <span className="bg-black/75 backdrop-blur-sm text-[11px] font-mono tracking-wider text-slate-200 px-2 py-0.5 border border-white/20">
                        GIF
                      </span>
                    )}
                    {project.mediaList && project.mediaList.length > 1 && (
                      <span className="bg-black/75 backdrop-blur-sm text-[11px] font-mono text-slate-300 px-1.5 py-0.5 border border-white/20">
                        {project.mediaList.length} 檔案
                      </span>
                    )}
                  </div>
                </div>

                {/* Title & info directly below the card, matching mockup's 專案_001 */}
                <div className="mt-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-base sm:text-lg font-medium tracking-wide text-white group-hover:text-slate-100 transition-colors">
                      {project.code || `專案_${String(index + 1).padStart(3, '0')}`}
                    </h3>
                    {project.year && (
                      <span className="text-xs font-mono text-slate-400">
                        {project.year}
                      </span>
                    )}
                  </div>

                  {project.title && (
                    <p className="text-xs sm:text-sm text-slate-300 font-normal mt-0.5 line-clamp-1">
                      {project.title}
                    </p>
                  )}

                  {project.description && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {project.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};
