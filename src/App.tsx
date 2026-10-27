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

const STORAGE_KEY = 'ih_portfolio_custom_data_v3';
const AUTH_STORAGE_KEY = 'ih_portfolio_admin_auth_v1';
const CATEGORY_KEYS: CategoryKey[] = ['home', 'motion', 'device', 'wall'];
const CATEGORY_PATHS: Record<CategoryKey, string> = {
  home: 'home',
  motion: 'motion-graphics-videos',
  device: 'installations-interfaces',
  wall: 'screens-projections',
};
const PROJECT_ROUTE_PREFIXES: Record<'motion' | 'device' | 'wall', string> = {
  motion: 'mv',
  device: 'dv',
  wall: 'pj',
};

const getDeploymentBasePath = (pathname: string) =>
  pathname === '/portfolio' || pathname.startsWith('/portfolio/') ? '/portfolio' : '';

const parseRoute = (pathname: string): { tab: CategoryKey; projectId: string | null } => {
  const segments = pathname.split('/').filter(Boolean);
  if (segments[0]?.toLowerCase() === 'portfolio') segments.shift();
  const routeSegment = segments[0]?.toLowerCase();
  const tab = CATEGORY_KEYS.find((key) =>
    routeSegment === CATEGORY_PATHS[key] || routeSegment === key
  ) || 'home';

  let projectId: string | null = null;
  if (tab !== 'home' && segments[1]) {
    try {
      projectId = decodeURIComponent(segments[1]);
    } catch {
      projectId = segments[1];
    }
  }

  return { tab, projectId };
};

const findProjectFromRoute = (tab: CategoryKey, routeId: string | null, projects: Project[]) => {
  if (!routeId) return null;
  const categoryProjects = projects.filter((project) => project.category === tab);
  const numberedRoute = routeId.match(/^(mv|dv|pj)-(\d+)$/);
  const matchingCategory = numberedRoute
    ? (Object.keys(PROJECT_ROUTE_PREFIXES) as Array<keyof typeof PROJECT_ROUTE_PREFIXES>)
        .find((category) => PROJECT_ROUTE_PREFIXES[category] === numberedRoute[1])
    : null;
  if (numberedRoute && matchingCategory === tab) {
    const numberFromBottom = Number(numberedRoute[2]);
    return categoryProjects[categoryProjects.length - numberFromBottom] || null;
  }

  // Continue resolving previously shared project-ID URLs.
  return projects.find((project) => project.id === routeId) || null;
};

const routePath = (tab: CategoryKey, project?: Project | null, projects: Project[] = []) => {
  const deploymentBasePath = getDeploymentBasePath(window.location.pathname);
  const basePath = tab === 'home'
    ? `${deploymentBasePath}/`
    : `${deploymentBasePath}/${CATEGORY_PATHS[tab]}`;
  if (!project) return basePath;

  const categoryProjects = projects.filter((item) => item.category === tab);
  const displayIndex = categoryProjects.findIndex((item) => item.id === project.id);
  const numberFromBottom = displayIndex >= 0 ? categoryProjects.length - displayIndex : 0;
  const routeId = numberFromBottom > 0
    ? `${PROJECT_ROUTE_PREFIXES[tab as keyof typeof PROJECT_ROUTE_PREFIXES]}-${String(numberFromBottom).padStart(3, '0')}`
    : project.id;
  return `${basePath}/${encodeURIComponent(routeId)}`;
};

