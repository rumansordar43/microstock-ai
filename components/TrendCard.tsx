import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, BarChart3, ArrowRight, Wand2 } from 'lucide-react';
import { TrendItem } from '../types';

interface Props {
  trend: TrendItem;
  onClick: () => void;
  index: number;
}

const TrendCard: React.FC<Props> = ({ trend, onClick, index }) => {
  const isLow = trend.competition === 'Low';
  
  const handleGenerateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -5, scale: 1.02 }}
      className="glass-panel rounded-2xl p-6 cursor-pointer group relative overflow-hidden flex flex-col h-full"
      onClick={onClick}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-accent-cyan/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider ${
          isLow ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/30' : 
          trend.competition === 'Medium' ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30' :
          'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30'
        }`}>
          {trend.competition.toUpperCase()} COMP
        </span>
        <div className="p-2 rounded-full dark:bg-white/5 bg-slate-100 text-slate-400 group-hover:text-accent-cyan group-hover:bg-accent-cyan/10 transition-colors">
          <TrendingUp className="w-5 h-5" />
        </div>
      </div>

      <h3 className="text-xl font-bold dark:text-white text-slate-900 mb-2 group-hover:text-accent-cyan transition-colors">{trend.title}</h3>
      <p className="dark:text-slate-400 text-slate-600 text-sm mb-6 flex-grow line-clamp-2">{trend.description}</p>

      <div className="mt-auto relative z-10">
        <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
           <span className="flex items-center gap-1">
             <BarChart3 className="w-3 h-3" /> Vol: {trend.searchVolume}
           </span>
           <span className="dark:bg-slate-800 bg-slate-200 dark:text-slate-300 text-slate-700 px-2 py-0.5 rounded">{trend.category}</span>
        </div>
        
        <button 
          onClick={handleGenerateClick}
          title={`Generate prompts for ${trend.title}`}
          className="w-full py-3 rounded-lg dark:bg-white/5 bg-slate-900 hover:bg-slate-800 dark:hover:bg-white/10 border border-transparent dark:border-white/10 text-sm font-medium text-white flex items-center justify-center gap-2 group-hover:border-accent-cyan/50 transition-all shadow-lg hover:shadow-accent-cyan/20"
        >
          <Wand2 className="w-4 h-4 text-accent-cyan" />
          Generate Prompts
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform ml-auto" />
        </button>
      </div>
    </motion.div>
  );
};

export default TrendCard;