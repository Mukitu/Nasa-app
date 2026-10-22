import * as THREE from 'three';

export interface RoverActor {
  group: THREE.Group;
  chassis: THREE.Group;
  wheelMeshes: THREE.Mesh[];
  wheelPivots: THREE.Group[];
  mastMesh: THREE.Group;
  roboticArm: THREE.Group;
  antennaDish: THREE.Mesh;
  headlightLeft: THREE.SpotLight;
  headlightRight: THREE.SpotLight;
}

/**
 * Procedural Redesign of the Planetary Robotic Exploration Rover
 * 
 * Replaces the primitive box/diamond geometry with a realistic, high-fidelity
 * mechanical aerospace exploration vehicle featuring visible Rocker-Bogie
 * suspension, articulated robotic science arm, remote sensing mast, MMRTG power,
 * and high-gain communication dish.
 */
export function createRealisticRoverModel(environment: 'moon' | 'mars' = 'moon'): RoverActor {
  const root = new THREE.Group();
  root.name = 'robotic_rover_character';

  // Materials
  const chassisMat = new THREE.MeshStandardMaterial({
    color: environment === 'moon' ? 0xe2e8f0 : 0xf8fafc,
    metalness: 0.35,
    roughness: 0.3,
  });

  const goldFoilMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    metalness: 0.88,
    roughness: 0.22,
  });

  const darkTitaniumMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.85,
    roughness: 0.35,
  });

  const silverMetalMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.8,
    roughness: 0.25,
  });

  const wheelTreadMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.75,
    roughness: 0.5,
  });

  const solarPanelMat = new THREE.MeshStandardMaterial({
    color: 0x1e3a8a,
    metalness: 0.9,
    roughness: 0.15,
  });

  // 1. Central Chassis Group (Pivoting at center of vehicle)
  const chassis = new THREE.Group();
  chassis.position.set(0, 0.48, 0);
  root.add(chassis);

  // Lower Structural Equipment Tub (Warm Electronics Box - WEB)
  const lowerTubGeo = new THREE.BoxGeometry(1.4, 0.32, 2.0);
  const lowerTub = new THREE.Mesh(lowerTubGeo, chassisMat);
  lowerTub.castShadow = true;
  lowerTub.receiveShadow = true;
  chassis.add(lowerTub);

  // Gold MLI (Multi-Layer Insulation) side thermal blankets
  const foilSideL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.28, 1.8), goldFoilMat);
  foilSideL.position.set(-0.71, 0, 0);
  chassis.add(foilSideL);

  const foilSideR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.28, 1.8), goldFoilMat);
  foilSideR.position.set(0.71, 0, 0);
  chassis.add(foilSideR);

  // Upper Avionics & Science Payload Deck (Beveled contour)
  const upperDeckGeo = new THREE.BoxGeometry(1.3, 0.16, 1.7);
  const upperDeck = new THREE.Mesh(upperDeckGeo, chassisMat);
  upperDeck.position.set(0, 0.22, 0.1);
  upperDeck.castShadow = true;
  chassis.add(upperDeck);

  // Gold Solar Array Deck (Top paneling)
  const solarPanel = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.03, 1.4), solarPanelMat);
  solarPanel.position.set(0, 0.31, 0.12);
  chassis.add(solarPanel);

  // Astronaut Driver Cockpit Station (Apollo LRV style ergonomic bucket seat & T-handle tiller)
  const cockpitGroup = new THREE.Group();
  cockpitGroup.position.set(0, 0.32, 0.05);

  // High-durability seat base cushion
  const seatBaseGeo = new THREE.BoxGeometry(0.58, 0.08, 0.52);
  const seatMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.8,
    metalness: 0.2,
  });
  const seatBase = new THREE.Mesh(seatBaseGeo, seatMat);
  seatBase.position.set(0, 0.04, 0);
  seatBase.castShadow = true;
  cockpitGroup.add(seatBase);

  // Angled ergonomic backrest
  const seatBackGeo = new THREE.BoxGeometry(0.56, 0.58, 0.08);
  const seatBack = new THREE.Mesh(seatBackGeo, seatMat);
  seatBack.position.set(0, 0.34, 0.24);
  seatBack.rotation.x = -0.15;
  seatBack.castShadow = true;
  cockpitGroup.add(seatBack);

  // Tubular seat frame & roll bar
  const frameGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.72, 8);
  const frameL = new THREE.Mesh(frameGeo, darkTitaniumMat);
  frameL.position.set(-0.30, 0.36, 0.20);
  cockpitGroup.add(frameL);
  const frameR = new THREE.Mesh(frameGeo, darkTitaniumMat);
  frameR.position.set(0.30, 0.36, 0.20);
  cockpitGroup.add(frameR);

  // Driver Control Console & T-handle Tiller
  const consoleGeo = new THREE.BoxGeometry(0.24, 0.18, 0.15);
  const consoleMesh = new THREE.Mesh(consoleGeo, darkTitaniumMat);
  consoleMesh.position.set(0, 0.24, -0.34);
  cockpitGroup.add(consoleMesh);

  const tillerStemGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.22, 8);
  const tillerStem = new THREE.Mesh(tillerStemGeo, silverMetalMat);
  tillerStem.position.set(0, 0.38, -0.32);
  cockpitGroup.add(tillerStem);

  const tillerHandleGeo = new THREE.BoxGeometry(0.18, 0.03, 0.04);
  const tillerHandle = new THREE.Mesh(tillerHandleGeo, silverMetalMat);
  tillerHandle.position.set(0, 0.49, -0.32);
  cockpitGroup.add(tillerHandle);

  chassis.add(cockpitGroup);

  // Rear MMRTG (Multi-Mission Radioisotope Thermoelectric Generator) Power Unit
  const mmrtgGroup = new THREE.Group();
  mmrtgGroup.position.set(0, 0.22, 1.15);

  const mmrtgCylinder = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.24, 0.65, 16),
    darkTitaniumMat
  );
  mmrtgCylinder.rotateX(Math.PI / 2);
  mmrtgCylinder.castShadow = true;
  mmrtgGroup.add(mmrtgCylinder);

  // MMRTG Radiator Cooling Fins (8 Radial Fins)
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.62, 0.62), darkTitaniumMat);
    fin.rotateZ(angle);
    mmrtgGroup.add(fin);
  }
  chassis.add(mmrtgGroup);

  // 2. Visible Rocker-Bogie Suspension Assembly
  const suspensionGroup = new THREE.Group();
  chassis.add(suspensionGroup);

  // Differential cross-bridge tube across top of chassis
  const diffBar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 1.6, 12),
    darkTitaniumMat
  );
  diffBar.rotateZ(Math.PI / 2);
  diffBar.position.set(0, 0.28, -0.2);
  suspensionGroup.add(diffBar);

  // Left & Right Rocker-Bogie Main Struts
  [-1, 1].forEach((side) => {
    // Main Rocker Tube (Angled from top pivot to rear wheel and front bogie pivot)
    const rockerPivot = new THREE.Group();
    rockerPivot.position.set(side * 0.78, 0.15, -0.2);

    const rockerRearArm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 1.15, 8),
      silverMetalMat
    );
    rockerRearArm.position.set(0, -0.15, 0.55);
    rockerRearArm.rotation.x = -0.55;
    rockerPivot.add(rockerRearArm);

    const rockerFrontArm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 0.65, 8),
      silverMetalMat
    );
    rockerFrontArm.position.set(0, -0.1, -0.3);
    rockerFrontArm.rotation.x = 0.45;
    rockerPivot.add(rockerFrontArm);

    // Bogie Link Pivot between front and middle wheels
    const bogieArm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.95, 8),
      darkTitaniumMat
    );
    bogieArm.position.set(0, -0.22, -0.45);
    bogieArm.rotation.x = -0.15;
    rockerPivot.add(bogieArm);

    suspensionGroup.add(rockerPivot);
  });

  // 3. Remote Sensing Mast (Mastcam / SuperCam Head)
  const mastMesh = new THREE.Group();
  mastMesh.position.set(0.35, 0.32, -0.75);

  // Carbon-composite mast pole
  const mastPole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.045, 1.1, 12),
    darkTitaniumMat
  );
  mastPole.position.set(0, 0.55, 0);
  mastPole.castShadow = true;
  mastMesh.add(mastPole);

  // Mastcam Sensor Head Unit
  const camHead = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.22, 0.26),
    chassisMat
  );
  camHead.position.set(0, 1.15, 0);
  camHead.castShadow = true;

  // Dual stereo camera lenses (optical glass with cyan anti-reflective coating)
  const lensMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    roughness: 0.1,
    metalness: 0.9,
  });

  const lensL = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.08, 16), lensMat);
  lensL.rotateX(Math.PI / 2);
  lensL.position.set(-0.11, 0.02, -0.14);
  camHead.add(lensL);

  const lensR = lensL.clone();
  lensR.position.set(0.11, 0.02, -0.14);
  camHead.add(lensR);

  // SuperCam Laser Spectrometer Central Lens
  const superCamLens = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.06, 16), darkTitaniumMat);
  superCamLens.rotateX(Math.PI / 2);
  superCamLens.position.set(0, 0.06, -0.14);
  camHead.add(superCamLens);

  mastMesh.add(camHead);
  chassis.add(mastMesh);

  // 4. Articulated Robotic Science Arm (Turret & Core Drill)
  const roboticArm = new THREE.Group();
  roboticArm.position.set(-0.45, 0.16, -0.85);

  // Shoulder Azimuth Turret
  const armShoulder = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.14, 12), darkTitaniumMat);
  roboticArm.add(armShoulder);

  // Upper Arm Tube
  const armUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.55, 8), silverMetalMat);
  armUpper.position.set(0, 0.22, -0.15);
  armUpper.rotation.x = 0.55;
  armUpper.castShadow = true;
  roboticArm.add(armUpper);

  // Forearm Tube
  const armForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.50, 8), silverMetalMat);
  armForearm.position.set(0, 0.38, -0.42);
  armForearm.rotation.x = -0.35;
  armForearm.castShadow = true;
  roboticArm.add(armForearm);

  // Science Turret Tool Head (Drill & APXS Spectrometer)
  const armTurret = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.22), darkTitaniumMat);
  armTurret.position.set(0, 0.24, -0.62);

  const drillBit = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.03, 0.16, 8), silverMetalMat);
  drillBit.rotateX(Math.PI / 2);
  drillBit.position.set(0, -0.06, -0.16);
  armTurret.add(drillBit);

  roboticArm.add(armTurret);
  chassis.add(roboticArm);

  // 5. High-Gain Communications Dish Antenna
  const dishGroup = new THREE.Group();
  dishGroup.position.set(-0.35, 0.42, 0.55);

  const dishStem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.3, 8), silverMetalMat);
  dishStem.position.set(0, 0.15, 0);
  dishGroup.add(dishStem);

  const antennaDish = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.08, 0.12, 24),
    silverMetalMat
  );
  antennaDish.rotateX(0.45);
  antennaDish.rotateZ(0.25);
  antennaDish.position.set(0, 0.32, 0);
  antennaDish.castShadow = true;
  dishGroup.add(antennaDish);
  chassis.add(dishGroup);

  // UHF Low-Gain Helical Stick Antenna
  const uhfAntenna = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.015, 0.65, 8),
    darkTitaniumMat
  );
  uhfAntenna.position.set(0.48, 0.55, 0.65);
  chassis.add(uhfAntenna);

  // 6. High-Power LED Headlights
  const headlightLeft = new THREE.SpotLight(0xfff7ed, 4.5, 35, Math.PI / 5, 0.35);
  headlightLeft.position.set(-0.55, 0.25, -1.05);
  headlightLeft.target.position.set(-0.55, -0.3, -8);
  chassis.add(headlightLeft);
  chassis.add(headlightLeft.target);

  const headlightRight = new THREE.SpotLight(0xfff7ed, 4.5, 35, Math.PI / 5, 0.35);
  headlightRight.position.set(0.55, 0.25, -1.05);
  headlightRight.target.position.set(0.55, -0.3, -8);
  chassis.add(headlightRight);
  chassis.add(headlightRight.target);

  // Headlight physical fixtures
  const lightHousingGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.08, 12);
  lightHousingGeo.rotateX(Math.PI / 2);
  const lightL = new THREE.Mesh(lightHousingGeo, darkTitaniumMat);
  lightL.position.set(-0.55, 0.25, -1.02);
  chassis.add(lightL);

  const lightR = new THREE.Mesh(lightHousingGeo, darkTitaniumMat);
  lightR.position.set(0.55, 0.25, -1.02);
  chassis.add(lightR);

  // 7. Six Professional Rocker-Bogie Exploration Wheels
  // Wheel Stations: 2 front steerable, 2 middle bogie, 2 rear steerable
  const wheelPositions = [
    { x: -1.08, y: -0.15, z: -0.95, steerable: true },
    { x: 1.08, y: -0.15, z: -0.95, steerable: true },
    { x: -1.18, y: -0.15, z: 0.05, steerable: false },
    { x: 1.18, y: -0.15, z: 0.05, steerable: false },
    { x: -1.08, y: -0.15, z: 1.05, steerable: true },
    { x: 1.08, y: -0.15, z: 1.05, steerable: true },
  ];

  const wheelMeshes: THREE.Mesh[] = [];
  const wheelPivots: THREE.Group[] = [];

  // Wheel Geometry with realistic tread profile
  const rimGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.32, 20);
  rimGeo.rotateZ(Math.PI / 2);

  wheelPositions.forEach((wp) => {
    const pivot = new THREE.Group();
    pivot.position.set(wp.x, wp.y, wp.z);

    // Motor Hub Knuckle
    const knuckle = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.14, 12), darkTitaniumMat);
    knuckle.rotateZ(Math.PI / 2);
    pivot.add(knuckle);

    // Wheel Main Rim
    const wheel = new THREE.Mesh(rimGeo, wheelTreadMat);
    wheel.castShadow = true;
    wheel.receiveShadow = true;
    wheel.userData = { steerable: wp.steerable, isRear: wp.z > 0.5 };

    // Metallic curved spoke accents inside wheel hub
    const spokeInner = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.24, 0.33, 8),
      silverMetalMat
    );
    spokeInner.rotateZ(Math.PI / 2);
    wheel.add(spokeInner);

    pivot.add(wheel);
    chassis.add(pivot);

    wheelPivots.push(pivot);
    wheelMeshes.push(wheel);
  });

  return {
    group: root,
    chassis,
    wheelMeshes,
    wheelPivots,
    mastMesh,
    roboticArm,
    antennaDish,
    headlightLeft,
    headlightRight,
  };
}
