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
    const particleCount = 120; 

    let mouse = { x: -1000, y: -1000 };
    let lastScrollY = window.scrollY;
    let scrollVelocity = 0;

    class Particle {
      x: number;
      y: number;
      size: number;
      vx: number;
      vy: number;
      baseVy: number; // Store original vertical speed
      color: string;
      alpha: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 2 + 1.2;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.baseVy = (Math.random() - 0.5) * 0.5;
        this.vy = this.baseVy;
        this.alpha = Math.random() * 0.5 + 0.3;
        this.color = '';
        this.updateColor();
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        
        // Stretch effect (Lamination)
        const stretch = Math.max(1, Math.min(Math.abs(scrollVelocity) * 2, 50));
        
        if (stretch > 1.2) {
             ctx.ellipse(this.x, this.y, this.size, this.size * stretch, 0, 0, Math.PI * 2);
        } else {
             ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        }
        ctx.fill();
      }

      updateColor() {
        const p = this.x / width;
        let r, g, b;

        // Gradient: Purple -> Green -> Blue
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

        // --- DISSIPATION LOGIC ---
        // As we scroll past the hero (e.g. > 100px), start accelerating particles downwards
        // to simulate them flowing/dissipating into the marquee.
        const scrollProgress = Math.min(window.scrollY / height, 2); // 0 to 2
        
        // Base scroll force (Drawing Down)
        let scrollForce = scrollVelocity * 0.8;
        
        // Dissipation force: If we are scrolling down into Marquee (approx > 0.3 progress),
        // add extra downward pull and scatter to "dissipate" them.
        if (scrollProgress > 0.3) {
             // The further down we scroll, the faster they fall/scatter
             this.vy += 0.2 * scrollProgress; 
             this.vx += (Math.random() - 0.5) * 0.1 * scrollProgress; // Scatter horizontally
        } else {
             // Return to normal-ish floating when near top
             this.vy = this.baseVy + (this.vy - this.baseVy) * 0.95;
        }

        this.y += this.vy + scrollForce; 
        this.x += this.vx;

        // Friction for horizontal
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        const maxSpeed = 3 + (scrollProgress * 5); // Allow higher speeds when dissipating
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
      // Visibility Logic: "Not full time particle effect"
      // Visible in Hero (0 to 1vh) and Marquee (1vh to ~1.8vh)
      // Fade out completely after 1.8vh
      const scrollY = window.scrollY;
      const fadeStart = height * 1.5; 
      const fadeEnd = height * 2.2;
      
      let containerOpacity = 1;
      if (scrollY > fadeStart) {
          containerOpacity = 1 - (scrollY - fadeStart) / (fadeEnd - fadeStart);
          if (containerOpacity < 0) containerOpacity = 0;
      }
      
      // Update canvas opacity
      if (canvas) {
          canvas.style.opacity = containerOpacity.toString();
          // Optimisation: Stop drawing if invisible
          if (containerOpacity <= 0) {
              animationFrameId = requestAnimationFrame(animate);
              return;
          }
      }

      // Trail effect logic
      const baseAlpha = 0.2;
      const velocityFactor = Math.min(Math.abs(scrollVelocity) * 0.01, 0.18); 
      const currentAlpha = Math.max(0.02, baseAlpha - velocityFactor);
      
      ctx.fillStyle = `rgba(5, 5, 5, ${currentAlpha})`; 
      ctx.fillRect(0, 0, width, height);
      
      // Decay scroll velocity
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
      className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-300"
      style={{ mixBlendMode: 'screen' }}
    />
  );
};

export default ParticleBackground;