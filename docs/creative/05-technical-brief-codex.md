# 05 — Technical Implementation Brief (for Codex)

> **Audience:** the engineering agent (Codex) and any developer building the Pixelard site.
> **Direction:** 01 Warp & Weft. **Status:** pre-production; no application code exists yet.
> **Precedence when documents disagree:** this brief → `04-motion-interaction-spec.md` → `03-experience-storyboards.md` → `02` → `01`. Record any deviation as an ADR in `docs/decisions/` (see §14).

---

## 0. Read me first

**Mission.** Build the experience in `03` with the motion in `04`, to the performance and accessibility bars in §6 and §5.17. **The homepage hero (`03` §5 HERO, frames H01–H05) is the highest-priority deliverable.** It is built and validated first, as an isolated lab route, before anything else in 3D (§8, milestone M1).

**Non-negotiables**
1. **DOM-first.** Every page works fully without WebGL (milestone M0 ships that version first). WebGL enhances; it never gates content.
2. **One persistent canvas** across routes. Pages register scenes into it; they never create their own `<Canvas>`.
3. **No React state updates in frame loops.** Per-frame data lives in mutable stores read inside `useFrame` or the ticker.
4. **Everything visual is a pure function of (progress, input state, time).** Scrubbing backward must be exact.
5. **Never block zoom**, never hijack touch scrolling, and respect `prefers-reduced-motion`.
6. **Never invent real-world content.** Clients, projects, people and testimonials are placeholders flagged `placeholder: true` until supplied.
7. **Don't weave over the work.** Inside a case study, client media is shown clean.

---

## 1. Inputs

| Doc | Use it for |
|---|---|
| `01-reference-analysis.md` | Why. Hero rules H1–H6, system rules P1–P10, what *not* to copy (§D4) |
| `02-creative-directions.md` | Concept, palette, typography, art direction (Direction 01) |
| `03-experience-storyboards.md` | Every screen, frame by frame; copy deck; content needs |
| `04-motion-interaction-spec.md` | Every timing, curve, spring, state machine, gesture and sound |
| `storyboards/*.svg` | Visual targets (illustrative, not pixel-final) |

## 2. Stack

These versions were current on npm on 2026-10-08. Pin exact versions in `package.json` and upgrade deliberately.

| Concern | Choice | Version |
|---|---|---|
| Framework | **Next.js** App Router, React Server Components for content | `next@16.4.0`, `react@19.3.0` |
| 3D | **three.js** (WebGL2 renderer) | `three@0.186.1` |
| React renderer | **React Three Fiber** | `@react-three/fiber@9.8.1` |
| Helpers | **drei** (import per path; avoid barrel bloat) | `@react-three/drei@10.7.9` |
| Post | **postprocessing** + R3F bindings | `postprocessing@6.39.5`, `@react-three/postprocessing@3.1.3` |
| Animation | **GSAP** (incl. ScrollTrigger, SplitText, CustomEase) + `useGSAP` | `gsap@3.15.0`, `@gsap/react@2.1.2` |
| Smooth scroll | **Lenis** (desktop only; native on touch) | `lenis@1.3.26` |
| State | **zustand** for UI state; plain mutable singletons for per-frame state | `zustand@5.0.15` |
| GPU tiering | **detect-gpu** (+ drei `PerformanceMonitor` at runtime) | `detect-gpu@5.0.70` |
| Portals into the persistent canvas | **tunnel-rat** | `tunnel-rat@0.1.2` |
| Assets | **glTF-Transform** CLI (meshopt + KTX2) | `@gltf-transform/cli@4.5.1` |
| Debug (dev only) | `leva`, `r3f-perf` or `stats-gl` | `leva@0.10.1`, `r3f-perf@7.2.3`, `stats-gl@4.2.3` |
| Audio | Web Audio API + small custom Karplus-Strong `AudioWorklet` (no Tone.js in the critical path) | — |
| Language and tooling | TypeScript strict, ESLint, Prettier, pnpm, Vitest, Playwright, Lighthouse CI | latest stable |
| Hosting | Vercel (preview deploys per PR) | — |

**Licensing notes.**
- GSAP and all its plugins are free to use under the current GSAP licence (confirm at install time).
- **GT Alpina** fonts need a licence. Wire the open-source fallbacks (*Instrument Serif*, *Geist Mono*) from day one so a licence delay never blocks work.

