import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, X, Sparkles, Image as ImageIcon, Newspaper, Minimize2, Volume2, VolumeX, LayoutList, Grid3X3, ArrowUpRight } from 'lucide-react';
import { Hobby } from '../types';

interface HobbyWorldProps {
  hobbies: Hobby[];
  onBack: () => void;
}

// --- CONFIGURATION ---
const BUBBLE_RADIUS = 3.8;
const ADSORB_RADIUS = 14; 
const ADSORB_FORCE = 0.08;
const MOUSE_INFLUENCE_DRAG = 0.85;
const EXPLOSION_PARTICLE_COUNT = 3000;

// --- AUDIO ENGINE ---
const createAudioController = () => {
    if (typeof window === 'undefined') return null;
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return null;
    
    const ctx = new AudioContext();

    const resume = () => {
        if (ctx.state === 'suspended') ctx.resume();
    };

    const playTone = (freq: number, type: OscillatorType, duration: number, vol: number, glideTo?: number) => {
        resume();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        if (glideTo) {
            osc.frequency.exponentialRampToValueAtTime(glideTo, ctx.currentTime + duration);
        }
        
        gain.gain.setValueAtTime(vol, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
    };

    return {
        hover: () => {
            // High-tech chirp (fast upward sine sweep)
            playTone(600, 'sine', 0.15, 0.08, 1200);
        },
        collision: (impact: number) => {
            // Dull thud for impacts
            // Impact is 0-1 range roughly
            if (impact < 0.05) return;
            const vol = Math.min(impact * 0.4, 0.2); 
            playTone(100 + Math.random() * 50, 'triangle', 0.1, vol);
        },
        explode: () => {
            resume();
            // 1. Low Boom (Sub bass)
            playTone(150, 'sine', 1.5, 0.6, 10);

            // 2. Digital Sparkle (Noise Burst)
            const bufferSize = ctx.sampleRate * 0.5;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
            
            const noise = ctx.createBufferSource();
            noise.buffer = buffer;
            const noiseGain = ctx.createGain();
            noiseGain.gain.setValueAtTime(0.3, ctx.currentTime);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
            noise.connect(noiseGain);
            noiseGain.connect(ctx.destination);
            noise.start();
        },
        close: () => {
             // Reverse suck sound
             playTone(800, 'sine', 0.3, 0.1, 200);
        }
    };
};


// --- SHADERS ---

// Explosion Shaders
const explosionVertexShader = `
uniform float uTime;
uniform float uExplode;
attribute vec3 randomDir;
attribute float scale;
varying vec3 vColor;

void main() {
  vec3 pos = position + randomDir * uExplode * 35.0; // Explosion expansion
  
  // Swirl effect
  float angle = uTime * 1.5;
  float s = sin(angle);
  float c = cos(angle);
  pos.x = pos.x * c - pos.z * s;
  pos.z = pos.x * s + pos.z * c;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  
  // Size attenuation and shrinking
  gl_PointSize = scale * (350.0 / -mvPosition.z) * (1.0 - uExplode * 0.8);
  
  // Color Gradient: White -> Green -> Purple -> Fade
  vec3 col1 = vec3(1.0, 1.0, 1.0);
  vec3 col2 = vec3(0.29, 0.87, 0.5); // Green
  vec3 col3 = vec3(0.66, 0.33, 0.96); // Purple
  
  if(uExplode < 0.3) {
      vColor = mix(col1, col2, uExplode * 3.3);
  } else {
      vColor = mix(col2, col3, (uExplode - 0.3) * 1.4);
  }
}
`;

const explosionFragmentShader = `
varying vec3 vColor;
void main() {
  if (length(gl_PointCoord - vec2(0.5, 0.5)) > 0.5) discard;
  gl_FragColor = vec4(vColor, 1.0);
}
`;

// Heaven Sky Shaders
const heavenVertexShader = `
varying vec2 vUv;
varying vec3 vPosition;
void main() {
  vUv = uv;
  vPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const heavenFragmentShader = `
uniform float uTime;
varying vec2 vUv;
varying vec3 vPosition;

// Simple Noise
vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
           -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
  + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
    float y = normalize(vPosition).y;
    
    // Heavenly Palette
    // Top: Deep Ethereal Blue
    // Bottom: Soft Warm Haze/Cloud
    vec3 colTop = vec3(0.05, 0.1, 0.35); 
    vec3 colBottom = vec3(0.8, 0.9, 1.0);
    
    // Dynamic Shift
    float shift = sin(uTime * 0.1) * 0.1;
    vec3 bg = mix(colBottom, colTop, smoothstep(-0.4, 0.8 + shift, y));
    
    // Cloud Layer 1 (Slow, Large)
    float n1 = snoise(vUv * 2.0 + vec2(uTime * 0.02, 0.0));
    // Cloud Layer 2 (Fast, Detail)
    float n2 = snoise(vUv * 5.0 + vec2(uTime * 0.05, uTime * 0.01));
    
    float cloud = n1 * 0.6 + n2 * 0.4;
    
    // Cloud Color with subtle gold tint in dense areas
    vec3 cloudCol = vec3(1.0, 1.0, 1.0);
    vec3 goldTint = vec3(1.0, 0.9, 0.7);
    vec3 cColor = mix(cloudCol, goldTint, n2 * 0.5);
    
    // Mix background and clouds
    // Clouds appear more at lower horizon and scattered above
    float cloudDensity = smoothstep(0.3, 0.8, cloud);
    vec3 final = mix(bg, cColor, cloudDensity * 0.4); // 0.4 opacity clouds
    
    gl_FragColor = vec4(final, 1.0);
}
`;


const HobbyWorld: React.FC<HobbyWorldProps> = ({ hobbies, onBack }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // React State for UI
  const [selectedHobby, setSelectedHobby] = useState<Hobby | null>(null);
  const [hoveredHobby, setHoveredHobby] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [viewMode, setViewMode] = useState<'bubbles' | 'list'>('bubbles');
  
  // Refs for 3D Logic & State Mirroring
  const viewModeRef = useRef<'bubbles' | 'list'>('bubbles');
  const selectedHobbyIdRef = useRef<number | null>(null);
  const isExplodedRef = useRef(false);
  
  // Sync state to ref for animation loop
  useEffect(() => {
    viewModeRef.current = viewMode;
  }, [viewMode]);
  
  // Audio Ref
  const audioCtrlRef = useRef<ReturnType<typeof createAudioController>>(null);

  // THREE References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const bubblesRef = useRef<THREE.Group[]>([]);
  const particleSystemRef = useRef<THREE.Points | null>(null);
  
  // Physics State
  const physicsState = useRef<{
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    baseScale: number;
    currentScale: number;
    id: number;
    isHovered: boolean;
    originalGeometry: THREE.BufferAttribute | null;
    lastCollision: number;
  }[]>([]);

  const mouseRef = useRef(new THREE.Vector2(9999, 9999));
  
  const explosionUniforms = useRef({
    uTime: { value: 0 },
    uExplode: { value: 0 }
  });

  const heavenUniforms = useRef({
    uTime: { value: 0 }
  });

  // --- AUDIO INIT ---
  useEffect(() => {
    audioCtrlRef.current = createAudioController();
  }, []);

  // --- 3D SETUP & LOOP ---
  useEffect(() => {
    if (!containerRef.current) return;
    const width = window.innerWidth;
    const height = window.innerHeight;

    // SCENE
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // CAMERA
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 2000);
    camera.position.set(0, 0, 35);
    cameraRef.current = camera;

    // RENDERER
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping; 
    renderer.toneMappingExposure = 1.2;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // --- HEAVEN BACKGROUND ---
    const heavenGeo = new THREE.SphereGeometry(800, 60, 40);
    const heavenMat = new THREE.ShaderMaterial({
        uniforms: heavenUniforms.current,
        vertexShader: heavenVertexShader,
        fragmentShader: heavenFragmentShader,
        side: THREE.BackSide
    });
    const heaven = new THREE.Mesh(heavenGeo, heavenMat);
    scene.add(heaven);

    // --- LIGHTING ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    
    const sunLight = new THREE.DirectionalLight(0xfffaed, 2.0);
    sunLight.position.set(50, 100, 50);
    scene.add(sunLight);

    const rimLightBlue = new THREE.PointLight(0xddeeff, 1.5, 100);
    rimLightBlue.position.set(-20, -10, 20);
    scene.add(rimLightBlue);
    
    const rimLightGold = new THREE.PointLight(0xffddaa, 1.5, 100);
    rimLightGold.position.set(20, 10, 20);
    scene.add(rimLightGold);

    // EXPLOSION PARTICLES
    const particlesGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(EXPLOSION_PARTICLE_COUNT * 3);
    const particleDirs = new Float32Array(EXPLOSION_PARTICLE_COUNT * 3);
    const particleScales = new Float32Array(EXPLOSION_PARTICLE_COUNT);

    for (let i = 0; i < EXPLOSION_PARTICLE_COUNT; i++) {
        particlePositions[i * 3] = 0;
        particlePositions[i * 3 + 1] = 0;
        particlePositions[i * 3 + 2] = 0;

        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = Math.random(); 
        particleDirs[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        particleDirs[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        particleDirs[i * 3 + 2] = r * Math.cos(phi);

        particleScales[i] = Math.random() * 2.0;
    }
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particlesGeo.setAttribute('randomDir', new THREE.BufferAttribute(particleDirs, 3));
    particlesGeo.setAttribute('scale', new THREE.BufferAttribute(particleScales, 1));

    const particleMat = new THREE.ShaderMaterial({
        uniforms: explosionUniforms.current,
        vertexShader: explosionVertexShader,
        fragmentShader: explosionFragmentShader,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });

    const explosionSystem = new THREE.Points(particlesGeo, particleMat);
    explosionSystem.visible = false;
    scene.add(explosionSystem);
    particleSystemRef.current = explosionSystem;

    // BUBBLES
    const loader = new THREE.TextureLoader();
    const bubbleParent = new THREE.Group();
    scene.add(bubbleParent);
    bubblesRef.current = [];
    physicsState.current = [];

    hobbies.forEach((hobby, i) => {
        const group = new THREE.Group();
        const angle = (i / hobbies.length) * Math.PI * 2;
        const radius = 10;
        group.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius * 0.6, (Math.random() - 0.5) * 5);

        physicsState.current.push({
            position: group.position.clone(),
            velocity: new THREE.Vector3(0,0,0),
            baseScale: 1,
            currentScale: 0, 
            id: hobby.id,
            isHovered: false,
            originalGeometry: null,
            lastCollision: 0
        });

        loader.load(hobby.coverImage, (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace;
            const innerSphere = new THREE.Mesh(
                new THREE.SphereGeometry(BUBBLE_RADIUS * 0.9, 32, 32), 
                new THREE.MeshBasicMaterial({ map: texture })
            );
            group.add(innerSphere);
        });

        const geometry = new THREE.SphereGeometry(BUBBLE_RADIUS, 128, 128);
        const originalPosAttr = geometry.attributes.position.clone();
        physicsState.current[i].originalGeometry = originalPosAttr;

        // Crystal Clear Bubble Material
        const material = new THREE.MeshPhysicalMaterial({
            transmission: 1.0,
            thickness: 2.5,
            roughness: 0.05,
            metalness: 0.1,
            clearcoat: 1.0,
            clearcoatRoughness: 0.0,
            color: 0xffffff,
            ior: 1.45,
            transparent: true,
            opacity: 0.1, // Very transparent
            sheen: 0.5,
            sheenColor: 0xffffff
        });
        
        const sphere = new THREE.Mesh(geometry, material);
        sphere.name = "GlassBubble";
        group.add(sphere);

        group.userData = { id: hobby.id };
        bubbleParent.add(group);
        bubblesRef.current.push(group);
    });

    // ANIMATION
    let frameId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
        frameId = requestAnimationFrame(animate);
        const time = clock.getElapsedTime();
        const now = Date.now();
        const exploded = isExplodedRef.current;
        const selectedId = selectedHobbyIdRef.current;
        const isListMode = viewModeRef.current === 'list'; // Check view mode inside loop
        
        // Update Uniforms
        explosionUniforms.current.uTime.value = time;
        heavenUniforms.current.uTime.value = time;
        
        // Update Explosion Logic
        if (exploded) {
            explosionUniforms.current.uExplode.value += (1.0 - explosionUniforms.current.uExplode.value) * 0.05;
        } else {
             explosionUniforms.current.uExplode.value += (0.0 - explosionUniforms.current.uExplode.value) * 0.1;
        }

        bubblesRef.current.forEach((bubble, i) => {
            const state = physicsState.current[i];
            
            // If exploded and selected, hide source bubble immediately
            if (exploded && selectedId === state.id) {
                bubble.visible = false;
                return;
            } else {
                bubble.visible = true;
                
                // --- SCALE LOGIC ---
                // If exploded OR in list mode, shrink bubbles to 0
                if (exploded || isListMode) {
                    state.currentScale += (0 - state.currentScale) * 0.15;
                    bubble.scale.setScalar(state.currentScale);
                    // Skip physics update if essentially invisible to save perf
                    if (state.currentScale < 0.01) return;
                } else {
                     // Grow back to 1 if bubbles mode
                    state.currentScale += (1 - state.currentScale) * 0.05;
                    bubble.scale.setScalar(state.currentScale);
                }
            }

            // --- PHYSICS ENGINE ---
            let isCaptured = false;
            
            // Only calculate mouse influence if NOT in list mode
            if (!isListMode && mouseRef.current.x !== 9999) {
                const vec = new THREE.Vector3(mouseRef.current.x, mouseRef.current.y, 0.5);
                vec.unproject(camera);
                const dir = vec.sub(camera.position).normalize();
                const distance = -camera.position.z / dir.z;
                const mouseWorldPos = camera.position.clone().add(dir.multiplyScalar(distance));
                mouseWorldPos.z = 0; 

                const distToMouse = state.position.distanceTo(mouseWorldPos);

                if (distToMouse < ADSORB_RADIUS) {
                    isCaptured = true;
                    if (!state.isHovered && soundEnabled) {
                        audioCtrlRef.current?.hover();
                    }
                    state.isHovered = true;
                    
                    const t = 1 - (distToMouse / ADSORB_RADIUS);
                    const forceStrength = Math.pow(t, 2) * 0.12; 
                    const dirToMouse = mouseWorldPos.clone().sub(state.position).normalize();
                    state.velocity.add(dirToMouse.multiplyScalar(forceStrength));
                    const friction = 0.97 - (t * 0.12);
                    state.velocity.multiplyScalar(friction);
                } else {
                    state.isHovered = false;
                }
            }

            if (!isCaptured) {
                // Gentle drift
                const centerPull = state.position.clone().multiplyScalar(-0.0008);
                state.velocity.add(centerPull);
                const nX = Math.sin(time * 0.5 + i) * 0.002 + Math.cos(time * 1.2 + i * 0.5) * 0.001;
                const nY = Math.cos(time * 0.4 + i) * 0.002 + Math.sin(time * 1.5 + i * 0.5) * 0.001;
                state.velocity.x += nX;
                state.velocity.y += nY;
                state.velocity.multiplyScalar(0.96);
            }

            // Collision
            physicsState.current.forEach((other, j) => {
                if (i === j) return;
                const diff = state.position.clone().sub(other.position);
                const dist = diff.length();
                const minSeparation = BUBBLE_RADIUS * 2.1; 
                
                if (dist < minSeparation) {
                    const overlap = minSeparation - dist;
                    const repulsionForce = Math.pow(overlap, 1.2) * 0.015;
                    const pushDir = diff.normalize();
                    state.velocity.add(pushDir.multiplyScalar(repulsionForce));
                    state.velocity.multiplyScalar(0.99); 
                    
                    if (soundEnabled && !isListMode && now - state.lastCollision > 150) {
                        const intensity = Math.min(overlap * 2, 1.0);
                        audioCtrlRef.current?.collision(intensity);
                        state.lastCollision = now;
                    }
                }
            });

            state.position.add(state.velocity);
            bubble.position.copy(state.position);

            // Deformation
            const glassMesh = bubble.children.find(c => c.name === "GlassBubble") as THREE.Mesh;
            if (glassMesh && state.originalGeometry) {
                const posAttribute = glassMesh.geometry.attributes.position;
                const originalPos = state.originalGeometry;
                if (state.isHovered || Math.abs(state.currentScale - 1) < 0.1) {
                    const speed = state.velocity.length();
                    const velDir = state.velocity.clone().normalize();
                    if (speed < 0.001) velDir.set(0, 1, 0);

                    for (let k = 0; k < posAttribute.count; k++) {
                        const ox = originalPos.getX(k);
                        const oy = originalPos.getY(k);
                        const oz = originalPos.getZ(k);
                        let tx = ox, ty = oy, tz = oz;
                        if (state.isHovered) {
                            const wobble = Math.sin(time * 8 + ox * 0.4) * Math.cos(time * 7 + oy * 0.4) * 0.08;
                            const dot = (ox * velDir.x + oy * velDir.y + oz * velDir.z) / BUBBLE_RADIUS;
                            const stretch = dot * speed * 6.0; 
                            tx = ox + ox * wobble + velDir.x * stretch;
                            ty = oy + oy * wobble + velDir.y * stretch;
                            tz = oz + oz * wobble + velDir.z * stretch;
                        }
                        const cx = posAttribute.getX(k);
                        const cy = posAttribute.getY(k);
                        const cz = posAttribute.getZ(k);
                        const lerpFactor = 0.15;
                        posAttribute.setXYZ(k, 
                            cx + (tx - cx) * lerpFactor,
                            cy + (ty - cy) * lerpFactor,
                            cz + (tz - cz) * lerpFactor
                        );
                    }
                    posAttribute.needsUpdate = true;
                    glassMesh.geometry.computeVertexNormals();
                }
            }
        });

        renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(frameId);
        if (containerRef.current) containerRef.current.innerHTML = '';
        renderer.dispose();
    };
  }, [hobbies, soundEnabled]); 

  // --- HANDLERS ---
  const handleMouseMove = (e: React.MouseEvent) => {
    // Disable 3D Interaction if in List Mode
    if (viewMode === 'list') {
        setHoveredHobby(null);
        return;
    }

    const nx = (e.clientX / window.innerWidth) * 2 - 1;
    const ny = -(e.clientY / window.innerHeight) * 2 + 1;
    mouseRef.current.set(nx, ny);
    
    if (!cameraRef.current || bubblesRef.current.length === 0) return;
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(nx, ny), cameraRef.current);
    const intersects = raycaster.intersectObjects(bubblesRef.current, true);
    
    if (intersects.length > 0) {
        let obj = intersects[0].object;
        while(obj.parent && obj.parent.type !== 'Scene') {
            if (obj.userData.id) break;
            obj = obj.parent;
        }
        if (obj.userData.id) {
             const hobby = hobbies.find(h => h.id === obj.userData.id);
             setHoveredHobby(hobby ? hobby.name : null);
        }
    } else {
        setHoveredHobby(null);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    // Disable 3D Click if in List Mode
    if (viewMode === 'list') return;

    if (selectedHobbyIdRef.current) return;
    if (!cameraRef.current || bubblesRef.current.length === 0) return;
    const nx = (e.clientX / window.innerWidth) * 2 - 1;
    const ny = -(e.clientY / window.innerHeight) * 2 + 1;
    
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(nx, ny), cameraRef.current);
    const intersects = raycaster.intersectObjects(bubblesRef.current, true);

    if (intersects.length > 0) {
        let obj = intersects[0].object;
         while(obj.parent && obj.parent.type !== 'Scene') {
            if (obj.userData.id) break;
            obj = obj.parent;
        }

        if (obj.userData.id) {
            const hobby = hobbies.find(h => h.id === obj.userData.id);
            if (hobby) {
                if (soundEnabled) audioCtrlRef.current?.explode();
                isExplodedRef.current = true;
                selectedHobbyIdRef.current = hobby.id;
                if (particleSystemRef.current) {
                    particleSystemRef.current.position.copy(obj.position);
                    particleSystemRef.current.visible = true;
                    explosionUniforms.current.uExplode.value = 0;
                }
                setSelectedHobby(hobby);
            }
        }
    }
  };

  const handleClose = () => {
      setSelectedHobby(null);
      if (soundEnabled) audioCtrlRef.current?.close();
      isExplodedRef.current = false;
      selectedHobbyIdRef.current = null;
      if (particleSystemRef.current) particleSystemRef.current.visible = false;
      physicsState.current.forEach(state => state.currentScale = 0);
  };

  // Handler for list item click
  const handleListSelect = (hobby: Hobby) => {
      // Don't trigger explosion animation, just open detail
      // Or optionally allow minimal explosion sound?
      if (soundEnabled) audioCtrlRef.current?.hover();
      setSelectedHobby(hobby);
  };

  return (
    <div className="fixed inset-0 z-50">
        <div 
            ref={containerRef} 
            className="absolute inset-0 z-0 cursor-crosshair" 
            onMouseMove={handleMouseMove}
            onClick={handleClick}
        />

        {/* --- UI ELEMENTS --- */}
        <div className="absolute top-6 left-6 z-10 flex gap-4">
            {!selectedHobby && (
                <button 
                    onClick={onBack}
                    className="flex items-center gap-2 text-white hover:text-white/80 transition-colors bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 group shadow-lg"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform"/>
                    <span className="font-mono text-xs uppercase tracking-widest">Exit Heaven</span>
                </button>
            )}
            
            <button 
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`flex items-center gap-2 transition-colors bg-black/40 backdrop-blur-md p-2 rounded-full border shadow-lg ${soundEnabled ? 'text-green-400 border-green-500/30' : 'text-white/40 border-white/20'}`}
                title={soundEnabled ? "Mute Audio" : "Enable Audio"}
            >
                {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

            {/* TOGGLE VIEW SWITCH */}
             <button 
                onClick={() => setViewMode(prev => prev === 'bubbles' ? 'list' : 'bubbles')}
                className={`flex items-center gap-2 transition-colors bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border shadow-lg ${viewMode === 'list' ? 'text-purple-400 border-purple-500/30' : 'text-white/80 border-white/20'}`}
                title="Toggle View Mode"
            >
                {viewMode === 'bubbles' ? (
                     <>
                        <LayoutList size={16} />
                        <span className="font-mono text-xs uppercase tracking-widest hidden md:inline">List View</span>
                     </>
                ) : (
                     <>
                        <Grid3X3 size={16} />
                        <span className="font-mono text-xs uppercase tracking-widest hidden md:inline">Bubble View</span>
                     </>
                )}
            </button>
        </div>

        {/* LIST VIEW OVERLAY */}
        <AnimatePresence>
            {viewMode === 'list' && !selectedHobby && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none p-4 md:p-12"
                >
                     <div className="w-full max-w-6xl pointer-events-auto max-h-[80vh] overflow-y-auto custom-scrollbar">
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {hobbies.map((hobby, index) => (
                                <motion.div 
                                    key={hobby.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={() => handleListSelect(hobby)}
                                    className="group relative bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden hover:bg-white/5 transition-all duration-300 cursor-pointer shadow-lg hover:border-purple-500/30"
                                >
                                    <div className="h-48 overflow-hidden relative">
                                        <img src={hobby.coverImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80 group-hover:opacity-100" alt={hobby.name} />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                                        <div className="absolute bottom-4 left-4">
                                            <span className="text-[10px] font-mono bg-purple-900/40 text-purple-300 px-2 py-0.5 rounded border border-purple-500/20 backdrop-blur-sm">
                                                {hobby.category.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <div className="flex justify-between items-center mb-2">
                                            <h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors">{hobby.name}</h3>
                                            <ArrowUpRight size={18} className="text-gray-500 group-hover:text-white transition-colors opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transform duration-300"/>
                                        </div>
                                        <p className="text-gray-400 text-sm line-clamp-2">{hobby.description}</p>
                                    </div>
                                </motion.div>
                            ))}
                         </div>
                     </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* HOVER LABEL (Only in Bubble Mode) */}
        {!selectedHobby && viewMode === 'bubbles' && (
             <div 
                className="fixed pointer-events-none z-20 transition-opacity duration-200"
                style={{ 
                    left: '50%', 
                    top: '80%', 
                    transform: 'translate(-50%, -50%)',
                    opacity: hoveredHobby ? 1 : 0
                }}
            >
                <div className="flex flex-col items-center">
                    <p className="text-sm font-mono text-white/80 mb-2 tracking-widest drop-shadow-md">CLICK TO DECRYPT</p>
                    <h2 className="text-5xl font-black text-white uppercase tracking-tighter drop-shadow-[0_0_25px_rgba(255,255,255,0.8)]">
                        {hoveredHobby}
                    </h2>
                </div>
            </div>
        )}

        {/* DETAIL OVERLAY */}
        <AnimatePresence>
            {selectedHobby && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.2 }}
                    className="absolute inset-0 z-30 flex items-center justify-center p-4 md:p-12 pointer-events-none"
                >
                    <motion.div 
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="w-full max-w-5xl h-[85vh] bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-2xl pointer-events-auto relative"
                    >
                        <button 
                            onClick={handleClose}
                            className="absolute top-6 right-6 z-50 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                        >
                            <Minimize2 size={20} />
                        </button>

                        <div className="md:w-1/2 h-64 md:h-full relative overflow-hidden bg-black">
                             <img src={selectedHobby.coverImage} className="w-full h-full object-cover opacity-60" alt="cover" />
                             <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent md:bg-gradient-to-r"></div>
                             
                             <div className="absolute bottom-8 left-8">
                                <span className="text-purple-400 font-mono text-xs tracking-widest border border-purple-500/30 px-2 py-1 rounded bg-purple-900/20">
                                    {selectedHobby.category}
                                </span>
                                <h2 className="text-4xl md:text-6xl font-bold text-white mt-4 leading-none">{selectedHobby.name}</h2>
                             </div>
                        </div>

                        <div className="md:w-1/2 p-8 md:p-12 overflow-y-auto custom-scrollbar bg-gradient-to-b from-transparent to-black/50">
                             <div className="mb-8">
                                <h3 className="text-xs font-mono text-gray-500 uppercase mb-4 tracking-widest">Analysis</h3>
                                <p className="text-gray-300 leading-relaxed text-lg font-light border-l-2 border-white/20 pl-6">
                                    {selectedHobby.description}
                                </p>
                             </div>

                             {selectedHobby.news && (
                                <div className="mb-10 bg-white/5 border border-white/10 rounded-xl p-6">
                                    <div className="flex items-center gap-2 text-green-400 font-bold text-xs uppercase tracking-widest mb-2">
                                        <Newspaper size={14} /> Live Feed
                                    </div>
                                    <p className="text-white italic">"{selectedHobby.news}"</p>
                                </div>
                             )}

                             <div>
                                <h3 className="flex items-center gap-2 text-xs font-mono text-gray-500 uppercase mb-6 tracking-widest">
                                    <Sparkles size={12} /> Visual Data
                                </h3>
                                
                                {selectedHobby.gallery.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        {selectedHobby.gallery.map((img, idx) => (
                                            <div key={idx} className="group relative aspect-square bg-gray-900 rounded-lg overflow-hidden cursor-zoom-in border border-white/5 hover:border-white/30 transition-colors">
                                                <img src={img} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" alt="gallery" />
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <ImageIcon className="text-white" size={24} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 border border-dashed border-white/10 rounded-lg text-center text-gray-600">
                                        <p className="text-xs font-mono">NO VISUALS ARCHIVED</p>
                                    </div>
                                )}
                             </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
  );
};

export default HobbyWorld;