import React, { useState, useEffect } from 'react';
import { CategoryKey, MediaItem, PortfolioData, Project } from './types';
import { initialPortfolioData } from './data/initialData';
import { Header } from './components/Header';
import { HomeView } from './components/HomeView';
import { ProjectGrid } from './components/ProjectGrid';
import { ProjectModal } from './components/ProjectModal';
import { AdminEditorModal } from './components/AdminEditorModal';
import { AdminAuthModal } from './components/AdminAuthModal';
import { LightboxModal } from './components/LightboxModal';
import { Footer } from './components/Footer';
import { Plus, Settings } from 'lucide-react';
import { AnimatePresence } from 'motion/react';

const STORAGE_KEY = 'ih_portfolio_custom_data_v1';
const AUTH_STORAGE_KEY = 'ih_portfolio_admin_auth_v1';

export default function App() {
  // Load data from localStorage or initial defaults
  const [data, setData] = useState<PortfolioData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.config && Array.isArray(parsed.projects)) {
          // Automatic migration of legacy category names to new names
          if (parsed.config.categories) {
            if (parsed.config.categories.motion?.name === '動態影像') {
              parsed.config.categories.motion.name = '動態影像/錄像';
            }
            if (parsed.config.categories.device?.name === '裝置介面') {
              parsed.config.categories.device.name = '互動裝置/介面';
            }
            if (parsed.config.categories.device?.enName === 'DEVICE INTERFACES & HAPTICS') {
              parsed.config.categories.device.enName = 'INTERACTIVE INSTALLATIONS & INTERFACES';
            }
            if (parsed.config.categories.wall?.name === '互動牆類') {
              parsed.config.categories.wall.name = '互動螢幕/投影';
            }
            if (parsed.config.categories.wall?.enName === 'INTERACTIVE WALLS & PROJECTION') {
              parsed.config.categories.wall.enName = 'INTERACTIVE SCREENS & PROJECTIONS';
            }
          }

          // Clean legacy sample dummy video from cache
          if (parsed.config.showreelUrl === 'https://www.youtube.com/watch?v=dQw4w9WgXcQ') {
            parsed.config.showreelUrl = '';
          }
          if (Array.isArray(parsed.config.homeVideos)) {
            parsed.config.homeVideos = parsed.config.homeVideos.filter(
              (v: { url?: string }) => v.url && v.url !== 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' && v.url.trim().length > 0
            );
          }
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load portfolio cache:', e);
    }
    return initialPortfolioData;
  });

  // Admin authentication state
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem(AUTH_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  // Auth password modal state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Current active navigation tab
  const [activeTab, setActiveTab] = useState<CategoryKey>('home');

  // Currently opened project modal (for detailed view)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Admin content manager modal state
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [editingTargetProject, setEditingTargetProject] = useState<Project | null>(null);

  // Fullscreen image/video lightbox
  const [lightboxMedia, setLightboxMedia] = useState<MediaItem | null>(null);

  // Trigger admin access request (from UI button, shortcut, or URL)
  const handleRequestAdminOpen = () => {
    if (isAdminAuthenticated) {
      setEditingTargetProject(null);
      setIsAdminOpen(true);
    } else {
      setIsAuthModalOpen(true);
    }
  };

  // Auth success handler
  const handleAuthSuccess = (remember: boolean) => {
    setIsAdminAuthenticated(true);
    if (remember) {
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, 'true');
      } catch (e) {
        console.warn(e);
      }
    }
    setIsAuthModalOpen(false);
    setIsAdminOpen(true);
  };

  // Admin logout handler
  const handleLogoutAdmin = () => {
    setIsAdminAuthenticated(false);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (e) {
      console.warn(e);
    }
    setIsAdminOpen(false);
  };

  // Listen for ?admin URL parameter
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.has('admin') || searchParams.has('manage') || searchParams.has('cms')) {
        if (isAdminAuthenticated) {
          setIsAdminOpen(true);
        } else {
          setIsAuthModalOpen(true);
        }
      }
    } catch (e) {
      console.error('URL check error:', e);
    }
  }, [isAdminAuthenticated]);

  // Save changes to localStorage & state
  const handleSaveData = (newData: PortfolioData) => {
    setData(newData);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    } catch (e) {
      console.warn('Storage quota or error:', e);
    }
  };

  // Reset to default data
  const handleResetDefaults = () => {
    localStorage.removeItem(STORAGE_KEY);
    setData(initialPortfolioData);
  };

  // Filter projects by active category
  const categoryProjects = data.projects.filter((p) => {
    if (activeTab === 'home') return true;
    return p.category === activeTab;
  });

  // Handle open project modal
  const handleOpenProject = (project: Project) => {
    setSelectedProject(project);
  };

  // Handle edit project directly from modal
  const handleEditSpecificProject = (project: Project) => {
    setSelectedProject(null);
    setEditingTargetProject(project);
    setIsAdminOpen(true);
  };

  // Handle quick add in category
  const handleAddNewProject = (category: 'motion' | 'device' | 'wall') => {
    setEditingTargetProject({
      id: `proj-${Date.now()}`,
      category,
      code: `專案_${String(data.projects.filter((p) => p.category === category).length + 1).padStart(3, '0')}`,
      title: '新專案名稱',
      subtitle: '',
      year: new Date().getFullYear().toString(),
      client: '',
      role: '',
      tools: [],
      description: '',
      coverMedia: {
        id: `cov-${Date.now()}`,
        type: 'image',
        url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1200&auto=format&fit=crop',
        caption: '封面圖片',
      },
      mediaList: [],
      featured: false,
      order: data.projects.length + 1,
    });
    setIsAdminOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#141c26] text-white selection:bg-white selection:text-black">
      {/* Top Header - with conditional admin controls and logo triple-click */}
      <Header
        config={data.config}
        activeTab={activeTab}
        isAdminAuthenticated={isAdminAuthenticated}
        onSelectTab={setActiveTab}
        onOpenAdmin={handleRequestAdminOpen}
        onLogout={handleLogoutAdmin}
      />

      {/* Main View Area */}
      <main className="flex-1 w-full mt-4">
        {activeTab === 'home' ? (
          <HomeView
            config={data.config}
            projects={data.projects}
            onSelectCategory={(cat) => setActiveTab(cat)}
            onOpenProject={handleOpenProject}
          />
        ) : (
          <ProjectGrid
            category={activeTab}
            config={data.config}
            projects={categoryProjects}
            isAdminAuthenticated={isAdminAuthenticated}
            onOpenProject={handleOpenProject}
            onAddNewProject={handleAddNewProject}
          />
        )}
      </main>

      {/* Project Detail Modal */}
      {selectedProject && (
        <ProjectModal
          project={selectedProject}
          config={data.config}
          allCategoryProjects={categoryProjects}
          isAdminAuthenticated={isAdminAuthenticated}
          onClose={() => setSelectedProject(null)}
          onNavigate={(next) => setSelectedProject(next)}
          onEditProject={handleEditSpecificProject}
          onOpenLightbox={(media) => setLightboxMedia(media)}
        />
      )}

      {/* Admin Visual Editor Modal */}
      {isAdminOpen && (
        <AdminEditorModal
          data={data}
          initialEditingProject={editingTargetProject}
          onSaveData={handleSaveData}
          onResetDefaults={handleResetDefaults}
          onClose={() => {
            setIsAdminOpen(false);
            setEditingTargetProject(null);
          }}
        />
      )}

      {/* Admin Password Authentication Modal */}
      <AdminAuthModal
        isOpen={isAuthModalOpen}
        correctPassword={data.config.adminPassword || 'admin'}
        onSuccess={handleAuthSuccess}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Lightbox for zooming images/videos */}
      {lightboxMedia && (
        <LightboxModal
          media={lightboxMedia}
          onClose={() => setLightboxMedia(null)}
        />
      )}

      {/* Footer */}
      <Footer
        config={data.config}
        isAdminAuthenticated={isAdminAuthenticated}
        onOpenAdmin={handleRequestAdminOpen}
      />
    </div>
  );
}
