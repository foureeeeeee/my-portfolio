import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Save, RotateCcw, Lock, MapPin } from 'lucide-react';
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
      newItem = { id: newId, name: 'New Location', date: '2024', x: 50, y: 50, images: ['https://picsum.photos/800/600'] } as TravelLocation;
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
    
    // Update both x and y
    setLocalData(prev => ({
        ...prev,
        travels: prev.travels.map(item => 
          item.id === id ? { ...item, x, y } : item
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
        className="w-full max-w-5xl bg-[#111] border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/10 bg-black/50">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-red-500"/>
            <div className="w-3 h-3 rounded-full bg-yellow-500"/>
            <div className="w-3 h-3 rounded-full bg-green-500"/>
            <span className="ml-4 font-mono text-sm text-gray-400">ADMIN_PORTAL_V1.1</span>
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
            <div className="w-64 border-r border-white/10 bg-black/20 p-6 flex flex-col gap-2">
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
                        className="absolute top-4 right-4 text-gray-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={18} />
                      </button>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Dynamic fields based on type */}
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

                        {activeTab === 'travels' && (
                           <>
                              <div className="col-span-1">
                                <label className="text-xs text-gray-500 block mb-1">Location Name</label>
                                <input 
                                  value={item.name} 
                                  onChange={(e) => handleInputChange('travels', item.id, 'name', e.target.value)}
                                  className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                                />
                              </div>
                              <div className="col-span-1">
                                <label className="text-xs text-gray-500 block mb-1">Date/Year</label>
                                <input 
                                  value={item.date} 
                                  onChange={(e) => handleInputChange('travels', item.id, 'date', e.target.value)}
                                  className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                                />
                              </div>
                              <div className="col-span-2">
                                <label className="text-xs text-gray-500 block mb-1">Images (Comma separated URLs)</label>
                                <textarea 
                                  value={item.images.join(',')} 
                                  onChange={(e) => handleInputChange('travels', item.id, 'images', e.target.value.split(','))}
                                  className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm focus:border-purple-500 focus:outline-none h-16 font-mono text-xs"
                                />
                              </div>
                              <div className="col-span-2">
                                <label className="text-xs text-gray-500 block mb-2">Location Coordinates (Click to set)</label>
                                <div 
                                    ref={mapPickerRef}
                                    className="relative w-full aspect-[2/1] bg-black border border-white/20 rounded cursor-crosshair overflow-hidden group/map"
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
                                        className="absolute w-3 h-3 bg-yellow-500 rounded-full border border-white -ml-1.5 -mt-1.5"
                                        style={{ left: `${item.x}%`, top: `${item.y}%` }}
                                    />
                                    <div className="absolute top-2 right-2 text-xs bg-black/50 px-2 rounded">
                                        X: {Math.round(item.x)}% Y: {Math.round(item.y)}%
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