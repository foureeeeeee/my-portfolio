import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Save, RotateCcw, Lock, MapPin, Search, Image as ImageIcon, Loader2, Globe } from 'lucide-react';
import { AppData, savePortfolioData, resetPortfolioData } from '../utils/dataManager';
import { Project, Experience, Award, TravelLocation } from '../types';

interface AdminPortalProps {
  isOpen: boolean;
  onClose: () => void;
  data: AppData;
  onUpdate: (newData: AppData) => void;
}

const AdminPortal: React.FC<AdminPortalProps> = ({ isOpen, onClose, data, onUpdate }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'projects' | 'experience' | 'awards' | 'travels'>('projects');
  const [localData, setLocalData] = useState<AppData>(data);
  const [error, setError] = useState('');
  
  // Geocoding State
  const [isSearching, setIsSearching] = useState<number | null>(null); // ID of item being searched
  const mapPickerRef = useRef<HTMLDivElement>(null);

  // Sync with prop data when opening
  useEffect(() => {
    if (isOpen) {
      setLocalData(data);
    }
  }, [isOpen, data]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin') { // Simple mock authentication
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Incorrect password');
    }
  };

  const handleSave = () => {
    savePortfolioData(localData);
    onUpdate(localData);
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all data to default? This cannot be undone.')) {
      const defaults = resetPortfolioData();
      setLocalData(defaults);
      onUpdate(defaults);
    }
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

  // --- TRAVEL SPECIFIC HANDLERS ---

  const handleAutoLocate = async (id: number, query: string) => {
      if (!query) return;
      setIsSearching(id);
      try {
          // Using OpenStreetMap Nominatim API (Free, no key required for low volume)
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
          const data = await res.json();
          
          if (data && data.length > 0) {
              const lat = parseFloat(data[0].lat);
              const lon = parseFloat(data[0].lon);
              
              // Calculate rough X/Y for the 2D map preview (Equirectangular approximation)
              // Longitude (-180 to 180) -> X (0 to 100)
              const x = ((lon + 180) / 360) * 100;
              // Latitude (90 to -90) -> Y (0 to 100)
              const y = ((90 - lat) / 180) * 100;

              setLocalData(prev => ({
                  ...prev,
                  travels: prev.travels.map(item => 
                      item.id === id ? { ...item, lat, lng: lon, x, y } : item
                  )
              }));
          } else {
              alert("Location not found. Try a different city name.");
          }
      } catch (err) {
          console.error("Geocoding failed", err);
          alert("Could not fetch coordinates.");
      } finally {
          setIsSearching(null);
      }
  };

  const handleImageArrayChange = (id: number, index: number, value: string) => {
      setLocalData(prev => ({
          ...prev,
          travels: prev.travels.map(item => {
              if (item.id !== id) return item;
              const newImages = [...item.images];
              newImages[index] = value;
              return { ...item, images: newImages };
          })
      }));
  };

  const addImageField = (id: number) => {
      setLocalData(prev => ({
          ...prev,
          travels: prev.travels.map(item => 
              item.id === id ? { ...item, images: [...item.images, ''] } : item
          )
      }));
  };

  const removeImageField = (id: number, index: number) => {
      setLocalData(prev => ({
          ...prev,
          travels: prev.travels.map(item => {
              if (item.id !== id) return item;
              const newImages = item.images.filter((_, i) => i !== index);
              return { ...item, images: newImages };
          })
      }));
  };

  // -----------------------------

  const addItem = (section: keyof AppData) => {
    const newId = Date.now();
    let newItem: any;

    if (section === 'projects') {
      newItem = { id: newId, title: 'New Project', category: 'Design', year: '2024', description: 'Description...', image: 'https://picsum.photos/1200/800' } as Project;
    } else if (section === 'experience') {
      newItem = { id: newId, role: 'New Role', company: 'Company', period: '2024', description: 'Description...' } as Experience;
    } else if (section === 'awards') {
      newItem = { id: newId, title: 'Award Title', rank: 'Winner', year: '2024' } as Award;
    } else {
      newItem = { 
          id: newId, 
          name: 'New Location', 
          date: '2024', 
          lat: 0, 
          lng: 0, 
          x: 50, 
          y: 50, 
          images: ['https://picsum.photos/800/600'],
          description: "New travel entry."
        } as TravelLocation;
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

  const handleMapClick = (e: React.MouseEvent, id: number) => {
    if (!mapPickerRef.current) return;
    const rect = mapPickerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Reverse calc for Lat/Lng (Approximate)
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
            <span className="ml-4 font-mono text-sm text-gray-400">ADMIN_PORTAL_V2.0</span>
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
        ) : (
          <div className="flex-1 flex overflow-hidden">
            {/* Sidebar */}
            <div className="w-64 border-r border-white/10 bg-black/20 p-6 flex flex-col gap-2 shrink-0">
              <div className="text-xs font-mono text-gray-500 mb-4 uppercase tracking-wider">Collections</div>
              {(['projects', 'experience', 'awards', 'travels'] as const).map(tab => (
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
                >
                  <Save size={16} /> Save Changes
                </button>
                <button 
                  onClick={handleReset}
                  className="flex items-center justify-center gap-2 bg-red-600/10 text-red-400 border border-red-600/20 py-2 rounded hover:bg-red-600/20 transition-all text-xs"
                >
                  <RotateCcw size={14} /> Reset Data
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
                  {localData[activeTab].map((item: any) => (
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
                        {/* Dynamic fields based on type */}
                        
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
                            <div className="col-span-2 md:col-span-1">
                              <label className="text-xs text-gray-500 block mb-1">Category</label>
                              <input 
                                value={item.category} 
                                onChange={(e) => handleInputChange('projects', item.id, 'category', e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="text-xs text-gray-500 block mb-1">Image URL</label>
                              <input 
                                value={item.image} 
                                onChange={(e) => handleInputChange('projects', item.id, 'image', e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm focus:border-purple-500 focus:outline-none font-mono text-xs text-gray-400"
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="text-xs text-gray-500 block mb-1">Description</label>
                              <textarea 
                                value={item.description} 
                                onChange={(e) => handleInputChange('projects', item.id, 'description', e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm focus:border-purple-500 focus:outline-none h-20 resize-none"
                              />
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

                        {/* --- TRAVELS (REFINED) --- */}
                        {activeTab === 'travels' && (
                           <>
                              {/* 1. Basic Info Row */}
                              <div className="col-span-2 md:col-span-1">
                                <label className="text-xs text-gray-500 block mb-1">Location Name</label>
                                <div className="flex gap-2">
                                    <input 
                                    value={item.name} 
                                    onChange={(e) => handleInputChange('travels', item.id, 'name', e.target.value)}
                                    placeholder="e.g. Kyoto, Japan"
                                    className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                                    />
                                </div>
                              </div>
                              <div className="col-span-2 md:col-span-1">
                                <label className="text-xs text-gray-500 block mb-1">Date</label>
                                <input 
                                  value={item.date} 
                                  onChange={(e) => handleInputChange('travels', item.id, 'date', e.target.value)}
                                  className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                                />
                              </div>

                              {/* 2. Location Manager Row */}
                              <div className="col-span-2 bg-black/20 rounded p-4 border border-white/5 my-2">
                                  <div className="flex items-center gap-2 mb-3">
                                      <Globe size={14} className="text-blue-400" />
                                      <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">Coordinate Systems</span>
                                  </div>
                                  
                                  <div className="flex gap-2 mb-4">
                                      <input 
                                          className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                          placeholder="Search city for auto-coordinates..."
                                          // Note: We use the item name as initial search, but user can type here
                                          onKeyDown={(e) => {
                                              if (e.key === 'Enter') handleAutoLocate(item.id, (e.target as HTMLInputElement).value);
                                          }}
                                          defaultValue={item.name}
                                          id={`search-${item.id}`}
                                      />
                                      <button 
                                          onClick={() => handleAutoLocate(item.id, (document.getElementById(`search-${item.id}`) as HTMLInputElement).value)}
                                          className="px-4 py-2 bg-blue-600/20 text-blue-400 border border-blue-600/30 rounded hover:bg-blue-600/30 flex items-center gap-2 text-sm"
                                          disabled={isSearching === item.id}
                                      >
                                          {isSearching === item.id ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                                          Auto-Locate
                                      </button>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                      <div>
                                          <label className="text-[10px] text-gray-500 uppercase block mb-1">3D Globe (Lat/Lng)</label>
                                          <div className="flex gap-2">
                                              <input type="number" step="0.0001" value={item.lat} onChange={(e) => handleInputChange('travels', item.id, 'lat', parseFloat(e.target.value))} className="w-1/2 bg-black/40 border border-white/10 rounded px-2 py-1 text-xs font-mono" placeholder="Lat"/>
                                              <input type="number" step="0.0001" value={item.lng} onChange={(e) => handleInputChange('travels', item.id, 'lng', parseFloat(e.target.value))} className="w-1/2 bg-black/40 border border-white/10 rounded px-2 py-1 text-xs font-mono" placeholder="Lng"/>
                                          </div>
                                      </div>
                                      <div>
                                          <label className="text-[10px] text-gray-500 uppercase block mb-1">2D Map (X%/Y%)</label>
                                          <div className="flex gap-2">
                                              <input type="number" value={Math.round(item.x || 0)} readOnly className="w-1/2 bg-black/40 border border-white/5 text-gray-500 rounded px-2 py-1 text-xs font-mono" />
                                              <input type="number" value={Math.round(item.y || 0)} readOnly className="w-1/2 bg-black/40 border border-white/5 text-gray-500 rounded px-2 py-1 text-xs font-mono" />
                                          </div>
                                      </div>
                                  </div>
                              </div>
                              
                              {/* 3. Description */}
                              <div className="col-span-2">
                                <label className="text-xs text-gray-500 block mb-1">Description</label>
                                <textarea 
                                  value={item.description || ''} 
                                  onChange={(e) => handleInputChange('travels', item.id, 'description', e.target.value)}
                                  className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm focus:border-purple-500 focus:outline-none h-16 resize-none"
                                />
                              </div>

                              {/* 4. Visual Image Manager */}
                              <div className="col-span-2">
                                <label className="text-xs text-gray-500 block mb-2">Photo Gallery</label>
                                <div className="space-y-2">
                                    {item.images.map((img: string, index: number) => (
                                        <div key={index} className="flex gap-2 items-center">
                                            <div className="w-10 h-10 bg-gray-800 rounded overflow-hidden shrink-0 border border-white/10">
                                                {img ? <img src={img} className="w-full h-full object-cover" alt="preview" onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/40?text=Err')} /> : <ImageIcon size={16} className="m-2 text-gray-600"/>}
                                            </div>
                                            <input 
                                                value={img}
                                                onChange={(e) => handleImageArrayChange(item.id, index, e.target.value)}
                                                placeholder="https://..."
                                                className="flex-1 bg-black/20 border border-white/10 rounded px-3 py-2 text-xs font-mono focus:border-purple-500 focus:outline-none"
                                            />
                                            <button 
                                                onClick={() => removeImageField(item.id, index)}
                                                className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded text-gray-500 transition-colors"
                                                title="Remove Image"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    <button 
                                        onClick={() => addImageField(item.id)}
                                        className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 mt-2"
                                    >
                                        <Plus size={12} /> Add Image URL
                                    </button>
                                </div>
                              </div>

                              {/* 5. Map Preview (Read Only / Visual check) */}
                              <div className="col-span-2 mt-2">
                                <label className="text-xs text-gray-500 block mb-2">Location Visual Check</label>
                                <div 
                                    ref={mapPickerRef}
                                    className="relative w-full aspect-[2/1] bg-black border border-white/20 rounded cursor-crosshair overflow-hidden group/map"
                                    // Keeping manual override just in case, but usually search is better
                                    onClick={(e) => handleMapClick(e, item.id)}
                                >
                                     {/* Map Background for Reference */}
                                    <img 
                                        src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/World_map_blank_black_lines_4500px_monochrome.png/800px-World_map_blank_black_lines_4500px_monochrome.png" 
                                        className="absolute inset-0 w-full h-full object-cover opacity-50 pointer-events-none"
                                        alt="map reference"
                                    />
                                    {/* The Dot */}
                                    <div 
                                        className="absolute w-3 h-3 bg-yellow-500 rounded-full border border-white -ml-1.5 -mt-1.5 shadow-[0_0_10px_yellow]"
                                        style={{ left: `${item.x}%`, top: `${item.y}%` }}
                                    />
                                    <div className="absolute bottom-2 right-2 text-[10px] bg-black/80 px-2 py-1 rounded text-gray-400 pointer-events-none">
                                        Click map to manually override
                                    </div>
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