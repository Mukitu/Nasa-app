import * as THREE from 'three';
import { SurfaceWaypoint } from '../types/simulation';

/**
 * 3D Procedural Reconstructions of Historical Spacecraft & Discarded Equipment
 * on the Moon and Mars for NASA Space Apps Challenge
 */

// Helper material caches
const goldFoilMat = new THREE.MeshStandardMaterial({
  color: 0xd97706,
  metalness: 0.85,
  roughness: 0.25,
});

const silverTitaniumMat = new THREE.MeshStandardMaterial({
  color: 0x94a3b8,
  metalness: 0.8,
  roughness: 0.3,
});

const darkAlloyMat = new THREE.MeshStandardMaterial({
  color: 0x1e293b,
  metalness: 0.7,
  roughness: 0.6,
});

const solarPanelMat = new THREE.MeshStandardMaterial({
  color: 0x1e3a8a,
  metalness: 0.9,
  roughness: 0.15,
});

const dustySolarMat = new THREE.MeshStandardMaterial({
  color: 0x78350f,
  metalness: 0.6,
  roughness: 0.8,
});

const whiteThermalMat = new THREE.MeshStandardMaterial({
  color: 0xf1f5f9,
  metalness: 0.2,
  roughness: 0.7,
});

const rustMetalMat = new THREE.MeshStandardMaterial({
  color: 0x9a3412,
  metalness: 0.5,
  roughness: 0.85,
});

/**
 * Apollo Lunar Module Descent Stage (Apollo 11, 12, 14, 16, 17)
 */
export function createApolloLMDescentStage(variant: string): THREE.Group {
  const group = new THREE.Group();

  // 1. Octagonal gold-foil descent stage chassis
  const stageGeo = new THREE.CylinderGeometry(2.3, 2.5, 1.25, 8);
  const stageMesh = new THREE.Mesh(stageGeo, goldFoilMat);
  stageMesh.position.y = 1.2;
  stageMesh.castShadow = true;
  group.add(stageMesh);

  // 2. Central Descent Rocket Engine Bell (nozzle pointing down)
  const nozzleGeo = new THREE.CylinderGeometry(0.25, 0.85, 0.9, 16, 1, true);
  const nozzleMesh = new THREE.Mesh(nozzleGeo, darkAlloyMat);
  nozzleMesh.position.y = 0.5;
  group.add(nozzleMesh);

  // 3. Four outrigger landing gear struts and round footpads
  const legAngles = [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4];
  const legRadius = 3.6;

  legAngles.forEach((angle, idx) => {
    const lx = Math.cos(angle) * legRadius;
    const lz = Math.sin(angle) * legRadius;

    // Strut
    const strutGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.6, 8);
    const strut = new THREE.Mesh(strutGeo, silverTitaniumMat);
    strut.position.set(lx * 0.5, 0.9, lz * 0.5);
    strut.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(lx, -1.1, lz).normalize()
    );
    strut.castShadow = true;
    group.add(strut);

    // Footpad
    const padGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.08, 16);
    const pad = new THREE.Mesh(padGeo, goldFoilMat);
    pad.position.set(lx, 0.04, lz);
    pad.castShadow = true;
    group.add(pad);

    // Ladder on front-left leg
    if (idx === 0) {
      const ladderGeo = new THREE.BoxGeometry(0.35, 2.0, 0.06);
      const ladder = new THREE.Mesh(ladderGeo, silverTitaniumMat);
      ladder.position.set(lx * 0.55, 0.95, lz * 0.55);
      ladder.quaternion.copy(strut.quaternion);
      group.add(ladder);
    }
  });

  // Variant specific accessories
  if (variant.includes('11')) {
    // EASEP seismic unit beside the lander
    const easepGeo = new THREE.BoxGeometry(0.8, 0.4, 0.6);
    const easep = new THREE.Mesh(easepGeo, silverTitaniumMat);
    easep.position.set(3.2, 0.2, -2.5);
    group.add(easep);
  } else if (variant.includes('14')) {
    // MET two-wheeled cart parked beside
    const metGeo = new THREE.BoxGeometry(0.8, 0.35, 1.1);
    const met = new THREE.Mesh(metGeo, silverTitaniumMat);
    met.position.set(-3.5, 0.3, 2.2);
    group.add(met);
  } else if (variant.includes('16')) {
    // George Carruthers Far-UV Camera tripod
    const uvGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.6, 12);
    const uvMesh = new THREE.Mesh(uvGeo, goldFoilMat);
    uvMesh.position.set(2.8, 0.6, 3.0);
    uvMesh.rotateX(0.4);
    group.add(uvMesh);
  }

  return group;
}

