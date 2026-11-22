import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { TERMINAL_3D_ENTITIES, Terminal3DEntity } from "./terminal3DData";
import { Plus, Minus, RotateCw, RefreshCw, Home, MapPin } from "lucide-react";

interface PortTerminal3DSceneProps {
  selectedEntityId: string;
  onSelectEntity: (entity: Terminal3DEntity) => void;
  inspectorOpen?: boolean;
}

interface ProjectedPin {
  id: string;
  code: string;
  statusLabel: string;
  statusTone: "BLUE" | "GREEN" | "AMBER" | "SLATE";
  x: number;
  y: number;
  visible: boolean;
}

// Pre-allocated math helpers at module scope (Zero GC in render loop)
const _projVec = new THREE.Vector3();
const _targetCamPos = new THREE.Vector3();
const _targetLookAt = new THREE.Vector3();

// Procedural Canvas Texture for Blue Route Path with White Chevrons (matching WareTrack video)
function createRoutePathTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#1d4ed8";
  ctx.fillRect(0, 0, 256, 64);

  // Subtle bright border edges
  ctx.fillStyle = "#60a5fa";
  ctx.fillRect(0, 0, 256, 5);
  ctx.fillRect(0, 59, 256, 5);

  // White directional chevron arrows
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (let x = 36; x < 256; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x - 12, 18);
    ctx.lineTo(x + 6, 32);
    ctx.lineTo(x - 12, 46);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.repeat.set(6, 1);
  tex.anisotropy = maxAnisotropy;
  return tex;
}

// Composite 7-Part Low-Poly Container Vessel Builder
function buildContainerVessel(
  hullColorHex: number,
  deckContainersColor: number[],
  scale = 1
): THREE.Group {
  const group = new THREE.Group();

  // 1. Lower Hull (Extruded tapered ship shape)
  const hullShape = new THREE.Shape();
  hullShape.moveTo(-10, -2.4);
  hullShape.lineTo(7.5, -2.4);
  hullShape.lineTo(11, 0);
  hullShape.lineTo(7.5, 2.4);
  hullShape.lineTo(-10, 2.4);
  hullShape.closePath();

  const hullGeo = new THREE.ExtrudeGeometry(hullShape, {
    depth: 2.2,
    bevelEnabled: true,
    bevelThickness: 0.25,
    bevelSize: 0.2,
    bevelSegments: 2
  });
  hullGeo.rotateX(-Math.PI / 2);
  const hullMat = new THREE.MeshStandardMaterial({
    color: hullColorHex,
    roughness: 0.45,
    metalness: 0.25
  });
  const hullMesh = new THREE.Mesh(hullGeo, hullMat);
  hullMesh.castShadow = true;
  hullMesh.receiveShadow = true;
  group.add(hullMesh);

  // 2. Waterline Red Antifouling Base
  const baseGeo = new THREE.BoxGeometry(17.5, 0.5, 4.4);
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x991b1b,
    roughness: 0.7,
    metalness: 0.1
  });
  const baseMesh = new THREE.Mesh(baseGeo, baseMat);
  baseMesh.position.set(-1, 0.25, 0);
  group.add(baseMesh);

  // 3. White Bridge Superstructure (Aft)
  const bridgeGeo = new THREE.BoxGeometry(2.6, 3.4, 4.0);
  const bridgeMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.3,
    metalness: 0.1
  });
  const bridgeMesh = new THREE.Mesh(bridgeGeo, bridgeMat);
  bridgeMesh.position.set(-7.6, 3.8, 0);
  bridgeMesh.castShadow = true;
  group.add(bridgeMesh);

  // 4. Bridge Navigation Glass Visor
  const glassGeo = new THREE.BoxGeometry(2.75, 0.55, 4.15);
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.1,
    metalness: 0.85
  });
  const glassMesh = new THREE.Mesh(glassGeo, glassMat);
  glassMesh.position.set(-7.6, 4.9, 0);
  group.add(glassMesh);

  // 5. Funnel / Exhaust Stack
  const funnelGeo = new THREE.CylinderGeometry(0.45, 0.55, 1.8, 12);
  const funnelMat = new THREE.MeshStandardMaterial({
    color: 0xf97316,
    roughness: 0.5,
    metalness: 0.2
  });
  const funnelMesh = new THREE.Mesh(funnelGeo, funnelMat);
  funnelMesh.position.set(-8.2, 6.2, 0);
  group.add(funnelMesh);

  // 6. Stacked Deck Containers
  const contGeo = new THREE.BoxGeometry(2.1, 0.85, 1.05);
  for (let bx = -4.2; bx <= 5.5; bx += 2.35) {
    for (let bz = -1.2; bz <= 1.2; bz += 1.2) {
      const tiers = bx > 3 ? 2 : 3;
      for (let ty = 0; ty < tiers; ty++) {
        const cHex =
          deckContainersColor[
            Math.abs(Math.round(bx * 3 + bz * 2 + ty)) %
              deckContainersColor.length
          ];
        const cMat = new THREE.MeshStandardMaterial({
          color: cHex,
          roughness: 0.55,
          metalness: 0.15
        });
        const cMesh = new THREE.Mesh(contGeo, cMat);
        cMesh.position.set(bx, 2.7 + ty * 0.9, bz);
        cMesh.castShadow = true;
        cMesh.receiveShadow = true;
        group.add(cMesh);
      }
    }
  }

  group.scale.setScalar(scale);
  return group;
}

// Harbor Tugboat Builder (assisting arriving vessel MV ONE APUS)
function buildHarborTugboat(): THREE.Group {
  const group = new THREE.Group();
  const hullMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
  const deckMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.5 });
  const cabinMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.35 });

  const hull = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.1, 2.2), hullMat);
  hull.position.y = 0.4;
  hull.castShadow = true;
  group.add(hull);

  const deck = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.25, 1.9), deckMat);
  deck.position.y = 1.0;
  group.add(deck);

  const wheelhouse = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.3, 1.5), cabinMat);
  wheelhouse.position.set(0.3, 1.7, 0);
  wheelhouse.castShadow = true;
  group.add(wheelhouse);

  return group;
}

