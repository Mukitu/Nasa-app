import * as THREE from 'three';

export interface AstronautActor {
  group: THREE.Group;
  torsoGroup: THREE.Group;
  headGroup: THREE.Group;
  leftArmGroup: THREE.Group;
  rightArmGroup: THREE.Group;
  leftLegGroup: THREE.Group;
  rightLegGroup: THREE.Group;
  plssBackpack: THREE.Group;
  walkCycle: number;
}

/**
 * Creates an authentic Apollo Lunar Extravehicular Mobility Unit (A7L) Astronaut
 * for interactive exploration of the Moon and Mars surfaces.
 */
export function createAstronautModel(environment: 'moon' | 'mars' = 'moon'): AstronautActor {
  const root = new THREE.Group();
  root.name = 'astronaut_character';

  // Materials
  const suitMat = new THREE.MeshStandardMaterial({
    color: environment === 'moon' ? 0xf8fafc : 0xf1f5f9,
    roughness: 0.75,
    metalness: 0.1,
  });

  const goldVisorMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    metalness: 0.96,
    roughness: 0.08,
  });

  const darkAlloyMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.8,
    roughness: 0.4,
  });

  const blueConnectorMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    metalness: 0.7,
    roughness: 0.3,
  });

  const redConnectorMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    metalness: 0.7,
    roughness: 0.3,
  });

  const grayBootMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    metalness: 0.3,
    roughness: 0.8,
  });

  // Commander red mission stripe material
  const stripeMat = new THREE.MeshStandardMaterial({
    color: 0xb91c1c,
    roughness: 0.5,
  });

  // Base torso group (Pivots at ground center, hips at y ~ 0.95m)
  const torsoGroup = new THREE.Group();
  torsoGroup.position.set(0, 0.95, 0);
  root.add(torsoGroup);

  // 1. Torso Pressure Suit Core
  const chestGeo = new THREE.CylinderGeometry(0.32, 0.28, 0.65, 16);
  const chestMesh = new THREE.Mesh(chestGeo, suitMat);
  chestMesh.position.set(0, 0.32, 0);
  chestMesh.castShadow = true;
  torsoGroup.add(chestMesh);

  // Red commander stripes on chest & waist (Pete Conrad / Apollo 12)
  const stripeGeo = new THREE.CylinderGeometry(0.325, 0.325, 0.04, 16);
  const stripeMesh = new THREE.Mesh(stripeGeo, stripeMat);
  stripeMesh.position.set(0, 0.45, 0);
  torsoGroup.add(stripeMesh);

  // 2. Chest RCU (Remote Control Unit)
  const rcuGeo = new THREE.BoxGeometry(0.24, 0.22, 0.14);
  const rcuMesh = new THREE.Mesh(rcuGeo, darkAlloyMat);
  rcuMesh.position.set(0, 0.35, 0.28);
  rcuMesh.castShadow = true;
  torsoGroup.add(rcuMesh);

  // RCU pressure gauge dial
  const gaugeGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.02, 12);
  gaugeGeo.rotateX(Math.PI / 2);
  const gaugeMesh = new THREE.Mesh(gaugeGeo, new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
  gaugeMesh.position.set(-0.06, 0.38, 0.35);
  torsoGroup.add(gaugeMesh);

  // Suit Hose Connectors (2 Blue, 2 Red)
  const connectorGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.06, 8);
  connectorGeo.rotateX(Math.PI / 2);

  const connB1 = new THREE.Mesh(connectorGeo, blueConnectorMat);
  connB1.position.set(-0.16, 0.28, 0.24);
  torsoGroup.add(connB1);

  const connB2 = new THREE.Mesh(connectorGeo, blueConnectorMat);
  connB2.position.set(-0.16, 0.20, 0.24);
  torsoGroup.add(connB2);

  const connR1 = new THREE.Mesh(connectorGeo, redConnectorMat);
  connR1.position.set(0.16, 0.28, 0.24);
  torsoGroup.add(connR1);

  const connR2 = new THREE.Mesh(connectorGeo, redConnectorMat);
  connR2.position.set(0.16, 0.20, 0.24);
  torsoGroup.add(connR2);

  // 3. PLSS Backpack (Portable Life Support System)
  const plssBackpack = new THREE.Group();
  plssBackpack.position.set(0, 0.38, -0.28);

  // Main white thermal casing
  const plssMainGeo = new THREE.BoxGeometry(0.44, 0.62, 0.22);
  const plssMain = new THREE.Mesh(plssMainGeo, suitMat);
  plssMain.castShadow = true;
  plssBackpack.add(plssMain);

  // Top OPS (Oxygen Purge System) module
  const opsGeo = new THREE.BoxGeometry(0.42, 0.16, 0.20);
  const opsMesh = new THREE.Mesh(opsGeo, suitMat);
  opsMesh.position.set(0, 0.36, 0);
  plssBackpack.add(opsMesh);

  // Communications whip antenna
  const antennaGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.75, 8);
  const antennaMesh = new THREE.Mesh(antennaGeo, darkAlloyMat);
  antennaMesh.position.set(0.16, 0.72, -0.05);
  plssBackpack.add(antennaMesh);

  // Umbilical hoses connecting PLSS to suit
  const hoseCurveL = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.18, 0.1, -0.1),
    new THREE.Vector3(-0.28, 0.15, 0.05),
    new THREE.Vector3(-0.18, 0.22, 0.22),
  ]);
  const hoseGeoL = new THREE.TubeGeometry(hoseCurveL, 12, 0.02, 6, false);
  const hoseMeshL = new THREE.Mesh(hoseGeoL, darkAlloyMat);
  plssBackpack.add(hoseMeshL);

  torsoGroup.add(plssBackpack);

  // 4. Head & Helmet Assembly
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.68, 0);
  torsoGroup.add(headGroup);

  // White helmet sphere
  const helmetGeo = new THREE.SphereGeometry(0.24, 20, 20);
  const helmetMesh = new THREE.Mesh(helmetGeo, suitMat);
  helmetMesh.castShadow = true;
  headGroup.add(helmetMesh);

  // Gold reflective extravehicular visor (LEVA)
  const visorGeo = new THREE.SphereGeometry(0.22, 16, 16, 0, Math.PI, 0, Math.PI / 1.7);
  visorGeo.rotateY(-Math.PI / 2);
  visorGeo.rotateX(-Math.PI / 12);
  const visorMesh = new THREE.Mesh(visorGeo, goldVisorMat);
  visorMesh.position.set(0, 0.02, 0.06);
  headGroup.add(visorMesh);

  // Helmet top visor shade
  const visorCapGeo = new THREE.CylinderGeometry(0.24, 0.25, 0.06, 16, 1, false, -Math.PI / 3, (2 * Math.PI) / 3);
  const visorCap = new THREE.Mesh(visorCapGeo, darkAlloyMat);
  visorCap.position.set(0, 0.18, 0.05);
  headGroup.add(visorCap);

  // 5. Left Arm Assembly
  const leftArmGroup = new THREE.Group();
  leftArmGroup.position.set(-0.36, 0.52, 0);
  torsoGroup.add(leftArmGroup);

  const shoulderL = new THREE.Mesh(new THREE.SphereGeometry(0.10, 12, 12), suitMat);
  leftArmGroup.add(shoulderL);

  const upperArmL = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.32, 12), suitMat);
  upperArmL.position.set(0, -0.16, 0);
  upperArmL.castShadow = true;
  leftArmGroup.add(upperArmL);

  const forearmL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.30, 12), suitMat);
  forearmL.position.set(0, -0.42, 0.06);
  forearmL.rotation.x = 0.35;
  forearmL.castShadow = true;
  leftArmGroup.add(forearmL);

  // Blue wrist disconnect ring & EVA glove
  const gloveL = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.14, 0.12), grayBootMat);
  gloveL.position.set(0, -0.60, 0.12);
  leftArmGroup.add(gloveL);

  // 6. Right Arm Assembly
  const rightArmGroup = new THREE.Group();
  rightArmGroup.position.set(0.36, 0.52, 0);
  torsoGroup.add(rightArmGroup);

  const shoulderR = new THREE.Mesh(new THREE.SphereGeometry(0.10, 12, 12), suitMat);
  rightArmGroup.add(shoulderR);

  const upperArmR = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.32, 12), suitMat);
  upperArmR.position.set(0, -0.16, 0);
  upperArmR.castShadow = true;
  rightArmGroup.add(upperArmR);

  const forearmR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.30, 12), suitMat);
  forearmR.position.set(0, -0.42, 0.06);
  forearmR.rotation.x = 0.35;
  forearmR.castShadow = true;
  rightArmGroup.add(forearmR);

  const gloveR = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.14, 0.12), grayBootMat);
  gloveR.position.set(0, -0.60, 0.12);
  rightArmGroup.add(gloveR);

  // Lunar Geological Sampling Tool in right hand
  const toolStaff = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.95, 8), darkAlloyMat);
  toolStaff.position.set(0.02, -0.65, 0.22);
  toolStaff.rotation.x = 0.3;
  rightArmGroup.add(toolStaff);

  const toolHead = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.16), darkAlloyMat);
  toolHead.position.set(0.02, -0.20, 0.35);
  rightArmGroup.add(toolHead);

  // 7. Left Leg Assembly
  const leftLegGroup = new THREE.Group();
  leftLegGroup.position.set(-0.16, 0.05, 0);
  torsoGroup.add(leftLegGroup);

  const thighL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.10, 0.44, 12), suitMat);
  thighL.position.set(0, -0.22, 0);
  thighL.castShadow = true;
  leftLegGroup.add(thighL);

  const shinL = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.09, 0.42, 12), suitMat);
  shinL.position.set(0, -0.62, 0.02);
  shinL.castShadow = true;
  leftLegGroup.add(shinL);

  // Lunar Overshoe / Boot (Wide ribbed tread for lunar dust)
  const bootL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.36), grayBootMat);
  bootL.position.set(0, -0.88, 0.08);
  bootL.castShadow = true;
  leftLegGroup.add(bootL);

  // 8. Right Leg Assembly
  const rightLegGroup = new THREE.Group();
  rightLegGroup.position.set(0.16, 0.05, 0);
  torsoGroup.add(rightLegGroup);

  const thighR = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.10, 0.44, 12), suitMat);
  thighR.position.set(0, -0.22, 0);
  thighR.castShadow = true;
  rightLegGroup.add(thighR);

  const shinR = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.09, 0.42, 12), suitMat);
  shinR.position.set(0, -0.62, 0.02);
  shinR.castShadow = true;
  rightLegGroup.add(shinR);

  const bootR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.36), grayBootMat);
  bootR.position.set(0, -0.88, 0.08);
  bootR.castShadow = true;
  rightLegGroup.add(bootR);

  return {
    group: root,
    torsoGroup,
    headGroup,
    leftArmGroup,
    rightArmGroup,
    leftLegGroup,
    rightLegGroup,
    plssBackpack,
    walkCycle: 0,
  };
}

