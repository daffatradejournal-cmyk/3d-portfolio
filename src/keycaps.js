import * as THREE from 'three';
import { sound } from './audio.js';

// Technical data for each skill keycap
export const KEYCAPS_DATA = [
  {
    id: 'js',
    legend: 'JS',
    subLegend: 'ECMA-262',
    name: 'JavaScript / TypeScript',
    category: 'CORE RUNTIME',
    desc: 'Modern ES6+, asynchronous architecture, DOM & canvas APIs, modular application logic.',
    colorType: 'orange' // 'orange' | 'white' | 'dark'
  },
  {
    id: 'html-css',
    legend: 'HTML/CSS',
    subLegend: 'LAYOUT',
    name: 'Semantic HTML5 & Modern CSS3',
    category: 'PRESENTATION',
    desc: 'Responsive grid systems, custom properties, accessible DOM hierarchy, fluid typography.',
    colorType: 'white'
  },
  {
    id: 'sql',
    legend: 'SQL',
    subLegend: 'RDBMS',
    name: 'Relational Database Design',
    category: 'DATA PERSISTENCE',
    desc: 'Schema normalization, complex JOIN queries, indexing strategies, transactions, PostgreSQL/MySQL.',
    colorType: 'white'
  },
  {
    id: 'git',
    legend: 'GIT',
    subLegend: 'VCS',
    name: 'Git Version Control',
    category: 'SYSTEM INTEGRITY',
    desc: 'Branching models, atomic commits, interactive rebase, merge conflict resolution.',
    colorType: 'dark'
  },
  {
    id: 'github',
    legend: 'GITHUB',
    subLegend: 'CI/CD',
    name: 'GitHub Workflows & Collaboration',
    category: 'REPOSITORIES',
    desc: 'Automated CI/CD pipelines, issue tracking, pull request reviews, repository governance.',
    colorType: 'dark'
  },
  {
    id: 'vscode',
    legend: 'VS CODE',
    subLegend: 'IDE',
    name: 'Visual Studio Code Environment',
    category: 'TOOLCHAIN',
    desc: 'Advanced debugger integration, custom workspace extensions, ESLint/Prettier linting pipeline.',
    colorType: 'white'
  },
  {
    id: 'vercel',
    legend: 'VERCEL',
    subLegend: 'EDGE',
    name: 'Vercel Deployment & Edge Ops',
    category: 'INFRASTRUCTURE',
    desc: 'Production serverless hosting, edge network caching, custom domain DNS configuration.',
    colorType: 'dark'
  },
  {
    id: 'sys-analysis',
    legend: 'SYS.ANALYSIS',
    subLegend: 'UML/DFD',
    name: 'Information Systems Analysis',
    category: 'ARCHITECTURE',
    desc: 'Requirements elicitation, Data Flow Diagrams (DFD), UML modeling, database schema modeling for business systems.',
    colorType: 'orange'
  }
];

export class KeycapsScene {
  constructor(canvas, onSelectCallback) {
    this.canvas = canvas;
    this.onSelectCallback = onSelectCallback;
    this.keyMeshes = [];
    this.activeKey = null;

    this.init();
    this.setupLights();
    this.buildKeyboardChassis();
    this.buildKeycaps();
    this.setupInteractions();
    this.animate();
  }