/**
 * Surveyor 3 Robotic Soft Lander
 */
export function createSurveyorLander(): THREE.Group {
  const group = new THREE.Group();

  // Tripod landing legs
  const legCount = 3;
  for (let i = 0; i < legCount; i++) {
    const angle = (i * Math.PI * 2) / 3;
    const lx = Math.cos(angle) * 2.1;
    const lz = Math.sin(angle) * 2.1;

    const strut = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 1.8, 8),
      silverTitaniumMat
    );
    strut.position.set(lx * 0.5, 0.6, lz * 0.5);
    strut.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(lx, -0.9, lz).normalize()
    );
    group.add(strut);

    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.06, 12), silverTitaniumMat);
    pad.position.set(lx, 0.03, lz);
    group.add(pad);
  }

  // Central triangular space frame
  const frameGeo = new THREE.ConeGeometry(0.9, 1.1, 3);
  const frame = new THREE.Mesh(frameGeo, silverTitaniumMat);
  frame.position.y = 1.0;
  group.add(frame);

  // Mast & Planar Solar Panel
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.4, 8), silverTitaniumMat);
  mast.position.y = 1.9;
  group.add(mast);

  const solar = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.03, 0.65), solarPanelMat);
  solar.position.set(0, 2.5, 0);
  solar.rotateX(0.3);
  group.add(solar);

  // TV Camera Turret (retrieved by Apollo 12)
  const cam = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.35, 12), silverTitaniumMat);
  cam.position.set(0.4, 1.1, 0.3);
  group.add(cam);

  // Soil sampler scoop arm extended into ground trench
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.2, 8), darkAlloyMat);
  arm.position.set(-0.6, 0.3, 0.5);
  arm.rotateZ(1.1);
  group.add(arm);

  return group;
}

/**
 * Apollo Lunar Roving Vehicle (LRV)
 */
export function createLunarRovingVehicle(tapeFender = false): THREE.Group {
  const group = new THREE.Group();

  // Tubular chassis
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.15, 2.6), silverTitaniumMat);
  chassis.position.y = 0.55;
  chassis.castShadow = true;
  group.add(chassis);

  // 4 Wire mesh open lunar wheels
  const wheelPositions = [
    { x: -0.95, z: -0.9 },
    { x: 0.95, z: -0.9 },
    { x: -0.95, z: 0.9 },
    { x: 0.95, z: 0.9 },
  ];
  const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.24, 16);
  wheelGeo.rotateZ(Math.PI / 2);

  wheelPositions.forEach((wp, idx) => {
    const wheel = new THREE.Mesh(wheelGeo, darkAlloyMat);
    wheel.position.set(wp.x, 0.4, wp.z);
    wheel.castShadow = true;
    group.add(wheel);

    // Apollo 17 taped map fender repair on rear-right wheel
    if (tapeFender && idx === 3) {
      const tapeFenderMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.05, 0.6),
        new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 })
      );
      tapeFenderMesh.position.set(wp.x, 0.7, wp.z);
      group.add(tapeFenderMesh);
    }
  });

  // Folded crew seats
  const seatL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.45, 0.45), whiteThermalMat);
  seatL.position.set(-0.35, 0.8, -0.1);
  group.add(seatL);

  const seatR = seatL.clone();
  seatR.position.x = 0.35;
  group.add(seatR);

  // T-handle steering console
  const consoleMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.6, 8), darkAlloyMat);
  consoleMesh.position.set(0, 0.85, 0.35);
  group.add(consoleMesh);

  // High-gain mesh dish antenna
  const dish = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.1, 0.1, 16, 1, true),
    silverTitaniumMat
  );
  dish.position.set(0.6, 1.3, -1.0);
  dish.rotateX(0.6);
  group.add(dish);

  return group;
}