**Not now:** WebGPU / TSL. Revisit after launch. All shaders are GLSL ES 3.0 on WebGL2.

## 3. Architecture

```
app/layout.tsx  (RSC)
 └─ <Providers> (client)
     ├─ <SmoothScroll/>        Lenis + GSAP ticker + ScrollTrigger glue (desktop)
     ├─ <Stage/>               ONE <Canvas frameloop="never">, fixed, full-viewport, aria-hidden
     │    ├─ <WorldRoot/>      camera rail, post, quality tier, loops driven by the ticker
     │    └─ <SceneOut/>       tunnel-rat output: page scenes render here
     ├─ <CursorLayer/>         DOM ring + canvas tail (fine pointers only)
     ├─ <TransitionController/> state machine: idle → covering → swapping → revealing
     ├─ <AudioEngine/>         lazy; only after the visitor opts in
     └─ <Header/> <Menu/> <RedThreadRail/>
         {children}            RSC page content; each page mounts <SceneIn> with its 3D

Per-frame data flow (one RAF, deterministic order):
gsap.ticker → lenis.raf(t) → ScrollTrigger.update → chapterStore (mutable)
            → input/pointer store → world systems update → R3F advance(t) → render
```

- **Ticker ownership.** `Stage` uses `frameloop="never"`. A single `gsap.ticker` callback calls `lenis.raf`, then R3F's `advance(timestamp)`. That gives a deterministic order and one RAF.
- **Pages** are server components for content. Their 3D lives in a client `Scene` component injected through `tunnel-rat`, and they register `ready` with the TransitionController.
- **Pointer events.** The canvas is `pointer-events: none`. A window-level pointer store feeds the world, and DOM stays fully interactive. The hero stage is a DOM element (`[data-stage="hero"]`) whose rect defines where the loom renders and which receives the pointer listeners.

## 4. Repository structure (target)

```
app/
  layout.tsx, page.tsx (home), work/page.tsx, work/[slug]/page.tsx,
  studio/page.tsx, lab/page.tsx, lab/hero/page.tsx (R&D), lab/weave/…, lab/warp/…,
  contact/page.tsx, not-found.tsx
components/            DOM components (Header, Menu, RedThreadRail, WeftReveal, Knot, PunchGlyphs, Form…)
world/
  Stage.tsx, WorldRoot.tsx, tunnels.ts
  camera/rail.ts, camera/rail.json        authored rail (exported from Blender)
  hero/                                   ← M1 priority
    HeroLoom.tsx, warpRibbons.ts, weftChain.ts, passDetector.ts, heroPatch.ts,
    shaders/warp.vert|frag, shaders/patch.frag, shaders/weft.vert|frag
  weave/  ClothMaterial.ts, shaders/cloth.frag (reel weaving, beat, LOD)
  warp/   WarpField.tsx (perspective), pluck.ts
  shuttle/ cards/ transition/ (WeftPass.ts) cursor/ (tail)
  post/   Post.tsx (tiered)
  quality/ tiers.ts
lib/
  motion/ tokens.ts (durations, eases, springs), SecondOrder.ts
  scroll/ chapterStore.ts, useChapter.ts
  input/  pointerStore.ts, gestures.ts
  audio/  engine.ts, ks-worklet.js, sounds.ts
  content/ schema.ts, loaders.ts
content/               JSON/MDX content (placeholders flagged)
public/assets/         fonts/, models/, textures/, video/, audio/, stills/ (no-WebGL posters)
tests/  unit/ e2e/
docs/   creative/ (these docs), decisions/ (ADRs)
```

## 5. Systems

### 5.1 App shell and routing
- Content routes are **server components** (SEO, streaming). 3D modules load with `next/dynamic(..., { ssr: false })` **after** the page is interactive. Use `requestIdleCallback`, falling back to a 300 ms timeout.
- **Fonts:** `next/font/local` with `display: "swap"` and `adjustFontFallback`. Preload only the display weight used in the hero H1.
- **Metadata API** for titles and OG images. OG images are pre-rendered woven stills.