  init() {
    this.scene = new THREE.Scene();

    const aspect = this.canvas.clientWidth / this.canvas.clientHeight;
    this.camera = new THREE.PerspectiveCamera(36, aspect, 0.1, 50);
    // Angled top-down perspective view inspired by mechanical engineering workbench
    this.camera.position.set(0, 4.8, 6.2);
    this.camera.lookAt(0, -0.2, 0);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });

    const dpr = Math.min(window.devicePixelRatio || 1, 2.0);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2(-999, -999);
  }

  setupLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    this.scene.add(ambientLight);

    // Warm overhead industrial task lamp
    this.taskLight = new THREE.DirectionalLight(0xfffbf0, 3.5);
    this.taskLight.position.set(2, 8, 4);
    this.taskLight.castShadow = true;
    this.taskLight.shadow.mapSize.width = 1024;
    this.taskLight.shadow.mapSize.height = 1024;
    this.scene.add(this.taskLight);

    // Subtle edge rim light
    this.rimLight = new THREE.DirectionalLight(0xdde3ea, 1.6);
    this.rimLight.position.set(-4, 3, -3);
    this.scene.add(this.rimLight);
  }

  buildKeyboardChassis() {
    this.keyboardGroup = new THREE.Group();
    this.scene.add(this.keyboardGroup);

    // Aluminum switchplate base tray (Braun / Teenage Engineering field desk style)
    const trayWidth = 6.4;
    const trayDepth = 3.6;
    const trayHeight = 0.45;

    const trayGeo = new THREE.BoxGeometry(trayWidth, trayHeight, trayDepth);
    const trayMat = new THREE.MeshStandardMaterial({
      color: 0x181a1d,
      roughness: 0.5,
      metalness: 0.8
    });
    const trayMesh = new THREE.Mesh(trayGeo, trayMat);
    trayMesh.position.set(0, -trayHeight / 2, 0);
    trayMesh.receiveShadow = true;
    this.keyboardGroup.add(trayMesh);

    // Subtle brushed aluminum top bezel plate
    const plateGeo = new THREE.BoxGeometry(trayWidth - 0.2, 0.05, trayDepth - 0.2);
    const plateMat = new THREE.MeshStandardMaterial({
      color: 0x22262c,
      roughness: 0.35,
      metalness: 0.9
    });
    const plateMesh = new THREE.Mesh(plateGeo, plateMat);
    plateMesh.position.set(0, 0.02, 0);
    plateMesh.receiveShadow = true;
    this.keyboardGroup.add(plateMesh);

    // Corner mechanical Allen bolts
    const boltGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.06, 16);
    const boltMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.95, roughness: 0.2 });

    const boltOffsets = [
      { x: -trayWidth / 2 + 0.25, z: -trayDepth / 2 + 0.25 },
      { x: trayWidth / 2 - 0.25, z: -trayDepth / 2 + 0.25 },
      { x: -trayWidth / 2 + 0.25, z: trayDepth / 2 - 0.25 },
      { x: trayWidth / 2 - 0.25, z: trayDepth / 2 - 0.25 }
    ];

    boltOffsets.forEach((pos) => {
      const bolt = new THREE.Mesh(boltGeo, boltMat);
      bolt.position.set(pos.x, 0.06, pos.z);
      this.keyboardGroup.add(bolt);
    });
  }

  // Generate crisp canvas texture for keycap legend
  generateKeycapTexture(data) {
    const size = 512;
    const cvs = document.createElement('canvas');
    cvs.width = size;
    cvs.height = size;
    const ctx = cvs.getContext('2d');

    // Keycap body color
    let bgColor = '#E8E8E6'; // Concrete Light Gray
    let textColor = '#111111';
    let subColor = '#777777';

    if (data.colorType === 'orange') {
      bgColor = '#FF5722'; // Safety Orange Accent
      textColor = '#FFFFFF';
      subColor = 'rgba(255, 255, 255, 0.75)';
    } else if (data.colorType === 'dark') {
      bgColor = '#141619'; // Matte Basalt Black
      textColor = '#F0F0F0';
      subColor = '#888888';
    }

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, size, size);

    // Mechanical homing dot/line or border line
    ctx.strokeStyle = data.colorType === 'orange' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.15)';
    ctx.lineWidth = 8;
    ctx.strokeRect(20, 20, size - 40, size - 40);

    // Main Legend
    ctx.fillStyle = textColor;
    ctx.font = 'bold 52px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(data.legend, size / 2, size / 2 - 20);

    // Sub Legend
    ctx.fillStyle = subColor;
    ctx.font = '600 24px monospace';
    ctx.fillText(data.subLegend, size / 2, size / 2 + 45);

    const texture = new THREE.CanvasTexture(cvs);
    texture.anisotropy = 16;
    texture.needsUpdate = true;
    return texture;
  }

  buildKeycaps() {
    // 2 Rows of 4 Keycaps
    const cols = 4;
    const keyWidth = 1.25;
    const keyDepth = 1.25;
    const keyHeight = 0.55;
    const spacingX = 1.38;
    const spacingZ = 1.38;

    KEYCAPS_DATA.forEach((data, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);

      // Center the 4x2 grid
      const posX = (col - 1.5) * spacingX;
      const posZ = (row - 0.5) * spacingZ;

      // Authentic Cherry/OEM keycap geometry (tapered top)
      const topScale = 0.82;
      const keyGeo = new THREE.BoxGeometry(keyWidth, keyHeight, keyDepth, 4, 2, 4);
      
      // Taper the top vertices to create classic keycap bevel
      const posAttr = keyGeo.attributes.position;
      for (let i = 0; i < posAttr.count; i++) {
        const y = posAttr.getY(i);
        if (y > 0) {
          posAttr.setX(i, posAttr.getX(i) * topScale);
          posAttr.setZ(i, posAttr.getZ(i) * topScale);
        }
      }
      keyGeo.computeVertexNormals();

      const keyTex = this.generateKeycapTexture(data);
      
      // Materials array: top face has legend texture, others have matte PBT plastic finish
      let plasticColor = 0xe8e8e6;
      if (data.colorType === 'orange') plasticColor = 0xff5722;
      if (data.colorType === 'dark') plasticColor = 0x141619;

      const sideMat = new THREE.MeshStandardMaterial({
        color: plasticColor,
        roughness: 0.65,
        metalness: 0.05
      });

      const topMat = new THREE.MeshStandardMaterial({
        map: keyTex,
        roughness: 0.5,
        metalness: 0.05
      });

      // BoxGeometry face order: [right, left, top, bottom, front, back]
      const materials = [sideMat, sideMat, topMat, sideMat, sideMat, sideMat];

      const keyMesh = new THREE.Mesh(keyGeo, materials);
      keyMesh.position.set(posX, keyHeight / 2 + 0.05, posZ);
      keyMesh.castShadow = true;
      keyMesh.receiveShadow = true;

      // Custom properties for physics and state
      keyMesh.userData = {
        data,
        defaultY: keyHeight / 2 + 0.05,
        targetY: keyHeight / 2 + 0.05,
        isPressed: false
      };

      this.keyboardGroup.add(keyMesh);
      this.keyMeshes.push(keyMesh);
    });
  }

  setupInteractions() {
    window.addEventListener('resize', () => this.onResize());

    const updatePointer = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    this.canvas.addEventListener('pointermove', (e) => {
      updatePointer(e);
      this.checkHover();
    });

    this.canvas.addEventListener('pointerdown', (e) => {
      updatePointer(e);
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const intersects = this.raycaster.intersectObjects(this.keyMeshes);

      if (intersects.length > 0) {
        const hitKey = intersects[0].object;
        this.pressKey(hitKey);
      }
    });

    this.canvas.addEventListener('pointerup', () => {
      this.releaseAllKeys();
    });

    this.canvas.addEventListener('pointerleave', () => {
      this.pointer.set(-999, -999);
      this.releaseAllKeys();
      this.canvas.style.cursor = 'default';
    });
  }

  checkHover() {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const intersects = this.raycaster.intersectObjects(this.keyMeshes);

    if (intersects.length > 0) {
      this.canvas.style.cursor = 'pointer';
      const hitKey = intersects[0].object;
      
      // Slight mechanical pre-travel depression on hover
      this.keyMeshes.forEach((k) => {
        if (k === hitKey) {
          if (!k.userData.isPressed) {
            k.userData.targetY = k.userData.defaultY - 0.06;
          }
        } else {
          if (!k.userData.isPressed) {
            k.userData.targetY = k.userData.defaultY;
          }
        }
      });
    } else {
      this.canvas.style.cursor = 'default';
      this.keyMeshes.forEach((k) => {
        if (!k.userData.isPressed) {
          k.userData.targetY = k.userData.defaultY;
        }
      });
    }
  }

  pressKey(keyMesh) {
    keyMesh.userData.isPressed = true;
    keyMesh.userData.targetY = keyMesh.userData.defaultY - 0.22; // Physical mechanical bottom-out
    sound.playKeyClick(true);

    if (this.onSelectCallback) {
      this.onSelectCallback(keyMesh.userData.data);
    }
  }

  releaseAllKeys() {
    this.keyMeshes.forEach((k) => {
      if (k.userData.isPressed) {
        k.userData.isPressed = false;
        k.userData.targetY = k.userData.defaultY;
        sound.playKeyClick(false);
      }
    });
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

    // Harmonic spring animation on keycaps
    this.keyMeshes.forEach((k) => {
      k.position.y += (k.userData.targetY - k.position.y) * 0.32;
    });

    // Subtle gentle desk rotation following pointer
    if (this.pointer.x > -500) {
      this.keyboardGroup.rotation.y += (this.pointer.x * 0.12 - this.keyboardGroup.rotation.y) * 0.05;
      this.keyboardGroup.rotation.x += (-this.pointer.y * 0.08 - this.keyboardGroup.rotation.x) * 0.05;
    }

    this.renderer.render(this.scene, this.camera);
  }
}