/**
 * Animates the astronaut walking kinematics with authentic lunar low-gravity hop
 */
export function updateAstronautAnimation(
  actor: AstronautActor,
  isMoving: boolean,
  speed: number,
  delta: number
): void {
  if (isMoving && Math.abs(speed) > 0.05) {
    const stepFreq = Math.min(10, Math.max(3, Math.abs(speed) * 1.8));
    actor.walkCycle += delta * stepFreq;

    const angle = Math.sin(actor.walkCycle);
    const legSwing = 0.55 * angle;
    const armSwing = 0.45 * angle;

    // Opposite leg/arm swing
    actor.leftLegGroup.rotation.x = legSwing;
    actor.rightLegGroup.rotation.x = -legSwing;

    actor.leftArmGroup.rotation.x = -armSwing;
    actor.rightArmGroup.rotation.x = armSwing;

    // Characteristic lunar hop vertical bounce
    const bounce = Math.abs(Math.sin(actor.walkCycle * 2)) * 0.08;
    actor.torsoGroup.position.y = 0.95 + bounce;

    // Subtle torso sway
    actor.torsoGroup.rotation.z = Math.sin(actor.walkCycle) * 0.03;
    actor.torsoGroup.rotation.y = Math.sin(actor.walkCycle) * 0.04;
  } else {
    // Smoothly return to relaxed upright stance
    actor.leftLegGroup.rotation.x = THREE.MathUtils.lerp(actor.leftLegGroup.rotation.x, 0, delta * 8);
    actor.rightLegGroup.rotation.x = THREE.MathUtils.lerp(actor.rightLegGroup.rotation.x, 0, delta * 8);
    actor.leftArmGroup.rotation.x = THREE.MathUtils.lerp(actor.leftArmGroup.rotation.x, 0, delta * 8);
    actor.rightArmGroup.rotation.x = THREE.MathUtils.lerp(actor.rightArmGroup.rotation.x, 0, delta * 8);
    actor.torsoGroup.position.y = THREE.MathUtils.lerp(actor.torsoGroup.position.y, 0.95, delta * 8);
    actor.torsoGroup.rotation.z = THREE.MathUtils.lerp(actor.torsoGroup.rotation.z, 0, delta * 8);
    actor.torsoGroup.rotation.y = THREE.MathUtils.lerp(actor.torsoGroup.rotation.y, 0, delta * 8);
  }
}

/**
 * Sets the astronaut character pose (standing upright on foot vs seated driving inside rover)
 */
export function setAstronautPose(actor: AstronautActor, pose: 'standing' | 'driving'): void {
  if (pose === 'driving') {
    actor.torsoGroup.position.set(0, 0.48, 0);
    actor.torsoGroup.rotation.set(0.08, 0, 0);
    actor.leftLegGroup.rotation.set(-1.42, 0.05, 0);
    actor.rightLegGroup.rotation.set(-1.42, -0.05, 0);
    actor.leftArmGroup.rotation.set(0.75, 0.1, 0.15);
    actor.rightArmGroup.rotation.set(0.75, -0.1, -0.15);
  } else {
    actor.torsoGroup.position.set(0, 0.95, 0);
    actor.torsoGroup.rotation.set(0, 0, 0);
    actor.leftLegGroup.rotation.set(0, 0, 0);
    actor.rightLegGroup.rotation.set(0, 0, 0);
    actor.leftArmGroup.rotation.set(0, 0, 0);
    actor.rightArmGroup.rotation.set(0, 0, 0);
  }
}

