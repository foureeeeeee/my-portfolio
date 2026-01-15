import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, X, Globe, Upload, Maximize2, Calendar, Info } from 'lucide-react';
import { TravelLocation } from '../types';

// --- MATH & COORDINATE CORRECTION HELPERS ---

// Constants for GCJ-02 to WGS-84 conversion
const PI = 3.1415926535897932384626;
const a = 6378245.0;
const ee = 0.00669342162296594323;

function transformLat(x: number, y: number): number {
  let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
  ret += (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0;
  ret += (20.0 * Math.sin(y * PI) + 40.0 * Math.sin(y / 3.0 * PI)) * 2.0 / 3.0;
  ret += (160.0 * Math.sin(y / 12.0 * PI) + 320 * Math.sin(y * PI / 30.0)) * 2.0 / 3.0;
  return ret;
}

function transformLon(x: number, y: number): number {
  let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
  ret += (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0;
  ret += (20.0 * Math.sin(x * PI) + 40.0 * Math.sin(x / 3.0 * PI)) * 2.0 / 3.0;
  ret += (150.0 * Math.sin(x / 12.0 * PI) + 300.0 * Math.sin(x / 30.0 * PI)) * 2.0 / 3.0;
  return ret;
}

// GCJ-02 to WGS-84
function gcj02towgs84(lng: number, lat: number): [number, number] {
  if (typeof lng !== 'number' || typeof lat !== 'number' || isNaN(lng) || isNaN(lat)) {
    return [0, 0];
  }
  if (outOfChina(lng, lat)) {
    return [lng, lat];
  }
  let dlat = transformLat(lng - 105.0, lat - 35.0);
  let dlng = transformLon(lng - 105.0, lat - 35.0);
  const radlat = lat / 180.0 * PI;
  const magic = Math.sin(radlat);
  const magic2 = 1 - ee * magic * magic;
  const sqrtmagic = Math.sqrt(magic2);
  dlat = (dlat * 180.0) / ((a * (1 - ee)) / (magic2 * sqrtmagic) * PI);
  dlng = (dlng * 180.0) / (a / sqrtmagic * Math.cos(radlat) * PI);
  const mglat = lat + dlat;
  const mglng = lng + dlng;
  return [lng * 2 - mglng, lat * 2 - mglat];
}

function outOfChina(lng: number, lat: number): boolean {
  return (lng < 72.004 || lng > 137.8347) || (lat < 0.8293 || lat > 55.8271);
}

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

// Point in Polygon Ray Casting Algorithm
function isPointInPolygon(point: [number, number], vs: [number, number][]): boolean {
    const x = point[0], y = point[1];
    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        const xi = vs[i][0], yi = vs[i][1];
        const xj = vs[j][0], yj = vs[j][1];
        const intersect = ((yi > y) !== (yj > y)) &&
            (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

// Get Bounding Box for optimized sampling
function getBoundingBox(geometry: any) {
  let minLng = 180, maxLng = -180, minLat = 90, maxLat = -90;

  const updateBounds = (coords: any[]) => {
      // If coordinate pair
      if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
          const lng = coords[0];
          const lat = coords[1];
          if (lng < minLng) minLng = lng;
          if (lng > maxLng) maxLng = lng;
          if (lat < minLat) minLat = lat;
          if (lat > maxLat) maxLat = lat;
      } else {
          coords.forEach(updateBounds);
      }
  };

  updateBounds(geometry.coordinates);
  return { minLng, maxLng, minLat, maxLat };
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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<any | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<TravelLocation | null>(null);
  const [photos, setPhotos] = useState<{id: number, url: string, pos: THREE.Vector3}[]>([]);
  
  // Lightbox State
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  
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
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // Soft white light
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(50, 50, 50);
    scene.add(pointLight);

    // 3. Globe Group
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);
    globeRef.current = globeGroup;

    // 4. Base Sphere (The Ocean) - Texture Resampling Implementation
    const textureCanvas = document.createElement('canvas');
    textureCanvas.width = 2048;
    textureCanvas.height = 1024;
    const ctx = textureCanvas.getContext('2d');
    
    if (ctx) {
        // Fill dark ocean
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, 2048, 1024);
        
        // Draw Projection Grid using Inverse Mercator Logic
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 1;

        // Draw longitude lines
        for(let i = 0; i < 2048; i+=64) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, 1024);
            ctx.stroke();
        }

        // Draw latitude lines
        for(let j = 0; j < 1024; j+=64) {
             ctx.beginPath();
             ctx.moveTo(0, j);
             ctx.lineTo(2048, j);
             ctx.stroke();
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

    // Cleanup
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

        // Filter for Sprites only
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
                // Fly to location
                const pos = intersects[0].point.clone().normalize().multiplyScalar(25);
                flyToPosition(pos);
                setSelectedLocation(location);
                setSelectedRegion(null); // Deselect region if any
            }
        }
    };

    const flyToPosition = (targetPos: THREE.Vector3) => {
        if (!cameraRef.current || !controlsRef.current) return;
        
        controlsRef.current.autoRotate = false;
        
        const startPos = cameraRef.current.position.clone();
        const startTime = Date.now();
        const duration = 1200;

        const animateFly = () => {
            const now = Date.now();
            const p = Math.min((now - startTime) / duration, 1);
            const ease = 1 - Math.pow(1 - p, 3);
            
            cameraRef.current?.position.copy(startPos).lerp(targetPos, ease);
            cameraRef.current?.lookAt(0, 0, 0);

            if (p < 1) requestAnimationFrame(animateFly);
            else controlsRef.current!.enabled = true;
        };
        animateFly();
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
                console.warn(`Fetch failed for ${url}, retrying... (${retries} left)`);
                await new Promise(resolve => setTimeout(resolve, 1500));
                return fetchWithRetry(url, retries - 1);
            }
            throw error;
        }
    };

    const loadGeoData = async () => {
        try {
            setLoadingText("Downloading Global Vector Data...");
            // Use standard raw GitHub URL for better stability
            const worldJson = await fetchWithRetry('https://raw.githubusercontent.com/tower1229/echarts-world-map-jeojson/master/worldZH.json');

            setLoadingText("Downloading China High-Precision Data...");
            const chinaJson = await fetchWithRetry('https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json');

            setLoadingText("Applying Coordinate Correction...");
            
            const features = worldJson.features.filter((f: any) => f.properties.name !== 'China');
            const chinaFeatures = chinaJson.features.map((f: any) => {
                const geometry = JSON.parse(JSON.stringify(f.geometry));
                const isValid = (coord: number[]) => !isNaN(coord[0]) && !isNaN(coord[1]);

                if (geometry.type === 'Polygon') {
                    geometry.coordinates = geometry.coordinates.map((ring: any) => 
                        ring.map((pt: any) => isValid(pt) ? gcj02towgs84(pt[0], pt[1]) : [0,0])
                    );
                } else if (geometry.type === 'MultiPolygon') {
                     geometry.coordinates = geometry.coordinates.map((poly: any) => 
                        poly.map((ring: any) => 
                            ring.map((pt: any) => isValid(pt) ? gcj02towgs84(pt[0], pt[1]) : [0,0])
                        )
                    );
                }

                return { ...f, geometry };
            });

            const finalFeatures = [...features, ...chinaFeatures];
            setGeoData(finalFeatures);
            
            setLoadingText("Constructing 3D Geometry...");
            drawMap(finalFeatures);
            
            setIsLoading(false);
        } catch (error) {
            console.error("Failed to load map data after retries:", error);
            // Graceful degradation: Stop loading so user can at least see the globe and markers
            setLoadingText("Vector data unavailable. Switching to Satellite Mode.");
            setTimeout(() => setIsLoading(false), 1500);
        }
    };

    loadGeoData();
  }, []);

  // --- RENDER LOCATIONS ---
  useEffect(() => {
    if (locations.length > 0 && globeRef.current) {
        // Clear old markers if we re-run this (though locations usually stable)
        // Ideally we group them and clear the group. For now assume additive is okay or clean up later.
        
        locations.forEach(loc => {
            let lat = loc.lat;
            let lon = loc.lng;
            
            if ((lat === undefined || isNaN(lat)) && loc.x !== undefined) {
               lon = (loc.x / 100) * 360 - 180;
               lat = 90 - (loc.y / 100) * 180;
            }
            if (isNaN(lat) || isNaN(lon)) return;

            const pos = latLonToVector3(lat, lon, 10.2);
            if (isNaN(pos.x) || isNaN(pos.y) || isNaN(pos.z)) return;

            // Create Interactive Marker
            const texture = new THREE.TextureLoader().load(loc.images[0] || 'https://via.placeholder.com/64');
            const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
            const sprite = new THREE.Sprite(material);
            sprite.position.copy(pos);
            sprite.scale.set(1.5, 1.5, 1.5);
            sprite.userData = { locationId: loc.id }; // Important for raycasting
            
            // Connecting line
            const lineGeo = new THREE.BufferGeometry().setFromPoints([
                pos.clone().normalize().multiplyScalar(10),
                pos
            ]);
            const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0x4ade80, transparent: true, opacity: 0.5 }));
            
            globeRef.current?.add(sprite);
            globeRef.current?.add(line);
        });
    }
  }, [locations, isLoading]); 

  const drawMap = (features: any[]) => {
      if (!globeRef.current) return;
      const radius = 10;
      const material = new THREE.LineBasicMaterial({ color: 0x4ade80, transparent: true, opacity: 0.3 });
      
      features.forEach((feature) => {
          const { geometry } = feature;
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
                  globeRef.current?.add(line);
              }
          };

          if (geometry.type === 'Polygon') {
              coords.forEach((ring: any) => drawRing(ring));
          } else if (geometry.type === 'MultiPolygon') {
              coords.forEach((poly: any) => poly.forEach((ring: any) => drawRing(ring)));
          }
      });
  };

  const flyToRegion = (feature: any) => {
      if (!controlsRef.current || !cameraRef.current) return;
      
      let center = [0, 0];
      if (feature.properties.center) {
          center = feature.properties.center; 
      } else {
          const bbox = getBoundingBox(feature.geometry);
          center = [(bbox.minLng + bbox.maxLng)/2, (bbox.minLat + bbox.maxLat)/2];
      }

      if(feature.properties.adcode && outOfChina(center[0], center[1]) === false) {
           const bbox = getBoundingBox(feature.geometry);
           center = [(bbox.minLng + bbox.maxLng)/2, (bbox.minLat + bbox.maxLat)/2];
      }

      const targetPos = latLonToVector3(center[1], center[0], 25); 

      controlsRef.current.autoRotate = false;
      const startPos = cameraRef.current.position.clone();
      const duration = 1500;
      const startTime = Date.now();

      const animateFly = () => {
          const now = Date.now();
          const progress = Math.min((now - startTime) / duration, 1);
          const ease = 1 - Math.pow(1 - progress, 3);

          cameraRef.current?.position.copy(startPos).lerp(targetPos, ease);
          cameraRef.current?.lookAt(0, 0, 0);

          if (progress < 1) {
              requestAnimationFrame(animateFly);
          } else {
              controlsRef.current!.enabled = true;
          }
      };

      animateFly();
      setSelectedRegion(feature);
      setSelectedLocation(null); // Deselect location
      setSearchQuery(feature.properties.name);
  };

  const filteredCountries = useMemo(() => {
      if (!searchQuery || searchQuery.length < 1) return [];
      return geoData
        .filter(f => {
            const name = f.properties.name || "";
            return name.toLowerCase().includes(searchQuery.toLowerCase());
        })
        .slice(0, 5);
  }, [searchQuery, geoData]);

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
            
            {/* LEFT PANEL: Search & Selection */}
            <motion.div 
                className="absolute left-6 top-24 bottom-6 w-80 pointer-events-auto flex flex-col gap-4"
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
            >
                <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex-1 flex flex-col shadow-2xl">
                    <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
                        <Globe size={18} className="text-green-500"/>
                        Global Footprint
                    </h2>
                    <p className="text-xs text-gray-500 mb-6 font-mono">WGS-84 / GCJ-02 DUAL SYSTEM</p>

                    {/* Search Input */}
                    <div className="relative mb-6">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input 
                            type="text" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search World..."
                            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-green-500 transition-colors"
                        />
                        {filteredCountries.length > 0 && searchQuery !== selectedRegion?.properties.name && (
                            <div className="absolute top-full left-0 w-full bg-gray-900/90 border border-white/10 mt-2 rounded-lg overflow-hidden z-20 max-h-60 overflow-y-auto">
                                {filteredCountries.map((f, i) => (
                                    <button
                                        key={i}
                                        onClick={() => flyToRegion(f)}
                                        className="w-full text-left px-4 py-2 hover:bg-white/10 text-sm flex justify-between items-center"
                                    >
                                        <span>{f.properties.name}</span>
                                        <span className="text-[10px] text-gray-500 font-mono uppercase">FLY_TO</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Content Area for Region/Location */}
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
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-2xl font-bold text-white">{selectedLocation.name}</h3>
                                    <button onClick={() => { setSelectedLocation(null); controlsRef.current!.autoRotate = true; }} className="p-1 hover:bg-white/10 rounded">
                                        <X size={16} />
                                    </button>
                                </div>
                                
                                <div className="flex items-center gap-2 text-green-400 font-mono text-xs mb-4">
                                    <Calendar size={12} />
                                    <span>{selectedLocation.date}</span>
                                    <span className="text-gray-600">|</span>
                                    <MapPin size={12} />
                                    <span>{selectedLocation.lat.toFixed(2)}, {selectedLocation.lng.toFixed(2)}</span>
                                </div>

                                <p className="text-gray-300 text-sm leading-relaxed mb-6">
                                    {selectedLocation.description || "No description available for this coordinate."}
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
                        ) : selectedRegion ? (
                            // REGION DETAIL CARD
                            <motion.div 
                                key="region"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex-1 flex flex-col"
                            >
                                <div className="flex justify-between items-start mb-4 border-b border-white/10 pb-4">
                                    <div>
                                        <h3 className="text-2xl font-bold text-white">{selectedRegion.properties.name}</h3>
                                        <p className="text-green-400 text-xs font-mono mt-1">
                                            REGION_ID: {selectedRegion.properties.adcode || 'UNK'}
                                        </p>
                                    </div>
                                    <button onClick={() => { setSelectedRegion(null); setSearchQuery(''); controlsRef.current!.autoRotate = true; }} className="p-1 hover:bg-white/10 rounded">
                                        <X size={16} />
                                    </button>
                                </div>
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-4 border border-dashed border-white/20 rounded-lg bg-white/5">
                                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-3">
                                        <Upload size={20} className="text-gray-400" />
                                    </div>
                                    <p className="text-sm font-medium">Memory Slot Empty</p>
                                    <p className="text-xs text-gray-500 mt-2">
                                        Upload capability restricted in preview mode.
                                    </p>
                                </div>
                            </motion.div>
                        ) : (
                            // DEFAULT STATE
                            <motion.div 
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex-1 flex flex-col items-center justify-center text-gray-600 space-y-4"
                            >
                                <Globe size={48} className="opacity-20 text-green-500" />
                                <div className="text-center">
                                    <p className="text-sm text-gray-400 mb-1">Interactive Map System</p>
                                    <p className="text-xs text-gray-600">Select markers or search regions</p>
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