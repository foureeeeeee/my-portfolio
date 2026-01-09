import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import MatrixLoader from './components/MatrixLoader';
import CustomCursor from './components/CustomCursor';
import Hero from './components/Hero';
import Marquee from './components/Marquee';
import ProjectCard from './components/ProjectCard';
import NoiseOverlay from './components/NoiseOverlay';
import { Project, Experience, Award } from './types';
import { Github, Linkedin, Mail, Twitter } from 'lucide-react';

const projects: Project[] = [
  {
    id: 1,
    title: "Easy Recycle",
    category: "UI/UX Design",
    year: "2024",
    description: "A sustainable lifestyle application focusing on recycling habits and community engagement.",
    image: "https://picsum.photos/1200/800?random=1"
  },
  {
    id: 2,
    title: "Yongling Band",
    category: "Branding",
    year: "2023",
    description: "Cultural heritage brand design for a traditional music ensemble with modern aesthetics.",
    image: "https://picsum.photos/1200/800?random=2"
  },
  {
    id: 3,
    title: "Martial Arts",
    category: "Interactive",
    year: "2024",
    description: "An immersive HTML5 promotional campaign for a mobile game launch.",
    image: "https://picsum.photos/1200/800?random=3"
  },
  {
    id: 4,
    title: "Lugu Sauce",
    category: "Packaging",
    year: "2022",
    description: "Premium packaging design for traditional agricultural products.",
    image: "https://picsum.photos/1200/800?random=4"
  }
];

const experience: Experience[] = [
  {
    id: 1,
    role: "Project Assistant",
    company: "National Social Science Fund",
    period: "2024.01 - 2024.02",
    description: "Assisted in data visualization and UI framework for cultural heritage research."
  },
  {
    id: 2,
    role: "UI Design Intern",
    company: "TechFlow Innovations",
    period: "2023.06 - 2023.12",
    description: "Led the redesign of the mobile component library and user dashboard."
  },
  {
    id: 3,
    role: "Visual Designer",
    company: "Creative Studio X",
    period: "2022.05 - 2023.01",
    description: "Produced marketing assets and brand identity systems for 10+ startups."
  }
];

const awards: Award[] = [
  { id: 1, title: "National Advertising Art Design Competition", rank: "First Prize", year: "2023" },
  { id: 2, title: "Blue Bridge Cup Design Contest", rank: "Second Prize", year: "2022" },
  { id: 3, title: "China Packaging Creative Design", rank: "Third Prize", year: "2022" }
];

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);

  return (
    <>
      <AnimatePresence>
        {loading && <MatrixLoader onLoadingComplete={() => setLoading(false)} />}
      </AnimatePresence>
      
      {!loading && (
        <main className="bg-[#050505] min-h-screen text-white selection:bg-purple-500/30 selection:text-purple-200 overflow-x-hidden">
          <CustomCursor />
          <NoiseOverlay />
          
          {/* Navbar */}
          <nav className="fixed top-0 left-0 w-full p-6 md:p-8 flex justify-between items-center z-40 mix-blend-difference">
             <div className="text-xl font-bold tracking-tighter">ZU.</div>
             <div className="hidden md:flex gap-8 text-sm font-medium tracking-wide">
                <a href="#works" className="hover:opacity-50 transition-opacity">WORKS</a>
                <a href="#experience" className="hover:opacity-50 transition-opacity">EXPERIENCE</a>
                <a href="#honors" className="hover:opacity-50 transition-opacity">HONORS</a>
                <a href="#skills" className="hover:opacity-50 transition-opacity">SKILLS</a>
             </div>
             <div className="md:hidden">
               {/* Mobile Menu Icon Placeholder */}
               <div className="w-6 h-0.5 bg-white mb-1.5"></div>
               <div className="w-6 h-0.5 bg-white"></div>
             </div>
          </nav>

          <Hero />
          
          <Marquee />
          
          {/* Selected Works Section */}
          <section id="works" className="py-24 px-6 md:px-12 max-w-7xl mx-auto relative z-10">
            <div className="flex items-center gap-4 mb-24">
               <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
               <h2 className="text-sm font-mono tracking-widest text-gray-400">SELECTED WORKS</h2>
            </div>
            
            <div className="flex flex-col gap-12">
              {projects.map((project, index) => (
                <ProjectCard key={project.id} project={project} index={index} />
              ))}
            </div>
          </section>

          {/* Experience Section */}
          <section id="experience" className="py-24 px-6 md:px-12 bg-[#0a0a0a] relative z-10">
             <div className="max-w-7xl mx-auto">
                <div className="flex items-center gap-4 mb-20">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <h2 className="text-sm font-mono tracking-widest text-gray-400">RESEARCH & EXPERIENCE</h2>
                </div>

                <div className="grid grid-cols-1 gap-12">
                   {experience.map((exp, i) => (
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
                            <div className="md:col-span-5">
                               <h3 className="text-2xl md:text-3xl font-bold mb-3 group-hover:text-purple-400 transition-colors duration-300">{exp.role}</h3>
                               <div className="text-lg text-gray-300 font-light">{exp.company}</div>
                            </div>
                            <div className="md:col-span-4 text-gray-400 text-sm leading-relaxed">
                               {exp.description}
                            </div>
                         </div>
                      </motion.div>
                   ))}
                </div>
             </div>
          </section>

          {/* Honors & Awards */}
          <section id="honors" className="py-24 px-6 md:px-12 max-w-7xl mx-auto relative z-10">
             <div className="flex items-center gap-4 mb-20">
                 <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                 <h2 className="text-sm font-mono tracking-widest text-gray-400">HONORS & AWARDS</h2>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {awards.map((award, i) => (
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

          {/* Skills & Footer */}
          <section id="skills" className="py-24 px-6 md:px-12 bg-gradient-to-b from-black to-gray-900 relative z-10">
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

                <div className="border-t border-white/10 pt-12 flex flex-col md:flex-row justify-between items-center gap-8">
                   <div className="flex gap-8">
                      <a href="#" className="hover:text-purple-400 hover:scale-125 transition-all duration-300"><Github size={24} /></a>
                      <a href="#" className="hover:text-purple-400 hover:scale-125 transition-all duration-300"><Linkedin size={24} /></a>
                      <a href="#" className="hover:text-purple-400 hover:scale-125 transition-all duration-300"><Twitter size={24} /></a>
                      <a href="#" className="hover:text-purple-400 hover:scale-125 transition-all duration-300"><Mail size={24} /></a>
                   </div>
                   <p className="text-gray-500 text-sm">© 2024 Zu Kaiquan. All Rights Reserved.</p>
                </div>
             </div>
          </section>
        </main>
      )}
    </>
  );
};

export default App;