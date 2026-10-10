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

  // Base fiery gradient
  const grad = ctx.createRadialGradient(size / 2, size / 2, size * 0.1, size / 2, size / 2, size / 2);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.2, '#fff4cc');
  grad.addColorStop(0.5, '#f59e0b');
  grad.addColorStop(0.8, '#d97706');
  grad.addColorStop(1, '#b45309');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Solar turbulence granules
  ctx.fillStyle = 'rgba(251, 191, 36, 0.2)';
  for (let i = 0; i < 400; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Math.random() * 25 + 5;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Darker sunspots
  ctx.fillStyle = 'rgba(180, 83, 9, 0.4)';
  for (let i = 0; i < 15; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Math.random() * 12 + 4;
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

  // Deep oceanic blue
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
  oceanGrad.addColorStop(0, '#0a213e');
  oceanGrad.addColorStop(0.5, '#0d325e');
  oceanGrad.addColorStop(1, '#081a33');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, width, height);

  // Continents: Americas
  ctx.fillStyle = '#22543d';
  // North America
  ctx.beginPath();
  ctx.ellipse(width * 0.25, height * 0.35, width * 0.1, height * 0.18, -0.2, 0, Math.PI * 2);
  ctx.fill();
  // South America
  ctx.beginPath();
  ctx.ellipse(width * 0.32, height * 0.65, width * 0.07, height * 0.2, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Eurasia & Africa
  // Europe
  ctx.fillStyle = '#276749';
  ctx.beginPath();
  ctx.ellipse(width * 0.52, height * 0.32, width * 0.08, height * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
  // Africa
  ctx.fillStyle = '#744210';
  ctx.beginPath();
  ctx.ellipse(width * 0.52, height * 0.55, width * 0.09, height * 0.2, 0.1, 0, Math.PI * 2);
  ctx.fill();
  // Asia
  ctx.fillStyle = '#2f855a';
  ctx.beginPath();
  ctx.ellipse(width * 0.72, height * 0.33, width * 0.16, height * 0.16, 0.1, 0, Math.PI * 2);
  ctx.fill();
  // Australia
  ctx.fillStyle = '#975a16';
  ctx.beginPath();
  ctx.ellipse(width * 0.82, height * 0.72, width * 0.06, height * 0.08, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // Desert regions (Sahara & Gobi)
  ctx.fillStyle = '#b7791f';
  ctx.beginPath();
  ctx.ellipse(width * 0.52, height * 0.44, width * 0.07, height * 0.06, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(width * 0.7, height * 0.36, width * 0.06, height * 0.04, 0, 0, Math.PI * 2);
  ctx.fill();

  // Polar ice caps
  ctx.fillStyle = '#f0fdf4';
  ctx.fillRect(0, 0, width, height * 0.07);
  ctx.fillRect(0, height * 0.92, width, height * 0.08);

  // Coastline highlights and mountain nuances
  ctx.strokeStyle = '#38a169';
  ctx.lineWidth = 4;
  for (let i = 0; i < 30; i++) {
    const x = Math.random() * width;
    const y = height * 0.2 + Math.random() * height * 0.6;
    ctx.beginPath();
    ctx.arc(x, y, Math.random() * 20 + 10, 0, Math.PI * 2);
    ctx.stroke();
  }

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

  // Transparent background
  ctx.clearRect(0, 0, width, height);

  // White cloud swirls with varying opacity
  for (let i = 0; i < 800; i++) {
    const x = Math.random() * width;
    const y = height * 0.1 + Math.random() * height * 0.8;
    const radiusX = Math.random() * 120 + 30;
    const radiusY = Math.random() * 35 + 10;
    const rotation = (Math.random() - 0.5) * 0.6;
    const opacity = Math.random() * 0.45 + 0.15;

    ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
    ctx.beginPath();
    ctx.ellipse(x, y, radiusX, radiusY, rotation, 0, Math.PI * 2);
    ctx.fill();
  }

  // Cyclone swirls
  for (let i = 0; i < 4; i++) {
    const cx = (width * (i + 1)) / 5 + (Math.random() - 0.5) * 200;
    const cy = height * (0.3 + Math.random() * 0.4);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.beginPath();
    ctx.arc(cx, cy, 45, 0, Math.PI * 2);
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

  // Light grey regolith
  ctx.fillStyle = '#9ca3af';
  ctx.fillRect(0, 0, width, height);

  // Dark Lunar Maria (basaltic plains)
  ctx.fillStyle = '#4b5563';
  const mariaLocations = [
    { x: width * 0.35, y: height * 0.4, rx: 90, ry: 60 },
    { x: width * 0.48, y: height * 0.38, rx: 70, ry: 50 },
    { x: width * 0.38, y: height * 0.55, rx: 80, ry: 70 },
    { x: width * 0.6, y: height * 0.45, rx: 110, ry: 80 },
  ];
  for (const m of mariaLocations) {
    ctx.beginPath();
    ctx.ellipse(m.x, m.y, m.rx, m.ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Craters with rim shadows & bright ejecta
  for (let i = 0; i < 250; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const r = Math.random() * 14 + 2;

    // Shadow
    ctx.fillStyle = 'rgba(31, 41, 55, 0.6)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    // Bright rim
    ctx.strokeStyle = 'rgba(243, 244, 246, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x - r * 0.2, y - r * 0.2, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Tycho-like ray crater
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 1;
  const tychoX = width * 0.42;
  const tychoY = height * 0.78;
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
    ctx.beginPath();
    ctx.moveTo(tychoX, tychoY);
    ctx.lineTo(tychoX + Math.cos(a) * 120, tychoY + Math.sin(a) * 120);
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

  // Base red-orange regolith
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, '#c2410c');
  grad.addColorStop(0.5, '#ea580c');
  grad.addColorStop(1, '#9a3412');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Dark volcanic plains (Syrtis Major, Acidalia)
  ctx.fillStyle = '#7c2d12';
  ctx.beginPath();
  ctx.ellipse(width * 0.55, height * 0.45, 90, 70, 0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(width * 0.25, height * 0.38, 120, 50, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // Valles Marineris canyon system
  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(width * 0.25, height * 0.58);
  ctx.bezierCurveTo(width * 0.35, height * 0.59, width * 0.42, height * 0.57, width * 0.5, height * 0.6);
  ctx.stroke();

  // Polar Ice Caps
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height * 0.05); // North cap
  ctx.fillRect(0, height * 0.94, width, height * 0.06); // South cap

  // Subtle crater impacts
  ctx.fillStyle = 'rgba(67, 20, 7, 0.4)';
  for (let i = 0; i < 90; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    ctx.beginPath();
    ctx.arc(x, y, Math.random() * 8 + 2, 0, Math.PI * 2);
    ctx.fill();
  }

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

  // Alternating atmospheric bands
  const bands = [
    '#d97706', '#fed7aa', '#b45309', '#ffedd5', '#9a3412',
    '#fef3c7', '#c2410c', '#fde68a', '#78350f', '#ffedd5',
    '#d97706', '#fed7aa', '#b45309'
  ];
  const bandHeight = height / bands.length;
  bands.forEach((color, i) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, i * bandHeight, width, bandHeight);
  });

  // Turbulence wavy borders
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  for (let i = 0; i < 40; i++) {
    const y = Math.random() * height;
    ctx.fillRect(0, y, width, 3);
  }

  // The Great Red Spot
  const grsX = width * 0.62;
  const grsY = height * 0.65;
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.ellipse(grsX, grsY, 55, 32, 0, 0, Math.PI * 2);
  ctx.fill();

  // White inner vortex ring
  ctx.strokeStyle = '#fee2e2';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(grsX, grsY, 35, 18, 0, 0, Math.PI * 2);
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

  // Smooth butterscotch/gold banding
  const bands = [
    '#eab308', '#fef08a', '#ca8a04', '#fef9c3', '#a16207',
    '#fef08a', '#ca8a04', '#fef9c3', '#eab308'
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

  // 1D radial ring texture with alpha gaps (Cassini division)
  const grad = ctx.createLinearGradient(0, 0, size, 0);
  grad.addColorStop(0, 'rgba(0,0,0,0)'); // Inner transparent
  grad.addColorStop(0.2, 'rgba(217, 180, 120, 0.2)'); // C Ring
  grad.addColorStop(0.4, 'rgba(235, 205, 150, 0.85)'); // B Ring (dense)
  grad.addColorStop(0.68, 'rgba(235, 205, 150, 0.9)');
  grad.addColorStop(0.70, 'rgba(10, 15, 25, 0.05)'); // Cassini Division gap
  grad.addColorStop(0.74, 'rgba(210, 180, 130, 0.7)'); // A Ring
  grad.addColorStop(0.92, 'rgba(190, 160, 115, 0.6)');
  grad.addColorStop(0.95, 'rgba(0, 0, 0, 0)'); // Outer transparent
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, 1);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

export function createUranusTexture(): THREE.CanvasTexture {
  const width = 512;
  const height = 256;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, '#67e8f9');
  grad.addColorStop(0.5, '#a5f3fc');
  grad.addColorStop(1, '#38bdf8');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

export function createNeptuneTexture(): THREE.CanvasTexture {
  const width = 512;
  const height = 256;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, '#1d4ed8');
  grad.addColorStop(0.4, '#2563eb');
  grad.addColorStop(0.7, '#1e40af');
  grad.addColorStop(1, '#1e3a8a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Subtle white methane cloud streaks
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.fillRect(50, 110, 180, 4);
  ctx.fillRect(200, 170, 120, 3);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

export function createMercuryTexture(): THREE.CanvasTexture {
  const width = 512;
  const height = 256;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#6b7280';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = 'rgba(17, 24, 39, 0.5)';
  for (let i = 0; i < 90; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    ctx.beginPath();
    ctx.arc(x, y, Math.random() * 6 + 1, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

export function createVenusTexture(): THREE.CanvasTexture {
  const width = 512;
  const height = 256;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, '#fef08a');
  grad.addColorStop(0.5, '#fde047');
  grad.addColorStop(1, '#eab308');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = 'rgba(234, 179, 8, 0.3)';
  for (let i = 0; i < 30; i++) {
    ctx.fillRect(0, Math.random() * height, width, Math.random() * 8 + 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}
