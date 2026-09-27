# fancy-jumping-car

Static game, with local Three.js r160 and MIT license in `vendor/`. WebGL is
required; pixel ratio is capped at one for older tablets. Existing cars, tracks
and track layouts are unchanged. The educational challenge appears on entry and every
ten minutes; physics, countdowns, input and audio pause while solving it.
Sound starts off. The home icon opens the games-only catalogue.

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
