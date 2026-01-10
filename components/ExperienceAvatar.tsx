import React, { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

const AVATAR_URL =
  "https://raw.githubusercontent.com/foureeeeeee/picutestorage/main/avatar.png";

const ExperienceAvatar: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState(false);

  // Parallax Motion Values
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseX = useSpring(x, { stiffness: 120, damping: 25 });
  const mouseY = useSpring(y, { stiffness: 120, damping: 25 });

  const rotateX = useTransform(mouseY, [-0.5, 0.5], [12, -12]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-12, 12]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.offsetWidth;
    let height = canvas.offsetHeight;
    canvas.width = width;
    canvas.height = height;

    const particles: Particle[] = [];
    const gap = 10; // MORE DENSE
    let mouse = { x: -1000, y: -1000 };

    class Particle {
      x: number;
      y: number;
      originX: number;
      originY: number;
      size: number;
      color: string;
      vx = 0;
      vy = 0;
      friction = 0.88;
      ease = 0.12;

      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.originX = x;
        this.originY = y;
        this.size = Math.random() * 2 + 1;
        this.color =
          Math.random() > 0.85
            ? '#ffffff'
            : `rgba(34,197,94,${Math.random() * 0.7 + 0.3})`;
      }

      update() {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const forceRadius = 200;

        if (dist < forceRadius) {
          const angle = Math.atan2(dy, dx);
          const force = (forceRadius - dist) / forceRadius;

          const power = active ? 80 : 45; // 🔥 MORE INTENSE ON HOVER
          this.vx -= Math.cos(angle) * force * power;
          this.vy -= Math.sin(angle) * force * power;
        }

        this.vx += (this.originX - this.x) * this.ease;
        this.vy += (this.originY - this.y) * this.ease;

        this.vx *= this.friction;
        this.vy *= this.friction;

        this.x += this.vx;
        this.y += this.vy;
      }

      draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
      }
    }

    const init = () => {
      particles.length = 0;
      for (let y = 0; y < height; y += gap) {
        for (let x = 0; x < width; x += gap) {
          particles.push(new Particle(x, y));
        }
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      requestAnimationFrame(animate);
    };

    init();
    animate();

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;

      const cx = rect.width / 2;
      const cy = rect.height / 2;
      x.set((mouse.x - cx) / rect.width);
      y.set((mouse.y - cy) / rect.height);
    };

    const handleEnter = () => setActive(true);
    const handleLeave = () => {
      setActive(false);
      mouse.x = -1000;
      mouse.y = -1000;
      x.set(0);
      y.set(0);
    };

    const el = containerRef.current;
    el?.addEventListener('mousemove', handleMouseMove);
    el?.addEventListener('mouseenter', handleEnter);
    el?.addEventListener('mouseleave', handleLeave);

    return () => {
      el?.removeEventListener('mousemove', handleMouseMove);
      el?.removeEventListener('mouseenter', handleEnter);
      el?.removeEventListener('mouseleave', handleLeave);
    };
  }, [active, x, y]);

  return (
    <div className="perspective-1000 w-full max-w-md mx-auto">
      <motion.div
        ref={containerRef}
        className="relative w-full aspect-[3.5/4] bg-black rounded-lg overflow-hidden cursor-crosshair border border-white/5 shadow-2xl"
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
      >
        {/* IMAGE */}
        <motion.div
          className="absolute inset-0"
          style={{ scale: 1.15, z: -20 }}
        >
          <img
            src={AVATAR_URL}
            alt="Avatar"
            className={`
              w-full h-full object-cover transition-all duration-500
              ${active
                ? 'filter-none'
                : 'contrast-125 brightness-90 saturate-110 hue-rotate-[200deg]'}
            `}
          />

          {/* CYBER COLOR OVERLAY (DISAPPEARS ON HOVER) */}
          <div
            className={`
              absolute inset-0 transition-opacity duration-500
              ${active ? 'opacity-0' : 'opacity-60'}
              bg-gradient-to-br from-green-900/40 via-cyan-500/10 to-black
              mix-blend-overlay
            `}
          />

          {/* SCANLINES */}
          <div className="absolute inset-0 pointer-events-none opacity-30
            bg-[linear-gradient(rgba(0,0,0,0)_50%,rgba(0,0,0,0.35)_50%)]
            bg-[length:100%_2px]" />
        </motion.div>

        {/* PARTICLES */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none mix-blend-screen opacity-95 z-20"
        />

        {/* TEXT */}
        <div
          className="absolute bottom-6 left-6 z-30 pointer-events-none"
          style={{ transform: 'translateZ(30px)' }}
        >
          <h3 className="text-white text-2xl font-bold bg-black/50 backdrop-blur-md px-3 py-1 mb-1">
            ZU KAIQUAN
          </h3>
          <p className="text-green-400 text-xs font-mono bg-black/50 backdrop-blur-md px-3 py-1">
            SYSTEM.IDENTITY_VERIFIED
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default ExperienceAvatar;
