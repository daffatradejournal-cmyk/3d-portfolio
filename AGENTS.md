# 3D Website Project Guidelines & Anti-Slop Standards

This project follows **MengTo's 3D and WebGL Agent Skills** (`.agents/skills/`) combined with strict **Anti-Slop Industrial Design Standards** inspired by **Teenage Engineering** and **Dieter Rams (Braun)**.

---

## 🚫 Anti-Slop Enforcement Rules (Strictly Enforced)

1. **No Fake Sci-Fi / Cyberpunk Jargon**:
   - Strictly prohibit invented filler badges like `"SECURITY CLEARANCE: TIER-01"`, `"TELEMETRY PROTOCOL"`, or `"100% DETERMINISTIC LOGIC"`.
   - Write genuine, human, precise engineering copy: actual Information Systems concepts (relational normal forms, DFD modeling, ACID transactions, data schemas).

2. **No Ornamental Bento Box Theater**:
   - Reject walls of cramped gray boxes stuffed with repeated lorem-ipsum pills.
   - Use clean, breathable Swiss layout with generous whitespace and clear hierarchy.

3. **Real, Unmistakable 3D Depth**:
   - The 3D object must never be trapped in a tiny static preview box.
   - Must cast real contact shadows onto a studio floor (`shadowMap.type = THREE.PCFSoftShadowMap`).
   - Must support smooth 360-degree orbit drag inspection with momentum and zoom (`3d-orbit-inspect-demo`).
   - Interactive physical knobs and pressable mechanical keys with synthesized Web Audio tactile clicks.
   - Materials must be physically based (anodized aluminum with roughness 0.35, matte PBT plastic, high-contrast OLED display).

4. **Authentic Multi-Page Architecture**:
   - `/` (`index.html`): Hero 3D Hardware Stage + System Overview.
   - `/about.html`: Profile narrative, Information Systems curriculum, Dieter Rams design manifesto.
   - `/projects.html`: Real case studies (problem, system architecture, database schema, live demo, source code).
   - `/contact.html`: Direct communication console, copy email, verified social channels.

---

## 🛠️ Tech Stack

- **Renderer**: Three.js (`three`) r170+ with WebGL2 and PCFSoftShadowMap
- **Bundler**: Vite (`vite`, `vite-plugin-glsl`) configured for Multi-Page App
- **Typography**: Space Grotesk (Swiss headings) & JetBrains Mono (Technical specs)
- **Palette**: Studio Concrete (`#ECECE8`), Matte Charcoal (`#121417`), Safety Orange (`#FF5722`), Brushed Silver (`#C4C6C0`)
- **Audio**: Web Audio API tactile mechanical switch synthesizer
