import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';

interface Props {
  onSearch: (query: string) => void;
}

const Hero: React.FC<Props> = ({ onSearch }) => {
  const [inputValue, setInputValue] = useState('');

  const handleSearchTrigger = () => {
    if (inputValue.trim()) {
      onSearch(inputValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearchTrigger();
    }
  };

  return (
    <div className="w-full pt-12 pb-8 px-6 flex flex-col items-center justify-center text-center relative z-10">
      
      {/* Subtle Glows - Adjusted for visibility in light mode */}
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-accent-cyan/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl w-full"
      >
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-accent-cyan/10 border border-accent-cyan/20 mb-6 backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-cyan opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-cyan"></span>
          </span>
          <span className="text-xs font-bold text-accent-cyan tracking-widest uppercase">Live Microstock Intelligence</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-bold dark:text-white text-slate-900 mb-4 leading-tight tracking-tight">
          Today's <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-cyan to-accent-purple">Best Sellers</span>
        </h1>
        
        <p className="dark:text-slate-400 text-slate-600 text-lg mb-8 font-light max-w-2xl mx-auto">
          Daily automated research for stock contributors. <span className="dark:text-slate-200 text-slate-800 font-medium">Find niches, get keywords, generate prompts.</span>
        </p>

        {/* Search Bar - Central Dashboard Element */}
        <div className="relative max-w-2xl mx-auto w-full group">
          <div className="absolute inset-0 bg-gradient-to-r from-accent-cyan to-accent-purple rounded-xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
          <div className="relative glass-panel rounded-xl flex items-center p-2">
            <Search className="w-5 h-5 dark:text-slate-400 text-slate-500 ml-3 mr-3" />
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search specific niche or keyword..." 
              className="bg-transparent border-none outline-none dark:text-white text-slate-900 placeholder-slate-500 w-full h-10"
            />
            <button 
              onClick={handleSearchTrigger}
              className="px-6 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm transition-colors border border-slate-700"
            >
              Analyze
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Hero;