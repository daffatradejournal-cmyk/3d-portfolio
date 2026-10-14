import * as THREE from 'three';

export class SceneManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.mode = 'orb'; // 'orb' | 'sculpture' | 'particles'
    
    // Performance & metrics
    this.fps = 60;
    this.lastFrameTime = performance.now();
    this.frameCount = 0;
    this.lastFpsUpdate = performance.now();
    
    // Interaction
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    
    this.init();
    this.setupLights();
    this.createObjects();
    this.setupEvents();
    this.animate();
  }

  init() {
    // 1. Scene & Fog (MengTo atmospheric background guidelines)
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x07090e, 0.04);

    // 2. Camera (Perspective with realistic FOV)
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    this.camera.position.set(0, 0, 7);

    // 3. Renderer with 3d-retina-resolution skill guidelines:
    // Cap DPR at 2.0 to balance sharp 200% resolution with GPU fillrate
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: true
    });
    
    const dpr = Math.min(window.devicePixelRatio || 1, 2.0);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    // Report DPR to HUD
    const dprEl = document.getElementById('hud-dpr');
    if (dprEl) dprEl.innerText = `${dpr.toFixed(1)}x HiDPI`;
  }

  setupLights() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x0c1322, 1.5);
    this.scene.add(ambientLight);

    // Key Light (warm directional light)
    this.keyLight = new THREE.DirectionalLight(0x38bdf8, 3.5);
    this.keyLight.position.set(5, 5, 4);
    this.scene.add(this.keyLight);

    // Rim/Back Light (indigo-purple specular edge)
    this.rimLight = new THREE.DirectionalLight(0x818cf8, 2.8);
    this.rimLight.position.set(-5, -3, -3);
    this.scene.add(this.rimLight);

    // Point Light inside the core
    this.pointLight = new THREE.PointLight(0x38bdf8, 2, 8);
    this.pointLight.position.set(0, 0, 0);
    this.scene.add(this.pointLight);
  }

  createObjects() {
    // Master Group for 3D content
    this.masterGroup = new THREE.Group();
    this.scene.add(this.masterGroup);

    // 1. ORB MODE (Luminous core + orbital rings)
    this.orbGroup = new THREE.Group();
    
    // Core sphere with MeshPhysicalMaterial
    const sphereGeo = new THREE.IcosahedronGeometry(1.2, 16);
    const sphereMat = new THREE.MeshPhysicalMaterial({
      color: 0x0f172a,
      emissive: 0x0284c7,
      emissiveIntensity: 0.25,
      roughness: 0.15,
      metalness: 0.8,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      wireframe: false
    });
    this.orbMesh = new THREE.Mesh(sphereGeo, sphereMat);
    this.orbGroup.add(this.orbMesh);

    // Wireframe halo
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.25
    });
    this.haloMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1.3, 4), wireMat);
    this.orbGroup.add(this.haloMesh);

    // Orbital Rings
    this.rings = [];
    for (let i = 0; i < 3; i++) {
      const ringGeo = new THREE.TorusGeometry(1.8 + i * 0.45, 0.015, 16, 120);
      const ringMat = new THREE.MeshStandardMaterial({
        color: i % 2 === 0 ? 0x38bdf8 : 0x818cf8,
        emissive: i % 2 === 0 ? 0x0284c7 : 0x6366f1,
        emissiveIntensity: 0.6,
        roughness: 0.2,
        metalness: 0.9
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = (Math.PI / 3) * (i + 1);
      ring.rotation.y = (Math.PI / 4) * i;
      this.orbGroup.add(ring);
      this.rings.push(ring);
    }

    this.masterGroup.add(this.orbGroup);

    // 2. SCULPTURE MODE (Complex Torus Knot with Physical Glass/Chrome)
    this.sculptureGroup = new THREE.Group();
    const knotGeo = new THREE.TorusKnotGeometry(1.1, 0.35, 200, 32);
    const knotMat = new THREE.MeshPhysicalMaterial({
      color: 0x0a1120,
      metalness: 0.95,
      roughness: 0.1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      reflectivity: 1.0,
      iridescence: 0.8,
      iridescenceIOR: 1.3
    });
    this.knotMesh = new THREE.Mesh(knotGeo, knotMat);
    this.sculptureGroup.add(this.knotMesh);
    this.sculptureGroup.visible = false;
    this.masterGroup.add(this.sculptureGroup);

    // 3. NEBULA PARTICLES (MengTo globe-particles & falling-leaves concept)
    const particleCount = 2000;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const c1 = new THREE.Color(0x38bdf8);
    const c2 = new THREE.Color(0x818cf8);

    for (let i = 0; i < particleCount; i++) {
      const r = 2.0 + Math.random() * 4.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const mixedColor = c1.clone().lerp(c2, Math.random());
      colors[i * 3] = mixedColor.r;
      colors[i * 3 + 1] = mixedColor.g;
      colors[i * 3 + 2] = mixedColor.b;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.035,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending
    });

    this.particles = new THREE.Points(particleGeo, particleMat);
    this.masterGroup.add(this.particles);

    // Initial offset to right side for layout balance with hero text
    this.updateLayoutPosition();
  }

  updateLayoutPosition() {
    const isDesktop = window.innerWidth > 960;
    const targetX = isDesktop ? 1.6 : 0;
    const targetY = isDesktop ? 0 : -0.5;
    this.masterGroup.position.set(targetX, targetY, 0);
  }

  setMode(mode) {
    this.mode = mode;
    if (mode === 'orb') {
      this.orbGroup.visible = true;
      this.sculptureGroup.visible = false;
      this.particles.visible = true;
    } else if (mode === 'sculpture') {
      this.orbGroup.visible = false;
      this.sculptureGroup.visible = true;
      this.particles.visible = false;
    } else if (mode === 'particles') {
      this.orbGroup.visible = false;
      this.sculptureGroup.visible = false;
      this.particles.visible = true;
    }
  }

  setupEvents() {
    window.addEventListener('resize', () => this.onResize());

    window.addEventListener('pointermove', (e) => {
      this.mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    });
  }

  onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.updateLayoutPosition();
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const now = performance.now();
    const dt = (now - this.lastFrameTime) * 0.001;
    this.lastFrameTime = now;

    // Track FPS
    this.frameCount++;
    if (now - this.lastFpsUpdate >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
      this.frameCount = 0;
      this.lastFpsUpdate = now;
      const fpsEl = document.getElementById('hud-fps');
      if (fpsEl) fpsEl.innerText = `${this.fps} FPS`;
    }

    // Smooth camera / mesh parallax lerp
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    // Rotate Orb & Rings
    if (this.orbGroup.visible) {
      this.orbMesh.rotation.y += 0.005;
      this.orbMesh.rotation.x += 0.002;
      this.haloMesh.rotation.y -= 0.007;

      this.rings.forEach((ring, idx) => {
        ring.rotation.z += 0.004 * (idx + 1);
        ring.rotation.x += 0.002 * (idx + 1);
      });
    }

    // Rotate Sculpture
    if (this.sculptureGroup.visible) {
      this.knotMesh.rotation.y += 0.008;
      this.knotMesh.rotation.x += 0.006;
    }

    // Drifting particles
    if (this.particles.visible) {
      this.particles.rotation.y += 0.0015;
      this.particles.rotation.x += 0.0008;
    }

    // Interactive mouse rotation on master group
    this.masterGroup.rotation.y = this.mouse.x * 0.45;
    this.masterGroup.rotation.x = -this.mouse.y * 0.3;

    this.renderer.render(this.scene, this.camera);
  }
}