/**
 * Viking 1 & 2 Mars Lander
 */
export function createVikingLander(): THREE.Group {
  const group = new THREE.Group();

  // Hexagonal lander body
  const body = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 0.6, 6), silverTitaniumMat);
  body.position.y = 0.75;
  body.castShadow = true;
  group.add(body);

  // 3 Landing legs
  for (let i = 0; i < 3; i++) {
    const angle = (i * Math.PI * 2) / 3;
    const lx = Math.cos(angle) * 2.3;
    const lz = Math.sin(angle) * 2.3;

    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.4, 8), silverTitaniumMat);
    leg.position.set(lx * 0.5, 0.45, lz * 0.5);
    leg.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(lx, -0.7, lz).normalize()
    );
    group.add(leg);

    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.06, 12), silverTitaniumMat);
    pad.position.set(lx, 0.03, lz);
    group.add(pad);
  }

  // Twin RTG covers on deck
  const rtg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.5, 12), darkAlloyMat);
  rtg1.position.set(-0.55, 1.15, -0.3);
  group.add(rtg1);

  const rtg2 = rtg1.clone();
  rtg2.position.set(0.55, 1.15, -0.3);
  group.add(rtg2);

  // High gain dish antenna
  const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.08, 0.08, 16), silverTitaniumMat);
  dish.position.set(0, 1.45, 0.5);
  dish.rotateX(0.5);
  group.add(dish);

  // Meteorology boom
  const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.5, 8), silverTitaniumMat);
  boom.position.set(0.7, 1.6, 0.2);
  group.add(boom);

  // Surface sampling collector arm extended into dirt
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.8, 8), darkAlloyMat);
  arm.position.set(-0.8, 0.4, 1.0);
  arm.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(-1.2, -0.7, 1.2).normalize()
  );
  group.add(arm);

  return group;
}

/**
 * Mars Pathfinder & Sojourner Microrover
 */
export function createPathfinderAndSojourner(): THREE.Group {
  const group = new THREE.Group();

  // Triangular lander base petals resting on ground
  const petalMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.7 });
  for (let i = 0; i < 3; i++) {
    const angle = (i * Math.PI * 2) / 3;
    const petal = new THREE.Mesh(new THREE.ConeGeometry(1.6, 0.1, 3), petalMat);
    petal.position.set(Math.cos(angle) * 1.0, 0.05, Math.sin(angle) * 1.0);
    petal.rotation.y = angle;
    group.add(petal);
  }

  // Deflated airbag cushions surrounding base
  const airbagMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.9 });
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI * 2) / 6;
    const bag = new THREE.Mesh(new THREE.DodecahedronGeometry(0.45, 0), airbagMat);
    bag.position.set(Math.cos(angle) * 2.2, 0.25, Math.sin(angle) * 2.2);
    bag.scale.set(1.4, 0.6, 1.2);
    group.add(bag);
  }

  // Sojourner Microrover (10.6 kg miniature rover sitting nearby in the red dirt)
  const sojourner = new THREE.Group();
  sojourner.position.set(2.4, 0.15, 1.2);
  sojourner.rotation.y = 0.4;

  const sBody = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.65), silverTitaniumMat);
  sBody.castShadow = true;
  sojourner.add(sBody);

  const sSolar = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.02, 0.6), solarPanelMat);
  sSolar.position.y = 0.07;
  sojourner.add(sSolar);

  // 6 miniature wheels
  const sWheelGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.08, 12);
  sWheelGeo.rotateZ(Math.PI / 2);
  const swPositions = [
    { x: -0.3, z: -0.25 },
    { x: 0.3, z: -0.25 },
    { x: -0.3, z: 0 },
    { x: 0.3, z: 0 },
    { x: -0.3, z: 0.25 },
    { x: 0.3, z: 0.25 },
  ];
  swPositions.forEach((wp) => {
    const wheel = new THREE.Mesh(sWheelGeo, darkAlloyMat);
    wheel.position.set(wp.x, -0.06, wp.z);
    sojourner.add(wheel);
  });

  group.add(sojourner);

  return group;
}

