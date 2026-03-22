# Elderfield

A simple original retro top-down browser adventure inspired by classic 16-bit field exploration.

## Included
- `index.html`
- `style.css`
- `game.js`

## Controls
- **Move:** WASD or Arrow Keys
- **Attack:** Click or tap the game area toward the direction you want to slash
- **Interact:** Enter key or the mobile Enter button

## Goal
Defeat every enemy in the field, gather the rupees they drop, then walk back to the shrine and interact with it.

## Run locally
Open `index.html` directly in a browser, or serve the folder with any simple local server.

## GitHub Pages
1. Create a repo.
2. Upload these files to the repo root.
3. In GitHub, open **Settings > Pages**.
4. Set the source to deploy from the main branch root.
5. Save.
6. Open the generated Pages URL.

## Upgrade pass v2.0.0 — Diagnostics Pass

This build turned the old hidden overlay into a real diagnostics layer so you can verify GitHub uploads and copy a clean debug report fast.

### New in v2.0.0
- always-visible on-screen build/version badge
- live status pill with traffic-light states:
  - `GOOD` = green
  - `WARN` = yellow
  - `ISSUE` = red
- copyable debug report button inside the overlay
- runtime error capture for window errors and rejected promises
- hitbox and aggro-circle rendering when debug draw is enabled

## Upgrade pass v2.1.0 — Hero Pass

This build adds the first real reward loop and a little more combat juice.

### New in v2.1.0
- pixel-style heart HUD instead of plain health text
- rupee counter in the top HUD
- enemies drop rupees when defeated
- player can collect rupees directly in the field
- stronger enemy knockback and hit feel
- extra slash sparkle polish
- area banner for major moments like entering the meadow or clearing the field
- shrine victory flow now reports your rupee total
- debug report now includes zone, rupees, pickups, and camera shake

### Debug shortcuts
- `F3` or `` ` ``: toggle debug overlay
- `F4`: toggle hitboxes and aggro circles
- `F6`: clear all enemies
- `H`: heal player
- `F8`: reset the field

## Good next upgrades
- first cave or dungeon entrance
- locked door + key system
- rupee spend/use loop
- NPC dialogue and signs
- interior dungeon rooms
- title screen music and effects
- save points and multi-map zones
