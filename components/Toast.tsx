
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X, Mail } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'email';

interface ToastProps {
  message: string;
  type: ToastType;
  isVisible: boolean;
  onClose: () => void;
  subMessage?: string; // For extra details like Email Code
}

const Toast: React.FC<ToastProps> = ({ message, type, isVisible, onClose, subMessage }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000); // Auto close after 5s
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'email': return <Mail className="w-5 h-5 text-blue-500" />;
      default: return <Info className="w-5 h-5 text-accent-cyan" />;
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success': return 'border-green-500/50';
      case 'error': return 'border-red-500/50';
      case 'email': return 'border-blue-500/50';
      default: return 'border-accent-cyan/50';
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: -50, x: '-50%' }}
          className={`fixed top-6 left-1/2 z-[100] w-[90%] max-w-md bg-white dark:bg-[#0f172a] shadow-2xl rounded-xl border ${getBorderColor()} p-4 flex items-start gap-4`}
        >
          <div className={`p-2 rounded-full ${type === 'email' ? 'bg-blue-500/10' : 'bg-slate-100 dark:bg-slate-800'}`}>
            {getIcon()}
          </div>
          
          <div className="flex-1">
            <h4 className="text-sm font-bold dark:text-white text-slate-900">{message}</h4>
            {subMessage && (
               <div className="mt-1 p-2 bg-slate-100 dark:bg-black/30 rounded text-sm font-mono text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 select-all">
                  {subMessage}
               </div>
            )}
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 dark:hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast;