### 5.2 Stage (the persistent canvas)
- `<Canvas frameloop="never" dpr={tier.dpr} gl={{ antialias: tier.msaa, powerPreference: "high-performance", alpha: false }} flat={false}>`, with colour management on and tone mapping **AgX**.
- **Position:** fixed, `inset: 0`, `z-index: 0`, `aria-hidden="true"`. DOM content sits above with a transparent background except in rest beats.
- **Pausing.** Rendering pauses when:
  - `document.hidden`;
  - the Draft chapter fully covers the viewport;
  - a route has no scene (static pages).
- **Context loss.** On `webglcontextlost`, switch to the DOM-only edit (§5.17) for the session.

### 5.3 Stores
- **`chapterStore`** (mutable). `{ [chapterId]: { progress, velocity, direction, active } }`, written by ScrollTrigger callbacks.
- **`pointerStore`** (mutable). Position (px and NDC), velocity, down state, pointer type, last input time.
- **`heroStore`** (mutable plus a persisted snapshot). Rows, yarn index, current pass state.
- **`uiStore`** (zustand). Menu open, sound on, tier, transition phase, reduced motion. React subscribes here; frame loops do not.

### 5.4 Scroll and chapter progress
- **Desktop:** Lenis with `lerp 0.085`, `smoothWheel: true`, `syncTouch: false`, `autoRaf: false`. Call `lenis.on("scroll", ScrollTrigger.update)` and `gsap.ticker.lagSmoothing(0)`.
- **Touch:** native scroll (do not instantiate Lenis).
- **Chapters.** Each chapter is a `<section data-chapter>` with explicit heights (in `vh`, from the scroll map in `03` §4). One ScrollTrigger per chapter (`start: "top top"`, `end: "bottom bottom"` for sticky stages) writes progress.
- **Sticky, not pinned.** Use CSS `position: sticky` stages inside tall sections. GSAP `pin` is used **only** for the Pattern Book horizontal track (or CSS sticky plus a transform, which is preferred if stable).
- **Velocity** is smoothed with `SecondOrder(scrollVel)`.

### 5.5 DOM ↔ GL binding
- `useDomRect(ref)` → `{ x, y, w, h }` in CSS px, measured on resize and font load. The current scroll offset is applied each frame from Lenis (no re-measure on scroll).
- `domToWorld(rect, camera, planeZ)` places a plane exactly over a DOM rect for perspective cameras. For pure overlay elements (pick glass, The Cut panels) use a separate **orthographic overlay scene** in pixel units, rendered after the main scene.

### 5.6 Camera rail
- **Authoring.** Key poses (K0…K6 in `04` §4.1) are authored in Blender and exported by a small Blender Python script to `rail.json`: sampled positions, look-ats and FOV per normalized `t`, plus chapter anchors.
- **Runtime.** CatmullRom sampling. Chapter progress maps to rail `t` through per-chapter ease curves. Additive layers on top: Brownian drift, pointer look and gyro.
- **Dev.** Leva sliders override rail values live, with a "copy JSON" button to write tuned values back.

### 5.7 HERO LOOM (milestone M1, top priority)
This implements `03` HERO and `04` §5.0. Build it at `/lab/hero` first, then mount it into the home page.

**Data**
- `NT` warp threads and `NR` rows per breakpoint (desktop 150 × 62, tablet 110 × 48, phone 72 × 40). Set the thread pitch from the stage width.
- `wordmarkMask`: an `NT × NR` R8 texture, precomputed at build time from the final wordmark SVG by `scripts/make-wordmark-mask.ts`. It is rasterized and box-filtered, with a threshold of 0.45.
- `heroPatch`: an `NT × NR` R8 `DataTexture`. Each texel holds a yarn index 0–3, 254 = auto-woven (silk), 255 = empty. Update only the changed row with `texSubImage2D` (three: `DataTexture` + `needsUpdate`; the texture is tiny).

**Rendering** (single draw per element)
1. **Warp ribbons.** An `InstancedMesh` of `NT` thin quads (2 triangles × 32 segments) from the back beam to the current fell.
   - **Vertex shader:**
     - sway (noise × gain);
     - pluck displacement from a `1 × NT` float `DataTexture` (A, t0, f);
     - the portal "unroll" (per-instance `dropProgress`, centre-out stagger);
     - **screen-space width expansion**: width = max(desiredPx, 1 px), passing `coverage = desiredPx / actualPx` to the fragment shader.
   - **Fragment shader:** Kajiya-Kay anisotropic highlight (tangent = thread direction) plus a soft highlight band; alpha × coverage. This anti-aliases hairlines without MSAA.
