import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import MatrixLoader from './components/MatrixLoader';
import CustomCursor from './components/CustomCursor';
import Hero from './components/Hero';
import Marquee from './components/Marquee';
import ProjectCard from './components/ProjectCard';
import ProjectDetail from './components/ProjectDetail';
import NoiseOverlay from './components/NoiseOverlay';
import ParticleBackground from './components/ParticleBackground'; 
import AdminPortal from './components/AdminPortal';
import SocialHub from './components/SocialHub';
import WorldMap from './components/WorldMap';
import TravelPage from './components/TravelPage';
import HobbyWorld from './components/HobbyWorld';
import HobbySection from './components/HobbySection';
import ExperienceAvatar from './components/ExperienceAvatar';
import { getPortfolioData, AppData } from './utils/dataManager';
import { Github, Linkedin, Mail, Twitter, Lock, Globe, Smile } from 'lucide-react';
import { Project } from './types';

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [portfolioData, setPortfolioData] = useState<AppData | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [view, setView] = useState<'home' | 'travel' | 'hobby'>('home');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    // Load data on mount
    const data = getPortfolioData();
    setPortfolioData(data);
  }, []);

  const handleDataUpdate = (newData: AppData) => {
    setPortfolioData(newData);
  };

  if (!portfolioData) return null;

  return (
    <>
      <AnimatePresence mode="wait">
        {loading && <MatrixLoader onLoadingComplete={() => setLoading(false)} />}
      </AnimatePresence>

      {!loading && <CustomCursor />}
      
      {/* 
        Global Background Layer 
        Moved outside of motion.main to avoid transform stacking context issues.
        This ensures it remains fixed behind all content.
      */}
      {!loading && <ParticleBackground />}

      <AnimatePresence>
        {showAdmin && (
          <AdminPortal 
            isOpen={showAdmin} 
            onClose={() => setShowAdmin(false)} 
            data={portfolioData} 
            onUpdate={handleDataUpdate}
          />
        )}
      </AnimatePresence>
      
      {/* Project Detail Overlay */}
      <AnimatePresence>
        {selectedProject && (
          <ProjectDetail 
            project={selectedProject} 
            onClose={() => setSelectedProject(null)} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {view === 'travel' && !loading && (
            <motion.div
                key="travel-page"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative z-50"
            >
                <TravelPage 
                    locations={portfolioData.travels} 
                    onBack={() => setView('home')} 
                />
            </motion.div>
        )}

        {view === 'hobby' && !loading && (
            <motion.div
                key="hobby-page"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                transition={{ duration: 0.8 }}
                className="relative z-50"
            >
                <HobbyWorld 
                    hobbies={portfolioData.hobbies} 
                    onBack={() => setView('home')} 
                />
            </motion.div>
        )}

        {view === 'home' && !loading && (
          <motion.main 
            key="home-page"
            initial={{ opacity: 0, scale: 1.02, filter: "blur(5px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.95, filter: "blur(5px)" }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            // Removed bg-[#050505] so transparency allows ParticleBackground to show through
            className="min-h-screen text-white selection:bg-purple-500/30 selection:text-purple-200 overflow-x-hidden relative z-10"
          >
            <NoiseOverlay />
            
            <nav className="fixed top-0 left-0 w-full p-6 md:p-8 flex justify-between items-center z-40 mix-blend-difference">
               <div className="text-xl font-bold tracking-tighter">ZU.</div>
               <div className="hidden md:flex gap-8 text-sm font-medium tracking-wide items-center">
                  <a href="#works" className="hover:opacity-50 transition-opacity">WORKS</a>
                  <a href="#experience" className="hover:opacity-50 transition-opacity">EXPERIENCE</a>
                  <button onClick={() => setView('travel')} className="hover:opacity-50 transition-opacity flex items-center gap-1">
                      TRAVEL <Globe size={12} />
                  </button>
                  <button onClick={() => setView('hobby')} className="hover:opacity-50 transition-opacity flex items-center gap-1">
                      HOBBIES <Smile size={12} />
                  </button>
                  <a href="#honors" className="hover:opacity-50 transition-opacity">HONORS</a>
                  <a href="#skills" className="hover:opacity-50 transition-opacity">SKILLS</a>
                  <a href="#connect" className="hover:opacity-50 transition-opacity">CONNECT</a>
               </div>
               <div className="md:hidden">
                 <div className="w-6 h-0.5 bg-white mb-1.5"></div>
                 <div className="w-6 h-0.5 bg-white"></div>
               </div>
            </nav>

            <Hero />
            
            <Marquee />
            
            <section id="works" className="py-24 px-6 md:px-12 max-w-7xl mx-auto relative z-10">
              <div className="flex items-center gap-4 mb-24">
                 <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                 <h2 className="text-sm font-mono tracking-widest text-gray-400">SELECTED WORKS</h2>
              </div>
              
              <div className="flex flex-col gap-12">
                {portfolioData.projects.map((project, index) => (
                  <ProjectCard 
                    key={project.id} 
                    project={project} 
                    index={index} 
                    onClick={(p) => setSelectedProject(p)}
                  />
                ))}
              </div>
            </section>

            {/* Experience has its own background to keep text legible */}
            <section id="experience" className="py-24 px-6 md:px-12 bg-[#0a0a0a] relative z-10">
               <div className="max-w-7xl mx-auto">
                  <div className="flex items-center gap-4 mb-20">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <h2 className="text-sm font-mono tracking-widest text-gray-400">RESEARCH & EXPERIENCE</h2>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
                     <div className="lg:col-span-5 sticky top-32 z-20">
                        <ExperienceAvatar />
                        <div className="mt-8 text-xs text-gray-600 font-mono hidden lg:block">
                          // INTERACTIVE VISUAL<br/>
                          // HOVER TO DECRYPT IDENTITY
                        </div>
                     </div>

                     <div className="lg:col-span-7 flex flex-col gap-12">
                       {portfolioData.experience.map((exp, i) => (
                          <motion.div 
                            key={exp.id}
                            className="group border-b border-white/10 pb-16 hover:border-white/30 transition-colors duration-500"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-10%" }}
                            transition={{ delay: i * 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                          >
                             <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                                <div className="md:col-span-3 text-gray-500 font-mono text-sm">{exp.period}</div>
                                <div className="md:col-span-9">
                                   <h3 className="text-2xl md:text-3xl font-bold mb-3 group-hover:text-purple-400 transition-colors duration-300">{exp.role}</h3>
                                   <div className="text-lg text-gray-300 font-light mb-4">{exp.company}</div>
                                   <div className="text-gray-400 text-sm leading-relaxed">
                                      {exp.description}
                                   </div>
                                </div>
                             </div>
                          </motion.div>
                       ))}
                     </div>
                  </div>
               </div>
            </section>

            <section className="relative h-[80vh] overflow-hidden flex flex-col items-center justify-center bg-black border-y border-white/10 group">
                <div className="absolute inset-0 z-0 opacity-70 transition-opacity duration-700">
                    <WorldMap locations={portfolioData.travels} />
                </div>
                <div className="relative z-10 text-center pointer-events-none opacity-100 group-hover:opacity-0 transition-opacity duration-500">
                    <h2 className="text-4xl md:text-6xl font-bold mb-6 drop-shadow-2xl">GLOBAL FOOTPRINT</h2>
                    <div className="px-8 py-3 bg-white/10 backdrop-blur-md text-white font-medium rounded-full flex items-center gap-2 mx-auto border border-white/20">
                         <Globe size={18} /> EXPLORE MAP
                    </div>
                </div>
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
                    <button 
                        onClick={() => setView('travel')}
                        className="text-xs font-mono text-gray-500 hover:text-white transition-colors tracking-widest uppercase flex items-center gap-2"
                    >
                        [ Enter Immersive Mode ]
                    </button>
                </div>
            </section>

            <section id="honors" className="py-24 px-6 md:px-12 max-w-7xl mx-auto relative z-10">
               <div className="flex items-center gap-4 mb-20">
                   <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                   <h2 className="text-sm font-mono tracking-widest text-gray-400">HONORS & AWARDS</h2>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {portfolioData.awards.map((award, i) => (
                    <motion.div 
                      key={award.id}
                      className="p-10 border border-white/10 bg-white/5 backdrop-blur-sm rounded hover:border-white/30 transition-all duration-500 cursor-default"
                      initial={{ opacity: 0, scale: 0.95 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      whileHover={{ y: -5, backgroundColor: "rgba(255,255,255,0.08)" }}
                    >
                       <div className="flex justify-between items-start mb-6">
                          <span className="text-4xl font-bold text-gray-200">{award.year}</span>
                          <span className="px-4 py-1.5 bg-white/10 rounded-full text-xs tracking-wide uppercase">{award.rank}</span>
                       </div>
                       <h4 className="text-2xl text-white font-light">{award.title}</h4>
                    </motion.div>
                  ))}
               </div>
            </section>

            <section id="skills" className="py-24 px-6 md:px-12 bg-gradient-to-b from-black to-[#080808] relative z-10">
               <div className="max-w-7xl mx-auto text-center">
                  <h2 className="text-4xl md:text-6xl font-bold mb-16 tracking-tight">Expertise</h2>
                  <div className="flex flex-wrap justify-center gap-4 mb-32 max-w-4xl mx-auto">
                     {['Figma', 'Adobe XD', 'Photoshop', 'After Effects', 'React', 'Tailwind', 'Blender', 'Spline', 'Three.js'].map((skill, i) => (
                        <motion.span 
                          key={i}
                          className="px-8 py-4 border border-white/20 rounded-full text-xl md:text-2xl font-light hover:bg-white hover:text-black hover:scale-105 transition-all duration-300 cursor-default bg-black/50 backdrop-blur-md"
                          whileHover={{ rotate: Math.random() * 6 - 3 }}
                        >
                           {skill}
                        </motion.span>
                     ))}
                  </div>
               </div>
            </section>

            {/* Separated Hobby Section */}
            <HobbySection onEnter={() => setView('hobby')} />

            {/* Social Hub (Purely links now) */}
            <SocialHub />

            <footer className="py-8 border-t border-white/5 bg-black text-center relative z-20">
               <div className="flex flex-col items-center gap-4">
                   <p className="text-gray-600 text-xs tracking-widest uppercase">© 2024 Zu Kaiquan. All Rights Reserved.</p>
                   <button 
                      onClick={() => setShowAdmin(true)}
                      className="text-gray-800 hover:text-gray-500 transition-colors"
                      title="Admin Access"
                    >
                      <Lock size={12} />
                    </button>
               </div>
            </footer>
          </motion.main>
        )}
      </AnimatePresence>
    </>
  );
};

export default App;