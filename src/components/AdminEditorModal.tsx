import React, { useState, useRef } from 'react';
import { CategoryKey, HomeVideoItem, MediaItem, PortfolioData, Project, SiteConfig } from '../types';
import { detectMediaType, fileToBase64, getYouTubeEmbedUrl, getVimeoEmbedUrl, getMediaThumbnailUrl } from '../utils/mediaUtils';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  Upload,
  Link,
  Film,
  Image as ImageIcon,
  Save,
  Download,
  FileCode,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  Check,
  Eye,
  EyeOff,
  Lock,
  Key,
  Copy,
  Video,
  Layers,
  Sparkles,
  Info,
  Globe,
  Settings,
  ExternalLink,
  Play,
  Clipboard,
  ListPlus,
  Zap,
  GripVertical,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdminEditorModalProps {
  data: PortfolioData;
  initialEditingProject?: Project | null;
  onSaveData: (newData: PortfolioData) => void;
  onResetDefaults: () => void;
  onClose: () => void;
}

type AdminTab = 'projects' | 'site_info' | 'backup';

export const AdminEditorModal: React.FC<AdminEditorModalProps> = ({
  data,
  initialEditingProject,
  onSaveData,
  onResetDefaults,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>(
    initialEditingProject ? 'projects' : 'projects'
  );
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<
    'all' | 'motion' | 'device' | 'wall'
  >('all');

  const defaultCategories = {
    home: {
      name: 'HOME',
      title: '2026 SHOWREEL',
      enName: 'Interactive Media & Motion Design Highlight',
    },
    motion: {
      name: '動態影像/錄像',
      enName: 'MOTION GRAPHICS & VIDEO',
    },
    device: {
      name: '互動裝置/介面',
      enName: 'INTERACTIVE INSTALLATIONS & INTERFACES',
    },
    wall: {
      name: '互動螢幕/投影',
      enName: 'INTERACTIVE SCREENS & PROJECTIONS',
    },
  };

  // Site Config state
  const initialHomeVideos = (data.config.homeVideos && data.config.homeVideos.length > 0)
    ? data.config.homeVideos
    : (data.config.showreelUrl && data.config.showreelUrl.trim().length > 0)
      ? [
          {
            id: 'video-1',
            title: data.config.showreelTitle || '2026 SHOWREEL',
            url: data.config.showreelUrl.trim(),
            description: data.config.showreelDescription || '',
          },
        ]
      : [];

  const [siteConfig, setSiteConfig] = useState<SiteConfig>({
    ...data.config,
    personalBio: data.config.personalBio !== undefined ? data.config.personalBio : (data.config.categories?.home?.description || ''),
    footerTitle: data.config.footerTitle || `${data.config.logoTitle || 'IH'} ${data.config.logoSubtitle || 'Portfolio'}`.trim(),
    footerBio: data.config.footerBio || 'IH STUDIO © 2026 Interactive & Motion Media Portfolio. All rights reserved.',
    vimeoUrl: data.config.vimeoUrl?.trim() || data.config.socialLinks?.find(s => s.platform.toLowerCase().includes('vimeo'))?.url?.trim() || '',
    homeVideos: initialHomeVideos,
    categories: {
      home: {
        ...defaultCategories.home,
        ...(data.config.categories?.home || {}),
      },
      motion: {
        ...defaultCategories.motion,
        ...(data.config.categories?.motion || {}),
      },
      device: {
        ...defaultCategories.device,
        ...(data.config.categories?.device || {}),
      },
      wall: {
        ...defaultCategories.wall,
        ...(data.config.categories?.wall || {}),
      },
    },
  });

  // Projects list state
  const [projectsList, setProjectsList] = useState<Project[]>([...data.projects]);

  // Current project being edited (or new project)
  const [editingProject, setEditingProject] = useState<Project | null>(
    initialEditingProject ? { ...initialEditingProject } : null
  );

  // Tools input as string for easy typing
  const [toolsInput, setToolsInput] = useState<string>(
    initialEditingProject?.tools?.join(', ') || ''
  );

  // New media item input temporary fields
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [newMediaCaption, setNewMediaCaption] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [siteConfigSaved, setSiteConfigSaved] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [copiedAdminUrl, setCopiedAdminUrl] = useState(false);
  const [importError, setImportError] = useState('');
  const [isSyncingSource, setIsSyncingSource] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState('');
  const [pasteJsonText, setPasteJsonText] = useState('');
  const [showBatchPasteModal, setShowBatchPasteModal] = useState(false);
  const [batchUrlsText, setBatchUrlsText] = useState('');
  const [showCoverUploadFallback, setShowCoverUploadFallback] = useState(false);

  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);
  const jsonFileInputRef = useRef<HTMLInputElement>(null);

  // Handle opening project editor
  const handleOpenEditProject = (proj: Project) => {
    setEditingProject({ ...proj });
    setToolsInput(proj.tools?.join(', ') || '');
  };

  // Handle creating a new project
  const handleCreateNewProject = (category: 'motion' | 'device' | 'wall' = 'motion') => {
    const existingInCat = projectsList.filter((p) => p.category === category);
    const nextNum = existingInCat.length + 1;
    const nextCode = `專案_${String(nextNum).padStart(3, '0')}`;

    const newProj: Project = {
      id: `proj-${Date.now()}`,
      category,
      code: nextCode,
      title: '新專案名稱',
      subtitle: '作品副標題或類型簡述',
      year: new Date().getFullYear().toString(),
      client: '',
      role: '視覺設計 / 程式開發',
      tools: ['TouchDesigner', 'After Effects'],
      description: '請在此輸入作品的詳細理念、技術亮點與展演背景...',
      coverMedia: {
        id: `cov-${Date.now()}`,
        type: 'image',
        url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1200&auto=format&fit=crop',
        caption: '作品主視覺預覽',
      },
      mediaList: [],
      featured: false,
      order: projectsList.length + 1,
    };

    setEditingProject(newProj);
    setToolsInput('TouchDesigner, After Effects');
  };

  // Save the currently editing project back into the list
  const handleSaveCurrentProject = () => {
    if (!editingProject) return;

    const tools = toolsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const updated = {
      ...editingProject,
      tools,
    };

    const exists = projectsList.some((p) => p.id === updated.id);
    let newList: Project[];
    if (exists) {
      newList = projectsList.map((p) => (p.id === updated.id ? updated : p));
    } else {
      newList = [updated, ...projectsList];
    }

    setProjectsList(newList);
    setEditingProject(null);

    // Also persist
    onSaveData({
      config: siteConfig,
      projects: newList,
    });
  };

  // Delete a project
  const handleDeleteProject = (id: string) => {
    if (window.confirm('確定要刪除這件作品嗎？')) {
      const newList = projectsList.filter((p) => p.id !== id);
      setProjectsList(newList);
      if (editingProject?.id === id) {
        setEditingProject(null);
      }
      onSaveData({
        config: siteConfig,
        projects: newList,
      });
    }
  };

  // Move project order
  const handleMoveProject = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= projectsList.length) return;

    const newList = [...projectsList];
    const temp = newList[index];
    newList[index] = newList[targetIndex];
    newList[targetIndex] = temp;

    // reassign order numbers
    newList.forEach((p, idx) => {
      p.order = idx + 1;
    });

    setProjectsList(newList);
    onSaveData({
      config: siteConfig,
      projects: newList,
    });
  };

  const handleReorderProjects = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;

    const sourceIndex = projectsList.findIndex((project) => project.id === sourceId);
    const targetIndex = projectsList.findIndex((project) => project.id === targetId);
    if (sourceIndex === -1 || targetIndex === -1) return;

    const nextList = [...projectsList];
    const [movedProject] = nextList.splice(sourceIndex, 1);
    nextList.splice(targetIndex, 0, movedProject);

    nextList.forEach((project, index) => {
      project.order = index + 1;
    });

    setProjectsList(nextList);
  };

  const handleSaveProjectOrder = () => {
    onSaveData({
      config: siteConfig,
      projects: projectsList,
    });
  };

  // Handle Cover image file upload (converts to base64)
  const handleCoverFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingProject) return;

    try {
      const base64 = await fileToBase64(file);
      const type = file.type === 'image/gif' ? 'gif' : 'image';
      setEditingProject({
        ...editingProject,
        coverMedia: {
          id: `cov-${Date.now()}`,
          type,
          url: base64,
          caption: file.name,
        },
      });
    } catch (err) {
      console.error('File read error:', err);
    }
  };

  // Handle adding media to gallery from file upload
  const handleGalleryFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length || !editingProject) return;

    try {
      const newItems: MediaItem[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const base64 = await fileToBase64(file);
        const type = file.type === 'image/gif' ? 'gif' : 'image';
        newItems.push({
          id: `m-${Date.now()}-${i}`,
          type,
          url: base64,
          caption: file.name.replace(/\.[^/.]+$/, ''),
        });
      }

      setEditingProject({
        ...editingProject,
        mediaList: [...(editingProject.mediaList || []), ...newItems],
      });
    } catch (err) {
      console.error('Gallery file upload error:', err);
    }
  };

  // Handle adding media to gallery via URL (YouTube, Vimeo, GIF, JPG)
  const handleAddMediaUrl = () => {
    if (!newMediaUrl.trim() || !editingProject) return;

    const detected = detectMediaType(newMediaUrl);
    const newItem: MediaItem = {
      id: `m-${Date.now()}`,
      type: detected,
      url: newMediaUrl.trim(),
      caption: newMediaCaption.trim() || undefined,
    };

    setEditingProject({
      ...editingProject,
      mediaList: [...(editingProject.mediaList || []), newItem],
    });

    setNewMediaUrl('');
    setNewMediaCaption('');
  };

  // Handle adding a new empty media item in gallery (ready to paste link)
  const handleAddNewMediaItem = () => {
    if (!editingProject) return;
    const newItem: MediaItem = {
      id: `m-${Date.now()}`,
      type: 'image',
      url: '',
      caption: '',
    };
    setEditingProject({
      ...editingProject,
      mediaList: [...(editingProject.mediaList || []), newItem],
    });
  };

  // Handle updating a media item's URL or caption in-place
  const handleUpdateMediaItem = (
    index: number,
    field: 'url' | 'caption',
    value: string
  ) => {
    if (!editingProject || !editingProject.mediaList) return;
    const list = [...editingProject.mediaList];
    if (!list[index]) return;

    if (field === 'url') {
      const detected = detectMediaType(value);
      list[index] = {
        ...list[index],
        url: value.trim(),
        type: detected,
      };
    } else {
      list[index] = {
        ...list[index],
        caption: value,
      };
    }

    setEditingProject({
      ...editingProject,
      mediaList: list,
    });
  };

  // Handle moving media item up or down
  const handleMoveMediaItem = (index: number, direction: 'up' | 'down') => {
    if (!editingProject || !editingProject.mediaList) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= editingProject.mediaList.length) return;

    const list = [...editingProject.mediaList];
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    setEditingProject({
      ...editingProject,
      mediaList: list,
    });
  };

  // Handle batch pasting multiple URLs (one per line)
  const handleApplyBatchUrls = () => {
    if (!editingProject || !batchUrlsText.trim()) return;
    const lines = batchUrlsText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) return;

    const newItems: MediaItem[] = lines.map((url, idx) => ({
      id: `m-${Date.now()}-${idx}`,
      type: detectMediaType(url),
      url: url,
      caption: '',
    }));

    setEditingProject({
      ...editingProject,
      mediaList: [...(editingProject.mediaList || []), ...newItems],
    });

    setBatchUrlsText('');
    setShowBatchPasteModal(false);
  };

  // Remove item from gallery
  const handleRemoveGalleryItem = (index: number) => {
    if (!editingProject) return;
    const list = [...(editingProject.mediaList || [])];
    list.splice(index, 1);
    setEditingProject({ ...editingProject, mediaList: list });
  };

  // Add new home video
  const handleAddHomeVideo = () => {
    const currentVideos = siteConfig.homeVideos || [];
    const newVideo: HomeVideoItem = {
      id: `home-video-${Date.now()}`,
      title: `SHOWREEL ${currentVideos.length + 1}`,
      url: '',
      description: '',
    };
    setSiteConfig({
      ...siteConfig,
      homeVideos: [...currentVideos, newVideo],
    });
  };

  // Remove home video
  const handleRemoveHomeVideo = (index: number) => {
    const currentVideos = [...(siteConfig.homeVideos || [])];
    currentVideos.splice(index, 1);
    setSiteConfig({
      ...siteConfig,
      homeVideos: currentVideos,
      showreelUrl: currentVideos[0]?.url || '',
    });
  };

  // Update specific home video
  const handleUpdateHomeVideo = (
    index: number,
    field: keyof HomeVideoItem,
    value: string
  ) => {
    const currentVideos = [...(siteConfig.homeVideos || [])];
    if (currentVideos[index]) {
      currentVideos[index] = {
        ...currentVideos[index],
        [field]: value,
      };
      setSiteConfig({
        ...siteConfig,
        homeVideos: currentVideos,
      });
    }
  };

  // Save overall site config changes
  const handleSaveSiteConfig = () => {
    const firstVideo = siteConfig.homeVideos?.[0];
    const vimeoUrl = siteConfig.vimeoUrl?.trim();
    const updatedConfig: SiteConfig = {
      ...siteConfig,
      showreelTitle: siteConfig.categories?.home?.title || siteConfig.showreelTitle || '2026 SHOWREEL',
      showreelSubtitle: siteConfig.categories?.home?.enName || siteConfig.showreelSubtitle || '',
      showreelUrl: firstVideo?.url || siteConfig.showreelUrl || '',
      showreelDescription: firstVideo?.description || siteConfig.showreelDescription || '',
      socialLinks: vimeoUrl ? [{ platform: 'Vimeo', url: vimeoUrl }] : [],
    };
    onSaveData({
      config: updatedConfig,
      projects: projectsList,
    });
    setSiteConfig(updatedConfig);
    setSiteConfigSaved(true);
    setTimeout(() => setSiteConfigSaved(false), 3000);
  };

  // Export JSON file
  const handleExportJSON = () => {
    const exportData = {
      config: siteConfig,
      projects: projectsList,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ih-portfolio-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Copy TypeScript code snippet
  const handleCopyCodeSnippet = () => {
    const fullData = {
      config: siteConfig,
      projects: projectsList,
    };
    const code = `import { PortfolioData } from '../types';\n\nexport const initialPortfolioData: PortfolioData = ${JSON.stringify(
      fullData,
      null,
      2
    )};\n`;

    navigator.clipboard.writeText(code);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 3000);
  };

  // Sync current data directly to source code initialData.ts
  const handleSyncToSource = async (customData?: PortfolioData) => {
    setIsSyncingSource(true);
    setSyncStatusMsg('');
    const payload = customData || {
      config: siteConfig,
      projects: projectsList,
    };
    try {
      const res = await fetch('/api/sync-source-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (result.success) {
        setSyncStatusMsg(`✅ 成功永久寫入原始碼（共 ${result.count} 個作品，已寫入 initialData.ts）！`);
        setTimeout(() => setSyncStatusMsg(''), 6000);
      } else {
        setSyncStatusMsg(`❌ 同步失敗：${result.error || '伺服器未接受資料'}`);
      }
    } catch (err: any) {
      setSyncStatusMsg(`❌ 同步失敗：${err.message || '連線錯誤'}`);
    } finally {
      setIsSyncingSource(false);
    }
  };

  // Import JSON file
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.config && Array.isArray(parsed.projects)) {
          setSiteConfig(parsed.config);
          setProjectsList(parsed.projects);
          onSaveData(parsed);
          setImportError('');
          await handleSyncToSource(parsed);
          alert(`成功匯入作品集數據（共 ${parsed.projects.length} 個作品）！已同步固化至原始碼！`);
        } else {
          setImportError('JSON 格式不符：需包含 config 與 projects 欄位');
        }
      } catch (err) {
        setImportError('無效的 JSON 檔案');
      }
    };
    reader.readAsText(file);
  };

  // Import from pasted JSON string
  const handleImportFromPastedJson = async () => {
    if (!pasteJsonText.trim()) return;
    try {
      const parsed = JSON.parse(pasteJsonText);
      if (parsed.config && Array.isArray(parsed.projects)) {
        setSiteConfig(parsed.config);
        setProjectsList(parsed.projects);
        onSaveData(parsed);
        setImportError('');
        await handleSyncToSource(parsed);
        setPasteJsonText('');
        alert(`成功匯入！共 ${parsed.projects.length} 個作品已永久固化至原始碼！`);
      } else {
        setImportError('JSON 格式不符：需包含 config 與 projects 欄位');
      }
    } catch (err) {
      setImportError('JSON 解析錯誤：請確認貼上的文字為合法 JSON 格式');
    }
  };

  const filteredProjects = projectsList.filter((p) => {
    if (selectedCategoryFilter === 'all') return true;
    return p.category === selectedCategoryFilter;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-md flex justify-center p-2 sm:p-6 md:p-8">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Main Admin Box */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="relative w-full max-w-5xl bg-[#141d27] border border-slate-700 text-white z-10 my-auto shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#101720] border-b border-slate-700/90">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base sm:text-lg font-bold tracking-wide text-white">
              作品集內容管理與擴充系統 (Content Manager)
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {syncStatusMsg && (
              <span className="text-xs font-medium text-emerald-400 hidden md:inline">
                {syncStatusMsg}
              </span>
            )}
            <button
              type="button"
              onClick={() => handleSyncToSource()}
              disabled={isSyncingSource}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-700 hover:bg-emerald-600 active:scale-95 disabled:opacity-50 text-white border border-emerald-500 rounded transition-all shadow-sm"
              title="將目前所有作品與設定固化至伺服器原始碼 initialData.ts"
            >
              <Zap className="w-3.5 h-3.5 fill-current text-yellow-300" />
              <span>{isSyncingSource ? '同步中...' : '同步至原始碼'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-6 border-b border-slate-800 bg-[#121922] overflow-x-auto">
          <button
            onClick={() => {
              setActiveTab('projects');
              setEditingProject(null);
            }}
            className={`py-3 px-4 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'projects' && !editingProject
                ? 'border-white text-white font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            專案列表 ({projectsList.length})
          </button>

          {editingProject && (
            <button
              onClick={() => setActiveTab('projects')}
              className="py-3 px-4 text-xs sm:text-sm font-medium border-b-2 border-indigo-400 text-indigo-300 font-bold whitespace-nowrap flex items-center gap-1.5"
            >
              <Edit2 className="w-3.5 h-3.5" />
              編輯中：{editingProject.code || '新專案'}
            </button>
          )}

          <button
            onClick={() => {
              setActiveTab('site_info');
              setEditingProject(null);
            }}
            className={`py-3 px-4 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'site_info'
                ? 'border-white text-white font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            頁首聯絡與 2026SHOWREEL
          </button>

          <button
            onClick={() => {
              setActiveTab('backup');
              setEditingProject(null);
            }}
            className={`py-3 px-4 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'backup'
                ? 'border-white text-white font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            匯出代碼 / JSON 備份
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto p-6 flex-1">
          {/* TAB 1: PROJECTS LIST & EDITOR */}
          {activeTab === 'projects' && (
            <>
              {editingProject ? (
                /* EDITING A SPECIFIC PROJECT */
                <div className="space-y-6">
                  <div className="flex items-center justify-between bg-[#192432] p-4 border border-slate-700">
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <span>編輯專案資料</span>
                        <span className="text-xs bg-indigo-900/60 text-indigo-200 px-2 py-0.5 border border-indigo-500/40">
                          {editingProject.code}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        支援自訂編號、多張 JPG/PNG/GIF 上傳及 YouTube/Vimeo 內嵌
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingProject(null)}
                        className="px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded transition-colors"
                      >
                        返回列表
                      </button>
                      <button
                        onClick={handleSaveCurrentProject}
                        className="px-4 py-1.5 text-xs bg-white text-black font-bold hover:bg-slate-200 rounded transition-colors flex items-center gap-1.5 shadow"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>儲存此專案</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column: Basic Information */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                          所屬大類別 *
                        </label>
                        <select
                          value={editingProject.category}
                          onChange={(e) =>
                            setEditingProject({
                              ...editingProject,
                              category: e.target.value as 'motion' | 'device' | 'wall',
                            })
                          }
                          className="w-full bg-[#182330] border border-slate-700 p-2.5 text-sm text-white focus:border-slate-400 focus:outline-none"
                        >
                          <option value="motion">
                            {siteConfig.categories?.motion?.name || '動態影像/錄像'} ({siteConfig.categories?.motion?.enName || 'Motion / Video'})
                          </option>
                          <option value="device">
                            {siteConfig.categories?.device?.name || '互動裝置/介面'} ({siteConfig.categories?.device?.enName || 'Installations & Interfaces'})
                          </option>
                          <option value="wall">
                            {siteConfig.categories?.wall?.name || '互動螢幕/投影'} ({siteConfig.categories?.wall?.enName || 'Screens & Projections'})
                          </option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                            作品編號 (如: 專案_001) *
                          </label>
                          <input
                            type="text"
                            value={editingProject.code}
                            onChange={(e) =>
                              setEditingProject({
                                ...editingProject,
                                code: e.target.value,
                              })
                            }
                            className="w-full bg-[#182330] border border-slate-700 p-2.5 text-sm text-white focus:border-slate-400 focus:outline-none font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                            年份 (如: 2026)
                          </label>
                          <input
                            type="text"
                            value={editingProject.year || ''}
                            onChange={(e) =>
                              setEditingProject({
                                ...editingProject,
                                year: e.target.value,
                              })
                            }
                            className="w-full bg-[#182330] border border-slate-700 p-2.5 text-sm text-white focus:border-slate-400 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                          專案全名 / Title *
                        </label>
                        <input
                          type="text"
                          value={editingProject.title}
                          onChange={(e) =>
                            setEditingProject({
                              ...editingProject,
                              title: e.target.value,
                            })
                          }
                          className="w-full bg-[#182330] border border-slate-700 p-2.5 text-sm text-white focus:border-slate-400 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                          副標題 / Subtitle
                        </label>
                        <input
                          type="text"
                          value={editingProject.subtitle || ''}
                          onChange={(e) =>
                            setEditingProject({
                              ...editingProject,
                              subtitle: e.target.value,
                            })
                          }
                          className="w-full bg-[#182330] border border-slate-700 p-2.5 text-sm text-white focus:border-slate-400 focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                            客戶 / 主辦單位
                          </label>
                          <input
                            type="text"
                            value={editingProject.client || ''}
                            onChange={(e) =>
                              setEditingProject({
                                ...editingProject,
                                client: e.target.value,
                              })
                            }
                            className="w-full bg-[#182330] border border-slate-700 p-2.5 text-sm text-white focus:border-slate-400 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                            負責職責
                          </label>
                          <input
                            type="text"
                            value={editingProject.role || ''}
                            onChange={(e) =>
                              setEditingProject({
                                ...editingProject,
                                role: e.target.value,
                              })
                            }
                            className="w-full bg-[#182330] border border-slate-700 p-2.5 text-sm text-white focus:border-slate-400 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                          使用工具與技術 (用逗號隔開)
                        </label>
                        <input
                          type="text"
                          value={toolsInput}
                          onChange={(e) => setToolsInput(e.target.value)}
                          placeholder="例如: TouchDesigner, After Effects, C4D, GLSL"
                          className="w-full bg-[#182330] border border-slate-700 p-2.5 text-sm text-white focus:border-slate-400 focus:outline-none font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                          作品文字描述 (少量文字說明) *
                        </label>
                        <textarea
                          rows={4}
                          value={editingProject.description}
                          onChange={(e) =>
                            setEditingProject({
                              ...editingProject,
                              description: e.target.value,
                            })
                          }
                          className="w-full bg-[#182330] border border-slate-700 p-2.5 text-sm text-white focus:border-slate-400 focus:outline-none leading-relaxed"
                          placeholder="敘述創作動機、互動機制、光影演繹或技術特色..."
                        />
                      </div>
                    </div>

                    {/* Right Column: Cover Image & Media Uploads (Optimized for pCloud & YouTube) */}
                    <div className="space-y-6">
                      {/* 1. Cover Photo Setup (Fixed 1 Cover) */}
                      <div className="bg-[#182330] p-4 sm:p-5 border border-slate-700 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-700/80 pb-2.5">
                          <div className="flex items-center gap-2">
                            <ImageIcon className="w-4 h-4 text-sky-400" />
                            <h4 className="text-xs font-bold font-mono text-white uppercase tracking-wider">
                              專案封面圖檔 / 影音 (Cover · 固定 1 個)
                            </h4>
                          </div>
                          {editingProject.coverMedia?.url && (
                            <span className={`text-[10px] font-mono px-2 py-0.5 border ${
                              editingProject.coverMedia.type === 'youtube'
                                ? 'bg-red-950/70 border-red-800 text-red-300'
                                : editingProject.coverMedia.type === 'vimeo'
                                ? 'bg-blue-950/70 border-blue-800 text-blue-300'
                                : editingProject.coverMedia.type === 'gif'
                                ? 'bg-purple-950/70 border-purple-800 text-purple-300'
                                : editingProject.coverMedia.type === 'video'
                                ? 'bg-amber-950/70 border-amber-800 text-amber-300'
                                : 'bg-sky-950/70 border-sky-800 text-sky-300'
                            }`}>
                              {editingProject.coverMedia.type === 'youtube'
                                ? 'YouTube 影片封面'
                                : editingProject.coverMedia.type === 'vimeo'
                                ? 'Vimeo 影片封面'
                                : editingProject.coverMedia.type === 'gif'
                                ? 'GIF 動態圖'
                                : editingProject.coverMedia.type === 'video'
                                ? 'MP4 影音'
                                : 'pCloud / 圖片連結'}
                            </span>
                          )}
                        </div>

                        {/* 16:9 Live Preview Box */}
                        <div className="relative aspect-video w-full bg-black border border-slate-700 overflow-hidden shadow-inner flex items-center justify-center">
                          {editingProject.coverMedia?.url ? (
                            <>
                              <img
                                src={getMediaThumbnailUrl(editingProject.coverMedia)}
                                alt="Cover Preview"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=800&auto=format&fit=crop';
                                }}
                              />
                              {editingProject.coverMedia.type === 'youtube' && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
                                  <div className="w-12 h-12 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg">
                                    <Play className="w-6 h-6 fill-current ml-0.5" />
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="flex flex-col items-center justify-center text-slate-500 p-4 text-center">
                              <ImageIcon className="w-8 h-8 mb-1.5 opacity-40" />
                              <span className="text-xs text-slate-400">尚未設定封面</span>
                              <span className="text-[11px] text-slate-600 mt-0.5">請在下方貼上 pCloud 圖片外鏈或 YouTube 網址</span>
                            </div>
                          )}
                        </div>

                        {/* Cover URL Input */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-mono text-slate-300 uppercase flex items-center justify-between">
                            <span>封面連結網址 (pCloud 圖床 / YouTube / 圖片外鏈) *</span>
                            {editingProject.coverMedia?.url && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingProject({
                                    ...editingProject,
                                    coverMedia: {
                                      id: editingProject.coverMedia?.id || `cov-${Date.now()}`,
                                      type: 'image',
                                      url: '',
                                      caption: editingProject.coverMedia?.caption,
                                    },
                                  });
                                }}
                                className="text-[11px] text-slate-400 hover:text-red-400 transition-colors"
                              >
                                清空
                              </button>
                            )}
                          </label>
                          <input
                            type="text"
                            value={editingProject.coverMedia?.url || ''}
                            onChange={(e) => {
                              const val = e.target.value.trim();
                              setEditingProject({
                                ...editingProject,
                                coverMedia: {
                                  id: editingProject.coverMedia?.id || `cov-${Date.now()}`,
                                  type: detectMediaType(val),
                                  url: val,
                                  caption: editingProject.coverMedia?.caption,
                                },
                              });
                            }}
                            placeholder="貼上 pCloud 圖片直接連結或 YouTube 影片網址 (如: https://...)"
                            className="w-full bg-[#121922] border border-slate-700 p-2.5 text-xs text-white focus:border-white focus:outline-none font-mono tracking-wide placeholder:text-slate-500"
                          />
                        </div>

                        {/* Cover Caption */}
                        <div>
                          <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                            封面備註標籤 (選填)
                          </label>
                          <input
                            type="text"
                            value={editingProject.coverMedia?.caption || ''}
                            onChange={(e) =>
                              setEditingProject({
                                ...editingProject,
                                coverMedia: {
                                  ...editingProject.coverMedia,
                                  caption: e.target.value,
                                },
                              })
                            }
                            placeholder="例如: 主視覺預覽 / Highlight"
                            className="w-full bg-[#121922] border border-slate-700 p-2 text-xs text-white focus:border-slate-400 focus:outline-none"
                          />
                        </div>

                        {/* Fallback local upload */}
                        <div className="pt-1 flex items-center justify-between text-[11px]">
                          <input
                            type="file"
                            ref={coverFileInputRef}
                            onChange={handleCoverFileUpload}
                            accept="image/*"
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => coverFileInputRef.current?.click()}
                            className="text-slate-400 hover:text-slate-200 underline decoration-slate-600 flex items-center gap-1"
                          >
                            <Upload className="w-3 h-3" />
                            <span>從電腦本機上傳圖片 (備用)</span>
                          </button>
                        </div>
                      </div>

                      {/* 2. Multi-Media Gallery Setup (Convenient Add & Paste) */}
                      <div className="bg-[#182330] p-4 sm:p-5 border border-slate-700 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/80 pb-3">
                          <div>
                            <h4 className="text-xs font-bold font-mono text-white uppercase tracking-wider flex items-center gap-1.5">
                              <Film className="w-4 h-4 text-emerald-400" />
                              <span>詳細展示媒體與影音清單 ({editingProject.mediaList?.length || 0})</span>
                            </h4>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              支援多筆 pCloud 圖片或 YouTube 內嵌影音
                            </p>
                          </div>

                          {/* Quick Add Buttons */}
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={handleAddNewMediaItem}
                              className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-medium flex items-center gap-1 shadow transition-colors"
                              title="新增一列媒體輸入框"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>+ 新增一筆媒體</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowBatchPasteModal(!showBatchPasteModal)}
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-medium flex items-center gap-1 transition-colors"
                              title="一次貼上多行網址快速批次建立"
                            >
                              <ListPlus className="w-3.5 h-3.5 text-indigo-300" />
                              <span>批次貼上</span>
                            </button>
                          </div>
                        </div>

                        {/* Batch Paste Drawer */}
                        {showBatchPasteModal && (
                          <div className="bg-[#121922] p-3.5 border border-indigo-900/80 space-y-2.5 animate-fadeIn">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                                <Clipboard className="w-3.5 h-3.5" />
                                <span>批次貼上多組連結 (一行一個網址)</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => setShowBatchPasteModal(false)}
                                className="text-slate-400 hover:text-white p-0.5"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <textarea
                              rows={4}
                              value={batchUrlsText}
                              onChange={(e) => setBatchUrlsText(e.target.value)}
                              placeholder={`https://u.pcloud.link/publink/show?code=...\nhttps://www.youtube.com/watch?v=...\nhttps://filedn.com/...`}
                              className="w-full bg-[#182330] border border-slate-700 p-2 text-xs text-white focus:border-indigo-400 focus:outline-none font-mono leading-relaxed placeholder:text-slate-500"
                            />
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] text-slate-400">
                                已識別 {batchUrlsText.split('\n').filter(l => l.trim().length > 0).length} 筆網址
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setShowBatchPasteModal(false)}
                                  className="px-2.5 py-1 text-xs text-slate-400 hover:text-white"
                                >
                                  取消
                                </button>
                                <button
                                  type="button"
                                  onClick={handleApplyBatchUrls}
                                  disabled={!batchUrlsText.trim()}
                                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold"
                                >
                                  一鍵全數加入清單
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Existing media items list */}
                        <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                          {(!editingProject.mediaList || editingProject.mediaList.length === 0) ? (
                            <div className="p-6 text-center border border-dashed border-slate-800 bg-[#121922]/50 space-y-2">
                              <Film className="w-8 h-8 text-slate-600 mx-auto" />
                              <p className="text-xs text-slate-400">尚未加入其他展示圖檔或內嵌影片</p>
                              <p className="text-[11px] text-slate-500">
                                點擊上方「<strong>+ 新增一筆媒體</strong>」貼上您的 pCloud 圖片或 YouTube 網址
                              </p>
                            </div>
                          ) : (
                            editingProject.mediaList.map((m, idx) => {
                              const type = m.type || detectMediaType(m.url);
                              const thumb = getMediaThumbnailUrl(m);
                              return (
                                <div
                                  key={m.id || idx}
                                  className="bg-[#121922] border border-slate-700/80 p-3 space-y-2 relative group hover:border-slate-500 transition-colors"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-xs text-slate-400 bg-slate-800 px-1.5 py-0.5 font-bold">
                                        #{idx + 1}
                                      </span>
                                      <span className={`text-[10px] font-mono px-1.5 py-0.5 border ${
                                        type === 'youtube'
                                          ? 'bg-red-950/70 border-red-800 text-red-300'
                                          : type === 'vimeo'
                                          ? 'bg-blue-950/70 border-blue-800 text-blue-300'
                                          : type === 'gif'
                                          ? 'bg-purple-950/70 border-purple-800 text-purple-300'
                                          : type === 'video'
                                          ? 'bg-amber-950/70 border-amber-800 text-amber-300'
                                          : 'bg-sky-950/70 border-sky-800 text-sky-300'
                                      }`}>
                                        {type === 'youtube'
                                          ? 'YouTube 影片'
                                          : type === 'vimeo'
                                          ? 'Vimeo 影片'
                                          : type === 'gif'
                                          ? 'GIF 動態圖'
                                          : type === 'video'
                                          ? 'MP4 影音'
                                          : 'pCloud / 圖片'}
                                      </span>
                                    </div>

                                    {/* Control Actions */}
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => handleMoveMediaItem(idx, 'up')}
                                        disabled={idx === 0}
                                        className="p-1 text-slate-400 hover:text-white disabled:opacity-20"
                                        title="上移"
                                      >
                                        <ArrowUp className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleMoveMediaItem(idx, 'down')}
                                        disabled={idx === (editingProject.mediaList?.length || 1) - 1}
                                        className="p-1 text-slate-400 hover:text-white disabled:opacity-20"
                                        title="下移"
                                      >
                                        <ArrowDown className="w-3.5 h-3.5" />
                                      </button>
                                      {m.url && (
                                        <a
                                          href={m.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="p-1 text-slate-400 hover:text-sky-300"
                                          title="在新分頁開啟測試連結"
                                        >
                                          <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveGalleryItem(idx)}
                                        className="p-1 text-slate-400 hover:text-red-400"
                                        title="刪除"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Main content: thumbnail on left, inputs on right */}
                                  <div className="flex gap-3 items-start">
                                    {/* 16:9 Micro Thumbnail */}
                                    <div className="w-20 sm:w-24 aspect-video bg-black border border-slate-700 shrink-0 overflow-hidden relative flex items-center justify-center">
                                      {thumb ? (
                                        <img
                                          src={thumb}
                                          alt={`Media ${idx + 1}`}
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).src =
                                              'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=800&auto=format&fit=crop';
                                          }}
                                        />
                                      ) : (
                                        <span className="text-[10px] text-slate-600">無連結</span>
                                      )}
                                      {type === 'youtube' && (
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                          <Play className="w-3.5 h-3.5 text-white fill-current" />
                                        </div>
                                      )}
                                    </div>

                                    {/* Inputs */}
                                    <div className="flex-1 space-y-1.5 min-w-0">
                                      <input
                                        type="text"
                                        value={m.url}
                                        onChange={(e) => handleUpdateMediaItem(idx, 'url', e.target.value)}
                                        placeholder="貼上 pCloud 圖片直接連結或 YouTube 影片網址..."
                                        className="w-full bg-[#182330] border border-slate-700 p-1.5 text-xs text-white focus:border-white focus:outline-none font-mono placeholder:text-slate-500"
                                      />
                                      <input
                                        type="text"
                                        value={m.caption || ''}
                                        onChange={(e) => handleUpdateMediaItem(idx, 'caption', e.target.value)}
                                        placeholder="展示圖說明文字 / 說明備註 (選填)..."
                                        className="w-full bg-[#182330] border border-slate-700 p-1.5 text-xs text-slate-300 focus:border-slate-400 focus:outline-none placeholder:text-slate-500"
                                      />
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>

                        {/* Extra bottom actions: quick add & file upload fallback */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-xs">
                          <button
                            type="button"
                            onClick={handleAddNewMediaItem}
                            className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>再新增一欄媒體連結</span>
                          </button>

                          <div>
                            <input
                              type="file"
                              ref={galleryFileInputRef}
                              onChange={handleGalleryFileUpload}
                              accept="image/*"
                              multiple
                              className="hidden"
                            />
                            <button
                              type="button"
                              onClick={() => galleryFileInputRef.current?.click()}
                              className="text-[11px] text-slate-400 hover:text-slate-200 underline decoration-slate-600 flex items-center gap-1"
                            >
                              <Upload className="w-3 h-3" />
                              <span>從本機多選上傳圖片 (備用)</span>
                            </button>
                          </div>
                        </div>

                        {/* Tips card for pCloud & YouTube */}
                        <div className="bg-[#121922] p-3 border border-slate-800 text-[11px] text-slate-400 space-y-1 leading-normal">
                          <div className="text-slate-300 font-semibold flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-sky-400" />
                            <span>pCloud 與 YouTube 連結使用指南：</span>
                          </div>
                          <p>• <strong>pCloud 圖床</strong>：在 pCloud 檔案按右鍵選擇「取得直接連結 (Direct Link)」或分享連結，貼入後前台即可高速讀取展示。</p>
                          <p>• <strong>YouTube 影片</strong>：支援標準網址 (youtube.com/watch?v=...) 或短網址 (youtu.be/...)，作品彈窗將自動內嵌高品質播放。</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                    <button
                      onClick={() => setEditingProject(null)}
                      className="px-4 py-2 text-xs text-slate-300 hover:text-white bg-slate-800 border border-slate-600 rounded"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleSaveCurrentProject}
                      className="px-6 py-2 text-xs bg-white text-black font-bold hover:bg-slate-200 rounded flex items-center gap-2 shadow"
                    >
                      <Save className="w-4 h-4" />
                      <span>儲存專案變更</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* PROJECTS LIST VIEW */
                <div className="space-y-4">
                  {/* Category Filter & New Button */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-[#192432] p-3 border border-slate-700">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <span className="text-xs text-slate-400 mr-1 hidden sm:inline">
                        類別篩選：
                      </span>
                      {[
                        { key: 'all', label: '全部' },
                        { key: 'motion', label: siteConfig.categories?.motion?.name || '動態影像/錄像' },
                        { key: 'device', label: siteConfig.categories?.device?.name || '互動裝置/介面' },
                        { key: 'wall', label: siteConfig.categories?.wall?.name || '互動螢幕/投影' },
                      ].map((item) => (
                        <button
                          key={item.key}
                          onClick={() =>
                            setSelectedCategoryFilter(
                              item.key as 'all' | 'motion' | 'device' | 'wall'
                            )
                          }
                          className={`px-3 py-1 text-xs font-medium border transition-colors ${
                            selectedCategoryFilter === item.key
                              ? 'bg-white text-black border-white'
                              : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSaveProjectOrder}
                        className="px-3.5 py-1.5 text-xs bg-emerald-700 hover:bg-emerald-600 text-white font-bold transition-colors shadow"
                      >
                        儲存排序
                      </button>
                      <button
                        onClick={() =>
                          handleCreateNewProject(
                            selectedCategoryFilter !== 'all'
                              ? selectedCategoryFilter
                              : 'motion'
                          )
                        }
                        className="px-3.5 py-1.5 text-xs bg-white text-black font-bold hover:bg-slate-200 transition-colors flex items-center gap-1.5 shadow"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>新增作品 (+ New)</span>
                      </button>
                    </div>
                  </div>

                  {/* Projects Table */}
                  <div className="border border-slate-700 bg-[#151f2b] divide-y divide-slate-800">
                    {filteredProjects.length === 0 ? (
                      <div className="py-12 text-center text-slate-500 text-sm">
                        此分類無任何作品項目
                      </div>
                    ) : (
                      filteredProjects.map((proj) => {
                        const originalIdx = projectsList.findIndex((p) => p.id === proj.id);
                        return (
                          <div
                            key={proj.id}
                            draggable
                            onDragStart={(event) => {
                              event.dataTransfer.effectAllowed = 'move';
                              event.dataTransfer.setData('text/plain', proj.id);
                            }}
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={(event) => {
                              event.preventDefault();
                              const sourceId = event.dataTransfer.getData('text/plain');
                              handleReorderProjects(sourceId, proj.id);
                            }}
                            className="p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-[#1b2737] transition-colors cursor-grab active:cursor-grabbing"
                          >
                            <div className="flex items-center gap-3">
                              {/* Thumbnail preview */}
                              <div className="w-16 h-10 bg-black border border-slate-700 overflow-hidden shrink-0">
                                {proj.coverMedia?.url && (
                                  <img
                                    src={proj.coverMedia.url}
                                    alt={proj.title}
                                    className="w-full h-full object-cover"
                                  />
                                )}
                              </div>

                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs font-bold text-white">
                                    {proj.code}
                                  </span>
                                  <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                                    {proj.category === 'motion'
                                      ? siteConfig.categories?.motion?.name || '動態影像/錄像'
                                      : proj.category === 'device'
                                      ? siteConfig.categories?.device?.name || '互動裝置/介面'
                                      : siteConfig.categories?.wall?.name || '互動螢幕/投影'}
                                  </span>
                                  {proj.year && (
                                    <span className="text-xs font-mono text-slate-400">
                                      {proj.year}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs sm:text-sm text-slate-200 font-medium line-clamp-1 mt-0.5">
                                  {proj.title}
                                </p>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 self-end sm:self-center">
                              <div
                                className="flex items-center gap-1 border border-slate-700 bg-slate-800 px-1.5 py-1 text-slate-400 select-none"
                                title="拖曳以排序"
                              >
                                <GripVertical className="w-3.5 h-3.5" />
                                <span className="text-[10px]">拖曳</span>
                              </div>

                              <button
                                onClick={() => handleOpenEditProject(proj)}
                                className="px-2.5 py-1 text-xs bg-indigo-900/70 hover:bg-indigo-800 text-indigo-100 border border-indigo-600/50 flex items-center gap-1 rounded"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>編輯</span>
                              </button>

                              <button
                                onClick={() => handleDeleteProject(proj.id)}
                                className="p-1 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded transition-colors"
                                title="刪除"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* TAB 2: SITE INFO & SHOWREEL */}
          {activeTab === 'site_info' && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="bg-[#182330] p-5 border border-slate-700 space-y-4">
                <h3 className="text-sm font-bold text-white border-b border-slate-700 pb-2">
                  頁首資訊 (Header Branding & Contact)
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                      主標誌 / Logo Title
                    </label>
                    <input
                      type="text"
                      value={siteConfig.logoTitle}
                      onChange={(e) =>
                        setSiteConfig({ ...siteConfig, logoTitle: e.target.value })
                      }
                      className="w-full bg-[#121922] border border-slate-700 p-2 text-sm text-white focus:border-slate-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                      副標誌 / Subtitle
                    </label>
                    <input
                      type="text"
                      value={siteConfig.logoSubtitle}
                      onChange={(e) =>
                        setSiteConfig({ ...siteConfig, logoSubtitle: e.target.value })
                      }
                      className="w-full bg-[#121922] border border-slate-700 p-2 text-sm text-white focus:border-slate-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                      聯絡電話 / Phone
                    </label>
                    <input
                      type="text"
                      value={siteConfig.phone}
                      onChange={(e) =>
                        setSiteConfig({ ...siteConfig, phone: e.target.value })
                      }
                      className="w-full bg-[#121922] border border-slate-700 p-2 text-sm text-white focus:border-slate-400 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                      電子郵件 / Email
                    </label>
                    <input
                      type="text"
                      value={siteConfig.email}
                      onChange={(e) =>
                        setSiteConfig({ ...siteConfig, email: e.target.value })
                      }
                      className="w-full bg-[#121922] border border-slate-700 p-2 text-sm text-white focus:border-slate-400 focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* 四大項目名稱與進入後中英文標題設定 */}
              <div className="bg-[#182330] p-5 border border-slate-700 space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-white border-b border-slate-700 pb-2 flex items-center justify-between">
                    <span>四大項目與頁面中英文標題設定 (Categories & Titles)</span>
                    <span className="text-[11px] text-slate-400 font-normal">順序先中文後英文</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-2">
                    自訂頂部導覽列按鈕名稱，以及進入該大分類後的中文標題與英文副標題。
                  </p>
                </div>

                {/* 1. HOME 項目 */}
                <div className="bg-[#121922] p-4 border border-slate-700 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-300 font-mono px-1.5 py-0.5 bg-slate-800 border border-slate-700">01</span>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">HOME 項目</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-mono text-slate-400 mb-1">
                        導覽按鈕名稱
                      </label>
                      <input
                        type="text"
                        value={siteConfig.categories?.home?.name || ''}
                        onChange={(e) =>
                          setSiteConfig({
                            ...siteConfig,
                            categories: {
                              ...siteConfig.categories,
                              home: {
                                ...siteConfig.categories.home,
                                name: e.target.value,
                              },
                            },
                          })
                        }
                        placeholder="HOME"
                        className="w-full bg-[#182330] border border-slate-700 p-2 text-xs text-white focus:border-slate-400 focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono text-slate-400 mb-1">
                        進入後主標題 (中文/主標)
                      </label>
                      <input
                        type="text"
                        value={siteConfig.categories?.home?.title || siteConfig.showreelTitle || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSiteConfig({
                            ...siteConfig,
                            showreelTitle: val,
                            categories: {
                              ...siteConfig.categories,
                              home: {
                                ...siteConfig.categories.home,
                                title: val,
                              },
                            },
                          });
                        }}
                        placeholder="2026 SHOWREEL"
                        className="w-full bg-[#182330] border border-slate-700 p-2 text-xs text-white focus:border-slate-400 focus:outline-none font-mono tracking-wider"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono text-slate-400 mb-1">
                        進入後副標題 (英文/副標)
                      </label>
                      <input
                        type="text"
                        value={siteConfig.categories?.home?.enName || siteConfig.showreelSubtitle || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSiteConfig({
                            ...siteConfig,
                            showreelSubtitle: val,
                            categories: {
                              ...siteConfig.categories,
                              home: {
                                ...siteConfig.categories.home,
                                enName: val,
                              },
                            },
                          });
                        }}
                        placeholder="Interactive Media & Motion Design Highlight"
                        className="w-full bg-[#182330] border border-slate-700 p-2 text-xs text-white focus:border-slate-400 focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">
                      個人簡介 (Personal Bio - 顯示於主副標題下方)
                    </label>
                    <textarea
                      rows={3}
                      value={siteConfig.personalBio !== undefined ? siteConfig.personalBio : (siteConfig.categories?.home?.description || '')}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSiteConfig({
                          ...siteConfig,
                          personalBio: val,
                          categories: {
                            ...siteConfig.categories,
                            home: {
                              ...siteConfig.categories.home,
                              description: val,
                            },
                          },
                        });
                      }}
                      placeholder="請輸入個人簡介、背景專長或設計理念..."
                      className="w-full bg-[#182330] border border-slate-700 p-2 text-xs text-white focus:border-slate-400 focus:outline-none leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">
                      個人照片連結 / Personal Photo URL
                    </label>
                    <input
                      type="url"
                      value={siteConfig.personalPhoto || ''}
                      onChange={(e) =>
                        setSiteConfig({ ...siteConfig, personalPhoto: e.target.value })
                      }
                      placeholder="https://example.com/photo.jpg"
                      className="w-full bg-[#182330] border border-slate-700 p-2 text-xs text-white focus:border-slate-400 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                {/* 2. 動態影像/錄像 項目 */}
                <div className="bg-[#121922] p-4 border border-slate-700 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-300 font-mono px-1.5 py-0.5 bg-slate-800 border border-slate-700">02</span>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">動態影像/錄像 項目 (MOTION GRAPHICS & VIDEO)</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-mono text-slate-400 mb-1">
                        導覽 / 中文標題 (先)
                      </label>
                      <input
                        type="text"
                        value={siteConfig.categories?.motion?.name || ''}
                        onChange={(e) =>
                          setSiteConfig({
                            ...siteConfig,
                            categories: {
                              ...siteConfig.categories,
                              motion: {
                                ...siteConfig.categories.motion,
                                name: e.target.value,
                              },
                            },
                          })
                        }
                        placeholder="動態影像/錄像"
                        className="w-full bg-[#182330] border border-slate-700 p-2 text-xs text-white focus:border-slate-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono text-slate-400 mb-1">
                        進入後英文標題 (後)
                      </label>
                      <input
                        type="text"
                        value={siteConfig.categories?.motion?.enName || ''}
                        onChange={(e) =>
                          setSiteConfig({
                            ...siteConfig,
                            categories: {
                              ...siteConfig.categories,
                              motion: {
                                ...siteConfig.categories.motion,
                                enName: e.target.value,
                              },
                            },
                          })
                        }
                        placeholder="MOTION GRAPHICS & VIDEO"
                        className="w-full bg-[#182330] border border-slate-700 p-2 text-xs text-white focus:border-slate-400 focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. 互動裝置/介面 項目 */}
                <div className="bg-[#121922] p-4 border border-slate-700 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-300 font-mono px-1.5 py-0.5 bg-slate-800 border border-slate-700">03</span>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">互動裝置/介面 項目 (INTERACTIVE INSTALLATIONS & INTERFACES)</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-mono text-slate-400 mb-1">
                        導覽 / 中文標題 (先)
                      </label>
                      <input
                        type="text"
                        value={siteConfig.categories?.device?.name || ''}
                        onChange={(e) =>
                          setSiteConfig({
                            ...siteConfig,
                            categories: {
                              ...siteConfig.categories,
                              device: {
                                ...siteConfig.categories.device,
                                name: e.target.value,
                              },
                            },
                          })
                        }
                        placeholder="互動裝置/介面"
                        className="w-full bg-[#182330] border border-slate-700 p-2 text-xs text-white focus:border-slate-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono text-slate-400 mb-1">
                        進入後英文標題 (後)
                      </label>
                      <input
                        type="text"
                        value={siteConfig.categories?.device?.enName || ''}
                        onChange={(e) =>
                          setSiteConfig({
                            ...siteConfig,
                            categories: {
                              ...siteConfig.categories,
                              device: {
                                ...siteConfig.categories.device,
                                enName: e.target.value,
                              },
                            },
                          })
                        }
                        placeholder="INTERACTIVE INSTALLATIONS & INTERFACES"
                        className="w-full bg-[#182330] border border-slate-700 p-2 text-xs text-white focus:border-slate-400 focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. 互動螢幕/投影 項目 */}
                <div className="bg-[#121922] p-4 border border-slate-700 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-300 font-mono px-1.5 py-0.5 bg-slate-800 border border-slate-700">04</span>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">互動螢幕/投影 項目 (INTERACTIVE SCREENS & PROJECTIONS)</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-mono text-slate-400 mb-1">
                        導覽 / 中文標題 (先)
                      </label>
                      <input
                        type="text"
                        value={siteConfig.categories?.wall?.name || ''}
                        onChange={(e) =>
                          setSiteConfig({
                            ...siteConfig,
                            categories: {
                              ...siteConfig.categories,
                              wall: {
                                ...siteConfig.categories.wall,
                                name: e.target.value,
                              },
                            },
                          })
                        }
                        placeholder="互動螢幕/投影"
                        className="w-full bg-[#182330] border border-slate-700 p-2 text-xs text-white focus:border-slate-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono text-slate-400 mb-1">
                        進入後英文標題 (後)
                      </label>
                      <input
                        type="text"
                        value={siteConfig.categories?.wall?.enName || ''}
                        onChange={(e) =>
                          setSiteConfig({
                            ...siteConfig,
                            categories: {
                              ...siteConfig.categories,
                              wall: {
                                ...siteConfig.categories.wall,
                                enName: e.target.value,
                              },
                            },
                          })
                        }
                        placeholder="INTERACTIVE SCREENS & PROJECTIONS"
                        className="w-full bg-[#182330] border border-slate-700 p-2 text-xs text-white focus:border-slate-400 focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* HOME 頁面多組 SHOWREEL 內嵌影音設定 (單一直排往下新增/刪減) */}
              <div className="bg-[#182330] p-5 border border-slate-700 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      HOME 頁面內嵌影音設定 (Showreel Videos)
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      可自訂多組影音，單一直排由上往下播放展示。包含主標題、內嵌網址與簡介。
                    </p>
                  </div>
                  <button
                    onClick={handleAddHomeVideo}
                    className="px-3 py-1.5 bg-sky-700 hover:bg-sky-600 text-xs font-semibold text-white flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>新增一組影音</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {(!siteConfig.homeVideos || siteConfig.homeVideos.length === 0) ? (
                    <div className="p-6 text-center border border-dashed border-slate-700 bg-[#121922] space-y-2">
                      <p className="text-xs text-slate-400">目前 HOME 頁面無任何內嵌影音項目（前台將乾淨隱藏此區塊，不留空方塊）</p>
                      <button
                        type="button"
                        onClick={handleAddHomeVideo}
                        className="px-3 py-1.5 bg-sky-700 hover:bg-sky-600 text-xs font-semibold text-white inline-flex items-center gap-1 transition-colors mt-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>新增首頁影片 (+ Video)</span>
                      </button>
                    </div>
                  ) : (
                    siteConfig.homeVideos.map((video, idx) => (
                      <div
                        key={video.id || idx}
                        className="bg-[#121922] p-4 border border-slate-700 space-y-3 relative"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-300 font-mono px-1.5 py-0.5 bg-slate-800 border border-slate-700">
                              VIDEO #{idx + 1}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">
                              {video.title || `SHOWREEL ${idx + 1}`}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveHomeVideo(idx)}
                            className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                            title="刪除此組影音"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-[11px] font-mono text-slate-400 mb-1">
                              Showreel 主標題 (Video Title)
                            </label>
                            <input
                              type="text"
                              value={video.title || ''}
                              onChange={(e) =>
                                handleUpdateHomeVideo(idx, 'title', e.target.value)
                              }
                              placeholder="例如: 2026 SHOWREEL"
                              className="w-full bg-[#182330] border border-slate-700 p-2 text-xs text-white focus:border-slate-400 focus:outline-none font-mono tracking-wider"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-mono text-slate-400 mb-1">
                              內嵌影片網址 (YouTube / Vimeo / MP4 直接連結，若無連結前台將自動隱藏)
                            </label>
                            <input
                              type="text"
                              value={video.url || ''}
                              onChange={(e) =>
                                handleUpdateHomeVideo(idx, 'url', e.target.value)
                              }
                              placeholder="https://www.youtube.com/watch?v=... 或 https://vimeo.com/... (留空不顯示方塊)"
                              className="w-full bg-[#182330] border border-slate-700 p-2 text-xs text-white focus:border-slate-400 focus:outline-none font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-mono text-slate-400 mb-1">
                              影片簡介文字 (Video Description)
                            </label>
                            <textarea
                              rows={2}
                              value={video.description || ''}
                              onChange={(e) =>
                                handleUpdateHomeVideo(idx, 'description', e.target.value)
                              }
                              placeholder="請輸入這組影片的簡介說明文字..."
                              className="w-full bg-[#182330] border border-slate-700 p-2 text-xs text-white focus:border-slate-400 focus:outline-none leading-relaxed"
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 最底部頁尾資訊 (Footer) 與 VIMEO 連結設定 */}
              <div className="bg-[#182330] p-5 border border-slate-700 space-y-4">
                <h3 className="text-sm font-bold text-white border-b border-slate-700 pb-2">
                  最底部資訊與社群連結設定 (Footer & Social Links)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                      最底部左側標題 (如: IH Portfolio)
                    </label>
                    <input
                      type="text"
                      value={siteConfig.footerTitle || ''}
                      onChange={(e) =>
                        setSiteConfig({ ...siteConfig, footerTitle: e.target.value })
                      }
                      placeholder="IH Portfolio"
                      className="w-full bg-[#121922] border border-slate-700 p-2 text-sm text-white focus:border-slate-400 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                      VIMEO 連結網址 (Vimeo URL)
                    </label>
                    <input
                      type="text"
                      value={siteConfig.vimeoUrl || ''}
                      onChange={(e) =>
                        setSiteConfig({ ...siteConfig, vimeoUrl: e.target.value })
                      }
                      placeholder="https://vimeo.com/..."
                      className="w-full bg-[#121922] border border-slate-700 p-2 text-sm text-white focus:border-slate-400 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                    最底部版權 / 說明資訊 (如: IH STUDIO © 2026 Interactive & Motion Media Portfolio. All rights reserved.)
                  </label>
                  <textarea
                    rows={2}
                    value={siteConfig.footerBio || ''}
                    onChange={(e) =>
                      setSiteConfig({
                        ...siteConfig,
                        footerBio: e.target.value,
                      })
                    }
                    placeholder="IH STUDIO © 2026 Interactive & Motion Media Portfolio. All rights reserved."
                    className="w-full bg-[#121922] border border-slate-700 p-2 text-sm text-white focus:border-slate-400 focus:outline-none leading-relaxed"
                  />
                </div>
              </div>

              {/* 管理者安全通行密碼與權限設定 */}
              <div className="bg-[#182330] p-5 border border-slate-700 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-sm font-bold text-white">
                      管理者安全通行密碼設定 (Admin Password & Security)
                    </h3>
                  </div>
                  <span className="text-[10px] text-indigo-300 font-mono px-2 py-0.5 bg-indigo-950/60 border border-indigo-800">
                    限定本人管理
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  開啟密碼鎖後，前台所有「管理作品」、「新增作品」、「編輯作品」按鈕對普通訪客將<strong>完全隱藏</strong>。只有您透過網址參數或頁尾小鎖頭輸入正確通行密碼才能解鎖並編輯。
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                      管理者專屬通行密碼 (Password)
                    </label>
                    <div className="relative">
                      <input
                        type={showAdminPassword ? 'text' : 'password'}
                        value={siteConfig.adminPassword ?? 'admin'}
                        onChange={(e) =>
                          setSiteConfig({ ...siteConfig, adminPassword: e.target.value })
                        }
                        placeholder="請設定管理通行密碼"
                        className="w-full bg-[#121922] border border-slate-700 p-2 pr-10 text-sm text-white focus:border-slate-400 focus:outline-none font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdminPassword(!showAdminPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        title={showAdminPassword ? '隱藏密碼' : '顯示密碼'}
                      >
                        {showAdminPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      預設為 <code className="text-indigo-300 font-mono">admin</code>，請修改為您個人的專屬私密密碼並按下儲存。
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                      本人快速登入網址 (可加入書籤)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={`${typeof window !== 'undefined' ? window.location.origin : ''}/?admin`}
                        className="w-full bg-[#121922] border border-slate-700 p-2 text-xs text-slate-300 select-all font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const url = `${window.location.origin}/?admin`;
                          navigator.clipboard.writeText(url);
                          setCopiedAdminUrl(true);
                          setTimeout(() => setCopiedAdminUrl(false), 2000);
                        }}
                        className="px-3 py-2 bg-[#223145] hover:bg-[#2c3e57] text-white text-xs font-medium border border-slate-600 shrink-0 flex items-center gap-1 transition-colors"
                        title="複製管理者快速入口網址"
                      >
                        {copiedAdminUrl ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>已複製</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>複製</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      直接造訪此網址會自動彈出密碼輸入框，方便在手機或新裝置快速登入。
                    </p>
                  </div>
                </div>

                <div className="bg-[#121922] p-3 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                  <div className="text-slate-300 font-medium">前台喚出後台驗證的專屬方式：</div>
                  <div>1. <strong>網址參數</strong>：網址後方直接加上 <code className="text-indigo-300 font-mono">/?admin</code></div>
                  <div>2. <strong>頁尾隱密鎖頭</strong>：點擊頁尾最右側的小鎖頭圖示</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                {siteConfigSaved ? (
                  <div className="text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-3 py-1.5 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    <span>網站資訊與四大項目設定已成功儲存！</span>
                  </div>
                ) : (
                  <div />
                )}

                <button
                  onClick={handleSaveSiteConfig}
                  className="px-6 py-2.5 bg-white text-black font-bold hover:bg-slate-200 transition-colors flex items-center gap-2 shadow"
                >
                  <Save className="w-4 h-4" />
                  <span>儲存設定</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: BACKUP & EXPORT CODE */}
          {activeTab === 'backup' && (
            <div className="space-y-6 max-w-2xl mx-auto">
              {/* PRIMARY SYNC TO SOURCE CODE */}
              <div className="bg-[#182330] p-5 border-2 border-emerald-600/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-400 fill-current" />
                    <h3 className="text-sm font-bold text-white">
                      固化至原始碼 (Permanent Source Code Sync)
                    </h3>
                  </div>
                  <span className="text-xs px-2.5 py-1 bg-emerald-950/80 text-emerald-300 border border-emerald-700/80 font-mono">
                    目前共有 {projectsList.length} 個作品
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  將目前畫面上還原與編輯的所有作品、分類與個人設定，<strong>直接且永久寫入伺服器 <code>src/data/initialData.ts</code> 原始碼</strong>。未來無論換瀏覽器、清除快取或重新部署，所有作品都會永久保留！
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    onClick={() => handleSyncToSource()}
                    disabled={isSyncingSource}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer"
                  >
                    <Zap className="w-4 h-4 fill-current text-yellow-300" />
                    <span>{isSyncingSource ? '正在永久寫入中...' : `立即寫入原始碼 (${projectsList.length} 個作品)`}</span>
                  </button>
                  {syncStatusMsg && (
                    <span className="text-xs font-medium text-emerald-300 bg-emerald-950/80 px-3 py-1.5 border border-emerald-800">
                      {syncStatusMsg}
                    </span>
                  )}
                </div>
              </div>

              {/* JSON FILE BACKUP & RESTORE */}
              <div className="bg-[#182330] p-5 border border-slate-700 space-y-3">
                <h3 className="text-sm font-bold text-white">
                  JSON 檔案備份與還原
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  您可以將目前所有作品清單與設定匯出為 JSON 備份檔，或選取電腦上的 JSON 備份檔進行匯入（匯入後會自動同步至原始碼）。
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={handleExportJSON}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-medium text-white flex items-center gap-2"
                  >
                    <Download className="w-4 h-4 text-emerald-300" />
                    <span>下載 JSON 備份檔</span>
                  </button>

                  <input
                    type="file"
                    ref={jsonFileInputRef}
                    onChange={handleImportJSON}
                    accept=".json"
                    className="hidden"
                  />
                  <button
                    onClick={() => jsonFileInputRef.current?.click()}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-medium text-white flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4 text-sky-300" />
                    <span>選取 JSON 檔案匯入並寫入原始碼</span>
                  </button>
                </div>

                {importError && (
                  <p className="text-xs text-red-400 bg-red-950/40 p-2 border border-red-800">
                    {importError}
                  </p>
                )}
              </div>

              {/* DIRECT JSON PASTE */}
              <div className="bg-[#182330] p-5 border border-slate-700 space-y-3">
                <h3 className="text-sm font-bold text-white">
                  直接貼上 JSON 文本匯入
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  若手邊有備份 JSON 的文字內容，可直接貼在下方框內，一鍵匯入並永久固化至伺服器原始碼：
                </p>

                <textarea
                  value={pasteJsonText}
                  onChange={(e) => setPasteJsonText(e.target.value)}
                  placeholder="在此貼上完整的 JSON 格式內容（包含 config 與 projects）..."
                  rows={4}
                  className="w-full bg-[#121922] border border-slate-700 p-2.5 text-xs text-slate-200 font-mono focus:border-indigo-500 focus:outline-none"
                />

                <button
                  type="button"
                  onClick={handleImportFromPastedJson}
                  disabled={!pasteJsonText.trim() || isSyncingSource}
                  className="px-4 py-2 bg-indigo-700 hover:bg-indigo-600 disabled:opacity-40 text-xs font-bold text-white flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>解析 JSON 文字並永久寫入原始碼</span>
                </button>
              </div>

              {/* COPY TS CODE */}
              <div className="bg-[#182330] p-5 border border-slate-700 space-y-3">
                <h3 className="text-sm font-bold text-white">
                  複製 TypeScript 預設數據代碼
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  複製包含目前所有作品的完整 TypeScript 程式碼，可手動查看或備份。
                </p>

                <button
                  onClick={handleCopyCodeSnippet}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-medium text-white flex items-center gap-2"
                >
                  {copySuccess ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>已複製 TypeScript 代碼到剪貼簿！</span>
                    </>
                  ) : (
                    <>
                      <FileCode className="w-4 h-4" />
                      <span>複製 initialData.ts 代碼</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
