
import React from 'react';
import { Award, TrendingUp, PenTool, Calendar, Tag, Zap, Settings as SettingsIcon } from 'lucide-react';
import { ViewState } from '../types';

interface Props {
  onNavigate?: (view: ViewState) => void;
  onSearch: (query: string) => void;
}

const Sidebar: React.FC<Props> = ({ onNavigate, onSearch }) => {
  
  const handleToolClick = (toolName: string) => {
      alert(`${toolName} feature is coming soon! We are currently training the AI model for this specific task.`);
  };

  return (
    <div className="hidden lg:flex flex-col w-full min-h-[calc(100vh-80px)] sticky top-24 space-y-6">
      
      {/* Seasonal Trends */}
      <div className="glass-panel p-5 rounded-2xl border border-pink-500/20 bg-pink-500/5">
        <h3 className="dark:text-white text-slate-900 font-bold mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-pink-500" />
          Start Uploading For:
        </h3>
        <ul className="space-y-3">
          {[
            { event: 'Back to School', time: '2 mo left' },
            { event: 'Autumn Cozy', time: '3 mo left' },
            { event: 'Halloween Concepts', time: '3.5 mo left' },
          ].map((item, i) => (
             <li key={i} className="flex justify-between items-center text-sm">
               <span className="dark:text-slate-300 text-slate-700 font-medium">{item.event}</span>
               <span className="text-[10px] text-pink-600 dark:text-pink-300 bg-pink-500/10 px-2 py-0.5 rounded-full border border-pink-500/20">{item.time}</span>
             </li>
          ))}
        </ul>
        <div className="mt-4 pt-3 border-t border-pink-500/20">
          <p className="text-[10px] text-slate-500">Microstock rule: Upload 3 months before the actual event for best sales.</p>
        </div>
      </div>

      {/* Best Selling Niches */}
      <div className="glass-panel p-5 rounded-2xl border-l-4 border-l-accent-cyan">
        <h3 className="dark:text-white text-slate-900 font-bold mb-4 flex items-center gap-2">
          <Award className="w-4 h-4 text-accent-cyan" />
          Top Downloads (Week)
        </h3>
        <ul className="space-y-3">
          {[
            { name: 'AI Business Concepts', vol: '+210%' },
            { name: 'Sustainable Energy', vol: '+140%' },
            { name: 'Senior Healthcare', vol: '+95%' },
            { name: 'Diversity at Work', vol: '+88%' }
          ].map((item, i) => (
            <li 
              key={i} 
              onClick={() => onSearch(item.name)}
              className="flex justify-between items-center text-sm group cursor-pointer"
            >
              <span className="dark:text-slate-400 text-slate-600 group-hover:text-accent-cyan transition-colors">{item.name}</span>
              <span className="text-xs text-green-500 font-mono bg-green-500/10 px-1.5 py-0.5 rounded">{item.vol}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Underrated Categories */}
      <div className="glass-panel p-5 rounded-2xl">
        <h3 className="dark:text-white text-slate-900 font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-purple-500" />
          Underrated Niches
        </h3>
        <div className="flex flex-wrap gap-2">
          {['Authentic', 'Candid', 'Lo-Fi', 'Bio-tech', 'Solo Travel', 'Retro UI'].map((tag, i) => (
            <button 
                key={i} 
                onClick={() => onSearch(tag)}
                className="px-2.5 py-1 rounded-md dark:bg-white/5 bg-slate-100 border dark:border-white/10 border-slate-200 text-xs dark:text-slate-300 text-slate-600 hover:border-purple-500/50 hover:text-purple-500 cursor-pointer transition-colors"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Tools */}
      <div className="glass-panel p-5 rounded-2xl">
        <h3 className="dark:text-white text-slate-900 font-bold mb-4 flex items-center gap-2">
          <PenTool className="w-4 h-4 text-orange-400" />
          Quick Tools
        </h3>
        <div className="grid grid-cols-2 gap-2">
           <button 
             onClick={() => onNavigate?.(ViewState.METADATA)}
             className="p-3 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 text-xs font-bold border border-orange-500/20 transition-all flex flex-col items-center gap-1 group"
           >
             <Tag className="w-4 h-4 group-hover:scale-110 transition-transform" />
             Metadata
           </button>
           <button 
             onClick={() => onNavigate?.(ViewState.SETTINGS)}
             className="p-3 rounded-lg dark:bg-slate-800/50 bg-slate-100 hover:bg-slate-800 hover:text-white text-xs text-center dark:text-slate-300 text-slate-600 border dark:border-slate-700 border-slate-200 transition-all flex flex-col items-center gap-1"
           >
             <SettingsIcon className="w-4 h-4" />
             Settings
           </button>
        </div>
      </div>

      {/* Daily Tip */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/20">
        <h4 className="text-xs font-bold text-indigo-300 uppercase mb-2 flex items-center gap-1">
          <Zap className="w-3 h-3" /> Pro Tip
        </h4>
        <p className="text-sm text-slate-300 leading-relaxed">
          "Images with copy space on the right side sell 3x better for web banners. Keep your main subject left-aligned."
        </p>
      </div>

    </div>
  );
};

export default Sidebar;
