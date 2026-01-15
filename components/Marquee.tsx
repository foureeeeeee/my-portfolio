import React, { useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const Marquee: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Scroll Animations for smooth entry
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  // Parallax: The canvas moves slightly slower than scroll for depth
  const y = useTransform(scrollYProgress, [0, 1], [-100, 100]);
  // Fade in smoothly as it enters viewport
  const opacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let lastTime = 0;
    let totalTime = 0;
    
    // Mouse state for interaction with lerping for smoothness
    let mouse = { x: -1000, y: -1000 };
    let smoothMouse = { x: -1000, y: -1000 };

    // Offscreen buffers
    const buffer1 = document.createElement('canvas');
    const ctx1 = buffer1.getContext('2d');
    const buffer2 = document.createElement('canvas');
    const ctx2 = buffer2.getContext('2d');

    const mainText = "EXPERIENCE — RESEARCH — DESIGN — INNOVATION — ";
    const quoteText = "For anyone who has wondered what their life might look like at the end of the road not taken. — ";

    const init = () => {
        const dpr = window.devicePixelRatio || 1;
        const height = window.innerWidth < 768 ? 400 : 600;
        
        canvas.width = window.innerWidth * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        const isMobile = window.innerWidth < 768;

        // Prepare Buffer 1 (Main Title)
        prepareBuffer(
            buffer1, 
            ctx1!, 
            mainText, 
            isMobile ? 60 : 160, 
            "800",
            true // High gloss
        );

        // Prepare Buffer 2 (Quote)
        prepareBuffer(
            buffer2, 
            ctx2!, 
            quoteText, 
            isMobile ? 18 : 32, 
            "300",
            false // Subtle gloss
        );
    };

    const prepareBuffer = (
        buf: HTMLCanvasElement, 
        bCtx: CanvasRenderingContext2D, 
        text: string, 
        size: number, 
        weight: string,
        isHighGloss: boolean
    ) => {
        bCtx.font = `${weight} ${size}px "Space Grotesk"`;
        const metrics = bCtx.measureText(text);
        const width = Math.ceil(metrics.width) + (isHighGloss ? 100 : 50); 
        const height = size * 3.0; // Extra vertical space for heavy distortion

        buf.width = width;
        buf.height = height;
        
        // Re-apply font after resize
        bCtx.font = `${weight} ${size}px "Space Grotesk"`;
        bCtx.textBaseline = 'middle';
        const centerY = height / 2;

        // 1. Glow
        bCtx.shadowColor = isHighGloss ? "rgba(74, 222, 128, 0.5)" : "rgba(168, 85, 247, 0.4)";
        bCtx.shadowBlur = isHighGloss ? 30 : 15;
        bCtx.fillStyle = "rgba(0,0,0,0)";
        bCtx.fillText(text, 0, centerY);
        bCtx.shadowBlur = 0; 

        // 2. Stroke
        bCtx.lineWidth = isHighGloss ? 2 : 1;
        bCtx.strokeStyle = "rgba(255, 255, 255, 0.9)";
        bCtx.strokeText(text, 0, centerY);

        // 3. Gradient Fill
        const grad = bCtx.createLinearGradient(0, centerY - size/2, 0, centerY + size/2);
        grad.addColorStop(0, "rgba(255, 255, 255, 0.9)");
        grad.addColorStop(0.45, "rgba(255, 255, 255, 0.1)");
        grad.addColorStop(0.55, "rgba(255, 255, 255, 0.1)");
        grad.addColorStop(1, "rgba(255, 255, 255, 0.6)");
        
        bCtx.fillStyle = grad;
        bCtx.fillText(text, 0, centerY);
    };

    const drawLiquidLine = (
        buffer: HTMLCanvasElement, 
        yPos: number, 
        speed: number, 
        waveAmp: number, 
        waveFreq: number, 
        isQuote: boolean
    ) => {
        if (!buffer || buffer.width === 0) return;
        
        const dpr = window.devicePixelRatio || 1;
        const screenW = canvas.width / dpr;
        const totalW = buffer.width;
        
        // Smooth continuous scroll
        const scrollX = (totalTime * speed);
        
        // Higher fidelity: 1px slices for silky smooth waves
        const sliceWidth = 1; 
        
        for (let x = 0; x < screenW; x += sliceWidth) {
            let sx = (x - scrollX) % totalW;
            if (sx < 0) sx += totalW;

            // 1. Wave Motion
            // Using totalTime ensures smooth sine wave independent of framerate
            let distortion = Math.sin((x * waveFreq) + (totalTime * 0.05)) * waveAmp;
            
            // 2. Interactive Lens (Magnification)
            const dx = x - smoothMouse.x;
            const dy = yPos - smoothMouse.y; 
            const dist = Math.sqrt(dx*dx + dy*dy);
            const lensRadius = 300;
            
            if (dist < lensRadius) {
                const force = (lensRadius - dist) / lensRadius;
                // Smooth easing curve
                const bulge = Math.pow(force, 2.5); 
                
                // Vertical magnification
                distortion += bulge * (isQuote ? 30 : 80); 
            }

            const destY = yPos + distortion;
            
            // Height stretching for pseudo-3D volume
            const heightScale = 1 + (Math.abs(distortion) * 0.003); 
            const finalHeight = buffer.height * heightScale;
            const heightOffset = (finalHeight - buffer.height) / 2;

            ctx.drawImage(
                buffer, 
                sx, 0, sliceWidth, buffer.height,
                x, destY - heightOffset, sliceWidth, finalHeight
            );
        }
    };

    const animate = (timestamp: number) => {
        if (!lastTime) lastTime = timestamp;
        const deltaTime = timestamp - lastTime;
        lastTime = timestamp;
        
        // Normalize speed: 60fps = 1.0
        const deltaMultiplier = deltaTime / 16.67;
        totalTime += deltaMultiplier;

        // Smooth Mouse Lerp
        smoothMouse.x += (mouse.x - smoothMouse.x) * 0.08 * deltaMultiplier;
        smoothMouse.y += (mouse.y - smoothMouse.y) * 0.08 * deltaMultiplier;

        const dpr = window.devicePixelRatio || 1;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const isMobile = window.innerWidth < 768;
        const centerY = (canvas.height / dpr) / 2;

        // Layer 1: Quote (Subtle, Slow, Background)
        ctx.globalAlpha = 0.7;
        drawLiquidLine(
            buffer2, 
            centerY + (isMobile ? 60 : 120), 
            -0.5, 
            isMobile ? 5 : 8, 
            0.01,
            true
        );

        // Layer 2: Main Title (Bright, Fast, Foreground)
        ctx.globalAlpha = 1.0;
        ctx.globalCompositeOperation = 'screen'; // Blend mode for "glass" glow
        drawLiquidLine(
            buffer1, 
            centerY - (isMobile ? 20 : 40), 
            -1.5, 
            isMobile ? 10 : 20, 
            0.005,
            false
        );
        ctx.globalCompositeOperation = 'source-over';

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
    
    // Mouse leave reset
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

  return (
    <motion.div 
        ref={containerRef}
        className="relative py-24 bg-black overflow-hidden select-none"
        style={{ opacity }}
    >
      {/* Visual blending mask at the top to merge with Hero section */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#050505] to-transparent z-20 pointer-events-none"></div>
      
      <motion.canvas 
        ref={canvasRef} 
        style={{ y }}
        className="relative z-10 w-full h-[400px] md:h-[600px] block cursor-pointer" 
      />
      
      {/* Vignette for cinematic focus */}
      <div className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-[#050505] to-transparent pointer-events-none z-20"></div>
      <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-[#050505] to-transparent pointer-events-none z-20"></div>
      
      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black to-transparent pointer-events-none z-20"></div>
    </motion.div>
  );
};

export default Marquee;