2. **Patch (cloth).** One quad from the breast beam to the fell. Per fragment:
   ```glsl
   // reference math, not production code
   vec2 cell = vec2(uv.x * NT, uv.y * NR);  ivec2 ij = ivec2(floor(cell));  vec2 f = fract(cell);
   float yarn = texelFetch(uPatch, ij, 0).r * 255.0;      if (yarn > 254.5) discard;   // unwoven
   bool letter = texelFetch(uMask, ij, 0).r > 0.45;
   bool bind   = (3 * ij.x + ij.y) % 5 == 0;               // satin binding points
   bool warpTop = letter ? false : !bind;                   // letters weft-faced, ground warp-faced
   float a = warpTop ? f.x : f.y;                           // across-thread coordinate
   float prof = sqrt(max(0.0, 1.0 - pow(2.0 * a - 1.0, 2.0)));  // cylinder profile
   // diffuse = colour * (0.16 + 0.92 * prof * edgeGap); spec = pow(prof, 14) (Kajiya-Kay on the tangent)
   // fresh-row glow: exp(-(rows - 1 - ij.y) / 2.5)
   ```
   **LOD.** `float cellPx = 1.0 / max(fwidth(cell.x), fwidth(cell.y));` Fade the cylinder micro-shading to the flat average colour as `cellPx` drops from 3 → 1.5 px. **This is mandatory to avoid moiré.**
3. **Weft chain.** 24 points simulated on the CPU (`SecondOrder` per point, `weftChain` params), uploaded as `vec3[24]` and drawn as a ribbon.
   - **Interlacing:** the weft's z alternates ±ε per warp crossing (`z = ((warpIndexAt(x) + row) & 1) == 0 ? +ε : −ε`), and depth testing against the warp ribbons (z = 0) produces over/under automatically.
4. **Beams.** Two hairline quads with punched-hole end marks (SDF circles). In H01 the back beam is the preloader thread (shared mesh, colour animated).

**Input** (`passDetector.ts`, pure and unit-tested)
- **Input:** pointer samples (x, y, t) in stage-local px, plus stage width.
- **Output events:** `passStart`, `passProgress(extent)`, `passComplete(direction)`, `passAbort`, `pluck(i, v)`, `click`.
- **Rules:**
  - a pass completes at ≥ 60% width extent;
  - horizontal dominance must exceed 1.5×;
  - at most 6 rows per second, with excess passes queued;
  - a click requires < 4 px of travel and < 250 ms;
  - long-press is ≥ 350 ms with < 8 px of travel (Beat outside the hero).
- **Touch:** the stage has `touch-action: pan-y`. Horizontal-dominant drags weave; vertical drags scroll the page.
- **Keyboard:** the stage is focusable (`tabindex=0`, `role="application"` with an accessible name and instructions). `Space` weaves a row (scripted pass), `Y` changes yarn.

**Behaviours**
- Idle auto-weave, yarn change, portal timing and scroll-out mapping exactly as `04` §5.0.2–5.0.5.
- **Persistence:** `sessionStorage["pixelard.heroPatch"] = base64(rows) + yarn + startedAt`, written on each committed row and restored on load. When restored, the hero shows the visitor's patch, with idle auto-weave disabled and the hint hidden.
- **Payoff:** the F09 cloth and `/contact` re-use `heroPatch` and `wordmarkMask` in the cloth shader (§5.8) as a source.

**M1 acceptance**
- Matches H01–H04 in composition and behaviour.
- 60 fps on tier A and ≥ 45 fps on tier B at 1600 × 900, DPR 2.
- No shimmer or moiré while scrolling at 1×, 1.5× and 2× DPR.
- `passDetector` passes its unit tests (§7).
- The 3-second test passes with 5 naive users.

