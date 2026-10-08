# 01 — Reference Analysis: lusion.co

> **Purpose.** Understand *why* Lusion's site is world-class, separate the transferable **principles** from Lusion's **visual identity**, and turn them into rules for Pixelard. **The homepage hero matters most** and is analysed first and in the most depth. The About page (`/about`) follows as a secondary study.
>
> We study the reference. We do not copy its art, code, motifs or copy.

**Method.**
1. I used the live homepage and About page as a visitor would.
2. I captured the homepage hero in a headless browser: load, cursor and click states.
3. I read the publicly served client bundle and stylesheet: class names, asset manifests and design tokens. These show *how* it is built, not just how it looks.

Facts from the shipped code are marked **[src]**. Facts from the live capture are marked **[obs]**.

---

# Part A — Homepage (primary)

## A1. Homepage anatomy

| # | Section | Content beat | Experience beat | Evidence |
|---|---|---|---|---|
| 0 | **Preloader** | Big percentage counter (bottom-left) | A 3D **"L" built from two white blocks** turns in space. At 100% the blocks become **windows onto the hero scene** and fly toward the camera until the window fills the screen. **The logo is the portal into the site.** | [obs] (load at 3 s / 9 s / exit), `Preloader` (`MIN_PRELOAD_DURATION`, `HIDE_DURATION .5`) [src] |
| 1 | **Hero** | One sentence in the header row: *"We create 3D visual storytelling and interactive web experiences that help brands stand out"* | A **framed, rounded-corner dark window** inset in an off-white page. Inside it, a **dense pile of chunky "jack" connectors** (6-way pipe fittings) in matte white, glossy black and **one accent colour**. Cursor pushes them, **click cycles the accent colour** and scatters the pile, and the cursor paints a glassy wake into the background. "Scroll to explore" sits between `+` marks. | [obs], `HomeHeroSection`, `HomeBalloons*`, `HomeBalloonsBackground` [src] |
| 2 | **Reel** | "Bold Ideas, Brought to Life" + approach copy + CTA | A reel thumbnail sits **inline in the title**. On scroll it grows into a full video stage with a **radial reveal centred on the thumbnail**, the corner radius morphs, and a "Play reel" button scales in at 100%. | `HomeReelSection` (`ufxMeshRadialCenter`, `u_showRatio`, `videoPlaceholderRatio`) [src] |
| 3 | **Featured work** | 12 projects with discipline tags; "See all projects" | A list where every item carries a **WebGL card bound to its DOM row** that reacts on hover | `HomeFeaturedSection`, `ProjectItemList` (`ufxMesh` per item) [src] |
| 4 | **Goal / tunnel** | "Where creative ideas become immersive experiences"; "Step into a new world and let your imagination run wild" | Context images transition **into a tunnel sequence**: the title breaks into words that fly apart, then a black tunnel, then a white tunnel with astronauts, broken glass, stickers and an earth card. **Hold to slow time**; cinematic **autoscroll** in the last scroll direction. | `GoalSection`, `HomeGoalSectionTunnelTitle`, `GoalBlackTunnel`, `GoalWhiteTunnel*`, `GoalTunnelAstronauts`, `freezeRatio`, `autoScrollSpeed` [src] |
| 5 | **CTA + footer** | "Is your big idea ready to go wild? Let's work together!" | The footer **keeps scrolling into the next page** ("Keep scrolling to learn more → About us") | `ScrollNavSection` [src] |

## A2. The hero, in detail

### Layout: an editorial page with a window into a world
- **The headline does not sit on the 3D.** It sits in the header row, between the logo and the buttons, as a three-line statement in a neo-grotesk at about 34 px [obs]. The 3D gets its own stage. Both stay legible and the type never fights the render.
- **The 3D lives in a framed window.** It is a dark, rounded-corner card inset by the page margin on an off-white page [obs]. A WebGL "frame" mesh is bound to the DOM container (`u_domXY`, `u_domWH`, `u_globalRadius`), and a rounded-corner mask shader is driven by scroll ratio [src].
  - **The frame is a transition device as well as decoration.** It can grow, round or unround, and hand off to the next section.
- **The bottom edge reads as an instrument.** Corner `+` marks and "Scroll to explore" [obs] make the hero feel like a specimen on a lightbox.