// Composite 6-Part Low-Poly Quay Crane (STS) Builder with Animated Hoist Cable & Container
function buildQuayCrane(accentColorHex: number): {
  group: THREE.Group;
  trolleyGroup: THREE.Group;
  cableMesh: THREE.Mesh;
  liftedContainer: THREE.Mesh;
} {
  const group = new THREE.Group();
  const frameMat = new THREE.MeshStandardMaterial({
    color: accentColorHex,
    roughness: 0.4,
    metalness: 0.45
  });
  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.65,
    metalness: 0.6
  });
  const cabinMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.25,
    metalness: 0.15
  });

  // 1. Four Portal Legs
  const legGeo = new THREE.BoxGeometry(0.45, 7.5, 0.45);
  const legOffsets: [number, number][] = [
    [-1.4, -2.0],
    [1.4, -2.0],
    [-1.4, 2.0],
    [1.4, 2.0]
  ];
  legOffsets.forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(legGeo, frameMat);
    leg.position.set(lx, 3.75, lz);
    leg.castShadow = true;
    group.add(leg);
  });

  // 2. Portal Crossbeams
  const beamGeo = new THREE.BoxGeometry(3.2, 0.5, 4.5);
  const beam = new THREE.Mesh(beamGeo, frameMat);
  beam.position.set(0, 7.4, 0);
  beam.castShadow = true;
  group.add(beam);

  // 3. Upper Machinery House
  const houseGeo = new THREE.BoxGeometry(2.4, 1.5, 3.2);
  const house = new THREE.Mesh(houseGeo, cabinMat);
  house.position.set(0, 8.4, -0.5);
  house.castShadow = true;
  group.add(house);

  // 4. Outstretched Quayside Boom (extending over the ship +Z and backreach -Z)
  const boomGeo = new THREE.BoxGeometry(1.1, 0.45, 16.5);
  const boom = new THREE.Mesh(boomGeo, frameMat);
  boom.position.set(0, 7.8, 3.8);
  boom.castShadow = true;
  group.add(boom);

  // 5. High A-Frame Apex & Forestay Cables
  const apexGeo = new THREE.BoxGeometry(2.0, 3.6, 0.4);
  const apex = new THREE.Mesh(apexGeo, frameMat);
  apex.position.set(0, 10.6, 0.5);
  group.add(apex);

  // 6. Animated Trolley + Spreader + Lifted Container
  const trolleyGroup = new THREE.Group();
  trolleyGroup.position.set(0, 7.4, 5.5);

  const trolleyCar = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.4, 1.2),
    darkMetalMat
  );
  trolleyGroup.add(trolleyCar);

  const cableMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 3.6, 6),
    darkMetalMat
  );
  cableMesh.position.set(0, -1.8, 0);
  trolleyGroup.add(cableMesh);

  const liftedContainer = new THREE.Mesh(
    new THREE.BoxGeometry(1.9, 0.85, 0.95),
    new THREE.MeshStandardMaterial({
      color: 0xf97316,
      roughness: 0.45,
      metalness: 0.2
    })
  );
  liftedContainer.position.set(0, -3.7, 0);
  liftedContainer.castShadow = true;
  trolleyGroup.add(liftedContainer);

  group.add(trolleyGroup);
  return { group, trolleyGroup, cableMesh, liftedContainer };
}

// Composite 5-Part Low-Poly Yard Truck Builder (matching WareTrack white/orange/blue/green trucks)
function buildYardTruck(
  containerColorHex: number,
  stripeColorHex = 0xf97316,
  hasContainer = true
): { group: THREE.Group; wheels: THREE.Mesh[] } {
  const group = new THREE.Group();
  const wheels: THREE.Mesh[] = [];

  const cabMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.25,
    metalness: 0.1
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.1,
    metalness: 0.85
  });
  const chassisMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.7,
    metalness: 0.4
  });
  const wheelMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.85,
    metalness: 0.1
  });

  // 1. Truck Cab (Front +X)
  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.35, 1.35), cabMat);
  cab.position.set(1.55, 0.95, 0);
  cab.castShadow = true;
  group.add(cab);

  // 2. Windshield Visor
  const visor = new THREE.Mesh(
    new THREE.BoxGeometry(1.34, 0.45, 1.38),
    glassMat
  );
  visor.position.set(1.58, 1.2, 0);
  group.add(visor);

  // 3. Trailer Chassis Bed
  const chassis = new THREE.Mesh(
    new THREE.BoxGeometry(4.2, 0.28, 1.3),
    chassisMat
  );
  chassis.position.set(0, 0.4, 0);
  chassis.castShadow = true;
  group.add(chassis);

  // 4. Six Rotating Wheels
  const wheelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.22, 12);
  wheelGeo.rotateX(Math.PI / 2);
  [-1.4, -0.5, 1.4].forEach((wx) => {
    [-0.68, 0.68].forEach((wz) => {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.position.set(wx, 0.3, wz);
      group.add(w);
      wheels.push(w);
    });
  });

  // 5. Loaded Container on Trailer
  if (hasContainer) {
    const contMat = new THREE.MeshStandardMaterial({
      color: containerColorHex,
      roughness: 0.45,
      metalness: 0.15
    });
    const cont = new THREE.Mesh(
      new THREE.BoxGeometry(2.85, 1.15, 1.28),
      contMat
    );
    cont.position.set(-0.55, 1.12, 0);
    cont.castShadow = true;
    cont.receiveShadow = true;
    group.add(cont);

    // Orange/Teal stripe accent on container side (like Cargoviva / Nordline in WareTrack video)
    const stripeMat = new THREE.MeshStandardMaterial({
      color: stripeColorHex,
      roughness: 0.4
    });
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(2.87, 0.24, 1.31),
      stripeMat
    );
    stripe.position.set(-0.55, 0.72, 0);
    group.add(stripe);
  }

  return { group, wheels };
}