### 5.8 Cloth shader (reel weaving, Beat)
- **Input source.** One `VideoTexture` (H.264 `muted playsinline loop`, 480p on tier B/C, 720p on tier A) or an image, or the hero patch.
- **Sampling.** **One sample per crossing at the cell centre** (`(floor(cell) + 0.5) / count`), so filtering is irrelevant and tiny sources suffice (320×180 source images).
- **Uniforms.**
  - Structure: `uThreadCount` (TPI, animated by Beat 64 → 512 per `04` §5.4), `uWeave` (0 plain, 1 twill, 2 satin).
  - Progress: `uWoven` (fell position 0–1; rows beyond the fell are discarded or shown as loose warp), `uFellGlow`, `uLoose` (local loosening radius around the pointer for the Pattern Book hover).
  - Exposure: `uExposure`.
- **LOD** as in §5.7 (mandatory).
- **Pick glass.** The same material on an overlay quad with `uThreadCount × 5` and UV transformed around the pointer. No render-to-texture needed.

### 5.9 Warp field (perspective) and pluck
- **Field.** `InstancedMesh` ribbons as in §5.7, laid on the XZ plane toward the horizon, with tier-based counts (900 / 480 / 240). Exponential fog to indigo.
- **Pluck.** Model per `04` §5.2: CPU writes the plucked thread's (A, t0, f) into the `1 × N` texture, and the vertex shader evaluates the decay. The neighbour coupling is computed in the shader from texture lookups i±1 and i±2.
- **Crossing test.** Project each thread's screen-space line once per frame (a CPU array of N lines) and test the pointer segment against it (O(N), N ≤ 900, about 0.05 ms).

### 5.10 Motion utilities
- `lib/motion/tokens.ts` holds every duration, ease (`CustomEase.create("shuttle", ".83,0,.17,1")`, etc.), stagger and spring preset from `04` §2. Components import tokens; no magic numbers.
- `SecondOrder` implements the semi-implicit second-order system (f, ζ, r) for scalar, vec2 and vec3, with a stable k2 clamp for large `dt`. Unit-test it against analytic step responses.

### 5.11 Post-processing (tiered)
- **Tier A:** EffectComposer with `multisampling={4}`, Bloom (mipmap blur, high threshold; only the fell line and red thread bloom), DOF (Weave macro chapter only, animated `focusDistance`), Noise/blue-noise dither (very low), Vignette, ToneMapping AgX.
- **Tier B:** no MSAA (coverage AA covers threads), light Bloom, dither, AgX.
- **Tier C:** dither and AgX only.
- **Transition pass** (`WeftPass`): a full-screen effect that draws the weft rows (§5.12). It sits after tone mapping so it is pixel-exact.

### 5.12 Transitions
- **`TransitionController`** state machine:
  ```
  idle → covering (520 ms) → swapping → revealing (480 ms) → idle
  ```
  - **Swapping** calls `router.push(href, { scroll: false })` once covered, then waits for the new route's `SceneIn` to emit `ready` (assets resolved and first frame rendered), with a 2.5 s max before showing the punch-card counter.
  - **Revealing** resets scroll to the top (or restores it on back/forward), moves focus to the page `<h1>`, and announces the route title via an `aria-live="polite"` region.
- **`TransitionLink`** wraps `next/link`. It intercepts same-origin, non-hash, non-modified clicks; everything else behaves natively.
- **Browser back/forward** (`popstate`): the navigation happens immediately. Play **reveal-only** (instant cover, then unweave) with direction reversed.
- **The Cut** (Pattern Book → case study): FLIP from the panel's DOM rect in the overlay scene, then the cloth `uWoven` runs 1 → 0 to unweave into the clean `<video>`, which is a DOM element placed exactly underneath. Timings are in `03` F06.

### 5.13 Quality tiers
| Tier | Detection | DPR | Hero threads | Perspective warp | Post | Weave video | Notes |
|---|---|---|---|---|---|---|---|
| **A** | detect-gpu tier 3, desktop | ≤ 2 | 150 | 900 | Full (MSAA 4, bloom, DOF) | 720p | — |
| **B** | tier 2, or laptop iGPU | ≤ 1.5 | 150 | 480 | Light | 480p | — |
| **C** | tier 1, or mobile | ≤ 1.25 | 72–110 | 240 | Dither and tone map | 360p | No DOF, no bloom |
| **D** | tier 0, no WebGL2, `saveData`, or context lost | — | — | — | — | — | DOM-only edit with woven stills |

- **Runtime:** drei `PerformanceMonitor` steps **down** one tier after 30 consecutive frames over budget. It never steps back up in the same session.

