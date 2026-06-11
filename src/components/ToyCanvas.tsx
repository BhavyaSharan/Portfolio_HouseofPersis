import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Props definition
interface ToyCanvasProps {
  currentSlide: number;
  materialPreset: 'glossy' | 'matte' | 'gold' | 'glass';
  showCaseBox: boolean;
  autoRotateSpeed: number;
}

// Colors mapping matching the roles
const THEME_COLORS = {
  dev: { primary: 0x10b981, secondary: 0x059669, light: 0x34d399, glow: 0x10b981 },
  ai: { primary: 0x8b5cf6, secondary: 0x6d28d9, light: 0xa78bfa, glow: 0x8b5cf6 },
  design: { primary: 0xf97316, secondary: 0xe056fd, light: 0xfdba74, glow: 0xf97316 },
  founder: { primary: 0xf59e0b, secondary: 0xd97706, light: 0xfde047, glow: 0xf59e0b }
};

export const ToyCanvas: React.FC<ToyCanvasProps> = ({
  currentSlide,
  materialPreset,
  showCaseBox,
  autoRotateSpeed
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Track dragging state
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });
  const dragRotation = useRef({ x: 0, y: 0 });
  const targetDragRotation = useRef({ x: 0, y: 0 });

  // Store references to update in render loop
  const toysRef = useRef<THREE.Group[]>([]);
  const baseLightsRef = useRef<THREE.PointLight[]>([]);
  const caseBoxesRef = useRef<THREE.Group[]>([]);
  const propsRef = useRef<THREE.Object3D[]>([]);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0c0d12, 0.02);

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 2.5, 12);
    const cameraTarget = new THREE.Vector3(0, 1.2, 0);
    camera.lookAt(cameraTarget);

    // 3. Renderer Setup
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    // 4. Lighting Setup
    // Ambient light for general soft illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambientLight);

    // Key Light (Main light casting soft shadows)
    const keyLight = new THREE.DirectionalLight(0xfffbee, 1.8);
    keyLight.position.set(6, 10, 6);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.radius = 6;
    scene.add(keyLight);

    // Fill Light (Softer, slightly cool fill light from opposite side)
    const fillLight = new THREE.DirectionalLight(0xecfeff, 1.0);
    fillLight.position.set(-6, 5, -3);
    scene.add(fillLight);

    // Rim Light (Behind the models to highlight edges and create separation)
    const rimLight = new THREE.DirectionalLight(0xffffff, 1.5);
    rimLight.position.set(0, 6, -8);
    scene.add(rimLight);

    // 5. Materials Setup Helper
    const getMaterial = (baseColor: number, isGlossyDetail = false) => {
      switch (materialPreset) {
        case 'matte':
          return new THREE.MeshPhysicalMaterial({
            color: baseColor,
            roughness: 0.65,
            metalness: 0.05,
            clearcoat: 0.05,
            shadowSide: THREE.DoubleSide
          });
        case 'gold':
          return new THREE.MeshPhysicalMaterial({
            color: 0xe6b800, // Gold base
            roughness: 0.12,
            metalness: 0.95,
            clearcoat: 1.0,
            clearcoatRoughness: 0.05,
            shadowSide: THREE.DoubleSide
          });
        case 'glass':
          return new THREE.MeshPhysicalMaterial({
            color: baseColor,
            roughness: 0.15,
            metalness: 0.1,
            transmission: 0.88,
            transparent: true,
            opacity: 0.75,
            thickness: 0.8,
            clearcoat: 1.0,
            shadowSide: THREE.DoubleSide
          });
        case 'glossy':
        default:
          return new THREE.MeshPhysicalMaterial({
            color: baseColor,
            roughness: isGlossyDetail ? 0.02 : 0.09,
            metalness: 0.06,
            clearcoat: 1.0,
            clearcoatRoughness: 0.05,
            shadowSide: THREE.DoubleSide
          });
      }
    };

    // Shared Geometries (reused to save memory)
    const sphereGeo = new THREE.SphereGeometry(1, 32, 32);
    const cylinderGeo = new THREE.CylinderGeometry(1, 1, 1, 32);
    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    const torusGeo = new THREE.TorusGeometry(1, 0.1, 16, 64);

    // Clear tracking arrays
    toysRef.current = [];
    baseLightsRef.current = [];
    caseBoxesRef.current = [];
    propsRef.current = [];

    // Spacing between toys
    const spacingX = 10;
    const roles = ['dev', 'ai', 'design', 'founder'] as const;

    // 6. Build the 4 Toy Showcases
    roles.forEach((role, idx) => {
      const xOffset = (idx - 1.5) * spacingX;
      const themeColors = THEME_COLORS[role];

      // A root group for this slide/toy
      const toyGroup = new THREE.Group();
      toyGroup.position.set(xOffset, 0, 0);
      scene.add(toyGroup);
      toysRef.current.push(toyGroup);

      // --- PEDESTAL ASSEMBLY ---
      const pedestalGroup = new THREE.Group();
      toyGroup.add(pedestalGroup);

      // Lower dark pedestal base
      const pedBaseMat = new THREE.MeshPhysicalMaterial({
        color: 0x11131a,
        roughness: 0.25,
        metalness: 0.8,
        clearcoat: 0.5
      });
      const pedBase = new THREE.Mesh(cylinderGeo, pedBaseMat);
      pedBase.scale.set(1.6, 0.2, 1.6);
      pedBase.position.y = 0.1;
      pedBase.receiveShadow = true;
      pedestalGroup.add(pedBase);

      // Upper translucent illuminated disc
      const pedGlassMat = new THREE.MeshPhysicalMaterial({
        color: themeColors.primary,
        roughness: 0.1,
        metalness: 0.1,
        transmission: 0.6,
        transparent: true,
        opacity: 0.8,
        thickness: 0.5
      });
      const pedUpper = new THREE.Mesh(cylinderGeo, pedGlassMat);
      pedUpper.scale.set(1.4, 0.1, 1.4);
      pedUpper.position.y = 0.25;
      pedUpper.receiveShadow = true;
      pedestalGroup.add(pedUpper);

      // Metallic trim ring
      const trimMat = new THREE.MeshPhysicalMaterial({
        color: 0x475569,
        roughness: 0.1,
        metalness: 0.9
      });
      const trimRing = new THREE.Mesh(torusGeo, trimMat);
      trimRing.rotation.x = Math.PI / 2;
      trimRing.scale.set(1.45, 1.45, 0.4);
      trimRing.position.y = 0.2;
      pedestalGroup.add(trimRing);

      // Pedestal underglow light (PointLight)
      const baseLight = new THREE.PointLight(themeColors.glow, 4.0, 5, 1.5);
      baseLight.position.set(0, 0.35, 0);
      pedestalGroup.add(baseLight);
      baseLightsRef.current.push(baseLight);

      // Glowing Neon Ring on pedestal
      const neonRingMat = new THREE.MeshBasicMaterial({
        color: themeColors.primary,
        transparent: true,
        opacity: 0.9
      });
      const neonRing = new THREE.Mesh(torusGeo, neonRingMat);
      neonRing.rotation.x = Math.PI / 2;
      neonRing.scale.set(1.38, 1.38, 0.15);
      neonRing.position.y = 0.26;
      pedestalGroup.add(neonRing);


      // --- VINYL TOY CHARACTER ASSEMBLY ---
      const characterGroup = new THREE.Group();
      characterGroup.position.set(0, 0.3, 0); // Position on top of pedestal
      toyGroup.add(characterGroup);

      // Materials for the toy components based on the active role and preset
      const skinMat = getMaterial(0xfde047); // Cute yellow-beige vinyl skin
      const faceMat = getMaterial(0x0c0d12, true); // Black vinyl for eyes/mouth
      const whiteMat = getMaterial(0xffffff); // White details (shoes/stripes)
      const blackMat = getMaterial(0x1e293b); // Dark gray/black accessories

      const clothingColor = materialPreset === 'gold' ? 0xe6b800 : themeColors.primary;
      const accentColor = materialPreset === 'gold' ? 0xe6b800 : themeColors.light;
      const darkColor = materialPreset === 'gold' ? 0xb38f00 : 0x1e293b;

      const clothesMat = getMaterial(clothingColor);
      const accentMat = getMaterial(accentColor);
      const pantsMat = getMaterial(darkColor);

      // 1. Shoes
      const leftShoe = new THREE.Mesh(boxGeo, whiteMat);
      leftShoe.scale.set(0.22, 0.14, 0.38);
      leftShoe.position.set(-0.25, 0.08, 0.05);
      leftShoe.castShadow = true;
      leftShoe.receiveShadow = true;
      characterGroup.add(leftShoe);

      const rightShoe = leftShoe.clone();
      rightShoe.position.x = 0.25;
      characterGroup.add(rightShoe);

      // Colored shoe detailing (vinyl sneakers vibe)
      const leftShoeTrim = new THREE.Mesh(boxGeo, clothesMat);
      leftShoeTrim.scale.set(0.23, 0.08, 0.25);
      leftShoeTrim.position.set(-0.25, 0.13, 0.0);
      leftShoeTrim.castShadow = true;
      characterGroup.add(leftShoeTrim);

      const rightShoeTrim = leftShoeTrim.clone();
      rightShoeTrim.position.x = 0.25;
      characterGroup.add(rightShoeTrim);

      // 2. Legs
      const leftLeg = new THREE.Mesh(cylinderGeo, pantsMat);
      leftLeg.scale.set(0.12, 0.4, 0.12);
      leftLeg.position.set(-0.25, 0.3, 0.0);
      leftLeg.castShadow = true;
      leftLeg.receiveShadow = true;
      characterGroup.add(leftLeg);

      const rightLeg = leftLeg.clone();
      rightLeg.position.x = 0.25;
      characterGroup.add(rightLeg);

      // 3. Torso (Streetwear Hoodie)
      const torso = new THREE.Mesh(cylinderGeo, clothesMat);
      torso.scale.set(0.42, 0.8, 0.42);
      torso.position.set(0, 0.85, 0);
      torso.castShadow = true;
      torso.receiveShadow = true;
      characterGroup.add(torso);

      // Hoodie pocket pouch
      const pocket = new THREE.Mesh(boxGeo, clothesMat);
      pocket.scale.set(0.28, 0.18, 0.12);
      pocket.position.set(0, 0.72, 0.2);
      pocket.rotation.x = 0.1;
      pocket.castShadow = true;
      characterGroup.add(pocket);

      // Hoodie drawstrings (metallic gold or accent silver)
      const stringMat = getMaterial(0xe2e8f0);
      const stringL = new THREE.Mesh(cylinderGeo, stringMat);
      stringL.scale.set(0.015, 0.2, 0.015);
      stringL.position.set(-0.08, 1.05, 0.22);
      stringL.rotation.z = -0.05;
      characterGroup.add(stringL);

      const stringR = stringL.clone();
      stringR.position.x = 0.08;
      stringR.rotation.z = 0.05;
      characterGroup.add(stringR);

      // Hoodie graphic print (Role logo visual representation)
      let graphic: THREE.Object3D;
      if (role === 'dev') {
        // Tag symbols </> represented simply by cross angled boxes
        graphic = new THREE.Group();
        const tag1 = new THREE.Mesh(boxGeo, accentMat);
        tag1.scale.set(0.03, 0.14, 0.02);
        tag1.rotation.z = 0.6;
        tag1.position.set(-0.06, 0, 0.01);
        const tag2 = tag1.clone();
        tag2.rotation.z = -0.6;
        tag2.position.x = 0.06;
        const slash = new THREE.Mesh(boxGeo, whiteMat);
        slash.scale.set(0.02, 0.16, 0.02);
        slash.rotation.z = -0.3;
        graphic.add(tag1, tag2, slash);
      } else if (role === 'ai') {
        // Neural node (small sphere with connecting lines)
        graphic = new THREE.Group();
        const coreNode = new THREE.Mesh(sphereGeo, accentMat);
        coreNode.scale.set(0.06, 0.06, 0.06);
        const orbit1 = new THREE.Mesh(torusGeo, whiteMat);
        orbit1.scale.set(0.12, 0.12, 0.02);
        orbit1.rotation.y = 0.5;
        graphic.add(coreNode, orbit1);
      } else if (role === 'design') {
        // Multi-color concentric rings representing color wheel
        graphic = new THREE.Group();
        const ring1 = new THREE.Mesh(torusGeo, accentMat);
        ring1.scale.set(0.12, 0.12, 0.03);
        const corePix = new THREE.Mesh(boxGeo, whiteMat);
        corePix.scale.set(0.05, 0.05, 0.05);
        graphic.add(ring1, corePix);
      } else {
        // Founder: crown graphic/dollar symbol representation
        graphic = new THREE.Group();
        const fBase = new THREE.Mesh(boxGeo, accentMat);
        fBase.scale.set(0.16, 0.03, 0.02);
        fBase.position.y = -0.06;
        
        const fPeak1 = new THREE.Mesh(coneGeometry(), accentMat);
        fPeak1.scale.set(0.04, 0.09, 0.04);
        fPeak1.position.set(-0.06, 0, 0);
        
        const fPeak2 = fPeak1.clone();
        fPeak2.position.set(0, 0.03, 0);
        fPeak2.scale.set(0.05, 0.12, 0.05);

        const fPeak3 = fPeak1.clone();
        fPeak3.position.set(0.06, 0, 0);
        
        graphic.add(fBase, fPeak1, fPeak2, fPeak3);
      }
      graphic.position.set(0, 0.88, 0.22);
      characterGroup.add(graphic);

      // 4. Arms
      const leftArm = new THREE.Group();
      leftArm.position.set(-0.35, 1.0, 0);
      
      const upperArm = new THREE.Mesh(cylinderGeo, clothesMat);
      upperArm.scale.set(0.12, 0.35, 0.12);
      upperArm.position.y = -0.12;
      upperArm.rotation.z = 0.25;
      upperArm.castShadow = true;
      leftArm.add(upperArm);

      const leftHand = new THREE.Mesh(sphereGeo, skinMat);
      leftHand.scale.set(0.1, 0.1, 0.1);
      leftHand.position.set(-0.06, -0.32, 0.0);
      leftArm.add(leftHand);
      characterGroup.add(leftArm);

      const rightArm = new THREE.Group();
      rightArm.position.set(0.35, 1.0, 0);

      const upperArmR = new THREE.Mesh(cylinderGeo, clothesMat);
      upperArmR.scale.set(0.12, 0.35, 0.12);
      upperArmR.position.y = -0.12;
      upperArmR.rotation.z = -0.25;
      upperArmR.castShadow = true;
      rightArm.add(upperArmR);

      const rightHand = new THREE.Mesh(sphereGeo, skinMat);
      rightHand.scale.set(0.1, 0.1, 0.1);
      rightHand.position.set(0.06, -0.32, 0.0);
      rightArm.add(rightHand);
      characterGroup.add(rightArm);

      // 5. Head Assembly (Large stylized vinyl toy head)
      const head = new THREE.Mesh(sphereGeo, skinMat);
      head.scale.set(0.55, 0.52, 0.52);
      head.position.set(0, 1.48, 0);
      head.castShadow = true;
      head.receiveShadow = true;
      characterGroup.add(head);

      // Cool Square Glass Frames (Bitmoji signature)
      const glassGroup = new THREE.Group();
      glassGroup.position.set(0, 1.5, 0.44);

      const glassFrameMat = getMaterial(0x0c0d12, true); // Glossy black plastic frames
      const lensMat = new THREE.MeshPhysicalMaterial({
        color: themeColors.primary,
        roughness: 0.02,
        metalness: 0.1,
        transmission: 0.75,
        transparent: true,
        opacity: 0.55,
        clearcoat: 1.0
      });

      // Left Frame
      const frameL = new THREE.Mesh(boxGeo, glassFrameMat);
      frameL.scale.set(0.34, 0.28, 0.06);
      frameL.position.set(-0.2, 0, 0);
      // Left Lens
      const lensL = new THREE.Mesh(boxGeo, lensMat);
      lensL.scale.set(0.28, 0.22, 0.04);
      lensL.position.set(-0.2, 0, 0.02);
      
      // Right Frame
      const frameR = frameL.clone();
      frameR.position.x = 0.2;
      // Right Lens
      const lensR = lensL.clone();
      lensR.position.x = 0.2;

      // Bridge connection
      const bridge = new THREE.Mesh(boxGeo, glassFrameMat);
      bridge.scale.set(0.12, 0.05, 0.04);
      bridge.position.set(0, 0.05, 0);

      // Temples (side arms of glasses)
      const templeL = new THREE.Mesh(boxGeo, glassFrameMat);
      templeL.scale.set(0.04, 0.04, 0.45);
      templeL.position.set(-0.37, 0, -0.22);
      templeL.rotation.y = 0.08;

      const templeR = templeL.clone();
      templeR.position.x = 0.37;
      templeR.rotation.y = -0.08;

      glassGroup.add(frameL, lensL, frameR, lensR, bridge, templeL, templeR);
      characterGroup.add(glassGroup);

      // Eyes (black glossy vinyl beads under glasses)
      const eyeL = new THREE.Mesh(sphereGeo, faceMat);
      eyeL.scale.set(0.05, 0.06, 0.04);
      eyeL.position.set(-0.18, 1.5, 0.44);
      
      // Eye Reflection Dot (tiny white highlight)
      const reflectionL = new THREE.Mesh(sphereGeo, whiteMat);
      reflectionL.scale.set(0.015, 0.015, 0.01);
      reflectionL.position.set(-0.165, 1.52, 0.485);
      characterGroup.add(eyeL, reflectionL);

      const eyeR = eyeL.clone();
      eyeR.position.x = 0.18;
      const reflectionR = reflectionL.clone();
      reflectionR.position.x = 0.195;
      characterGroup.add(eyeR, reflectionR);

      // Nose
      const nose = new THREE.Mesh(sphereGeo, skinMat);
      nose.scale.set(0.06, 0.05, 0.05);
      nose.position.set(0, 1.42, 0.48);
      characterGroup.add(nose);

      // Cute tiny smile (small torus segment or curve)
      const smileMat = getMaterial(0x0c0d12);
      const smile = new THREE.Mesh(torusGeo, smileMat);
      smile.rotation.x = Math.PI / 1.8;
      smile.scale.set(0.06, 0.06, 0.015);
      smile.position.set(0, 1.34, 0.47);
      characterGroup.add(smile);

      // 6. Hair/Headwear (Varying hairstyles/caps for each role)
      const hairColor = materialPreset === 'gold' ? 0xe6b800 : 0x27272a;
      const hairMat = getMaterial(hairColor);

      if (role === 'dev') {
        // Cool backward snapback cap
        const capGroup = new THREE.Group();
        capGroup.position.set(0, 1.62, -0.05);

        const capBody = new THREE.Mesh(sphereGeo, clothesMat);
        capBody.scale.set(0.56, 0.45, 0.54);
        capBody.position.y = 0.05;

        // Backward brim
        const capBrim = new THREE.Mesh(boxGeo, accentMat);
        capBrim.scale.set(0.48, 0.02, 0.35);
        capBrim.position.set(0, 0.04, -0.6);
        capBrim.rotation.x = -0.06;

        // Small top button
        const capBtn = new THREE.Mesh(sphereGeo, accentMat);
        capBtn.scale.set(0.05, 0.05, 0.05);
        capBtn.position.set(0, 0.48, 0);

        capGroup.add(capBody, capBrim, capBtn);
        characterGroup.add(capGroup);

        // A little bit of peek-out hair at the sides
        const sideHairL = new THREE.Mesh(sphereGeo, hairMat);
        sideHairL.scale.set(0.12, 0.22, 0.1);
        sideHairL.position.set(-0.46, 1.48, 0.15);
        sideHairL.rotation.z = 0.2;
        characterGroup.add(sideHairL);

        const sideHairR = sideHairL.clone();
        sideHairR.position.x = 0.46;
        sideHairR.rotation.z = -0.2;
        characterGroup.add(sideHairR);

      } else if (role === 'ai') {
        // Futuristic stylized side-swept spikes
        const hairGroup = new THREE.Group();
        hairGroup.position.set(0, 1.68, 0.0);

        const hairBase = new THREE.Mesh(sphereGeo, hairMat);
        hairBase.scale.set(0.56, 0.38, 0.54);
        hairBase.position.y = -0.05;
        hairGroup.add(hairBase);

        // Custom sculpted hair locks
        for (let i = 0; i < 7; i++) {
          const lock = new THREE.Mesh(sphereGeo, hairMat);
          const angle = -0.6 + i * 0.22;
          lock.scale.set(0.16, 0.24, 0.22);
          lock.position.set(Math.sin(angle) * 0.45, 0.15 + Math.cos(angle * 2) * 0.05, Math.cos(angle) * 0.3 + 0.1);
          lock.rotation.set(0.2, angle * 0.5, -angle * 0.6);
          hairGroup.add(lock);
        }
        characterGroup.add(hairGroup);

      } else if (role === 'design') {
        // Trendsetter beanie
        const beanieGroup = new THREE.Group();
        beanieGroup.position.set(0, 1.62, 0.0);

        const beanieMain = new THREE.Mesh(sphereGeo, accentMat);
        beanieMain.scale.set(0.56, 0.44, 0.54);
        beanieMain.position.y = 0.08;

        const beanieFold = new THREE.Mesh(cylinderGeo, clothesMat);
        beanieFold.scale.set(0.57, 0.14, 0.55);
        beanieFold.position.y = 0.04;

        beanieGroup.add(beanieMain, beanieFold);
        characterGroup.add(beanieGroup);

        // Long side hair peeking out
        const sideHairL = new THREE.Mesh(cylinderGeo, hairMat);
        sideHairL.scale.set(0.08, 0.35, 0.08);
        sideHairL.position.set(-0.48, 1.34, 0.1);
        sideHairL.rotation.z = 0.15;
        characterGroup.add(sideHairL);

        const sideHairR = sideHairL.clone();
        sideHairR.position.x = 0.48;
        sideHairR.rotation.z = -0.15;
        characterGroup.add(sideHairR);

      } else {
        // Founder: Sleek clean combover + Gold crown
        const hairGroup = new THREE.Group();
        hairGroup.position.set(0, 1.68, 0);

        const hairBase = new THREE.Mesh(sphereGeo, hairMat);
        hairBase.scale.set(0.56, 0.36, 0.54);
        hairBase.position.y = -0.05;
        hairGroup.add(hairBase);

        // Slick locks
        for (let i = 0; i < 5; i++) {
          const lock = new THREE.Mesh(boxGeo, hairMat);
          lock.scale.set(0.18, 0.12, 0.55);
          lock.position.set(-0.2 + i * 0.1, 0.1, 0.1);
          lock.rotation.set(-0.2, 0.1, 0);
          hairGroup.add(lock);
        }
        characterGroup.add(hairGroup);

        // Golden crown (Limited edition feature)
        const crownGroup = new THREE.Group();
        crownGroup.position.set(0, 2.12, -0.05);
        crownGroup.rotation.x = -0.1;
        
        const goldLustreMat = new THREE.MeshPhysicalMaterial({
          color: 0xf59e0b, // Yellow gold
          roughness: 0.08,
          metalness: 0.95,
          clearcoat: 1.0
        });

        const crownBase = new THREE.Mesh(cylinderGeo, goldLustreMat);
        crownBase.scale.set(0.3, 0.05, 0.3);
        crownGroup.add(crownBase);

        for (let i = 0; i < 5; i++) {
          const peak = new THREE.Mesh(coneGeometry(), goldLustreMat);
          peak.scale.set(0.04, 0.12, 0.04);
          const angle = (i * Math.PI * 2) / 5;
          peak.position.set(Math.cos(angle) * 0.28, 0.08, Math.sin(angle) * 0.28);
          peak.rotation.set(Math.sin(angle) * 0.3, 0, -Math.cos(angle) * 0.3);
          crownGroup.add(peak);
        }

        // Tiny ruby jewel in crown front
        const rubyMat = new THREE.MeshPhysicalMaterial({ color: 0xef4444, roughness: 0.1, metalness: 0.1, emissive: 0x991b1b });
        const jewel = new THREE.Mesh(sphereGeo, rubyMat);
        jewel.scale.set(0.02, 0.025, 0.02);
        jewel.position.set(0, 0.03, 0.3);
        crownGroup.add(jewel);

        characterGroup.add(crownGroup);
      }

      // --- UNIQUE ROLE PROPS ASSEMBLY ---
      const propGroup = new THREE.Group();
      propGroup.position.set(0, 0.85, 0); // Position relative to character chest
      characterGroup.add(propGroup);
      propsRef.current.push(propGroup);

      if (role === 'dev') {
        // Glowing Futuristic Laptop (floating in front of character)
        const laptop = new THREE.Group();
        laptop.position.set(0, 0.02, 0.58);
        laptop.rotation.set(0.2, 0.0, 0.0);

        // Laptop base
        const lapBase = new THREE.Mesh(boxGeo, blackMat);
        lapBase.scale.set(0.48, 0.02, 0.36);
        lapBase.castShadow = true;
        
        // Laptop screen
        const lapScreenGroup = new THREE.Group();
        lapScreenGroup.position.set(0, 0.01, -0.175);
        lapScreenGroup.rotation.x = -Math.PI / 2.3; // Angled open

        const lapScreenBack = new THREE.Mesh(boxGeo, blackMat);
        lapScreenBack.scale.set(0.48, 0.34, 0.015);
        lapScreenBack.position.y = 0.17;
        lapScreenBack.castShadow = true;
        
        // Glowing code display panel
        const codeScreenMat = new THREE.MeshPhysicalMaterial({
          color: 0x059669,
          emissive: 0x10b981,
          emissiveIntensity: 1.8,
          roughness: 0.1
        });
        const lapScreenGlow = new THREE.Mesh(boxGeo, codeScreenMat);
        lapScreenGlow.scale.set(0.44, 0.3, 0.01);
        lapScreenGlow.position.set(0, 0.17, 0.01);
        
        lapScreenGroup.add(lapScreenBack, lapScreenGlow);
        laptop.add(lapBase, lapScreenGroup);
        propGroup.add(laptop);

        // Move hands in holding position
        leftArm.rotation.set(0.4, 0.2, -0.3);
        rightArm.rotation.set(0.4, -0.2, 0.3);
        leftArm.position.set(-0.3, 0.95, 0.15);
        rightArm.position.set(0.3, 0.95, 0.15);

      } else if (role === 'ai') {
        // Floating holographic brain or machine core
        const core = new THREE.Group();
        core.position.set(0, 0.2, 0.6);

        // Core central glowing sphere
        const coreGlowMat = new THREE.MeshPhysicalMaterial({
          color: 0x8b5cf6,
          emissive: 0xa78bfa,
          emissiveIntensity: 2.2,
          roughness: 0.1
        });
        const coreMesh = new THREE.Mesh(sphereGeo, coreGlowMat);
        coreMesh.scale.set(0.18, 0.18, 0.18);
        core.add(coreMesh);

        // Outer rotating wireframe structure
        const ring1Mat = new THREE.MeshPhysicalMaterial({
          color: 0xffffff,
          roughness: 0.1,
          metalness: 0.8
        });
        const outerRing1 = new THREE.Mesh(torusGeo, ring1Mat);
        outerRing1.scale.set(0.26, 0.26, 0.025);
        outerRing1.rotation.y = 0.5;
        
        const outerRing2 = outerRing1.clone();
        outerRing2.rotation.x = Math.PI / 2;
        outerRing2.rotation.y = -0.5;

        core.add(outerRing1, outerRing2);
        propGroup.add(core);

        // Raise arms upward to capture core glow
        leftArm.rotation.set(0.7, 0.5, -0.4);
        rightArm.rotation.set(0.7, -0.5, 0.4);
        leftArm.position.set(-0.26, 0.98, 0.25);
        rightArm.position.set(0.26, 0.98, 0.25);

      } else if (role === 'design') {
        // Holding a giant glowing designer stylus pen
        const stylus = new THREE.Group();
        stylus.position.set(0.3, 0.1, 0.4);
        stylus.rotation.set(-0.7, -0.2, -0.4);

        const penBody = new THREE.Mesh(cylinderGeo, blackMat);
        penBody.scale.set(0.04, 0.85, 0.04);
        
        const penTip = new THREE.Mesh(coneGeometry(), accentMat);
        penTip.scale.set(0.042, 0.12, 0.042);
        penTip.position.y = 0.485;

        const penGlow = new THREE.PointLight(themeColors.glow, 2.5, 3, 1.5);
        penGlow.position.y = 0.5;
        stylus.add(penBody, penTip, penGlow);
        propGroup.add(stylus);

        // Poses: Left arm relaxed, right arm raised holding the stylus
        leftArm.rotation.set(0.1, 0, -0.15);
        rightArm.rotation.set(0.7, -0.5, 0.1);
        rightArm.position.set(0.32, 0.98, 0.2);

      } else {
        // Founder: Solid shiny gold bar held in front
        const goldBar = new THREE.Mesh(boxGeo, new THREE.MeshPhysicalMaterial({
          color: 0xd97706,
          metalness: 0.95,
          roughness: 0.1,
          clearcoat: 1.0
        }));
        goldBar.scale.set(0.24, 0.12, 0.15);
        goldBar.position.set(0, -0.05, 0.52);
        goldBar.rotation.set(0.2, 0.4, 0.15);
        goldBar.castShadow = true;
        propGroup.add(goldBar);

        // Gold chain necklace around neck
        const necklace = new THREE.Mesh(torusGeo, new THREE.MeshPhysicalMaterial({
          color: 0xd97706,
          metalness: 0.95,
          roughness: 0.1
        }));
        necklace.rotation.x = Math.PI / 1.7;
        necklace.scale.set(0.28, 0.28, 0.04);
        necklace.position.set(0, 1.15, 0.05);
        characterGroup.add(necklace);

        // Poses: Stately look, hands presenting gold
        leftArm.rotation.set(0.3, 0.2, -0.25);
        rightArm.rotation.set(0.3, -0.2, 0.2);
        leftArm.position.set(-0.28, 0.96, 0.18);
        rightArm.position.set(0.28, 0.96, 0.18);
      }


      // --- ACRYLIC SHOWCASE BOX ASSEMBLY ---
      const caseBox = new THREE.Group();
      toyGroup.add(caseBox);
      caseBoxesRef.current.push(caseBox);

      // Transparent glass walls
      const glassWallMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.04,
        roughness: 0.05,
        transmission: 0.95,
        thickness: 0.5,
        side: THREE.DoubleSide
      });
      const glassWall = new THREE.Mesh(boxGeo, glassWallMat);
      glassWall.scale.set(3.4, 4.4, 3.4);
      glassWall.position.y = 2.15;
      glassWall.castShadow = true;
      caseBox.add(glassWall);

      // Aluminum sleek edge frames
      const frameThickness = 0.04;
      const frameMat = new THREE.MeshPhysicalMaterial({
        color: 0x1e293b,
        metalness: 0.85,
        roughness: 0.15
      });

      // Construct wireframe lines manually using boxes for premium solid look
      const constructFrame = () => {
        const frameGroup = new THREE.Group();
        const boxLength = 3.4;
        const boxHeight = 4.4;

        // Vertical poles
        const pole = new THREE.Mesh(boxGeo, frameMat);
        pole.scale.set(frameThickness, boxHeight, frameThickness);
        
        const p1 = pole.clone(); p1.position.set(-boxLength/2, boxHeight/2, -boxLength/2);
        const p2 = pole.clone(); p2.position.set(boxLength/2, boxHeight/2, -boxLength/2);
        const p3 = pole.clone(); p3.position.set(-boxLength/2, boxHeight/2, boxLength/2);
        const p4 = pole.clone(); p4.position.set(boxLength/2, boxHeight/2, boxLength/2);

        // Horizontal beams (width)
        const beamW = new THREE.Mesh(boxGeo, frameMat);
        beamW.scale.set(boxLength, frameThickness, frameThickness);

        const bW1 = beamW.clone(); bW1.position.set(0, 0, -boxLength/2);
        const bW2 = beamW.clone(); bW2.position.set(0, boxHeight, -boxLength/2);
        const bW3 = beamW.clone(); bW3.position.set(0, 0, boxLength/2);
        const bW4 = beamW.clone(); bW4.position.set(0, boxHeight, boxLength/2);

        // Horizontal beams (depth)
        const beamD = new THREE.Mesh(boxGeo, frameMat);
        beamD.scale.set(frameThickness, frameThickness, boxLength);

        const bD1 = beamD.clone(); bD1.position.set(-boxLength/2, 0, 0);
        const bD2 = beamD.clone(); bD2.position.set(-boxLength/2, boxHeight, 0);
        const bD3 = beamD.clone(); bD3.position.set(boxLength/2, 0, 0);
        const bD4 = beamD.clone(); bD4.position.set(boxLength/2, boxHeight, 0);

        frameGroup.add(p1, p2, p3, p4, bW1, bW2, bW3, bW4, bD1, bD2, bD3, bD4);
        return frameGroup;
      };

      caseBox.add(constructFrame());

      // Neon glowing top ceiling inside box
      const topLightMat = new THREE.MeshBasicMaterial({
        color: themeColors.primary,
        transparent: true,
        opacity: 0.15
      });
      const topLightGlow = new THREE.Mesh(boxGeo, topLightMat);
      topLightGlow.scale.set(3.3, 0.05, 3.3);
      topLightGlow.position.y = 4.35;
      caseBox.add(topLightGlow);
    });

    // Helper to generate cone geometry (coneGeo not initialized above)
    function coneGeometry() {
      return new THREE.ConeGeometry(1, 1, 32);
    }

    // 7. Ground / Table surface reflection
    const floorMat = new THREE.MeshPhysicalMaterial({
      color: 0x06070a,
      roughness: 0.35,
      metalness: 0.9,
      clearcoat: 0.8
    });
    const floor = new THREE.Mesh(cylinderGeo, floorMat);
    floor.scale.set(60, 0.02, 60);
    floor.position.y = -0.01;
    floor.receiveShadow = true;
    scene.add(floor);

    // 8. Event Listeners for Resize and Mouse Drag
    const handleResize = () => {
      if (!containerRef.current || !canvasRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Mouse drag handlers to rotate active figure
    const handleMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      previousMousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const deltaX = e.clientX - previousMousePosition.current.x;
      const deltaY = e.clientY - previousMousePosition.current.y;
      
      // Update target rotations based on drag speed
      targetDragRotation.current.y += deltaX * 0.01;
      targetDragRotation.current.x += deltaY * 0.01;
      
      // Clamp vertical rotation to avoid flipping upside down
      targetDragRotation.current.x = Math.max(-0.5, Math.min(0.5, targetDragRotation.current.x));

      previousMousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    // Touch event handlers for mobile
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging.current = true;
        previousMousePosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging.current || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - previousMousePosition.current.x;
      const deltaY = e.touches[0].clientY - previousMousePosition.current.y;
      
      targetDragRotation.current.y += deltaX * 0.015;
      targetDragRotation.current.x += deltaY * 0.015;
      targetDragRotation.current.x = Math.max(-0.5, Math.min(0.5, targetDragRotation.current.x));

      previousMousePosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const canvasEl = canvasRef.current;
    canvasEl.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    canvasEl.addEventListener('touchstart', handleTouchStart);
    canvasEl.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleMouseUp);

    // 9. Render Loop
    let animationId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      const elapsed = clock.getElapsedTime();

      // Camera Horizontal Slide Pan Lerp
      const targetCamX = (currentSlide * spacingX) - (1.5 * spacingX);
      camera.position.x += (targetCamX - camera.position.x) * 0.08;
      
      // Camera Target Lerp
      cameraTarget.x += (targetCamX - cameraTarget.x) * 0.08;
      camera.lookAt(cameraTarget);

      // Smoothly interpolate drag rotations (decay effect)
      dragRotation.current.x += (targetDragRotation.current.x - dragRotation.current.x) * 0.15;
      dragRotation.current.y += (targetDragRotation.current.y - dragRotation.current.y) * 0.15;

      // Animate active and passive toys
      toysRef.current.forEach((toy, index) => {
        const isActive = index === currentSlide;
        const charGroup = toy.children[1]; // Get characterGroup
        const pedestal = toy.children[0]; // Get pedestalGroup
        const caseBox = caseBoxesRef.current[index];

        // Toggle Showcase Box visibility with scale
        const targetBoxScale = (showCaseBox && isActive) ? 1.0 : 0.001;
        caseBox.scale.lerp(new THREE.Vector3(targetBoxScale, targetBoxScale, targetBoxScale), 0.1);

        if (isActive) {
          // 1. Gently bob the active toy up and down
          const bobHeight = 0.35 + Math.sin(elapsed * 2.5) * 0.08;
          charGroup.position.y += (bobHeight - charGroup.position.y) * 0.1;

          // 2. Base light glow pulse
          const baseLight = baseLightsRef.current[index];
          baseLight.intensity = 4.0 + Math.sin(elapsed * 4) * 0.8;

          // 3. Apply auto rotation + drag rotation to the figure
          const autoYaw = elapsed * autoRotateSpeed * 0.35;
          charGroup.rotation.y = autoYaw + dragRotation.current.y;
          charGroup.rotation.x = dragRotation.current.x;

          // 4. Animate unique props dynamically
          const activeProp = propsRef.current[index];
          if (index === 0) {
            // Laptop floating tilt
            activeProp.position.y = 0.02 + Math.sin(elapsed * 4) * 0.015;
          } else if (index === 1) {
            // Core spin and orbits
            activeProp.position.y = 0.2 + Math.sin(elapsed * 3) * 0.02;
            const coreBall = activeProp.children[0]?.children[0];
            const ring1 = activeProp.children[0]?.children[1];
            const ring2 = activeProp.children[0]?.children[2];
            if (coreBall) coreBall.rotation.y += 0.02;
            if (ring1) { ring1.rotation.y += 0.01; ring1.rotation.x += 0.005; }
            if (ring2) { ring2.rotation.x -= 0.015; ring2.rotation.y += 0.005; }
          } else if (index === 2) {
            // Stylus bobbing in hand
            activeProp.position.y = 0.1 + Math.sin(elapsed * 4.5) * 0.01;
          } else if (index === 3) {
            // Gold bar bobbing
            activeProp.position.y = -0.05 + Math.sin(elapsed * 3.5) * 0.015;
          }
        } else {
          // Passive toys: slide to ground, rest standing on pedestal, rotate slowly
          charGroup.position.y += (0.35 - charGroup.position.y) * 0.1;
          charGroup.rotation.y += 0.008; // slow spin
          charGroup.rotation.x *= 0.9;   // reset tilt

          // Turn off underglow lights for non-active slides to save brightness
          const baseLight = baseLightsRef.current[index];
          baseLight.intensity += (0.1 - baseLight.intensity) * 0.1;
        }

        // Slowly spin pedestal neon rings
        const neonRing = pedestal.children[3];
        if (neonRing) {
          neonRing.rotation.z += 0.01;
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    // Clean up
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      canvasEl.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvasEl.removeEventListener('touchstart', handleTouchStart);
      canvasEl.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
      
      // Dispose materials & geometries
      sphereGeo.dispose();
      cylinderGeo.dispose();
      boxGeo.dispose();
      torusGeo.dispose();
      renderer.dispose();
    };
  }, [materialPreset, showCaseBox, autoRotateSpeed]);

  // Update material values on prop changes without rebuilding scene if possible,
  // but standard state rebuild is clean enough for the preset slider since it re-initializes in 30ms.

  return (
    <div ref={containerRef} className="w-full h-full relative cursor-grab active:cursor-grabbing">
      <canvas ref={canvasRef} className="w-full h-full block" />
      
      {/* Interactive Drag Hint Overlay */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-xs font-medium tracking-widest text-slate-500 uppercase pointer-events-none flex items-center gap-2 bg-[#0c0d12]/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5">
        <svg className="w-3.5 h-3.5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
        Drag to Rotate Toy
      </div>
    </div>
  );
};
