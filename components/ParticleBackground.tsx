import React, { useEffect, useRef } from 'react';

const ParticleBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    
    const setSize = () => {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    };
    setSize();

    // --- CONFIGURATION ---
    const STAR_COUNT = width < 768 ? 80 : 300; // Increased for intensity
    const CONNECTION_DIST = 150; // Increased reach
    const BASE_SPEED = 0.5; // Faster drift
    const MAX_SPEED = 40; 
    
    // --- STATE ---
    let stars: Star[] = [];
    let scrollSpeed = 0;
    let lastScrollY = window.scrollY;
    let mouse = { x: width / 2, y: height / 2 };
    let targetMouse = { x: width / 2, y: height / 2 };
    let time = 0;

    // --- COLORS ---
    // Using the portfolio's accent colors but muted
    const colors = [
        { r: 255, g: 255, b: 255 }, // White
        { r: 74, g: 222, b: 128 },  // Green-400
        { r: 168, g: 85, b: 247 },  // Purple-500
    ];

    class Star {
      x: number;
      y: number;
      z: number;
      baseX: number;
      baseY: number;
      radius: number;
      color: { r: number, g: number, b: number };
      driftSpeed: number;
      driftOffset: number;

      constructor() {
        // Initialize randomly in 3D space
        this.baseX = (Math.random() - 0.5) * width * 2;
        this.baseY = (Math.random() - 0.5) * height * 2;
        this.x = this.baseX;
        this.y = this.baseY;
        this.z = Math.random() * width; 
        
        this.radius = Math.random() * 1.5 + 0.5; // Larger particles
        this.color = colors[Math.floor(Math.random() * colors.length)];
        
        // Organic drift parameters
        this.driftSpeed = Math.random() * 0.02 + 0.005;
        this.driftOffset = Math.random() * Math.PI * 2;
      }

      update(speed: number, t: number) {
        this.z -= speed;
        
        // Respawn if behind camera
        if (this.z <= 1) {
          this.z = width;
          this.baseX = (Math.random() - 0.5) * width * 2;
          this.baseY = (Math.random() - 0.5) * height * 2;
          this.x = this.baseX;
          this.y = this.baseY;
        }

        // Apply organic drift (Lissajous-like movement)
        this.x = this.baseX + Math.sin(t * this.driftSpeed + this.driftOffset) * 50;
        this.y = this.baseY + Math.cos(t * this.driftSpeed * 0.8 + this.driftOffset) * 50;
      }

      draw(sx: number, sy: number, scale: number, ctx: CanvasRenderingContext2D) {
        // Opacity based on depth (fade in as they get closer/appear)
        // Also fade out if very close to prevent jarring pops
        const distRatio = this.z / width;
        const alpha = (1 - distRatio) * Math.min(1, (width - this.z) / 200);
        
        ctx.beginPath();
        ctx.arc(sx, sy, this.radius * scale, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${alpha})`;
        ctx.fill();
      }
    }

    // Initialize Stars
    for (let i = 0; i < STAR_COUNT; i++) {
        stars.push(new Star());
    }

    let animationFrameId: number;

    const animate = () => {
        time += 1;
        
        // Trail Logic
        // Calculate warp intensity
        const warpFactor = Math.min(scrollSpeed / MAX_SPEED, 1);
        
        // Dynamic background clearing
        // If warping, we want more trails (lower opacity fill)
        // If static, we want clear background (higher opacity fill)
        const baseAlpha = 0.2; // Base trail length
        const warpAlpha = 0.05; // Long trails during warp
        const alphaFade = warpAlpha + (baseAlpha - warpAlpha) * (1 - warpFactor);
        
        ctx.fillStyle = `rgba(5, 5, 5, ${alphaFade})`; 
        ctx.fillRect(0, 0, width, height);

        // Smooth Mouse Follow
        mouse.x += (targetMouse.x - mouse.x) * 0.03; // Smoother easing
        mouse.y += (targetMouse.y - mouse.y) * 0.03;

        // Calculate Vanishing Point (Center)
        const cx = width / 2;
        const cy = height / 2;
        
        // Parallax - Subtle camera movement
        const offsetX = (mouse.x - cx) * 0.3;
        const offsetY = (mouse.y - cy) * 0.3;

        // Speed Logic
        const targetSpeed = BASE_SPEED + (scrollSpeed * 0.8); 
        
        const projectedStars: { x: number, y: number, star: Star, scale: number }[] = [];

        stars.forEach(star => {
            star.update(targetSpeed, time);

            // Perspective Projection
            const fov = width * 0.8;
            const scale = fov / (fov + star.z);

            const sx = cx + (star.x * scale) + offsetX * scale * 0.2; // Reduced parallax influence on position for stability
            const sy = cy + (star.y * scale) + offsetY * scale * 0.2;

            if (sx > -50 && sx < width + 50 && sy > -50 && sy < height + 50) {
                star.draw(sx, sy, scale, ctx);
                projectedStars.push({ x: sx, y: sy, star, scale });
            }
        });

        // Draw Connections
        if (warpFactor < 0.5) { // Fade out connections during high speed warp to reduce visual noise
            ctx.lineWidth = 0.5;
            for (let i = 0; i < projectedStars.length; i++) {
                const p1 = projectedStars[i];
                
                // Limit connections per star for performance
                let connections = 0;
                
                for (let j = i + 1; j < projectedStars.length; j++) {
                    if (connections > 3) break; // Optimization

                    const p2 = projectedStars[j];
                    const dx = p1.x - p2.x;
                    const dy = p1.y - p2.y;
                    const distSq = dx*dx + dy*dy;

                    if (distSq < CONNECTION_DIST * CONNECTION_DIST) {
                        const dist = Math.sqrt(distSq);
                        const opacity = (1 - (dist / CONNECTION_DIST));
                        
                        // Fade based on depth similarity to avoid messy cross-depth lines
                        const zDist = Math.abs(p1.star.z - p2.star.z);
                        const zFactor = Math.max(0, 1 - zDist / 200);
                        
                        // Fade out based on global warp
                        const stabilityFactor = 1 - (warpFactor * 2); 

                        if (opacity * zFactor * stabilityFactor > 0.05) {
                             ctx.beginPath();
                            ctx.moveTo(p1.x, p1.y);
                            ctx.lineTo(p2.x, p2.y);
                            
                            const c1 = p1.star.color;
                            const c2 = p2.star.color;
                            
                            // Average color
                            const r = Math.floor((c1.r + c2.r) / 2);
                            const g = Math.floor((c1.g + c2.g) / 2);
                            const b = Math.floor((c1.b + c2.b) / 2);
                            
                            // Increased opacity for more intensity (0.6 multiplier)
                            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${opacity * zFactor * stabilityFactor * 0.6})`;
                            ctx.stroke();
                            connections++;
                        }
                    }
                }
            }
        }

        // Scroll Velocity Decay
        scrollSpeed *= 0.92; // Smoother decay
        if (Math.abs(scrollSpeed) < 0.01) scrollSpeed = 0;

        animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => setSize();
    
    const handleMouseMove = (e: MouseEvent) => {
        targetMouse.x = e.clientX;
        targetMouse.y = e.clientY;
    };

    const handleScroll = () => {
        const currentY = window.scrollY;
        const delta = Math.abs(currentY - lastScrollY);
        scrollSpeed = Math.min(scrollSpeed + delta * 0.5, MAX_SPEED); // sensitivity
        lastScrollY = currentY;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);

    return () => {
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <canvas 
        ref={canvasRef} 
        className="fixed inset-0 pointer-events-none z-0"
        style={{ 
            mixBlendMode: 'screen',
            opacity: 0.8 
        }} 
    />
  );
};

export default ParticleBackground;