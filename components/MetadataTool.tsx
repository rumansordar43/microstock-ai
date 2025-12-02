
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, X, Copy, Check, Settings, Image as ImageIcon, Loader2, 
  Sparkles, Tag, FileText, Type as TypeIcon, Key, FileType, 
  LayoutGrid, Download, Sliders, ChevronDown, ChevronUp, Trash2, Box, PenLine, 
  Square, RefreshCw, Plus, AlertTriangle, ShieldCheck
} from 'lucide-react';
import { generateImageMetadata, generateTextMetadata } from '../services/geminiService';
import { MetadataResult, BatchItem, ApiKeyData } from '../types';
import { ToastType } from './Toast';

interface Props {
  onBack: () => void;
  userApiKeys: ApiKeyData[];
  showToast?: (msg: string, type: ToastType) => void;
}

const MetadataTool: React.FC<Props> = ({ onBack, userApiKeys, showToast }) => {
  const [mode, setMode] = useState<'image' | 'text'>('image');
  
  // Batch State
  const [queue, setQueue] = useState<BatchItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const stopSignal = useRef(false);

  // Settings
  const [platform, setPlatform] = useState('Shutterstock');
  const [showAdvanced, setShowAdvanced] = useState(true);
  const [keywordCount, setKeywordCount] = useState(50);
  const [titleLength, setTitleLength] = useState(100);
  const [usePrefix, setUsePrefix] = useState(false);
  const [prefixText, setPrefixText] = useState('AI Generated');
  const [sortByRelevance, setSortByRelevance] = useState(true);
  
  // Vector Mode: If true, CSV exports will change .jpg extension to .eps
  const [vectorMode, setVectorMode] = useState(false);

  // Dropzone Handler
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newItems: BatchItem[] = acceptedFiles.map(file => {
        // Create preview only for images
        let preview = '';
        if (file.type.startsWith('image/') && !file.type.includes('svg')) {
             preview = URL.createObjectURL(file);
        }

        return {
            id: Math.random().toString(36).substr(2, 9),
            file,
            preview, // Empty for EPS/SVG
            status: 'pending'
        };
    });
    setQueue(prev => [...prev, ...newItems]);
    if(showToast) showToast(`${newItems.length} files added to queue`, 'info');
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 
        'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
        'application/postscript': ['.eps'],
        'image/svg+xml': ['.svg']
    },
    disabled: mode === 'text' || processing
  });

  // --- API Key Logic (Now using Props) ---

  const getHealthyKey = (): string | null => {
      const healthyKeys = userApiKeys.filter(k => k.status === 'active' || k.status === 'rate_limited');
      
      if (healthyKeys.length === 0) return null;

      // Simple rotation: Pick random for distribution
      const randomKey = healthyKeys[Math.floor(Math.random() * healthyKeys.length)];
      return randomKey.key;
  };

  // --- Parallel Batch Processing ---

  const processItem = async (item: BatchItem, config: any) => {
      // Get a key
      const keyToUse = getHealthyKey();
      
      if (!keyToUse) {
          throw new Error("No active API keys available. Please check User Settings.");
      }

      // Mark item as processing
      setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'processing', error: undefined } : q));

      try {
        const data = await generateImageMetadata(item.file, platform, keyToUse, config);
        
        // Success
        setQueue(prev => prev.map(q => q.id === item.id ? { 
            ...q, 
            status: 'done', 
            result: data || undefined 
        } : q));
        
        setCompletedCount(prev => prev + 1);

      } catch (error: any) {
        const msg = error.message || '';
        
        // Mark Item Error
        setQueue(prev => prev.map(q => q.id === item.id ? { 
            ...q, 
            status: 'error',
            error: msg
        } : q));
      }
  };

  const handleBatchGenerate = async () => {
    if (queue.length === 0) return;
    if (userApiKeys.length === 0) {
        if(showToast) showToast("Please add an API Key first", 'error');
        return;
    }
    
    setProcessing(true);
    setCompletedCount(0);
    stopSignal.current = false;
    if(showToast) showToast("Batch processing started...", 'info');

    // Filter pending items
    const pendingItems = queue.filter(item => item.status === 'pending' || item.status === 'error');
    if (pendingItems.length === 0) {
        setProcessing(false);
        return;
    }

    const config = {
        keywordCount,
        titleLength,
        prefix: usePrefix ? prefixText : undefined,
        sortByRelevance
    };

    // Parallelism Logic: N-1 (Backup Key Strategy) or just active count
    const activeKeyCount = userApiKeys.filter(k => k.status === 'active').length;
    const concurrency = Math.max(1, activeKeyCount); // 1 thread per key essentially
    
    // Chunk the items or use a worker pool pattern
    let currentIndex = 0;
    const activePromises: Promise<void>[] = [];

    while (currentIndex < pendingItems.length || activePromises.length > 0) {
        // Check Stop Signal
        if (stopSignal.current) {
            break;
        }

        // Fill the pool up to concurrency limit
        while (activePromises.length < concurrency && currentIndex < pendingItems.length) {
            if (stopSignal.current) break;
            
            const item = pendingItems[currentIndex];
            currentIndex++;

            const promise = processItem(item, config).then(() => {
                // Remove self from active pool when done
                activePromises.splice(activePromises.indexOf(promise), 1);
            }).catch(() => {
                 // Even on error, remove from pool
                 activePromises.splice(activePromises.indexOf(promise), 1);
            });
            
            activePromises.push(promise);
        }

        // Wait for at least one to finish before looping to add more
        if (activePromises.length > 0) {
            await Promise.race(activePromises);
        } else if (currentIndex >= pendingItems.length) {
            // No more items to add, just wait for remainder
            await Promise.all(activePromises);
            break;
        }
    }

    setProcessing(false);
    stopSignal.current = false;
    if(showToast) showToast("Batch processing completed!", 'success');
  };

  const handleStop = () => {
      stopSignal.current = true;
      if(showToast) showToast("Processing stopped by user", 'error');
  };

  const handleRegenerateItem = async (id: string) => {
      // Single item regenerate logic
      const item = queue.find(i => i.id === id);
      if(!item) return;
      
      const keyToUse = getHealthyKey();
      if(!keyToUse) { alert("No usable keys"); return; }
      
      const config = { keywordCount, titleLength, prefix: usePrefix ? prefixText : undefined, sortByRelevance };
      
      processItem(item, config);
  };

  const removeItem = (id: string) => {
    setQueue(prev => prev.filter(item => item.id !== id));
  };

  const updateItemResult = (id: string, field: keyof MetadataResult, value: any) => {
      setQueue(prev => prev.map(item => {
          if (item.id === id && item.result) {
              return { ...item, result: { ...item.result, [field]: value } };
          }
          return item;
      }));
  };

  // Smart CSV Export
  const downloadBatchCSV = () => {
      if (queue.length === 0) return;

      const completedItems = queue.filter(item => item.status === 'done' && item.result);
      if (completedItems.length === 0) {
          alert("No generated metadata to export.");
          return;
      }

      let csvContent = "";
      
      // CSV Logic ... (Same as before but memoized logic ideally)
      if (platform === 'Adobe Stock') {
          csvContent += "Filename,Title,Keywords,Category\n";
          completedItems.forEach(item => {
              const filename = vectorMode ? item.file.name.replace(/\.[^/.]+$/, "") + ".eps" : item.file.name;
              const row = [`"${filename}"`, `"${item.result!.title.replace(/"/g, '""')}"`, `"${item.result!.keywords.join(', ')}"`, `"${item.result!.category}"`];
              csvContent += row.join(",") + "\n";
          });
      } else if (platform === 'Shutterstock') {
          csvContent += "Filename,Description,Keywords,Categories\n";
          completedItems.forEach(item => {
              const filename = vectorMode ? item.file.name.replace(/\.[^/.]+$/, "") + ".eps" : item.file.name;
              const row = [`"${filename}"`, `"${item.result!.description.replace(/"/g, '""')}"`, `"${item.result!.keywords.join(', ')}"`, `"${item.result!.category}"`];
              csvContent += row.join(",") + "\n";
          });
      } else if (platform === 'Vecteezy') {
          csvContent += "Filename,Title,Description,Keywords,Category\n";
          completedItems.forEach(item => {
              const filename = vectorMode ? item.file.name.replace(/\.[^/.]+$/, "") + ".eps" : item.file.name;
              const row = [`"${filename}"`, `"${item.result!.title.replace(/"/g, '""')}"`, `"${item.result!.description.replace(/"/g, '""')}"`, `"${item.result!.keywords.join(', ')}"`, `"${item.result!.category}"`];
              csvContent += row.join(",") + "\n";
          });
      } else {
          csvContent += "Filename,Title,Description,Keywords,Category\n";
          completedItems.forEach(item => {
             const filename = vectorMode ? item.file.name.replace(/\.[^/.]+$/, "") + ".eps" : item.file.name;
              const row = [`"${filename}"`, `"${item.result!.title.replace(/"/g, '""')}"`, `"${item.result!.description.replace(/"/g, '""')}"`, `"${item.result!.keywords.join(', ')}"`, `"${item.result!.category}"`];
              csvContent += row.join(",") + "\n";
          });
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${platform.replace(" ", "_")}_Metadata_Batch_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      if(showToast) showToast("CSV Exported successfully", 'success');
  };

  const clearQueue = () => {
    if(confirm("Are you sure you want to clear all files?")) {
        setQueue([]);
        setCompletedCount(0);
    }
  };

  return (
    <div className="w-full h-full p-6 animate-fade-in max-w-[1600px] mx-auto">
      
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold dark:text-white text-slate-900 flex items-center gap-2">
            <Settings className="w-6 h-6 text-accent-cyan" />
            Metadata Generator
            <span className="text-xs px-2 py-1 rounded bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20">PRO BATCH</span>
        </h2>
        <button onClick={onBack} className="text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
            Exit Tool
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)]">
        
        {/* LEFT PANEL: CONTROLS */}
        <div className="lg:col-span-3 flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-2">
            
            {/* 1. API Keys Status */}
            <div className="glass-panel p-4 rounded-xl border dark:border-white/10 border-slate-200">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold dark:text-white text-slate-900 text-sm flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-accent-cyan" />
                        API Status
                    </h3>
                </div>
                
                <div className="space-y-2">
                    {userApiKeys.length > 0 ? (
                        <>
                        <div className="flex justify-between text-xs text-slate-500">
                             <span>Active Keys:</span>
                             <span className="font-bold text-accent-cyan">{userApiKeys.filter(k => k.status === 'active').length}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2">
                            Managed in <strong className="text-slate-300">Settings</strong>. Using multi-key rotation for parallel processing.
                        </p>
                        </>
                    ) : (
                        <div className="p-2 bg-red-500/10 border border-red-500/20 rounded">
                            <p className="text-[10px] text-red-400 font-bold mb-1">No Keys Found</p>
                            <p className="text-[10px] text-slate-500">Please go to Settings to add your Gemini API keys.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* 2. Advanced Metadata Controls */}
            <div className="glass-panel rounded-xl border dark:border-white/10 border-slate-200 overflow-hidden flex-1 flex flex-col">
                <div 
                    className="p-4 bg-slate-50 dark:bg-white/5 border-b dark:border-white/5 border-slate-200 flex justify-between items-center cursor-pointer"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                >
                    <h3 className="font-bold dark:text-white text-slate-900 text-sm flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-accent-cyan" />
                        Generation Rules
                    </h3>
                    {showAdvanced ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronUp className="w-4 h-4 text-slate-500" />}
                </div>

                {showAdvanced && (
                    <div className="p-4 space-y-6 overflow-y-auto custom-scrollbar">
                        {/* Platform Selector */}
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Target Platform (CSV)</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['Shutterstock', 'Adobe Stock', 'Freepik', 'Vecteezy', 'Getty'].map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setPlatform(p)}
                                        className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all text-left truncate ${
                                            platform === p 
                                            ? 'border-accent-cyan bg-accent-cyan/10 text-accent-cyan' 
                                            : 'border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-500 hover:border-slate-300 dark:hover:border-slate-700'
                                        }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Title Length Slider */}
                        <div>
                            <div className="flex justify-between text-xs mb-2">
                                <span className="text-slate-500">Title Length</span>
                                <span className="text-slate-900 dark:text-white font-mono">{titleLength} chars</span>
                            </div>
                            <input 
                                type="range" 
                                min="50" max="200" 
                                value={titleLength} 
                                onChange={(e) => setTitleLength(parseInt(e.target.value))}
                                className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-accent-cyan"
                            />
                        </div>

                        {/* Keyword Count Slider */}
                        <div>
                            <div className="flex justify-between text-xs mb-2">
                                <span className="text-slate-500">Keywords Count</span>
                                <span className="text-accent-cyan font-mono">{keywordCount}</span>
                            </div>
                            <input 
                                type="range" 
                                min="10" max="50" 
                                value={keywordCount} 
                                onChange={(e) => setKeywordCount(parseInt(e.target.value))}
                                className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-accent-cyan"
                            />
                        </div>

                        {/* Toggles */}
                        <div className="space-y-4 pt-2 border-t dark:border-white/5 border-slate-200">
                             
                             {/* Vector Mode */}
                             <div className="flex justify-between items-center">
                                <div className="flex flex-col">
                                    <span className="text-xs text-slate-500 font-medium">Vector Mode (.EPS)</span>
                                    <span className="text-[10px] text-slate-600 dark:text-slate-400">Rename CSV output to .eps</span>
                                </div>
                                <div 
                                    onClick={() => setVectorMode(!vectorMode)}
                                    className={`w-9 h-5 rounded-full relative cursor-pointer transition-colors ${vectorMode ? 'bg-accent-purple' : 'bg-slate-200 dark:bg-slate-800'}`}
                                >
                                    <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${vectorMode ? 'left-5' : 'left-1'}`}></div>
                                </div>
                             </div>

                             {/* Use Prefix Toggle */}
                             <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs text-slate-500 font-medium">Use Prefix</span>
                                    <div 
                                        onClick={() => setUsePrefix(!usePrefix)}
                                        className={`w-9 h-5 rounded-full relative cursor-pointer transition-colors ${usePrefix ? 'bg-accent-cyan' : 'bg-slate-200 dark:bg-slate-800'}`}
                                    >
                                        <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${usePrefix ? 'left-5' : 'left-1'}`}></div>
                                    </div>
                                </div>
                                
                                {usePrefix && (
                                    <input 
                                        type="text"
                                        value={prefixText}
                                        onChange={(e) => setPrefixText(e.target.value)}
                                        className="w-full px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 border dark:border-slate-700 border-slate-200 text-xs dark:text-white text-slate-900 outline-none focus:border-accent-cyan transition-colors"
                                        placeholder="e.g. AI Generated"
                                    />
                                )}
                             </div>

                             {/* Sort by Relevance Toggle */}
                             <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-500 font-medium">Sort by Relevance</span>
                                <div 
                                    onClick={() => setSortByRelevance(!sortByRelevance)}
                                    className={`w-9 h-5 rounded-full relative cursor-pointer transition-colors ${sortByRelevance ? 'bg-accent-cyan' : 'bg-slate-200 dark:bg-slate-800'}`}
                                >
                                    <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${sortByRelevance ? 'left-5' : 'left-1'}`}></div>
                                </div>
                             </div>

                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* RIGHT PANEL: BATCH WORKSPACE */}
        <div className="lg:col-span-9 flex flex-col gap-6 h-full overflow-hidden">
            
            {/* 1. Upload & Action Area */}
            <div className="glass-panel p-6 rounded-2xl border dark:border-white/10 border-slate-200 flex-shrink-0">
                <div className="flex justify-between items-start mb-4">
                     <div>
                        <h3 className="font-bold dark:text-white text-slate-900 flex items-center gap-2">
                            <ImageIcon className="w-5 h-5 text-accent-purple" />
                            Batch Queue ({queue.length})
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                            Supports 500+ files. Images, EPS, SVG. Add multiple keys for speed.
                        </p>
                     </div>
                     <div className="flex gap-3">
                         {queue.length > 0 && (
                             <button 
                                onClick={clearQueue}
                                disabled={processing}
                                className="px-3 py-1.5 rounded-lg border border-red-500/20 text-red-500 hover:bg-red-500/10 text-xs font-bold transition-colors disabled:opacity-50"
                             >
                                Clear All
                             </button>
                         )}
                         
                         {processing ? (
                             <button 
                                onClick={handleStop}
                                className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg text-sm flex items-center gap-2 transition-all shadow-lg"
                             >
                                <Square className="w-4 h-4 fill-current" />
                                Stop
                             </button>
                         ) : (
                             <button 
                                onClick={handleBatchGenerate}
                                disabled={queue.length === 0}
                                className="px-5 py-2 bg-accent-cyan hover:bg-accent-cyan/90 text-black font-bold rounded-lg text-sm flex items-center gap-2 transition-all shadow-lg shadow-accent-cyan/20 disabled:opacity-50 disabled:shadow-none"
                            >
                                <Sparkles className="w-4 h-4" />
                                Generate Batch
                            </button>
                         )}
                     </div>
                </div>

                <div 
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-xl h-24 flex items-center justify-center cursor-pointer transition-all ${
                        isDragActive 
                        ? 'border-accent-cyan bg-accent-cyan/5' 
                        : 'dark:border-slate-700 border-slate-300 hover:border-slate-400 dark:hover:border-slate-600 dark:bg-slate-900/30 bg-slate-50'
                    }`}
                >
                    <input {...getInputProps()} />
                    <div className="text-center flex flex-col items-center">
                        <Upload className="w-5 h-5 text-slate-400 mb-1" />
                        <p className="text-sm dark:text-slate-300 text-slate-700 font-medium">
                            Drag & Drop Images, EPS, SVG (Max 500)
                        </p>
                    </div>
                </div>
                
                {/* Progress Bar */}
                {processing && (
                    <div className="mt-4 h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden relative">
                        <motion.div 
                           className="h-full bg-accent-cyan"
                           initial={{ width: 0 }}
                           animate={{ width: `${queue.length > 0 ? (completedCount / queue.length) * 100 : 0}%` }}
                        />
                    </div>
                )}
            </div>

            {/* 2. Queue List / Results */}
            <div className="flex-1 glass-panel rounded-2xl p-4 border dark:border-white/10 border-slate-200 overflow-hidden flex flex-col relative min-h-[300px]">
                {queue.length === 0 ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 opacity-50 pointer-events-none">
                        <Box className="w-16 h-16 mb-4 stroke-1" />
                        <p className="text-lg font-medium">Queue is Empty</p>
                        <p className="text-sm">Upload files to begin batch processing.</p>
                    </div>
                ) : (
                    <>
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                        {queue.map((item, index) => (
                            <QueueItem 
                                key={item.id} 
                                item={item} 
                                onRemove={() => removeItem(item.id)}
                                onUpdate={updateItemResult}
                                onRegenerate={() => handleRegenerateItem(item.id)}
                                platform={platform}
                                isProcessingBatch={processing}
                                showToast={showToast}
                            />
                        ))}
                    </div>
                    
                    {/* Bulk Actions */}
                    <div className="pt-4 mt-4 border-t dark:border-white/5 border-slate-200 flex justify-between items-center">
                        <span className="text-xs text-slate-500 font-medium">
                            {queue.filter(i => i.status === 'done').length} Completed
                        </span>
                        <button 
                            onClick={downloadBatchCSV}
                            disabled={queue.filter(i => i.status === 'done').length === 0}
                            className="px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg text-sm flex items-center gap-2 transition-all shadow-lg hover:shadow-green-500/20 disabled:opacity-50 disabled:shadow-none"
                        >
                            <Download className="w-4 h-4" /> Download Batch CSV
                        </button>
                    </div>
                    </>
                )}
            </div>

        </div>
      </div>
    </div>
  );
};

