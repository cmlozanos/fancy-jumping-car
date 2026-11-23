# Fancy Jumping Car — native refinement handoff

## Changes owned
- `src/main.js`: vehicle paint/chrome material refinement, baked grass texture, one instanced distant ridge mesh, native day/night fog/lighting/material palette, landing-plane contact ellipse in light quality; no extra dynamic lights or shadow maps. Ramp UVs and baked chevrons share existing ramp mesh. Shared ramp texture is retained during per-level disposal. Decorative pickup spin/bob, preview rotation, turbo/particles follow motionAllowed.
- `styles.css`: school font, HUD top clearance 74px (observed 1px overlap at 68px) and stable readable contrast on its permanently dark panel.
- `playwright.config.cjs`: optional PORT isolates this checkout from an unrelated coordinator server already on 4189 (not stopped or overwritten).
- `tests/performance.spec.cjs`, `tools/check-performance.mjs`: day/night tablet/short-landscape capture, actual input-driven ramp approach, native appearance/motion/UV tests and upward-normal regression.

## Evidenced render bug fixed
The asphalt strip's triangles faced down, so only DoubleSide rails were visible above ground. Reversed only the asphalt triangle winding; every normal now faces up. Vertex positions, ramps and simulation remain unchanged. Visually verified asphalt and lane markings in light/dark screenshots. This is not a physics change.

## Checks
`make check` PASS, including unchanged 60Hz physics at 10/15/30/60 FPS, 5.113m fixture ramp peak, real collision, countdown, lifecycle, material reuse/HUD guards and track normals. `PORT=4197 npm test -- --output=docs/refinement/browser-results` PASS 2/2. Actual race completed 3/3 checkpoints; tests retain Home, sound-OFF, gate pause, preview stop, persisted graphics and offline reload. Native-input ramp approach observed 127 ticks, progress 0.1227291667 vs first ramp 0.13. Captures live in `browser-results/performance-hidden-work-st-c2e87-light-quality-remain-usable/` (light/dark 360×640,640×360,1024×768 and ramp-light/dark). Ramp capture may show takeoff after intervening real frames, not a frozen geometry fixture. No new loop geometry or physics; Turbo worker owns favorite looping game. Existing Node module-type warning is nonfatal.

## Scope and integration
Approved bounded native visual pass, 23 November 2026. Work directly in the shared checkout; no commit/push. No shared `family-v2/` or service-worker edits by this worker. Those diff entries belong to Main's propagated kit/cache revision. Pre-existing `.DS_Store` left untouched. No new engines, paid artwork, packages, antialiasing, postprocessing or shadow-map budgets. Existing normal-quality shadows remain optional; default light mode unchanged. Audio OFF on load, saves, unlocked choices, Home and educational lock behavior preserved.

School lettering uses the existing FamilyV2 font, not a substitute. Existing source-generated Canvas/3D text waits on fontReady (Banana now also defers initial Phaser construction). Theme getters have OS/light fallback; motion getters gate decorative animation, not physical movement or mission clocks. Main owns shared-kernel CSS/font/cache exact-copy verification.

## Evidence and limits
`check.txt` and `browser.txt` hold the executed native checks and Chromium 151.0.7922.34 browser results. Screenshots are bounded task evidence in this folder. `browser-first-failures.txt`, where present, preserves early diagnostic failures; it is not the final result. `git diff --check` passed for all four checkouts. No Chromium 95 download or execution; no physical old-tablet CPU/GPU, battery, native OS gestures or exhaustive level playthrough certification. Rendering samples are desktop observations only. No claim of photorealism or exhaustive visual audit.

A green model/build test is not substituted for browser interaction. Tests continue to exercise native inputs, educational pauses, audio, Home and offline reload. No physics tuning was introduced. The bounded pass stops after focused implementation and evidenced fixes rather than extending to every track.