### 5.14 Cursor
- **DOM ring** (CSS transform from `SecondOrder(needleRing)`) plus the **canvas tail** in the overlay scene.
- **State** comes from `data-cursor` attributes (delegated lookup on `pointerover`) and the world region test (`hero stage` → shuttle; warp → pluck; cloth → pick glass).
- **Hidden** for `(pointer: coarse)`. The native cursor stays inside text inputs.

### 5.15 Audio
- **Engine.** An `AudioContext` is created only on "Enter with sound" or a sound toggle. Graph: master → limiter (−1 dBTP) → destination. Separate buses for room tone, plucks, UI and transitions.
- **Plucks.** A Karplus-Strong `AudioWorklet` (about 40 lines). A voice pool of 12, with notes mapped per `04` §5.2.
- **Samples.** Opus in WebM with an AAC fallback. Total under 600 KB, lazy-loaded after opt-in.
- **Lifecycle.** The preference persists in `localStorage`. Audio is suspended when the tab is hidden.

### 5.16 Preloader and asset pipeline
- **Critical path for first paint:** HTML, CSS and fonts (H1 text paints immediately, LCP = H1).
- **Preloader (F00).** A small DOM/canvas-2D component. It tracks a weighted progress of the **hero-critical** assets only: three/R3F chunk, hero shaders, wordmark mask, matcap/env, and the shuttle GLB (deferred to after the hero).
- **Deferred assets** stream in the background by chapter proximity: reel video, cards, the rest.
- **3D assets.**
  - Pipeline: Blender → glTF → `gltf-transform optimize in.glb out.glb --compress meshopt --texture-compress ktx2`. KTX2 is UASTC for normals and ETC1S for colour.
  - Load with `KTX2Loader` and `MeshoptDecoder` configured once in `Stage`.
- **Video.**
  - Weave sources: H.264, 360/480/720p, ≤ 1.5 Mbps, keyframe every 1 s, no audio.
  - Case-study media: AV1 or HEVC with an H.264 fallback through `<source>` ordering.
  - Posters are AVIF.
- **No-WebGL stills.** `scripts/render-stills.ts` uses Playwright to render each chapter's key frame to AVIF/WebP at build time, for the DOM-only edit.

### 5.17 Accessibility, reduced motion, fallbacks
- **Targets:** WCAG 2.2 AA.
  - Semantic landmarks; a skip link; a visible knot focus style on every interactive element.
  - Colour contrast: text ≥ 4.5:1, UI ≥ 3:1. Red on Loom Black is about 4.7:1.
- **Canvas** is `aria-hidden`. All copy is DOM text. The hero stage has an accessible name, instructions and keyboard controls (§5.7).
- **Reduced motion:** implement the full map in `04` §8, honouring the OS setting **and** a site toggle in the menu.
- **No WebGL / tier D:** the full site with stills. Hero = a static woven wordmark still plus a "Weave a row" button that swaps in pre-rendered stills (keeps the play idea).
- **Zoom:** layouts hold at 200%; no `user-scalable=no`; type uses `clamp()`.

### 5.18 Debug tooling (dev builds only)
- `?debug` enables:
  - Leva panels (rail, uniforms, springs, tiers);
  - the r3f-perf / stats-gl HUD;
  - a chapter progress overlay;
  - a "force tier" switch;
  - a "simulate reduced motion" switch.
- Leva values can be copied out as JSON and pasted back into `tokens.ts` or `rail.json`.

### 5.19 SEO and metadata
- Server-rendered content, `metadata` per route, an OG image per route (woven stills), `sitemap.ts`, `robots.ts`.
- JSON-LD: `Organization` on all pages, `CreativeWork` on case studies.

### 5.20 Content model (`lib/content/schema.ts`)
```ts
type Project = {
  slug: string; title: string; client: string; year: number;
  disciplines: ("web" | "3d" | "film" | "spatial" | "brand" | "rnd")[];
  hook: string;                       // one sentence
  heroLoop: VideoSource; wovenSource: ImageOrVideoSource;   // 320×180 / 480p for weaving
  sections: { challenge: Rich; idea: Rich; craft: Rich; outcome: Rich };
  media: Media[]; credits: Credit[]; featured: boolean; order: number;
  placeholder?: true;                 // must be false/absent before launch
};
type TeamMember = { name: string; role: string; photo: Image; videoPortrait?: VideoSource; placeholder?: true };
type Client = { name: string; logo?: Svg; permission: boolean; placeholder?: true };
type Capability = { id: string; title: string; summary: string; treadling: number[] /* draft rows */ };
type Recognition = { kind: "award" | "press" | "talk"; title: string; org: string; year: number; url?: string };
```
- **v1:** JSON/MDX in `content/`, validated at build time with zod.
- **CMS** (Sanity or similar) is optional later; keep loaders behind `lib/content/loaders.ts`.

