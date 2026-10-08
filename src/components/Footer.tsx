import React from 'react';
import { SiteConfig } from '../types';
import { Video, Lock, Unlock } from 'lucide-react';

interface FooterProps {
  config: SiteConfig;
  isAdminAuthenticated: boolean;
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({ config, isAdminAuthenticated, onOpenAdmin }) => {
  const footerTitle = config.footerTitle || `${config.logoTitle || 'IH'} ${config.logoSubtitle || 'Portfolio'}`.trim();
  const footerBio = config.footerBio || 'IH STUDIO © 2026 Interactive & Motion Media Portfolio. All rights reserved.';
  const vimeoUrl = config.vimeoUrl?.trim() || config.socialLinks?.find(s => s.platform.toLowerCase().includes('vimeo'))?.url?.trim() || '';

  return (
    <footer className="w-full border-t border-slate-800/80 bg-[#0f1620] py-10 px-4 sm:px-8 mt-auto">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-6 text-center sm:text-left">
          <span className="font-semibold text-slate-300 tracking-wider">
            {footerTitle}
          </span>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="text-slate-400">{footerBio}</span>
        </div>

        <div className="flex items-center gap-5">
          {vimeoUrl && (
            <a
              href={vimeoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 font-medium tracking-wide uppercase group"
            >
              <Video className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors" />
              <span>VIMEO</span>
            </a>
          )}

          {/* Admin discreet trigger (lock icon) */}
          <button
            onClick={onOpenAdmin}
            title={isAdminAuthenticated ? "已登入管理模式 (點擊進入後台)" : "管理者通行驗證"}
            className={`p-1 transition-all rounded ${
              isAdminAuthenticated
                ? 'text-indigo-400 hover:text-indigo-300 bg-indigo-950/40 border border-indigo-800/50'
                : 'text-slate-600 hover:text-slate-400 opacity-20 hover:opacity-100'
            }`}
          >
            {isAdminAuthenticated ? (
              <Unlock className="w-3.5 h-3.5" />
            ) : (
              <Lock className="w-3 h-3" />
            )}
          </button>
        </div>
      </div>
    </footer>
  );
};

