import * as THREE from 'three';

/**
 * Procedural Texture Generator for High-Fidelity Celestial Bodies
 * Creates realistic, optimized canvas textures dynamically.
 */

// Helper: Seedable noise/simplex-like pattern
function createNoisePattern(ctx: CanvasRenderingContext2D, width: number, height: number, density = 0.5) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const v = Math.floor(Math.random() * 255 * density);
    data[i] = v;
    data[i + 1] = v;
    data[i + 2] = v;
    data[i + 3] = 255;
  }
  ctx.putImageData(imgData, 0, 0);
}

export function createSunTexture(): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Super fiery nuclear core gradient
  const grad = ctx.createRadialGradient(size / 2, size / 2, size * 0.05, size / 2, size / 2, size / 2);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.15, '#fffbeb');
  grad.addColorStop(0.35, '#fde047');
  grad.addColorStop(0.6, '#f97316');
  grad.addColorStop(0.85, '#dc2626');
  grad.addColorStop(1, '#991b1b');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Solar flare turbulence loops
  ctx.fillStyle = 'rgba(254, 240, 138, 0.35)';
  for (let i = 0; i < 600; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Math.random() * 30 + 6;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Dark magnetic sunspots
  ctx.fillStyle = 'rgba(120, 28, 9, 0.6)';
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Math.random() * 14 + 5;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

export function createEarthTexture(): THREE.CanvasTexture {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Brilliant rich turquoise and deep sapphire ocean gradient
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
  oceanGrad.addColorStop(0, '#0284c7');
  oceanGrad.addColorStop(0.3, '#0369a1');
  oceanGrad.addColorStop(0.5, '#0d9488'); // Shallow turquoise Caribbean shelves
  oceanGrad.addColorStop(0.7, '#075985');
  oceanGrad.addColorStop(1, '#0c4a6e');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, width, height);

  // Continents: North & South America
  ctx.fillStyle = '#16a34a'; // Vibrant emerald rainforest green
  ctx.beginPath();
  ctx.ellipse(width * 0.25, height * 0.35, width * 0.11, height * 0.19, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(width * 0.32, height * 0.65, width * 0.08, height * 0.22, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Eurasia & Africa
  ctx.fillStyle = '#15803d';
  ctx.beginPath();
  ctx.ellipse(width * 0.52, height * 0.32, width * 0.09, height * 0.11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d97706'; // Saharan golden sand
  ctx.beginPath();
  ctx.ellipse(width * 0.52, height * 0.52, width * 0.09, height * 0.18, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#16a34a';
  ctx.beginPath();
  ctx.ellipse(width * 0.74, height * 0.33, width * 0.18, height * 0.18, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ea580c'; // Australian outback rust gold
  ctx.beginPath();
  ctx.ellipse(width * 0.83, height * 0.72, width * 0.07, height * 0.09, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // Lush mountain ranges & tundra
  ctx.fillStyle = '#854d0e';
  ctx.beginPath();
  ctx.ellipse(width * 0.21, height * 0.35, width * 0.02, height * 0.15, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Polar ice caps with pure glowing white
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height * 0.09);
  ctx.fillRect(0, height * 0.91, width, height * 0.09);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

export function createEarthCloudTexture(): THREE.CanvasTexture {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, width, height);

  // Swirling hurricane clouds and atmospheric fronts
  for (let i = 0; i < 1100; i++) {
    const x = Math.random() * width;
    const y = height * 0.08 + Math.random() * height * 0.84;
    const radiusX = Math.random() * 160 + 40;
    const radiusY = Math.random() * 45 + 14;
    const rotation = (Math.random() - 0.5) * 0.7;
    const opacity = Math.random() * 0.65 + 0.25;

    ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
    ctx.beginPath();
    ctx.ellipse(x, y, radiusX, radiusY, rotation, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

export function createMoonTexture(): THREE.CanvasTexture {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(0, 0, width, height);

  // Dark Lunar Maria (Basaltic Plains)
  ctx.fillStyle = '#475569';
  const mariaLocations = [
    { x: width * 0.35, y: height * 0.4, rx: 110, ry: 75 },
    { x: width * 0.48, y: height * 0.38, rx: 85, ry: 65 },
    { x: width * 0.38, y: height * 0.55, rx: 95, ry: 85 },
    { x: width * 0.62, y: height * 0.45, rx: 130, ry: 95 },
    { x: width * 0.72, y: height * 0.32, rx: 70, ry: 50 },
  ];
  for (const m of mariaLocations) {
    ctx.beginPath();
    ctx.ellipse(m.x, m.y, m.rx, m.ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // High-contrast Impact Craters with Bright Ejecta Rays
  for (let i = 0; i < 400; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const r = Math.random() * 16 + 2;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(x - r * 0.2, y - r * 0.2, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

export function createMarsTexture(): THREE.CanvasTexture {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Intense vivid rusty orange-red gradient
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, '#f97316');
  grad.addColorStop(0.3, '#ea580c');
  grad.addColorStop(0.7, '#c2410c');
  grad.addColorStop(1, '#9a3412');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Dark volcanic basalt regions (Syrtis Major & Valles Marineris)
  ctx.fillStyle = '#6c230e';
  ctx.beginPath();
  ctx.ellipse(width * 0.55, height * 0.45, 120, 85, 0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(width * 0.25, height * 0.38, 150, 65, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // Valles Marineris Canyon fissure
  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(width * 0.3, height * 0.52);
  ctx.lineTo(width * 0.55, height * 0.56);
  ctx.stroke();

  // Polar ice caps (Carbon Dioxide & Water Ice)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height * 0.07);
  ctx.fillRect(0, height * 0.92, width, height * 0.08);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

export function createJupiterTexture(): THREE.CanvasTexture {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Rich vibrant copper, cream, gold, and amber atmospheric bands
  const bands = [
    '#ea580c', '#fff7ed', '#d97706', '#fef3c7', '#c2410c',
    '#ffddaa', '#9a3412', '#fde68a', '#78350f', '#fff7ed',
    '#f97316', '#fed7aa', '#b45309', '#fef08a', '#9a3412'
  ];
  const bandHeight = height / bands.length;
  bands.forEach((color, i) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, i * bandHeight, width, bandHeight);
  });

  // Great Red Spot with inner swirling detail
  const grsX = width * 0.62;
  const grsY = height * 0.65;
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.ellipse(grsX, grsY, 70, 40, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#f87171';
  ctx.beginPath();
  ctx.ellipse(grsX, grsY, 48, 25, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#fef2f2';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(grsX, grsY, 30, 14, 0, 0, Math.PI * 2);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

export function createSaturnTexture(): THREE.CanvasTexture {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const bands = [
    '#eab308', '#fef08a', '#ca8a04', '#fef9c3', '#a16207',
    '#fde047', '#ca8a04', '#fef9c3', '#eab308', '#fde047'
  ];
  const bandHeight = height / bands.length;
  bands.forEach((color, i) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, i * bandHeight, width, bandHeight);
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

export function createSaturnRingTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = 1;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, size, 0);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(0.18, 'rgba(234, 179, 8, 0.35)');
  grad.addColorStop(0.4, 'rgba(254, 240, 138, 0.95)');
  grad.addColorStop(0.68, 'rgba(234, 179, 8, 0.98)');
  grad.addColorStop(0.70, 'rgba(10, 15, 25, 0.02)'); // Cassini Division Gap
  grad.addColorStop(0.74, 'rgba(202, 138, 4, 0.9)');
  grad.addColorStop(0.92, 'rgba(161, 98, 7, 0.8)');
  grad.addColorStop(0.96, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, 1);

  return new THREE.CanvasTexture(canvas);
}

export function createUranusTexture(): THREE.CanvasTexture {
  const width = 512;
  const height = 256;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Vivid cyan/turquoise ice giant color
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, '#38bdf8');
  grad.addColorStop(0.4, '#22d3ee');
  grad.addColorStop(0.7, '#67e8f9');
  grad.addColorStop(1, '#0284c7');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  return new THREE.CanvasTexture(canvas);
}

export function createNeptuneTexture(): THREE.CanvasTexture {
  const width = 512;
  const height = 256;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Deep intense electric cobalt blue
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, '#2563eb');
  grad.addColorStop(0.4, '#3b82f6');
  grad.addColorStop(0.7, '#1d4ed8');
  grad.addColorStop(1, '#1e3a8a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Methane storm bands & Great Dark Spot
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.fillRect(50, 110, 200, 6);
  ctx.fillRect(190, 170, 140, 5);

  ctx.fillStyle = '#1e1b4b';
  ctx.beginPath();
  ctx.ellipse(320, 130, 45, 25, 0, 0, Math.PI * 2);
  ctx.fill();

  return new THREE.CanvasTexture(canvas);
}

export function createMercuryTexture(): THREE.CanvasTexture {
  const width = 512;
  const height = 256;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#a1a1aa';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = 'rgba(24, 24, 27, 0.7)';
  for (let i = 0; i < 160; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    ctx.beginPath();
    ctx.arc(x, y, Math.random() * 8 + 1, 0, Math.PI * 2);
    ctx.fill();
  }

  return new THREE.CanvasTexture(canvas);
}

export function createVenusTexture(): THREE.CanvasTexture {
  const width = 512;
  const height = 256;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Luminous golden cream sulfuric acid cloud deck
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, '#fef08a');
  grad.addColorStop(0.3, '#facc15');
  grad.addColorStop(0.7, '#eab308');
  grad.addColorStop(1, '#ca8a04');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  return new THREE.CanvasTexture(canvas);
}

/** Pure Luminous White Thermal Protection Tile Texture with seams & rivets */
export function createSpacecraftTileTexture(): THREE.CanvasTexture {
  const width = 1024;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Luminous pristine pure white thermal protection background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // High-precision subtle thermal blanket grid lines (tiles)
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.2;
  const tileSize = 64;
  for (let x = 0; x <= width; x += tileSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y += tileSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Titanium rivets at tile intersections
  ctx.fillStyle = '#cbd5e1';
  for (let x = 0; x <= width; x += tileSize) {
    for (let y = 0; y <= height; y += tileSize) {
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Crisp aerospace panel line accents
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(32, 32, width - 64, height - 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  return texture;
}

/** Deep Blue Photovoltaic Solar Panel Texture */
export function createSolarPanelTexture(): THREE.CanvasTexture {
  const width = 512;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Deep metallic blue silicon wafer
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, '#1e3a8a');
  grad.addColorStop(0.5, '#1d4ed8');
  grad.addColorStop(1, '#0f172a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Silicon cell grid lines
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1;
  const cellSize = 32;
  for (let x = 0; x <= width; x += cellSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y += cellSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Gold busbar conductors
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, height * 0.33);
  ctx.lineTo(width, height * 0.33);
  ctx.moveTo(0, height * 0.66);
  ctx.lineTo(width, height * 0.66);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/** "ECHOES OF SPACE" Bold Mission Markings Texture */
export function createMissionMarkingsTexture(): THREE.CanvasTexture {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Luminous white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Primary bold dark navy accent banner
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 180, width, 150);

  // Electric cyan double border trim
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(0, 174, width, 6);
  ctx.fillRect(0, 330, width, 6);

  // Prominent "ECHOES OF SPACE" text logo (Left & Center wrapped)
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 64px "Arial Black", "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ECHOES OF SPACE', width / 2, 245);

  // Secondary "ECHOES OF SPACE" text for 360-degree cylindrical visibility
  ctx.fillStyle = '#0f172a';
  ctx.font = '900 36px "Arial Black", sans-serif';
  ctx.fillText('ECHOES OF SPACE', width / 2, 80);
  ctx.fillText('ECHOES OF SPACE', width / 2, 430);

  // Subtitle mission branding
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 22px "Courier New", monospace';
  ctx.fillText('NASA INTERPLANETARY EXPLORATOR • EOS-2026', width / 2, 298);

  // US Flag / NASA Badge graphic on left flank
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(80, 205, 80, 50);
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(80, 205, 80, 8);
  ctx.fillRect(80, 221, 80, 8);
  ctx.fillRect(80, 237, 80, 8);

  // NASA Insignia vector on right flank
  ctx.beginPath();
  ctx.arc(width - 120, 230, 28, 0, Math.PI * 2);
  ctx.fillStyle = '#0284c7';
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

/** Iconic Mars Radial Orange & White Parachute Pattern Texture */
export function createMarsParachuteTexture(): THREE.CanvasTexture {
  const width = 1024;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const cx = width / 2;
  const cy = height / 2;
  const outerR = width / 2 - 10;

  // Background white
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, width, height);

  // Concentric rings & radial sectors
  const sectors = 80;
  for (let i = 0; i < sectors; i++) {
    const angle1 = (i / sectors) * Math.PI * 2;
    const angle2 = ((i + 1) / sectors) * Math.PI * 2;

    // Alternating radial orange & white pattern (Perseverance style)
    const isOrange = (i % 2 === 0) || (i % 7 === 0) || (i % 11 === 0);
    ctx.fillStyle = isOrange ? '#ea580c' : '#ffffff';

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, outerR, angle1, angle2);
    ctx.closePath();
    ctx.fill();
  }

  // Inner hole / ring
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(cx, cy, outerR * 0.15, 0, Math.PI * 2);
  ctx.fill();

  // Suspension line anchor ring
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, outerR * 0.9, 0, Math.PI * 2);
  ctx.stroke();

  return new THREE.CanvasTexture(canvas);
}