## 6. Performance budgets

| Metric | Budget |
|---|---|
| LCP (H1 text) | ≤ 2.0 s desktop cable, ≤ 2.5 s mobile 4G |
| INP | ≤ 200 ms |
| CLS | ≤ 0.02 |
| Initial JS on `/` (before 3D) | ≤ 180 KB gz |
| 3D chunk (three + R3F + post + hero) | ≤ 350 KB gz, lazy |
| Hero-critical assets (excl. JS) | ≤ 1.2 MB |
| Home transfer, first 30 s (excl. reel streaming) | ≤ 6 MB desktop, ≤ 3.5 MB mobile |
| Draw calls | ≤ 60 |
| Triangles | ≤ 300k |
| GPU texture memory | ≤ 200 MB (A), ≤ 96 MB (C) |
| Frame time | ≤ 16.7 ms (A), ≤ 22 ms (B), ≤ 33 ms (C) |
| Main-thread work per frame (JS) | ≤ 4 ms (A), ≤ 6 ms (C) |

- **Enforcement:** Lighthouse CI budgets on every PR (DOM-only and 3D runs) and bundle analysis on every PR. Fail the PR if a budget regresses by more than 5%.
- **Frame loops:** no per-frame allocations (reuse vectors) and no `getBoundingClientRect` per frame.

## 7. Testing and QA

- **Unit (Vitest):**
  - `passDetector` (rows, aborts, rate limit, direction, touch dominance);
  - `SecondOrder` (step responses);
  - chapter mapping;
  - weave pattern CPU reference (warp/weft-faced per cell, compared against shader logic with a golden table);
  - `heroPatch` codec;
  - `TransitionController` state machine.
- **E2E (Playwright):**
  - menu navigation, with transition completion and focus moving to `h1`;
  - back and forward;
  - hero keyboard weaving (`Space`, `Y`) persisting into `/contact`;
  - reduced-motion edit;
  - **no-WebGL edit** (launch with `--disable-gpu --disable-webgl`);
  - form validation and submit (mocked endpoint);
  - 404.
- **Visual regression:** DOM-only screenshots (stable) per route and breakpoint.
- **Device matrix (manual, each milestone):**
  - macOS: Chrome, Safari, Firefox;
  - Windows: Chrome, Edge (iGPU laptop);
  - iOS: Safari (iPhone 13 or newer);
  - Android: Chrome on a mid-range 2023 device;
  - iPad Safari.
- **Hero 3-second test** at M1 and before launch (`04` §10).

## 8. Milestones and acceptance

| # | Scope | Acceptance |
|---|---|---|
| **M0 Foundations** | Repo, tooling, CI; tokens and fonts; content schema with placeholders; **all routes as the DOM-only edit**; header, menu (DOM), form; no-WebGL stills pipeline stub | Every route navigable by keyboard; Lighthouse a11y 100 and perf ≥ 95; CI green |
| **M1 Hero R&D** ⭐ | `/lab/hero`: portal, frontal loom, warp ribbons with coverage AA, weft chain with interlacing, `passDetector`, Jacquard patch, yarn change, idle auto-weave, persistence, keyboard and touch | §5.7 M1 acceptance; matches H01–H04 |
| **M2 Rendering spikes** | `/lab/weave` (cloth, video, LOD, Beat, pick glass), `/lab/warp` (900-thread perspective field and pluck), `/lab/transition` (WeftPass) | No moiré in Chrome, Safari or Firefox at 1–2× DPR; tier frame budgets met |
| **M3 Home world** | Persistent Stage, scroll system, camera rail; Loom (hero + H05 scroll-out) → 1804 → Weave → Pattern Book; The Cut; case-study template | Scrub forward and back is clean; F02–F06 behaviours met |
| **M4 Remaining world** | Draft, Selvedge, Start a thread with patch payoff; `/work`, `/studio`, `/lab`, `/contact`, 404; cursor system; shuttle-pass transitions | All storyboards implemented; e2e green |
| **M5 Sound, mobile, tiers** | Audio engine and mix; mobile layouts and gestures; tiers A–D; full reduced-motion map | Device matrix pass; perf budgets on tier C hardware |
| **M6 Polish and launch** | Real content swap (no `placeholder: true` left), copy pass, SEO, analytics (privacy-friendly), final QA | Definition of done (§10) |

