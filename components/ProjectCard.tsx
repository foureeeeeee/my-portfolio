import React from 'react';
import { motion } from 'framer-motion';
import { Project } from '../types';
import { ArrowUpRight } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
  index: number;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, index }) => {
  return (
    <motion.div 
      className="group relative w-full border-t border-white/10 py-16 md:py-24 cursor-pointer"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.8, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-12 px-4 md:px-0">
        
        {/* Project Info */}
        <div className="md:w-1/3 z-10 pointer-events-none relative">
          <motion.div 
             className="absolute -left-4 w-1 h-0 bg-purple-500"
             whileInView={{ height: '100%' }}
             transition={{ duration: 0.5 }}
          />
          <span className="block text-xs font-mono text-gray-500 mb-3 tracking-widest">0{index + 1} // {project.category.toUpperCase()}</span>
          <h3 className="text-4xl md:text-6xl font-bold mb-6 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-green-400 transition-all duration-500">
            {project.title}
          </h3>
          <p className="text-gray-400 max-w-sm mb-6 font-light leading-relaxed">{project.description}</p>
          <div className="flex gap-2">
            {['Strategy', 'Design', 'Dev'].map((tag, i) => (
                <span key={i} className="text-[10px] uppercase tracking-wider border border-white/10 px-3 py-1.5 rounded-full text-gray-500 bg-white/5">{tag}</span>
            ))}
          </div>
        </div>

        {/* Project Preview Image */}
        <div className="md:w-3/5 relative overflow-hidden rounded-sm">
          <motion.div 
             className="relative aspect-[16/9] overflow-hidden bg-gray-900"
             whileHover={{ scale: 0.98 }}
             transition={{ duration: 0.5, ease: [0.33, 1, 0.68, 1] }}
          >
            <motion.img 
                src={project.image} 
                alt={project.title} 
                className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-700"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.7, ease: [0.33, 1, 0.68, 1] }}
            />
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors duration-500"></div>
          </motion.div>
        </div>

        {/* Action Button */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 -translate-x-10 group-hover:translate-x-0 transition-all duration-700 ease-[0.22,1,0.36,1] hidden md:block">
            <div className="w-20 h-20 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 transition-transform duration-300">
                <ArrowUpRight size={32} strokeWidth={1.5} />
            </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectCard;