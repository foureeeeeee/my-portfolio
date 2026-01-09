import React, { useRef, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion';
import ParticleBackground from './ParticleBackground';

const Hero: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Mouse tracking for parallax blobs
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth spring physics for blobs following mouse
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

  const smoothTransition = { duration: 1.2, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }; // Custom bezier for premium feel

  return (
    <section ref={containerRef} className="relative min-h-screen flex items-center justify-center overflow-hidden px-6 pt-20">
      <ParticleBackground />
      
      {/* Animated Blob Background with Mouse Interaction */}
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
            transition={{ ...smoothTransition, delay: 0.2 }}
          >
            <h1 className="text-7xl md:text-[10rem] leading-[0.85] font-bold tracking-tighter uppercase mb-8">
              <span className="block overflow-hidden">
                <motion.span 
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  transition={{ ...smoothTransition, delay: 0.4 }}
                  className="block"
                >
                  Hello
                </motion.span>
              </span>
              <span className="block overflow-hidden">
                <motion.span 
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  transition={{ ...smoothTransition, delay: 0.5 }}
                  className="block"
                >
                  I'm <span className="text-gray-500 italic">Zu</span>
                </motion.span>
              </span>
              <span className="block overflow-hidden text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500">
                <motion.span 
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  transition={{ ...smoothTransition, delay: 0.6 }}
                  className="block"
                >
                  Kaiquan
                </motion.span>
              </span>
            </h1>
          </motion.div>

          <motion.div 
            className="flex flex-wrap gap-4 mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...smoothTransition, delay: 1 }}
          >
            {['UI/UX Design', 'Figma Expert', 'AIGC Creator', 'Frontend Dev'].map((tag, i) => (
              <span key={i} className="px-5 py-2 border border-white/10 bg-white/5 backdrop-blur-sm rounded-full text-sm tracking-wide uppercase hover:bg-white hover:text-black hover:scale-105 transition-all duration-300">
                {tag}
              </span>
            ))}
          </motion.div>
        </div>

        <div className="md:col-span-4 flex flex-col justify-end items-start md:items-end text-right space-y-4 opacity-70">
             <motion.div 
               className="w-24 h-[1px] bg-gradient-to-r from-transparent to-white mb-4 self-start md:self-end"
               initial={{ width: 0 }}
               animate={{ width: 96 }}
               transition={{ ...smoothTransition, delay: 1.2 }}
             />
             <motion.div
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ ...smoothTransition, delay: 1.3 }}
             >
               <p className="text-sm font-mono tracking-widest">DIGITAL PORTFOLIO</p>
               <p className="text-sm font-mono tracking-widest text-gray-500">2024 - 2025</p>
             </motion.div>
             <motion.p 
               className="text-sm max-w-[250px] mt-4 text-left md:text-right text-gray-400 font-light"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ ...smoothTransition, delay: 1.5 }}
             >
               Crafting immersive digital experiences through code, motion, and design.
             </motion.p>
        </div>
      </motion.div>
      
      {/* Scroll indicator */}
      <motion.div 
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2, duration: 1 }}
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