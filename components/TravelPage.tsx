import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MapPin, Calendar, Maximize2, X, Navigation, ZoomIn } from 'lucide-react';
import { TravelLocation } from '../types';

interface TravelPageProps {
  locations: TravelLocation[];
  onBack: () => void;
}

const TravelPage: React.FC<TravelPageProps> = ({ locations, onBack }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedLocation, setSelectedLocation] = useState<TravelLocation | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isGlobeReady, setIsGlobeReady] = useState(false);
  
  // Refs for animation control
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const globeGroupRef = useRef<THREE.Group | null>(null);
  const cloudsRef = useRef<THREE.Mesh | null>(null);
  const auroraRef = useRef<THREE.Mesh | null>(null);

  // Helper: Lat/Lon to Vector3
  const latLonToVector3 = (lat: number, lon: number, radius: number) => {
    // Guard against NaN
    if (isNaN(lat)) lat = 0;
    if (isNaN(lon)) lon = 0;

    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = (radius * Math.sin(phi) * Math.sin(theta));
    const y = (radius * Math.cos(phi));
    return new THREE.Vector3(x, y, z);
  };

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Setup Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000); // Pure black for space contrast
    scene.fog = new THREE.FogExp2(0x000000, 0.002);
    sceneRef.current = scene;

    const width = window.innerWidth;
    const height = window.innerHeight;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 30, 65);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    containerRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 25;
    controls.maxDistance = 150;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;
    controls.enablePan = false;
    controlsRef.current = controls;

    // 2. Lighting (Sunlight)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2); // Low ambient for contrast
    scene.add(ambientLight);
    
    const sunLight = new THREE.DirectionalLight(0xffffff, 2.0);
    sunLight.position.set(50, 20, 50); // Angle the sun
    scene.add(sunLight);

    // 3. Globe Group
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);
    globeGroupRef.current = globeGroup;

    // --- REALISTIC EARTH TEXTURES ---
    const textureLoader = new THREE.TextureLoader();
    const earthMap = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg');
    const earthSpecular = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg');
    const earthNormal = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_normal_2048.jpg');
    const cloudMap = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png');

    // Earth Sphere
    const earthGeo = new THREE.SphereGeometry(15, 64, 64);
    const earthMat = new THREE.MeshPhongMaterial({
        map: earthMap,
        specularMap: earthSpecular,
        normalMap: earthNormal,
        specular: new THREE.Color(0x333333),
        shininess: 15
    });
    const earth = new THREE.Mesh(earthGeo, earthMat);
    globeGroup.add(earth);

    // Cloud Layer
    const cloudGeo = new THREE.SphereGeometry(15.2, 64, 64);
    const cloudMat = new THREE.MeshPhongMaterial({
        map: cloudMap,
        side: THREE.DoubleSide,
        opacity: 0.8,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });
    const clouds = new THREE.Mesh(cloudGeo, cloudMat);
    globeGroup.add(clouds);
    cloudsRef.current = clouds;

    // Atmosphere Glow Shader
    const atmosphereGeo = new THREE.SphereGeometry(15.5, 64, 64);
    const atmosphereMat = new THREE.ShaderMaterial({
        uniforms: {
            viewVector: { value: new THREE.Vector3() },
            color: { value: new THREE.Color(0x4ca1ff) } // Blueish atmosphere
        },
        vertexShader: `
            uniform vec3 viewVector;
            varying float intensity;
            void main() {
                vec3 vNormal = normalize(normalMatrix * normal);
                vec3 vNormel = normalize(normalMatrix * viewVector);
                intensity = pow(0.7 - dot(vNormal, vNormel), 4.5);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 color;
            varying float intensity;
            void main() {
                gl_FragColor = vec4(color, intensity);
            }
        `,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false
    });
    const atmosphere = new THREE.Mesh(atmosphereGeo, atmosphereMat);
    scene.add(atmosphere);

    // 4. Aurora Borealis Effect
    // Simulated using a distorted ring/cylinder geometry with a custom shader
    const auroraGeo = new THREE.CylinderGeometry(16, 16, 6, 64, 8, true);
    // Displace vertices to make it wavy
    const pos = auroraGeo.attributes.position;
    for(let i=0; i < pos.count; i++){
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        // Add some noise based on angle
        const angle = Math.atan2(z, x);
        const rOffset = Math.sin(angle * 5) * 1.5 + Math.cos(angle * 3) * 1.5;
        
        // Apply offset to make it jagged
        const dist = Math.sqrt(x*x + z*z);
        if (dist > 0.001) {
            const scale = (dist + rOffset) / dist;
            pos.setX(i, x * scale);
            pos.setZ(i, z * scale);
        }
    }
    auroraGeo.computeVertexNormals();
    
    const auroraMat = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 },
            color1: { value: new THREE.Color(0x00ffaa) },
            color2: { value: new THREE.Color(0x8800ff) }
        },
        vertexShader: `
            varying vec2 vUv;
            varying float vHeight;
            uniform float time;
            void main() {
                vUv = uv;
                vec3 newPos = position;
                // Wavy movement
                float wave = sin(position.x * 0.2 + time) * 1.0 + cos(position.z * 0.3 + time * 0.8) * 1.0;
                newPos.y += wave;
                vHeight = uv.y;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 color1;
            uniform vec3 color2;
            uniform float time;
            varying vec2 vUv;
            varying float vHeight;
            void main() {
                // Gradient color
                vec3 color = mix(color1, color2, sin(vUv.x * 10.0 + time) * 0.5 + 0.5);
                // Vertical fade
                float alpha = sin(vHeight * 3.14159) * 0.6;
                // Add banding
                float bands = sin(vUv.y * 20.0 + time * 2.0) * 0.2 + 0.8;
                gl_FragColor = vec4(color, alpha * bands);
            }
        `,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false
    });
    
    const aurora = new THREE.Mesh(auroraGeo, auroraMat);
    aurora.position.y = 15; // North pole
    globeGroup.add(aurora);
    auroraRef.current = aurora;

    // 5. Stars
    const starsGeo = new THREE.BufferGeometry();
    const starsCount = 3000;
    const starPos = new Float32Array(starsCount * 3);
    for(let i=0; i<starsCount*3; i++) {
        starPos[i] = (Math.random() - 0.5) * 600;
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starsMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5, transparent: true, opacity: 0.8 });
    const stars = new THREE.Points(starsGeo, starsMat);
    scene.add(stars);

    setIsGlobeReady(true);

    // Animation Loop
    const animate = () => {
        requestAnimationFrame(animate);
        
        if (controlsRef.current) controlsRef.current.update();
        
        // Update atmosphere shader vector
        if (cameraRef.current) {
            atmosphereMat.uniforms.viewVector.value.subVectors(cameraRef.current.position, atmosphere.position);
        }

        // Animate Aurora
        if (auroraRef.current) {
            (auroraRef.current.material as THREE.ShaderMaterial).uniforms.time.value = performance.now() / 1000;
        }
        
        // Rotate Clouds slightly faster than earth
        if (cloudsRef.current) {
            cloudsRef.current.rotation.y += 0.0005;
        }

        renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
        window.removeEventListener('resize', handleResize);
        if (containerRef.current) containerRef.current.innerHTML = '';
        renderer.dispose();
    };
  }, []);

  // --- INTERACTION: Raycaster for 3D Markers ---
  useEffect(() => {
    const handleMouseClick = (event: MouseEvent) => {
        if (!containerRef.current || !cameraRef.current || !globeGroupRef.current) return;
        
        // Only trigger if not clicking on UI panels
        if ((event.target as HTMLElement).closest('.ui-panel')) return;

        const rect = containerRef.current.getBoundingClientRect();
        const mouse = new THREE.Vector2(
            ((event.clientX - rect.left) / rect.width) * 2 - 1,
            -((event.clientY - rect.top) / rect.height) * 2 + 1
        );

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, cameraRef.current);

        // Recursive intersect to hit sprites or marker parts
        const intersects = raycaster.intersectObjects(globeGroupRef.current.children, true);
        
        // Find first hit that has our location data
        const hit = intersects.find(i => i.object.userData && i.object.userData.locationId);
        
        if (hit) {
            const locId = hit.object.userData.locationId;
            const loc = locations.find(l => l.id === locId);
            if (loc) {
                handleLocationClick(loc);
            }
        }
    };

    const el = containerRef.current;
    if (el) el.addEventListener('click', handleMouseClick);
    return () => {
        if (el) el.removeEventListener('click', handleMouseClick);
    };
  }, [locations, isGlobeReady]);

  // --- ADD LOCATIONS MARKERS ---
  useEffect(() => {
    if (!isGlobeReady || !globeGroupRef.current) return;

    // Clear previous markers
    const group = globeGroupRef.current;
    const markerGroup = new THREE.Group();
    group.add(markerGroup);

    locations.forEach(loc => {
        const pos = latLonToVector3(loc.lat, loc.lng, 15.1); // Slightly above surface
        
        if (isNaN(pos.x) || isNaN(pos.y) || isNaN(pos.z)) return; // Skip invalid

        // Marker Stick
        const stickGeo = new THREE.CylinderGeometry(0.05, 0.05, 4, 8);
        stickGeo.translate(0, 2, 0); // Pivot at base
        stickGeo.rotateX(Math.PI / 2);
        const stickMat = new THREE.MeshBasicMaterial({ color: 0x4ade80, opacity: 0.8, transparent: true });
        const stick = new THREE.Mesh(stickGeo, stickMat);
        stick.lookAt(pos);
        stick.position.copy(pos); 
        stick.userData = { locationId: loc.id }; // For Raycasting
        
        // Align stick
        const quaternion = new THREE.Quaternion();
        quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pos.clone().normalize());
        stick.setRotationFromQuaternion(quaternion);

        // Thumbnail (Sprite)
        if (loc.images.length > 0) {
            const map = new THREE.TextureLoader().load(loc.images[0]);
            const spriteMat = new THREE.SpriteMaterial({ map: map, transparent: true });
            const sprite = new THREE.Sprite(spriteMat);
            
            // Position sprite at tip of stick
            const tipPos = pos.clone().normalize().multiplyScalar(19);
            sprite.position.copy(tipPos);
            sprite.scale.set(3.5, 2.3, 1);
            sprite.userData = { locationId: loc.id }; // For Raycasting
            
            markerGroup.add(stick);
            markerGroup.add(sprite);
        }
    });

    return () => {
        group.remove(markerGroup);
    };
  }, [locations, isGlobeReady]);

  // --- INTERACTION ---
  const handleLocationClick = (loc: TravelLocation) => {
    setSelectedLocation(loc);
    if (controlsRef.current && cameraRef.current) {
        controlsRef.current.autoRotate = false;
        
        // Calculate a nice viewing position
        const locVec = latLonToVector3(loc.lat, loc.lng, 1);
        const targetPos = locVec.clone().multiplyScalar(35); 
        
        const startPos = cameraRef.current.position.clone();
        const startTime = Date.now();
        const duration = 1500;

        const animateCam = () => {
            const now = Date.now();
            const p = Math.min((now - startTime) / duration, 1);
            const ease = 1 - Math.pow(1 - p, 3);
            
            cameraRef.current?.position.copy(startPos).lerp(targetPos, ease);
            cameraRef.current?.lookAt(0,0,0);
            
            if (p < 1) requestAnimationFrame(animateCam);
            else controlsRef.current!.enabled = true;
        };
        animateCam();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
        {/* 3D Canvas */}
        <div ref={containerRef} className="absolute inset-0 z-0 cursor-move" />

        {/* UI Overlay */}
        <div className="absolute inset-0 z-10 pointer-events-none flex">
            
            {/* Sidebar (Left) */}
            <motion.div 
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="w-80 h-full p-6 flex flex-col pointer-events-auto bg-gradient-to-r from-black/80 via-black/40 to-transparent backdrop-blur-sm ui-panel"
            >
                {/* Header */}
                <div className="mb-8 mt-4">
                    <button 
                        onClick={onBack}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 group"
                    >
                        <div className="p-2 border border-white/20 rounded-full group-hover:bg-white/10">
                             <ArrowLeft size={16} />
                        </div>
                        <span className="text-xs font-mono uppercase tracking-widest">Exit Station</span>
                    </button>
                    <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Travel Log</h1>
                    <div className="w-12 h-1 bg-green-500 mb-2"></div>
                    <p className="text-xs text-gray-400 font-mono">
                        ORBITAL VIEW // LAT: {selectedLocation?.lat.toFixed(2) || '---'} LNG: {selectedLocation?.lng.toFixed(2) || '---'}
                    </p>
                </div>

                {/* Locations List */}
                <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                    {locations.map((loc) => (
                        <motion.div
                            key={loc.id}
                            onClick={() => handleLocationClick(loc)}
                            className={`p-4 border rounded cursor-pointer transition-all duration-300 relative overflow-hidden group
                                ${selectedLocation?.id === loc.id 
                                    ? 'bg-white/10 border-green-500/50 shadow-[0_0_20px_rgba(74,222,128,0.2)]' 
                                    : 'bg-black/40 border-white/10 hover:border-white/30 hover:bg-white/5'
                                }
                            `}
                            whileHover={{ scale: 1.02 }}
                        >
                            {selectedLocation?.id === loc.id && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500"></div>
                            )}
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-white font-medium">{loc.name}</h3>
                                <span className="text-[10px] text-gray-500 font-mono border border-white/10 px-1.5 py-0.5 rounded">{loc.date}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <MapPin size={10} />
                                <span>{loc.lat.toFixed(1)}, {loc.lng.toFixed(1)}</span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* Right Panel / Photo Detail */}
            <div className="flex-1 relative pointer-events-none">
                <AnimatePresence mode="wait">
                    {selectedLocation && (
                        <motion.div
                            key={selectedLocation.id}
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 50 }}
                            className="absolute right-12 top-24 w-80 pointer-events-auto ui-panel"
                        >
                            {/* Detailed Card */}
                            <div className="bg-black/60 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden shadow-2xl relative">
                                {/* Decorative Lines */}
                                <div className="absolute top-0 right-0 w-16 h-16 border-t border-r border-green-500/50 rounded-tr-2xl"></div>
                                <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-white/20 rounded-bl-2xl"></div>
                                
                                {/* Image Carousel (Main) */}
                                <div 
                                    className="relative aspect-video bg-gray-900 group cursor-zoom-in"
                                    onClick={() => setLightboxImage(selectedLocation.images[0])}
                                >
                                    <img 
                                        src={selectedLocation.images[0]} 
                                        alt={selectedLocation.name}
                                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                                    
                                    {/* Hover Overlay Icon */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="w-12 h-12 bg-black/50 backdrop-blur rounded-full flex items-center justify-center border border-white/20">
                                            <ZoomIn size={20} className="text-white" />
                                        </div>
                                    </div>

                                    <div className="absolute bottom-3 left-4">
                                        <p className="text-xs font-mono text-green-400 flex items-center gap-2">
                                            <Navigation size={12} className="rotate-45" />
                                            TARGET_LOCKED
                                        </p>
                                    </div>
                                </div>

                                <div className="p-6">
                                    <h2 className="text-2xl font-bold text-white mb-2">{selectedLocation.name}</h2>
                                    <p className="text-gray-400 text-sm leading-relaxed mb-6">
                                        {selectedLocation.description || "Visual log captured during exploration. Coordinates verified."}
                                    </p>
                                    
                                    <div className="grid grid-cols-3 gap-2">
                                        {selectedLocation.images.map((img, i) => (
                                            <div 
                                                key={i} 
                                                className="aspect-square rounded bg-gray-800 overflow-hidden cursor-pointer hover:ring-2 ring-green-500/50 transition-all group relative"
                                                onClick={() => setLightboxImage(img)}
                                            >
                                                <img src={img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>

        {/* --- FULL SCREEN LIGHTBOX --- */}
        <AnimatePresence>
            {lightboxImage && (
                <motion.div 
                    initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                    animate={{ opacity: 1, backdropFilter: "blur(20px)" }}
                    exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                    className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 md:p-12 cursor-zoom-out"
                    onClick={() => setLightboxImage(null)}
                >
                    <motion.img 
                        src={lightboxImage} 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="max-w-full max-h-[90vh] object-contain rounded shadow-2xl border border-white/10"
                        onClick={(e) => e.stopPropagation()} 
                    />
                    <button 
                        onClick={() => setLightboxImage(null)}
                        className="absolute top-8 right-8 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors backdrop-blur-md"
                    >
                        <X size={24} />
                    </button>
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 text-xs font-mono tracking-widest uppercase bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm border border-white/5">
                        High Res Visuals // Click anywhere to close
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Global Overlay Elements */}
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-black to-transparent pointer-events-none z-20"></div>
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black to-transparent pointer-events-none z-20"></div>
        
        {/* CRT Scanline Effect */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-40 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] bg-repeat"></div>

    </div>
  );
};

export default TravelPage;