### The objects: toys with exquisite materials
- **Geometry.** About 20 chunky **cross/jack** shapes (`cross.buf`), simple enough to read instantly [src][obs].
- **Physics proxies.** Each object is simulated as a sphere proxy (`HomeBalloonsBody`) with radius, density, friction and restitution [src]. Bodies **spawn at random positions and fly in toward the centre**, forming a living cluster (`velocity0 = -2 × position0`) from a seeded RNG ("balloon24"), so the cluster is deterministic [src].
- **Materials.**
  - Soft plastic (rough), hard plastic (glossy) and semitransparent variants (`SOFT_PLASTIC`, `HARD_PLASTIC`, `isSemitransparent`, `u_roughness .8 / .1`) [src].
  - Lit by an **HDR matcap** (`matcap.exr`, with a lower-quality `matcap_ld` on mobile) [src].
  - Semitransparent objects sample a **chain of pre-blurred scene textures** (`cacheRTBlur0–3`) for a cheap frosted-glass refraction [src].
- **Analytic contact shading.** Each object's shader receives the **positions, rotations, colours and transparency of its nearest neighbours** (`u_nearPositionRadiusList`, `u_nearColorList`, …) [src]. That produces contact shadows and colour bleeding between touching objects **without shadow maps or ray tracing**. It is the reason the pile looks "real" at a low cost.

### Interaction: the hero is a toy, not a picture
| Input | Response | Evidence |
|---|---|---|
| **Move** | The cursor is unprojected onto the cluster plane. Objects near it get a push force from cursor velocity (`MOUSE_PUSH_FORCE .12`, `MOUSE_RADIUS`), and the pile jostles and resettles. | `HomeBalloonsPhysics.update` [src] |
| **Move (background)** | The cursor paints into a full-screen velocity buffer that tints and distorts the dark background (paint colour is the electric blue `#1a2ffb` on `#141515`). Visible as a glassy streak. | `HomeBalloonsBackground` uses `u_screenPaintTexture`, `u_colorPaint` [src][obs] |
| **Click** inside the window | **The accent colour cycles** (blue → acid green → …), **black and white swap**, and every body receives an **impulse**. The pile bursts and regathers. A click sound plays. | `changeHomeHeroColorSignal` → `balloonsColorIndex += 1`, `_blackWhiteToggle`, `applyImpulse()` [src][obs: blue → green] |
| **First wheel** | One-shot listener (`{ once: true }`) arms the scroll experience | `initEvent` [src] |
| **Scroll** | Hero scroll ratio fades the cluster out (`homeBalloons.ratio = fit(r.ratio, 0, 1, 1, 0)`); the frame mask animates into the reel section | [src] |

### Why the hero works (the 3-second test)
In **under three seconds**, a first-time visitor:
1. **Sees the craft.** The material quality (glossy versus matte, contact shadows) is a portfolio piece in itself.
2. **Has acted and been answered.** Any mouse movement produces a physical, satisfying response. No instructions are needed because the objects *look* pushable.
3. **Knows what the studio does.** One plain sentence, set apart from the spectacle.

Then a **repeatable reward**: click again and you get a new colourway and a new burst. Visitors play. And the **brand mark carries the visitor in**: the preloader's "L" becomes the window onto the hero. Loading is part of the story, not a wait.

### Hero engineering choices worth copying (as principles)
- Physics on **sphere proxies**, rendering of **complex shapes**: cheap collisions, rich silhouettes.
- **Analytic neighbour shading** instead of shadow maps.
- **Matcap HDR lighting** instead of real-time lights: one texture lookup, studio-quality reflections, and a low-resolution variant on mobile.
- A **seeded** spawn, so the composition is art-directed yet alive.
- The 3D is **bound to a DOM rectangle**, so layout, responsiveness and accessibility stay in HTML.

## A3. Below the hero
- **Reel: thumbnail-in-headline to full stage.** It turns a passive "watch our reel" into a scroll-driven reveal tied to the copy that introduces it.
- **Featured work: DOM list plus WebGL cards.** It scans like a list and responds like a gallery. Text stays selectable and indexable.
- **Goal → tunnels: the big set piece.**
  - The headline is split into words that leave the page and become the entrance to a 3D tunnel.
  - **Hold to slow time** (audio filter included) and **autoscroll** turn the visitor from a reader into a passenger.
  - It is spectacular but tonally separate from the hero (astronauts, stickers). It is a **second, unrelated metaphor**.
