import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, X, Globe, Maximize2, Calendar, ArrowLeft, Crosshair } from 'lucide-react';
import { TravelLocation } from '../types';

// --- MATH & COORDINATE CORRECTION HELPERS ---

// Lat/Lon to 3D Vector on Sphere
function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  // Guard against NaN
  if (typeof lat !== 'number' || isNaN(lat)) lat = 0;
  if (typeof lon !== 'number' || isNaN(lon)) lon = 0;

  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = (radius * Math.sin(phi) * Math.sin(theta));
  const y = (radius * Math.cos(phi));
  return new THREE.Vector3(x, y, z);
}

// --- COMPONENT ---

interface WorldMapProps {
  locations?: TravelLocation[];
}

const WorldMap: React.FC<WorldMapProps> = ({ locations = [] }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const globeRef = useRef<THREE.Group | null>(null);
  
  // Data State
  const [geoData, setGeoData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingText, setLoadingText] = useState("Initializing Systems...");
  
  // UI Interaction State
  const [selectedLocation, setSelectedLocation] = useState<TravelLocation | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  
  // Camera Animation Helpers
  const flyToPosition = (targetPos: THREE.Vector3, distance = 25) => {
    if (!cameraRef.current || !controlsRef.current) return;
    
    controlsRef.current.autoRotate = false;
    
    // Normalize direction and scale to desired distance
    const finalPos = targetPos.clone().normalize().multiplyScalar(distance);

    const startPos = cameraRef.current.position.clone();
    const startTime = Date.now();
    const duration = 1200;

    const animateFly = () => {
        const now = Date.now();
        const p = Math.min((now - startTime) / duration, 1);
        const ease = 1 - Math.pow(1 - p, 3); // Cubic ease out
        
        cameraRef.current?.position.copy(startPos).lerp(finalPos, ease);
        cameraRef.current?.lookAt(0, 0, 0);

        if (p < 1) requestAnimationFrame(animateFly);
        else {
            if (controlsRef.current) controlsRef.current.enabled = true;
        }
    };
    animateFly();
  };

  const resetCamera = () => {
      if (!cameraRef.current || !controlsRef.current) return;
      controlsRef.current.autoRotate = true;
      // Fly back to a general view
      flyToPosition(new THREE.Vector3(0, 20, 45), 50);
  };

  const handleLocationSelect = (loc: TravelLocation) => {
      setSelectedLocation(loc);
      const pos = latLonToVector3(loc.lat, loc.lng, 10.2); // Target surface
      flyToPosition(pos, 28); // Fly to zoom distance
  };

  // --- INITIALIZATION ---
  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Scene Setup
    const width = containerRef.current.offsetWidth;
    const height = containerRef.current.offsetHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);
    scene.fog = new THREE.FogExp2(0x050505, 0.002);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 20, 45); // Initial view
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = false;
    controls.minDistance = 12;
    controls.maxDistance = 60;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;
    controlsRef.current = controls;

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); 
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(50, 50, 50);
    scene.add(pointLight);

    // 3. Globe Group
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);
    globeRef.current = globeGroup;

    // 4. Base Sphere (Ocean)
    // We enhance the texture visibility so even if vector data fails, it looks like a tech globe
    const textureCanvas = document.createElement('canvas');
    textureCanvas.width = 2048;
    textureCanvas.height = 1024;
    const ctx = textureCanvas.getContext('2d');
    
    if (ctx) {
        // Dark background
        ctx.fillStyle = '#050505';
        ctx.fillRect(0, 0, 2048, 1024);
        
        // Brighter grid lines for "wireframe" feel
        ctx.strokeStyle = '#222222'; 
        ctx.lineWidth = 2;

        // Longitude
        for(let i = 0; i < 2048; i+=64) {
            ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 1024); ctx.stroke();
        }
        // Latitude
        for(let j = 0; j < 1024; j+=64) {
             ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(2048, j); ctx.stroke();
        }

        // Add some random "data" dots to make it look active
        ctx.fillStyle = '#1a1a1a';
        for(let k=0; k<500; k++) {
            const rx = Math.random() * 2048;
            const ry = Math.random() * 1024;
            ctx.fillRect(rx, ry, 4, 4);
        }
    }

    const sphereTexture = new THREE.CanvasTexture(textureCanvas);
    const sphereGeometry = new THREE.SphereGeometry(10, 64, 64);
    const sphereMaterial = new THREE.MeshPhongMaterial({
        map: sphereTexture,
        color: 0x111111,
        specular: 0x222222,
        shininess: 15,
        transparent: true,
        opacity: 0.95
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    globeGroup.add(sphere);

    // 5. Atmosphere Glow
    const haloGeometry = new THREE.SphereGeometry(10.2, 64, 64);
    const haloMaterial = new THREE.ShaderMaterial({
        uniforms: {
            c: { value: 0.5 },
            p: { value: 4.0 },
            glowColor: { value: new THREE.Color(0x22c55e) },
            viewVector: { value: new THREE.Vector3(0, 0, 0) }
        },
        vertexShader: `
            uniform vec3 viewVector;
            uniform float c;
            uniform float p;
            varying float intensity;
            void main() {
                vec3 vNormal = normalize(normalMatrix * normal);
                vec3 vNormel = normalize(normalMatrix * viewVector);
                intensity = pow(c - dot(vNormal, vNormel), p);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 glowColor;
            varying float intensity;
            void main() {
                vec3 glow = glowColor * intensity;
                gl_FragColor = vec4(glow, 1.0);
            }
        `,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true
    });
    const halo = new THREE.Mesh(haloGeometry, haloMaterial);
    scene.add(halo);

    // --- ANIMATION LOOP ---
    const animate = () => {
        requestAnimationFrame(animate);
        if (controlsRef.current) controlsRef.current.update();
        if (cameraRef.current && haloMaterial) {
            haloMaterial.uniforms.viewVector.value = new THREE.Vector3().subVectors(cameraRef.current.position, halo.position);
        }
        if (rendererRef.current && sceneRef.current && cameraRef.current) {
            rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
    };
    animate();

    return () => {
        if (containerRef.current && rendererRef.current) {
            containerRef.current.removeChild(rendererRef.current.domElement);
            rendererRef.current.dispose();
        }
    };
  }, []);

  // --- INTERACTION: Raycaster for Markers ---
  useEffect(() => {
    const handleMouseClick = (event: MouseEvent) => {
        if (!containerRef.current || !cameraRef.current || !globeRef.current) return;
        
        // Don't trigger if clicking on UI overlay
        if ((event.target as HTMLElement).closest('.ui-layer')) return;

        const rect = containerRef.current.getBoundingClientRect();
        const mouse = new THREE.Vector2(
            ((event.clientX - rect.left) / rect.width) * 2 - 1,
            -((event.clientY - rect.top) / rect.height) * 2 + 1
        );

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, cameraRef.current);

        const sprites: THREE.Object3D[] = [];
        globeRef.current.traverse((child) => {
            if (child.type === 'Sprite') sprites.push(child);
        });

        const intersects = raycaster.intersectObjects(sprites);
        if (intersects.length > 0) {
            const object = intersects[0].object;
            const locId = object.userData.locationId;
            const location = locations.find(l => l.id === locId);
            
            if (location) {
                handleLocationSelect(location);
            }
        }
    };

    containerRef.current?.addEventListener('click', handleMouseClick);
    return () => containerRef.current?.removeEventListener('click', handleMouseClick);
  }, [locations]);

  // --- DATA LOADING ---
  useEffect(() => {
    const fetchWithRetry = async (url: string, retries = 2): Promise<any> => {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            if (retries > 0) {
                await new Promise(resolve => setTimeout(resolve, 1500));
                return fetchWithRetry(url, retries - 1);
            }
            throw error;
        }
    };

    const loadGeoData = async () => {
        try {
            setLoadingText("Downloading Vector Data...");
            // Use a highly reliable standard GeoJSON source to avoid 404/CORS issues
            const worldJson = await fetchWithRetry('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson');
            
            setGeoData(worldJson.features);
            setLoadingText("Constructing 3D Geometry...");
            drawMap(worldJson.features);
            setIsLoading(false);
        } catch (error) {
            console.error("Failed to load map data:", error);
            setLoadingText("Vector data unavailable. Switching to Satellite Mode.");
            setTimeout(() => setIsLoading(false), 1500);
        }
    };

    loadGeoData();
  }, []);

  // --- RENDER LOCATIONS ---
  useEffect(() => {
    if (locations.length > 0 && globeRef.current) {
        // Remove old sprites if any (simple cleanup)
        // Note: In production we might want smarter updates, but this ensures no duplicates
        globeRef.current.children.forEach(child => {
            if (child.type === 'Sprite' || child.type === 'Line') {
                // Keep the map lines (which are Line, but have specific material). 
                // We'll just assume lines added here are markers for now or differentiate by userData.
                if (child.userData.locationId) {
                    child.visible = false; // crude removal for now, ideally remove from parent
                }
            }
        });

        locations.forEach(loc => {
            let lat = loc.lat;
            let lon = loc.lng;
            
            if ((lat === undefined || isNaN(lat)) && loc.x !== undefined) {
               lon = (loc.x / 100) * 360 - 180;
               lat = 90 - (loc.y / 100) * 180;
            }
            if (isNaN(lat) || isNaN(lon)) return;

            const pos = latLonToVector3(lat, lon, 10.2); // Marker floats slightly above
            if (isNaN(pos.x) || isNaN(pos.y) || isNaN(pos.z)) return;

            const texture = new THREE.TextureLoader().load(loc.images[0] || 'https://via.placeholder.com/64');
            const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
            const sprite = new THREE.Sprite(material);
            sprite.position.copy(pos);
            sprite.scale.set(1.5, 1.5, 1.5);
            sprite.userData = { locationId: loc.id }; 
            
            const lineGeo = new THREE.BufferGeometry().setFromPoints([
                pos.clone().normalize().multiplyScalar(10),
                pos
            ]);
            const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0x4ade80, transparent: true, opacity: 0.5 }));
            line.userData = { locationId: loc.id };
            
            globeRef.current?.add(sprite);
            globeRef.current?.add(line);
        });
    }
  }, [locations, isLoading]); 

  const drawMap = (features: any[]) => {
      if (!globeRef.current) return;
      // CRITICAL FIX: Radius set to 10.05 to prevent Z-fighting with the 10.0 sphere
      const radius = 10.05;
      const material = new THREE.LineBasicMaterial({ color: 0x4ade80, transparent: true, opacity: 0.35 });
      
      const lineGroup = new THREE.Group();

      features.forEach((feature) => {
          const { geometry } = feature;
          if (!geometry) return;
          const coords = geometry.coordinates;

          const drawRing = (ring: any[]) => {
              const points: THREE.Vector3[] = [];
              ring.forEach((coord: [number, number]) => {
                  if (Array.isArray(coord) && coord.length >= 2 && !isNaN(coord[0]) && !isNaN(coord[1])) {
                      const vec = latLonToVector3(coord[1], coord[0], radius);
                      if (!isNaN(vec.x)) points.push(vec);
                  }
              });
              
              if (points.length > 0) {
                  const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
                  const line = new THREE.Line(lineGeometry, material);
                  lineGroup.add(line);
              }
          };

          if (geometry.type === 'Polygon') {
              coords.forEach((ring: any) => drawRing(ring));
          } else if (geometry.type === 'MultiPolygon') {
              coords.forEach((poly: any) => poly.forEach((ring: any) => drawRing(ring)));
          }
      });
      
      globeRef.current.add(lineGroup);
  };

  return (
    <section id="travel" className="relative w-full h-screen bg-[#050505] overflow-hidden">
        
        {/* 3D Container */}
        <div ref={containerRef} className="absolute inset-0 z-0 cursor-move" />

        {/* Loading Overlay */}
        <AnimatePresence>
            {isLoading && (
                <motion.div 
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 bg-[#050505] flex flex-col items-center justify-center"
                >
                    <div className="w-64 h-1 bg-gray-800 rounded-full overflow-hidden mb-4">
                        <motion.div 
                            className="h-full bg-green-500"
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                    </div>
                    <p className="text-green-500 font-mono text-xs tracking-widest">{loadingText}</p>
                </motion.div>
            )}
        </AnimatePresence>

        {/* --- UI LAYER --- */}
        <div className="ui-layer absolute inset-0 pointer-events-none">
            
            {/* LEFT PANEL: Logged Locations */}
            <motion.div 
                className="absolute left-6 top-24 bottom-6 w-80 pointer-events-auto flex flex-col gap-4"
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
            >
                <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex-1 flex flex-col shadow-2xl relative overflow-hidden">
                    <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
                        <Globe size={18} className="text-green-500"/>
                        Global Footprint
                    </h2>
                    <p className="text-xs text-gray-500 mb-6 font-mono">WGS-84 SYSTEM</p>

                    <AnimatePresence mode="wait">
                        {selectedLocation ? (
                            // LOCATION DETAIL CARD
                            <motion.div 
                                key="location"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex-1 flex flex-col"
                            >
                                <button 
                                    onClick={() => { setSelectedLocation(null); resetCamera(); }}
                                    className="flex items-center gap-2 text-xs text-gray-400 hover:text-white mb-4 transition-colors group"
                                >
                                    <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" />
                                    RETURN TO ORBIT
                                </button>

                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-2xl font-bold text-white leading-none">{selectedLocation.name}</h3>
                                </div>
                                
                                <div className="flex items-center gap-2 text-green-400 font-mono text-xs mb-4">
                                    <Calendar size={12} />
                                    <span>{selectedLocation.date}</span>
                                    <span className="text-gray-600">|</span>
                                    <MapPin size={12} />
                                    <span>{selectedLocation.lat.toFixed(2)}, {selectedLocation.lng.toFixed(2)}</span>
                                </div>

                                <p className="text-gray-300 text-sm leading-relaxed mb-6 border-l-2 border-green-500/50 pl-3">
                                    {selectedLocation.description || "No data logged for this sector."}
                                </p>

                                <div className="grid grid-cols-2 gap-2 mt-auto">
                                    {selectedLocation.images.map((img, i) => (
                                        <div 
                                            key={i} 
                                            className="group relative aspect-video bg-gray-800 rounded overflow-hidden cursor-zoom-in border border-white/10 hover:border-white/50 transition-all"
                                            onClick={() => setLightboxImage(img)}
                                        >
                                            <img src={img} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="travel" />
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity">
                                                <Maximize2 size={16} className="text-white" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        ) : (
                            // LOG LIST VIEW
                            <motion.div 
                                key="list"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="flex-1 flex flex-col overflow-hidden"
                            >
                                <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-3 border-b border-white/10 pb-2">Mission Log</div>
                                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2">
                                    {locations.map((loc) => (
                                        <div 
                                            key={loc.id}
                                            onClick={() => handleLocationSelect(loc)}
                                            className="p-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-green-500/30 rounded cursor-pointer transition-all group"
                                        >
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-bold text-sm text-gray-200 group-hover:text-white">{loc.name}</span>
                                                <Crosshair size={12} className="text-gray-600 group-hover:text-green-500" />
                                            </div>
                                            <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono">
                                                <span>{loc.date}</span>
                                                <span>{loc.lat.toFixed(1)}, {loc.lng.toFixed(1)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

            {/* RIGHT PANEL: Stats (Only show if no location selected to avoid clutter) */}
            {!selectedLocation && (
                <motion.div 
                    className="absolute right-6 top-24 w-64 pointer-events-auto"
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.7 }}
                >
                    <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                        <h3 className="text-xs font-mono text-gray-500 tracking-widest uppercase mb-4">Database</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-300">Logged Locations</span>
                                <span className="text-xl font-bold font-mono text-white">{locations.length}</span>
                            </div>
                            <div className="h-[1px] bg-white/10 my-2"></div>
                            <div className="text-[10px] text-gray-600 leading-relaxed">
                                <span className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                    System Online
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>

        {/* --- FULL SCREEN LIGHTBOX --- */}
        <AnimatePresence>
            {lightboxImage && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 md:p-12 cursor-zoom-out"
                    onClick={() => setLightboxImage(null)}
                >
                    <motion.img 
                        src={lightboxImage} 
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0.9 }}
                        className="max-w-full max-h-full object-contain rounded shadow-2xl border border-white/10"
                        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking image
                    />
                    <button 
                        onClick={() => setLightboxImage(null)}
                        className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/50 text-sm font-mono tracking-widest">
                        IMAGE_PREVIEW_MODE
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

    </section>
  );
};

export default WorldMap;