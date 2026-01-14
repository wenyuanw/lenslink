
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { PhotoGroup, SelectionState, GroupStatus, ExportMode } from './types';
import { groupFiles } from './utils/fileHelpers';
import { analyzeSession } from './services/geminiService';
import Viewer from './components/Viewer';
import ConfirmationModal from './components/ConfirmationModal';

const App: React.FC = () => {
  const [photos, setPhotos] = useState<PhotoGroup[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [animationClass, setAnimationClass] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'PICKED' | 'REJECTED' | 'UNMARKED' | 'ORPHANS'>('ALL');
  
  // Modals
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showExportConfirm, setShowExportConfirm] = useState(false);
  const [exportMode, setExportMode] = useState<ExportMode>('BOTH');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const filmstripRef = useRef<HTMLDivElement>(null);

  const stats = useMemo(() => {
    return {
      total: photos.length,
      picked: photos.filter(p => p.selection === SelectionState.PICKED).length,
      rejected: photos.filter(p => p.selection === SelectionState.REJECTED).length,
      orphans: photos.filter(p => p.status !== GroupStatus.COMPLETE).length,
      unmarked: photos.filter(p => p.selection === SelectionState.UNMARKED).length,
    };
  }, [photos]);

  const filteredPhotos = useMemo(() => {
    switch(filter) {
      case 'PICKED': return photos.filter(p => p.selection === SelectionState.PICKED);
      case 'REJECTED': return photos.filter(p => p.selection === SelectionState.REJECTED);
      case 'UNMARKED': return photos.filter(p => p.selection === SelectionState.UNMARKED);
      case 'ORPHANS': return photos.filter(p => p.status !== GroupStatus.COMPLETE);
      default: return photos;
    }
  }, [photos, filter]);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const fileList = Array.from(e.target.files) as File[];
    const newGroups = await groupFiles(fileList);
    setPhotos(prev => [...prev, ...newGroups]);
    if (selectedIndex === null && newGroups.length > 0) setSelectedIndex(0);
  };

  const currentPhoto = selectedIndex !== null ? filteredPhotos[selectedIndex] : null;

  const navigate = useCallback((direction: 'prev' | 'next') => {
    if (selectedIndex === null || filteredPhotos.length === 0) return;
    if (direction === 'next') {
      setSelectedIndex((selectedIndex + 1) % filteredPhotos.length);
    } else {
      setSelectedIndex((selectedIndex - 1 + filteredPhotos.length) % filteredPhotos.length);
    }
  }, [selectedIndex, filteredPhotos.length]);

  const updateSelection = useCallback((state: SelectionState) => {
    if (selectedIndex === null || !currentPhoto) return;

    // Trigger animation
    if (state === SelectionState.PICKED) setAnimationClass('animate-pick');
    if (state === SelectionState.REJECTED) setAnimationClass('animate-reject');

    // Small delay to allow animation before updating state and navigating
    setTimeout(() => {
      setPhotos(prev => prev.map(p => p.id === currentPhoto.id ? { ...p, selection: state } : p));
      setAnimationClass('');
      navigate('next');
    }, 400);
  }, [selectedIndex, currentPhoto, navigate]);

  const executeFinalDelete = () => {
    setPhotos(prev => prev.filter(p => p.selection !== SelectionState.REJECTED));
    setShowDeleteConfirm(false);
    setSelectedIndex(photos.length > 0 ? 0 : null);
  };

  const handleExportStart = (mode: ExportMode) => {
    if (stats.picked === 0) {
      alert("No photos are picked for export.");
      return;
    }
    setExportMode(mode);
    setShowExportConfirm(true);
  };

  const executeExport = async () => {
    try {
      // In a modern browser, we use the File System Access API
      if ('showDirectoryPicker' in window) {
        const handle = await (window as any).showDirectoryPicker();
        alert(`Export successful! Successfully "simulated" copy to ${handle.name}. In a real desktop app, files would be physically moved.`);
      } else {
        alert(`Exporting ${stats.picked} groups to local storage. (Standard browser fallback)`);
      }
    } catch (e) {
      console.warn("Export cancelled or failed:", e);
    }
    setShowExportConfirm(false);
  };

  const getAiInsight = async () => {
    setIsAnalyzing(true);
    const insight = await analyzeSession(stats);
    setAiInsight(insight);
    setIsAnalyzing(false);
  };

  // Shortcut handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIndex === null) return;
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')) return;

      switch(e.key.toLowerCase()) {
        case 'arrowright': navigate('next'); break;
        case 'arrowleft': navigate('prev'); break;
        case 'p': updateSelection(SelectionState.PICKED); break;
        case 'x': updateSelection(SelectionState.REJECTED); break;
        case 'u': updateSelection(SelectionState.UNMARKED); break;
        case ' ': e.preventDefault(); /* Preview handled by being in the viewer */ break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, navigate, updateSelection]);

  // Scroll filmstrip to active index
  useEffect(() => {
    if (selectedIndex !== null && filmstripRef.current) {
      const activeEl = filmstripRef.current.children[selectedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [selectedIndex]);

  return (
    <div className="flex flex-col h-screen bg-zinc-950 select-none">
      {/* Top Nav */}
      <nav className="h-14 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-md flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center rotate-3 shadow-lg shadow-indigo-500/20">
              <i className="fa-solid fa-camera-retro text-xs text-white"></i>
            </div>
            <span className="font-black text-sm tracking-tighter uppercase text-zinc-100">LensLink Pro</span>
          </div>

          <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800/50">
            {(['ALL', 'PICKED', 'REJECTED', 'UNMARKED', 'ORPHANS'] as const).map(f => (
              <button 
                key={f} 
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${filter === f ? 'bg-zinc-800 text-white shadow-inner' : 'text-zinc-600 hover:text-zinc-300'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-zinc-950 rounded-lg border border-zinc-800/50 overflow-hidden">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 text-[11px] font-bold text-zinc-400 hover:bg-zinc-900 border-r border-zinc-800/50 flex items-center gap-2 transition-colors"
            >
              <i className="fa-solid fa-file-circle-plus"></i> Import Files
            </button>
            <button 
              onClick={() => folderInputRef.current?.click()}
              className="px-4 py-2 text-[11px] font-bold text-zinc-400 hover:bg-zinc-900 flex items-center gap-2 transition-colors"
            >
              <i className="fa-solid fa-folder-open"></i> Import Folder
            </button>
          </div>

          <button 
             onClick={() => setShowDeleteConfirm(true)}
             disabled={stats.rejected === 0}
             className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/30 rounded-lg text-[11px] font-bold transition-all disabled:opacity-30 disabled:pointer-events-none"
          >
            <i className="fa-solid fa-trash-can mr-2"></i> Confirm {stats.rejected} Rejects
          </button>

          <div className="relative group">
            <button 
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-bold shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all"
            >
              <i className="fa-solid fa-paper-plane"></i> Export Picks
            </button>
            <div className="absolute top-full right-0 mt-2 w-44 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl invisible group-hover:visible z-50 p-1 flex flex-col">
               <button onClick={() => handleExportStart('JPG')} className="px-4 py-2.5 text-[10px] font-bold text-zinc-400 hover:bg-zinc-800 hover:text-white text-left rounded-lg transition-colors">JPG ONLY</button>
               <button onClick={() => handleExportStart('RAW')} className="px-4 py-2.5 text-[10px] font-bold text-zinc-400 hover:bg-zinc-800 hover:text-white text-left rounded-lg transition-colors">RAW ONLY</button>
               <button onClick={() => handleExportStart('BOTH')} className="px-4 py-2.5 text-[10px] font-bold text-zinc-400 hover:bg-zinc-800 hover:text-white text-left rounded-lg transition-colors border-t border-zinc-800 mt-1 pt-2">RAW + JPG</button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {photos.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900 to-zinc-950 p-20 text-center">
            <div className="w-24 h-24 bg-zinc-900 rounded-3xl flex items-center justify-center mb-8 border border-zinc-800 shadow-2xl relative">
              <i className="fa-solid fa-images text-4xl text-zinc-700"></i>
              <div className="absolute -top-3 -right-3 w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white border-4 border-zinc-950">
                <i className="fa-solid fa-plus text-sm"></i>
              </div>
            </div>
            <h2 className="text-3xl font-black text-white mb-3 tracking-tighter uppercase">Ready for your shoot?</h2>
            <p className="max-w-md text-zinc-500 text-lg font-medium leading-snug">
              Import a folder or selection of files. We'll automatically pair your RAW and JPG files for consistent management.
            </p>
          </div>
        ) : (
          <>
            {/* Viewer Component */}
            {currentPhoto && (
              <Viewer group={currentPhoto} animationClass={animationClass} />
            )}

            {/* Filmstrip / Thumbnails */}
            <div className="h-28 bg-zinc-900 border-t border-zinc-800 flex items-center px-4 gap-2 overflow-x-auto overflow-y-hidden" ref={filmstripRef}>
               {filteredPhotos.map((p, idx) => (
                 <button 
                  key={p.id}
                  onClick={() => setSelectedIndex(idx)}
                  className={`flex-shrink-0 h-20 w-32 relative rounded-md overflow-hidden border-2 transition-all group ${
                    selectedIndex === idx ? 'border-indigo-500 scale-105 z-10' : 'border-transparent opacity-60 hover:opacity-100 hover:border-zinc-700'
                  }`}
                 >
                   <img 
                    src={p.jpg?.previewUrl || p.raw?.previewUrl} 
                    className="w-full h-full object-cover" 
                    alt={p.id} 
                   />
                   
                   {/* Selection Marker */}
                   {p.selection === SelectionState.PICKED && <div className="absolute inset-0 border-4 border-emerald-500/50 bg-emerald-500/10 flex items-center justify-center"><i className="fa-solid fa-flag text-emerald-500 text-xs"></i></div>}
                   {p.selection === SelectionState.REJECTED && <div className="absolute inset-0 border-4 border-rose-500/50 bg-rose-500/20 flex items-center justify-center"><i className="fa-solid fa-xmark text-rose-500 text-xs"></i></div>}
                   
                   <div className="absolute bottom-0 left-0 right-0 p-1 bg-black/60 backdrop-blur-sm text-[8px] text-zinc-400 font-mono truncate">
                     {p.id}
                   </div>
                 </button>
               ))}
            </div>
          </>
        )}
      </main>

      {/* Hidden Inputs */}
      <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleImport} accept=".jpg,.jpeg,.arw,.cr2,.nef,.dng" />
      {/* Fix: use any spread to allow non-standard webkitdirectory attribute in React with TypeScript */}
      <input type="file" {...({ webkitdirectory: "" } as any)} className="hidden" ref={folderInputRef} onChange={handleImport} />

      {/* Modals */}
      {showDeleteConfirm && (
        <ConfirmationModal 
          title="Confirm Deletion"
          confirmLabel="Purge Files"
          type="delete"
          groups={photos.filter(p => p.selection === SelectionState.REJECTED)}
          onConfirm={executeFinalDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
      
      {showExportConfirm && (
        <ConfirmationModal 
          title="Export Selected"
          confirmLabel={`Export as ${exportMode}`}
          type="export"
          groups={photos.filter(p => p.selection === SelectionState.PICKED)}
          onConfirm={executeExport}
          onCancel={() => setShowExportConfirm(false)}
        />
      )}

      {/* Footer Info / Insight */}
      <footer className="h-10 bg-zinc-950 border-t border-zinc-800 px-6 flex items-center justify-between text-[10px] text-zinc-500 z-20">
        <div className="flex gap-4">
          <span>{stats.total} TOTAL</span>
          <span className="text-emerald-500 font-bold">{stats.picked} PICKED</span>
          <span className="text-rose-500 font-bold">{stats.rejected} STAGED FOR TRASH</span>
          <span className="text-amber-500 font-bold">{stats.orphans} ORPHANS</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 max-w-md truncate italic text-zinc-400">
            <i className="fa-solid fa-sparkles text-indigo-400"></i>
            {aiInsight || "Press the wand icon in sidebar for session analysis."}
          </div>
          <button 
            onClick={getAiInsight}
            disabled={isAnalyzing || photos.length === 0}
            className="hover:text-indigo-400 transition-colors disabled:opacity-0"
          >
            <i className={`fa-solid fa-wand-magic-sparkles ${isAnalyzing ? 'animate-spin' : ''}`}></i>
          </button>
        </div>
      </footer>
    </div>
  );
};

export default App;
