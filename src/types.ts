export type CategoryKey = 'home' | 'motion' | 'device' | 'wall';

export type MediaType = 'image' | 'gif' | 'video' | 'youtube' | 'vimeo';

export interface MediaItem {
  id: string;
  type: MediaType;
  url: string;
  thumbnail?: string;
  caption?: string;
  aspectRatio?: '16/9' | '4/3' | '1/1' | '9/16' | 'auto';
}

export interface Project {
  id: string;
  category: 'motion' | 'device' | 'wall';
  code: string; // e.g. "專案_001" or "PROJECT_001"
  title: string;
  subtitle?: string;
  year?: string;
  client?: string;
  role?: string;
  tools?: string[];
  description: string;
  coverMedia: MediaItem;
  mediaList: MediaItem[];
  featured?: boolean;
  order: number;
}

export interface CategoryItemConfig {
  name: string;      // 項目名稱/導覽名稱 (例如: 'HOME', '動態影像/錄像', '互動裝置/介面', '互動螢幕/投影')
  title?: string;    // 進入後的主標題 (如 HOME 頁主標題 '2026 SHOWREEL'，未填則預設為 name)
  enName: string;    // 英文名稱/副標題 (例如: 'Interactive Media & Motion Design Highlight', 'MOTION GRAPHICS & VIDEO' 等)
  description?: string;
}

export interface CategoriesConfig {
  home: CategoryItemConfig;
  motion: CategoryItemConfig;
  device: CategoryItemConfig;
  wall: CategoryItemConfig;
}

export interface HomeVideoItem {
  id: string;
  title: string;       // Showreel 主標題
  url: string;         // 內嵌影片網址 (YouTube / Vimeo / MP4)
  description?: string;// 影片簡介文字
}

export interface SiteConfig {
  logoTitle: string;
  logoSubtitle: string;
  phone: string;
  email: string;
  location?: string;
  categories: CategoriesConfig;
  showreelTitle?: string;
  showreelSubtitle?: string;
  showreelUrl?: string;
  showreelDescription?: string;
  personalPhoto?: string;       // HOME 左側個人照片網址
  personalBio?: string;         // 個人簡介 (顯示於 HOME 主副標題下方)
  homeVideos?: HomeVideoItem[]; // 多組 HOME 內嵌影音
  footerTitle?: string;         // 最底部左側標題 (例如 'IH Portfolio')
  footerBio?: string;           // 最底部版權/描述文字 (例如 'IH STUDIO © 2026 Interactive & Motion Media Portfolio. All rights reserved.')
  adminPassword?: string;       // 管理者通行密碼 (預設 admin)
  vimeoUrl?: string;            // VIMEO 連結
  socialLinks?: {
    platform: string;
    url: string;
  }[];
}

export interface PortfolioData {
  config: SiteConfig;
  projects: Project[];
}

