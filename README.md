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
Defeat every enemy in the field, then walk back to the shrine and interact with it.

## Run locally
Open `index.html` directly in a browser, or serve the folder with any simple local server.

## GitHub Pages
1. Create a repo.
2. Upload these files to the repo root.
3. In GitHub, open **Settings > Pages**.
4. Set the source to deploy from the main branch root.
5. Save.
6. Open the generated Pages URL.

## Good next upgrades
- Hearts rendered as pixel icons instead of HUD text
- Rupees and pickups
- NPC dialogue and signs
- Interior dungeon rooms
- Sword cooldown tuning and enemy knockback polish
- Pause menu and title music
- Save points and multi-map zones


## Upgrade pass v1.1.0

Added a hidden developer overlay for faster testing and future expansion.

### Debug shortcuts
- `F3` or `` ` ``: toggle debug overlay
- `F4`: toggle hitboxes and aggro circles
- `F6`: clear all enemies for testing
- `H`: refill player hearts
- `F8`: reset the current field

### What the overlay shows
- version and FPS
- player position and facing direction
- attack timer and invulnerability time
- camera position and canvas size
- pointer world position
- living enemy count and particle count
- touch input state
- last debug action
