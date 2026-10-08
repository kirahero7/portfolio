import React, { useRef } from 'react';
import { CategoryKey, SiteConfig } from '../types';
import { Settings, Phone, Mail, LogOut, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  config: SiteConfig;
  activeTab: CategoryKey;
  isAdminAuthenticated: boolean;
  onSelectTab: (tab: CategoryKey) => void;
  onOpenAdmin: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  activeTab,
  isAdminAuthenticated,
  onSelectTab,
  onOpenAdmin,
  onLogout,
}) => {
  const tabs: { key: CategoryKey; label: string }[] = [
    { key: 'home', label: config.categories?.home?.name || 'HOME' },
    { key: 'motion', label: config.categories?.motion?.name || '動態影像/錄像' },
    { key: 'device', label: config.categories?.device?.name || '互動裝置/介面' },
    { key: 'wall', label: config.categories?.wall?.name || '互動螢幕/投影' },
  ];

  return (
    <header className="w-full pt-8 pb-6 px-4 sm:px-8 max-w-6xl mx-auto">
      {/* Top Bar: Brand Logo & Contact */}
      <div className="flex flex-row justify-between items-start mb-6">
        {/* Brand */}
        <button
          onClick={() => onSelectTab('home')}
          className="text-left group focus:outline-none transition-transform active:scale-95 cursor-pointer"
        >
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-none">
            {config.logoTitle || 'IH'}
          </h1>
          <p className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1 leading-none">
            {config.logoSubtitle || 'Portfolio'}
          </p>
        </button>

        {/* Contact Info (Plain text without link as requested) & Admin trigger */}
        <div className="flex flex-col items-end gap-1 text-right">
          {config.phone && (
            <div className="text-sm sm:text-base font-normal tracking-wide text-slate-200 flex items-center gap-1.5 justify-end">
              <Phone className="w-3.5 h-3.5 text-slate-400 sm:hidden inline" />
              <span>{config.phone}</span>
            </div>
          )}
          {config.email && (
            <div className="text-sm sm:text-base font-normal tracking-wide text-slate-200 flex items-center gap-1.5 justify-end">
              <Mail className="w-3.5 h-3.5 text-slate-400 sm:hidden inline" />
              <span>{config.email}</span>
            </div>
          )}

          {/* Quick CMS / Edit button - ONLY visible when admin is authenticated */}
          {isAdminAuthenticated && (
            <div className="flex items-center gap-1.5 mt-2 animate-fadeIn">
              <button
                onClick={onOpenAdmin}
                id="admin-manage-btn"
                title="管理與擴充作品 (新增/編輯/上傳圖檔)"
                className="text-xs text-white bg-indigo-900/80 hover:bg-indigo-800 border border-indigo-500/80 px-2.5 py-1 rounded transition-all flex items-center gap-1.5 shadow"
              >
                <Settings className="w-3.5 h-3.5 text-indigo-300 animate-spin-slow" />
                <span>作品管理 / 擴充</span>
              </button>
              <button
                onClick={onLogout}
                title="退出管理者模式"
                className="text-xs text-slate-400 hover:text-red-300 bg-[#1e293b]/70 hover:bg-red-950/40 border border-slate-700 hover:border-red-800/80 px-2 py-1 rounded transition-all flex items-center gap-1"
              >
                <LogOut className="w-3 h-3" />
                <span className="hidden sm:inline">登出</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Solid Divider Line */}
      <div className="w-full h-px bg-slate-700/80 my-6" />

      {/* Navigation Buttons Row - Faithful rectangle styling from mockup */}
      <nav className="flex flex-wrap items-center gap-3 sm:gap-4">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              id={`nav-tab-${tab.key}`}
              onClick={() => onSelectTab(tab.key)}
              className={`px-5 sm:px-7 py-1.5 sm:py-2 text-sm sm:text-base tracking-widest transition-all duration-150 select-none font-medium ${
                isActive
                  ? 'bg-white text-[#141c26] border border-white shadow-sm'
                  : 'bg-transparent text-white border border-slate-400/90 hover:border-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
