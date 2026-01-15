import React, { useRef, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue, Variants } from 'framer-motion';
import ParticleBackground from './ParticleBackground';

const PortfolioParticles: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Array<{x: number, y: number, vx: number, vy: number, size: number, color: string, alpha: number}> = [];
    let mouse = { x: -1000, y: -1000 };

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      initParticles();
    };

    const colors = ['#a855f7', '#22c55e', '#3b82f6']; 

    const initParticles = () => {
      particles = [];
      const count = 40; 
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          size: Math.random() * 2 + 0.5,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: Math.random() * 0.6 + 0.2
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, 'rgba(168, 85, 247, 0.08)');
      gradient.addColorStop(0.5, 'rgba(34, 197, 94, 0.05)');
      gradient.addColorStop(1, 'rgba(59, 130, 246, 0.08)');
      
      ctx.fillStyle = gradient;
      const radius = 20;
      ctx.beginPath();
      ctx.roundRect(0, 0, canvas.width, canvas.height, radius);
      ctx.fill();

      particles.forEach(p => {
        const rect = canvas.getBoundingClientRect();
        const localMouseX = mouse.x - rect.left;
        const localMouseY = mouse.y - rect.top;
        
        const dx = localMouseX - p.x;
        const dy = localMouseY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 80) {
            const force = (80 - dist) / 80;
            p.vx -= (dx / dist) * force * 0.8;
            p.vy -= (dy / dist) * force * 0.8;
        }

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
      });
      
      ctx.globalAlpha = 1;
      animationFrameId = requestAnimationFrame(draw);
    };

    resize();
    draw();
    
    const handleMouseMove = (e: MouseEvent) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    };
    
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-[-20px] w-[calc(100%+40px)] h-[calc(100%+40px)] pointer-events-none -z-10 blur-sm"
    />
  );
};

