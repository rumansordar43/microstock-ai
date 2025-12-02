import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Copy, Search, AlertCircle } from 'lucide-react';
import { KeywordItem } from '../types';

interface Props {
  item: KeywordItem;
  index: number;
}

const KeywordRow: React.FC<Props> = ({ item, index }) => {
  const getDifficultyColor = (d: number) => {
    if (d < 30) return 'bg-green-500';
    if (d < 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="glass-panel p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group hover:bg-white/[0.04] transition-colors border border-white/5 hover:border-white/10"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1">
          <h4 className="text-white font-medium text-lg truncate">{item.keyword}</h4>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-800 text-slate-400 border border-slate-700`}>
            {item.volume} SEARCHES
          </span>
        </div>
        <p className="text-slate-500 text-xs flex items-center gap-1 truncate">
          <span className="text-accent-cyan">Potential: High</span> • Suggested: {item.suggestedPrompt}
        </p>
      </div>

      <div className="flex items-center gap-6 w-full sm:w-auto">
        {/* Difficulty Meter */}
        <div className="flex flex-col gap-1 w-24">
          <div className="flex justify-between text-[10px] text-slate-400 font-medium">
            <span>Difficulty</span>
            <span className={item.difficulty < 30 ? 'text-green-400' : 'text-yellow-400'}>{item.difficulty}/100</span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${getDifficultyColor(item.difficulty)}`} 
              style={{ width: `${item.difficulty}%` }}
            />
          </div>
        </div>

        <button 
          onClick={() => navigator.clipboard.writeText(item.suggestedPrompt || item.keyword)}
          className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          title="Copy Prompt Idea"
        >
          <Copy className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

export default KeywordRow;