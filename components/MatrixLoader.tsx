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

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const katakana = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン';
    const latin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const nums = '0123456789';
    const alphabet = katakana + latin + nums;

    const fontSize = 16;
    const columns = canvas.width / fontSize;

    const drops: number[] = [];
    for (let x = 0; x < columns; x++) {
      drops[x] = 1;
    }

    let animationFrameId: number;

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'; // Fade effect
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#0F0'; // Green text
      ctx.font = fontSize + 'px monospace';

      for (let i = 0; i < drops.length; i++) {
        const text = alphabet.charAt(Math.floor(Math.random() * alphabet.length));
        
        // Varying colors for depth
        const isWhite = Math.random() > 0.95;
        ctx.fillStyle = isWhite ? '#FFF' : '#22c55e'; // White or Matrix Green

        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    const handleResize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Progress Counter
  useEffect(() => {
    const duration = 2500; // 2.5 seconds total load time
    const intervalTime = 25;
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
        }, 500); // Slight delay after 100%
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [onLoadingComplete]);

  return (
    <motion.div 
      className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center overflow-hidden"
      exit={{ opacity: 0, y: -100, transition: { duration: 0.8, ease: "easeInOut" } }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 opacity-30" />
      
      <div className="relative z-10 flex flex-col items-center">
        <motion.div 
            className="text-8xl md:text-9xl font-bold font-mono tracking-tighter text-white"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
        >
          {progress}%
        </motion.div>
        <motion.div 
            className="mt-4 text-xs tracking-[0.5em] text-gray-400 uppercase"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
        >
          System Initializing
        </motion.div>
      </div>
    </motion.div>
  );
};

export default MatrixLoader;