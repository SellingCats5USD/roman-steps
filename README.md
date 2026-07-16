# Roman Steps

A dependency-free, three-level Roman 2D platformer built with HTML Canvas and hand-drawn sprite animation.

## Play

Open `index.html` in a modern browser.

- **A / D** — move
- **W / Arrow Up** - jump; tap Up again just after accurately contacting a platform edge to grab it and climb up
- **Space** — melee swing with the equipped gladius or diamond sword
- **S** - hold the shield; spent blocks regenerate one at a time every four seconds while lowered, while losing all four triggers a five-second break recovery
- **1 / 2 / 3 / 4** - select the sling, flower salamander, egg chicken, or banana
- **E** - use the selected item; fire the sling, toggle pet mode, or eat a banana
- **I** - open the equipment inventory and switch owned weapons or armor
- **Z** - pet the active companion
- **Q** — open the merchant shop when standing nearby
- **M** — toggle the procedural Roman soundtrack
- **C** or the **Creative** button — open creative mode with level selection, flight, and invincibility
- **R** — restart the current level

The campaign runs from Via Aurelia through the longer Road to Zama and ends with a two-phase Carthaginian war-elephant battle. The legionary has 5 HP and only respawns on death. Stones are capped at 30; shops at the start of Provinces II and IV sell stones for two denarii each; the boss arena replenishes collected stones after three seconds.


The flower salamander is sold in the Province II and IV shops for 10 denarii. It follows ground routes, jumps gaps, never climbs ladders, and teleports back when separated. Enemies can deliberately target it, and its 0.6-damage attack cannot one-shot a full-health basic enemy.

The diamond sword is sold in the Province II and IV shops for 68 denarii and is stored in the equipment inventory rather than the item bar. A fresh campaign starts with the gladius and original bronze armor equipped. Press **I** to switch between owned weapons and armor; buying the diamond sword or silver armor equips it immediately, while the original equipment remains available. Diamond melee deals twice the gladius damage, reaches 116 pixels instead of 72, and applies 390 knockback instead of 210.

The master diamond sword is sold in every field shop for 100 denarii. Its long thorned sapphire blade and flared spiked hilt follow the supplied drawing, and it deals 3x gladius damage: 50% more than the standard diamond sword.

Equipment art is factorized through `assets/characters/roman/equipment-manifest.json`. Bronze and silver Gladius sheets are canonical pose sources; the Diamond Sword declares only its walk/attack interaction patches, grip anchors, cleanup masks, and derived outputs. Shield and sling rows are shared byte-for-byte. Run `python scripts/build-equipment-sheets.py assets/characters/roman/equipment-manifest.json --contact-sheet tmp/roman-equipment-contact-sheet.png` after changing equipment art, then run `python scripts/validate-equipment-manifest.py assets/characters/roman/equipment-manifest.json`. The renderer prefers generated files under `assets/characters/roman/assembled/` and retains an in-browser manifest compositor as a fallback. Visual weapon length is cell-safe while gameplay reach remains data-driven.

The egg chicken is sold in the Province II and IV shops for 15 denarii. It shares the salamander's ground-following, jump, passive/attack, enemy-targeting, petting, and teleport behavior, but fights from range by throwing the egg from its back. Its dedicated sheet includes four-frame walk, jump, and egg-throw animations.

The mini-elephant uses `assets/mini-elephant-v2.png`, deterministically repacked from the original sheet without redrawing its artwork. Connected sprite components are reassigned to the correct 6×4 grid cell, uniformly scaled per animation row, bottom-aligned, and surrounded by 12 transparent pixels on every side. `assets/mini-elephant-v2.manifest.json` records the frame boxes and scale compensation used by the renderer. Frame row 2, column 2 uses `assets/mini-elephant-trunk-corrected-v1.png`, correcting the malformed third-tusk trunk into one gray trunk while retaining exactly two ivory tusks. Rebuild it with `python scripts/repack-mini-elephant.py assets/mini-elephant-v1.png assets/mini-elephant-v2.png --metadata assets/mini-elephant-v2.manifest.json --runtime mini-elephant-manifest.js --frame-patch 2,2,assets/mini-elephant-trunk-corrected-v1.png`.

Rare hand-drawn bananas appear once per main level and are stored in item slot 4. Shops sell additional bananas for 10 denarii. Each restores up to 2 HP and has a five-second reuse cooldown.

The scenery now uses repeating hand-drawn Roman aqueducts, cypress trees, umbrella pines, and five families of layered Mediterranean hills. Rolling scrubland, rocky ridges, coastal terraces, shallow saddles, and flat-crowned berms use different deterministic distributions in each level. Feathered, overlapping pen-drawn tiles create smooth joins without procedural color underlays. Aqueducts are deliberately smaller and share a parallax layer with a fitted hill tile that covers their pillar feet, while distant ridges move more slowly to create depth. Rough umbrella pines, cypress clusters, olive trees, and the colorized narrow child-drawn cypress are independently scattered across the open slopes. The campaign is bright daytime by default. Creative Mode has an optional **10-minute day/night cycle** toggle; it is off by default and runs one complete in-game day every ten real minutes when enabled.
Province IV now crosses two indoor sections of the Carthage Citadel. Outdoor scenery eases into close, child-drawn marble halls and galleries around world positions 1900-3500 and 4750-6400, then eases back outside. Existing mosaic artwork is sliced and perspective-warped into floor runners and selected wall panels inside the halls.
Every ground parcel uses a full-bleed mosaic mesh. Per-asset paper margins are cropped away, then each mosaic is divided into a small rectangular grid and warped to the parcel's exact width and height; the outer mesh boundaries remain locked to the platform edges.