// Low-Poly Yellow Forklift / Reachstacker Builder (matching the 2 yellow forklifts in WareTrack screenshot!)
function buildYardForklift(): {
  group: THREE.Group;
  forkCarriage: THREE.Group;
} {
  const group = new THREE.Group();
  const yellowMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.35,
    metalness: 0.2
  });
  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.7,
    metalness: 0.5
  });
  const crateMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    roughness: 0.65
  });

  // Body
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.85, 1.05), yellowMat);
  body.position.set(-0.2, 0.6, 0);
  body.castShadow = true;
  group.add(body);

  // Roll Cage Cab
  const cage = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.9, 0.95), darkMat);
  cage.position.set(-0.1, 1.35, 0);
  group.add(cage);

  // Vertical Mast Rails
  const mastL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.2, 0.12), darkMat);
  mastL.position.set(0.65, 1.15, -0.35);
  const mastR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.2, 0.12), darkMat);
  mastR.position.set(0.65, 1.15, 0.35);
  group.add(mastL, mastR);

  // Wheels
  const wheelGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.2, 10);
  wheelGeo.rotateX(Math.PI / 2);
  [
    [-0.6, -0.52],
    [-0.6, 0.52],
    [0.35, -0.52],
    [0.35, 0.52]
  ].forEach(([wx, wz]) => {
    const w = new THREE.Mesh(wheelGeo, darkMat);
    w.position.set(wx, 0.24, wz);
    group.add(w);
  });

  // Animated Fork Carriage + Pallet Box
  const forkCarriage = new THREE.Group();
  forkCarriage.position.set(0.95, 0.55, 0);
  const forks = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.08, 0.8), darkMat);
  const palletBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.65, 0.8),
    crateMat
  );
  palletBox.position.set(0.05, 0.36, 0);
  palletBox.castShadow = true;
  forkCarriage.add(forks, palletBox);
  group.add(forkCarriage);

  return { group, forkCarriage };
}

// Composite Container Yard Bay + Animated e-RTG Gantry Builder
function buildContainerBayBlock(
  palette: number[],
  isReefer = false
): { group: THREE.Group; rtgGantry: THREE.Group } {
  const group = new THREE.Group();

  // Concrete Pad with Slot Markings
  const padGeo = new THREE.BoxGeometry(11.5, 0.16, 7.5);
  const padMat = new THREE.MeshStandardMaterial({
    color: isReefer ? 0xdbeafe : 0xe2e8f0,
    roughness: 0.85,
    metalness: 0.05
  });
  const pad = new THREE.Mesh(padGeo, padMat);
  pad.position.set(0, 0.08, 0);
  pad.receiveShadow = true;
  group.add(pad);

  // Stacked Containers (4 columns × 3 rows × up to 3 tiers)
  const contGeo = new THREE.BoxGeometry(2.4, 0.95, 1.15);
  for (let cx = -3.9; cx <= 3.9; cx += 2.6) {
    for (let cz = -2.2; cz <= 2.2; cz += 1.45) {
      const maxTier = (Math.abs(Math.round(cx + cz)) % 3) + 1;
      for (let ty = 0; ty < maxTier; ty++) {
        const hex =
          palette[Math.abs(Math.round(cx * 2 + cz * 3 + ty)) % palette.length];
        const cMat = new THREE.MeshStandardMaterial({
          color: hex,
          roughness: 0.5,
          metalness: 0.15
        });
        const cMesh = new THREE.Mesh(contGeo, cMat);
        cMesh.position.set(cx, 0.65 + ty * 0.98, cz);
        cMesh.castShadow = true;
        cMesh.receiveShadow = true;
        group.add(cMesh);
      }
    }
  }

  // Animated e-RTG Yard Gantry Straddling the Bay
  const rtgGantry = new THREE.Group();
  const rtgMat = new THREE.MeshStandardMaterial({
    color: isReefer ? 0x0284c7 : 0x334155,
    roughness: 0.45,
    metalness: 0.5
  });
  const legGeo = new THREE.BoxGeometry(0.32, 4.8, 0.32);
  [
    [-1.8, -3.4],
    [1.8, -3.4],
    [-1.8, 3.4],
    [1.8, 3.4]
  ].forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(legGeo, rtgMat);
    leg.position.set(lx, 2.4, lz);
    leg.castShadow = true;
    rtgGantry.add(leg);
  });
  const topBeam = new THREE.Mesh(
    new THREE.BoxGeometry(4.0, 0.42, 7.2),
    rtgMat
  );
  topBeam.position.set(0, 4.8, 0);
  topBeam.castShadow = true;
  rtgGantry.add(topBeam);

  group.add(rtgGantry);
  return { group, rtgGantry };
}

// Selection Corner Brackets Builder (matching blue 3D selection box in WareTrack reference)
function buildSelectionBracketGroup(): THREE.Group {
  const group = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color: 0x2563eb });
  const barThickness = 0.14;
  const cornerLen = 1.2;

  const corners: [number, number, number][] = [
    [-1, -1, -1],
    [1, -1, -1],
    [-1, -1, 1],
    [1, -1, 1],
    [-1, 1, -1],
    [1, 1, -1],
    [-1, 1, 1],
    [1, 1, 1]
  ];

  corners.forEach(([sx, sy, sz]) => {
    const cornerGroup = new THREE.Group();
    cornerGroup.position.set(sx * 3.2, (sy + 1) * 1.4 + 0.2, sz * 1.8);

    const bx = new THREE.Mesh(
      new THREE.BoxGeometry(cornerLen, barThickness, barThickness),
      mat
    );
    bx.position.x = -sx * (cornerLen / 2);
    cornerGroup.add(bx);

    const by = new THREE.Mesh(
      new THREE.BoxGeometry(barThickness, cornerLen, barThickness),
      mat
    );
    by.position.y = -sy * (cornerLen / 2);
    cornerGroup.add(by);

    const bz = new THREE.Mesh(
      new THREE.BoxGeometry(barThickness, barThickness, cornerLen),
      mat
    );
    bz.position.z = -sz * (cornerLen / 2);
    cornerGroup.add(bz);

    group.add(cornerGroup);
  });

  return group;
}

