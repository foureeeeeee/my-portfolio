import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface MatrixLoaderProps {
  onLoadingComplete: () => void;
}

const MatrixLoader: React.FC<MatrixLoaderProps> = ({ onLoadingComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [progress, setProgress] = useState(0);

  // Matrix Effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle High DPI displays for crisp text
    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        ctx.scale(dpr, dpr);
    };
    resize();

    const katakana = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン';
    const latin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const nums = '0123456789';
    const alphabet = katakana + latin + nums;

    const fontSize = 16; 
    const columns = window.innerWidth / fontSize;

    const drops: number[] = [];
    // Initialize drops scattered across the screen height
    for (let x = 0; x < columns; x++) {
      drops[x] = Math.random() * (window.innerHeight / fontSize); 
    }

    let animationFrameId: number;

    const draw = () => {
      // Create trails with a semi-transparent black fade
      // Use very low opacity for the fade to make trails longer and smoother
      ctx.fillStyle = 'rgba(5, 5, 5, 0.05)'; 
      ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);

      ctx.font = '700 ' + fontSize + 'px monospace'; 

      for (let i = 0; i < drops.length; i++) {
        const text = alphabet.charAt(Math.floor(Math.random() * alphabet.length));
        
        // "Demure" Palette: Mostly dark green/grey, occasional bright sparkles
        const rand = Math.random();
        if (rand > 0.995) ctx.fillStyle = '#ffffff'; // White Sparkle
        else if (rand > 0.95) ctx.fillStyle = '#4ade80'; // Bright Green
        else ctx.fillStyle = '#15803d'; // Dark Matrix Green

        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        // Random reset to top
        if (drops[i] * fontSize > window.innerHeight && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  // Progress Counter
  useEffect(() => {
    const duration = 2800; // Total loading time (ms)
    const intervalTime = 20;
    const steps = duration / intervalTime;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const newProgress = Math.min(Math.round((currentStep / steps) * 100), 100);
      setProgress(newProgress);

      if (currentStep >= steps) {
        clearInterval(timer);
        setTimeout(() => {
            onLoadingComplete();
        }, 800); // Slight pause at 100% before exit
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [onLoadingComplete]);

  return (
    <motion.div 
      className="fixed inset-0 z-[100] bg-[#050505] flex items-center justify-center overflow-hidden"
      exit={{ 
          opacity: 0,
          scale: 1.1,
          filter: "blur(10px)",
          transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1] } 
      }}
    >
        {/* 1. Fullscreen Matrix Canvas */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-60" />

        {/* 2. Large "ZU" Logo Overlay */}
        <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
            <h1 
                className="text-[25vw] font-black tracking-tighter text-transparent select-none"
                style={{ 
                    fontFamily: "'Space Grotesk', sans-serif",
                    WebkitTextStroke: "2px rgba(255, 255, 255, 0.15)",
                    filter: "drop-shadow(0 0 20px rgba(74, 222, 128, 0.2))"
                }}
            >
                ZU
            </h1>
        </div>

        {/* 3. Foreground UI (Progress Bar & Stats) */}
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-end pb-16 md:pb-24 pointer-events-none">
            <div className="flex flex-col items-center gap-6 w-64 md:w-80">
                 
                 {/* Progress Bar Container */}
                 <div className="w-full h-[2px] bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                    <motion.div 
                        className="h-full bg-gradient-to-r from-green-500 to-green-300 shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ ease: "linear", duration: 0.1 }}
                    />
                 </div>

                 {/* Text Info */}
                 <div className="flex justify-between w-full text-[10px] md:text-xs font-mono tracking-[0.2em] text-gray-500 uppercase">
                    <motion.div 
                        className="flex items-center gap-2"
                        animate={{ opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                        <span>System.Boot</span>
                    </motion.div>
                    <span className="text-white font-bold">{progress}%</span>
                 </div>
            </div>
        </div>
    </motion.div>
  );
};

export default MatrixLoader;