export default function App() {
  // Load data from localStorage or initial defaults
  const [data, setData] = useState<PortfolioData>(() => {
    try {
      // 1. Force reset ONLY if explicitly requested via URL query (?reset=true or ?clean=true)
      if (typeof window !== 'undefined' && window.location.search) {
        const params = new URLSearchParams(window.location.search);
        if (params.has('reset') || params.has('clean') || params.has('fresh')) {
          localStorage.removeItem('ih_portfolio_custom_data_v1');
          localStorage.removeItem('ih_portfolio_custom_data_v2');
          localStorage.removeItem(STORAGE_KEY);
          return initialPortfolioData;
        }
      }

      // 2. Safely check storage without deleting user data (check v3, v2, v1, backup)
      const storageKeys = [
        STORAGE_KEY,
        'ih_portfolio_custom_data_v2',
        'ih_portfolio_custom_data_v1',
        'ih_portfolio_backup',
      ];
      for (const key of storageKeys) {
        const saved = localStorage.getItem(key);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed && parsed.config && Array.isArray(parsed.projects)) {
              // Mirror to latest storage key to preserve
              localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
              return parsed;
            }
          } catch (err) {
            console.warn(`Could not parse data from ${key}:`, err);
          }
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
  const [activeTab, setActiveTab] = useState<CategoryKey>(() => parseRoute(window.location.pathname).tab);

  // Currently opened project modal (for detailed view)
  const [selectedProject, setSelectedProject] = useState<Project | null>(() => {
    const route = parseRoute(window.location.pathname);
    return findProjectFromRoute(route.tab, route.projectId, data.projects);
  });

  // Admin content manager modal state
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [editingTargetProject, setEditingTargetProject] = useState<Project | null>(null);

  // Fullscreen image/video lightbox
  const [lightboxMedia, setLightboxMedia] = useState<MediaItem | null>(null);

  // Keep the browser tab title in sync with the saved site configuration.
  useEffect(() => {
    document.title = data.config.pageTitle?.trim() || 'IH Portfolio - 互動影像作品集';
  }, [data.config.pageTitle]);

  // Restore category and project detail when a route is opened or browser history changes.
  useEffect(() => {
    const syncRoute = () => {
      const route = parseRoute(window.location.pathname);
      const project = findProjectFromRoute(route.tab, route.projectId, data.projects);
      setActiveTab(project ? project.category : route.tab);
      setSelectedProject(project);
    };

    window.addEventListener('popstate', syncRoute);
    return () => window.removeEventListener('popstate', syncRoute);
  }, [data.projects]);

  const navigateToCategory = (tab: CategoryKey) => {
    window.history.pushState(null, '', routePath(tab));
    setActiveTab(tab);
    setSelectedProject(null);
  };

  const navigateToProject = (project: Project, replace = false) => {
    const method = replace ? 'replaceState' : 'pushState';
    window.history[method](null, '', routePath(project.category, project, data.projects));
    setActiveTab(project.category);
    setSelectedProject(project);
  };

  const closeProject = () => {
    if (selectedProject) {
      window.history.replaceState(null, '', routePath(selectedProject.category));
      setActiveTab(selectedProject.category);
    }
    setSelectedProject(null);
  };

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

  // Auto-sync client data to server initialData.ts
  useEffect(() => {
    if (data && Array.isArray(data.projects) && data.projects.length > 0) {
      fetch('/api/sync-source-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
        .then((r) => r.json())
        .then((res) => {
          if (res?.success) {
            console.log(`[AutoSync] Successfully synced ${res.count} projects to initialData.ts`);
          }
        })
        .catch(() => {});
    }
  }, [data]);

  // Save changes to localStorage & state
  const handleSaveData = (newData: PortfolioData) => {
    setData(newData);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      localStorage.setItem('ih_portfolio_backup', JSON.stringify(newData));
      // Immediate sync to server initialData.ts
      fetch('/api/sync-source-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData),
      }).catch(() => {});
    } catch (e) {
      console.warn('Storage quota or error:', e);
    }
  };

  // Reset to default data with safeguard
  const handleResetDefaults = () => {
    if (window.confirm('確定要恢復預設值嗎？注意：此操作會清除當前修改。建議先匯出備份 JSON。')) {
      localStorage.removeItem(STORAGE_KEY);
      setData(initialPortfolioData);
    }
  };

  // Filter projects by active category
  const categoryProjects = data.projects.filter((p) => {
    if (activeTab === 'home') return true;
    return p.category === activeTab;
  });

  // Handle open project modal
  const handleOpenProject = (project: Project) => {
    navigateToProject(project);
  };

  // Handle edit project directly from modal
  const handleEditSpecificProject = (project: Project) => {
    closeProject();
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
        onSelectTab={navigateToCategory}
        onOpenAdmin={handleRequestAdminOpen}
        onLogout={handleLogoutAdmin}
      />

      {/* Main View Area */}
      <main className="flex-1 w-full mt-4">
        {activeTab === 'home' ? (
          <HomeView
            config={data.config}
            projects={data.projects}
            onSelectCategory={navigateToCategory}
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
          onClose={closeProject}
          onNavigate={(next) => navigateToProject(next)}
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
