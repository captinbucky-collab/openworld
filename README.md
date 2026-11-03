# NEON CITY — FINAL EDITION

A polished, modular browser-based open-world 3D game foundation using **Three.js, JavaScript and Vite**.

## Features
- Procedural city grid with 64 building shells, roads, footpaths, traffic lights, street lamps and crosswalks
- Third-person player movement, sprint, jump, crouch, punch, stamina and health
- 12 drivable/traffic vehicles with fuel, basic handling and vehicle exit
- 34 pedestrians, weapon pickups and basic crime/wanted response
- Four weapon slots, shooting, ammunition, reload and drop
- Enterable interiors with rooms, bed, wardrobe, weapon locker, furniture and stairs
- Property ownership for $5,000 and local browser save points
- Cash, delivery mission, property and exploration objectives with rewards
- Minimap, inventory, day/night lighting and persistent save/load
- GitHub Actions build and GitHub Pages deployment

## Start locally
Install Node.js 20+ (22 recommended):
```bash
npm install
npm run dev
```
Open the Vite local URL. Click START GAME and click the scene to capture the mouse.

## Controls
| Key | Action |
|---|---|
| WASD | Walk / drive |
| Mouse | Look around |
| Shift | Sprint |
| Space | Jump / handbrake |
| Q | Punch |
| C | Crouch |
| E | Enter / use interior furniture / exit |
| F | Enter / exit vehicle |
| B | Buy nearby property ($5,000) |
| Left click | Shoot |
| R | Reload |
| G | Drop selected weapon |
| 1–4 | Select weapon |
| M | Toggle map |
| Tab | Toggle inventory |
| J | Complete active delivery mission |
| F5 / F9 | Save / load |

## GitHub deployment
1. Create a GitHub repository and upload the contents of this folder.
2. Keep `.github/workflows/build.yml` in its exact path.
3. In repository Settings → Pages, choose **GitHub Actions** as the source.
4. Push to `main` or `master`. The workflow installs dependencies, builds and deploys the `dist` folder.

## Project structure
- `src/main.js` — game loop, camera, input and HUD
- `src/world.js` — city, buildings, traffic, NPCs and pickups
- `src/player.js` — player and vehicle controls
- `src/systems.js` — interiors, property, weapons, interactions and wanted response
- `src/missions.js` — mission progression and rewards
- `src/save.js` — local browser save/load
- `src/config.js` — tuning constants and weapon definitions

## Asset note
The city currently uses procedural meshes so it runs without external model downloads. The GLTF loading pipeline is the next asset-integration step: add licensed `.glb` files under `public/models/` and load them with `GLTFLoader` from `three/addons/loaders/GLTFLoader.js`. Do not distribute models/textures without permission.

This is a substantial playable indie-game prototype, not a reproduction of GTA V or a finished AAA game. Realistic scanned assets, authored story missions, full police pathfinding, collision/navmesh, advanced vehicle simulation, multiplayer and console-grade optimization require dedicated assets and further engineering. The project is structured to support those additions without pretending they are already present.
