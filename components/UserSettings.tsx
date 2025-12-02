
import React, { useState } from 'react';
import { Save, Key, CheckCircle, Shield, AlertCircle, Plus, Trash2, Zap } from 'lucide-react';
import { User, ApiKeyData } from '../types';
import { ToastType } from './Toast';

interface Props {
  userApiKeys: ApiKeyData[];
  setUserApiKeys: (keys: ApiKeyData[]) => void;
  currentUser: User | null;
  onBack: () => void;
  showToast?: (msg: string, type: ToastType) => void;
}

const UserSettings: React.FC<Props> = ({ userApiKeys, setUserApiKeys, currentUser, onBack, showToast }) => {
  const [inputKey, setInputKey] = useState('');
  const [inputLabel, setInputLabel] = useState('');
  
  const handleAddKey = () => {
    if (!inputKey.trim()) {
        alert("Please enter a valid API Key");
        return;
    }
    // Check duplicates
    if (userApiKeys.some(k => k.key === inputKey.trim())) {
        alert("This key is already in your wallet.");
        return;
    }

    const newKey: ApiKeyData = {
        key: inputKey.trim(),
        label: inputLabel || `Key ${userApiKeys.length + 1}`,
        status: 'active',
        usageCount: 0,
        lastUsed: 0,
        dateAdded: Date.now()
    };

    setUserApiKeys([...userApiKeys, newKey]);
    setInputKey('');
    setInputLabel('');
    if(showToast) showToast('API Key added successfully!', 'success');
  };

  const removeKey = (keyStr: string) => {
      if(confirm("Remove this API Key?")) {
          setUserApiKeys(userApiKeys.filter(k => k.key !== keyStr));
          if(showToast) showToast('Key removed', 'info');
      }
  };

  return (
    <div className="animate-fade-in w-full max-w-4xl mx-auto p-6 space-y-8">
      
      <div className="flex justify-between items-center mb-8">
        <div>
            <h2 className="text-3xl font-bold dark:text-white text-slate-900 flex items-center gap-2">
                <Shield className="w-8 h-8 text-accent-cyan" />
                User Settings
            </h2>
            <p className="text-slate-500 mt-1">Manage your personal preferences and connections.</p>
        </div>
        <button onClick={onBack} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
            Back to Dashboard
        </button>
      </div>

      {/* API Key Card */}
      <div className="glass-panel p-8 rounded-2xl border dark:border-white/5 border-slate-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-32 bg-accent-purple/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        
        <div className="relative z-10">
            <h3 className="text-xl font-bold dark:text-white text-slate-900 mb-4 flex items-center gap-2">
                <Key className="w-5 h-5 text-accent-purple" />
                Personal API Key Wallet
            </h3>
            
            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl mb-6 flex gap-3 items-start">
                <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-600 dark:text-blue-300">
                    <strong>Why multiple keys?</strong> Adding multiple keys allows the system to rotate requests, preventing "Rate Limit" errors during large batch metadata jobs.
                    The Admin's key is strictly reserved for the global scraper.
                </p>
            </div>

            {/* Add Key Form */}
            <div className="flex flex-col sm:flex-row gap-2 mb-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                <input 
                    type="text" 
                    placeholder="Key Name (e.g. Personal Key)"
                    value={inputLabel}
                    onChange={(e) => setInputLabel(e.target.value)}
                    className="sm:w-1/3 px-3 py-3 rounded-lg bg-white dark:bg-slate-800 border dark:border-slate-700 text-sm outline-none focus:border-accent-purple dark:text-white"
                />
                <input 
                    type="text" 
                    placeholder="Paste Gemini API Key (AIzaSy...)"
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value)}
                    className="flex-1 px-3 py-3 rounded-lg bg-white dark:bg-slate-800 border dark:border-slate-700 text-sm outline-none focus:border-accent-purple dark:text-white font-mono"
                />
                <button 
                    onClick={handleAddKey}
                    className="px-4 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-bold hover:scale-105 transition-transform flex items-center justify-center gap-2"
                >
                    <Plus className="w-5 h-5" /> Add
                </button>
            </div>

            {/* Keys List */}
            <div className="space-y-3">
                {userApiKeys.length === 0 && <p className="text-center text-slate-500 py-8 italic">No keys in wallet. Add one to start generating.</p>}
                
                {userApiKeys.map((k, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-slate-900 border dark:border-slate-700 border-slate-200">
                        <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-full ${k.status === 'active' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                                <Zap className="w-4 h-4 fill-current" />
                            </div>
                            <div>
                                <p className="font-bold text-sm dark:text-white text-slate-900">{k.label}</p>
                                <p className="text-xs text-slate-500 font-mono">...{k.key.slice(-8)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right hidden sm:block">
                                <p className="text-[10px] text-slate-500 uppercase font-bold">Status</p>
                                <p className={`text-xs font-bold ${k.status === 'active' ? 'text-green-500' : 'text-red-500'}`}>
                                    {k.status.toUpperCase()}
                                </p>
                            </div>
                            <button 
                                onClick={() => removeKey(k.key)}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

             <p className="text-xs text-slate-500 mt-6 text-center">
                Don't have a key? <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-accent-cyan hover:underline">Get one for free from Google AI Studio</a>.
            </p>
        </div>
      </div>

      {/* Account Info */}
      <div className="glass-panel p-8 rounded-2xl border dark:border-white/5 border-slate-200">
         <h3 className="text-xl font-bold dark:text-white text-slate-900 mb-4">Account Information</h3>
         <div className="flex items-center gap-4">
            <img src={currentUser?.avatar} alt="Profile" className="w-16 h-16 rounded-full bg-slate-200" />
            <div>
                <p className="font-bold dark:text-white text-slate-900 text-lg">{currentUser?.name || 'Guest'}</p>
                <p className="text-slate-500">{currentUser?.email || 'Not logged in'}</p>
                <span className="inline-block mt-2 px-2 py-0.5 text-[10px] uppercase font-bold bg-slate-100 dark:bg-slate-800 rounded text-slate-500 border dark:border-slate-700">
                    {currentUser?.role || 'Guest'} Plan
                </span>
            </div>
         </div>
      </div>

    </div>
  );
};

export default UserSettings;