- **No dead end.** The footer scrolls straight into "About us".

---

# Part B — About page (secondary)

## B1. What it is
A camera move through one continuous world:
- **Hero:** a lone animated figure on contour-lined terrain under light from above, with letterforms standing in the landscape **[src: `AboutHero{Ground,Lines,Rocks,Fog,Halo,Light,LightField,Letters,Particles,Scatter}`, `about/person_idle.buf`, `about/camera_spline.buf`]**.
- **"Who we are":** the logotype geometry morphs from the hero title to a section title (`AboutWhoLogo`, `fromDom` → `toDom`) [src].
- **Team:** faces rendered from position/normal **data textures** with glitch transitions, swipe to change (`AboutHeroFaces`) [src].
- **Proof:** clients marquee, a 58-award indexed ledger, articles, talks, four columns of expertise revealed at a fixed rate (`showItemPerSecond = 10`) [src].
- **Ending:** a CTA, then the footer continues into the next page.

---

# Part C — Systems underneath (shared by all pages)

1. **One persistent world.**
   - A single `Stage3D` / `Visuals` renderer lives across routes, managed by `PageManager` + `RouteManager` [src].
   - Routes change under a `TransitionOverlay` (2D canvas: load bar, line transforms, text) [src].
2. **DOM ↔ WebGL binding ("UFX").**
   - `UfxMesh({ refDom })`, `UfxTextMesh` and `PreUfx` / `PostUfx` layers bind meshes to DOM rects, rendered before or after post-processing [src].
   - Real text stays in the DOM.
3. **Scroll as a continuous timeline.**
   - `ScrollManager` and `ScrollDomRange` turn every DOM range into `0→1` ratios that drive shaders, camera and audio [src].
   - Per-object timing data (`scrollToRatioFactors`) [src].
4. **Authored cinematography.** Camera splines exported from a 3D package (`camera_spline.buf`, CatmullRom) [src].
5. **Physical motion.** `SecondOrderDynamics(f, ζ, r)` drives followers and `BrownianMotion` drives idle life [src].
6. **The cursor is a field.** `ScreenPaint` keeps a velocity buffer with tuned dissipation (`velocityDissipation .985`), push strength and optional curl noise. It is used for distortion and tinting [src].
7. **Input bends time.** `freezeRatio`: holding the pointer slows the scene clock to 30% and moves a low-pass filter. Cinematic sections autoscroll [src].
8. **Sound as a layer.** Per-page audio managers, crossfades by section, and hover/click sounds on CTAs [src].
9. **Performance as craft.**
   - **Assets:** custom quantized `.buf` geometry with `_low` variants [src].
   - **Rendering:** **FSR upscaling**, SMAA, blue-noise dithering, baked light textures, matcaps and heavy instancing [src].
   - **Stack:** three.js r158 with **no GSAP and no Lenis**; tweening, easing and scroll are in-house. Astro shell [src].
   - **Mobile:** device-orientation controls, mobile reel encodes and mobile-specific matcaps [src].
10. **Identity tokens (awareness only, *not for reuse*).**
    - **Type:** Aeonik, IBM Plex Mono and LusionMono [src].
    - **Colour:** off-white `#f0f1fa`, ink `#141515`, electric blue `#1a2ffb` / `#0016ec`, acid green `#c1ff00` [src][obs].
    - **Shape:** rounded cards (10–20 px radius), pill buttons [obs].

---

# Part D — Synthesis

## D1. What makes it exceptional
1. **A hero that passes the 3-second test.** Craft is visible, play is answered, and the offer is stated, all within three seconds.
2. **A toy in a frame.** A tactile, physical, repeatable interaction inside a contained stage, with the editorial page around it.
3. **The brand mark is the way in.** The preloader's logo becomes the window onto the first scene.
4. **Spectacle carries content.** Every set piece hosts a content beat: reel, work, approach, CTA.
5. **One camera, one world.** Sections connect through camera and frame moves, not cuts.
6. **Consistent physics of motion.** Springs, Brownian idle, a cursor wake, time that slows.
7. **Engineered to ship.** Analytic shading, matcaps, proxies, upscaling, tiers.
8. **No dead ends.**