/**
 * Spirit & Opportunity Rovers (MER) — Dormant in the dust
 */
export function createMERRover(isSpirit = false): THREE.Group {
  const group = new THREE.Group();

  // Chassis
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.45, 1.5), silverTitaniumMat);
  chassis.position.y = 0.65;
  chassis.castShadow = true;
  group.add(chassis);

  // Large solar array wings (covered with Martian reddish-brown dust)
  const solarWings = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.04, 1.7), dustySolarMat);
  solarWings.position.set(0, 0.9, 0);
  solarWings.castShadow = true;
  group.add(solarWings);

  // Rocker-bogie 6 wheels
  const wheelGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.18, 16);
  wheelGeo.rotateZ(Math.PI / 2);
  const wheelPositions = [
    { x: -0.85, z: -0.65 },
    { x: 0.85, z: -0.65 },
    { x: -0.9, z: 0.05 },
    { x: 0.9, z: 0.05 },
    { x: -0.85, z: 0.75 },
    { x: 0.85, z: 0.75 },
  ];

  wheelPositions.forEach((wp, idx) => {
    const wheel = new THREE.Mesh(wheelGeo, rustMetalMat);
    wheel.position.set(wp.x, 0.28, wp.z);

    // For Spirit: right front wheel seized and tilted in sand
    if (isSpirit && idx === 1) {
      wheel.position.y = 0.15;
      wheel.rotation.z = 0.35;
    }

    wheel.castShadow = true;
    group.add(wheel);
  });

  // Pancam Mast (tilted down in dormant sleep)
  const mast = new THREE.Group();
  mast.position.set(0, 0.9, -0.6);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.1, 8), darkAlloyMat);
  pole.position.y = 0.55;
  mast.add(pole);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.2), darkAlloyMat);
  head.position.y = 1.1;
  mast.add(head);

  // Tilted downward in permanent sleep
  mast.rotation.x = isSpirit ? 0.35 : 0.25;
  group.add(mast);

  return group;
}

/**
 * InSight Lander (Dormant with Seismometer Dome)
 */
export function createInSightLander(): THREE.Group {
  const group = new THREE.Group();

  // Central lander deck
  const deck = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.3, 0.45, 10), silverTitaniumMat);
  deck.position.y = 0.65;
  group.add(deck);

  // 3 Landing legs
  for (let i = 0; i < 3; i++) {
    const angle = (i * Math.PI * 2) / 3;
    const lx = Math.cos(angle) * 1.8;
    const lz = Math.sin(angle) * 1.8;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.1, 8), silverTitaniumMat);
    leg.position.set(lx * 0.5, 0.35, lz * 0.5);
    leg.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(lx, -0.6, lz).normalize()
    );
    group.add(leg);
  }

  // Twin decagonal circular solar wings (coated in red dust)
  const solarWingL = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.03, 10), dustySolarMat);
  solarWingL.position.set(-2.1, 0.7, 0);
  group.add(solarWingL);

  const solarWingR = solarWingL.clone();
  solarWingR.position.x = 2.1;
  group.add(solarWingR);

  // SEIS dome seismometer on the dirt with orange ribbon tether
  const seisDome = new THREE.Mesh(
    new THREE.SphereGeometry(0.4, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    whiteThermalMat
  );
  seisDome.position.set(0, 0.02, 2.3);
  group.add(seisDome);

  // Tether cable
  const tether = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.02, 1.8),
    new THREE.MeshStandardMaterial({ color: 0xea580c })
  );
  tether.position.set(0, 0.03, 1.3);
  group.add(tether);

  return group;
}

/**
 * Phoenix Polar Mars Lander
 */
