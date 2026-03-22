# Elderfield — v2.8.1 Town & NPC Foundations • Performance Hotfix

A browser-playable top-down fantasy adventure built with plain HTML, CSS, and JavaScript.

## New in v2.8.1
- performance hotfix for the painterly pass using cached ground rendering and cached vignette overlay
- keeps the painterly fantasy look while targeting a steadier framerate
- save/load, town foundations, and top-right build badge remain intact

## Save behavior
- the game stores progress in your browser
- saves include: hearts, rupees, relics, dungeon state, owned weapons, active weapon, sword level, area, and checkpoint
- on reload, use **Continue Adventure** to resume
- use **New Journey** to begin fresh
- use **Delete Save** to wipe the stored run

## Story foundations currently in play
- **Princess:** Elaria Vale
- **Ancient Evil:** the Briar King
- **Forgotten Order:** the Dawn Wardens
- **Heroic Line:** the Aurel line
- **Dragon Names:** Vaelor the High Wyrm, Cindervane

## Controls
- **Move:** WASD or Arrow Keys
- **Attack:** Click / tap
- **Rapid attack:** Hold click / tap with rapid-fire advanced weapons
- **Run:** Hold Shift or Ctrl while moving
- **Interact / Continue:** Enter
- **Switch weapon:** Q / E or 1 / 2 / 3
- **Debug:** F3 or `~`
- **Hitboxes:** F4
- **Clear enemies:** F6
- **Heal:** H
- **Reset game:** F8

## Included files
- `index.html`
- `style.css`
- `game.js`
- `README.md`
- `WORLD_BIBLE_STARTER.md`
- `VERSION_SPINE.md`
- `LORE_FOUNDATION.md`

## GitHub Pages
Upload the files to your repo root and enable GitHub Pages from the main branch root.

## Verify the update worked
Look for:
- on-screen build badge: `v2.8.1 • Town & NPC Foundations • Performance Hotfix`
- the build badge now living in the **top-right**
- start card buttons for **Continue Adventure / New Journey / Delete Save**
- debug report including a **Save** section
- progress returning after refresh when a save exists


## v2.8.0 notes

- Added Dawnrest, the first safe haven on the Warden road
- Added named NPC foundations and early side-quest hooks
- Shifted toward a softer painterly fantasy 2D presentation


## v2.8.1 notes

- Fixed low-FPS regression from the initial painterly pass
- Static terrain is now cached instead of being fully repainted every frame
- Vignette overlay is cached instead of regenerated each draw
