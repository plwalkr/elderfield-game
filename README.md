# Elderfield — v3.13.0 Tile Language Reset I

This pass is a visual reset, not a content expansion pass.

The goal is to move Elderfield away from smooth procedural-shape rendering and closer to a more handcrafted late-90s / early-2000s top-down fantasy feel: crisper tile surfaces, stronger cliff faces, blockier tree masses, less modern gradient softness, and more sprite-like character bodies.

## New in v3.13.0

- switched the main canvas render path to **no smoothing** so the core image stays crisper
- rebuilt the **ground tile language** to use tighter, more square, less painted-looking grass/path/stone patterns
- strengthened **raised ground / cliff face readability** with clearer caps, faces, and stratified ledge shading
- replaced the softer macro terrain wash with much subtler **screen-scale banding / relief accents**
- rebuilt the cached **tree silhouettes** into more blocky, tile-authored canopy masses with region-specific color identity
- rebuilt **houses** into a more square, readable fantasy sprite/tile style instead of rounded vector-like forms
- rebuilt the shared **humanoid figure language** so the player, NPCs, and knight family read more like little fantasy sprites
- gave the non-knight enemy bodies a more angular pixel-shape treatment
- updated build strings/UI text to **v3.13.0 • Tile Language Reset I**

## Files

Upload these to your GitHub Pages repo root:

- `index.html`
- `style.css`
- `game.js`

## Controls

- move: `WASD` or arrow keys
- sprint/run: hold `Shift` or `Ctrl` while moving
- attack: left click / tap
- interact: `Enter` or right click
- debug: open the in-game debug panel and use the copy report feature

## Notes

This is a **visual language reset foundation**. It is not final art, and it is not the whole answer by itself. The point of this pass is to change the rendering grammar so future authored screens, buildings, cliffs, and sprites can move in the right direction instead of piling more detail onto the old one.

## Verify after upload

- on-screen build badge: `v3.13.0 • Tile Language Reset I`
- debug/build info showing **v3.13.0**
- the overworld grass/path/stone surfaces look less soft/painted and more deliberate
- trees read more like chunky tile masses instead of smooth canopy blobs
- houses feel more square and SNES/GBA-like in silhouette
- player/NPC/knight bodies feel more sprite-like
- save/load/debug copy still work normally
