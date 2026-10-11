import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { X, RotateCcw, ZoomIn, ZoomOut, Compass, ShieldCheck, Cpu, Radio, Sparkles, Layers } from 'lucide-react';
import {
  createSpacecraftTileTexture,
  createSolarPanelTexture,
  createMissionMarkingsTexture,
} from '../three/textures';

interface SpacecraftInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SpacecraftInspectionModal: React.FC<SpacecraftInspectionModalProps> = ({ isOpen, onClose }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [wireframe, setWireframe] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'specifications' | 'instruments'>('overview');
  const wireframeRef = useRef(false);

  useEffect(() => {
    wireframeRef.current = wireframe;
  }, [wireframe]);

  useEffect(() => {
    if (!isOpen || !mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene, Camera & Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030712);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 10, 28);
    camera.lookAt(0, 10, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 2. Starfield & Nebula Backdrop
    const starsCount = 1200;
    const starsGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starsCount * 3);
    for (let i = 0; i < starsCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 160;
      starPositions[i + 1] = (Math.random() - 0.5) * 160;
      starPositions[i + 2] = (Math.random() - 0.5) * 160;
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starsMat = new THREE.PointsMaterial({ color: 0xe2e8f0, size: 0.8, transparent: true, opacity: 0.8 });
    const starfield = new THREE.Points(starsGeo, starsMat);
    scene.add(starfield);

    // Grid Floor Platform
    const gridHelper = new THREE.GridHelper(30, 30, 0x38bdf8, 0x1e293b);
    gridHelper.position.y = -0.1;
    scene.add(gridHelper);

    // 3. Cinematic Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xf8fafc, 3.5);
    keyLight.position.set(15, 25, 20);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 2.0);
    fillLight.position.set(-20, 10, -15);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xf59e0b, 1.8);
    rimLight.position.set(0, -10, -20);
    scene.add(rimLight);

    // 4. Build Detailed White Spacecraft Model
    const craftGroup = new THREE.Group();
    craftGroup.position.set(0, 0, 0);
    scene.add(craftGroup);

    const tileTex = createSpacecraftTileTexture();
    const solarTex = createSolarPanelTexture();
    const markingsTex = createMissionMarkingsTexture();

    const thermalMat = new THREE.MeshStandardMaterial({
      map: tileTex,
      color: 0xffffff,
      roughness: 0.2,
      metalness: 0.25,
    });

    const titaniumMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.35,
      metalness: 0.85,
    });

    const goldFoilMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.15,
      metalness: 0.95,
    });

    const markingsMat = new THREE.MeshStandardMaterial({
      map: markingsTex,
      roughness: 0.2,
      metalness: 0.3,
    });

    // Stage 1 Core Assembly
    const stage1Geo = new THREE.CylinderGeometry(1.5, 1.5, 12, 48);
    const stage1Mesh = new THREE.Mesh(stage1Geo, thermalMat);
    stage1Mesh.position.y = 6;
    craftGroup.add(stage1Mesh);

    // "ECHOES OF SPACE" Decal Cylinder Band
    const decalGeo = new THREE.CylinderGeometry(1.51, 1.51, 3.8, 48);
    const decalMesh = new THREE.Mesh(decalGeo, markingsMat);
    decalMesh.position.y = 6.5;
    craftGroup.add(decalMesh);

    // Titanium Interstage Joint
    const interGeo = new THREE.CylinderGeometry(1.52, 1.52, 0.8, 48);
    const interMesh = new THREE.Mesh(interGeo, titaniumMat);
    interMesh.position.y = 11.5;
    craftGroup.add(interMesh);

    // Stage 2 Upper Service Module
    const stage2Geo = new THREE.CylinderGeometry(1.35, 1.35, 5, 48);
    const stage2Mesh = new THREE.Mesh(stage2Geo, thermalMat);
    stage2Mesh.position.y = 14.4;
    craftGroup.add(stage2Mesh);

    // Gold Foil MLI Module Ring
    const mliGeo = new THREE.CylinderGeometry(1.37, 1.37, 1.3, 48);
    const mliMesh = new THREE.Mesh(mliGeo, goldFoilMat);
    mliMesh.position.y = 13.9;
    craftGroup.add(mliMesh);

    // Mission Payload Fairing with Markings
    const fairingGeo = new THREE.CylinderGeometry(1.4, 1.4, 3.4, 48);
    const fairingMesh = new THREE.Mesh(fairingGeo, markingsMat);
    fairingMesh.position.y = 17.2;
    craftGroup.add(fairingMesh);

    // Aerodynamic Nose Cone
    const noseGeo = new THREE.ConeGeometry(1.4, 2.8, 48);
    const noseMesh = new THREE.Mesh(noseGeo, thermalMat);
    noseMesh.position.y = 20.2;
    craftGroup.add(noseMesh);

    // Solar Wings
    const solarWingGeo = new THREE.BoxGeometry(0.1, 4.2, 1.4);
    const solarWingMat = new THREE.MeshStandardMaterial({
      map: solarTex,
      roughness: 0.15,
      metalness: 0.8,
    });

    const leftWing = new THREE.Mesh(solarWingGeo, solarWingMat);
    leftWing.position.set(-2.0, 14.4, 0);
    craftGroup.add(leftWing);

    const rightWing = new THREE.Mesh(solarWingGeo, solarWingMat);
    rightWing.position.set(2.0, 14.4, 0);
    craftGroup.add(rightWing);

    // High Gain Parabolic Dish Antenna
    const dishGeo = new THREE.SphereGeometry(0.7, 24, 24, 0, Math.PI * 2, 0, Math.PI / 2.2);
    const dishMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.25,
      metalness: 0.6,
      side: THREE.DoubleSide,
    });
    const dishMesh = new THREE.Mesh(dishGeo, dishMat);
    dishMesh.rotation.x = Math.PI / 2;
    dishMesh.position.set(0, 16.8, 1.55);
    craftGroup.add(dishMesh);

    // RCS Thruster Blocks
    const rcsGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 2) {
      const rcs = new THREE.Mesh(rcsGeo, titaniumMat);
      rcs.position.set(Math.cos(angle) * 1.52, 11.5, Math.sin(angle) * 1.52);
      craftGroup.add(rcs);
    }

    // Main Thruster Nozzle
    const nozzleGeo = new THREE.CylinderGeometry(1.2, 0.6, 1.8, 32);
    const nozzleMesh = new THREE.Mesh(nozzleGeo, titaniumMat);
    nozzleMesh.position.y = -0.8;
    craftGroup.add(nozzleMesh);

    // Store all meshes to easily toggle wireframe
    const allMeshes: THREE.Mesh[] = [];
    craftGroup.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        allMeshes.push(obj);
      }
    });

    // 5. Interactive Mouse Orbit Controls
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let rotX = 0;
    let rotY = 0;
    let autoRotate = true;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      autoRotate = false;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      rotY += deltaX * 0.008;
      rotX += deltaY * 0.008;
      rotX = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, rotX));

      craftGroup.rotation.y = rotY;
      craftGroup.rotation.x = rotX;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.position.z += e.deltaY * 0.02;
      camera.position.z = Math.max(14, Math.min(48, camera.position.z));
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('wheel', onWheel, { passive: false });

    // Touch support for mobile
    let touchX = 0;
    let touchY = 0;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging = true;
        autoRotate = false;
        touchX = e.touches[0].clientX;
        touchY = e.touches[0].clientY;
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches.length === 1) {
        const deltaX = e.touches[0].clientX - touchX;
        const deltaY = e.touches[0].clientY - touchY;
        touchX = e.touches[0].clientX;
        touchY = e.touches[0].clientY;

        rotY += deltaX * 0.008;
        rotX += deltaY * 0.008;
        rotX = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, rotX));

        craftGroup.rotation.y = rotY;
        craftGroup.rotation.x = rotX;
      }
    };
    const onTouchEnd = () => {
      isDragging = false;
    };

    container.addEventListener('touchstart', onTouchStart);
    container.addEventListener('touchmove', onTouchMove);
    container.addEventListener('touchend', onTouchEnd);

    // 6. Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (autoRotate && !isDragging) {
        rotY += 0.005;
        craftGroup.rotation.y = rotY;
      }

      // Sync wireframe state
      allMeshes.forEach((m) => {
        if (Array.isArray(m.material)) {
          m.material.forEach((mat: any) => { if ('wireframe' in mat) mat.wireframe = wireframeRef.current; });
        } else if (m.material && 'wireframe' in m.material) {
          (m.material as any).wireframe = wireframeRef.current;
        }
      });

      starfield.rotation.y += 0.0003;
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-xl animate-in fade-in duration-300 select-none">
      <div className="relative w-full max-w-6xl h-[90vh] bg-[#050814]/95 border border-sky-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Top Navigation Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-sky-500/20 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-400/40 flex items-center justify-center text-sky-400">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-tech text-base sm:text-lg font-bold tracking-widest text-slate-100">
                  ECHOES OF SPACE
                </h2>
                <span className="text-[10px] font-mono-tech px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-400/30">
                  360° MODEL VIEWER
                </span>
              </div>
              <p className="text-[11px] font-mono-tech text-slate-400">
                NASA Deep Space Exploration Assembly • Clean White Ceramic Exterior
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700 cursor-pointer"
            title="Close 3D Viewer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content Area: 3D Viewport + Telemetry Panel */}
        <div className="relative flex-1 grid grid-cols-1 lg:grid-cols-3 overflow-hidden">
          {/* 3D Interactive Viewport */}
          <div className="lg:col-span-2 relative w-full h-full bg-[#030712] cursor-grab active:cursor-grabbing">
            <div ref={mountRef} className="w-full h-full" />

            {/* Instruction Overlay Tag */}
            <div className="absolute top-4 left-4 z-10 pointer-events-none bg-slate-950/70 border border-sky-500/20 rounded-lg px-3 py-1.5 backdrop-blur-md">
              <span className="text-[11px] font-mono-tech text-sky-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Drag mouse / touch to rotate 360° • Scroll to zoom
              </span>
            </div>

            {/* Viewport Floating Action Tools */}
            <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-xl border border-sky-500/30 backdrop-blur-md">
              <button
                onClick={() => setWireframe(!wireframe)}
                className={`px-3 py-1.5 text-xs font-mono-tech rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                  wireframe
                    ? 'bg-sky-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
                title="Toggle Wireframe Mode"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{wireframe ? 'Wireframe On' : 'Shaded'}</span>
              </button>
            </div>
          </div>

          {/* Right Detailed Technical Telemetry & Specifications */}
          <div className="border-t lg:border-t-0 lg:border-l border-sky-500/20 bg-slate-950/90 p-4 sm:p-5 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              {/* Tab Selector */}
              <div className="flex rounded-lg bg-slate-900/80 p-1 border border-sky-500/20">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`flex-1 py-1.5 text-xs font-tech tracking-wider uppercase rounded-md transition-colors cursor-pointer ${
                    activeTab === 'overview'
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('specifications')}
                  className={`flex-1 py-1.5 text-xs font-tech tracking-wider uppercase rounded-md transition-colors cursor-pointer ${
                    activeTab === 'specifications'
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Specs
                </button>
                <button
                  onClick={() => setActiveTab('instruments')}
                  className={`flex-1 py-1.5 text-xs font-tech tracking-wider uppercase rounded-md transition-colors cursor-pointer ${
                    activeTab === 'instruments'
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Instruments
                </button>
              </div>

              {activeTab === 'overview' && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div className="p-3 rounded-xl bg-slate-900/70 border border-sky-500/15">
                    <span className="text-[10px] font-mono-tech uppercase text-sky-400 tracking-wider block">
                      AEROSPACE ARCHITECTURE
                    </span>
                    <h3 className="font-tech text-sm font-bold text-slate-100 mt-0.5">
                      Matte White Thermal Protection Shield
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Equipped with high-purity ceramic tiles designed to withstand atmospheric entry temperatures exceeding 1,650°C. Clean matte white finish reduces thermal absorption during direct sunlight exposure.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-3 rounded-xl bg-slate-900/70 border border-sky-500/15">
                      <div className="flex items-center gap-1.5 text-sky-400 mb-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-mono-tech uppercase tracking-wider">Structure</span>
                      </div>
                      <span className="text-xs font-tech font-bold text-slate-200 block">Aluminum-Lithium Alloy</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/70 border border-sky-500/15">
                      <div className="flex items-center gap-1.5 text-amber-400 mb-1">
                        <Cpu className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-mono-tech uppercase tracking-wider">Avionics</span>
                      </div>
                      <span className="text-xs font-tech font-bold text-slate-200 block">Triple-Redundant Flight Core</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/70 border border-sky-500/15 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Radio className="w-4 h-4 text-emerald-400" />
                      <div>
                        <span className="text-[10px] font-mono-tech uppercase text-slate-400 block">Telemetry Relay</span>
                        <span className="text-xs font-tech font-bold text-slate-200">X-Band & Ka-Band Dish</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono-tech px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      ACTIVE
                    </span>
                  </div>
                </div>
              )}

              {activeTab === 'specifications' && (
                <div className="space-y-2.5 font-mono-tech text-xs animate-in fade-in duration-200">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/70 border border-slate-800">
                    <span className="text-slate-400">Height:</span>
                    <span className="text-slate-200 font-bold">22.8 meters</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/70 border border-slate-800">
                    <span className="text-slate-400">Core Diameter:</span>
                    <span className="text-slate-200 font-bold">3.0 meters</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/70 border border-slate-800">
                    <span className="text-slate-400">Dry Mass:</span>
                    <span className="text-slate-200 font-bold">14,800 kg</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/70 border border-slate-800">
                    <span className="text-slate-400">Propellant:</span>
                    <span className="text-slate-200 font-bold">LOX / LCH4 Cryogenic</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/70 border border-slate-800">
                    <span className="text-slate-400">Descent Parachute:</span>
                    <span className="text-slate-200 font-bold">35m Ring-Sail Parachute</span>
                  </div>
                </div>
              )}

              {activeTab === 'instruments' && (
                <div className="space-y-2.5 text-xs animate-in fade-in duration-200">
                  <div className="p-3 rounded-xl bg-slate-900/70 border border-sky-500/15">
                    <span className="font-tech font-bold text-sky-300 block">Multispectral Terrain Mapper</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">High-resolution stereoscopic camera array for landing site selection.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/70 border border-sky-500/15">
                    <span className="font-tech font-bold text-sky-300 block">Alpha Particle X-Ray Spectrometer</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">Measures elemental composition of surface regolith during descent.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/70 border border-sky-500/15">
                    <span className="font-tech font-bold text-sky-300 block">Precision Radar Altimeter</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">Provides real-time terrain relative navigation for soft touchdown.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Modal Close Button */}
            <div className="pt-4 border-t border-sky-500/20">
              <button
                onClick={onClose}
                className="w-full py-2.5 text-xs font-tech font-bold uppercase tracking-wider text-slate-950 bg-sky-400 hover:bg-sky-300 rounded-lg transition-colors cursor-pointer shadow-md"
              >
                Return to Mission Simulation
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
