import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, TrendingUp, AlertCircle, ArrowUpRight, Wand2, Check } from 'lucide-react';
import { KeywordItem } from '../types';

interface Props {
  item: KeywordItem;
  index: number;
  onClick: () => void;
}

const KeywordCard: React.FC<Props> = ({ item, index, onClick }) => {
  const [copied, setCopied] = useState(false);

  const getDifficultyColor = (d: number) => {
    if (d < 30) return 'bg-green-500';
    if (d < 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(item.suggestedPrompt || item.keyword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -5 }}
      onClick={onClick}
      className="glass-panel p-5 rounded-2xl flex flex-col justify-between group dark:hover:bg-white/[0.04] hover:bg-white transition-all duration-300 h-full cursor-pointer relative overflow-hidden"
    >
       {/* Hover Overlay Hint - Kept as requested */}
      <div className="absolute inset-0 bg-accent-cyan/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none z-0">
        <span className="bg-slate-900/80 backdrop-blur px-3 py-1 rounded-full text-xs text-accent-cyan border border-accent-cyan/20 flex items-center gap-1 font-bold shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">
           <Wand2 className="w-3 h-3" /> Generate Prompts
        </span>
      </div>

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-3">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold dark:bg-slate-800 bg-slate-200 dark:text-slate-400 text-slate-600 border dark:border-slate-700 border-slate-300 flex items-center gap-1`}>
                <TrendingUp className="w-3 h-3" /> {item.volume}
            </span>
             <div className="flex flex-col items-end gap-1">
                <span className={`text-[10px] font-bold ${item.difficulty < 30 ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                    KD {item.difficulty}/100
                </span>
                <div className="h-1 w-12 dark:bg-slate-800 bg-slate-300 rounded-full overflow-hidden">
                    <div 
                    className={`h-full rounded-full ${getDifficultyColor(item.difficulty)}`} 
                    style={{ width: `${item.difficulty}%` }}
                    />
                </div>
            </div>
        </div>

        <h4 className="dark:text-white text-slate-900 font-bold text-lg mb-2 leading-tight group-hover:text-accent-cyan transition-colors line-clamp-2">
            {item.keyword}
        </h4>
        
        <p className="dark:text-slate-500 text-slate-600 text-xs mb-4 line-clamp-3 leading-relaxed">
           <span className="dark:text-slate-400 text-slate-800 font-medium">Idea:</span> {item.suggestedPrompt}
        </p>
      </div>

      <div className="mt-2 pt-4 border-t dark:border-white/5 border-slate-200 flex justify-between items-center relative z-20">
        <span className="text-[10px] text-accent-cyan font-medium uppercase tracking-wider">Low Competition</span>
        <button 
          onClick={handleCopy}
          className={`p-2 rounded-lg transition-all duration-200 flex items-center gap-2 text-xs font-bold ${
            copied 
            ? 'bg-green-500/20 text-green-500 border border-green-500/20' 
            : 'dark:bg-white/5 bg-slate-100 hover:bg-slate-900 hover:text-white dark:text-slate-400 text-slate-600'
          }`}
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} 
          {copied ? 'Copied' : 'Copy Idea'}
        </button>
      </div>
    </motion.div>
  );
};

export default KeywordCard;