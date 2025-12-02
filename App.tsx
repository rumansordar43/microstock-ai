
import React, { useState, useEffect } from 'react';
import Hero from './components/Hero';
import TrendCard from './components/TrendCard';
import TrendDetailModal from './components/TrendDetailModal';
import Sidebar from './components/Sidebar';
import KeywordCard from './components/KeywordCard';
import MetadataTool from './components/MetadataTool';
import AuthModal from './components/AuthModal';
import AdminPanel from './components/AdminPanel';
import UserSettings from './components/UserSettings';
import Toast, { ToastType } from './components/Toast';
import { TrendItem, KeywordItem, ViewState, User, ApiKeyData, AppSettings } from './types';
import { MOCK_TRENDS, LOW_COMP_KEYWORDS } from './constants';
import { getTrendingTopics } from './services/geminiService';
import { Sparkles, Layers, TrendingDown, Wand2, Menu, Sun, Moon, Search, X, User as UserIcon, LogOut, Shield } from 'lucide-react';

// Mock Initial Users for Demo
const MOCK_USERS: User[] = [
  { id: 'u1', name: 'John Doe', email: 'john@example.com', role: 'user', status: 'active', joinedDate: '2024-02-15', apiKey: 'AIzaSy...7B2x', avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=random' },
  { id: 'u2', name: 'Sarah Smith', email: 'sarah.creative@studio.com', role: 'user', status: 'active', joinedDate: '2024-03-10', apiKey: 'AIzaSy...9XkL', avatar: 'https://ui-avatars.com/api/?name=Sarah+Smith&background=random' },
  { id: 'u3', name: 'Mike Johnson', email: 'mike.j@vectorart.net', role: 'user', status: 'pending', joinedDate: '2024-05-22', apiKey: 'AIzaSy...3mPq', avatar: 'https://ui-avatars.com/api/?name=Mike+J&background=random' },
  { id: 'u4', name: 'Emma Wilson', email: 'emma.photo@gmail.com', role: 'user', status: 'banned', joinedDate: '2023-11-05', apiKey: 'AIzaSy...B5v1', avatar: 'https://ui-avatars.com/api/?name=Emma+W&background=random' },
];

const App: React.FC = () => {
  const [trends, setTrends] = useState<TrendItem[]>(MOCK_TRENDS);
  const [selectedTrend, setSelectedTrend] = useState<TrendItem | null>(null);
  const [loadingTrends, setLoadingTrends] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [viewState, setViewState] = useState<ViewState>(ViewState.HOME);
  
  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  
  // USER API KEYS (Saved Locally for Prompts) - Now an Array
  const [userApiKeys, setUserApiKeys] = useState<ApiKeyData[]>([]);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  // --- TOAST STATE ---
  const [toast, setToast] = useState<{ msg: string; type: ToastType; sub?: string; visible: boolean }>({
    msg: '', type: 'info', visible: false
  });

  const showToast = (message: string, type: ToastType = 'info', subMessage?: string) => {
    setToast({ msg: message, type, sub: subMessage, visible: true });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

  // --- ADMIN SETTINGS & AUTO SCRAPER STATE ---
  const [adminApiKeys, setAdminApiKeys] = useState<ApiKeyData[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    autoScrapeTime: '09:00',
    lastScrapedDate: '',
    isAutoScrapeEnabled: false
  });

  // Load Settings from LocalStorage (Simulated Persistence)
  useEffect(() => {
    // Admin Keys
    const savedAdminKeys = localStorage.getItem('microstock_admin_keys');
    if (savedAdminKeys) setAdminApiKeys(JSON.parse(savedAdminKeys));
    
    // Global Settings
    const savedSettings = localStorage.getItem('microstock_settings');
    if (savedSettings) setSettings(JSON.parse(savedSettings));

    // User's Personal Keys
    const savedUserKeys = localStorage.getItem('microstock_user_keys');
    if (savedUserKeys) {
        try {
            const parsed = JSON.parse(savedUserKeys);
            if (Array.isArray(parsed)) {
                setUserApiKeys(parsed);
            } else if (typeof parsed === 'string') {
                 setUserApiKeys([{ key: parsed, status: 'active', usageCount: 0, lastUsed: 0, dateAdded: Date.now(), label: 'Default Key' }]);
            }
        } catch (e) {
            console.error("Error parsing user keys", e);
        }
    }
  }, []);

  // Save Settings when they change
  useEffect(() => {
    localStorage.setItem('microstock_admin_keys', JSON.stringify(adminApiKeys));
  }, [adminApiKeys]);

  useEffect(() => {
    localStorage.setItem('microstock_settings', JSON.stringify(settings));
  }, [settings]);
  
  // Save User Keys when changed
  useEffect(() => {
     localStorage.setItem('microstock_user_keys', JSON.stringify(userApiKeys));
  }, [userApiKeys]);

  // Helper: Get a valid key from rotation (ADMIN ONLY)
  const getActiveRotationKey = (): string | null => {
      const validKeys = adminApiKeys.filter(k => {
          const ageDays = (Date.now() - k.dateAdded) / (1000 * 60 * 60 * 24);
          return ageDays < 7;
      });

      if (validKeys.length === 0) return null;
      const randomIndex = Math.floor(Math.random() * validKeys.length);
      return validKeys[randomIndex].key;
  };

  // Main Scraper Function (USES ADMIN KEYS)
  const runScraper = async () => {
      setLoadingTrends(true);
      const rotationKey = getActiveRotationKey();
      
      try {
        const freshData = await getTrendingTopics(rotationKey || undefined);
        
        if (freshData && freshData.length > 0) {
            const mappedFresh = freshData.map((t, i) => ({...t, id: `live-${Date.now()}-${i}`}));
            setTrends(mappedFresh);
            
            setSettings(prev => ({
                ...prev,
                lastScrapedDate: new Date().toLocaleDateString()
            }));
            showToast('Market Data Updated Successfully!', 'success');
        } else {
             showToast('Scraper returned empty data.', 'error');
        }
      } catch (e) {
        console.error("Scraper Failed:", e);
        showToast('Scraper Failed: Check Admin API Keys', 'error');
      } finally {
        setLoadingTrends(false);
      }
  };

  // --- AUTO SCRAPE CHECKER ---
  useEffect(() => {
      const checkSchedule = () => {
          if (!settings.isAutoScrapeEnabled) return;

          const now = new Date();
          const currentHourMin = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); // "09:00"
          const todayStr = now.toLocaleDateString();

          if (currentHourMin === settings.autoScrapeTime && settings.lastScrapedDate !== todayStr) {
              console.log("Auto-Scrape Triggered!");
              runScraper();
          }
      };

      const interval = setInterval(checkSchedule, 60000);
      return () => clearInterval(interval);
  }, [settings, adminApiKeys]); 

  // Handle Keyword Click
  const handleKeywordClick = (item: KeywordItem) => {
    const keywordAsTrend: TrendItem = {
      id: item.id,
      title: item.keyword,
      description: `Targeting specific low-competition keyword: "${item.keyword}". Suggested concept: ${item.suggestedPrompt}`,
      competition: 'Low',
      searchVolume: item.volume,
      category: 'Niche Keyword',
      keywords: [item.keyword, 'microstock', 'niche', 'low competition'],
      concepts: item.concepts || [
        `Commercial concept for ${item.keyword} with white space`,
        `Creative interpretation of ${item.keyword} in studio lighting`,
        `Lifestyle shot incorporating ${item.keyword} with authentic emotion`
      ]
    };
    setSelectedTrend(keywordAsTrend);
  };

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    if (!users.find(u => u.email === user.email)) {
        setUsers([...users, user]);
    }
    showToast(`Welcome back, ${user.name}!`, 'success');
    
    if (user.role === 'admin') {
      setViewState(ViewState.ADMIN);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setViewState(ViewState.HOME);
    showToast('Logged out successfully', 'info');
  };

  const handleSearch = (query: string) => {
      setSearchQuery(query);
      if (viewState !== ViewState.HOME) {
          setViewState(ViewState.HOME);
      }
      setTimeout(() => {
        document.getElementById('trends-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
  };

  const clearSearch = () => {
      setSearchQuery('');
  };

  const filteredTrends = trends.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredKeywords = LOW_COMP_KEYWORDS.filter(k => 
    k.keyword.toLowerCase().includes(searchQuery.toLowerCase()) ||
    k.suggestedPrompt?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderContent = () => {
    if (viewState === ViewState.ADMIN && currentUser?.role === 'admin') {
      return (
        <div className="lg:col-span-12">
          <AdminPanel 
            currentUser={currentUser} 
            onBack={() => setViewState(ViewState.HOME)}
            adminApiKeys={adminApiKeys}
            setAdminApiKeys={setAdminApiKeys}
            settings={settings}
            setSettings={setSettings}
            triggerManualScrape={runScraper}
            isScraping={loadingTrends}
            users={users}
            setUsers={setUsers}
            showToast={showToast}
          />
        </div>
      );
    }

    if (viewState === ViewState.METADATA) {
      return (
        <div className="lg:col-span-12 animate-fade-in">
           <MetadataTool 
             onBack={() => setViewState(ViewState.HOME)} 
             userApiKeys={userApiKeys}
             showToast={showToast}
           />
        </div>
      );
    }

    if (viewState === ViewState.SETTINGS) {
        return (
            <div className="lg:col-span-12">
                <UserSettings 
                    userApiKeys={userApiKeys} 
                    setUserApiKeys={setUserApiKeys} 
                    currentUser={currentUser}
                    onBack={() => setViewState(ViewState.HOME)}
                    showToast={showToast}
                />
            </div>
        );
    }

    return (
      <>
        {/* Main Feed (9/12) */}
        <main className="lg:col-span-9 space-y-12">
            
            <Hero onSearch={handleSearch} />

            {searchQuery && (
                <div className="flex items-center justify-between bg-accent-cyan/10 border border-accent-cyan/20 p-4 rounded-xl">
                    <div className="flex items-center gap-2">
                        <Search className="w-5 h-5 text-accent-cyan" />
                        <span className="dark:text-white text-slate-900 font-medium">
                            Search results for: <span className="text-accent-cyan font-bold">"{searchQuery}"</span>
                        </span>
                    </div>
                    <button 
                        onClick={clearSearch}
                        className="p-2 hover:bg-white/10 rounded-lg dark:text-slate-300 text-slate-600 transition-colors flex items-center gap-1 text-xs font-bold"
                    >
                        <X className="w-4 h-4" /> Clear
                    </button>
                </div>
            )}

            <section id="trends-section">
                <div className={`flex justify-between items-end mb-8 border-b pb-4 ${darkMode ? 'border-white/5' : 'border-slate-200'}`}>
                    <div>
                        <h2 className={`text-2xl font-bold mb-2 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                            <Layers className="w-6 h-6 text-accent-cyan" />
                            {searchQuery ? 'Matching Trends' : "Today's Microstock Trends"}
                        </h2>
                        <p className="text-slate-400 text-sm">
                            {settings.lastScrapedDate 
                                ? `Data sourced: ${settings.lastScrapedDate}` 
                                : 'Automated analysis of high-demand niches.'}
                            {loadingTrends && <span className="ml-2 text-accent-cyan animate-pulse"> (Refreshing Live Data...)</span>}
                        </p>
                    </div>
                </div>

                {filteredTrends.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredTrends.map((trend, index) => (
                        <TrendCard 
                            key={trend.id} 
                            trend={trend} 
                            index={index}
                            onClick={() => setSelectedTrend(trend)} 
                        />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-slate-500">
                        <p>No trends found matching "{searchQuery}". Try a different keyword.</p>
                    </div>
                )}
            </section>

            <section>
                <div className={`flex justify-between items-end mb-8 border-b pb-4 ${darkMode ? 'border-white/5' : 'border-slate-200'}`}>
                    <div>
                        <h2 className={`text-2xl font-bold mb-2 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                            <TrendingDown className="w-6 h-6 text-green-400" />
                            {searchQuery ? 'Matching Keywords' : 'Low Competition Keywords'}
                        </h2>
                        <p className="text-slate-400 text-sm">Best opportunity for today's uploads. Low difficulty, high search volume.</p>
                    </div>
                </div>

                {filteredKeywords.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredKeywords.map((item, index) => (
                            <KeywordCard 
                            key={item.id} 
                            item={item} 
                            index={index} 
                            onClick={() => handleKeywordClick(item)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-slate-500">
                        <p>No keywords found matching "{searchQuery}".</p>
                    </div>
                )}
            </section>

        </main>

        <aside className="lg:col-span-3 lg:order-first">
            <Sidebar 
                onNavigate={(view) => setViewState(view)} 
                onSearch={handleSearch}
            />
        </aside>
      </>
    );
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#020617] text-slate-200' : 'bg-slate-50 text-slate-900'} font-sans selection:bg-accent-cyan/30 selection:text-white transition-colors duration-300 relative`}>
      
      {/* GLOBAL TOAST NOTIFICATION */}
      <Toast 
         message={toast.msg} 
         type={toast.type} 
         subMessage={toast.sub}
         isVisible={toast.visible} 
         onClose={hideToast} 
      />

      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 ${darkMode ? 'bg-[#020617]/80 border-white/5' : 'bg-white/80 border-slate-200'} backdrop-blur-xl border-b shadow-lg shadow-black/5`}>
        <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => { setViewState(ViewState.HOME); setSearchQuery(''); }}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-cyan to-blue-600 shadow-[0_0_15px_rgba(34,211,238,0.3)] flex items-center justify-center text-black font-bold">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
                <h1 className={`font-bold text-xl tracking-tight leading-none ${darkMode ? 'text-white' : 'text-slate-900'}`}>MicroStock<span className="text-accent-cyan">AI</span></h1>
                <p className="text-[10px] text-slate-500 font-medium tracking-wider">INTELLIGENT RESEARCH TOOL</p>
            </div>
          </div>
          
          <div className={`hidden lg:flex items-center gap-1 p-1 rounded-xl border ${darkMode ? 'bg-white/5 border-white/5' : 'bg-slate-100 border-slate-200'}`}>
            <button onClick={() => setViewState(ViewState.HOME)} className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${viewState === ViewState.HOME ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>
               Trends
            </button>
            <button onClick={() => setViewState(ViewState.METADATA)} className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${viewState === ViewState.METADATA ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>
               Tools
            </button>
            {currentUser?.role === 'admin' && (
              <button onClick={() => setViewState(ViewState.ADMIN)} className={`px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${viewState === ViewState.ADMIN ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30' : 'text-purple-400 hover:text-purple-300 hover:bg-purple-500/10'}`}>
                <Shield className="w-4 h-4" />
                Admin Panel
              </button>
            )}
          </div>

          <div className="flex items-center gap-4">
             <button 
               onClick={toggleTheme}
               className={`p-2 rounded-lg border transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-yellow-400' : 'bg-white border-slate-200 text-slate-600'}`}
             >
               {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
             </button>

            {/* Auth Button Area */}
            {currentUser ? (
              <div className="flex items-center gap-3">
                <div 
                    className="flex items-center gap-2 text-right cursor-pointer"
                    onClick={() => setViewState(ViewState.SETTINGS)}
                >
                   <div className="hidden sm:block">
                      <p className="text-xs font-bold dark:text-white text-slate-900">{currentUser.name}</p>
                      <p className="text-[10px] text-slate-500 uppercase">{currentUser.role}</p>
                   </div>
                   <img src={currentUser.avatar} alt="Avatar" className="w-8 h-8 rounded-full bg-slate-200 border border-slate-700 hover:border-accent-cyan transition-colors" />
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-2 rounded-lg hover:bg-red-500/10 hover:text-red-500 text-slate-500 transition-colors"
                  title="Log Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button 
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm shadow-lg hover:scale-105 transition-transform"
              >
                  <UserIcon className="w-4 h-4" />
                  Sign In
              </button>
            )}

             <button className={`lg:hidden p-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                <Menu className="w-6 h-6" />
             </button>
          </div>
        </div>
      </nav>

      {/* Main Content Layout */}
      <div className="pt-24 pb-20 px-6 max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {renderContent()}
      </div>

      <footer className={`border-t py-12 mt-12 ${darkMode ? 'border-white/5 bg-[#01040f]' : 'border-slate-200 bg-slate-50'}`}>
        <div className="max-w-7xl mx-auto px-6 text-center">
            <div className="flex justify-center items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-accent-cyan" />
                <span className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-slate-900'}`}>MicroStock<span className="text-accent-cyan">AI</span></span>
            </div>
          <p className="text-slate-500 text-sm">© {new Date().getFullYear()} Automated Research Platform for Contributors.</p>
        </div>
      </footer>

      <TrendDetailModal 
        trend={selectedTrend} 
        onClose={() => setSelectedTrend(null)} 
        userApiKeys={userApiKeys}
        onOpenSettings={() => { setSelectedTrend(null); setViewState(ViewState.SETTINGS); }}
        showToast={showToast}
      />

      {showAuthModal && (
        <AuthModal 
          onLogin={handleLogin} 
          onClose={() => setShowAuthModal(false)} 
          showToast={showToast}
        />
      )}
    </div>
  );
};

export default App;
