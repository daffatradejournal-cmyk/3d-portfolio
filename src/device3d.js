import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { sound } from './audio.js';

export class IndustrialDeviceScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.isHovered = false;
    this.rotaryKnobs = [];
    this.keyMeshes = [];
    this.activeParam = 'PRESET 01';

    this.init();
    this.setupLighting();
    this.buildIndustrialDevice();
    this.buildShadowFloor();
    this.setupControls();
    this.animate();
  }

  init() {
    this.scene = new THREE.Scene();
    
    // Concrete light studio background color matching Dieter Rams / Teenage Engineering studio shots
    this.scene.background = new THREE.Color(0xECECE8);
    this.scene.fog = new THREE.FogExp2(0xECECE8, 0.035);

    const aspect = this.canvas.clientWidth / (this.canvas.clientHeight || 1);
    this.camera = new THREE.PerspectiveCamera(35, aspect, 0.1, 50);
    // Angled isometric-like beauty camera shot
    this.camera.position.set(2.8, 3.6, 5.2);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });

    // MengTo 3D Skill: 3d-retina-resolution
    const dpr = Math.min(window.devicePixelRatio || 1, 2.0);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2(-999, -999);
  }

  setupLighting() {
    // Soft studio ambient bounce light
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.6);
    this.scene.add(ambientLight);

    // Main studio key light (casting crisp contact shadow)
    this.keyLight = new THREE.DirectionalLight(0xfffbf2, 3.8);
    this.keyLight.position.set(4, 7, 3.5);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.width = 2048;
    this.keyLight.shadow.mapSize.height = 2048;
    this.keyLight.shadow.camera.near = 0.5;
    this.keyLight.shadow.camera.far = 15;
    this.keyLight.shadow.camera.left = -4;
    this.keyLight.shadow.camera.right = 4;
    this.keyLight.shadow.camera.top = 4;
    this.keyLight.shadow.camera.bottom = -4;
    this.keyLight.shadow.bias = -0.0005;
    this.keyLight.shadow.radius = 2.5;
    this.scene.add(this.keyLight);

    // Cool rim light for aluminum bevel definition (MengTo 3d-metal-material skill)
    this.rimLight = new THREE.DirectionalLight(0xdde3ed, 1.8);
    this.rimLight.position.set(-5, 4, -4);
    this.scene.add(this.rimLight);

    // Front soft fill
    this.fillLight = new THREE.DirectionalLight(0xffffff, 0.9);
    this.fillLight.position.set(0, 1, 5);
    this.scene.add(this.fillLight);
  }

  buildShadowFloor() {
    // Studio ground plane receiving real contact shadows
    const floorGeo = new THREE.PlaneGeometry(30, 30);
    const floorMat = new THREE.ShadowMaterial({
      opacity: 0.18
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.15;
    floor.receiveShadow = true;
    this.scene.add(floor);
  }

  // Generate real crisp canvas texture for the hardware OLED/LCD display
  generateScreenTexture(title, subtitle, status) {
    const w = 512;
    const h = 256;
    const cvs = document.createElement('canvas');
    cvs.width = w;
    cvs.height = h;
    const ctx = cvs.getContext('2d');

    // High-contrast OLED dark display
    ctx.fillStyle = '#0F1113';
    ctx.fillRect(0, 0, w, h);

    // Fine dot matrix grid
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    for (let x = 8; x < w; x += 12) {
      for (let y = 8; y < h; y += 12) {
        ctx.fillRect(x, y, 2, 2);
      }
    }

    // Top Header Status Bar
    ctx.fillStyle = '#FF5722';
    ctx.fillRect(16, 16, w - 32, 24);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('TE-2026 // INFORMATION ARCHITECTURE', 24, 33);
    ctx.fillText('PWR 99%', w - 85, 33);

    // Main Display Typography
    ctx.fillStyle = '#E8E8E6';
    ctx.font = 'bold 28px "Space Grotesk", sans-serif';
    ctx.fillText(title || '[Nama Kamu]', 24, 85);

    ctx.fillStyle = '#8E9298';
    ctx.font = '500 15px monospace';
    ctx.fillText(subtitle || 'INFORMATION SYSTEMS // CLASS OF 2026', 24, 118);

    // Waveform / Data Visualization graphic
    ctx.strokeStyle = '#FF5722';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(24, 165);
    for (let i = 0; i < 40; i++) {
      const x = 24 + i * 11.5;
      const y = 165 + Math.sin(i * 0.45) * 18 + (i % 3 === 0 ? 8 : -8);
      ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Footer Parameter readout
    ctx.fillStyle = '#A0A4A8';
    ctx.font = 'bold 13px monospace';
    ctx.fillText(`ACTIVE PARAM: ${status || this.activeParam}`, 24, 220);
    ctx.fillText('3D ROTATE: ACTIVE', w - 165, 220);

    const texture = new THREE.CanvasTexture(cvs);
    texture.anisotropy = 16;
    texture.needsUpdate = true;
    return texture;
  }

  buildIndustrialDevice() {
    this.deviceGroup = new THREE.Group();
    this.scene.add(this.deviceGroup);

    // =========================================================================
    // 1. Milled Aluminum Unibody Chassis (Dieter Rams / Teenage Engineering)
    // Dimensions: 4.8 width x 0.38 height x 2.6 depth
    // =========================================================================
    const bodyW = 4.8;
    const bodyH = 0.38;
    const bodyD = 2.6;

    const bodyGeo = new THREE.BoxGeometry(bodyW, bodyH, bodyD);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xDBDDD9,          // Concrete light anodized aluminum
      roughness: 0.35,
      metalness: 0.65,
      bumpScale: 0.002
    });
    this.bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    this.bodyMesh.position.set(0, bodyH / 2, 0);
    this.bodyMesh.castShadow = true;
    this.bodyMesh.receiveShadow = true;
    this.deviceGroup.add(this.bodyMesh);

    // Beveled Edge accent lines (Darker joint channel)
    const edgeGeo = new THREE.BoxGeometry(bodyW + 0.01, 0.04, bodyD + 0.01);
    const edgeMat = new THREE.MeshStandardMaterial({ color: 0x1A1C1E, roughness: 0.8, metalness: 0.1 });
    const edgeMesh = new THREE.Mesh(edgeGeo, edgeMat);
    edgeMesh.position.set(0, 0.04, 0);
    this.deviceGroup.add(edgeMesh);

    // =========================================================================
    // 2. Embedded OLED Screen Assembly
    // =========================================================================
    const screenW = 2.0;
    const screenD = 1.05;
    const screenGeo = new THREE.PlaneGeometry(screenW, screenD);
    this.screenTex = this.generateScreenTexture('[Nama Kamu]', 'INFORMATION SYSTEMS // 2026', this.activeParam);
    const screenMat = new THREE.MeshBasicMaterial({
      map: this.screenTex,
      toneMapped: false
    });
    this.screenMesh = new THREE.Mesh(screenGeo, screenMat);
    this.screenMesh.rotation.x = -Math.PI / 2;
    this.screenMesh.position.set(-1.15, bodyH + 0.002, -0.55);
    this.deviceGroup.add(this.screenMesh);

    // Glass Screen Bezel frame
    const bezelGeo = new THREE.BoxGeometry(screenW + 0.12, 0.02, screenD + 0.12);
    const bezelMat = new THREE.MeshStandardMaterial({ color: 0x121416, roughness: 0.2, metalness: 0.8 });
    const bezelMesh = new THREE.Mesh(bezelGeo, bezelMat);
    bezelMesh.position.set(-1.15, bodyH + 0.001, -0.55);
    this.deviceGroup.add(bezelMesh);

    // =========================================================================
    // 3. Four Color-Coded Rotary Encoders / Knobs (Teenage Engineering Signature)
    // =========================================================================
    const knobColors = [
      { color: 0xFF5722, name: 'FREQ // ORANGE' }, // Safety Orange
      { color: 0xFFB300, name: 'GAIN // OCHER' },  // Yellow
      { color: 0xF2F2EE, name: 'SYNC // WHITE' },  // Chalk White
      { color: 0x1A1C1E, name: 'MOD // BASALT' }   // Matte Dark
    ];

    const knobRadius = 0.22;
    const knobHeight = 0.35;
    const startX = 0.45;
    const spacingX = 0.62;

    knobColors.forEach((cfg, idx) => {
      const knobGroup = new THREE.Group();
      knobGroup.position.set(startX + idx * spacingX, bodyH, -0.55);

      // Knurled knob cylinder
      const knobGeo = new THREE.CylinderGeometry(knobRadius, knobRadius, knobHeight, 28);
      const knobMat = new THREE.MeshStandardMaterial({
        color: cfg.color,
        roughness: 0.38,
        metalness: 0.2
      });
      const knobMesh = new THREE.Mesh(knobGeo, knobMat);
      knobMesh.position.set(0, knobHeight / 2, 0);
      knobMesh.castShadow = true;
      knobGroup.add(knobMesh);

      // Top indicator pointer dot
      const dotGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.03, 12);
      const dotMat = new THREE.MeshBasicMaterial({ color: cfg.color === 0x1A1C1E ? 0xFFFFFF : 0x111111 });
      const dotMesh = new THREE.Mesh(dotGeo, dotMat);
      dotMesh.position.set(0, knobHeight + 0.01, -knobRadius * 0.6);
      knobGroup.add(dotMesh);

      knobGroup.userData = {
        type: 'knob',
        cfg,
        currentRotation: idx * 0.5
      };
      knobGroup.rotation.y = idx * 0.5;

      this.deviceGroup.add(knobGroup);
      this.rotaryKnobs.push(knobGroup);
    });

    // =========================================================================
    // 4. Physical 8-Key Mechanical Tactile Keypad
    // =========================================================================
    const keyRows = 2;
    const keyCols = 4;
    const keyW = 0.72;
    const keyD = 0.62;
    const keyH = 0.18;
    const keyStartX = -1.15;
    const keyStartZ = 0.52;
    const keyStepX = 0.84;
    const keyStepZ = 0.72;

    const keyLabels = [
      'SYS.ARCH', 'SQL.SCHEMA', 'API.FLOW', 'UI.PROTO',
      'GIT.OPS', 'ACID.LOGIC', 'DFD.MAP', 'VERCEL'
    ];

    keyLabels.forEach((label, idx) => {
      const c = idx % keyCols;
      const r = Math.floor(idx / keyCols);

      const kx = keyStartX + c * keyStepX;
      const kz = keyStartZ + r * keyStepZ;

      const keyGeo = new THREE.BoxGeometry(keyW, keyH, keyD);
      const isAccent = idx === 0 || idx === 7;
      const keyMat = new THREE.MeshStandardMaterial({
        color: isAccent ? 0xFF5722 : (idx % 2 === 0 ? 0xE8E8E6 : 0x22252A),
        roughness: 0.45,
        metalness: 0.1
      });
      const keyMesh = new THREE.Mesh(keyGeo, keyMat);
      keyMesh.position.set(kx, bodyH + keyH / 2, kz);
      keyMesh.castShadow = true;

      keyMesh.userData = {
        type: 'key',
        label,
        defaultY: bodyH + keyH / 2,
        targetY: bodyH + keyH / 2
      };

      this.deviceGroup.add(keyMesh);
      this.keyMeshes.push(keyMesh);
    });

    // =========================================================================
    // 5. Acoustic Speaker Perforation Grille (Braun / Dieter Rams aesthetic)
    // =========================================================================
    const grillStartX = 1.35;
    const grillStartZ = 0.45;
    const grillHoleGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.05, 12);
    const grillHoleMat = new THREE.MeshBasicMaterial({ color: 0x111111 });

    for (let gx = 0; gx < 8; gx++) {
      for (let gz = 0; gz < 12; gz++) {
        const hole = new THREE.Mesh(grillHoleGeo, grillHoleMat);
        hole.position.set(grillStartX + gx * 0.1, bodyH + 0.001, grillStartZ + gz * 0.1);
        this.deviceGroup.add(hole);
      }
    }

    // Centered tilt & float initial position
    this.deviceGroup.position.set(0, 0.35, 0);
  }

  setupControls() {
    // 360-degree OrbitControls from MengTo 3d-orbit-inspect-demo skill
    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.enableZoom = true;
    this.controls.minDistance = 3.5;
    this.controls.maxDistance = 9.0;
    this.controls.maxPolarAngle = Math.PI / 2 + 0.05; // Prevent camera sinking under floor
    this.controls.target.set(0, 0.4, 0);

    // Pointer clicks on knobs and keys
    this.canvas.addEventListener('pointerdown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.pointer, this.camera);
      
      // Check Keycaps
      const keyHits = this.raycaster.intersectObjects(this.keyMeshes);
      if (keyHits.length > 0) {
        const key = keyHits[0].object;
        key.userData.targetY = key.userData.defaultY - 0.09;
        sound.playKeyClick(true);
        this.updateScreen(key.userData.label);
        setTimeout(() => {
          key.userData.targetY = key.userData.defaultY;
          sound.playKeyClick(false);
        }, 180);
        return;
      }

      // Check Knobs
      const knobMeshes = this.rotaryKnobs.map(g => g.children[0]);
      const knobHits = this.raycaster.intersectObjects(knobMeshes);
      if (knobHits.length > 0) {
        const hitGroup = knobHits[0].object.parent;
        hitGroup.rotation.y += 0.8;
        sound.playToggle();
        this.updateScreen(hitGroup.userData.cfg.name);
      }
    });

    window.addEventListener('resize', () => this.onResize());
  }

  updateScreen(statusText) {
    this.activeParam = statusText;
    const newTex = this.generateScreenTexture('[Nama Kamu]', 'INFORMATION SYSTEMS // 2026', statusText);
    this.screenMesh.material.map = newTex;
    this.screenMesh.material.needsUpdate = true;
  }

  onResize() {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (w === 0 || h === 0) return;

    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    this.controls.update();

    // Smooth mechanical keycap spring damping
    this.keyMeshes.forEach(k => {
      k.position.y += (k.userData.targetY - k.position.y) * 0.35;
    });

    // Gentle floating idle motion
    const t = performance.now() * 0.001;
    this.deviceGroup.position.y = 0.35 + Math.sin(t * 1.2) * 0.04;

    this.renderer.render(this.scene, this.camera);
  }
}