const Hero: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 30, stiffness: 150, mass: 1 };
  const blob1X = useSpring(useTransform(mouseX, [0, window.innerWidth], [-50, 50]), springConfig);
  const blob1Y = useSpring(useTransform(mouseY, [0, window.innerHeight], [-50, 50]), springConfig);
  const blob2X = useSpring(useTransform(mouseX, [0, window.innerWidth], [50, -50]), springConfig);
  const blob2Y = useSpring(useTransform(mouseY, [0, window.innerHeight], [50, -50]), springConfig);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  const smoothTransition = { duration: 1.2, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] };

  // --- ANIMATION VARIANTS ---
  
  const glitchVariants: Variants = {
    hover: {
      opacity: [0, 0.5, 0.2, 0.7, 0],
      x: [-4, 4, -2, 6, 0],
      y: [2, -4, 0, 3, 0],
      scale: 1.05,
      transition: { repeat: Infinity, duration: 0.2, ease: "linear" }
    },
    initial: { opacity: 0, x: 0, y: 0 }
  };
  
  const mainTextVariants: Variants = {
    hover: { 
        scale: 1.05,
        transition: { duration: 0.4, ease: "easeOut" }
    },
    initial: { scale: 1 }
  };

  const wordExpansionVariants: Variants = {
    hover: {
        letterSpacing: "0.05em",
        transition: { duration: 0.5, ease: "easeOut" }
    },
    initial: {
        letterSpacing: "-0.02em"
    }
  };

  // Gradient Sweep for "Lamination" effect
  const laminationVariants: Variants = {
    hover: {
        backgroundPosition: ["0% center", "200% center"],
        transition: { 
            duration: 1.5, 
            repeat: Infinity, 
            ease: "linear"
        }
    },
    initial: {
        backgroundPosition: "0% center"
    }
  };

  return (
    <section ref={containerRef} className="relative min-h-screen flex items-center justify-center overflow-hidden px-6 pt-20">
      <ParticleBackground />
      
      <motion.div 
        className="absolute right-[10%] top-[20%] w-[300px] h-[300px] md:w-[600px] md:h-[600px] rounded-full bg-purple-600/20 blur-[120px] mix-blend-screen"
        style={{ x: blob1X, y: blob1Y }}
        animate={{
          scale: [1, 1.1, 0.9, 1],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div 
        className="absolute left-[10%] bottom-[20%] w-[250px] h-[250px] md:w-[500px] md:h-[500px] rounded-full bg-green-500/10 blur-[100px] mix-blend-screen"
        style={{ x: blob2X, y: blob2Y }}
        animate={{
          scale: [1, 1.2, 0.8, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
      />

      <motion.div 
        style={{ y, opacity }}
        className="relative z-10 w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 items-center"
      >
        <div className="md:col-span-8">
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...smoothTransition, delay: 0.8 }}
            className="relative group inline-block cursor-pointer mb-8"
          >
            {/* Interactive Wrapper for Title */}
            <motion.div
                initial="initial"
                whileHover="hover"
                className="relative z-20"
            >
                <motion.h1 
                    className="text-7xl md:text-[10rem] leading-[0.85] font-bold uppercase relative z-20"
                    variants={mainTextVariants}
                >
                  {/* HELLO */}
                  <span className="block overflow-hidden">
                    <motion.div 
                      variants={wordExpansionVariants}
                      className="inline-block group-hover:text-green-400 transition-colors duration-300"
                    >
                        <motion.span 
                          initial={{ y: "100%" }}
                          animate={{ y: 0 }}
                          transition={{ ...smoothTransition, delay: 1.0 }}
                          className="block"
                        >
                          Hello
                        </motion.span>
                    </motion.div>
                  </span>
                  
                  {/* I'M ZU */}
                  <span className="block overflow-hidden">
                    <motion.div 
                      variants={wordExpansionVariants}
                      className="inline-block group-hover:text-green-400 transition-colors duration-300"
                    >
                        <motion.span 
                          initial={{ y: "100%" }}
                          animate={{ y: 0 }}
                          transition={{ ...smoothTransition, delay: 1.1 }}
                          className="block"
                        >
                          I'm <span className="text-gray-500 italic group-hover:text-white transition-colors duration-300">Zu</span>
                        </motion.span>
                    </motion.div>
                  </span>

                  {/* KAIQUAN (Laminated) */}
                  <span className="block overflow-hidden">
                    <motion.div 
                         initial={{ y: "100%" }}
                         animate={{ y: 0 }}
                         transition={{ ...smoothTransition, delay: 1.2 }}
                         className="block"
                    >
                        {/* Lamination Gradient Text */}
                        <motion.span 
                            variants={{...wordExpansionVariants, ...laminationVariants}}
                            className="block text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-300 to-gray-600 group-hover:from-green-500 group-hover:via-emerald-200 group-hover:to-green-500 bg-[length:200%_auto]"
                        >
                          Kaiquan
                        </motion.span>
                    </motion.div>
                  </span>
                </motion.h1>

                {/* Glitch Layer 1 (Red) - Behind */}
                <motion.div 
                    className="absolute inset-0 z-10 text-7xl md:text-[10rem] leading-[0.85] font-bold tracking-tighter uppercase text-red-500 mix-blend-screen pointer-events-none select-none"
                    variants={glitchVariants}
                    aria-hidden="true"
                >
                    <span className="block">Hello</span>
                    <span className="block">I'm <span className="italic">Zu</span></span>
                    <span className="block">Kaiquan</span>
                </motion.div>

                {/* Glitch Layer 2 (Blue) - Behind */}
                <motion.div 
                    className="absolute inset-0 z-10 text-7xl md:text-[10rem] leading-[0.85] font-bold tracking-tighter uppercase text-blue-500 mix-blend-screen pointer-events-none select-none"
                    variants={{
                        ...glitchVariants,
                        hover: {
                            ...glitchVariants.hover,
                            x: [4, -4, 2, -6, 0], // Inverse movement
                            transition: { repeat: Infinity, duration: 0.25, delay: 0.05 }
                        }
                    }}
                    aria-hidden="true"
                >
                    <span className="block">Hello</span>
                    <span className="block">I'm <span className="italic">Zu</span></span>
                    <span className="block">Kaiquan</span>
                </motion.div>
            </motion.div>

          </motion.div>

          <motion.div 
            className="flex flex-wrap gap-4 mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...smoothTransition, delay: 1.5 }}
          >
            {['UI/UX Design', 'Figma Expert', 'AIGC Creator', 'Frontend Dev'].map((tag, i) => (
              <span key={i} className="px-5 py-2 border border-white/10 bg-white/5 backdrop-blur-sm rounded-full text-sm tracking-wide uppercase hover:bg-white hover:text-black hover:scale-105 transition-all duration-300">
                {tag}
              </span>
            ))}
          </motion.div>
        </div>

        <div className="md:col-span-4 relative flex flex-col justify-end items-start md:items-end text-right space-y-4">
            <PortfolioParticles />
            
            <div className="opacity-70 flex flex-col items-start md:items-end w-full">
               <motion.div 
                 className="w-24 h-[1px] bg-gradient-to-r from-transparent to-white mb-4 self-start md:self-end"
                 initial={{ width: 0 }}
                 animate={{ width: 96 }}
                 transition={{ ...smoothTransition, delay: 1.7 }}
               />
               <motion.div
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 transition={{ ...smoothTransition, delay: 1.8 }}
               >
                 <p className="text-sm font-mono tracking-widest">DIGITAL PORTFOLIO</p>
                 <p className="text-sm font-mono tracking-widest text-gray-500">2024 - 2025</p>
               </motion.div>
               <motion.p 
                 className="text-sm max-w-[250px] mt-4 text-left md:text-right text-gray-400 font-light"
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 transition={{ ...smoothTransition, delay: 2.0 }}
               >
                 Crafting immersive digital experiences through code, motion, and design.
               </motion.p>
            </div>
        </div>
      </motion.div>
      
      {/* Scroll indicator */}
      <motion.div 
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.2, duration: 1 }}
      >
        <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Scroll</span>
        <motion.div 
          className="w-[1px] h-12 bg-gradient-to-b from-white to-transparent"
          animate={{ height: [0, 48, 0], y: [0, 0, 48] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        ></motion.div>
      </motion.div>
    </section>
  );
};

export default Hero;