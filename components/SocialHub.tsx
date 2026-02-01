import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Github, Linkedin, ExternalLink } from 'lucide-react';

const SocialHub: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    let mouse = { x: -1000, y: -1000, radius: 100 };

    const gap = 6; // Distance between dots
    const mouseRadius = 80;
    const particleSize = 1.5;

    class Particle {
      x: number;
      y: number;
      baseX: number;
      baseY: number;
      size: number;
      density: number;
      color: string;

      constructor(x: number, y: number, color: string) {
        this.x = x;
        this.y = y;
        this.baseX = x;
        this.baseY = y;
        this.size = particleSize;
        this.density = (Math.random() * 30) + 1;
        this.color = color;
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        // Drawing squares to match the pixel/matrix aesthetic
        ctx.rect(this.x, this.y, this.size, this.size);
        ctx.closePath();
        ctx.fill();
      }

      update() {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const forceDirectionX = dx / distance;
        const forceDirectionY = dy / distance;
        const force = (mouseRadius - distance) / mouseRadius;
        const directionX = forceDirectionX * force * this.density;
        const directionY = forceDirectionY * force * this.density;

        if (distance < mouseRadius) {
          this.x -= directionX;
          this.y -= directionY;
        } else {
          if (this.x !== this.baseX) {
            const dx = this.x - this.baseX;
            this.x -= dx / 10;
          }
          if (this.y !== this.baseY) {
            const dy = this.y - this.baseY;
            this.y -= dy / 10;
          }
        }
      }
    }

    const init = () => {
      particles = [];
      // Use a bold, large font to sample pixels
      const fontStr = '900 12vw "Space Grotesk"';
      
      ctx.font = fontStr;
      const text = "ZU KAIQUAN";
      const textMetrics = ctx.measureText(text);
      const textWidth = textMetrics.width;
      
      // Draw text to canvas to sample pixel data
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = fontStr;
      ctx.fillStyle = 'white';
      ctx.fillText(text, (canvas.width - textWidth) / 2, canvas.height / 2 + 20);
      
      const textCoordinates = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Clear canvas to prepare for drawing particles
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let y = 0, y2 = textCoordinates.height; y < y2; y += gap) {
        for (let x = 0, x2 = textCoordinates.width; x < x2; x += gap) {
          // Check alpha value (4th byte)
          if (textCoordinates.data[(y * 4 * textCoordinates.width) + (x * 4) + 3] > 128) {
            const positionX = x;
            const positionY = y;
            // Add slight color variation
            const r = Math.random();
            let color = 'rgba(255, 255, 255, 0.9)';
            if (r > 0.92) color = 'rgba(168, 85, 247, 0.8)'; // Purple accent
            else if (r > 0.85) color = 'rgba(34, 197, 94, 0.8)'; // Green accent
            
            particles.push(new Particle(positionX, positionY, color));
          }
        }
      }
    };

    const animate = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        particles[i].draw();
        particles[i].update();
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight * 0.6; // Take up 60% of viewport height
      init();
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    };
    
    // Initial Setup
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight * 0.6;
    init();
    animate();

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const socialLinks = [
    { name: 'Red Note', icon: <span className="font-bold text-lg leading-none">红</span>, url: '#', color: 'hover:border-red-500 hover:text-red-500 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]' },
    { name: 'LinkedIn', icon: <Linkedin size={20} />, url: '#', color: 'hover:border-blue-500 hover:text-blue-500 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]' },
    { name: 'GitHub', icon: <Github size={20} />, url: '#', color: 'hover:border-white hover:text-white hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]' },
  ];

  return (
    <section id="connect" className="relative min-h-screen flex flex-col items-center justify-center bg-black overflow-hidden pt-20 pb-10">
      
      {/* Canvas Text Area */}
      <div className="w-full h-[50vh] md:h-[60vh] flex items-center justify-center relative z-10 cursor-crosshair">
        <canvas ref={canvasRef} className="w-full h-full" />
        
        {/* Overlay Info */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
           <h2 className="sr-only">ZU KAIQUAN</h2>
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             transition={{ delay: 0.5 }}
             className="mt-24 md:mt-32 text-center select-none"
           >
             <p className="text-purple-400 font-mono tracking-widest text-xs md:text-sm mb-3">EXPLORING THE DIGITAL FRONTIER</p>
             <p className="text-gray-400 text-[10px] md:text-xs tracking-[0.3em] uppercase">UI/UX Designer & Frontend Developer</p>
             <p className="text-white font-bold text-xl md:text-2xl mt-4 tracking-tight">Technical Romanticist</p>
           </motion.div>
        </div>
      </div>

      {/* Buttons */}
      <div className="relative z-20 flex flex-wrap gap-6 justify-center items-center mt-[-40px] md:mt-0 px-4">
        {socialLinks.map((link, i) => (
          <motion.a
            key={link.name}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.8 + i * 0.1 }}
            className={`flex items-center gap-3 px-8 py-3.5 bg-white/5 border border-white/10 rounded-full backdrop-blur-md transition-all duration-300 group ${link.color}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="opacity-70 group-hover:opacity-100 transition-opacity">{link.icon}</span>
            <span className="font-medium tracking-wide text-sm">{link.name}</span>
            <ExternalLink size={14} className="opacity-0 group-hover:opacity-50 transition-opacity -ml-1" />
          </motion.a>
        ))}
      </div>

      {/* Quote */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 1.2 }}
        className="mt-16 text-center px-4"
      >
        <p className="font-serif italic text-gray-500 text-lg tracking-wide">"WELCOME TO MY REALM."</p>
      </motion.div>

      {/* Dive In Indicator */}
      <motion.div 
        className="mt-12 flex flex-col items-center gap-4"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
          <span className="text-[10px] uppercase tracking-[0.3em] text-gray-600">DIVE IN</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-gray-600 to-transparent"></div>
      </motion.div>
    </section>
  );
};

export default SocialHub;