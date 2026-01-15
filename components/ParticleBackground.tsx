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
    canvas.width = width;
    canvas.height = height;

    const particles: Particle[] = [];
    const particleCount = 100;

    let mouse = { x: -1000, y: -1000 };
    let lastScrollY = window.scrollY;
    let scrollVelocity = 0;

    class Particle {
      x: number;
      y: number;
      size: number;
      vx: number;
      vy: number;
      color: string;
      alpha: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 2 + 1;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.alpha = Math.random() * 0.5 + 0.3;
        this.color = '';
        this.updateColor();
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        
        // Stretch effect based on scroll velocity ("Lamination" / Streak)
        // If scrolling fast, stretch the particle vertically
        const stretch = Math.max(1, Math.min(Math.abs(scrollVelocity) * 1.5, 40));
        
        if (stretch > 1.2) {
             // Draw streak
             ctx.ellipse(this.x, this.y, this.size, this.size * stretch, 0, 0, Math.PI * 2);
        } else {
             ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        }
        ctx.fill();
      }

      updateColor() {
        const p = this.x / width;
        let r, g, b;

        // Gradient: Purple (168, 85, 247) -> Green (34, 197, 94) -> Blue (59, 130, 246)
        if (p <= 0.5) {
            const t = p * 2; 
            r = 168 + (34 - 168) * t;
            g = 85 + (197 - 85) * t;
            b = 247 + (94 - 247) * t;
        } else {
            const t = (p - 0.5) * 2; 
            r = 34 + (59 - 34) * t;
            g = 197 + (130 - 197) * t;
            b = 94 + (246 - 94) * t;
        }

        this.color = `rgba(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)}, ${this.alpha})`;
      }

      update() {
        // Mouse interaction
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 150;

        if (distance < maxDistance) {
          const forceDirectionX = dx / distance;
          const forceDirectionY = dy / distance;
          const force = (maxDistance - distance) / maxDistance;
          
          const strength = 3; 
          this.vx -= forceDirectionX * force * strength * 0.1;
          this.vy -= forceDirectionY * force * strength * 0.1;
        }

        // Apply Scroll Force ("Drawing Down" effect)
        // Move particles vertically based on scroll velocity to create the "flow"
        this.y += this.vy + (scrollVelocity * 0.5); 
        this.x += this.vx;

        // Friction
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        const maxSpeed = 3;
        if (speed > maxSpeed) {
            this.vx = (this.vx / speed) * maxSpeed;
            this.vy = (this.vy / speed) * maxSpeed;
        }

        // Wrap around screen
        if (this.x > width) this.x = 0;
        else if (this.x < 0) this.x = width;
        if (this.y > height) this.y = 0;
        else if (this.y < 0) this.y = height;

        this.updateColor();
      }
    }

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    let animationFrameId: number;

    const animate = () => {
      // Trail effect: instead of clearing completely, draw a semi-transparent black rect
      // When scrolling fast, use lower alpha to create longer, smoother trails ("lamination")
      const baseAlpha = 0.2;
      const velocityFactor = Math.min(Math.abs(scrollVelocity) * 0.01, 0.15); // max 0.15 reduction
      const currentAlpha = Math.max(0.05, baseAlpha - velocityFactor);
      
      ctx.fillStyle = `rgba(5, 5, 5, ${currentAlpha})`; 
      ctx.fillRect(0, 0, width, height);
      
      // Decay scroll velocity (Inertia)
      scrollVelocity *= 0.92;
      if (Math.abs(scrollVelocity) < 0.1) scrollVelocity = 0;
      
      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    const handleMouseMove = (e: MouseEvent) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    };
    
    const handleScroll = () => {
        const currentY = window.scrollY;
        // Calculate velocity (difference in scroll position)
        scrollVelocity = currentY - lastScrollY;
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
      className="absolute inset-0 pointer-events-none z-0"
      style={{ mixBlendMode: 'screen' }}
    />
  );
};

export default ParticleBackground;