import * as THREE from 'three';
import { sound } from './audio.js';

export const USER_CONFIG = {
  name: 'MUHAMMAD DAFFA',
  role: 'JUNIOR SOFTWARE DEVELOPER',
  specialization: 'FULL-STACK WEB & DATA INTEGRITY',
  status: 'CLEAN ARCHITECTURE // PRODUCTION READY',
  photoUrl: '/profile.jpg'
};

export class BadgeScene {
  constructor(canvas, onReady) {
    this.canvas = canvas;
    this.onReady = onReady;
    this.hasEntered = false;
    this.isDragging = false;
    this.mouse = { x: 0, y: 0, prevX: 0, prevY: 0 };
    this.profileImage = null;

    // Anchor point di atas layar (di luar batas atas viewport)
    this.defaultAnchorX = window.innerWidth < 960 ? 0 : 1.4;
    this.anchor = new THREE.Vector3(this.defaultAnchorX, 3.6, 0);

    // Posisi istirahat slot kartu
    this.restClipPos = new THREE.Vector3(this.defaultAnchorX, 1.15, 0);

    // Fisika posisi klip: mulai dari atas luar layar untuk animasi jatuh
    this.clipPos = new THREE.Vector3(this.defaultAnchorX, 4.4, 0);
    this.clipVel = new THREE.Vector3(0, 0, 0);

    // Offset saat pengguna mengeklik kartu
    this.grabOffset = new THREE.Vector2(0, 0);

    // Fisika rotasi kartu (mendukung inspeksi putar 360 derajat)
    this.cardRot = {
      z: 0.26,
      x: 0.24,
      y: -0.16,
      velZ: -0.4,
      velX: 0,
      velY: 0
    };

    this.init();
    this.setupLights();
    this.createBadgeAssembly();
    this.setupInteractions();
    this.loadProfilePhoto();
    this.animate();
  }

