import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const Marquee: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Scroll Animations for smooth entry
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  // Parallax
  const y = useTransform(scrollYProgress, [0, 1], [-50, 50]);
  const opacity = useTransform(scrollYProgress, [0, 0.2], [0, 1]);

  // Track global velocity manually for the "Infect" effect
  const [velocity, setVelocity] = useState(0);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let lastTime = 0;
    let totalTime = 0;
    
    // Mouse state for interaction
    let mouse = { x: -1000, y: -1000 };
    let smoothMouse = { x: -1000, y: -1000 };
    let currentVelocity = 0; // Smoothed velocity for rendering

    // Offscreen buffers
    const buffer1 = document.createElement('canvas');
    const ctx1 = buffer1.getContext('2d');
    const buffer2 = document.createElement('canvas');
    const ctx2 = buffer2.getContext('2d');

    const mainText = "EXPERIENCE — RESEARCH — DESIGN — INNOVATION — ";
    const quoteText = "For anyone who has wondered what their life might look like at the end of the road not taken. — ";

    const init = () => {
        const dpr = window.devicePixelRatio || 1;
        const height = window.innerWidth < 768 ? 300 : 500;
        
        canvas.width = window.innerWidth * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        const isMobile = window.innerWidth < 768;

        // Prepare Buffer 1 (Main Title)
        prepareBuffer(buffer1, ctx1!, mainText, isMobile ? 48 : 120, "700", true);

        // Prepare Buffer 2 (Quote)
        prepareBuffer(buffer2, ctx2!, quoteText, isMobile ? 14 : 24, "300", false);
    };

    const prepareBuffer = (
        buf: HTMLCanvasElement, 
        bCtx: CanvasRenderingContext2D, 
        text: string, 
        size: number, 
        weight: string,
        isMain: boolean
    ) => {
        bCtx.font = `${weight} ${size}px "Space Grotesk"`;
        const metrics = bCtx.measureText(text);
        const width = Math.ceil(metrics.width) + 40; 
        const height = size * 2.5; 

        buf.width = width;
        buf.height = height;
        
        bCtx.font = `${weight} ${size}px "Space Grotesk"`;
        bCtx.textBaseline = 'middle';
        const centerY = height / 2;

        if (isMain) {
            // GLASS EFFECT STYLE
            bCtx.shadowColor = "rgba(74, 222, 128, 0.25)";
            bCtx.shadowBlur = 20;
            bCtx.fillText(text, 0, centerY);
            bCtx.shadowBlur = 0; 

            bCtx.lineWidth = 1.5;
            bCtx.strokeStyle = "rgba(255, 255, 255, 0.95)";
            bCtx.strokeText(text, 0, centerY);

            const grad = bCtx.createLinearGradient(0, centerY - size/2, 0, centerY + size/2);
            grad.addColorStop(0, "rgba(255, 255, 255, 0.15)");
            grad.addColorStop(0.5, "rgba(255, 255, 255, 0.0)");
            grad.addColorStop(1, "rgba(255, 255, 255, 0.15)");
            bCtx.fillStyle = grad;
            bCtx.fillText(text, 0, centerY);
        } else {
            bCtx.fillStyle = "rgba(255, 255, 255, 0.7)";
            bCtx.fillText(text, 0, centerY);
        }
    };

    const drawLiquidLine = (
        buffer: HTMLCanvasElement, 
        yPos: number, 
        speed: number, 
        waveAmp: number, 
        waveFreq: number,
        distortionStrength: number
    ) => {
        if (!buffer || buffer.width === 0) return;
        
        const dpr = window.devicePixelRatio || 1;
        const screenW = canvas.width / dpr;
        const totalW = buffer.width;
        
        const scrollX = (totalTime * speed);
        const sliceWidth = 2; 
        
        for (let x = 0; x < screenW; x += sliceWidth) {
            let sx = (x - scrollX) % totalW;
            if (sx < 0) sx += totalW;

            // 1. Base Wave Motion
            let distortion = Math.sin((x * waveFreq) + (totalTime * 0.02)) * waveAmp;
            
            // 2. Interactive Lens (Refraction)
            const dx = x - smoothMouse.x;
            const dy = yPos - smoothMouse.y; 
            const dist = Math.sqrt(dx*dx + dy*dy);
            const lensRadius = 200;
            
            if (dist < lensRadius) {
                const force = (lensRadius - dist) / lensRadius;
                const bulge = Math.pow(force, 2); 
                distortion -= bulge * 25; 
            }

            // 3. "Infection" (Vertical Stretch/Glitch)
            // Apply strong vertical stretching based on scroll velocity (lamination effect)
            const stretch = 1 + (distortionStrength * 3); // Significant stretch
            const stretchOffset = (buffer.height * stretch - buffer.height) / 2;

            // Apply random jitter if velocity is extremely high
            const jitter = distortionStrength > 0.5 ? (Math.random() - 0.5) * distortionStrength * 30 : 0;

            ctx.drawImage(
                buffer, 
                sx, 0, sliceWidth, buffer.height,
                x, yPos + distortion - (buffer.height / 2) - stretchOffset + jitter, sliceWidth, buffer.height * stretch
            );
        }
    };

    const animate = (timestamp: number) => {
        if (!lastTime) lastTime = timestamp;
        const deltaTime = timestamp - lastTime;
        lastTime = timestamp;
        
        const deltaMultiplier = Math.min(deltaTime, 60) / 16.67;
        totalTime += deltaMultiplier;

        smoothMouse.x += (mouse.x - smoothMouse.x) * 0.1 * deltaMultiplier;
        smoothMouse.y += (mouse.y - smoothMouse.y) * 0.1 * deltaMultiplier;

        // Track Scroll Velocity
        const scrollY = window.scrollY;
        const rawVel = Math.abs(scrollY - lastScrollY.current);
        lastScrollY.current = scrollY;
        
        // Smooth velocity decay
        currentVelocity += (rawVel - currentVelocity) * 0.1;
        
        // Calculate Infection/Lamination Intensity
        const laminationIntensity = Math.min(currentVelocity / 15, 2.5);
        setVelocity(laminationIntensity);

        const dpr = window.devicePixelRatio || 1;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const isMobile = window.innerWidth < 768;
        const centerY = (canvas.height / dpr) / 2;

        // Layer 1: Main Title
        drawLiquidLine(
            buffer1, 
            centerY - (isMobile ? 15 : 30), 
            -1.2, 
            5,    
            0.004, 
            laminationIntensity 
        );

        // Layer 2: Quote
        drawLiquidLine(
            buffer2, 
            centerY + (isMobile ? 25 : 50), 
            -0.6, 
            3,    
            0.006,
            laminationIntensity * 0.5 
        );

        animationId = requestAnimationFrame(animate);
    };

    const handleResize = () => init();

    const handleMouseMove = (e: MouseEvent) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
        }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    
    containerRef.current?.addEventListener('mouseleave', () => { 
        mouse.x = -1000; 
        mouse.y = -1000; 
    });

    init();
    animationId = requestAnimationFrame(animate);

    return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('mousemove', handleMouseMove);
        cancelAnimationFrame(animationId);
    };
  }, []);

  // Suppress Background:
  // Reduced base opacity from 1 to 0.1 so particles are almost always visible
  // It completely disappears (opacity 0) upon scrolling
  const bgOpacity = Math.max(0, 0.1 - velocity * 0.5);

  return (
    <motion.div 
        ref={containerRef}
        className="relative py-12 md:py-20 border-y border-white/5 overflow-hidden select-none transition-colors duration-100"
        style={{ 
            opacity,
            backgroundColor: `rgba(0, 0, 0, ${bgOpacity})` 
        }}
    >
      <motion.canvas 
        ref={canvasRef} 
        style={{ y }}
        className="relative z-10 w-full h-[300px] md:h-[500px] block" 
      />
      
      {/* Side Vignettes - also suppressed when infected */}
      <div 
        className="absolute top-0 left-0 w-24 md:w-48 h-full bg-gradient-to-r from-black to-transparent pointer-events-none z-20 transition-opacity duration-100"
        style={{ opacity: bgOpacity }}
      ></div>
      <div 
        className="absolute top-0 right-0 w-24 md:w-48 h-full bg-gradient-to-l from-black to-transparent pointer-events-none z-20 transition-opacity duration-100"
        style={{ opacity: bgOpacity }}
      ></div>
    </motion.div>
  );
};

export default Marquee;