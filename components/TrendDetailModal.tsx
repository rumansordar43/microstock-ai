
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Download, Loader2, Check, Wand2, RefreshCw, Heart, Lightbulb, ChevronDown, Palette, Monitor, Ban, ThumbsUp, ThumbsDown, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { TrendItem, GeneratedPrompt, PromptStyle, ApiKeyData } from '../types';
import { generateMicrostockPrompts } from '../services/geminiService';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ToastType } from './Toast';

interface Props {
  trend: TrendItem | null;
  onClose: () => void;
  // This must be the USER'S keys
  userApiKeys?: ApiKeyData[];
  onOpenSettings?: () => void;
  showToast?: (msg: string, type: ToastType) => void;
}

// Mock chart data for visualization
const generateChartData = () => 
  Array.from({ length: 7 }, (_, i) => ({
    name: `Day ${i + 1}`,
    value: Math.floor(Math.random() * 50) + 50
  }));

const STYLES: PromptStyle[] = ['Photorealistic', 'Vector Illustration', '3D Render', 'Flat Icon', 'Watercolor', 'Line Art'];

const TrendDetailModal: React.FC<Props> = ({ trend, onClose, userApiKeys, onOpenSettings, showToast }) => {
  const [promptCount, setPromptCount] = useState<number>(10);
  const [selectedStyle, setSelectedStyle] = useState<PromptStyle>('Photorealistic');
  const [prompts, setPrompts] = useState<GeneratedPrompt[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isStyleOpen, setIsStyleOpen] = useState(false);
  
  // Reset state when trend changes
  useEffect(() => {
    setPrompts([]);
    setLoading(false);
    setIsFavorite(false);
  }, [trend]);

  if (!trend) return null;

  // Determine valid keys (active only)
  const validKeys = userApiKeys?.filter(k => k.status === 'active') || [];

  const handleGenerate = async () => {
    if (validKeys.length === 0) {
        return; // UI Blocks, safety return
    }
    
    // Pick random key from valid list for rotation
    const activeKey = validKeys[Math.floor(Math.random() * validKeys.length)].key;

    setLoading(true);
    try {
      // Collect feedback from existing prompts to refine generation
      const liked = prompts.filter(p => p.rating === 'good').map(p => p.text);
      const disliked = prompts.filter(p => p.rating === 'bad').map(p => p.text);
      const feedback = { liked, disliked };

      const results = await generateMicrostockPrompts(
          trend.title, 
          trend.keywords, 
          promptCount, 
          selectedStyle, 
          feedback,
          activeKey
      );
      setPrompts(results);
      if(showToast) showToast('Prompts generated successfully!', 'success');
    } catch (e) {
      console.error(e);
      if(showToast) showToast('Generation failed. Check API Keys.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRate = (id: string, rating: 'good' | 'bad') => {
    setPrompts(prev => prev.map(p => {
        if (p.id !== id) return p;
        // Toggle off if clicking same rating
        if (p.rating === rating) return { ...p, rating: undefined };
        return { ...p, rating };
    }));
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    if(showToast) showToast('Prompt copied to clipboard', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAll = () => {
    const allText = prompts.map(p => p.text).join('\n\n');
    navigator.clipboard.writeText(allText);
    if(showToast) showToast('All prompts copied!', 'success');
  };

  const downloadFile = (format: 'txt' | 'csv') => {
    if (prompts.length === 0) return;
    
    let content = '';
    let mimeType = 'text/plain';
    let extension = 'txt';

    if (format === 'csv') {
      content = 'ID,Positive Prompt,Negative Prompt,Aspect Ratio,Rating\n' + 
        prompts.map(p => `${p.id},"${p.text.replace(/"/g, '""')}","${(p.negativePrompt || '').replace(/"/g, '""')}","${p.aspectRatio || ''}","${p.rating || ''}"`).join('\n');
      mimeType = 'text/csv';
      extension = 'csv';
    } else {
      content = prompts.map(p => 
        `[ID: ${p.id}]\nRATING: ${p.rating || 'N/A'}\nPOSITIVE: ${p.text}\nNEGATIVE: ${p.negativePrompt || 'N/A'}\nAR: ${p.aspectRatio || 'N/A'}\n-------------------`
      ).join('\n\n');
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${trend.title.replace(/\s+/g, '_')}_${selectedStyle.replace(/\s+/g, '')}_prompts.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    if(showToast) showToast(`Downloaded .${extension.toUpperCase()} file`, 'success');
  };

  const hasFeedback = prompts.some(p => p.rating === 'good' || p.rating === 'bad');

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/90 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="dark:bg-[#0f172a] bg-white border dark:border-slate-700 border-slate-200 w-full max-w-7xl max-h-[95vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl"
        >
          {/* Header */}
          <div className="p-6 border-b dark:border-slate-800 border-slate-100 flex justify-between items-center dark:bg-[#0f172a] bg-white relative overflow-hidden shrink-0">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent-cyan via-purple-500 to-accent-cyan opacity-50" />
            <div className="relative z-10 flex items-start gap-4">
              <div>
                <h2 className="text-3xl font-bold dark:text-white text-slate-900 flex items-center gap-3">
                  {trend.title}
                  <span className={`text-xs px-2.5 py-1 rounded-md border font-mono uppercase tracking-wide ${trend.competition === 'Low' ? 'border-green-500/50 text-green-600 dark:text-green-400 bg-green-500/10' : 'border-yellow-500/50 text-yellow-600 dark:text-yellow-400 bg-yellow-500/10'}`}>
                    {trend.competition} Comp
                  </span>
                </h2>
                <p className="dark:text-slate-400 text-slate-500 text-sm mt-1">{trend.category} • High Commercial Value</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
                 <button 
                    onClick={() => setIsFavorite(!isFavorite)}
                    className={`p-3 rounded-full border transition-all ${isFavorite ? 'bg-red-500/20 border-red-500 text-red-500' : 'dark:bg-slate-800 bg-slate-100 dark:border-slate-700 border-slate-200 dark:text-slate-400 text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                 >
                    <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                 </button>
                <button onClick={onClose} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors dark:text-slate-400 text-slate-500 hover:text-slate-900 dark:hover:text-white">
                    <X className="w-6 h-6" />
                </button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
            
            {/* Left Column: Analytics, Concepts & Config (Scrollable) */}
            <div className="lg:w-[400px] xl:w-[450px] dark:bg-[#0b1120] bg-slate-50 dark:border-r border-slate-800 border-r-slate-200 overflow-y-auto p-6 space-y-6 custom-scrollbar shrink-0">
              
              {/* Chart */}
              <div className="glass-panel p-5 rounded-2xl relative overflow-hidden dark:bg-white/5 bg-white">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold dark:text-slate-300 text-slate-600 uppercase tracking-wider">Trend Interest</h3>
                    <span className="text-xs text-green-600 dark:text-green-400 bg-green-500/10 px-2 py-1 rounded">+12% this week</span>
                </div>
                <div className="h-28 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={generateChartData()}>
                      <defs>
                        <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" hide />
                      <YAxis hide />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} 
                        itemStyle={{ color: '#22d3ee' }}
                      />
                      <Area type="monotone" dataKey="value" stroke="#22d3ee" strokeWidth={2} fillOpacity={1} fill="url(#colorVal)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Design Concepts */}
              <div className="glass-panel p-5 rounded-2xl border-l-2 border-l-yellow-500/50 dark:bg-white/5 bg-white">
                 <h3 className="text-sm font-bold dark:text-white text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-500" />
                    Commercial Concepts
                 </h3>
                 <ul className="space-y-3">
                   {trend.concepts?.map((concept, i) => (
                     <li key={i} className="text-sm dark:text-slate-300 text-slate-600 leading-relaxed flex items-start gap-2">
                       <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-yellow-500/50 shrink-0" />
                       {concept}
                     </li>
                   )) || <p className="text-slate-500 text-sm italic">No specific concepts loaded.</p>}
                 </ul>
              </div>

              {/* Keywords */}
              <div>
                 <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Target Keywords</h3>
                 <div className="flex flex-wrap gap-2">
                   {trend.keywords.map((kw, i) => (
                     <span key={i} className="px-3 py-1.5 rounded-lg dark:bg-slate-800/50 bg-white border dark:border-slate-700 border-slate-200 dark:text-slate-300 text-slate-600 text-xs transition-colors cursor-default shadow-sm">
                       {kw}
                     </span>
                   ))}
                 </div>
              </div>

              {/* Generator Config */}
              <div className="p-6 rounded-2xl dark:bg-accent-cyan/[0.03] bg-white border dark:border-accent-cyan/10 border-slate-200">
                <h3 className="text-lg font-bold dark:text-white text-slate-900 mb-6 flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-accent-cyan" />
                  Generate Prompts
                </h3>
                
                {/* API KEY CHECK BLOCK */}
                {validKeys.length === 0 ? (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                        <div className="flex items-start gap-3">
                             <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                             <div>
                                 <h4 className="text-sm font-bold text-red-500">No Active API Key</h4>
                                 <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                     Please add at least one Gemini API Key in Settings to start generating.
                                 </p>
                                 
                                 {onOpenSettings && (
                                     <button onClick={onOpenSettings} className="mt-3 text-xs font-bold text-white bg-red-500 px-3 py-1.5 rounded-lg hover:bg-red-600">
                                         Go to Settings
                                     </button>
                                 )}
                             </div>
                        </div>
                    </div>
                ) : (
                    <p className="text-xs text-green-500 mb-4 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Using {validKeys.length} active keys from wallet
                    </p>
                )}

                <div className={`space-y-6 ${validKeys.length === 0 ? 'opacity-50 pointer-events-none' : ''}`}>
                  
                  {/* Style Select - Custom Dropdown */}
                  <div className="relative z-20">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <Palette className="w-3 h-3" /> Art Style
                    </label>
                    <button
                        onClick={() => setIsStyleOpen(!isStyleOpen)}
                        className="w-full flex items-center justify-between p-3 rounded-xl dark:bg-slate-900 bg-slate-50 border dark:border-slate-700 border-slate-200 hover:border-accent-cyan/50 transition-all text-sm font-medium dark:text-white text-slate-900"
                    >
                        <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-accent-cyan"></span>
                            {selectedStyle}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isStyleOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    <AnimatePresence>
                        {isStyleOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                className="absolute top-full left-0 right-0 mt-2 p-1 bg-white dark:bg-slate-800 border dark:border-slate-700 border-slate-200 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto custom-scrollbar"
                            >
                                {STYLES.map((style) => (
                                    <button
                                        key={style}
                                        onClick={() => { setSelectedStyle(style); setIsStyleOpen(false); }}
                                        className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center justify-between ${selectedStyle === style ? 'bg-accent-cyan/10 text-accent-cyan font-medium' : 'hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-slate-300 text-slate-700'}`}
                                    >
                                        {style}
                                        {selectedStyle === style && <Check className="w-3 h-3" />}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                  </div>

                  {/* Quantity Select - Segmented Control */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Quantity</label>
                    <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border dark:border-slate-800 border-slate-200">
                      {[10, 20, 50, 100].map(num => (
                        <button
                          key={num}
                          onClick={() => setPromptCount(num)}
                          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all relative ${
                            promptCount === num 
                            ? 'bg-white dark:bg-slate-700 text-accent-purple shadow-sm' 
                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleGenerate}
                    disabled={loading || validKeys.length === 0}
                    className="w-full py-4 bg-gradient-to-r from-accent-cyan to-blue-600 rounded-xl text-black font-bold text-base shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group transform active:scale-[0.98]"
                  >
                    {loading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            {hasFeedback ? <Sparkles className="w-5 h-5 fill-current" /> : <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />}
                            {hasFeedback ? 'Regenerate with Feedback' : 'Generate Prompts'}
                        </>
                    )}
                  </button>
                  
                  {hasFeedback && (
                      <p className="text-[10px] text-center text-slate-500">
                          Using {prompts.filter(p => p.rating === 'good').length} liked and {prompts.filter(p => p.rating === 'bad').length} disliked examples.
                      </p>
                  )}
                </div>
              </div>

            </div>

            {/* Right Column: Results (Scrollable) */}
            <div className="flex-1 flex flex-col h-full dark:bg-[#0a0f1c] bg-slate-100 overflow-hidden border-l dark:border-slate-800 border-slate-200">
              
              <div className="p-4 border-b dark:border-white/5 border-slate-200 dark:bg-white/[0.02] bg-white flex justify-between items-center shrink-0">
                <h3 className="dark:text-white text-slate-900 font-medium flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    Generated Prompts ({prompts.length})
                </h3>
                <div className="flex gap-2">
                    {prompts.length > 0 && (
                        <>
                        <button onClick={handleCopyAll} className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 dark:text-slate-300 text-slate-700 text-xs font-medium transition-colors">
                            Copy All
                        </button>
                        <div className="h-6 w-px bg-slate-300 dark:bg-slate-700 mx-1" />
                        </>
                    )}
                    <button onClick={() => downloadFile('txt')} disabled={prompts.length === 0} className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 disabled:opacity-50 dark:text-slate-300 text-slate-700 text-xs font-medium flex items-center gap-1 transition-colors">
                      <Download className="w-3 h-3" /> .TXT
                    </button>
                    <button onClick={() => downloadFile('csv')} disabled={prompts.length === 0} className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 disabled:opacity-50 dark:text-slate-300 text-slate-700 text-xs font-medium flex items-center gap-1 transition-colors">
                      <Download className="w-3 h-3" /> .CSV
                    </button>
                </div>
              </div>

              <div className="flex-1 p-6 overflow-y-auto custom-scrollbar relative">
                {loading ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center space-y-6">
                    <div className="relative">
                        <div className="absolute inset-0 bg-accent-cyan blur-xl opacity-20 animate-pulse"></div>
                        <Loader2 className="w-16 h-16 text-accent-cyan animate-spin relative z-10" />
                    </div>
                    <div className="text-center space-y-2">
                        <p className="dark:text-white text-slate-900 font-medium text-lg">Creating High-Quality Prompts...</p>
                        <p className="text-slate-500 text-sm">Analyzing microstock demand • optimizing keywords</p>
                    </div>
                  </div>
                ) : prompts.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600">
                    <div className="w-20 h-20 rounded-full dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 flex items-center justify-center mb-6">
                        <Wand2 className="w-8 h-8 opacity-50" />
                    </div>
                    <p className="text-lg font-medium text-slate-500">Ready to Generate</p>
                    <p className="text-sm text-slate-500 mt-2 text-center max-w-xs">Select a style and quantity on the left panel to begin creating assets.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {prompts.map((prompt, i) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.02 }}
                        key={prompt.id} 
                        className={`group relative dark:bg-[#131b2e] bg-white border p-5 rounded-xl hover:shadow-lg dark:hover:shadow-cyan-900/10 transition-all duration-300 ${
                            prompt.rating === 'good' ? 'border-green-500/30 bg-green-500/5' : 
                            prompt.rating === 'bad' ? 'border-red-500/30 opacity-70' : 
                            'dark:border-slate-800/50 border-slate-200 hover:border-accent-cyan/30'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-4 mb-2">
                          <p className="dark:text-slate-300 text-slate-700 text-sm leading-relaxed font-light">{prompt.text}</p>
                          
                          <div className="flex items-center gap-1 flex-shrink-0">
                                <button 
                                    onClick={() => handleRate(prompt.id, 'good')}
                                    className={`p-2 rounded-lg transition-colors ${prompt.rating === 'good' ? 'text-green-500 bg-green-500/10' : 'text-slate-400 hover:text-green-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                    title="Good Result"
                                >
                                    <ThumbsUp className={`w-4 h-4 ${prompt.rating === 'good' ? 'fill-current' : ''}`} />
                                </button>
                                <button 
                                    onClick={() => handleRate(prompt.id, 'bad')}
                                    className={`p-2 rounded-lg transition-colors ${prompt.rating === 'bad' ? 'text-red-500 bg-red-500/10' : 'text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                    title="Bad Result"
                                >
                                    <ThumbsDown className={`w-4 h-4 ${prompt.rating === 'bad' ? 'fill-current' : ''}`} />
                                </button>
                                <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1"></div>
                                <button 
                                    onClick={() => handleCopy(prompt.text, prompt.id)}
                                    className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                    title="Copy Positive Prompt"
                                >
                                    {copiedId === prompt.id ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                </button>
                          </div>
                        </div>

                        {/* Additional Metadata Row */}
                        <div className="flex flex-wrap items-center gap-3 pt-3 mt-2 border-t dark:border-white/5 border-slate-100">
                            {prompt.negativePrompt && (
                                <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 dark:bg-white/5 px-2 py-1 rounded max-w-full truncate">
                                    <Ban className="w-3 h-3 text-red-400 shrink-0" />
                                    <span className="truncate max-w-[300px] text-[10px]"><span className="font-bold text-red-400">Negative:</span> {prompt.negativePrompt}</span>
                                </div>
                            )}
                            {prompt.aspectRatio && (
                                <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 dark:bg-white/5 px-2 py-1 rounded">
                                    <Monitor className="w-3 h-3 text-accent-purple shrink-0" />
                                    <span className="font-mono text-[10px] font-bold">{prompt.aspectRatio}</span>
                                </div>
                            )}
                        </div>

                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TrendDetailModal;
