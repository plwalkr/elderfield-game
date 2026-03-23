# Elderfield — v3.14.0 ALTTP Benchmark Reset

This is a **big visual benchmark pass** plus a real pause feature.

The goal of v3.14.0 is to stop inching forward and make Elderfield read much more like the direction you actually want: a stronger **A Link to the Past / late-SNES / early-GBA adventure feel** instead of a smooth procedural prototype.

## New in v3.14.0

- added a real **Esc pause toggle** with an in-game pause panel and frozen gameplay state
- pushed the main render grammar much harder toward **bright ALttP-like grass / path / cliff readability**
- rebuilt the cached **tree silhouettes** into denser, chunkier canopy masses
- rebuilt **houses** into a more Zelda-like roof/front-face/door silhouette
- rebuilt the shared **player / NPC / knight body language** to feel more like little fantasy sprite people
- refreshed enemy body rendering so the world reads less like abstract blobs
- added a stronger **Dawnrest hedge-and-yard benchmark composition** to start pushing one screen toward a more authored Zelda village look
- updated build strings/UI text to **v3.14.0 • ALTTP Benchmark Reset**

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
- pause: `Esc`
- debug: `F3` / `~`

## Notes

This is still canvas-drawn art, not imported sprite sheets. So this is not the final art answer yet. But it is a much more aggressive benchmark reset meant to make the direction clearer much sooner so you do not get buried too deep in the wrong visual language.

## Verify after upload

- on-screen build badge: `v3.14.0 • ALTTP Benchmark Reset`
- debug/build info showing **v3.14.0**
- `Esc` pauses and resumes the game cleanly
- Dawnrest feels more structured and Zelda-like
- houses feel more iconic and readable
- player/NPC/knight bodies feel more like actual adventure sprites
- grass/path/cliffs feel brighter and more deliberate
- save/load/debug copy still work normally
