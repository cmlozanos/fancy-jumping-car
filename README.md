# fancy-jumping-car

The tablet profile in Games selects any combination of addition, subtraction,
tracing and reading, with at least one active challenge type. This game honours
that selection at entry and every ten minutes. Missing or invalid profiles keep
the default challenges without changing sound preferences or gameplay.

Static game, with local Three.js r160 and MIT license in `vendor/`. WebGL is
required; pixel ratio is capped at one for older tablets. Existing cars, tracks
and track layouts are unchanged. The educational challenge appears on entry and every
ten minutes; physics, countdowns, input and audio pause while solving it.
Sound starts off. Home returns to this game’s menu; the catalogue is available to adults.

PWA resources are cached only inside this game's scope, including the challenge.
Run `make install-tests`, `make icons`, `make check` and `make test`.
Set `CHROME95_PATH` for the browser integration test on Chromium 95.
Testing that engine on desktop does not certify the physical Android tablet GPU.

## Older-tablet performance

The ⚡ button toggles light quality, remembered on this device. Light quality is
the default when no choice is saved; an explicit normal-quality choice is kept.
Light quality uses 0.65 pixel ratio (42.25% of normal
raster area) and disables shadows without changing cars, obstacles or physics.
Titles, selectors, the educational challenge and hidden tabs suspend the race,
audio and countdown timers. The vehicle preview stops rendering when closed.

Physics use fixed 1/60-second steps, retaining the original 60 FPS behavior at
10, 15 and 30 FPS as well. Stalls are bounded to 250 ms to avoid unbounded catch-up;
the remainder is discarded on pause. HUD updates are limited to ten per second.
Star colors reuse materials and restore them without rebuilding the car or
marking shaders dirty. Particle buffer uploads happen once per displayed frame.

`make check` executes real physics, lifecycle, star-material and HUD regressions.
`make test` also measures normal/light rendering through the real UI and checks
preview shutdown, paused selectors, persisted quality and offline startup. Its
frame counts are desktop observations, not a physical Android performance claim.

## Touch holds — 20260927-2

Game UI now suppresses WebKit callouts and explicitly restores selection/editing CSS for editable fields. The existing global context-menu handler and gesture policy are unchanged, including their pre-existing desktop/form context-menu suppression.

`make test` includes `tools/touch-check.cjs`, keyboard editing and an 800 ms native-emulated control hold/release. `CHROME95_PATH` selects an installed legacy browser. Physical-tablet native menu behavior still needs device validation.

## Family 2.0.0

The local `family-v2/` copy contains exactly the CSS, classic JavaScript,
Playwrite ES font and OFL license. Its measured viewport height drives the game
layout. DOM text and game-owned canvas labels use the loaded local font; no
canvas API is patched. The header owns Home, points and Adult settings. Native
sound/quality buttons are moved intact into the adult slot, preserving handlers.
Sound starts OFF on every load without deleting existing preferences/progress.
Light rendering remains the default; explicit graphics preferences survive.
Antialiasing is disabled at context creation and physics remain fixed-step.
The pause adapter freezes actual simulation, pending game timers and audio;
closing Adult settings cannot bypass the independent educational lock.
Home stops the current game and opens its own menu without changing the URL.
The service worker uses a game-scoped 2.0.0 cache including all four kit files.

### Gameplay fixes and evidence

Checkpoint gates now count crossings by track progress rather than a 5 m point
proximity that could be skipped at speed. Restart/menu clear pending countdowns
and held controls, preventing an old countdown from ending a newer one early.
All characters and circuits remain selectable.

Validation: `make check` passes real physics/lifecycle/HUD/cache guards.
`npm test` passes both Chromium browser tests: touch hold/release, countdown
freeze, offline startup, Adult pause/resume, points deduplication, font readiness,
normal/light quality, and Home staying on the same URL. The full-race scenario
executes the production simulation to progress 1 and 3/3 checkpoints (observed
1,214 fixed steps with the generated track), then uses the real Restart button.
This accelerated scenario applies steering/acceleration inputs; it does not
teleport the car or force finish state. Layout checks cover 360×640, 640×360 and
1024×768; the generated landscape race image was visually inspected.
Desktop render observations are not Android GPU certification. Existing Node
module-type warnings are non-fatal and no dependencies were changed.

## Shared-shell final fixes — 2026-11-23

- Shared kit matches the canonical `home/family-v2/` byte for byte: educational
  expiry closes Adult settings, shell keyboard events stay isolated, cookie
  fallback remains authoritative after failed storage writes, real keyboard/held
  pointer activity extends the session without disabling inactivity expiry, and
  educational overlays use the shared font. Game-scoped cache revision: `-shell2`.
- Delivery checks: `node --check family-v2/family.js`, `node --check sw.js` and
  `make check` passed. No gameplay source changed; no build regeneration needed.
- Reused coordinator evidence in `home/docs/v2/evidence/fancy95.txt`: genuine
  Chromium 95.0.4630.0 native game checks, after native fixes and before these
  final shell fixes. Final standalone shell regressions: `shell-regressions95.txt`
  (5/5 Chromium 95) and `shell-regressions.txt` (10/10 modern Chromium/WebKit),
  in the same evidence directory. These are reused results, not new full-game
  browser runs against the final combination or physical Android certification.
  `home/docs/v2/CONTRACT.md` and `MATRIX.md` record the coordinated scope; all
  `home/` paths here are evidence references only, never runtime dependencies.
- No tags or GitHub Releases: coordinated separately.
