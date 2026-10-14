import { BadgeScene } from './badge.js';
import { KeycapsScene, KEYCAPS_DATA } from './keycaps.js';
import { sound } from './audio.js';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Lenis Smooth Scroll (MengTo cinematic-gsap-lenis-motion-system skill)
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  // 2. Initialize 3D Hero ID Badge Scene
  const badgeCanvas = document.getElementById('hero-badge-canvas');
  let badgeScene = null;
  if (badgeCanvas) {
    badgeScene = new BadgeScene(badgeCanvas);
  }

  // 3. Initialize 3D Mechanical Keycaps Scene
  const keycapsCanvas = document.getElementById('keycaps-canvas');
  let keycapsScene = null;
  if (keycapsCanvas) {
    keycapsScene = new KeycapsScene(keycapsCanvas, (selectedData) => {
      updateTelemetryReadout(selectedData);
    });
  }

  // Telemetry Readout Element References
  const inspectCodeEl = document.getElementById('inspect-code');
  const inspectNameEl = document.getElementById('inspect-name');
  const inspectCatEl = document.getElementById('inspect-cat');
  const inspectDescEl = document.getElementById('inspect-desc');
  const keyPills = document.querySelectorAll('.key-pills .pill');

  function updateTelemetryReadout(data) {
    if (!data) return;
    if (inspectCodeEl) inspectCodeEl.innerText = `SWITCH_ID: ${data.legend}`;
    if (inspectNameEl) inspectNameEl.innerText = data.name;
    if (inspectCatEl) inspectCatEl.innerText = data.category;
    if (inspectDescEl) inspectDescEl.innerText = data.desc;

    keyPills.forEach((p) => {
      if (p.dataset.key === data.id) {
        p.classList.add('active');
      } else {
        p.classList.remove('active');
      }
    });

    // Tactile brief flash effect
    if (inspectCodeEl) {
      inspectCodeEl.style.backgroundColor = 'rgba(255, 87, 34, 0.35)';
      setTimeout(() => {
        inspectCodeEl.style.backgroundColor = 'rgba(255, 87, 34, 0.1)';
      }, 150);
    }
  }

  // Key Pill Click interaction
  keyPills.forEach((pill) => {
    pill.addEventListener('click', () => {
      const keyId = pill.dataset.key;
      const data = KEYCAPS_DATA.find((k) => k.id === keyId);
      if (data) {
        sound.playKeyClick(true);
        updateTelemetryReadout(data);
        
        // Find corresponding mesh and press it
        if (keycapsScene) {
          const targetMesh = keycapsScene.keyMeshes.find((m) => m.userData.data.id === keyId);
          if (targetMesh) {
            keycapsScene.pressKey(targetMesh);
            setTimeout(() => {
              keycapsScene.releaseAllKeys();
            }, 250);
          }
        }
      }
    });
  });

  // 4. Live Instrument UTC Clock
  const clockEl = document.getElementById('live-clock');
  function updateClock() {
    if (!clockEl) return;
    const now = new Date();
    const hrs = String(now.getUTCHours()).padStart(2, '0');
    const mins = String(now.getUTCMinutes()).padStart(2, '0');
    const secs = String(now.getUTCSeconds()).padStart(2, '0');
    clockEl.innerText = `${hrs}:${mins}:${secs} UTC`;
  }
  updateClock();
  setInterval(updateClock, 1000);

  // 5. Sound FX Toggle Button
  const soundBtn = document.getElementById('sound-toggle-btn');
  const soundLed = document.getElementById('sound-led');
  const soundLabel = document.getElementById('sound-label');

  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      const isEnabled = sound.toggleSound();
      sound.playToggle();

      if (isEnabled) {
        soundLed.classList.add('active');
        soundLabel.innerText = 'AUDIO: ON';
        showToast('TACTILE MECHANICAL AUDIO ENABLED');
      } else {
        soundLed.classList.remove('active');
        soundLabel.innerText = 'AUDIO: OFF';
        showToast('AUDIO MUTED');
      }
    });
  }

  // 6. Copy Email to Clipboard with Tactile Feedback
  const copyBtn = document.getElementById('copy-email-btn');
  const emailSpan = document.getElementById('email-address');

  if (copyBtn && emailSpan) {
    copyBtn.addEventListener('click', async () => {
      sound.playKeyClick(true);
      const email = emailSpan.innerText.trim();
      try {
        await navigator.clipboard.writeText(email);
        showToast(`COPIED [${email}] TO CLIPBOARD`);
      } catch (err) {
        showToast('COPIED TO CLIPBOARD');
      }
    });
  }

  // 7. Tactile Toast Notification
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toast-msg');
  let toastTimer = null;

  function showToast(message) {
    if (!toast || !toastMsg) return;
    toastMsg.innerText = message;
    toast.classList.add('visible');

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('visible');
    }, 2800);
  }

  // 8. Navigation Active State on Scroll
  const navItems = document.querySelectorAll('.nav-links .nav-item');
  const sections = document.querySelectorAll('.section');

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY + 200;
    sections.forEach((sec) => {
      const top = sec.offsetTop;
      const height = sec.offsetHeight;
      const id = sec.getAttribute('id');

      if (scrollY >= top && scrollY < top + height) {
        navItems.forEach((link) => {
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  });

  // 9. Back to Top Button
  const scrollTopBtn = document.getElementById('scroll-top-btn');
  if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', () => {
      sound.playToggle();
      lenis.scrollTo(0);
    });
  }

  // 10. Play subtle switch click on all hardware buttons and cards
  document.querySelectorAll('.hardware-btn, .hardware-btn-sm, .channel-btn, .nav-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      sound.playKeyClick(true);
    });
  });

  // 11. Initial Entry Animations (GSAP Reveal)
  gsap.from('.hero-meta-panel > *', {
    y: 24,
    opacity: 0,
    stagger: 0.1,
    duration: 0.8,
    ease: 'power3.out',
    delay: 0.15
  });

  gsap.from('.hero-3d-viewport', {
    scale: 0.96,
    opacity: 0,
    duration: 1,
    ease: 'power2.out',
    delay: 0.25
  });
});