  init() {
    this.scene = new THREE.Scene();

    const w = window.innerWidth;
    const h = window.innerHeight;
    const aspect = w / h;

    this.defaultAnchorX = w < 960 ? 0 : 1.4;
    this.anchor.set(this.defaultAnchorX, 3.6, 0);
    this.restClipPos.set(this.defaultAnchorX, 1.15, 0);

    this.camera = new THREE.PerspectiveCamera(36, aspect, 0.1, 50);
    this.camera.position.set(0, 0, 7.5);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });

    const dpr = Math.min(window.devicePixelRatio || 1, 2.0);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.02;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
  }

  setupLights() {
    // 1. Ambient Light lembut seimbang - mempertahankan kontras pekat dan kedalaman warna
    const ambientLight = new THREE.AmbientLight(0xfff6ea, 0.50);
    this.scene.add(ambientLight);

    // 2. Key Light Studio Terarah - bayangan lembut PCF tanpa membuat wajah overexposed/silau
    this.keyLight = new THREE.DirectionalLight(0xfff5e6, 2.3);
    this.keyLight.position.set(this.defaultAnchorX + 1.3, 4.2, 3.8);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.width = 2048;
    this.keyLight.shadow.mapSize.height = 2048;
    this.keyLight.shadow.camera.near = 0.5;
    this.keyLight.shadow.camera.far = 16.0;
    this.keyLight.shadow.camera.left = -6.5;
    this.keyLight.shadow.camera.right = 6.5;
    this.keyLight.shadow.camera.top = 7.0;
    this.keyLight.shadow.camera.bottom = -7.0;
    this.keyLight.shadow.bias = -0.00015;
    this.keyLight.shadow.normalBias = 0.012;
    this.scene.add(this.keyLight);

    // Target keylight fokus ke pusat kartu
    this.keyLightTarget = new THREE.Object3D();
    this.keyLightTarget.position.set(this.defaultAnchorX, 0.7, 0);
    this.scene.add(this.keyLightTarget);
    this.keyLight.target = this.keyLightTarget;

    // 3. Rim / Edge Light Dingin - menonjolkan siluet tepi polikarbonat, logam, dan kain tali
    this.rimLight = new THREE.DirectionalLight(0xdce8ff, 2.5);
    this.rimLight.position.set(-4.0, 3.5, -2.2);
    this.scene.add(this.rimLight);

    // 4. Fill Light Studio dari kiri - kontras seimbang tanpa bayangan mati
    this.fillLight = new THREE.DirectionalLight(0xf2f6ff, 0.85);
    this.fillLight.position.set(-2.5, 1.2, 3.0);
    this.scene.add(this.fillLight);

    // 5. Top Kicker Light - kilau logam penjepit dan karabiner
    this.topKicker = new THREE.DirectionalLight(0xffeedd, 1.8);
    this.topKicker.position.set(this.defaultAnchorX, 5.5, 1.5);
    this.scene.add(this.topKicker);

    // 6. Interactive Specular Glint Halus - kilau aksen studio tanpa menyilaukan foto wajah
    this.specularLight = new THREE.PointLight(0xfff5ea, 0.20, 6, 2.0);
    this.specularLight.position.set(this.defaultAnchorX + 1.2, 2.2, 3.2);
    this.scene.add(this.specularLight);
  }

  loadProfilePhoto() {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = USER_CONFIG.photoUrl + '?v=' + Date.now();

    const onComplete = () => {
      this.profileImage = img;
      this.refreshCardTexture();
      this.triggerEntrance();
    };

    if (img.complete && img.naturalWidth > 0) {
      onComplete();
    } else {
      img.onload = onComplete;
      img.onerror = () => {
        this.refreshCardTexture();
        this.triggerEntrance();
      };
      setTimeout(() => {
        if (!this.hasEntered) this.triggerEntrance();
      }, 500);
    }
  }

  triggerEntrance() {
    if (this.hasEntered) return;
    this.hasEntered = true;

    this.canvas.classList.add('loaded');

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      this.clipPos.copy(this.restClipPos);
      this.clipVel.set(0, 0, 0);
      this.cardRot.z = 0;
      this.cardRot.x = 0;
      this.cardRot.y = 0;
    } else {
      this.clipPos.set(this.defaultAnchorX, 4.4, 0);
      this.clipVel.set(0, -8.5, 0);
      this.cardRot.z = 0.28;
      this.cardRot.x = 0.24;
      this.cardRot.y = -0.16;

      setTimeout(() => {
        sound.playKeyClick(false);
      }, 360);
    }

    if (typeof this.onReady === 'function') {
      this.onReady();
    }
  }

  refreshCardTexture() {
    const newTex = this.generateCardTexture();
    if (this.cardMesh && this.cardMesh.material) {
      if (this.cardMesh.material.map) {
        this.cardMesh.material.map.dispose();
      }
      this.cardMesh.material.map = newTex;
      this.cardMesh.material.needsUpdate = true;
    }
  }

  // Membuat tekstur depan ID card resolusi tinggi (1024x1536) dengan warna tajam & kontras tinggi
  generateCardTexture() {
    const w = 1024;
    const h = 1536;
    const cvs = document.createElement('canvas');
    cvs.width = w;
    cvs.height = h;
    const ctx = cvs.getContext('2d');

    // 1. Background Kartu: Bersih Berbobot dengan Kontras Studio (#F8F8F5)
    ctx.fillStyle = '#F8F8F5';
    ctx.fillRect(0, 0, w, h);

    // Grid titik mikro khas hardware engineering
    ctx.fillStyle = '#D6D6CE';
    const dotSpacing = 32;
    for (let x = 28; x < w - 28; x += dotSpacing) {
      for (let y = 28; y < h - 28; y += dotSpacing) {
        ctx.fillRect(x, y, 2.5, 2.5);
      }
    }

    // Border luar kartu (Solid Inky Dark)
    ctx.strokeStyle = '#0E1013';
    ctx.lineWidth = 7;
    ctx.strokeRect(36, 36, w - 72, h - 72);

    // Tanda sudut presisi (+)
    const drawCross = (cx, cy) => {
      ctx.strokeStyle = '#FF4500';
      ctx.lineWidth = 4.0;
      ctx.beginPath();
      ctx.moveTo(cx - 18, cy); ctx.lineTo(cx + 18, cy);
      ctx.moveTo(cx, cy - 18); ctx.lineTo(cx, cy + 18);
      ctx.stroke();
    };
    drawCross(60, 60);
    drawCross(w - 60, 60);
    drawCross(60, h - 60);
    drawCross(w - 60, h - 60);

    // 2. Header Bar Kartu (Matte Deep Charcoal + Safety Orange Accent)
    ctx.fillStyle = '#0E1013';
    ctx.fillRect(36, 36, w - 72, 88);

    ctx.fillStyle = '#FF4500';
    ctx.fillRect(36, 36, 14, 88);

    // Status LED dot hijau aktif menyala terang
    ctx.fillStyle = '#00E676';
    ctx.beginPath();
    ctx.arc(74, 80, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 24px monospace';
    ctx.fillText('ENGINEERING IDENTIFICATION', 98, 88);

    ctx.fillStyle = '#FF4500';
    ctx.font = '800 22px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('DEV-2026', w - 65, 88);
    ctx.textAlign = 'left';

    // 3. Foto Profil Muhammad Daffa (Proporsi Vertikal Portrait Sempurna, SANGAT JELAS)
    const photoW = 660;
    const photoH = 720;
    const photoX = Math.round((w - photoW) / 2);
    const photoY = 145;

    // Bingkai luar foto gelap tebal
    ctx.fillStyle = '#0E1013';
    ctx.fillRect(photoX - 7, photoY - 7, photoW + 14, photoH + 14);

    if (this.profileImage) {
      const img = this.profileImage;
      const imgW = img.naturalWidth || img.width;
      const imgH = img.naturalHeight || img.height;
      const imgAspect = imgW / imgH;
      const targetAspect = photoW / photoH;

      let sx, sy, sw, sh;
      if (imgAspect > targetAspect) {
        sh = imgH;
        sw = sh * targetAspect;
        sx = (imgW - sw) / 2;
        sy = 0;
      } else {
        sw = imgW;
        sh = sw / targetAspect;
        sx = 0;
        sy = Math.max(0, (imgH - sh) * 0.22);
      }

      ctx.save();
      // Meningkatkan saturasi warna dan kontras agar warna kulit segar alami dan latar merah kaya pekat
      ctx.filter = 'contrast(1.08) saturate(1.20)';
      ctx.drawImage(img, sx, sy, sw, sh, photoX, photoY, photoW, photoH);
      ctx.restore();
    } else {
      ctx.fillStyle = '#C62828';
      ctx.fillRect(photoX, photoY, photoW, photoH);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '700 36px "Space Grotesk", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('MUHAMMAD DAFFA', w / 2, photoY + photoH / 2);
      ctx.textAlign = 'left';
    }

    // Smart IC Microchip Emas Berkilau di pojok kanan bawah foto
    const chipW = 104;
    const chipH = 80;
    const chipX = photoX + photoW - chipW - 16;
    const chipY = photoY + photoH - chipH - 16;

    ctx.fillStyle = '#E5B83B';
    ctx.fillRect(chipX, chipY, chipW, chipH);
    ctx.strokeStyle = '#7A5C16';
    ctx.lineWidth = 3.0;
    ctx.strokeRect(chipX, chipY, chipW, chipH);
    ctx.strokeRect(chipX + 28, chipY + 18, 48, 44);
    ctx.beginPath();
    ctx.moveTo(chipX + 52, chipY); ctx.lineTo(chipX + 52, chipY + chipH);
    ctx.moveTo(chipX, chipY + 40); ctx.lineTo(chipX + chipW, chipY + 40);
    ctx.stroke();

    // 4. Nama Pengembang (Typography Tebal & Tajam)
    const textStartY = photoY + photoH + 62;
    ctx.fillStyle = '#0E1013';
    ctx.font = '800 62px "Space Grotesk", sans-serif';
    ctx.fillText(USER_CONFIG.name, photoX, textStartY);

    const roleY = textStartY + 45;
    ctx.fillStyle = '#FF4500';
    ctx.font = '700 28px "Space Grotesk", monospace, sans-serif';
    ctx.fillText('JUNIOR SOFTWARE DEVELOPER', photoX, roleY);

    ctx.strokeStyle = '#0E1013';
    ctx.lineWidth = 4.0;
    ctx.beginPath();
    ctx.moveTo(photoX, roleY + 22);
    ctx.lineTo(photoX + photoW, roleY + 22);
    ctx.stroke();

    // 5. Spesifikasi Teknis Junior Developer yang Mendetail (Kontras Tinggi)
    const drawSpec = (label, val, x, y) => {
      ctx.fillStyle = '#4B5362';
      ctx.font = '700 20px monospace';
      ctx.fillText(label, x, y);
      ctx.fillStyle = '#0E1013';
      ctx.font = '700 27px "Space Grotesk", sans-serif';
      ctx.fillText(val, x, y + 32);
    };

    drawSpec('SPESIALISASI', 'FULL-STACK WEB & DATA INTEGRITY', photoX, roleY + 70);
    drawSpec('PRINSIP REKAYASA', 'CLEAN CODE & DETAIL-ORIENTED', photoX, roleY + 155);
    drawSpec('STATUS PRODUKSI', 'DEV-2026 // PRODUCTION READY', photoX, roleY + 240);

    // 6. Barcode Hardware Teknis (Hitam Pekat Berbobot)
    const barX = photoX;
    const barY = 1350;
    const barW = photoW;
    const barH = 75;
    ctx.fillStyle = '#0E1013';

    let curX = barX;
    const barcodeWidths = [4, 2, 6, 3, 2, 5, 3, 2, 6, 4, 3, 5, 2, 4, 6, 2, 3, 5, 4, 2, 6, 3, 4, 5, 2, 6, 3, 4, 2, 5, 3, 6, 2, 4, 5, 3, 2, 6, 4, 3, 5, 2, 4, 6, 2, 5, 3, 4];
    let idx = 0;
    while (curX < barX + barW) {
      const bw = barcodeWidths[idx % barcodeWidths.length];
      const gap = (barcodeWidths[(idx + 3) % barcodeWidths.length] % 4) + 2;
      ctx.fillRect(curX, barY, bw, barH);
      curX += bw + gap;
      idx++;
    }

    ctx.fillStyle = '#505662';
    ctx.font = '700 20px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('AUTH-HASH: 9A82-MD-2026 // DETAIL-ORIENTED DEV', w / 2, barY + barH + 30);
    ctx.textAlign = 'left';

    const texture = new THREE.CanvasTexture(cvs);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 16;
    texture.needsUpdate = true;
    return texture;
  }

  // Membuat tekstur belakang kartu untuk inspeksi 360 derajat (Magnetic stripe & Technical Specs)
  generateCardBackTexture() {
    const w = 1024;
    const h = 1536;
    const cvs = document.createElement('canvas');
    cvs.width = w;
    cvs.height = h;
    const ctx = cvs.getContext('2d');

    // 1. Background Matte Dark Carbon
    ctx.fillStyle = '#111316';
    ctx.fillRect(0, 0, w, h);

    // Grid halus
    ctx.fillStyle = '#1E2126';
    for (let x = 28; x < w - 28; x += 32) {
      for (let y = 28; y < h - 28; y += 32) {
        ctx.fillRect(x, y, 2, 2);
      }
    }

    // 2. Strip Magnetik Hitam di Bagian Atas
    ctx.fillStyle = '#07080A';
    ctx.fillRect(36, 120, w - 72, 200);

    // Garis reflektif mikro magnetik
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    for (let y = 135; y < 305; y += 8) {
      ctx.fillRect(36, y, w - 72, 2);
    }

    // 3. Panel Tanda Tangan / Verifikasi (White Signature Strip)
    ctx.fillStyle = '#EDEDE8';
    ctx.fillRect(90, 360, w - 180, 110);
    ctx.fillStyle = '#4A505C';
    ctx.font = '700 20px monospace';
    ctx.fillText('AUTHORIZED SIGNATURE // VERIFIED DEV', 110, 425);
    ctx.font = '700 24px monospace';
    ctx.fillStyle = '#0E1013';
    ctx.fillText('MD-0926-DEV-SIGN', w - 380, 425);

    // 4. Modul Spesifikasi Rekayasa Sistem
    ctx.fillStyle = '#949BA6';
    ctx.font = '700 22px monospace';
    ctx.fillText('SYSTEM ENGINEERING SPECIFICATIONS', 90, 550);

    const drawBackSpec = (key, val, y) => {
      ctx.fillStyle = '#FF4500';
      ctx.font = '700 20px monospace';
      ctx.fillText(key, 90, y);
      ctx.fillStyle = '#E2E6EE';
      ctx.font = '600 22px "Space Grotesk", sans-serif';
      ctx.fillText(val, 90, y + 30);
    };

    drawBackSpec('CORE ARCHITECTURE', 'MODULAR // ASYNCHRONOUS // DATA-FIRST', 610);
    drawBackSpec('DATA INTEGRITY', '3NF RELATIONAL NORMALIZATION / ACID', 700);
    drawBackSpec('GRAPHICS PIPELINE', 'THREE.JS WEBGL2 // PCF SOFT SHADOWS', 790);
    drawBackSpec('RUNTIME METRICS', '60 FPS HiDPI RETINA // ZERO LEAK', 880);

    // 5. Diagram Jalur Sirkuit Micro-IC
    ctx.strokeStyle = '#2A2E36';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(90, 970, w - 180, 220);
    ctx.beginPath();
    ctx.moveTo(90, 1080); ctx.lineTo(w - 90, 1080);
    ctx.moveTo(350, 970); ctx.lineTo(350, 1190);
    ctx.moveTo(680, 970); ctx.lineTo(680, 1190);
    ctx.stroke();

    ctx.fillStyle = '#FF4500';
    ctx.font = '700 18px monospace';
    ctx.fillText('HARDWARE SMART-IC SECURITY MODULE // LEVEL-01', 110, 1010);
    ctx.fillStyle = '#A0A6B2';
    ctx.font = '16px monospace';
    ctx.fillText('CHIP SERIAL: MD-2026-X8849-012A', 110, 1050);
    ctx.fillText('FABRICATION: ANODIZED SILICON MATRIX', 110, 1130);

    // 6. Tanda Sertifikasi & Legal Standar
    ctx.fillStyle = '#717885';
    ctx.font = '700 20px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('CE   FC   RoHS   ISO-9001   W3C-VERIFIED', w / 2, 1270);
    ctx.font = '16px monospace';
    ctx.fillText('PROPERTY OF MUHAMMAD DAFFA // ALL RIGHTS RESERVED', w / 2, 1315);
    ctx.textAlign = 'left';

    const texture = new THREE.CanvasTexture(cvs);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 16;
    texture.needsUpdate = true;
    return texture;
  }

  // Membuat tekstur PBR kain tenun 3D + bump map mikro (MengTo 3d-cloth-material)
  createStrapTextures() {
    const w = 512;
    const h = 1024;

    const colorCvs = document.createElement('canvas');
    colorCvs.width = w;
    colorCvs.height = h;
    const cctx = colorCvs.getContext('2d');

    cctx.fillStyle = '#15171A';
    cctx.fillRect(0, 0, w, h);

    // Anyaman mikro twill/herringbone
    cctx.fillStyle = '#20242B';
    for (let y = 0; y < h; y += 6) {
      for (let x = 0; x < w; x += 10) {
        if ((Math.floor(x / 10) + Math.floor(y / 6)) % 2 === 0) {
          cctx.fillRect(x, y, 9, 5);
        }
      }
    }

    // Tepi kain anyaman penguat (selvedge) di kiri dan kanan
    cctx.fillStyle = '#0F1013';
    cctx.fillRect(0, 0, 36, h);
    cctx.fillRect(w - 36, 0, 36, h);

    // Jahitan benang ganda (edge running stitches)
    cctx.fillStyle = '#454C58';
    for (let y = 6; y < h; y += 18) {
      cctx.fillRect(16, y, 5, 11);
      cctx.fillRect(w - 21, y, 5, 11);
    }

    // Jalur balap Safety Orange di tengah
    const stripeW = 76;
    const stripeX = (w - stripeW) / 2;
    cctx.fillStyle = '#FF5722';
    cctx.fillRect(stripeX, 0, stripeW, h);

    // Reflektif mikro di dalam jalur oranye
    cctx.fillStyle = '#FF7547';
    for (let y = 0; y < h; y += 8) {
      cctx.fillRect(stripeX + 4, y, stripeW - 8, 3);
    }
    cctx.fillStyle = 'rgba(255, 255, 255, 0.32)';
    for (let y = 0; y < h; y += 16) {
      cctx.fillRect(w / 2 - 2, y, 4, 8);
    }

    // Bump Map
    const bumpCvs = document.createElement('canvas');
    bumpCvs.width = w;
    bumpCvs.height = h;
    const bctx = bumpCvs.getContext('2d');

    bctx.fillStyle = '#808080';
    bctx.fillRect(0, 0, w, h);

    bctx.fillStyle = '#B0B0B0';
    for (let y = 0; y < h; y += 6) {
      for (let x = 0; x < w; x += 10) {
        if ((Math.floor(x / 10) + Math.floor(y / 6)) % 2 === 0) {
          bctx.fillRect(x, y, 9, 5);
        }
      }
    }

    bctx.fillStyle = '#2A2A2A';
    for (let y = 6; y < h; y += 18) {
      bctx.fillRect(14, y - 2, 9, 15);
      bctx.fillRect(w - 23, y - 2, 9, 15);
    }
    bctx.fillStyle = '#EAEAEA';
    for (let y = 6; y < h; y += 18) {
      bctx.fillRect(16, y, 5, 11);
      bctx.fillRect(w - 21, y, 5, 11);
    }

    const colorTex = new THREE.CanvasTexture(colorCvs);
    colorTex.wrapS = THREE.RepeatWrapping;
    colorTex.wrapT = THREE.RepeatWrapping;
    colorTex.anisotropy = 16;

    const bumpTex = new THREE.CanvasTexture(bumpCvs);
    bumpTex.wrapS = THREE.RepeatWrapping;
    bumpTex.wrapT = THREE.RepeatWrapping;
    bumpTex.anisotropy = 16;

    return { colorTex, bumpTex };
  }

  createBadgeAssembly() {
    this.sceneRoot = new THREE.Group();
    this.scene.add(this.sceneRoot);

    // =========================================================================
    // 0. BIDANG BAYANGAN STUDIO EKSTRA LUAS (UNCLIPPED STUDIO SHADOW PLANE)
    // =========================================================================
    // Ukuran 42x34 unit mencakup seluruh sudut dan jangkauan seret kursor,
    // sehingga bayangan TIDAK AKAN PERNAH TERPOTONG lurus di kanan maupun kiri!
    const shadowPlaneGeo = new THREE.PlaneGeometry(42, 34);
    const shadowPlaneMat = new THREE.ShadowMaterial({
      opacity: 0.14,
      depthWrite: false
    });
    this.shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
    this.shadowPlane.position.set(this.defaultAnchorX, 0.5, -0.95);
    this.shadowPlane.receiveShadow = true;
    this.shadowPlane.renderOrder = -1;
    this.sceneRoot.add(this.shadowPlane);

    // =========================================================================
    // 1. TALI LANYARD 3D ASLI DENGAN KETEBALAN FISIK & KELENGKUNGAN CEMBUNG
    // =========================================================================
    const strapW = 0.36;
    const strapThickness = 0.038;
    const strapGeo = new THREE.BoxGeometry(strapW, 1.0, strapThickness, 4, 16, 2);

    const pos = strapGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const curve = Math.cos((x / (strapW / 2)) * (Math.PI / 2)) * 0.009;
      pos.setZ(i, pos.getZ(i) + (pos.getZ(i) >= 0 ? curve : -curve));
    }
    strapGeo.computeVertexNormals();

    const { colorTex, bumpTex } = this.createStrapTextures();

    this.strapMat = new THREE.MeshPhysicalMaterial({
      map: colorTex,
      bumpMap: bumpTex,
      bumpScale: 0.030,
      roughness: 0.68,
      metalness: 0.03,
      sheen: 0.92,
      sheenRoughness: 0.40,
      sheenColor: new THREE.Color(0xAAAAAA),
      side: THREE.DoubleSide
    });
    this.strapMesh = new THREE.Mesh(strapGeo, this.strapMat);
    this.strapMesh.castShadow = true;
    this.sceneRoot.add(this.strapMesh);

    // =========================================================================
    // 2. KELOMPOK PERANGKAT KERAS & KARTU ID (UNIFIED RIGID ASSEMBLY)
    // =========================================================================
    this.badgeAssembly = new THREE.Group();
    this.badgeAssembly.position.copy(this.clipPos);
    this.sceneRoot.add(this.badgeAssembly);

    const clampAnodizedMat = new THREE.MeshStandardMaterial({
      color: 0x1A1C20,
      roughness: 0.25,
      metalness: 0.88
    });

    const steelChromeMat = new THREE.MeshStandardMaterial({
      color: 0xDEE4EC,
      roughness: 0.12,
      metalness: 0.98
    });

    // a. Penjepit Tali Halus & Melengkung (Sculpted Die-Cast Ferrule - BUKAN KOTAK)
    // Penampang melingkar halus seperti kapsul/stadium, tanpa sudut tajam 90 derajat yang patah-patah!
    const ferruleGeo = new THREE.CylinderGeometry(0.18, 0.17, 0.22, 32);
    const ferruleMesh = new THREE.Mesh(ferruleGeo, clampAnodizedMat);
    ferruleMesh.scale.set(1.20, 1.0, 0.52);
    ferruleMesh.position.set(0, 0.51, 0);
    ferruleMesh.castShadow = true;
    this.badgeAssembly.add(ferruleMesh);

    // Bibir atas bundar halus (smooth rolled lip) tempat masuknya tali kain
    const topLipGeo = new THREE.TorusGeometry(0.175, 0.024, 16, 32);
    const topLip = new THREE.Mesh(topLipGeo, steelChromeMat);
    topLip.scale.set(1.20, 1.0, 0.52);
    topLip.rotation.x = Math.PI / 2;
    topLip.position.set(0, 0.62, 0);
    topLip.castShadow = true;
    this.badgeAssembly.add(topLip);

    // Aksen Safety Orange Dieter Rams melingkari ferrule tengah
    const ferruleStripeGeo = new THREE.CylinderGeometry(0.182, 0.172, 0.05, 32);
    const ferruleStripeMat = new THREE.MeshBasicMaterial({ color: 0xFF4500 });
    const ferruleStripe = new THREE.Mesh(ferruleStripeGeo, ferruleStripeMat);
    ferruleStripe.scale.set(1.20, 1.0, 0.52);
    ferruleStripe.position.set(0, 0.51, 0);
    this.badgeAssembly.add(ferruleStripe);

    // Dua paku keling bundar baja presisi di kiri dan kanan
    const rivetGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.02, 16);
    const rivetL = new THREE.Mesh(rivetGeo, steelChromeMat);
    rivetL.rotation.x = Math.PI / 2;
    rivetL.position.set(-0.11, 0.51, 0.052);
    rivetL.castShadow = true;
    this.badgeAssembly.add(rivetL);

    const rivetR = new THREE.Mesh(rivetGeo, steelChromeMat);
    rivetR.rotation.x = Math.PI / 2;
    rivetR.position.set(0.11, 0.51, 0.052);
    rivetR.castShadow = true;
    this.badgeAssembly.add(rivetR);

    // Leher bawah ferrule yang meramping halus ke swivel
    const neckCollarGeo = new THREE.CylinderGeometry(0.065, 0.050, 0.04, 32);
    const neckCollar = new THREE.Mesh(neckCollarGeo, steelChromeMat);
    neckCollar.position.set(0, 0.38, 0);
    neckCollar.castShadow = true;
    this.badgeAssembly.add(neckCollar);

    // b. Poros Putar Stainless Steel (Swivel Collar Joint) CNC Bubut
    const swivelBarrelGeo = new THREE.CylinderGeometry(0.046, 0.046, 0.07, 32);
    const swivelBarrel = new THREE.Mesh(swivelBarrelGeo, steelChromeMat);
    swivelBarrel.position.set(0, 0.33, 0);
    swivelBarrel.castShadow = true;
    this.badgeAssembly.add(swivelBarrel);

    const swivelFlangeGeo = new THREE.CylinderGeometry(0.058, 0.058, 0.018, 32);
    const swivelFlange = new THREE.Mesh(swivelFlangeGeo, steelChromeMat);
    swivelFlange.position.set(0, 0.365, 0);
    swivelFlange.castShadow = true;
    this.badgeAssembly.add(swivelFlange);

    // c. Kait Snap Logam Simetris (Symmetrical Die-Cast Lobster Snap Hook)
    // Sempurna simetris kiri-kanan, tanpa kawat bengkok aneh!
    // Cincin atas pengait ke swivel
    const hookTopRingGeo = new THREE.TorusGeometry(0.052, 0.016, 24, 36);
    const hookTopRing = new THREE.Mesh(hookTopRingGeo, steelChromeMat);
    hookTopRing.position.set(0, 0.26, 0);
    hookTopRing.castShadow = true;
    this.badgeAssembly.add(hookTopRing);

    // Lengan kurva simetris di kiri dan kanan (bahu pengait berbentuk tetesan elegan)
    const armGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.17, 24);
    const leftArm = new THREE.Mesh(armGeo, steelChromeMat);
    leftArm.position.set(-0.042, 0.15, 0);
    leftArm.rotation.z = 0.14;
    leftArm.castShadow = true;
    this.badgeAssembly.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, steelChromeMat);
    rightArm.position.set(0.042, 0.15, 0);
    rightArm.rotation.z = -0.14;
    rightArm.castShadow = true;
    this.badgeAssembly.add(rightArm);

    // Tuas pembuka pegas simetris di tengah
    const triggerGeo = new THREE.CylinderGeometry(0.013, 0.013, 0.12, 16);
    const triggerMat = new THREE.MeshStandardMaterial({
      color: 0x98A0AC,
      roughness: 0.28,
      metalness: 0.92
    });
    const triggerMesh = new THREE.Mesh(triggerGeo, triggerMat);
    triggerMesh.position.set(0, 0.14, 0.012);
    triggerMesh.castShadow = true;
    this.badgeAssembly.add(triggerMesh);

    // Lengkungan bawah kait U yang SIMETRIS melingkar masuk ke dalam lubang slot kartu
    const hookBottomGeo = new THREE.TorusGeometry(0.065, 0.020, 24, 48);
    const hookBottom = new THREE.Mesh(hookBottomGeo, steelChromeMat);
    hookBottom.position.set(0, 0.035, 0);
    hookBottom.rotation.z = Math.PI * 0.85;
    hookBottom.castShadow = true;
    this.badgeAssembly.add(hookBottom);

    // d. Casing Pemegang Kartu ID Tebal Berdimensi 3D (Heavy-Duty Polycarbonate Holder)
    const cardWidth = 2.1;
    const cardHeight = 3.15;
    const frameDepth = 0.16; // KETEBALAN FISIK NYATA 3D (tidak tipis seperti kertas lagi!)
    const totalFrameH = cardHeight + 0.28;

    // Frame ditempatkan dengan slot eyelet tepat di (0, 0, 0)
    const frameCenterY = -totalFrameH / 2 + 0.10;
    const frameGeo = new THREE.BoxGeometry(cardWidth + 0.18, totalFrameH, frameDepth);
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x121417,
      roughness: 0.32,
      metalness: 0.20
    });
    this.frameMesh = new THREE.Mesh(frameGeo, frameMat);
    this.frameMesh.position.set(0, frameCenterY, 0);
    this.frameMesh.castShadow = true;
    this.frameMesh.receiveShadow = false;
    this.badgeAssembly.add(this.frameMesh);

    // Bushing logam penguat slot di puncak frame kartu
    const eyeletGeo = new THREE.BoxGeometry(0.56, 0.14, frameDepth + 0.02);
    const eyeletMat = new THREE.MeshStandardMaterial({
      color: 0x2A2E36,
      roughness: 0.30,
      metalness: 0.82
    });
    const eyeletMesh = new THREE.Mesh(eyeletGeo, eyeletMat);
    eyeletMesh.position.set(0, totalFrameH / 2 - 0.10, 0);
    eyeletMesh.castShadow = true;
    this.frameMesh.add(eyeletMesh);

    // Lubang slot tembus tempat kait bertengger tepat di (y = 0.00 dalam badgeAssembly)
    const slotHoleGeo = new THREE.BoxGeometry(0.40, 0.08, frameDepth + 0.04);
    const slotHoleMat = new THREE.MeshBasicMaterial({ color: 0x050608 });
    const slotHoleMesh = new THREE.Mesh(slotHoleGeo, slotHoleMat);
    slotHoleMesh.position.set(0, totalFrameH / 2 - 0.10, 0);
    this.frameMesh.add(slotHoleMesh);

    // Kartu ID Depan (Ditempatkan presisi di permukaan depan frame dengan saturasi kaya & kemilau satin)
    const cardGeo = new THREE.PlaneGeometry(cardWidth, cardHeight);
    const cardMat = new THREE.MeshPhysicalMaterial({
      map: this.generateCardTexture(),
      roughness: 0.32,
      metalness: 0.0,
      clearcoat: 0.25,
      clearcoatRoughness: 0.20,
      reflectivity: 0.45
    });
    this.cardMesh = new THREE.Mesh(cardGeo, cardMat);
    this.cardMesh.position.set(0, -0.06, frameDepth / 2 + 0.002);
    this.cardMesh.castShadow = true;
    this.cardMesh.receiveShadow = false;
    this.frameMesh.add(this.cardMesh);

    // Bagian Belakang Kartu untuk Inspeksi 360 Derajat
    const backGeo = new THREE.PlaneGeometry(cardWidth, cardHeight);
    const backMat = new THREE.MeshPhysicalMaterial({
      map: this.generateCardBackTexture(),
      roughness: 0.35,
      metalness: 0.10,
      clearcoat: 0.40,
      clearcoatRoughness: 0.20
    });
    this.backMesh = new THREE.Mesh(backGeo, backMat);
    this.backMesh.position.set(0, -0.06, -frameDepth / 2 - 0.002);
    this.backMesh.rotation.y = Math.PI;
    this.backMesh.castShadow = true;
    this.backMesh.receiveShadow = false;
    this.frameMesh.add(this.backMesh);
  }

  setupInteractions() {
    window.addEventListener('resize', () => this.onResize());

    const getPointerWorld = (clientX, clientY) => {
      const pX = (clientX / window.innerWidth) * 2 - 1;
      const pY = -(clientY / window.innerHeight) * 2 + 1;
      this.pointer.x = pX;
      this.pointer.y = pY;

      const visibleH = 2 * Math.tan((this.camera.fov * Math.PI) / 360) * this.camera.position.z;
      const visibleW = visibleH * this.camera.aspect;
      return {
        x: pX * (visibleW / 2),
        y: pY * (visibleH / 2)
      };
    };

    const startDrag = (clientX, clientY) => {
      const worldPos = getPointerWorld(clientX, clientY);
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const hits = this.raycaster.intersectObject(this.frameMesh, true);
      
      if (hits.length > 0) {
        this.isDragging = true;
        document.body.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
        document.body.style.webkitUserSelect = 'none';

        this.grabOffset.x = this.clipPos.x - worldPos.x;
        this.grabOffset.y = this.clipPos.y - worldPos.y;
        this.mouse.prevX = clientX;
        this.mouse.prevY = clientY;
        sound.playKeyClick(true);
        return true;
      }
      return false;
    };

    const moveDrag = (clientX, clientY) => {
      const worldPos = getPointerWorld(clientX, clientY);

      if (this.isDragging) {
        const dx = clientX - this.mouse.prevX;
        const dy = clientY - this.mouse.prevY;
        this.mouse.prevX = clientX;
        this.mouse.prevY = clientY;

        // Translasi posisi kartu mengikuti jari/kursor
        const targetX = worldPos.x + this.grabOffset.x;
        const targetY = worldPos.y + this.grabOffset.y;

        const clampedX = Math.max(-3.4, Math.min(3.4, targetX));
        const clampedY = Math.max(0.35, Math.min(1.85, targetY));

        const followSpeed = 22.0;
        const dt = 1 / 60;
        this.clipVel.x += (clampedX - this.clipPos.x) * followSpeed;
        this.clipVel.y += (clampedY - this.clipPos.y) * followSpeed;
        this.clipVel.multiplyScalar(0.72);
        this.clipPos.x += this.clipVel.x * dt;
        this.clipPos.y += this.clipVel.y * dt;

        // Rotasi 360 Derajat saat ditarik horizontal
        this.cardRot.y += dx * 0.016;
        this.cardRot.x += -dy * 0.008;
        this.cardRot.z += dx * 0.005;
      } else {
        // Mode hover kursor pada desktop
        this.raycaster.setFromCamera(this.pointer, this.camera);
        const hits = this.raycaster.intersectObject(this.frameMesh, true);
        document.body.style.cursor = hits.length > 0 ? 'grab' : 'default';
      }
    };

    const endDrag = () => {
      if (this.isDragging) {
        this.isDragging = false;
        document.body.style.cursor = 'default';
        document.body.style.userSelect = '';
        document.body.style.webkitUserSelect = '';
        sound.playKeyClick(false);
      }
    };

    // 1. DUKUNGAN LAYAR SENTUH (TABLET & SMARTPHONE)
    window.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const hit = startDrag(touch.clientX, touch.clientY);
        if (hit) {
          e.preventDefault(); // Mencegah scrolling browser HANYA jika jari menyentuh kartu 3D
        }
      }
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      if (this.isDragging && e.touches.length > 0) {
        e.preventDefault(); // Tahan scroll HANYA saat kartu sedang ditarik jari
        const touch = e.touches[0];
        moveDrag(touch.clientX, touch.clientY);
      }
    }, { passive: false });

    window.addEventListener('touchend', () => {
      endDrag();
    });

    window.addEventListener('touchcancel', () => {
      endDrag();
    });

    // 2. DUKUNGAN MOUSE & POINTER (LAPTOP & DESKTOP)
    window.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch') return; // Sudah ditangani oleh touchstart secara presisi
      const hit = startDrag(e.clientX, e.clientY);
      if (hit) {
        e.preventDefault(); // Mencegah klik tombol di balik kartu HANYA saat kursor mengeklik kartu 3D
      }
    });

    window.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      moveDrag(e.clientX, e.clientY);
    });

    window.addEventListener('pointerup', (e) => {
      if (e.pointerType === 'touch') return;
      endDrag();
    });

    window.addEventListener('pointercancel', (e) => {
      if (e.pointerType === 'touch') return;
      endDrag();
    });
  }

  onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (w === 0 || h === 0) return;

    this.defaultAnchorX = w < 960 ? 0 : 1.4;
    this.anchor.set(this.defaultAnchorX, 3.6, 0);
    this.restClipPos.set(this.defaultAnchorX, 1.15, 0);

    if (this.keyLight) {
      this.keyLight.position.set(this.defaultAnchorX + 1.2, 4.5, 4.2);
    }
    if (this.keyLightTarget) {
      this.keyLightTarget.position.set(this.defaultAnchorX, 0.7, 0);
    }
    if (this.topKicker) {
      this.topKicker.position.set(this.defaultAnchorX, 5.5, 1.5);
    }
    if (this.shadowPlane) {
      this.shadowPlane.position.set(this.defaultAnchorX, 0.5, -0.95);
    }
    if (this.specularLight) {
      this.specularLight.position.set(this.defaultAnchorX + 1.0, 2.0, 2.5);
    }

    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const dt = 1 / 60;

    // 1. Sinkronisasi scroll halaman
    const scrollY = window.scrollY || 0;
    const visibleH = 2 * Math.tan((this.camera.fov * Math.PI) / 360) * this.camera.position.z;
    const worldPerPixel = visibleH / window.innerHeight;
    this.sceneRoot.position.y = scrollY * worldPerPixel;

    // 2. Kilau Specular PointLight bergerak halus mengikuti kursor
    if (this.specularLight) {
      this.specularLight.position.x = this.defaultAnchorX + 1.0 + this.pointer.x * 1.5;
      this.specularLight.position.y = 1.8 + this.pointer.y * 1.2;
    }

    // 3. Fisika posisi slot kartu saat tidak diseret (Spring Pendulum Alami)
    if (!this.isDragging) {
      const springK = 14.0;
      const dampK = 2.8;

      const forceX = (this.restClipPos.x - this.clipPos.x) * springK - this.clipVel.x * dampK;
      const forceY = (this.restClipPos.y - this.clipPos.y) * springK - this.clipVel.y * dampK;

      this.clipVel.x += forceX * dt;
      this.clipVel.y += forceY * dt;

      this.clipPos.x += this.clipVel.x * dt;
      this.clipPos.y += this.clipVel.y * dt;
    }

    // 4. Fisika Ayunan Rotasi Kartu ID (Inersia + Rotasi 360 Derajat + Kemiringan Hover)
    const strapDirX = this.clipPos.x - this.anchor.x;
    const strapDirY = this.anchor.y - this.clipPos.y;
    const strapAngleZ = Math.atan2(strapDirX, Math.max(0.1, strapDirY));

    const t = performance.now() * 0.0015;
    const idleZ = Math.sin(t * 1.4) * 0.015;
    const idleX = Math.cos(t * 1.1) * 0.012;

    let targetRotZ = strapAngleZ + idleZ;
    let targetRotX = idleX;
    let targetRotY = 0; // Kembalikan kartu menghadap depan saat tidak diseret

    if (this.isDragging) {
      targetRotZ -= this.clipVel.x * 0.035;
      targetRotX += this.clipVel.y * 0.03;
    } else {
      // Kemiringan hover perspektif saat kursor melayang
      targetRotZ += this.pointer.x * 0.14;
      targetRotX += -this.pointer.y * 0.12;

      // Pegas rotasi kembali ke orientasi depan (360 putaran halus)
      const springYaw = 6.0;
      const dampYaw = 2.4;
      this.cardRot.velY += ((targetRotY - this.cardRot.y) * springYaw - this.cardRot.velY * dampYaw) * dt;
      this.cardRot.y += this.cardRot.velY * dt;
    }

    const springRotK = 16.0;
    const dampRotK = 3.0;

    this.cardRot.velZ += ((targetRotZ - this.cardRot.z) * springRotK - this.cardRot.velZ * dampRotK) * dt;
    this.cardRot.z += this.cardRot.velZ * dt;

    this.cardRot.velX += ((targetRotX - this.cardRot.x) * springRotK - this.cardRot.velX * dampRotK) * dt;
    this.cardRot.x += this.cardRot.velX * dt;

    // 5. Terapkan Posisi & Rotasi Perakitan Kartu ID
    // Angkat sedikit di sumbu Z saat berputar 360 derajat agar tepi kartu tidak pernah memotong bidang bayangan
    const liftZ = Math.abs(Math.sin(this.cardRot.y)) * 0.35;
    this.badgeAssembly.position.set(this.clipPos.x, this.clipPos.y, liftZ);
    this.badgeAssembly.rotation.set(this.cardRot.x, this.cardRot.y, this.cardRot.z);
    this.badgeAssembly.updateMatrixWorld(true);

    // 6. Hubungkan Tali Lanyard Secara Sempurna ke Mulut Atas Clamp (y = 0.62 lokal)
    // Tanpa ada celah / gap sama sekali!
    const clampMouthWorld = new THREE.Vector3(0, 0.62, 0).applyMatrix4(this.badgeAssembly.matrixWorld);
    const strapVec = new THREE.Vector3().subVectors(clampMouthWorld, this.anchor);
    const strapLen = strapVec.length();
    const strapDir = strapVec.clone().normalize();

    this.strapMesh.position.copy(this.anchor).addScaledVector(strapDir, strapLen * 0.5);
    this.strapMesh.scale.set(1, strapLen, 1);
    this.strapMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), strapDir);

    if (this.strapMat && this.strapMat.map) {
      this.strapMat.map.repeat.set(1, strapLen * 0.85);
    }
    if (this.strapMat && this.strapMat.bumpMap) {
      this.strapMat.bumpMap.repeat.set(1, strapLen * 0.85);
    }

    this.renderer.render(this.scene, this.camera);
  }
}