export const PortTerminal3DScene: React.FC<PortTerminal3DSceneProps> = ({
  selectedEntityId,
  onSelectEntity,
  inspectorOpen = true
}) => {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const selectedIdRef = useRef<string>(selectedEntityId);
  const onSelectRef = useRef(onSelectEntity);
  onSelectRef.current = onSelectEntity;

  const cameraControlsRef = useRef<{
    zoomIn: () => void;
    zoomOut: () => void;
    rotateView: () => void;
    resetView: () => void;
    focusEntity: (entity: Terminal3DEntity) => void;
  } | null>(null);

  const [pins, setPins] = useState<ProjectedPin[]>([]);

  useEffect(() => {
    selectedIdRef.current = selectedEntityId;
    const entity = TERMINAL_3D_ENTITIES.find((e) => e.id === selectedEntityId);
    if (entity && cameraControlsRef.current) {
      cameraControlsRef.current.focusEntity(entity);
    }
  }, [selectedEntityId]);

  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    // 1. Software WebGL detection per Three.js skill
    const isSoftwareGl = (() => {
      const gl = document.createElement("canvas").getContext("webgl2");
      if (!gl) return true;
      const ext = gl.getExtension("WEBGL_debug_renderer_info");
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || 960;
    const height = container.clientHeight || 620;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: "high-performance"
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(
      isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2)
    );
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xeaf1f8);
    scene.fog = new THREE.FogExp2(0xeaf1f8, 0.0042);

    // Studio Environment Reflection (RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(
      new RoomEnvironment(),
      0.04
    ).texture;
    pmremGenerator.dispose();

    // Camera & OrbitControls
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.5, 350);
    camera.position.set(16, 24, 42);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.07;
    controls.maxPolarAngle = Math.PI / 2 - 0.08;
    controls.minPolarAngle = 0.25;
    controls.minDistance = 12;
    controls.maxDistance = 110;
    controls.target.set(0, 1.5, 6);

    let cameraTransitionActive = false;
    _targetCamPos.set(16, 24, 42);
    _targetLookAt.set(0, 1.5, 6);

    controls.addEventListener("start", () => {
      cameraTransitionActive = false;
    });

    // 3-Point Warm/Cool Studio Daylight Rig
    const hemiLight = new THREE.HemisphereLight(0xf0f7ff, 0xcbd5e1, 0.85);
    hemiLight.position.set(0, 60, 0);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfffbeb, 1.65);
    sunLight.position.set(35, 55, 38);
    sunLight.castShadow = !isSoftwareGl;
    const d = 55;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.camera.near = 5;
    sunLight.shadow.camera.far = 140;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.bias = -0.0005;
    sunLight.shadow.normalBias = 0.02;
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0xbae6fd, 0.45);
    fillLight.position.set(-40, 28, -25);
    scene.add(fillLight);

    // =========================================================================
    // PORT TERMINAL TERRAIN, QUAY WALL, ROADS & WATERWAY
    // =========================================================================
    // 1. Concrete Terminal Yard Ground
    const yardGeo = new THREE.BoxGeometry(160, 1.2, 65);
    const yardMat = new THREE.MeshStandardMaterial({
      color: 0xe6edf5,
      roughness: 0.88,
      metalness: 0.04
    });
    const yardMesh = new THREE.Mesh(yardGeo, yardMat);
    yardMesh.position.set(0, -0.6, -15);
    yardMesh.receiveShadow = true;
    scene.add(yardMesh);

    // 2. Quay Edge Apron & Coping Beam
    const quayEdge = new THREE.Mesh(
      new THREE.BoxGeometry(160, 1.3, 1.8),
      new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.7 })
    );
    quayEdge.position.set(0, -0.5, 17.5);
    quayEdge.receiveShadow = true;
    scene.add(quayEdge);

    // 3. Deep Waterway Channel (+Z)
    const waterGeo = new THREE.PlaneGeometry(220, 90);
    waterGeo.rotateX(-Math.PI / 2);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0xbae6fd,
      roughness: 0.22,
      metalness: 0.15
    });
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.position.set(0, -0.45, 62);
    waterMesh.receiveShadow = true;
    scene.add(waterMesh);

    // 4. Paved Terminal Roads (Offset Y by +0.03 to prevent Z-fighting)
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0xd5dfec,
      roughness: 0.8,
      metalness: 0.05
    });
    const quayRoad = new THREE.Mesh(new THREE.PlaneGeometry(130, 5.5), roadMat);
    quayRoad.rotation.x = -Math.PI / 2;
    quayRoad.position.set(0, 0.03, 13.5);
    quayRoad.receiveShadow = true;
    scene.add(quayRoad);

    const centralRoad = new THREE.Mesh(
      new THREE.PlaneGeometry(130, 5.5),
      roadMat
    );
    centralRoad.rotation.x = -Math.PI / 2;
    centralRoad.position.set(0, 0.03, 5.8);
    centralRoad.receiveShadow = true;
    scene.add(centralRoad);

    // 5. Guided Blue Truck Route Path with Animated White Chevrons (matching WareTrack video)
    const routeTex = createRoutePathTexture(
      renderer.capabilities.getMaxAnisotropy()
    );
    const routeMat = new THREE.MeshBasicMaterial({
      map: routeTex,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1
    });
    const routeStrip1 = new THREE.Mesh(
      new THREE.PlaneGeometry(24, 1.65),
      routeMat
    );
    routeStrip1.rotation.x = -Math.PI / 2;
    routeStrip1.position.set(-13.5, 0.05, 6.0);
    scene.add(routeStrip1);

    const routeStrip2 = new THREE.Mesh(
      new THREE.PlaneGeometry(1.65, 10.5),
      routeMat
    );
    routeStrip2.rotation.x = -Math.PI / 2;
    routeStrip2.position.set(-2, 0.05, 1.5);
    scene.add(routeStrip2);

    // 6. Terminal Cross-Dock Warehouse & Solar Roof (Background -Z)
    const whGroup = new THREE.Group();
    const whBody = new THREE.Mesh(
      new THREE.BoxGeometry(28, 6.5, 12),
      new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.5 })
    );
    whBody.position.set(0, 3.25, -24);
    whBody.castShadow = true;
    whBody.receiveShadow = true;
    whGroup.add(whBody);

    const whRoof = new THREE.Mesh(
      new THREE.BoxGeometry(28.8, 0.6, 12.8),
      new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.35 })
    );
    whRoof.position.set(0, 6.6, -24);
    whGroup.add(whRoof);
    scene.add(whGroup);

    // 7. Two Animated Yellow Yard Forklifts + Wooden Pallet Stacks (matching WareTrack reference image!)
    const forklift1 = buildYardForklift();
    forklift1.group.position.set(-6.5, 0, 1.8);
    forklift1.group.rotation.y = Math.PI / 2;
    scene.add(forklift1.group);

    const forklift2 = buildYardForklift();
    forklift2.group.position.set(-3.8, 0, 1.8);
    forklift2.group.rotation.y = -Math.PI / 2;
    scene.add(forklift2.group);

    // Low-Poly Trees along Terminal Perimeter
    const treeTrunkGeo = new THREE.CylinderGeometry(0.18, 0.24, 1.2, 8);
    const treeCrownGeo = new THREE.SphereGeometry(1.15, 12, 10);
    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x78350f,
      roughness: 0.8
    });
    const crownMat = new THREE.MeshStandardMaterial({
      color: 0x4ade80,
      roughness: 0.65
    });
    [
      [-34, -18],
      [-26, -22],
      [20, -22],
      [32, -18],
      [-34, 4],
      [38, 4]
    ].forEach(([tx, tz]) => {
      const tGroup = new THREE.Group();
      const trunk = new THREE.Mesh(treeTrunkGeo, trunkMat);
      trunk.position.y = 0.6;
      const crown = new THREE.Mesh(treeCrownGeo, crownMat);
      crown.position.y = 1.9;
      crown.scale.set(1, 1.25, 1);
      crown.castShadow = true;
      tGroup.add(trunk, crown);
      tGroup.position.set(tx, 0, tz);
      scene.add(tGroup);
    });

    // =========================================================================
    // BUILD CLICKABLE TERMINAL ENTITIES (VESSELS, CRANES, TRUCKS, BAYS)
    // =========================================================================
    const clickableProxies: THREE.Mesh[] = [];
    const entityGroups = new Map<string, THREE.Object3D>();
    const entityProxies = new Map<string, THREE.Mesh>();
    const craneAnimRefs: {
      trolley: THREE.Group;
      cable: THREE.Mesh;
      container: THREE.Mesh;
      phase: number;
    }[] = [];
    const rtgAnimRefs: { gantry: THREE.Group; phase: number }[] = [];

    const registerClickable = (
      id: string,
      visualGroup: THREE.Object3D,
      boxSize: [number, number, number]
    ) => {
      entityGroups.set(id, visualGroup);
      const proxy = new THREE.Mesh(
        new THREE.BoxGeometry(boxSize[0], boxSize[1], boxSize[2]),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      proxy.position.copy(visualGroup.position);
      proxy.position.y += boxSize[1] * 0.45;
      proxy.layers.set(1);
      proxy.userData.entityId = id;
      scene.add(proxy);
      clickableProxies.push(proxy);
      entityProxies.set(id, proxy);
    };

    // 1. Three Vessels + Escort Harbor Tugboat
    const vsl1 = buildContainerVessel(
      0x0284c7,
      [0x2563eb, 0xf97316, 0x10b981, 0xeab308],
      1.15
    );
    vsl1.position.set(0, -0.35, 23.5);
    scene.add(vsl1);
    registerClickable("VSL-01", vsl1, [24, 8, 7]);

    const vsl2 = buildContainerVessel(
      0xdb2777,
      [0xdb2777, 0x3b82f6, 0xf8fafc],
      1.05
    );
    vsl2.position.set(34, -0.35, 28.0);
    scene.add(vsl2);
    registerClickable("VSL-02", vsl2, [22, 8, 7]);

    const escortTug = buildHarborTugboat();
    escortTug.position.set(24, -0.35, 25.2);
    escortTug.rotation.y = 0.25;
    scene.add(escortTug);

    const vsl3 = buildContainerVessel(
      0x0d9488,
      [0x0d9488, 0xf59e0b, 0x2563eb],
      0.95
    );
    vsl3.position.set(-34, -0.35, 26.5);
    scene.add(vsl3);
    registerClickable("VSL-03", vsl3, [20, 8, 7]);

    // 2. Four Quay Cranes
    const craneSpecs: {
      id: string;
      x: number;
      color: number;
      active: boolean;
    }[] = [
      { id: "STS-01", x: -8, color: 0x0284c7, active: true },
      { id: "STS-02", x: 0, color: 0x2563eb, active: true },
      { id: "STS-03", x: 8, color: 0x0284c7, active: true },
      { id: "STS-04", x: 26, color: 0x64748b, active: false }
    ];
    craneSpecs.forEach((cs, idx) => {
      const { group, trolleyGroup, cableMesh, liftedContainer } =
        buildQuayCrane(cs.color);
      group.position.set(cs.x, 0, 15.8);
      scene.add(group);
      if (cs.active) {
        craneAnimRefs.push({
          trolley: trolleyGroup,
          cable: cableMesh,
          container: liftedContainer,
          phase: idx * 1.6
        });
      }
      registerClickable(cs.id, group, [4.5, 11, 16]);
    });

    // 3. Four Animated Yard Trucks (Driving & Turning Along Lanes)
    const truckSpecs: {
      id: string;
      pos: [number, number, number];
      rotY: number;
      color: number;
      stripe: number;
    }[] = [
      {
        id: "TRK-2481",
        pos: [-2, 0, 6.0],
        rotY: -Math.PI / 2,
        color: 0xffffff,
        stripe: 0xf97316
      },
      {
        id: "TRK-1092",
        pos: [-8, 0, 13.5],
        rotY: 0,
        color: 0xffffff,
        stripe: 0x0d9488
      },
      {
        id: "TRK-4018",
        pos: [14, 0, -3.2],
        rotY: Math.PI,
        color: 0xf8fafc,
        stripe: 0x0284c7
      },
      {
        id: "TRK-3105",
        pos: [8, 0, 5.8],
        rotY: Math.PI / 2,
        color: 0x2563eb,
        stripe: 0xf59e0b
      }
    ];
    const truckAnimMap = new Map<
      string,
      { group: THREE.Group; proxy: THREE.Mesh; wheels: THREE.Mesh[] }
    >();

    truckSpecs.forEach((ts) => {
      const { group: tGroup, wheels } = buildYardTruck(
        ts.color,
        ts.stripe,
        true
      );
      tGroup.position.set(ts.pos[0], ts.pos[1], ts.pos[2]);
      tGroup.rotation.y = ts.rotY;
      scene.add(tGroup);
      registerClickable(ts.id, tGroup, [5.2, 3.2, 2.8]);
      const proxy = entityProxies.get(ts.id)!;
      truckAnimMap.set(ts.id, { group: tGroup, proxy, wheels });
    });

    // 4. Four Container Yard Bays with Animated e-RTG Gantries
    const baySpecs: {
      id: string;
      x: number;
      palette: number[];
      isReefer?: boolean;
    }[] = [
      { id: "BAY-A1", x: -18, palette: [0x2563eb, 0xf97316, 0x0284c7] },
      { id: "BAY-B2", x: -2, palette: [0xf97316, 0x2563eb, 0x10b981] },
      {
        id: "BAY-R1",
        x: 14,
        palette: [0xf8fafc, 0x38bdf8, 0xe2e8f0],
        isReefer: true
      },
      { id: "BAY-C1", x: 28, palette: [0xdb2777, 0x3b82f6, 0xf59e0b] }
    ];
    baySpecs.forEach((bs, idx) => {
      const { group: bayGroup, rtgGantry } = buildContainerBayBlock(
        bs.palette,
        bs.isReefer
      );
      bayGroup.position.set(bs.x, 0, -8.5);
      scene.add(bayGroup);
      rtgAnimRefs.push({ gantry: rtgGantry, phase: idx * 1.3 });
      registerClickable(bs.id, bayGroup, [12, 5.5, 8.5]);
    });

    // 5. 3D Blue Selection Corner Bracket Box (matching WareTrack reference)
    const selectionBrackets = buildSelectionBracketGroup();
    scene.add(selectionBrackets);

    // Pre-compile shaders on hardware GPUs
    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Expose camera controls to React HUD buttons
    cameraControlsRef.current = {
      zoomIn: () => {
        cameraTransitionActive = false;
        camera.position.lerp(controls.target, 0.18);
        controls.update();
      },
      zoomOut: () => {
        cameraTransitionActive = false;
        const offset = camera.position
          .clone()
          .sub(controls.target)
          .multiplyScalar(1.22);
        camera.position.copy(controls.target).add(offset);
        controls.update();
      },
      rotateView: () => {
        cameraTransitionActive = false;
        const offset = camera.position.clone().sub(controls.target);
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 6);
        camera.position.copy(controls.target).add(offset);
        controls.update();
      },
      resetView: () => {
        _targetLookAt.set(0, 1.5, 6);
        _targetCamPos.set(16, 24, 42);
        cameraTransitionActive = true;
      },
      focusEntity: (entity: Terminal3DEntity) => {
        const liveObj = entityGroups.get(entity.id);
        const lx = liveObj ? liveObj.position.x : entity.position3D[0];
        const lz = liveObj ? liveObj.position.z : entity.position3D[2];
        _targetLookAt.set(lx, entity.position3D[1] * 0.5, lz);
        _targetCamPos.set(
          entity.cameraOffset[0],
          entity.cameraOffset[1],
          entity.cameraOffset[2]
        );
        cameraTransitionActive = true;
      }
    };

    // Focus initial selected entity
    const initEnt = TERMINAL_3D_ENTITIES.find(
      (e) => e.id === selectedIdRef.current
    );
    if (initEnt) {
      cameraControlsRef.current.focusEntity(initEnt);
    }

    // Raycasting on Click
    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1);
    const pointer = new THREE.Vector2();
    let downX = 0;
    let downY = 0;

    const onPointerDown = (e: PointerEvent) => {
      downX = e.clientX;
      downY = e.clientY;
    };

    const onPointerUp = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 6) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(clickableProxies, false);
      if (hits.length > 0) {
        const hitId = hits[0].object.userData.entityId;
        const found = TERMINAL_3D_ENTITIES.find((item) => item.id === hitId);
        if (found) {
          onSelectRef.current(found);
        }
      }
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointerup", onPointerUp);

    // Resize listener + ResizeObserver for container flex resizing
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || 960;
      const h = container.clientHeight || 620;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);
    const resizeObserver = new ResizeObserver(() => onResize());
    resizeObserver.observe(container);

    // Software WebGL fence-paced loop helper
    let frameId = 0;
    let disposed = false;
    const clock = new THREE.Clock();
    let pinUpdateCounter = 0;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    // Key entities to project floating 3D pins for
    const pinEntityIds = [
      "TRK-2481",
      "TRK-1092",
      "VSL-01",
      "VSL-02",
      "STS-02",
      "BAY-B2",
      "BAY-R1"
    ];

    function tick() {
      if (disposed) return;
      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();

      // 1. Animate route arrows texture scroll along the blue GPS path
      routeTex.offset.x = -elapsed * 0.85;

      // 2. Quay Crane Trolley + Vertical Hoist Cycle Animation
      craneAnimRefs.forEach((ct) => {
        const cycle = elapsed * 0.65 + ct.phase;
        // Trolley glides between vessel deck (+7.2) and quayside lane (+0.5)
        ct.trolley.position.z = 3.8 + Math.sin(cycle) * 3.4;
        // Hoist lowers and raises container at endpoints
        const hoistDip = Math.max(0, Math.cos(cycle * 2)) * 1.15;
        ct.cable.scale.y = 1 + hoistDip * 0.28;
        ct.cable.position.y = -1.8 - hoistDip * 0.5;
        ct.container.position.y = -3.7 - hoistDip;
      });

      // 3. Yard e-RTG Gantries gliding along Container Bays
      rtgAnimRefs.forEach((rtg) => {
        rtg.gantry.position.x = Math.sin(elapsed * 0.4 + rtg.phase) * 2.2;
      });

      // 4. Two Yellow Forklifts operating & lifting pallets
      forklift1.group.position.z = 1.8 + Math.sin(elapsed * 0.9) * 1.6;
      forklift1.forkCarriage.position.y =
        0.75 + Math.abs(Math.sin(elapsed * 1.4)) * 0.7;
      forklift2.group.position.z = 1.8 + Math.cos(elapsed * 0.75) * 1.4;
      forklift2.forkCarriage.position.y =
        0.75 + Math.abs(Math.cos(elapsed * 1.2)) * 0.65;

      // 5. Multi-Waypoint L-Shaped Path Animation for Featured Truck TRK-2481 (along the Blue Route!)
      const trk2481 = truckAnimMap.get("TRK-2481");
      if (trk2481) {
        // 14-second continuous L-path cycle along the blue chevron strip:
        // Phase A (0..0.55): Drives East on central avenue from X=-16 to X=-2 at Z=6.0
        // Phase B (0.55..0.68): Smoothly turns 90° South into Bay B2 lane
        // Phase C (0.68..1.0): Drives South from Z=6.0 to Z=-2.2 into Container Bay B2
        const loopT = (elapsed * 0.085) % 1;
        let tx = -2;
        let tz = 6.0;
        let rotY = 0;

        if (loopT < 0.52) {
          const p = loopT / 0.52;
          tx = -16 + p * 14; // -16 -> -2
          tz = 6.0;
          rotY = 0; // Facing +X (East)
        } else if (loopT < 0.64) {
          const p = (loopT - 0.52) / 0.12;
          tx = -2;
          tz = 6.0 - p * 1.2;
          rotY = -p * (Math.PI / 2); // Smoothly turning South (-Z)
        } else {
          const p = (loopT - 0.64) / 0.36;
          tx = -2;
          tz = 4.8 - p * 7.2; // 4.8 -> -2.4 (Approaching Bay B2)
          rotY = -Math.PI / 2;
        }

        trk2481.group.position.set(tx, 0, tz);
        trk2481.group.rotation.y = rotY;
        trk2481.proxy.position.set(tx, 1.5, tz);
        trk2481.wheels.forEach((w) => {
          w.rotation.z = -elapsed * 5.0;
        });
      }

      // 6. Quayside Shuttle Animation for TRK-1092, TRK-3105, TRK-4018
      const trk1092 = truckAnimMap.get("TRK-1092");
      if (trk1092) {
        const xPos = -10 + Math.sin(elapsed * 0.45) * 4.5;
        trk1092.group.position.x = xPos;
        trk1092.proxy.position.x = xPos;
        trk1092.wheels.forEach((w) => {
          w.rotation.z = -elapsed * 3.5;
        });
      }

      const trk3105 = truckAnimMap.get("TRK-3105");
      if (trk3105) {
        const xPos = 8 + Math.cos(elapsed * 0.5) * 5.5;
        trk3105.group.position.x = xPos;
        trk3105.group.rotation.y = Math.sin(elapsed * 0.5) >= 0 ? Math.PI : 0;
        trk3105.proxy.position.x = xPos;
      }

      // 7. Vessel Water Buoyancy + Arriving Vessel MV ONE APUS + Harbor Tugboat Motion
      vsl1.position.y = -0.35 + Math.sin(elapsed * 1.1) * 0.08;
      vsl1.rotation.z = Math.sin(elapsed * 0.8) * 0.008;

      const approachOffset = Math.sin(elapsed * 0.25) * 2.2;
      vsl2.position.x = 34 + approachOffset;
      vsl2.position.y = -0.35 + Math.cos(elapsed * 1.0) * 0.09;
      const vsl2Proxy = entityProxies.get("VSL-02");
      if (vsl2Proxy) vsl2Proxy.position.x = vsl2.position.x;

      escortTug.position.x = 23.5 + approachOffset;
      escortTug.position.y = -0.35 + Math.sin(elapsed * 1.8) * 0.07;

      vsl3.position.x = -34 - Math.abs(Math.sin(elapsed * 0.2)) * 2.5;
      vsl3.position.y = -0.35 + Math.sin(elapsed * 1.2 + 1) * 0.08;
      const vsl3Proxy = entityProxies.get("VSL-03");
      if (vsl3Proxy) vsl3Proxy.position.x = vsl3.position.x;

      // 8. Position 3D Selection Brackets around currently selected entity (tracks moving truck/vessel!)
      const activeObj = entityGroups.get(selectedIdRef.current);
      if (activeObj) {
        selectionBrackets.visible = true;
        selectionBrackets.position.copy(activeObj.position);
        selectionBrackets.rotation.y = activeObj.rotation.y;
        const selEnt = TERMINAL_3D_ENTITIES.find(
          (e) => e.id === selectedIdRef.current
        );
        if (selEnt?.category === "VESSELS") {
          selectionBrackets.scale.set(3.4, 2.0, 1.8);
        } else if (selEnt?.category === "BAYS") {
          selectionBrackets.scale.set(1.9, 1.5, 2.2);
        } else if (selEnt?.category === "CRANES") {
          selectionBrackets.scale.set(0.9, 2.6, 2.2);
        } else {
          selectionBrackets.scale.set(0.85, 0.85, 0.85);
        }
      } else {
        selectionBrackets.visible = false;
      }

      // 9. Smooth Camera Damping on entity selection
      if (cameraTransitionActive) {
        camera.position.x = THREE.MathUtils.damp(
          camera.position.x,
          _targetCamPos.x,
          4.5,
          delta
        );
        camera.position.y = THREE.MathUtils.damp(
          camera.position.y,
          _targetCamPos.y,
          4.5,
          delta
        );
        camera.position.z = THREE.MathUtils.damp(
          camera.position.z,
          _targetCamPos.z,
          4.5,
          delta
        );
        controls.target.x = THREE.MathUtils.damp(
          controls.target.x,
          _targetLookAt.x,
          5.5,
          delta
        );
        controls.target.y = THREE.MathUtils.damp(
          controls.target.y,
          _targetLookAt.y,
          5.5,
          delta
        );
        controls.target.z = THREE.MathUtils.damp(
          controls.target.z,
          _targetLookAt.z,
          5.5,
          delta
        );
        if (camera.position.distanceToSquared(_targetCamPos) < 0.08) {
          cameraTransitionActive = false;
        }
      }

      controls.update();
      renderer.render(scene, camera);

      // 10. Project 3D Floating Pins to 2D Screen Coordinates (throttled every 2 frames for smooth tracking)
      pinUpdateCounter++;
      if (pinUpdateCounter % 2 === 0 && container) {
        const cw = container.clientWidth || 960;
        const ch = container.clientHeight || 620;
        const nextPins: ProjectedPin[] = [];

        pinEntityIds.forEach((id) => {
          const ent = TERMINAL_3D_ENTITIES.find((e) => e.id === id);
          const obj = entityGroups.get(id);
          if (!ent || !obj) return;
          _projVec.copy(obj.position);
          _projVec.y +=
            ent.category === "CRANES"
              ? 9.5
              : ent.category === "VESSELS"
              ? 6.2
              : 3.1;
          _projVec.project(camera);

          const sx = ((_projVec.x + 1) / 2) * cw;
          const sy = ((-_projVec.y + 1) / 2) * ch;
          const visible =
            _projVec.z < 1 &&
            sx > 40 &&
            sx < cw - 40 &&
            sy > 40 &&
            sy < ch - 40;
          nextPins.push({
            id: ent.id,
            code: ent.code,
            statusLabel: ent.statusLabel,
            statusTone: ent.statusTone,
            x: sx,
            y: sy,
            visible
          });
        });
        setPins(nextPins);
      }

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener("resize", onResize);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      controls.dispose();
      routeTex.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-full select-none overflow-hidden">
      {/* ISOLATED WEBGL CANVAS MOUNT */}
      <div
        ref={canvasMountRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* FLOATING 3D PIN BADGES WITH BLUE TEARDROP PINS (MATCHING WARETRACK VIDEO) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {pins.map((pin) => {
          if (!pin.visible) return null;
          const isSelected = pin.id === selectedEntityId;
          return (
            <button
              key={pin.id}
              type="button"
              onClick={() => {
                const found = TERMINAL_3D_ENTITIES.find(
                  (e) => e.id === pin.id
                );
                if (found) onSelectEntity(found);
              }}
              style={{
                transform: `translate3d(${Math.round(pin.x)}px, ${Math.round(
                  pin.y
                )}px, 0) translate(-50%, -100%)`
              }}
              className="pointer-events-auto absolute top-0 left-0 flex flex-col items-center group cursor-pointer"
            >
              {/* Blue Map Pin Icon above the label pill (like WareTrack video) */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shadow-md mb-1 transition-transform ${
                  isSelected
                    ? "bg-blue-600 text-white ring-2 ring-white scale-110"
                    : "bg-blue-500/95 text-white group-hover:scale-110"
                }`}
              >
                <MapPin className="w-4 h-4 fill-white text-blue-600" />
              </div>

              {/* Pill Badge */}
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold shadow-md transition-transform ${
                  isSelected
                    ? "bg-blue-600 text-white ring-2 ring-white scale-105 z-20"
                    : "bg-slate-900/90 hover:bg-blue-600 text-white z-10"
                }`}
              >
                <span className="font-mono">{pin.code}</span>
                <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-xs">
                  {pin.statusLabel}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* CAMERA CONTROL PILL STRIP (ADAPTS TO INSPECTOR CARD WIDTH & STATE) */}
      <div
        className={`absolute top-3 hidden lg:flex flex-col items-center bg-white/95 rounded-xl border border-slate-200/90 shadow-md p-1 gap-0.5 z-20 transition-all ${
          inspectorOpen
            ? "right-[284px] xl:right-[336px]"
            : "right-3"
        }`}
      >
        <button
          type="button"
          onClick={() => cameraControlsRef.current?.zoomIn()}
          className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
          title="Zoom In"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => cameraControlsRef.current?.zoomOut()}
          className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
          title="Zoom Out"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <div className="w-4 h-px bg-slate-200 my-0.5" />
        <button
          type="button"
          onClick={() => cameraControlsRef.current?.rotateView()}
          className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
          title="Rotate Camera 30°"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => cameraControlsRef.current?.resetView()}
          className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
          title="Reset View"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => cameraControlsRef.current?.resetView()}
          className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
          title="Terminal Home Overview"
        >
          <Home className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
