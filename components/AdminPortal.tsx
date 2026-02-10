import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Save, RotateCcw, Lock, Search, Image as ImageIcon, Loader2, Globe, Download, Check, Copy, FileCode, Smile } from 'lucide-react';
import { AppData, savePortfolioData, resetPortfolioData } from '../utils/dataManager';
import { Project, Experience, Award, TravelLocation, Hobby } from '../types';

interface AdminPortalProps {
  isOpen: boolean;
  onClose: () => void;
  data: AppData;
  onUpdate: (newData: AppData) => void;
}

const AdminPortal: React.FC<AdminPortalProps> = ({ isOpen, onClose, data, onUpdate }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'projects' | 'experience' | 'awards' | 'travels' | 'hobbies'>('projects');
  
  // Initialize with empty structure to satisfy type checker before useEffect runs
  const [localData, setLocalData] = useState<AppData>({
      projects: [],
      experience: [],
      awards: [],
      travels: [],
      hobbies: []
  });
  
  const [error, setError] = useState('');
  const [showExport, setShowExport] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  
  // Geocoding State
  const [isSearching, setIsSearching] = useState<number | null>(null); 
  const mapPickerRef = useRef<HTMLDivElement>(null);

  // Sync with prop data when opening, using DEEP CLONE to avoid reference issues
  useEffect(() => {
    if (isOpen && data) {
      try {
          // JSON parse/stringify ensures we break all references to the original object
          setLocalData(JSON.parse(JSON.stringify(data)));
      } catch (e) {
          console.error("Failed to clone data", e);
          setLocalData(data);
      }
    }
  }, [isOpen, data]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin') { 
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Incorrect password');
    }
  };

  const handleSave = () => {
    try {
        savePortfolioData(localData);
        onUpdate(localData);
        alert("Changes saved to Local Browser Storage successfully.");
    } catch (e) {
        alert("Failed to save changes.");
        console.error(e);
    }
  };

  const handleReset = () => {
    if (confirm('WARNING: This will wipe all your custom edits and revert to the hardcoded defaults in dataManager.ts. Continue?')) {
      const defaults = resetPortfolioData();
      setLocalData(defaults);
      onUpdate(defaults);
    }
  };

  const handleExport = () => {
      setShowExport(true);
      setCopySuccess(false);
  };

  // GENERATE THE FULL TYPESCRIPT FILE CONTENT
  const generateSourceCode = () => {
    return `import { Project, Experience, Award, TravelLocation, Hobby } from '../types';

export interface AppData {
  projects: Project[];
  experience: Experience[];
  awards: Award[];
  travels: TravelLocation[];
  hobbies: Hobby[];
}

const DEFAULT_PROJECTS: Project[] = ${JSON.stringify(localData.projects, null, 2)};

const DEFAULT_EXPERIENCE: Experience[] = ${JSON.stringify(localData.experience, null, 2)};

const DEFAULT_AWARDS: Award[] = ${JSON.stringify(localData.awards, null, 2)};

const DEFAULT_TRAVELS: TravelLocation[] = ${JSON.stringify(localData.travels, null, 2)};

const DEFAULT_HOBBIES: Hobby[] = ${JSON.stringify(localData.hobbies, null, 2)};

const STORAGE_KEY = 'zu_portfolio_data_v1';

// Default State in Code
const DEFAULT_DATA: AppData = {
    projects: DEFAULT_PROJECTS,
    experience: DEFAULT_EXPERIENCE,
    awards: DEFAULT_AWARDS,
    travels: DEFAULT_TRAVELS,
    hobbies: DEFAULT_HOBBIES
};

export const getPortfolioData = (): AppData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      
      // Robust Check: Ensure all sections exist, if not merge with defaults
      return {
          projects: data.projects || DEFAULT_DATA.projects,
          experience: data.experience || DEFAULT_DATA.experience,
          awards: data.awards || DEFAULT_DATA.awards,
          travels: data.travels || DEFAULT_DATA.travels,
          hobbies: data.hobbies || DEFAULT_DATA.hobbies
      };
    }
  } catch (e) {
    console.error("Failed to load portfolio data", e);
  }
  // Return a copy to avoid mutation reference issues
  return JSON.parse(JSON.stringify(DEFAULT_DATA));
};

export const savePortfolioData = (data: AppData) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    console.log("Data saved to Local Storage:", STORAGE_KEY);
  } catch (e) {
    console.error("Failed to save portfolio data", e);
    throw e;
  }
};

export const resetPortfolioData = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log("Local Storage cleared. Reverting to code defaults.");
    // Return a fresh copy of defaults
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
  } catch (e) {
    console.error("Failed to reset data", e);
    return DEFAULT_DATA;
  }
};
`;
  };

  const copyToClipboard = () => {
      const code = generateSourceCode();
      navigator.clipboard.writeText(code);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleInputChange = (
    section: keyof AppData,
    id: number,
    field: string,
    value: any
  ) => {
    setLocalData(prev => ({
      ...prev,
      [section]: prev[section].map((item: any) => 
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  // --- ARRAY HANDLERS (Travels, Hobbies, Projects) ---

  const handleImageArrayChange = (section: 'travels' | 'hobbies' | 'projects', id: number, index: number, value: string) => {
      setLocalData(prev => ({
          ...prev,
          [section]: prev[section].map((item: any) => {
              if (item.id !== id) return item;
              // Normalize key names: hobbies='gallery', travels='images', projects='gallery'
              const key = section === 'travels' ? 'images' : 'gallery';
              const newImages = [...(item[key] || [])];
              newImages[index] = value;
              return { ...item, [key]: newImages };
          })
      }));
  };

  const addImageField = (section: 'travels' | 'hobbies' | 'projects', id: number) => {
      setLocalData(prev => ({
          ...prev,
          [section]: prev[section].map((item: any) => {
              const key = section === 'travels' ? 'images' : 'gallery';
              return item.id === id ? { ...item, [key]: [...(item[key] || []), ''] } : item;
          })
      }));
  };

  const removeImageField = (section: 'travels' | 'hobbies' | 'projects', id: number, index: number) => {
      setLocalData(prev => ({
          ...prev,
          [section]: prev[section].map((item: any) => {
              if (item.id !== id) return item;
              const key = section === 'travels' ? 'images' : 'gallery';
              const newImages = (item[key] || []).filter((_: any, i: number) => i !== index);
              return { ...item, [key]: newImages };
          })
      }));
  };

  const handleAutoLocate = async (id: number, query: string) => {
      // (Geocoding logic remains same as previous)
      if (!query) return;
      setIsSearching(id);
      try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
          const data = await res.json();
          
          if (data && data.length > 0) {
              const lat = parseFloat(data[0].lat);
              const lon = parseFloat(data[0].lon);
              const x = ((lon + 180) / 360) * 100;
              const y = ((90 - lat) / 180) * 100;

              setLocalData(prev => ({
                  ...prev,
                  travels: prev.travels.map(item => 
                      item.id === id ? { ...item, lat, lng: lon, x, y } : item
                  )
              }));
          } else {
              alert("Location not found.");
          }
      } catch (err) {
          console.error("Geocoding failed", err);
      } finally {
          setIsSearching(null);
      }
  };

  const addItem = (section: keyof AppData) => {
    const newId = Date.now();
    let newItem: any;

    if (section === 'projects') {
      newItem = { 
        id: newId, 
        title: 'New Project', 
        category: 'Design', 
        year: '2024', 
        description: 'Short description...', 
        longDescription: 'Full detailed description...',
        client: '',
        link: '',
        image: 'https://picsum.photos/1200/800',
        gallery: [],
        technologies: []
      } as Project;
    } else if (section === 'experience') {
      newItem = { id: newId, role: 'New Role', company: 'Company', period: '2024', description: 'Description...' } as Experience;
    } else if (section === 'awards') {
      newItem = { id: newId, title: 'Award Title', rank: 'Winner', year: '2024' } as Award;
    } else if (section === 'travels') {
      newItem = { id: newId, name: 'New Location', date: '2024', lat: 0, lng: 0, x: 50, y: 50, images: ['https://picsum.photos/800/600'], description: "New travel entry." } as TravelLocation;
    } else if (section === 'hobbies') {
        newItem = { id: newId, name: "New Hobby", category: "General", coverImage: "https://picsum.photos/200", description: "Describe...", news: "", gallery: [] } as Hobby;
    }

    setLocalData(prev => ({
      ...prev,
      [section]: [newItem, ...prev[section]]
    }));
  };

  const deleteItem = (section: keyof AppData, id: number) => {
    if (confirm('Delete this item?')) {
      setLocalData(prev => ({
        ...prev,
        [section]: prev[section].filter((item: any) => item.id !== id)
      }));
    }
  };

  // (Map picker logic remains same)
  const handleMapClick = (e: React.MouseEvent, id: number) => {
    if (!mapPickerRef.current) return;
    const rect = mapPickerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const lng = (x / 100) * 360 - 180;
    const lat = 90 - (y / 100) * 180;

    setLocalData(prev => ({
        ...prev,
        travels: prev.travels.map(item => 
          item.id === id ? { ...item, x, y, lat, lng } : item
        )
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-6xl bg-[#111] border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/10 bg-black/50">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-red-500"/>
            <div className="w-3 h-3 rounded-full bg-yellow-500"/>
            <div className="w-3 h-3 rounded-full bg-green-500"/>
            <span className="ml-4 font-mono text-sm text-gray-400">ADMIN_PORTAL_V2.5</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        {!isAuthenticated ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12">
            <Lock size={48} className="mb-6 text-purple-500" />
            <h2 className="text-2xl font-bold mb-8">Access Restricted</h2>
            <form onSubmit={handleLogin} className="w-full max-w-xs flex flex-col gap-4">
              <input 
                type="password" 
                placeholder="Enter Password (admin)" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="bg-white/5 border border-white/10 rounded px-4 py-3 text-center focus:outline-none focus:border-purple-500 transition-colors"
                autoFocus
              />
              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
              <button 
                type="submit"
                className="bg-white text-black font-bold py-3 rounded hover:bg-gray-200 transition-colors"
              >
                Unlock
              </button>
            </form>
          </div>
        ) : showExport ? (
             <div className="flex-1 p-8 overflow-hidden flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-2xl font-bold mb-1">Permanent Update Code</h3>
                        <p className="text-gray-400 text-sm">Paste this into <code className="bg-white/10 px-1 rounded text-green-400">utils/dataManager.ts</code></p>
                    </div>
                    <button onClick={() => setShowExport(false)} className="text-gray-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>
                <div className="flex-1 bg-black/50 border border-white/10 rounded p-4 relative overflow-hidden">
                    <textarea 
                        readOnly 
                        className="w-full h-full bg-transparent text-xs font-mono text-gray-300 focus:outline-none resize-none"
                        value={generateSourceCode()}
                    />
                    <button 
                        onClick={copyToClipboard}
                        className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700 transition-colors shadow-lg shadow-green-900/20"
                    >
                        {copySuccess ? <Check size={16} /> : <Copy size={16} />}
                        {copySuccess ? "Copied!" : "Copy Code"}
                    </button>
                </div>
             </div>
        ) : (
          <div className="flex-1 flex overflow-hidden">
            {/* Sidebar */}
            <div className="w-64 border-r border-white/10 bg-black/20 p-6 flex flex-col gap-2 shrink-0">
              <div className="text-xs font-mono text-gray-500 mb-4 uppercase tracking-wider">Collections</div>
              {(['projects', 'experience', 'awards', 'travels', 'hobbies'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-left px-4 py-3 rounded text-sm uppercase tracking-wide transition-all ${activeTab === tab ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                  {tab}
                </button>
              ))}
              
              <div className="mt-auto pt-6 border-t border-white/10 flex flex-col gap-3">
                <button 
                  onClick={handleSave}
                  className="flex items-center justify-center gap-2 bg-green-600/20 text-green-400 border border-green-600/30 py-2 rounded hover:bg-green-600/30 transition-all"
                  title="Saves to browser storage (Temporary)"
                >
                  <Save size={16} /> Save Local
                </button>
                <button 
                  onClick={handleExport}
                  className="flex items-center justify-center gap-2 bg-blue-600 text-white border border-blue-500 py-2 rounded hover:bg-blue-500 transition-all text-sm font-bold shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                >
                   <FileCode size={16} /> Update Codebase
                </button>
                <button 
                  onClick={handleReset}
                  className="flex items-center justify-center gap-2 bg-red-600/10 text-red-400 border border-red-600/20 py-2 rounded hover:bg-red-600/20 transition-all text-xs mt-2"
                >
                  <RotateCcw size={14} /> Reset
                </button>
              </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 overflow-y-auto p-8 bg-[#0a0a0a]">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold capitalize">{activeTab}</h3>
                <button 
                  onClick={() => addItem(activeTab)}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  <Plus size={16} /> Add Item
                </button>
              </div>

              <div className="space-y-6">
                <AnimatePresence>
                  {localData[activeTab]?.map((item: any) => (
                    <motion.div 
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-white/5 border border-white/10 rounded-lg p-6 relative group"
                    >
                      <button 
                        onClick={() => deleteItem(activeTab, item.id)}
                        className="absolute top-4 right-4 text-gray-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 z-10"
                      >
                        <Trash2 size={18} />
                      </button>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* --- PROJECTS --- */}
                        {activeTab === 'projects' && (
                          <>
                            <div className="col-span-2 md:col-span-1">
                              <label className="text-xs text-gray-500 block mb-1">Title</label>
                              <input 
                                value={item.title} 
                                onChange={(e) => handleInputChange('projects', item.id, 'title', e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                              />
                            </div>
                            <div className="col-span-1">
                              <label className="text-xs text-gray-500 block mb-1">Category</label>
                              <input 
                                value={item.category} 
                                onChange={(e) => handleInputChange('projects', item.id, 'category', e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                              />
                            </div>
                            <div className="col-span-2 md:col-span-1">
                              <label className="text-xs text-gray-500 block mb-1">Client</label>
                              <input 
                                value={item.client || ''} 
                                onChange={(e) => handleInputChange('projects', item.id, 'client', e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                                placeholder="e.g. Google"
                              />
                            </div>
                            <div className="col-span-1">
                              <label className="text-xs text-gray-500 block mb-1">Year</label>
                              <input 
                                value={item.year} 
                                onChange={(e) => handleInputChange('projects', item.id, 'year', e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="text-xs text-gray-500 block mb-1">Main Image URL</label>
                              <input 
                                value={item.image} 
                                onChange={(e) => handleInputChange('projects', item.id, 'image', e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm focus:border-purple-500 focus:outline-none font-mono text-xs text-gray-400"
                              />
                            </div>
                             <div className="col-span-2">
                              <label className="text-xs text-gray-500 block mb-1">Live Link URL</label>
                              <input 
                                value={item.link || ''} 
                                onChange={(e) => handleInputChange('projects', item.id, 'link', e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm focus:border-purple-500 focus:outline-none text-blue-400"
                                placeholder="https://..."
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="text-xs text-gray-500 block mb-1">Short Description (Card)</label>
                              <textarea 
                                value={item.description} 
                                onChange={(e) => handleInputChange('projects', item.id, 'description', e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm focus:border-purple-500 focus:outline-none h-20 resize-none"
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="text-xs text-gray-500 block mb-1">Long Description (Detail Page)</label>
                              <textarea 
                                value={item.longDescription || ''} 
                                onChange={(e) => handleInputChange('projects', item.id, 'longDescription', e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm focus:border-purple-500 focus:outline-none h-32 resize-none"
                                placeholder="Detailed case study text..."
                              />
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs text-gray-500 block mb-2">Gallery (Images/Videos)</label>
                                <div className="space-y-2">
                                    {(item.gallery || []).map((img: string, index: number) => (
                                        <div key={index} className="flex gap-2 items-center">
                                            <div className="w-8 h-8 bg-gray-800 rounded overflow-hidden shrink-0 border border-white/10">
                                                {img ? <img src={img} className="w-full h-full object-cover" alt="preview" onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/40?text=Err')} /> : <ImageIcon size={14} className="m-2 text-gray-600"/>}
                                            </div>
                                            <input 
                                                value={img}
                                                onChange={(e) => handleImageArrayChange('projects', item.id, index, e.target.value)}
                                                placeholder="https://... (Ends in .mp4 for video)"
                                                className="flex-1 bg-black/20 border border-white/10 rounded px-3 py-2 text-xs font-mono focus:border-purple-500 focus:outline-none"
                                            />
                                            <button 
                                                onClick={() => removeImageField('projects', item.id, index)}
                                                className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded text-gray-500 transition-colors"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    <button 
                                        onClick={() => addImageField('projects', item.id)}
                                        className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 mt-2"
                                    >
                                        <Plus size={12} /> Add Media URL
                                    </button>
                                </div>
                            </div>
                          </>
                        )}

                        {/* --- EXPERIENCE --- */}
                        {activeTab === 'experience' && (
                          <>
                            <div className="col-span-2 md:col-span-1">
                              <label className="text-xs text-gray-500 block mb-1">Role</label>
                              <input 
                                value={item.role} 
                                onChange={(e) => handleInputChange('experience', item.id, 'role', e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                              />
                            </div>
                            <div className="col-span-2 md:col-span-1">
                              <label className="text-xs text-gray-500 block mb-1">Company</label>
                              <input 
                                value={item.company} 
                                onChange={(e) => handleInputChange('experience', item.id, 'company', e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="text-xs text-gray-500 block mb-1">Period</label>
                              <input 
                                value={item.period} 
                                onChange={(e) => handleInputChange('experience', item.id, 'period', e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="text-xs text-gray-500 block mb-1">Description</label>
                              <textarea 
                                value={item.description} 
                                onChange={(e) => handleInputChange('experience', item.id, 'description', e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm focus:border-purple-500 focus:outline-none h-20 resize-none"
                              />
                            </div>
                          </>
                        )}

                        {/* --- AWARDS --- */}
                        {activeTab === 'awards' && (
                          <>
                            <div className="col-span-2">
                              <label className="text-xs text-gray-500 block mb-1">Award Title</label>
                              <input 
                                value={item.title} 
                                onChange={(e) => handleInputChange('awards', item.id, 'title', e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                              />
                            </div>
                            <div className="col-span-1">
                              <label className="text-xs text-gray-500 block mb-1">Rank/Prize</label>
                              <input 
                                value={item.rank} 
                                onChange={(e) => handleInputChange('awards', item.id, 'rank', e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                              />
                            </div>
                            <div className="col-span-1">
                              <label className="text-xs text-gray-500 block mb-1">Year</label>
                              <input 
                                value={item.year} 
                                onChange={(e) => handleInputChange('awards', item.id, 'year', e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                              />
                            </div>
                          </>
                        )}

                        {/* --- HOBBIES & TRAVELS (Previous Logic) --- */}
                         {activeTab === 'hobbies' && (
                          <>
                            <div className="col-span-2 md:col-span-1">
                              <label className="text-xs text-gray-500 block mb-1">Hobby Name</label>
                              <input 
                                value={item.name} 
                                onChange={(e) => handleInputChange('hobbies', item.id, 'name', e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                              />
                            </div>
                            <div className="col-span-2 md:col-span-1">
                              <label className="text-xs text-gray-500 block mb-1">Category</label>
                              <input 
                                value={item.category} 
                                onChange={(e) => handleInputChange('hobbies', item.id, 'category', e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                              />
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs text-gray-500 block mb-1">Cover Image (Bubble)</label>
                                <input 
                                  value={item.coverImage} 
                                  onChange={(e) => handleInputChange('hobbies', item.id, 'coverImage', e.target.value)}
                                  className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm focus:border-purple-500 focus:outline-none font-mono text-xs text-gray-400"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs text-gray-500 block mb-1">Latest News</label>
                                <input 
                                  value={item.news || ''} 
                                  onChange={(e) => handleInputChange('hobbies', item.id, 'news', e.target.value)}
                                  className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                                />
                            </div>
                            <div className="col-span-2">
                              <label className="text-xs text-gray-500 block mb-1">Description</label>
                              <textarea 
                                value={item.description} 
                                onChange={(e) => handleInputChange('hobbies', item.id, 'description', e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm focus:border-purple-500 focus:outline-none h-20 resize-none"
                              />
                            </div>

                            <div className="col-span-2">
                                <label className="text-xs text-gray-500 block mb-2">Trail Gallery</label>
                                <div className="space-y-2">
                                    {item.gallery.map((img: string, index: number) => (
                                        <div key={index} className="flex gap-2 items-center">
                                            <input 
                                                value={img}
                                                onChange={(e) => handleImageArrayChange('hobbies', item.id, index, e.target.value)}
                                                className="flex-1 bg-black/20 border border-white/10 rounded px-3 py-2 text-xs font-mono focus:border-purple-500 focus:outline-none"
                                            />
                                            <button 
                                                onClick={() => removeImageField('hobbies', item.id, index)}
                                                className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded text-gray-500"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    <button 
                                        onClick={() => addImageField('hobbies', item.id)}
                                        className="text-xs text-purple-400 flex items-center gap-1 mt-2"
                                    >
                                        <Plus size={12} /> Add Image
                                    </button>
                                </div>
                            </div>
                          </>
                        )}

                        {activeTab === 'travels' && (
                           <>
                              <div className="col-span-2 md:col-span-1">
                                <label className="text-xs text-gray-500 block mb-1">Name</label>
                                <input 
                                  value={item.name} 
                                  onChange={(e) => handleInputChange('travels', item.id, 'name', e.target.value)}
                                  className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                                />
                              </div>
                              <div className="col-span-2 md:col-span-1">
                                <label className="text-xs text-gray-500 block mb-1">Date</label>
                                <input 
                                  value={item.date} 
                                  onChange={(e) => handleInputChange('travels', item.id, 'date', e.target.value)}
                                  className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                                />
                              </div>
                              <div className="col-span-2">
                                 {/* (Location picker logic omitted for brevity as it was unchanged, simply re-rendering existing inputs) */}
                                 <label className="text-xs text-gray-500 block mb-2">Location Coordinates</label>
                                 <div className="flex gap-2">
                                      <input 
                                          className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-sm"
                                          placeholder="Search city..."
                                          onKeyDown={(e) => {
                                              if (e.key === 'Enter') handleAutoLocate(item.id, (e.target as HTMLInputElement).value);
                                          }}
                                          id={`search-${item.id}`}
                                      />
                                      <button 
                                          onClick={() => handleAutoLocate(item.id, (document.getElementById(`search-${item.id}`) as HTMLInputElement).value)}
                                          className="px-4 py-2 bg-blue-600/20 text-blue-400 border border-blue-600/30 rounded"
                                      >
                                          <Search size={16} />
                                      </button>
                                 </div>
                              </div>
                              <div className="col-span-2">
                                <label className="text-xs text-gray-500 block mb-2">Photo Gallery</label>
                                <div className="space-y-2">
                                    {item.images.map((img: string, index: number) => (
                                        <div key={index} className="flex gap-2 items-center">
                                            <input 
                                                value={img}
                                                onChange={(e) => handleImageArrayChange('travels', item.id, index, e.target.value)}
                                                className="flex-1 bg-black/20 border border-white/10 rounded px-3 py-2 text-xs font-mono focus:border-purple-500 focus:outline-none"
                                            />
                                            <button 
                                                onClick={() => removeImageField('travels', item.id, index)}
                                                className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded text-gray-500"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    <button 
                                        onClick={() => addImageField('travels', item.id)}
                                        className="text-xs text-purple-400 flex items-center gap-1 mt-2"
                                    >
                                        <Plus size={12} /> Add Image
                                    </button>
                                </div>
                              </div>
                           </>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AdminPortal;