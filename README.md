# Elderfield v3.10.0 — Rootwood Roadhold Pass

# Elderfield — v3.10.0 Rootwood Roadhold Pass

A browser-playable top-down fantasy adventure built with plain HTML, CSS, and JavaScript.

## New in v3.10.0
- Rootwood March now has a stronger roadside watch feel with a root-braced roadhold, palisade stakes, lantern posts, and ranger gear props
- Dawnrest gained more lived-in village detail with shrine braziers, road lanterns, and a supply cart
- Crownfall's northern approach now has rune-cut obelisks to better sell the sacred tragic road language
- a new Rootwood tracker NPC, Brannoc Thornstep, reinforces the third-road tone without resetting progression
- tree silhouettes and house kits were pushed further toward richer handcrafted fantasy readability

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
- on-screen build badge: `v3.10.0 • Rootwood Roadhold Pass`
- the build badge now living in the **top-right**
- start card buttons for **Continue Adventure / New Journey / Delete Save**
- debug report including a **Save** section
- progress returning after refresh when a save exists


## v3.9.0 notes

- Added Dawnrest, the first safe haven on the Warden road
- Added named NPC foundations and early side-quest hooks
- Shifted toward a softer painterly fantasy 2D presentation


## v3.9.0 notes

- Fixed low-FPS regression from the initial painterly pass
- Static terrain is now cached instead of being fully repainted every frame
- Vignette overlay is cached instead of regenerated each draw


## v3.9.0 notes

- Added Whisperroot Grotto and Bridge-Stone Cache
- Added cracked wall reveals in Crownfall and Greenhollow
- Added secret chests, Heart Fragments, and an Elowen heirloom payoff
- Added rune-plate and push-block puzzle hooks for future expansion


## v3.9.0 Notes
- Improved human-like player/NPC silhouettes
- More defined monsters by region
- Dawnrest homes and shops are now enterable
- Added interior props, weapon chests, lanterns, and more LOTR-style village detail


## v3.10.0 notes

- Focused this pass on Rootwood-side world readability instead of touching stable save/debug systems
- Added new overworld prop rendering for lantern posts, braziers, obelisks, carts, palisade stakes, and the Rootwood roadhold
- Improved tree layering and house detailing to push the look farther away from flat blocky filler
- Build/version strings now report v3.10.0 / Rootwood Roadhold Pass
