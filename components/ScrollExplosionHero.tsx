import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import ParticleBackground from './ParticleBackground';

const AVATAR_URL = "https://raw.githubusercontent.com/foureeeeeee/picutestorage/main/avatar.png";

const ScrollExplosionHero: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Smooth out the scroll progress for heavy physics feel
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30, mass: 1 });

  // --- TRANSFORMS ---
  
  // 1. Scene / Camera
  // Zoom the whole scene slightly as we scroll
  const sceneScale = useTransform(smoothProgress, [0, 1], [1, 1.15]);
  const sceneY = useTransform(smoothProgress, [0, 1], ["0%", "20%"]);

  // 2. Avatar (The Target)
  // Starts blurred/dim/obscured, becomes clear
  const avatarBlur = useTransform(smoothProgress, [0, 0.4], ["12px", "0px"]);
  const avatarBrightness = useTransform(smoothProgress, [0, 0.4], [0.4, 1]);
  const avatarScale = useTransform(smoothProgress, [0, 0.5, 1], [0.9, 1.05, 1]);

  // 3. Helmet Parts (The Explosion)
  
  // Visor (Upper Face) - Moves UP and OUT
  const visorY = useTransform(smoothProgress, [0, 0.5], ["0%", "-180%"]);
  const visorZ = useTransform(smoothProgress, [0, 0.5], [50, 400]);
  const visorRotate = useTransform(smoothProgress, [0, 0.5], [0, -35]);
  const visorOpacity = useTransform(smoothProgress, [0.3, 0.6], [1, 0]);

  // Chin Guard (Lower Face) - Moves DOWN and OUT
  const chinY = useTransform(smoothProgress, [0, 0.5], ["0%", "180%"]);
  const chinZ = useTransform(smoothProgress, [0, 0.5], [50, 300]);
  const chinRotate = useTransform(smoothProgress, [0, 0.5], [0, 25]);
  const chinOpacity = useTransform(smoothProgress, [0.3, 0.6], [1, 0]);

  // Side Panels (Ears) - Move SIDEWAYS
  const leftX = useTransform(smoothProgress, [0, 0.5], ["0%", "-200%"]);
  const leftRotate = useTransform(smoothProgress, [0, 0.5], [0, -45]);
  const rightX = useTransform(smoothProgress, [0, 0.5], ["0%", "200%"]);
  const rightRotate = useTransform(smoothProgress, [0, 0.5], [0, 45]);
  const sidesOpacity = useTransform(smoothProgress, [0.3, 0.7], [1, 0]);

  // 4. Text Reveal (Post Explosion)
  const textOpacity = useTransform(smoothProgress, [0.5, 0.7], [0, 1]);
  const textScale = useTransform(smoothProgress, [0.5, 0.8], [0.8, 1]);
  const textY = useTransform(smoothProgress, [0.5, 0.8], [100, 0]);

  return (
    <section ref={containerRef} className="relative h-[250vh] z-20">
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center bg-[#050505] perspective-1000">
        <ParticleBackground />
        
        {/* 3D Scene Container */}
        <motion.div 
            className="relative w-full max-w-lg md:max-w-xl aspect-square flex items-center justify-center"
            style={{ 
                scale: sceneScale, 
                y: sceneY, 
                transformStyle: "preserve-3d",
                perspective: "1000px"
            }}
        >
            
            {/* --- AVATAR LAYER (Base) --- */}
            <motion.div 
                className="absolute inset-0 z-0 flex items-center justify-center"
                style={{ 
                    filter: `blur(${avatarBlur}) brightness(${avatarBrightness})`,
                    scale: avatarScale
                }}
            >
                <div className="relative w-[280px] h-[280px] md:w-[400px] md:h-[400px] rounded-full overflow-hidden border border-white/10 shadow-[0_0_150px_rgba(34,197,94,0.15)] bg-black">
                    <img src={AVATAR_URL} className="w-full h-full object-cover" alt="Profile" />
                    {/* Inner glow */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                </div>
            </motion.div>

            {/* --- HELMET LAYERS --- */}
            {/* These create the mask effect that explodes on scroll */}

            {/* Visor */}
            <motion.div 
                className="absolute z-40 w-[300px] md:w-[440px] h-[180px] top-[15%] md:top-[12%]"
                style={{ y: visorY, z: visorZ, rotateX: visorRotate, opacity: visorOpacity }}
            >
                {/* Glassmorphism Visor UI */}
                <div 
                    className="w-full h-full bg-black/40 backdrop-blur-xl border-t border-x border-green-500/40 rounded-t-[120px] flex flex-col items-center justify-center relative overflow-hidden"
                    style={{ clipPath: 'polygon(10% 0, 90% 0, 100% 70%, 85% 100%, 15% 100%, 0% 70%)' }}
                >
                    {/* HUD Elements */}
                    <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(34,197,94,0.1)_50%)] bg-[length:100%_4px]"></div>
                    <div className="text-green-400 font-mono text-[10px] tracking-[0.3em] mb-2 drop-shadow-[0_0_5px_rgba(34,197,94,0.8)]">SYSTEM_LOCKED</div>
                    <div className="flex gap-1">
                        <div className="w-12 h-0.5 bg-green-500/50"></div>
                        <div className="w-2 h-0.5 bg-green-500/50"></div>
                        <div className="w-12 h-0.5 bg-green-500/50"></div>
                    </div>
                </div>
            </motion.div>

            {/* Chin Guard */}
            <motion.div 
                className="absolute z-40 w-[260px] md:w-[380px] h-[160px] bottom-[15%] md:bottom-[12%]"
                style={{ y: chinY, z: chinZ, rotateX: chinRotate, opacity: chinOpacity }}
            >
                <div 
                    className="w-full h-full bg-gray-900/80 backdrop-blur-2xl border-b border-x border-purple-500/40 flex flex-col items-center justify-end pb-6 relative overflow-hidden shadow-2xl"
                    style={{ clipPath: 'polygon(20% 0, 80% 0, 100% 100%, 0 100%)' }}
                >
                     <div className="absolute top-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
                     <div className="flex gap-3 mb-3 opacity-60">
                        {[1,2,3,4].map(i => <div key={i} className="w-1.5 h-6 bg-purple-500/20 rounded-full"></div>)}
                     </div>
                     <div className="text-purple-300 font-mono text-[8px] tracking-widest border border-purple-500/30 px-2 py-0.5 rounded">SECURE_ID</div>
                </div>
            </motion.div>

            {/* Left Ear Panel */}
            <motion.div 
                className="absolute z-30 w-[60px] md:w-[90px] h-[220px] left-[10%] top-1/2 -translate-y-1/2"
                style={{ x: leftX, rotateY: leftRotate, opacity: sidesOpacity }}
            >
                 <div className="w-full h-full bg-black/60 backdrop-blur-lg border-l border-white/20 rounded-l-3xl flex items-center justify-center relative">
                    <div className="absolute right-0 top-10 w-2 h-10 bg-white/10"></div>
                    <div className="-rotate-90 text-[8px] text-gray-400 font-mono tracking-[0.4em] whitespace-nowrap">NO_SIGNAL</div>
                 </div>
            </motion.div>

             {/* Right Ear Panel */}
             <motion.div 
                className="absolute z-30 w-[60px] md:w-[90px] h-[220px] right-[10%] top-1/2 -translate-y-1/2"
                style={{ x: rightX, rotateY: rightRotate, opacity: sidesOpacity }}
            >
                 <div className="w-full h-full bg-black/60 backdrop-blur-lg border-r border-white/20 rounded-r-3xl flex items-center justify-center relative">
                    <div className="absolute left-0 bottom-10 w-2 h-10 bg-white/10"></div>
                     <div className="rotate-90 text-[8px] text-gray-400 font-mono tracking-[0.4em] whitespace-nowrap">ENCRYPTED</div>
                 </div>
            </motion.div>
            
            {/* Title Overlay (Revealed at end) */}
            <motion.div 
                className="absolute z-50 flex flex-col items-center justify-center text-center w-full"
                style={{ opacity: textOpacity, y: textY, scale: textScale }}
            >
                <motion.div 
                    className="mb-4 relative group cursor-pointer"
                    initial="initial"
                    whileHover="hover"
                >
                    {/* Main Title with Expansion and Color Shift */}
                    <motion.h1 
                        className="text-6xl md:text-9xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 group-hover:from-green-400 group-hover:to-green-600 transition-colors duration-300 relative z-10"
                        variants={{
                            initial: { letterSpacing: "-0.05em", scale: 1 },
                            hover: { letterSpacing: "0.05em", scale: 1.05 }
                        }}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    >
                        ZU KAIQUAN
                    </motion.h1>

                    {/* Glitch Effect - Red/Cyan Layer */}
                    <motion.h1
                         className="absolute inset-0 z-0 text-6xl md:text-9xl font-bold tracking-tighter text-red-500 opacity-0 mix-blend-screen pointer-events-none"
                         variants={{
                             hover: {
                                 opacity: [0, 0.6, 0, 0.4, 0],
                                 x: [-2, 2, -1, 3, 0],
                                 y: [1, -2, 0, 1, 0],
                                 scale: 1.05,
                                 letterSpacing: "0.05em",
                                 transition: { repeat: Infinity, duration: 0.2 }
                             }
                         }}
                    >
                        ZU KAIQUAN
                    </motion.h1>

                    {/* Glitch Effect - Blue/Purple Layer */}
                    <motion.h1
                         className="absolute inset-0 z-0 text-6xl md:text-9xl font-bold tracking-tighter text-blue-500 opacity-0 mix-blend-screen pointer-events-none"
                         variants={{
                             hover: {
                                 opacity: [0, 0.6, 0, 0.4, 0],
                                 x: [2, -2, 1, -3, 0],
                                 y: [-1, 2, 0, -1, 0],
                                 scale: 1.05,
                                 letterSpacing: "0.05em",
                                 transition: { repeat: Infinity, duration: 0.25, delay: 0.05 }
                             }
                         }}
                    >
                        ZU KAIQUAN
                    </motion.h1>
                </motion.div>
                
                <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
                     <span className="flex items-center gap-2 px-4 py-1.5 border border-green-500/20 bg-green-900/10 rounded-full text-green-400 text-xs font-mono tracking-wide backdrop-blur-sm hover:bg-green-500/20 transition-colors">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                        UI/UX ARCHITECT
                     </span>
                     <span className="hidden md:block w-1 h-1 bg-gray-600 rounded-full"></span>
                     <span className="flex items-center gap-2 px-4 py-1.5 border border-purple-500/20 bg-purple-900/10 rounded-full text-purple-400 text-xs font-mono tracking-wide backdrop-blur-sm hover:bg-purple-500/20 transition-colors">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                        FULL STACK DEV
                     </span>
                </div>
            </motion.div>

        </motion.div>
        
        {/* Scroll Indicator */}
        <motion.div 
            className="absolute bottom-12 left-1/2 -translate-x-1/2 text-center pointer-events-none"
            style={{ opacity: useTransform(smoothProgress, [0, 0.15], [1, 0]) }}
        >
            <p className="text-[10px] tracking-[0.5em] text-gray-500 mb-4 animate-pulse">INITIATE_DECRYPTION</p>
            <div className="w-[1px] h-16 bg-gradient-to-b from-white/50 to-transparent mx-auto"></div>
        </motion.div>

      </div>
    </section>
  );
};

export default ScrollExplosionHero;