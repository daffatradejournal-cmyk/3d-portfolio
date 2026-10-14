import { sound } from './audio.js';

export function setupCommonNav(activePageName) {
  // Live UTC & WIB Clock (WIB = UTC+7)
  const clockEl = document.getElementById('live-clock');
  if (clockEl) {
    const update = () => {
      const now = new Date();

      // UTC Time
      const utcHrs = String(now.getUTCHours()).padStart(2, '0');
      const utcMins = String(now.getUTCMinutes()).padStart(2, '0');
      const utcSecs = String(now.getUTCSeconds()).padStart(2, '0');

      // WIB Time (Waktu Indonesia Barat = UTC+7)
      const wibDate = new Date(now.getTime() + 7 * 60 * 60 * 1000);
      const wibHrs = String(wibDate.getUTCHours()).padStart(2, '0');
      const wibMins = String(wibDate.getUTCMinutes()).padStart(2, '0');
      const wibSecs = String(wibDate.getUTCSeconds()).padStart(2, '0');

      clockEl.innerText = `${utcHrs}:${utcMins}:${utcSecs} UTC // ${wibHrs}:${wibMins}:${wibSecs} WIB`;
    };
    update();
    setInterval(update, 1000);
  }

  // Audio Toggle
  const soundBtn = document.getElementById('sound-toggle-btn');
  const soundLed = document.getElementById('sound-led');
  const soundLabel = document.getElementById('sound-label');

  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      const enabled = sound.toggleSound();
      sound.playToggle();
      if (soundLed) soundLed.classList.toggle('active', enabled);
      if (soundLabel) soundLabel.innerText = enabled ? 'AUDIO: ON' : 'AUDIO: OFF';
    });
  }

  // Set active link
  document.querySelectorAll('.nav-links a').forEach((link) => {
    if (link.dataset.page === activePageName) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Sound feedback on buttons
  document.querySelectorAll('button, .hardware-btn, .hardware-btn-sm, .nav-item, .project-link').forEach((el) => {
    el.addEventListener('click', () => {
      sound.playKeyClick(true);
    });
  });
}
