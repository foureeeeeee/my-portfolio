import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence, useScroll, useVelocity, useSpring, useTransform } from 'framer-motion';
import { TravelLocation } from '../types';
import { X, ChevronLeft, ChevronRight, Globe } from 'lucide-react';

interface WorldMapProps {
  locations: TravelLocation[];
}

interface Point3D {
  x: number;
  y: number;
  z: number;
  baseX: number;
  baseY: number;
  baseZ: number;
  lat: number;
  lon: number;
}

const WorldMap: React.FC<WorldMapProps> = ({ locations }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedLocation, setSelectedLocation] = useState<TravelLocation | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // --- Scroll & Mouse Interaction Hooks ---
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, { damping: 50, stiffness: 400 });
  
  // Convert 2D Map coordinates (0-100%) to Spherical Lat/Lon for the globe
  // Approximation: Map X (0-100) to Lon (-180 to 180), Map Y (0-100) to Lat (90 to -90)
  const mappedLocations = useMemo(() => {
    return locations.map(loc => {
        // Simple linear mapping for demo purposes. 
        // Real apps might use actual lat/lon coordinates.
        const lon = (loc.x / 100) * 360 - 180; 
        const lat = ((loc.y / 100) * 180 - 90) * -1;
        return { ...loc, lat, lon };
    });
  }, [locations]);

  // Track projected 2D positions of the pins to render HTML buttons on top of Canvas
  const [projectedPins, setProjectedPins] = useState<{id: number, x: number, y: number, z: number, opacity: number}[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = container.offsetWidth;
    let height = container.offsetHeight;
    canvas.width = width;
    canvas.height = height;

    // --- GLOBE CONFIG ---
    const GLOBE_RADIUS = Math.min(width, height) * 0.35;
    const DOT_COUNT = 1200;
    const DOT_SIZE = 1.5;
    const PROJECTION_CENTER_X = width / 2;
    const PROJECTION_CENTER_Y = height / 2;
    const PERSPECTIVE = width * 0.8; // Field of view

    // --- GENERATE SPHERE POINTS (Fibonacci Sphere) ---
    const spherePoints: Point3D[] = [];
    const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle

    for (let i = 0; i < DOT_COUNT; i++) {
      const y = 1 - (i / (DOT_COUNT - 1)) * 2; // y goes from 1 to -1
      const radius = Math.sqrt(1 - y * y); // radius at y
      const theta = phi * i; // golden angle increment

      const x = Math.cos(theta) * radius;
      const z = Math.sin(theta) * radius;

      spherePoints.push({
        x: x * GLOBE_RADIUS,
        y: y * GLOBE_RADIUS,
        z: z * GLOBE_RADIUS,
        baseX: x * GLOBE_RADIUS,
        baseY: y * GLOBE_RADIUS,
        baseZ: z * GLOBE_RADIUS,
        lat: 0, 
        lon: 0
      });
    }

    // --- STATE ---
    let rotation = { x: 0, y: 4.5 }; // Initial rotation
    let mouse = { x: 0, y: 0 };
    let targetRotation = { x: 0, y: 0 };
    let animationFrameId: number;

    const render = () => {
      // Clear
      ctx.fillStyle = '#020202'; // Match background
      ctx.fillRect(0, 0, width, height);

      // 1. Calculate Rotation
      // Base rotation
      rotation.y += 0.002; 
      
      // Scroll velocity influence (spin faster when scrolling)
      const velocity = smoothVelocity.get();
      rotation.y += velocity * 0.00005;

      // Mouse interaction (Tilt)
      targetRotation.x = (mouse.y / height - 0.5) * 1; 
      targetRotation.y = (mouse.x / width - 0.5) * 1;
      
      // Ease into mouse position (super subtle additional rotation)
      rotation.x += (targetRotation.x - rotation.x) * 0.05;
      
      const cx = Math.cos(rotation.x);
      const sx = Math.sin(rotation.x);
      const cy = Math.cos(rotation.y);
      const sy = Math.sin(rotation.y);

      // 2. Project & Draw Sphere Dots
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      
      spherePoints.forEach(point => {
        // 3D Rotation Math
        let x = point.baseX;
        let y = point.baseY;
        let z = point.baseZ;

        // Rotation around X-axis
        let yt = y * cx - z * sx;
        let zt = y * sx + z * cx;
        y = yt;
        z = zt;

        // Rotation around Y-axis
        let xt = x * cy - z * sy;
        zt = x * sy + z * cy;
        x = xt;
        z = zt;

        // Projection (3D -> 2D)
        const scale = PERSPECTIVE / (PERSPECTIVE + z);
        const x2d = (x * scale) + PROJECTION_CENTER_X;
        const y2d = (y * scale) + PROJECTION_CENTER_Y;

        // Draw only if visible (simple z-culling, though not strictly necessary for points, looks cleaner)
        if (scale > 0 && z < GLOBE_RADIUS) {
            // Depth fading
            const alpha = Math.max(0, (scale - 0.5) * 0.6); 
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            
            ctx.beginPath();
            ctx.arc(x2d, y2d, DOT_SIZE * scale, 0, Math.PI * 2);
            ctx.fill();
        }
      });

      // 3. Calculate Pin Positions for HTML Overlay
      const newPinPositions = mappedLocations.map(loc => {
          // Convert Lat/Lon to 3D Cartesian
          const latRad = (loc.lat * Math.PI) / 180;
          const lonRad = (-loc.lon * Math.PI) / 180; // Invert lon for correct direction

          const r = GLOBE_RADIUS;
          let x = r * Math.cos(latRad) * Math.cos(lonRad);
          let y = r * Math.sin(latRad);
          let z = r * Math.cos(latRad) * Math.sin(lonRad);

          // Apply same rotation as globe
          // X-axis
          let yt = y * cx - z * sx;
          let zt = y * sx + z * cx;
          y = yt;
          z = zt;

          // Y-axis
          let xt = x * cy - z * sy;
          zt = x * sy + z * cy;
          x = xt;
          z = zt;

          // Projection
          const scale = PERSPECTIVE / (PERSPECTIVE + z);
          const x2d = (x * scale) + PROJECTION_CENTER_X;
          const y2d = (y * scale) + PROJECTION_CENTER_Y;

          // Visibility check (is it on the back of the globe?)
          // If z > 0, it's pushed back. However, our projection math above:
          // Standard: z increases away from camera. 
          // Here: positive z is 'back' based on rotation logic usually.
          // Let's use opacity to hide back pins.
          const opacity = z > 20 ? 0 : 1; // Simple culling

          return {
              id: loc.id,
              x: x2d,
              y: y2d,
              z: z,
              opacity
          };
      });
      
      setProjectedPins(newPinPositions);

      // 4. Draw Halo/Glow
      const gradient = ctx.createRadialGradient(
          PROJECTION_CENTER_X, PROJECTION_CENTER_Y, GLOBE_RADIUS * 0.8,
          PROJECTION_CENTER_X, PROJECTION_CENTER_Y, GLOBE_RADIUS * 1.5
      );
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(0.5, 'rgba(34, 197, 94, 0.05)'); // Subtle Green
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
        width = container.offsetWidth;
        height = container.offsetHeight;
        canvas.width = width;
        canvas.height = height;
    };

    const handleMouseMove = (e: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    };

    window.addEventListener('resize', handleResize);
    container.addEventListener('mousemove', handleMouseMove);

    return () => {
        window.removeEventListener('resize', handleResize);
        container.removeEventListener('mousemove', handleMouseMove);
        cancelAnimationFrame(animationFrameId);
    };
  }, [mappedLocations, smoothVelocity]); // Re-run if velocity changes? No, use Ref for velocity to avoid re-bind. 
  // Actually smoothVelocity.get() works inside the loop.

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
    <section id="travel" className="relative py-24 bg-[#020202] overflow-hidden min-h-[80vh] flex items-center">
        <div className="max-w-7xl mx-auto px-6 md:px-12 w-full h-full">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                <h2 className="text-sm font-mono tracking-widest text-gray-400">GLOBAL CONNECTIONS</h2>
            </div>
            
            <div 
                ref={containerRef}
                className="relative w-full aspect-[4/3] md:aspect-[16/7] border border-white/10 bg-black/40 rounded-xl overflow-hidden backdrop-blur-sm group shadow-[0_0_50px_rgba(0,0,0,0.5)]" 
            >
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-80" />
                
                {/* HTML Overlay for Pins */}
                {projectedPins.map((pin) => {
                    const loc = locations.find(l => l.id === pin.id);
                    if (!loc || pin.opacity === 0) return null;

                    return (
                        <div
                            key={pin.id}
                            className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20"
                            style={{ 
                                left: pin.x, 
                                top: pin.y,
                                opacity: pin.opacity 
                            }}
                        >
                            <motion.button
                                onClick={() => {
                                    setSelectedLocation(loc);
                                    setActiveImageIndex(0);
                                }}
                                className="relative group/pin"
                                whileHover={{ scale: 1.2 }}
                            >
                                <div className="w-3 h-3 bg-yellow-500 rounded-full shadow-[0_0_15px_#eab308]"></div>
                                <div className="absolute inset-0 bg-yellow-500 rounded-full animate-ping opacity-50"></div>
                                
                                {/* Connecting Line to text */}
                                <motion.div 
                                    className="absolute left-4 top-1/2 w-8 h-[1px] bg-white/30 origin-left"
                                    initial={{ scaleX: 0 }}
                                    whileInView={{ scaleX: 1 }}
                                />
                                
                                {/* Label */}
                                <div className="absolute left-14 top-1/2 -translate-y-1/2 whitespace-nowrap">
                                    <div className="bg-black/80 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-sm text-[10px] tracking-widest uppercase text-white font-mono flex items-center gap-2">
                                        {loc.name}
                                        <Globe size={10} className="text-gray-500"/>
                                    </div>
                                </div>
                            </motion.button>
                        </div>
                    );
                })}

                {/* HUD Elements */}
                <div className="absolute top-6 right-6 flex flex-col items-end gap-1 opacity-50 pointer-events-none">
                    <div className="flex gap-1">
                        <div className="w-16 h-[2px] bg-green-500/50"></div>
                        <div className="w-2 h-[2px] bg-green-500/50"></div>
                    </div>
                    <div className="text-[10px] font-mono text-green-500">SYSTEM.ORBITAL_VIEW</div>
                </div>

                <div className="absolute bottom-6 left-6 text-xs text-gray-600 font-mono pointer-events-none">
                    // SCROLL TO ACCELERATE ROTATION<br/>
                    // INTERACT WITH NODES
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