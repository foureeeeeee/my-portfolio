import React from 'react';
import { motion } from 'framer-motion';
import { Smile, ArrowRight, Sparkles } from 'lucide-react';

interface HobbySectionProps {
  onEnter: () => void;
}

const HobbySection: React.FC<HobbySectionProps> = ({ onEnter }) => {
  return (
    <section className="py-32 px-6 md:px-12 relative z-10 overflow-hidden">
      
      <div className="max-w-7xl mx-auto relative">
        <motion.div 
            className="relative rounded-[2rem] overflow-hidden border border-white/10 bg-gradient-to-br from-gray-900/50 via-black to-black p-12 md:p-24 text-center group"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
        >
            {/* Ethereal Glow Effects */}
            <div className="absolute top-[-50%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-white/10 to-transparent blur-[120px] rounded-full pointer-events-none opacity-50 group-hover:opacity-80 transition-opacity duration-1000"></div>
            
            {/* Floating Particles/Dust - CSS implementation for simple ambient effect */}
            <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>

            <div className="relative z-10 flex flex-col items-center">
                
                {/* Icon Badge */}
                <motion.div 
                    className="mb-8 p-6 rounded-full bg-gradient-to-b from-white/10 to-transparent border border-white/20 text-white relative"
                    whileHover={{ scale: 1.1, rotate: 180 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="absolute inset-0 bg-white/20 blur-xl rounded-full"></div>
                    <Smile size={40} className="relative z-10" />
                </motion.div>
                
                <h2 className="text-5xl md:text-8xl font-black mb-8 tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-200 to-gray-600 drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                    THE PLAYGROUND
                </h2>
                
                <div className="w-24 h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent mb-8"></div>

                <p className="max-w-2xl text-gray-300 text-lg md:text-xl mb-12 font-light leading-relaxed tracking-wide">
                    Beyond the code lies a separate dimension. 
                    <br className="hidden md:block"/>
                    Step into an <span className="text-white font-medium">immersive 3D realm</span> exploring the passions that fuel my creativity.
                </p>

                <motion.button
                    onClick={onEnter}
                    className="group relative flex items-center gap-4 px-12 py-5 bg-white text-black rounded-full font-bold text-lg overflow-hidden transition-transform duration-300 hover:scale-105"
                    whileHover="hover"
                    initial="initial"
                >
                    {/* Button Inner Glow */}
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-white opacity-100 group-hover:opacity-90 transition-opacity"></div>
                    
                    <span className="relative z-10 flex items-center gap-3">
                        ENTER HEAVEN <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform"/>
                    </span>
                    
                    {/* Ring Pulse Effect */}
                    <motion.div 
                        className="absolute inset-0 rounded-full border-2 border-white/50"
                        variants={{
                            hover: { scale: 1.5, opacity: 0 },
                            initial: { scale: 1, opacity: 1 }
                        }}
                        transition={{ duration: 1, repeat: Infinity }}
                    />
                </motion.button>

                <div className="mt-12 flex items-center gap-3 text-[10px] md:text-xs uppercase tracking-[0.2em] text-gray-500 font-mono">
                    <Sparkles size={12} className="text-yellow-200" />
                    <span>Experimental WebGL Environment</span>
                    <span className="text-gray-700">|</span>
                    <span>Audio Responsive</span>
                </div>
            </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HobbySection;