## 9. Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Thread aliasing or moiré | High | High | Coverage-AA ribbons, mandatory LOD fade, M2 spike, test on 1× displays |
| Hero weaving not discovered | Medium | High | Two-line hint, idle auto-weave, shuttle cursor shape, 3-second tests at M1; fallback is to auto-weave the first row immediately |
| Touch conflict (weave vs scroll) | Medium | Medium | `touch-action: pan-y`, horizontal-dominance threshold, early iOS testing |
| Safari WebGL quirks (video textures, float textures) | Medium | Medium | RGBA8/half-float fallbacks, `playsinline muted`, test from M1 |
| Bundle bloat | Medium | Medium | Per-path drei imports, dynamic imports, bundle budget in CI |
| App Router transition edge cases | Medium | Medium | Explicit state machine with unit and e2e tests; reveal-only on `popstate` |
| Content arrives late | High | Medium | Placeholders flagged in the schema; stills pipeline; launch checklist blocks on `placeholder` |
| Font licence delay | Medium | Low | Open-source fallbacks wired from M0 |
| Over-long scroll fatigue | Medium | Medium | Chapter heights are tokens; analytics on chapter reach; trim in M6 |

## 10. Definition of done
1. All budgets in §6 met on the device matrix; no console errors; no WebGL warnings.
2. WCAG 2.2 AA audit passed (automated plus manual keyboard and screen-reader passes); reduced-motion and no-WebGL edits complete.
3. Every storyboard frame implemented, or its deviation recorded as an ADR.
4. No `placeholder: true` content; legal pages live; analytics consented.
5. `docs/creative/*` updated with tuned values (tokens, rail, tiers).

## 11. Open questions for the studio
1. Confirm the name reading ("Pixelard" ↔ Jacquard), positioning statement and final copy voice.
2. Real content: reel, 4–6 featured projects, team, clients (with permissions), recognition.
3. Final wordmark (SVG). The hero Jacquard mask is generated from it.
4. Font licences: GT Alpina family, or stay on the open-source fallbacks.
5. CMS preference, contact routing (inbox or CRM), SLA wording, budget brackets.
6. Languages (i18n?), analytics tool, cookie and consent requirements.
7. Sound: commission a sound designer for room tone and UI samples, or use the synthesis-first approach.

## 12. If a different direction is chosen
The architecture (§3–§5.6, §5.10–§5.20) is direction-agnostic. Swap only the world modules:

| Module | 01 Warp & Weft | 02 Pinscreen | 03 Additive |
|---|---|---|---|
| Hero toy | `world/hero` loom, shuttle cursor, yarn | Pin field, stamp/draw cursor, click moves the light | RGB room, held light, click swaps lights |
| Core shader | Weave cloth | Instanced pins + heightfield RT + raymarched raking shadows | Three soft-shadowed spot lights (bake static) + AO |
| Transition | WeftPass | Levelling ripple across pins | Lights converge to white, then split |
| Cursor | Needle / shuttle / pick glass | Stamp | Light source |
| Signature hold | Beat (thread count) | Push through | Converge |

## 13. Working agreements for Codex
- Build in milestone order. **M0 and M1 first.** Do not start chapter scenes before the hero passes M1.
- Small PRs (≤ 400 changed lines where possible), each with a preview deploy, screenshots or video of the affected frames, and perf numbers for 3D changes.
- Shaders live in `.glsl` files (raw imports), commented with the spec section they implement (e.g. `// 04 §5.0.1`).
- No new runtime dependency without a one-line justification in the PR and an update to §2.

## 14. Decision records
Create `docs/decisions/NNNN-title.md` (context → decision → consequences) for any change to stack, budgets, interaction rules or storyboard intent.
