
import React, { useState, useEffect } from 'react';
import { User, ApiKeyData, AppSettings } from '../types';
import { Shield, Key, Download, Trash2, Mail, Plus, AlertTriangle, Clock, RefreshCw, CheckCircle, AlertOctagon, Search, User as UserIcon, Ban } from 'lucide-react';
import { ToastType } from './Toast';

interface Props {
  currentUser: User;
  onBack: () => void;
  // Props for handling global settings from App
  adminApiKeys: ApiKeyData[];
  setAdminApiKeys: (keys: ApiKeyData[]) => void;
  settings: AppSettings;
  setSettings: (settings: AppSettings) => void;
  triggerManualScrape: () => void;
  isScraping: boolean;
  users: User[];
  setUsers: (users: User[]) => void;
  showToast?: (msg: string, type: ToastType) => void;
}

const AdminPanel: React.FC<Props> = ({ 
    currentUser, 
    onBack, 
    adminApiKeys, 
    setAdminApiKeys,
    settings,
    setSettings,
    triggerManualScrape,
    isScraping,
    users,
    setUsers,
    showToast
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // API Key Form State
  const [newKey, setNewKey] = useState('');
  const [keyLabel, setKeyLabel] = useState('');

  // 7-Day Logic Constants
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const SIX_DAYS_MS = 6 * 24 * 60 * 60 * 1000;

  // Calculate stats
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDaysOld = (timestamp: number) => {
      const diff = Date.now() - timestamp;
      return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const getKeyStatus = (key: ApiKeyData) => {
      const ageMs = Date.now() - key.dateAdded;
      if (ageMs > SEVEN_DAYS_MS) return 'expired';
      if (ageMs > SIX_DAYS_MS) return 'warning';
      return 'active';
  };

  const handleAddKey = () => {
      if (!newKey.trim()) return;
      // Prevent duplicates
      if (adminApiKeys.some(k => k.key === newKey.trim())) {
          if(showToast) showToast("Key already exists", 'error');
          return;
      }

      const newApiKey: ApiKeyData = {
          key: newKey.trim(),
          label: keyLabel || `Key ${adminApiKeys.length + 1}`,
          status: 'active',
          usageCount: 0,
          lastUsed: 0,
          dateAdded: Date.now()
      };

      setAdminApiKeys([...adminApiKeys, newApiKey]);
      setNewKey('');
      setKeyLabel('');
      if(showToast) showToast("Admin API Key Added", 'success');
  };

  const handleDeleteKey = (keyStr: string) => {
      if (confirm('Delete this API key?')) {
          setAdminApiKeys(adminApiKeys.filter(k => k.key !== keyStr));
          if(showToast) showToast("Key Deleted", 'info');
      }
  };

  const handleBanUser = (userId: string) => {
      if(confirm("Are you sure you want to ban this user?")) {
          setUsers(users.map(u => u.id === userId ? { ...u, status: 'banned' } : u));
          if(showToast) showToast("User Banned", 'error');
      }
  };

  const handleDeleteUser = (userId: string) => {
      if(confirm("Permanently delete this user data?")) {
          setUsers(users.filter(u => u.id !== userId));
          if(showToast) showToast("User Deleted", 'info');
      }
  };

  // Check for alerts (Day 6 warning)
  const expiringKeys = adminApiKeys.filter(k => getKeyStatus(k) === 'warning');

  return (
    <div className="animate-fade-in w-full max-w-[1600px] mx-auto p-6 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold dark:text-white text-slate-900 flex items-center gap-3">
            <Shield className="w-8 h-8 text-accent-cyan" />
            Admin Command Center
          </h1>
          <p className="text-slate-500 mt-1">
            Logged in as <span className="font-bold text-accent-cyan">{currentUser.email}</span>
          </p>
        </div>
        <button onClick={onBack} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          Exit Panel
        </button>
      </div>

      {/* ALERT BANNER for 6th Day Warning */}
      {expiringKeys.length > 0 && (
          <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0" />
              <div>
                  <h3 className="font-bold text-yellow-500">Action Required: Keys Expiring Soon</h3>
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                      The following keys have been active for 6 days and will expire in 24 hours. Please rotate them.
                  </p>
                  <ul className="mt-2 list-disc list-inside text-xs text-yellow-600 dark:text-yellow-400 font-mono">
                      {expiringKeys.map(k => (
                          <li key={k.key}>{k.label} (...{k.key.slice(-4)})</li>
                      ))}
                  </ul>
              </div>
          </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* 1. API KEY VAULT & ROTATION */}
          <div className="glass-panel p-6 rounded-2xl border dark:border-white/5 border-slate-200">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold dark:text-white text-slate-900 flex items-center gap-2">
                    <Key className="w-5 h-5 text-accent-purple" />
                    API Key Vault (7-Day Rotation)
                </h2>
                <div className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-slate-500">
                    System Time: {new Date().toLocaleTimeString()}
                </div>
             </div>

             {/* Add Key Form */}
             <div className="flex gap-2 mb-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                <input 
                    type="text" 
                    placeholder="Key Name (e.g. Week 1)"
                    value={keyLabel}
                    onChange={(e) => setKeyLabel(e.target.value)}
                    className="w-1/3 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border dark:border-slate-700 text-sm outline-none focus:border-accent-purple"
                />
                <input 
                    type="text" 
                    placeholder="Paste Gemini API Key..."
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border dark:border-slate-700 text-sm outline-none focus:border-accent-purple"
                />
                <button 
                    onClick={handleAddKey}
                    className="p-2 bg-accent-purple hover:bg-accent-purple/90 text-white rounded-lg transition-colors"
                >
                    <Plus className="w-5 h-5" />
                </button>
             </div>

             {/* Key List with Progress Bars */}
             <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar">
                {adminApiKeys.length === 0 && <p className="text-slate-500 text-sm text-center py-4">No keys added. Add keys to enable real-time scraping.</p>}
                
                {adminApiKeys.map((keyData, i) => {
                    const daysOld = getDaysOld(keyData.dateAdded);
                    const status = getKeyStatus(keyData);
                    const progress = Math.min(100, (daysOld / 7) * 100);

                    return (
                        <div key={i} className={`p-4 rounded-xl border ${status === 'expired' ? 'border-red-500/30 bg-red-500/5' : status === 'warning' ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-slate-200 dark:border-slate-700'}`}>
                             <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm dark:text-white text-slate-900">{keyData.label}</span>
                                    <span className="text-xs font-mono text-slate-500">...{keyData.key.slice(-6)}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                                        status === 'expired' ? 'bg-red-500 text-white' : 
                                        status === 'warning' ? 'bg-yellow-500 text-black' : 
                                        'bg-green-500 text-white'
                                    }`}>
                                        {status === 'warning' ? 'Expiring Soon' : status}
                                    </span>
                                    <button onClick={() => handleDeleteKey(keyData.key)} className="text-slate-400 hover:text-red-500">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                             </div>

                             {/* Lifecycle Progress */}
                             <div className="space-y-1">
                                <div className="flex justify-between text-[10px] text-slate-500">
                                    <span>Age: {daysOld} days</span>
                                    <span>Max: 7 days</span>
                                </div>
                                <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full transition-all duration-500 ${status === 'expired' ? 'bg-red-500' : status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'}`} 
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                {status === 'expired' && <p className="text-[10px] text-red-500 mt-1">This key is inactive. Please delete.</p>}
                             </div>
                        </div>
                    );
                })}
             </div>
          </div>

          {/* 2. AUTOMATION SCHEDULER & SCRAPER */}
          <div className="flex flex-col gap-6">
              
              {/* Scheduler Card */}
              <div className="glass-panel p-6 rounded-2xl border dark:border-white/5 border-slate-200 bg-gradient-to-br from-slate-50 to-white dark:from-[#0f172a] dark:to-[#1e293b]">
                  <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 rounded-lg bg-blue-500/20 text-blue-500">
                          <Clock className="w-6 h-6" />
                      </div>
                      <div>
                          <h2 className="text-xl font-bold dark:text-white text-slate-900">Auto-Scrape Scheduler</h2>
                          <p className="text-xs text-slate-500">Set daily time to fetch new internet trends</p>
                      </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 mb-6">
                      <div className="flex flex-col gap-1">
                          <label className="text-xs font-bold text-slate-500 uppercase">Daily Schedule</label>
                          <input 
                            type="time" 
                            value={settings.autoScrapeTime}
                            onChange={(e) => setSettings({...settings, autoScrapeTime: e.target.value})}
                            className="bg-slate-100 dark:bg-slate-900 border dark:border-slate-700 rounded-lg px-4 py-2 dark:text-white outline-none focus:border-blue-500"
                          />
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                          <label className="text-xs font-bold text-slate-500 uppercase">Auto-Scrape Status</label>
                          <button 
                            onClick={() => setSettings({...settings, isAutoScrapeEnabled: !settings.isAutoScrapeEnabled})}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${settings.isAutoScrapeEnabled ? 'bg-green-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}
                          >
                              {settings.isAutoScrapeEnabled ? 'ENABLED' : 'DISABLED'}
                          </button>
                      </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-100 dark:bg-black/30 border dark:border-white/5">
                      <p className="text-xs text-slate-500 flex justify-between">
                          <span>Last Successful Scrape:</span>
                          <span className="font-mono dark:text-white">{settings.lastScrapedDate || 'Never'}</span>
                      </p>
                  </div>
              </div>

              {/* Manual Trigger Card */}
              <div className="glass-panel p-6 rounded-2xl border dark:border-white/5 border-slate-200 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-32 bg-accent-cyan/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                  
                  <h2 className="text-xl font-bold dark:text-white text-slate-900 mb-2">Live Trend Scraper</h2>
                  <p className="text-sm text-slate-500 mb-6">
                      Manually trigger the AI to simulate a real-time market scrape using the active keys from the vault.
                  </p>

                  <button 
                    onClick={triggerManualScrape}
                    disabled={isScraping || adminApiKeys.filter(k => getKeyStatus(k) !== 'expired').length === 0}
                    className="w-full py-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 shadow-lg"
                  >
                      {isScraping ? (
                          <>
                            <RefreshCw className="w-5 h-5 animate-spin" />
                            Scraping & Analyzing Data...
                          </>
                      ) : (
                          <>
                            <RefreshCw className="w-5 h-5" />
                            Run Scraper Now
                          </>
                      )}
                  </button>
                  {adminApiKeys.filter(k => getKeyStatus(k) !== 'expired').length === 0 && (
                      <p className="text-xs text-red-500 text-center mt-2">Error: No valid API keys available in vault.</p>
                  )}
              </div>
          </div>
      </div>

      {/* 3. USER MANAGEMENT DATABASE (RESTORED) */}
      <div className="glass-panel p-6 rounded-2xl border dark:border-white/5 border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
            <div>
                <h2 className="text-xl font-bold dark:text-white text-slate-900 flex items-center gap-2">
                    <UserIcon className="w-5 h-5 text-accent-cyan" />
                    User Database
                </h2>
                <p className="text-xs text-slate-500 mt-1">Total Registered Users: {users.length}</p>
            </div>
            
            <div className="relative group w-full md:w-auto">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 group-focus-within:text-accent-cyan transition-colors" />
                <input 
                    type="text" 
                    placeholder="Search name, email, ID..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full md:w-64 pl-9 pr-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-900 border dark:border-slate-700 outline-none text-sm focus:border-accent-cyan"
                />
            </div>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead>
                    <tr className="border-b dark:border-white/10 border-slate-200 text-slate-500 font-bold uppercase text-xs">
                        <th className="px-4 py-3">User</th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Joined</th>
                        <th className="px-4 py-3">User API Key</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y dark:divide-white/5 divide-slate-100">
                    {filteredUsers.length === 0 && (
                        <tr>
                            <td colSpan={6} className="text-center py-8 text-slate-500">No users found matching "{searchTerm}"</td>
                        </tr>
                    )}
                    {filteredUsers.map(user => (
                        <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <img src={user.avatar} alt="" className="w-8 h-8 rounded-full bg-slate-200" />
                                    <div>
                                        <p className="font-bold dark:text-white text-slate-900">{user.name}</p>
                                        <p className="text-xs text-slate-500">{user.email}</p>
                                        <p className="text-[10px] text-slate-400 font-mono">ID: {user.id}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-4 py-3">
                                <span className={`text-xs px-2 py-1 rounded-full border ${user.role === 'admin' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'}`}>
                                    {user.role.toUpperCase()}
                                </span>
                            </td>
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${user.status === 'active' ? 'bg-green-500' : user.status === 'banned' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                                    <span className="capitalize text-slate-600 dark:text-slate-300">{user.status}</span>
                                </div>
                            </td>
                            <td className="px-4 py-3 text-slate-500">
                                {new Date(user.joinedDate).toLocaleDateString()}
                            </td>
                             <td className="px-4 py-3">
                                {user.apiKey ? (
                                    <code className="text-[10px] bg-slate-100 dark:bg-black/30 px-2 py-1 rounded text-slate-500 font-mono border dark:border-white/5">
                                        {user.apiKey}
                                    </code>
                                ) : (
                                    <span className="text-xs text-slate-400 italic">None</span>
                                )}
                            </td>
                            <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    {user.status !== 'banned' && user.id !== currentUser.id && (
                                        <button 
                                            onClick={() => handleBanUser(user.id)}
                                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors" 
                                            title="Ban User"
                                        >
                                            <Ban className="w-4 h-4" />
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => handleDeleteUser(user.id)}
                                        className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                                        title="Delete Data"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>

    </div>
  );
};

export default AdminPanel;
