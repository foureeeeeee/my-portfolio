import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TravelLocation } from '../types';
import { X, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';

interface WorldMapProps {
  locations: TravelLocation[];
}

// Low-res silhouette map of the world for particle sampling
const MAP_IMAGE_SRC = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAA8CAMAAAB6wK7nAAAAA1BMVEUAAACnej3aAAAAR0lEQVR4nO3BAQ0AAADCoPdPbQ8HFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPBgxUwAAQ4n3yAAAAABJRU5ErkJggg==";
// Note: The above is a placeholder blank image. In a real scenario, we'd use a real silhouette.
// Let's use a function to draw a rough approximation if we don't have a good base64 string,
// OR use a reliable external source. For this demo, I will build a particle system that
// arranges itself into a grid but highlights based on coordinates provided.
// Actually, let's use a standard public domain map URL.
const MAP_URL = "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/World_map_blank_black_lines_4500px_monochrome.png/800px-World_map_blank_black_lines_4500px_monochrome.png";

const WorldMap: React.FC<WorldMapProps> = ({ locations }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedLocation, setSelectedLocation] = useState<TravelLocation | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Map Particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let particles: Particle[] = [];

    class Particle {
      x: number;
      y: number;
      size: number;
      baseX: number;
      baseY: number;
      density: number;
      
      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.baseX = x;
        this.baseY = y;
        this.size = Math.random() * 1.5 + 0.5;
        this.density = (Math.random() * 30) + 1;
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
      }

      update() {
        // Gentle float
        this.x = this.baseX + Math.sin(Date.now() * 0.001 + this.density) * 2;
        this.y = this.baseY + Math.cos(Date.now() * 0.001 + this.density) * 2;
      }
    }

    const init = () => {
      particles = [];
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = MAP_URL;
      
      img.onload = () => {
        // Draw image to canvas to sample data
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Grid sampling
        const gap = 6; // px between particles
        for (let y = 0; y < canvas.height; y += gap) {
          for (let x = 0; x < canvas.width; x += gap) {
            const index = (y * canvas.width + x) * 4;
            const alpha = data[index + 3];
            // If pixel is not transparent (assuming black map on transparent bg, or non-white)
            // The Wikimedia image is transparent background with black lines.
            // We check alpha > 128
            if (alpha > 128) {
               particles.push(new Particle(x, y));
            }
          }
        }
      };
      
      // Fallback if image fails or for immediate feedback: Random world cloud
      if (particles.length === 0) {
           // We can't easily draw a world map procedurally without the image. 
           // For this demo, we'll try to load the image.
           // If it fails (CORS), we'll draw a cool abstract grid.
      }
    };

    const animate = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw grid lines for "Holographic" feel
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      const gridSize = 50;
      for(let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for(let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      particles.forEach(p => {
        p.update();
        p.draw();
      });
      animationId = requestAnimationFrame(animate);
    };

    const handleResize = () => {
        if (containerRef.current) {
            canvas.width = containerRef.current.offsetWidth;
            canvas.height = containerRef.current.offsetHeight;
            init();
        }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  const nextImage = () => {
    if (selectedLocation) {
        setActiveImageIndex((prev) => (prev + 1) % selectedLocation.images.length);
    }
  };

  const prevImage = () => {
    if (selectedLocation) {
        setActiveImageIndex((prev) => (prev - 1 + selectedLocation.images.length) % selectedLocation.images.length);
    }
  };

  return (
    <section id="travel" className="relative py-24 bg-[#020202] overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="flex items-center gap-4 mb-12">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <h2 className="text-sm font-mono tracking-widest text-gray-400">GLOBAL FOOTPRINT</h2>
            </div>
            
            <div className="relative w-full aspect-[16/9] border border-white/10 bg-black/50 rounded-lg overflow-hidden backdrop-blur-sm group" ref={containerRef}>
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-60" />
                
                {/* Abstract World Grid Background (Fallback visual) */}
                <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Blue_Marble_2002.png/1200px-Blue_Marble_2002.png')] bg-cover bg-center opacity-10 grayscale mix-blend-screen pointer-events-none"></div>

                {/* Location Markers */}
                {locations.map((loc) => (
                    <motion.button
                        key={loc.id}
                        className="absolute w-4 h-4 -ml-2 -mt-2 z-10 group/pin"
                        style={{ left: `${loc.x}%`, top: `${loc.y}%` }}
                        onClick={() => {
                            setSelectedLocation(loc);
                            setActiveImageIndex(0);
                        }}
                        whileHover={{ scale: 1.5 }}
                    >
                        {/* Pulse Effect */}
                        <span className="absolute inset-0 rounded-full bg-yellow-500 animate-ping opacity-75"></span>
                        <span className="absolute inset-0 rounded-full bg-yellow-500 shadow-[0_0_10px_#eab308]"></span>
                        
                        {/* Tooltip */}
                        <div className="absolute left-1/2 bottom-full mb-3 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover/pin:opacity-100 transition-opacity pointer-events-none">
                            <div className="bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1 rounded text-xs tracking-wider uppercase">
                                {loc.name}
                            </div>
                            <div className="w-[1px] h-3 bg-white/20 mx-auto"></div>
                        </div>
                    </motion.button>
                ))}

                {/* Instructions */}
                <div className="absolute bottom-6 left-6 text-xs text-gray-600 font-mono">
                    // INTERACTIVE MAP SYSTEM V1.0<br/>
                    // CLICK NODES TO ACCESS ARCHIVES
                </div>
            </div>
        </div>

        {/* Gallery Modal */}
        <AnimatePresence>
            {selectedLocation && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 md:p-12"
                    onClick={() => setSelectedLocation(null)}
                >
                    <div 
                        className="w-full max-w-6xl h-full max-h-[80vh] flex flex-col md:flex-row gap-8"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Image Viewer */}
                        <motion.div 
                            className="flex-1 relative bg-black border border-white/10 rounded-lg overflow-hidden group"
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                        >
                             <AnimatePresence mode="wait">
                                <motion.img 
                                    key={activeImageIndex}
                                    src={selectedLocation.images[activeImageIndex]} 
                                    alt={selectedLocation.name}
                                    className="w-full h-full object-cover"
                                    initial={{ opacity: 0, scale: 1.1 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.5 }}
                                />
                             </AnimatePresence>
                             
                             {/* Navigation */}
                             <button 
                                onClick={prevImage}
                                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-white hover:text-black transition-all opacity-0 group-hover:opacity-100"
                             >
                                <ChevronLeft />
                             </button>
                             <button 
                                onClick={nextImage}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-white hover:text-black transition-all opacity-0 group-hover:opacity-100"
                             >
                                <ChevronRight />
                             </button>

                             <div className="absolute bottom-4 left-0 w-full flex justify-center gap-2">
                                {selectedLocation.images.map((_, idx) => (
                                    <button 
                                        key={idx}
                                        onClick={() => setActiveImageIndex(idx)}
                                        className={`w-1.5 h-1.5 rounded-full transition-all ${idx === activeImageIndex ? 'bg-white w-4' : 'bg-white/30 hover:bg-white/50'}`}
                                    />
                                ))}
                             </div>
                        </motion.div>

                        {/* Info Panel */}
                        <motion.div 
                            className="md:w-80 flex flex-col gap-6"
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-4xl font-bold mb-2">{selectedLocation.name}</h3>
                                    <p className="text-yellow-500 font-mono">{selectedLocation.date}</p>
                                </div>
                                <button 
                                    onClick={() => setSelectedLocation(null)}
                                    className="p-2 border border-white/10 rounded-full hover:bg-white hover:text-black transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                                <p className="text-gray-400 leading-relaxed text-sm">
                                    Explored the vibrant culture and aesthetics of {selectedLocation.name}. 
                                    Captured moments of architectural beauty and urban life.
                                </p>
                                
                                <div className="grid grid-cols-2 gap-2">
                                    {selectedLocation.images.map((img, idx) => (
                                        <button 
                                            key={idx}
                                            onClick={() => setActiveImageIndex(idx)}
                                            className={`aspect-square rounded overflow-hidden border ${idx === activeImageIndex ? 'border-yellow-500' : 'border-transparent opacity-60 hover:opacity-100'} transition-all`}
                                        >
                                            <img src={img} alt="" className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </section>
  );
};

export default WorldMap;