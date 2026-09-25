# fancy-jumping-car

Static game, with local Three.js r160 and MIT license in `vendor/`. WebGL is
required; pixel ratio is capped at one for older tablets. Existing cars, tracks
and physics are unchanged. The educational challenge appears on entry and every
ten minutes; physics, countdowns, input and audio pause while solving it.
Sound starts off. The home icon opens the games-only catalogue.

PWA resources are cached only inside this game's scope, including the challenge.
Run `make install-tests`, `make icons`, `make check` and `make test`.
Set `CHROME95_PATH` for the browser integration test on Chromium 95.
Testing that engine on desktop does not certify the physical Android tablet GPU.