// Memoized Sub-component for individual queue item to improve performance with large lists
const QueueItem = React.memo(({ 
    item, 
    onRemove, 
    onUpdate, 
    onRegenerate, 
    platform, 
    isProcessingBatch,
    showToast
}: { 
    item: BatchItem; 
    onRemove: () => void;
    onUpdate: (id: string, field: keyof MetadataResult, value: any) => void;
    onRegenerate: () => void;
    platform: string;
    isProcessingBatch: boolean;
    showToast?: (msg: string, type: ToastType) => void;
}) => {
    const [expanded, setExpanded] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const handleCopy = (text: string, fieldName: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(fieldName);
        if(showToast) showToast('Copied', 'info');
        setTimeout(() => setCopiedField(null), 2000);
    };
    
    return (
        <div className={`rounded-xl border transition-all ${
            item.status === 'done' 
            ? 'dark:bg-slate-900/50 bg-slate-50 border-green-500/30' 
            : item.status === 'processing'
                ? 'dark:bg-slate-900/50 bg-slate-50 border-accent-cyan/30'
                : item.status === 'error'
                    ? 'dark:bg-slate-900/30 bg-red-50 border-red-200 dark:border-red-900/50'
                    : 'dark:bg-slate-900/30 bg-white border-slate-200 dark:border-slate-800'
        }`}>
            {/* Header Row */}
            <div className="p-3 flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-slate-800 overflow-hidden flex-shrink-0 relative flex items-center justify-center">
                    {item.preview ? (
                        <img src={item.preview} alt="thumb" className="w-full h-full object-cover" />
                    ) : (
                        <FileType className="w-6 h-6 text-slate-400" />
                    )}
                    
                    {item.status === 'processing' && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Loader2 className="w-5 h-5 text-white animate-spin" />
                        </div>
                    )}
                    {item.status === 'done' && (
                        <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                            <Check className="w-5 h-5 text-green-400" />
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium dark:text-slate-200 text-slate-700 truncate">{item.file.name}</p>
                    <p className="text-[10px] text-slate-500">
                        {item.status === 'pending' && 'Ready to process'}
                        {item.status === 'processing' && <span className="text-accent-cyan">Analyzing...</span>}
                        {item.status === 'done' && <span className="text-green-500">Metadata Generated</span>}
                        {item.status === 'error' && <span className="text-red-500 font-bold">{item.error || "Error Generating"}</span>}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {(item.status === 'done' || item.status === 'error') && !isProcessingBatch && (
                         <button 
                            onClick={onRegenerate}
                            title="Regenerate Metadata"
                            className="p-2 rounded hover:bg-accent-cyan/10 hover:text-accent-cyan text-slate-500 transition-colors"
                         >
                            <RefreshCw className="w-4 h-4" />
                         </button>
                    )}
                    
                    {item.status === 'done' && (
                         <button 
                            onClick={() => setExpanded(!expanded)}
                            title="Edit"
                            className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                         >
                            {expanded ? <ChevronUp className="w-4 h-4" /> : <PenLine className="w-4 h-4" />}
                         </button>
                    )}
                    <button onClick={onRemove} className="p-2 rounded hover:bg-red-500/10 text-slate-500 hover:text-red-500 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Expanded Editor */}
            {expanded && item.result && (
                <div className="p-4 border-t dark:border-white/5 border-slate-200 bg-slate-50 dark:bg-black/20 space-y-3">
                    
                    {/* Title */}
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-[10px] uppercase font-bold text-slate-500">Title</label>
                            <button 
                                onClick={() => handleCopy(item.result!.title, 'title')}
                                className="text-[10px] flex items-center gap-1 text-slate-500 hover:text-accent-cyan transition-colors"
                            >
                                {copiedField === 'title' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                                {copiedField === 'title' ? 'Copied' : 'Copy'}
                            </button>
                        </div>
                        <input 
                            type="text" 
                            value={item.result.title}
                            onChange={(e) => onUpdate(item.id, 'title', e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 dark:text-slate-200 outline-none focus:border-accent-cyan"
                        />
                    </div>

                    {/* Description - Hidden for Adobe Stock */}
                    {platform !== 'Adobe Stock' && (
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-[10px] uppercase font-bold text-slate-500">Description</label>
                                <button 
                                    onClick={() => handleCopy(item.result!.description, 'description')}
                                    className="text-[10px] flex items-center gap-1 text-slate-500 hover:text-accent-cyan transition-colors"
                                >
                                    {copiedField === 'description' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                                    {copiedField === 'description' ? 'Copied' : 'Copy'}
                                </button>
                            </div>
                            <textarea 
                                value={item.result.description}
                                onChange={(e) => onUpdate(item.id, 'description', e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 dark:text-slate-200 outline-none focus:border-accent-cyan min-h-[50px]"
                            />
                        </div>
                    )}

                    {/* Category */}
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-[10px] uppercase font-bold text-slate-500">Category</label>
                            <button 
                                onClick={() => handleCopy(item.result!.category, 'category')}
                                className="text-[10px] flex items-center gap-1 text-slate-500 hover:text-accent-cyan transition-colors"
                            >
                                {copiedField === 'category' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                                {copiedField === 'category' ? 'Copied' : 'Copy'}
                            </button>
                        </div>
                        <input 
                            type="text" 
                            value={item.result.category}
                            onChange={(e) => onUpdate(item.id, 'category', e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 dark:text-slate-200 outline-none focus:border-accent-cyan"
                        />
                    </div>

                    {/* Keywords */}
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-[10px] uppercase font-bold text-slate-500">Keywords ({item.result.keywords.length})</label>
                            <button 
                                onClick={() => handleCopy(item.result!.keywords.join(', '), 'keywords')}
                                className="text-[10px] flex items-center gap-1 text-slate-500 hover:text-accent-cyan transition-colors"
                            >
                                {copiedField === 'keywords' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                                {copiedField === 'keywords' ? 'Copied' : 'Copy'}
                            </button>
                        </div>
                        <textarea 
                            value={item.result.keywords.join(', ')}
                            onChange={(e) => onUpdate(item.id, 'keywords', e.target.value.split(',').map(s => s.trim()))}
                            className="w-full px-3 py-2 text-xs rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 dark:text-slate-200 outline-none focus:border-accent-cyan min-h-[60px]"
                        />
                    </div>
                </div>
            )}
        </div>
    );
});

export default MetadataTool;