export function createPhoenixLander(): THREE.Group {
  const group = new THREE.Group();

  const deck = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.3, 0.45, 8), silverTitaniumMat);
  deck.position.y = 0.65;
  group.add(deck);

  // 3 Legs
  for (let i = 0; i < 3; i++) {
    const angle = (i * Math.PI * 2) / 3;
    const lx = Math.cos(angle) * 1.7;
    const lz = Math.sin(angle) * 1.7;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.0, 8), silverTitaniumMat);
    leg.position.set(lx * 0.5, 0.35, lz * 0.5);
    leg.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(lx, -0.6, lz).normalize()
    );
    group.add(leg);
  }

  // Crushed / bowed solar wings (winter dry-ice damage)
  const wingL = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.03, 10), dustySolarMat);
  wingL.position.set(-1.8, 0.4, 0);
  wingL.rotation.z = -0.3; // Damaged / collapsed
  group.add(wingL);

  const wingR = wingL.clone();
  wingR.position.x = 1.8;
  wingR.rotation.z = 0.3;
  group.add(wingR);

  // Robotic backhoe arm digging into ground
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.0, 8), darkAlloyMat);
  arm.position.set(0, 0.3, 1.4);
  arm.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0.2, -0.8, 1.5).normalize()
  );
  group.add(arm);

  return group;
}

/**
 * Ingenuity Mars Helicopter (Valinor Hills — Flight 72 Damaged Rotor)
 */
export function createIngenuityHelicopter(): THREE.Group {
  const group = new THREE.Group();

  // Golden cubic avionics fuselage
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), goldFoilMat);
  body.position.y = 0.45;
  body.castShadow = true;
  group.add(body);

  // 4 Slender carbon fiber landing legs
  const legAngles = [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4];
  legAngles.forEach((angle) => {
    const lx = Math.cos(angle) * 0.42;
    const lz = Math.sin(angle) * 0.42;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.55, 6), darkAlloyMat);
    leg.position.set(lx * 0.5, 0.22, lz * 0.5);
    leg.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(lx, -0.4, lz).normalize()
    );
    group.add(leg);
  });

  // Vertical rotor mast
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.55, 8), darkAlloyMat);
  mast.position.y = 0.72;
  group.add(mast);

  // Square solar panel on top
  const solar = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.015, 0.32), solarPanelMat);
  solar.position.y = 0.98;
  group.add(solar);

  // Twin counter-rotating carbon rotor blades (with broken tip on upper blade from flight 72)
  const bladeMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 });
  const bladeLower = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.015, 0.08), bladeMat);
  bladeLower.position.y = 0.76;
  group.add(bladeLower);

  // Damaged upper blade (chipped on one tip)
  const bladeUpper = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.015, 0.08), bladeMat);
  bladeUpper.position.set(0.1, 0.88, 0);
  bladeUpper.rotation.y = 0.8;
  group.add(bladeUpper);

  return group;
}

/**
 * Curiosity & Perseverance Class Large Rovers
 */
export function createCuriosityPerseveranceRover(isPercy = false): THREE.Group {
  const group = new THREE.Group();

  // Large chassis
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.7, 2.6), whiteThermalMat);
  chassis.position.y = 0.95;
  chassis.castShadow = true;
  group.add(chassis);

  // Plutonium MMRTG finned cylinder on rear deck
  const rtg = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.75, 12), darkAlloyMat);
  rtg.position.set(0, 1.25, 1.2);
  rtg.rotateX(Math.PI / 2);
  group.add(rtg);

  // 6 Large grooved aluminum wheels
  const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.36, 16);
  wheelGeo.rotateZ(Math.PI / 2);
  const wheelPositions = [
    { x: -1.2, z: -1.0 },
    { x: 1.2, z: -1.0 },
    { x: -1.3, z: 0.1 },
    { x: 1.3, z: 0.1 },
    { x: -1.2, z: 1.1 },
    { x: 1.2, z: 1.1 },
  ];

  wheelPositions.forEach((wp) => {
    const wheel = new THREE.Mesh(wheelGeo, darkAlloyMat);
    wheel.position.set(wp.x, 0.45, wp.z);
    wheel.castShadow = true;
    group.add(wheel);
  });

  // Tall Mastcam Tower
  const mast = new THREE.Group();
  mast.position.set(0.3, 1.3, -1.0);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.3, 8), darkAlloyMat);
  pole.position.y = 0.65;
  mast.add(pole);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.25, 0.3), darkAlloyMat);
  head.position.y = 1.3;
  mast.add(head);
  group.add(mast);

  // 5-joint robotic arm with drill turret
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.6, 8), darkAlloyMat);
  arm.position.set(-0.6, 0.7, -1.3);
  arm.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(-0.3, -0.6, -1.2).normalize()
  );
  group.add(arm);

  // If Perseverance: sample depot tubes on the ground
  if (isPercy) {
    const tubeMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.95 });
    for (let i = 0; i < 3; i++) {
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8), tubeMat);
      tube.position.set(-1.8 + i * 0.4, 0.02, -2.0 - i * 0.2);
      tube.rotation.x = Math.PI / 2;
      group.add(tube);
    }
  }

  return group;
}