## D2. Weaknesses and openings (where Pixelard can beat it)
| Observation | Why it matters | Pixelard rule |
|---|---|---|
| The hero's objects (jacks) are **generic toys**. They show craft but say nothing about *this* studio. | Spectacular but not ownable; any studio could ship a physics pile | **The hero object must *be* the brand idea.** Interacting with it should *explain* the studio. |
| Hero play has **no consequence**. The pile resets and nothing persists. | Play is a moment, not a story | **Hero play should leave something behind** that the site remembers and pays off later. |
| Home's tunnels (astronauts, stickers) are a **second metaphor** unrelated to the hero | Spectacle without a single throughline | **One metaphor from preloader to footer.** |
| `user-scalable=no, maximum-scale=1.0` | Blocks pinch-zoom (accessibility) | Never block zoom; survive 200% zoom. |
| `font-display: block` | Invisible text while fonts load | `swap` / `optional` with metric-matched fallbacks. |
| ~1.25 MB single hoisted bundle (uncompressed) | Slow first interaction on mid-tier mobile | Route- and chapter-level code splitting; 3D lazy after text is interactive. |
| Virtual scroll plus autoscroll segments | Can feel like losing control | Never steal direction; any autopilot ends on one input. |
| Generic copy ("help brands stand out", "go wild") | The visuals carry the brand, the words don't | Copy with one specific idea that the 3D *proves*. |

## D3. Principles we adopt (Pixelard rules)
**Hero rules (from Part A, highest priority)**
- **H1 — The 3-second test.** Within 3 s a first-time visitor sees the craft, acts and gets a physical response, and reads one plain sentence saying what we do.
- **H2 — The hero is a toy that *is* the idea.** The thing you play with demonstrates the studio's thesis, not just its rendering skill.
- **H3 — Type beside the world, not on it.** The headline has its own clear space. The 3D has a defined stage whose **frame doubles as a transition device**.
- **H4 — The preloader hands off through the brand.** What you watch while loading physically becomes the first scene.
- **H5 — A repeatable reward.** A second, simple input (click) produces a new variation. Play invites replay.
- **H6 — Play leaves a trace.** What the visitor makes in the hero persists and is paid off later in the journey.

**System rules (from Parts B and C)**
- **P1 — One world, one camera,** persistent across routes.
- **P2 — DOM is the truth; WebGL is the material.** 3D binds to DOM rects.
- **P3 — Scroll is a timeline.** Everything is a pure function of progress, scrubbable both ways.
- **P4 — Authored cinematography** shipped as data.
- **P5 — Physical motion grammar.** Springs for input, curves for authored moves, idle life everywhere.
- **P6 — Input changes a world property** (time, tension, resolution, colour), not just positions.
- **P7 — Sound is designed,** opt-in and state-driven.
- **P8 — Content leads; spectacle sets the pace.**
- **P9 — Performance is a design constraint** from day one: analytic tricks over brute force.
- **P10 — No dead ends.**

## D4. Identity we leave behind (do not echo)
- **Hero motifs:** the physics pile of jacks/crosses, the click-to-recolour palette cycle (blue ↔ acid green), the black/white swap.
- **Hero layout signature:** the off-white page with a **rounded dark card** and `+` corner marks. We keep the *principle* (H3) and express the stage in our own metaphor.
- **The logo-as-window preloader.** We keep the *principle* (H4) with our own mark and mechanics.
- **The palette and type:** electric blue, acid green, off-white `#f0f1fa`; Aeonik + Plex Mono; pill buttons.
- **Other motifs:** tunnels, astronauts, balloons, stickers, broken glass, the lone figure on contour terrain, particle-cloud team faces, the full-screen fluid-paint cursor as a signature.
- **Mechanics as-is:** hold-to-slow-time and the "go wild" tone of voice.

## D5. Success criteria for any Pixelard concept
1. **Passes the 3-second test** (H1) on desktop *and* mobile.
2. Expresses **one** metaphor only Pixelard could own, from preloader to footer.
3. The hero toy **is** the thesis (H2) and **leaves a trace** that is paid off later (H6).
4. Every content beat (studio, work, capabilities, people, proof, contact) has a scene inside the metaphor.
5. Cursor, click, hold, transition and sound all come from the metaphor.
6. ≥ 60 fps on a 2021 laptop GPU and ≥ 30 fps on a mid-range 2023 phone. Text interactive in under 2.5 s.
7. Survives reduced motion, keyboard-only use, 200% zoom and WebGL failure without losing content.
