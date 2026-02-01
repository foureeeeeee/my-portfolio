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
    const STAR_COUNT = width < 768 ? 80 : 300; 
    const CONNECTION_DIST = 150; 
    const BASE_SPEED = 0.5; 
    const MAX_SPEED = 40; 
    
    // Repulsion Config
    const REPULSION_RADIUS = 180; // Size of the "blocker" field around mouse
    const REPULSION_FORCE = 2.5; // How hard it pushes
    const FRICTION = 0.92; // How quickly the push momentum dies down
    
    // --- STATE ---
    let stars: Star[] = [];
    let scrollSpeed = 0;
    let lastScrollY = window.scrollY;
    let mouse = { x: width / 2, y: height / 2 };
    let targetMouse = { x: width / 2, y: height / 2 };
    let time = 0;

    // --- COLORS ---
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
      
      // Physics velocity for repulsion
      vx: number;
      vy: number;

      constructor() {
        // Initialize randomly in 3D space
        this.baseX = (Math.random() - 0.5) * width * 2;
        this.baseY = (Math.random() - 0.5) * height * 2;
        this.x = this.baseX;
        this.y = this.baseY;
        this.z = Math.random() * width; 
        
        this.radius = Math.random() * 1.5 + 0.5; 
        this.color = colors[Math.floor(Math.random() * colors.length)];
        
        this.driftSpeed = Math.random() * 0.02 + 0.005;
        this.driftOffset = Math.random() * Math.PI * 2;
        
        this.vx = 0;
        this.vy = 0;
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
          this.vx = 0;
          this.vy = 0;
        }

        // Apply velocity from repulsion to the base coordinates (Changing the route)
        this.baseX += this.vx;
        this.baseY += this.vy;

        // Apply friction to velocity
        this.vx *= FRICTION;
        this.vy *= FRICTION;

        // Apply organic drift on top of the modified base position
        this.x = this.baseX + Math.sin(t * this.driftSpeed + this.driftOffset) * 50;
        this.y = this.baseY + Math.cos(t * this.driftSpeed * 0.8 + this.driftOffset) * 50;
      }

      draw(sx: number, sy: number, scale: number, ctx: CanvasRenderingContext2D) {
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
        
        const warpFactor = Math.min(scrollSpeed / MAX_SPEED, 1);
        
        const baseAlpha = 0.2; 
        const warpAlpha = 0.05; 
        const alphaFade = warpAlpha + (baseAlpha - warpAlpha) * (1 - warpFactor);
        
        ctx.fillStyle = `rgba(5, 5, 5, ${alphaFade})`; 
        ctx.fillRect(0, 0, width, height);

        mouse.x += (targetMouse.x - mouse.x) * 0.05; 
        mouse.y += (targetMouse.y - mouse.y) * 0.05;

        const cx = width / 2;
        const cy = height / 2;
        
        const offsetX = (mouse.x - cx) * 0.3;
        const offsetY = (mouse.y - cy) * 0.3;

        const targetSpeed = BASE_SPEED + (scrollSpeed * 0.8); 
        
        const projectedStars: { x: number, y: number, star: Star, scale: number }[] = [];

        stars.forEach(star => {
            star.update(targetSpeed, time);

            // Perspective Projection
            const fov = width * 0.8;
            const scale = fov / (fov + star.z);

            const sx = cx + (star.x * scale) + offsetX * scale * 0.2; 
            const sy = cy + (star.y * scale) + offsetY * scale * 0.2;

            // --- OBSTACLE AVOIDANCE LOGIC ---
            // Check distance between 2D screen projection and mouse
            const dx = sx - mouse.x;
            const dy = sy - mouse.y;
            const distance = Math.sqrt(dx*dx + dy*dy);

            if (distance < REPULSION_RADIUS) {
                // Calculate repulsion direction
                const angle = Math.atan2(dy, dx);
                
                // Strength depends on how close it is (closer = stronger push)
                const force = (REPULSION_RADIUS - distance) / REPULSION_RADIUS; 
                
                // Scale force by perspective (objects closer to camera react more)
                const perspectiveForce = force * REPULSION_FORCE * (scale * 0.5);

                // Add to velocity to permanently alter route
                star.vx += Math.cos(angle) * perspectiveForce;
                star.vy += Math.sin(angle) * perspectiveForce;
            }

            if (sx > -50 && sx < width + 50 && sy > -50 && sy < height + 50) {
                star.draw(sx, sy, scale, ctx);
                projectedStars.push({ x: sx, y: sy, star, scale });
            }
        });

        // Draw Connections
        if (warpFactor < 0.5) { 
            ctx.lineWidth = 0.5;
            for (let i = 0; i < projectedStars.length; i++) {
                const p1 = projectedStars[i];
                let connections = 0;
                
                for (let j = i + 1; j < projectedStars.length; j++) {
                    if (connections > 3) break; 

                    const p2 = projectedStars[j];
                    const dx = p1.x - p2.x;
                    const dy = p1.y - p2.y;
                    const distSq = dx*dx + dy*dy;

                    if (distSq < CONNECTION_DIST * CONNECTION_DIST) {
                        const dist = Math.sqrt(distSq);
                        const opacity = (1 - (dist / CONNECTION_DIST));
                        
                        const zDist = Math.abs(p1.star.z - p2.star.z);
                        const zFactor = Math.max(0, 1 - zDist / 200);
                        
                        const stabilityFactor = 1 - (warpFactor * 2); 

                        if (opacity * zFactor * stabilityFactor > 0.05) {
                             ctx.beginPath();
                            ctx.moveTo(p1.x, p1.y);
                            ctx.lineTo(p2.x, p2.y);
                            
                            const c1 = p1.star.color;
                            const c2 = p2.star.color;
                            
                            const r = Math.floor((c1.r + c2.r) / 2);
                            const g = Math.floor((c1.g + c2.g) / 2);
                            const b = Math.floor((c1.b + c2.b) / 2);
                            
                            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${opacity * zFactor * stabilityFactor * 0.6})`;
                            ctx.stroke();
                            connections++;
                        }
                    }
                }
            }
        }

        // Scroll Velocity Decay
        scrollSpeed *= 0.92; 
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
        scrollSpeed = Math.min(scrollSpeed + delta * 0.5, MAX_SPEED);
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