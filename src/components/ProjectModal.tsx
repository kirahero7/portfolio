import React, { useEffect, useRef } from 'react';
import { MediaItem, Project, SiteConfig } from '../types';
import { getYouTubeEmbedUrl, getVimeoEmbedUrl } from '../utils/mediaUtils';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Calendar,
  User,
  Wrench,
  Sparkles,
  Edit,
  ExternalLink,
  Film,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProjectModalProps {
  project: Project | null;
  config?: SiteConfig;
  allCategoryProjects: Project[];
  isAdminAuthenticated?: boolean;
  onClose: () => void;
  onNavigate: (nextProject: Project) => void;
  onEditProject: (project: Project) => void;
  onOpenLightbox: (media: MediaItem) => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  project,
  config,
  allCategoryProjects,
  isAdminAuthenticated = false,
  onClose,
  onNavigate,
  onEditProject,
  onOpenLightbox,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const modalOuterRef = useRef<HTMLDivElement>(null);

  // Scroll to top immediately whenever the active project changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
    if (modalOuterRef.current) {
      modalOuterRef.current.scrollTop = 0;
    }
  }, [project?.id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && project && allCategoryProjects.length > 0) {
        const currIndex = allCategoryProjects.findIndex((p) => p.id === project.id);
        const prevIndex = (currIndex - 1 + allCategoryProjects.length) % allCategoryProjects.length;
        onNavigate(allCategoryProjects[prevIndex]);
      }
      if (e.key === 'ArrowRight' && project && allCategoryProjects.length > 0) {
        const currIndex = allCategoryProjects.findIndex((p) => p.id === project.id);
        const nextIndex = (currIndex + 1) % allCategoryProjects.length;
        onNavigate(allCategoryProjects[nextIndex]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [project, allCategoryProjects, onClose, onNavigate]);

  if (!project) return null;

  const currentIndex = allCategoryProjects.findIndex((p) => p.id === project.id);
  const totalCount = allCategoryProjects.length;

  // Infinite loop navigation
  const prevIndex = (currentIndex - 1 + totalCount) % totalCount;
  const nextIndex = (currentIndex + 1) % totalCount;
  const prevProject = totalCount > 1 ? allCategoryProjects[prevIndex] : null;
  const nextProject = totalCount > 1 ? allCategoryProjects[nextIndex] : null;

  // Combine cover media and media list, avoiding duplicates
  const allMedia: MediaItem[] = [];
  if (project.coverMedia?.url) {
    allMedia.push(project.coverMedia);
  }
  if (project.mediaList && project.mediaList.length > 0) {
    project.mediaList.forEach((m) => {
      if (m.url && !allMedia.some((existing) => existing.url === m.url)) {
        allMedia.push(m);
      }
    });
  }

  const renderMediaItem = (item: MediaItem, index: number) => {
    if (item.type === 'youtube') {
      const embedUrl = getYouTubeEmbedUrl(item.url);
      return (
        <div key={item.id || index} className="w-full mb-8">
          <div className="relative aspect-video w-full bg-black border border-slate-700/80 overflow-hidden shadow-lg">
            <iframe
              src={embedUrl}
              title={item.caption || `YouTube Video ${index + 1}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0 absolute inset-0"
            />
          </div>
          {item.caption && (
            <p className="text-xs font-mono text-slate-400 mt-2 px-1">
              — {item.caption}
            </p>
          )}
        </div>
      );
    }

    if (item.type === 'vimeo') {
      const embedUrl = getVimeoEmbedUrl(item.url);
      return (
        <div key={item.id || index} className="w-full mb-8">
          <div className="relative aspect-video w-full bg-black border border-slate-700/80 overflow-hidden shadow-lg">
            <iframe
              src={embedUrl}
              title={item.caption || `Vimeo Video ${index + 1}`}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0 absolute inset-0"
            />
          </div>
          {item.caption && (
            <p className="text-xs font-mono text-slate-400 mt-2 px-1">
              — {item.caption}
            </p>
          )}
        </div>
      );
    }

    if (item.type === 'video') {
      return (
        <div key={item.id || index} className="w-full mb-8">
          <div className="relative aspect-video w-full bg-black border border-slate-700/80 overflow-hidden shadow-lg">
            <video
              src={item.url}
              controls
              loop
              className="w-full h-full object-contain"
            />
          </div>
          {item.caption && (
            <p className="text-xs font-mono text-slate-400 mt-2 px-1">
              — {item.caption}
            </p>
          )}
        </div>
      );
    }

    // Standard Image or GIF - static, no scale or jump on hover
    return (
      <div key={item.id || index} className="w-full mb-8 group">
        <div
          onClick={() => onOpenLightbox(item)}
          className="relative w-full bg-[#121922] border border-slate-700/80 overflow-hidden cursor-zoom-in group-hover:border-slate-400 transition-colors shadow-lg"
        >
          <img
            src={item.url}
            alt={item.caption || project.title}
            className="w-full h-auto max-h-[85vh] object-contain mx-auto block"
          />
          <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm text-white p-1.5 opacity-0 group-hover:opacity-100 transition-opacity border border-white/20">
            <Maximize2 className="w-4 h-4" />
          </div>
        </div>
        {item.caption && (
          <p className="text-xs font-mono text-slate-400 mt-2 px-1 flex items-center justify-between">
            <span>— {item.caption}</span>
            <span className="text-[10px] text-slate-400">點擊放大檢視</span>
          </p>
        )}
      </div>
    );
  };

  return (
    <AnimatePresence>
      <div
        ref={modalOuterRef}
        className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex justify-center p-2 sm:p-6 md:p-10"
      >
        {/* Backdrop click to close */}
        <div className="fixed inset-0" onClick={onClose} />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-5xl bg-[#141c26] border border-slate-700 text-white z-10 my-auto shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
        >
          {/* Top sticky header bar */}
          <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-[#141c26]/95 backdrop-blur-md border-b border-slate-700/80">
            <div className="flex items-center gap-3">
              <span className="text-sm sm:text-base font-bold font-mono tracking-widest text-slate-200">
                {project.code || '專案詳情'}
              </span>
              <span className="text-slate-600 font-mono">/</span>
              <span className="text-xs sm:text-sm font-medium text-slate-400 uppercase tracking-wider hidden sm:inline">
                {project.category === 'motion'
                  ? config?.categories?.motion?.name || '動態影像/錄像'
                  : project.category === 'device'
                  ? config?.categories?.device?.name || '互動裝置/介面'
                  : config?.categories?.wall?.name || '互動螢幕/投影'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isAdminAuthenticated && (
                <button
                  onClick={() => onEditProject(project)}
                  className="text-xs font-medium text-slate-300 hover:text-white bg-[#1e2938] hover:bg-[#28374b] border border-slate-600 px-2.5 py-1.5 rounded transition-all flex items-center gap-1.5"
                  title="編輯此專案圖文"
                >
                  <Edit className="w-3.5 h-3.5 text-indigo-300" />
                  <span className="hidden sm:inline">編輯作品</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                title="關閉 (ESC)"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Scrollable Content Body with dedicated ref to reset scrollTop */}
          <div
            ref={scrollContainerRef}
            className="overflow-y-auto p-6 sm:p-8 space-y-8 flex-1"
          >
            {/* Title & Metadata Header */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-wide text-white">
                {project.title}
              </h2>
              {project.subtitle && (
                <p className="text-sm sm:text-base text-slate-300 mt-1">
                  {project.subtitle}
                </p>
              )}

              {/* Specs Pills */}
              <div className="flex flex-wrap items-center gap-y-2 gap-x-6 mt-4 pt-4 border-t border-slate-800 text-xs sm:text-sm text-slate-300">
                {project.year && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>年份：{project.year}</span>
                  </div>
                )}
                {project.client && (
                  <div className="flex items-center gap-1.5">
                    <User className="w-4 h-4 text-slate-400" />
                    <span>客戶/主辦：{project.client}</span>
                  </div>
                )}
                {project.role && (
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-slate-400" />
                    <span>職責：{project.role}</span>
                  </div>
                )}
              </div>

              {/* Tools Tags */}
              {project.tools && project.tools.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <span className="text-xs text-slate-400 flex items-center gap-1 mr-1">
                    <Wrench className="w-3.5 h-3.5" /> 工具技術：
                  </span>
                  {project.tools.map((tool, idx) => (
                    <span
                      key={idx}
                      className="text-xs font-mono bg-[#1f2c3b] border border-slate-700 text-slate-200 px-2 py-0.5"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Description Text */}
            {project.description && (
              <div className="bg-[#182330]/80 p-5 border-l-2 border-slate-400">
                <h4 className="text-xs font-mono tracking-widest text-slate-400 uppercase mb-1.5">
                  作品簡介 / CONCEPT
                </h4>
                <p className="text-sm sm:text-base text-slate-200 leading-relaxed whitespace-pre-line">
                  {project.description}
                </p>
              </div>
            )}

            {/* Media Gallery (Stack of Images, GIFs, Video embeds) */}
            <div className="pt-2">
              {allMedia.length === 0 ? (
                <div className="p-10 text-center border border-dashed border-slate-800 text-slate-400 text-sm">
                  尚未加入媒體展示檔案
                </div>
              ) : (
                <div className="space-y-4">
                  {allMedia.map((m, idx) => renderMediaItem(m, idx))}
                </div>
              )}
            </div>
          </div>

          {/* Footer Navigation Bar - Always enabled with cyclic loop */}
          <div className="sticky bottom-0 z-20 flex items-center justify-between px-6 py-3.5 bg-[#101720] border-t border-slate-800">
            <button
              onClick={() => prevProject && onNavigate(prevProject)}
              disabled={!prevProject}
              className={`flex items-center gap-2 text-xs sm:text-sm font-medium tracking-wide transition-colors ${
                prevProject
                  ? 'text-slate-300 hover:text-white cursor-pointer'
                  : 'text-slate-600 cursor-not-allowed'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>
                {prevProject
                  ? `上一件：${prevProject.code || prevProject.title}`
                  : '切換上一件'}
              </span>
            </button>

            <span className="text-xs font-mono text-slate-400">
              {currentIndex + 1} / {totalCount}
            </span>

            <button
              onClick={() => nextProject && onNavigate(nextProject)}
              disabled={!nextProject}
              className={`flex items-center gap-2 text-xs sm:text-sm font-medium tracking-wide transition-colors ${
                nextProject
                  ? 'text-slate-300 hover:text-white cursor-pointer'
                  : 'text-slate-600 cursor-not-allowed'
              }`}
            >
              <span>
                {nextProject
                  ? `下一件：${nextProject.code || nextProject.title}`
                  : '切換下一件'}
              </span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