/**
 * Luna 9 Capsule & Lunokhod Rover
 */
export function createLunaMesh(isRover = false): THREE.Group {
  const group = new THREE.Group();

  if (!isRover) {
    // Luna 9 Spherical Capsule with 4 open petals
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.45, 16, 16), silverTitaniumMat);
    ball.position.y = 0.45;
    group.add(ball);

    // 4 petals unfolded on ground
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      const petal = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.03, 0.5), silverTitaniumMat);
      petal.position.set(Math.cos(angle) * 0.65, 0.03, Math.sin(angle) * 0.65);
      petal.rotation.y = angle;
      group.add(petal);
    }
  } else {
    // Lunokhod 1 (bathtub shaped 8-wheeled rover)
    const tub = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.7, 0.7, 16), silverTitaniumMat);
    tub.position.y = 0.65;
    group.add(tub);

    // Lid open
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.04, 16), solarPanelMat);
    lid.position.set(0, 1.05, -0.4);
    lid.rotateX(-0.5);
    group.add(lid);

    // 8 wheels
    const wGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.12, 12);
    wGeo.rotateZ(Math.PI / 2);
    for (let i = 0; i < 4; i++) {
      const z = -0.6 + i * 0.4;
      const wL = new THREE.Mesh(wGeo, darkAlloyMat);
      wL.position.set(-0.85, 0.2, z);
      group.add(wL);

      const wR = new THREE.Mesh(wGeo, darkAlloyMat);
      wR.position.set(0.85, 0.2, z);
      group.add(wR);
    }
  }

  return group;
}

/**
 * Main dispatcher to build the authentic 3D model for any given waypoint
 */
export function buildHistoricalArtifact(wp: SurfaceWaypoint): THREE.Group {
  const id = wp.id.toLowerCase();

  if (id.includes('apollo15') || id.includes('lrv')) {
    return createLunarRovingVehicle(id.includes('apollo17'));
  }
  if (id.includes('apollo')) {
    return createApolloLMDescentStage(id);
  }
  if (id.includes('surveyor')) {
    return createSurveyorLander();
  }
  if (id.includes('lunokhod')) {
    return createLunaMesh(true);
  }
  if (id.includes('luna9')) {
    return createLunaMesh(false);
  }
  if (id.includes('viking')) {
    return createVikingLander();
  }
  if (id.includes('pathfinder') || id.includes('sojourner')) {
    return createPathfinderAndSojourner();
  }
  if (id.includes('spirit')) {
    return createMERRover(true);
  }
  if (id.includes('opportunity')) {
    return createMERRover(false);
  }
  if (id.includes('phoenix')) {
    return createPhoenixLander();
  }
  if (id.includes('insight')) {
    return createInSightLander();
  }
  if (id.includes('ingenuity')) {
    return createIngenuityHelicopter();
  }
  if (id.includes('curiosity')) {
    return createCuriosityPerseveranceRover(false);
  }
  if (id.includes('perseverance')) {
    return createCuriosityPerseveranceRover(true);
  }

  // Fallback to lander
  return createApolloLMDescentStage(id);
}
