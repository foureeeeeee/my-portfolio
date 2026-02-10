import React from 'react';
import { motion } from 'framer-motion';
import { Project } from '../types';
import { X, ArrowUpRight, PlayCircle } from 'lucide-react';

interface ProjectDetailProps {
  project: Project;
  onClose: () => void;
}

const ProjectDetail: React.FC<ProjectDetailProps> = ({ project, onClose }) => {
  
  // Helper to detect if a url is a video
  const isVideo = (url: string) => {
      return url.endsWith('.mp4') || url.endsWith('.webm');
  };

  return (
    <motion.div
      className="fixed inset-0 z-[60] bg-[#080808] text-white overflow-y-auto custom-scrollbar"
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
        {/* Navigation Bar */}
        <div className="fixed top-0 left-0 w-full p-6 md:p-8 flex justify-between items-center z-20 mix-blend-difference pointer-events-none">
            <div className="text-xl font-bold tracking-tighter text-white">ZU.PROJECTS</div>
            <button 
                onClick={onClose}
                className="pointer-events-auto w-12 h-12 rounded-full border border-white/20 bg-black/20 backdrop-blur-md flex items-center justify-center hover:bg-white hover:text-black transition-all duration-300 group"
            >
                <X size={24} className="group-hover:rotate-90 transition-transform duration-300"/>
            </button>
        </div>

        {/* Hero Section */}
        <div className="relative w-full h-[60vh] md:h-[80vh] overflow-hidden">
            <motion.div 
                className="absolute inset-0"
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
            >
                <img 
                    src={project.image} 
                    className="w-full h-full object-cover opacity-60" 
                    alt={project.title} 
                />
            </motion.div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/40 to-transparent"></div>
            
            <div className="absolute bottom-0 left-0 w-full p-6 md:p-16">
                 <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                 >
                     <span className="block font-mono text-purple-400 text-sm tracking-widest mb-4 border border-purple-500/30 w-fit px-3 py-1 rounded-full bg-purple-900/10 backdrop-blur">
                        {project.category.toUpperCase()}
                     </span>
                     <h1 className="text-6xl md:text-9xl font-bold uppercase tracking-tighter leading-[0.9] text-white mb-6">
                        {project.title}
                     </h1>
                 </motion.div>
            </div>
        </div>

        {/* Content Container */}
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 md:py-24">
            <div className="flex flex-col lg:flex-row gap-16 lg:gap-32">
                
                {/* Left: Sticky Info */}
                <div className="lg:w-1/3">
                    <div className="sticky top-32 space-y-12">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.4 }}
                        >
                            <h3 className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-2">Description</h3>
                            <p className="text-gray-200 text-lg leading-relaxed font-light">
                                {project.longDescription || project.description}
                            </p>
                        </motion.div>

                        <motion.div 
                            className="grid grid-cols-2 gap-8"
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.5 }}
                        >
                            <div>
                                <h4 className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-1">Client</h4>
                                <p className="text-white text-sm">{project.client || "Self Initiated"}</p>
                            </div>
                            <div>
                                <h4 className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-1">Year</h4>
                                <p className="text-white text-sm">{project.year}</p>
                            </div>
                            <div className="col-span-2">
                                <h4 className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-2">Technology</h4>
                                <div className="flex flex-wrap gap-2">
                                    {project.technologies ? project.technologies.map((tech, i) => (
                                        <span key={i} className="text-xs border border-white/10 px-2 py-1 rounded text-gray-400">
                                            {tech}
                                        </span>
                                    )) : (
                                        <span className="text-xs text-gray-600">Confidential Stack</span>
                                    )}
                                </div>
                            </div>
                        </motion.div>

                        {project.link && (
                            <motion.a
                                href={project.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full py-4 bg-white text-black text-center font-bold uppercase tracking-wide rounded-sm hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 group"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.6 }}
                            >
                                Visit Live Site <ArrowUpRight size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            </motion.a>
                        )}
                    </div>
                </div>

                {/* Right: Gallery Stream */}
                <div className="lg:w-2/3 space-y-8 md:space-y-16">
                    {project.gallery && project.gallery.length > 0 ? (
                        project.gallery.map((mediaUrl, index) => (
                            <motion.div
                                key={index}
                                className="w-full relative bg-gray-900 overflow-hidden"
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-10%" }}
                                transition={{ duration: 0.8 }}
                            >
                                {isVideo(mediaUrl) ? (
                                    <div className="relative group">
                                         <video 
                                            src={mediaUrl} 
                                            className="w-full h-auto block"
                                            autoPlay
                                            loop
                                            muted
                                            playsInline
                                        />
                                        <div className="absolute top-4 right-4 bg-black/50 p-2 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                            <PlayCircle className="text-white" size={20} />
                                        </div>
                                    </div>
                                ) : (
                                    <img 
                                        src={mediaUrl} 
                                        alt={`Detail ${index + 1}`} 
                                        className="w-full h-auto block hover:scale-[1.01] transition-transform duration-700" 
                                    />
                                )}
                            </motion.div>
                        ))
                    ) : (
                        <div className="w-full aspect-video flex items-center justify-center border border-dashed border-white/10 text-gray-600">
                            <p className="font-mono text-sm">ADDITIONAL MEDIA RESTRICTED</p>
                        </div>
                    )}
                </div>

            </div>
        </div>

        {/* Footer Navigation Area */}
        <div className="border-t border-white/5 py-12 text-center bg-black">
             <button 
                onClick={onClose}
                className="text-gray-500 hover:text-white font-mono text-xs uppercase tracking-[0.2em] transition-colors"
             >
                Close Project
             </button>
        </div>
    </motion.div>
  );
};

export default ProjectDetail;
