# 04 — Motion and Interaction Specification

> **Scope.** Every moving or responsive element in Direction 01 (Warp & Weft): tokens, the scroll timeline, per-chapter choreography, the input systems, text animation, sound, reduced motion and QA. Values are **starting points**: tune them in the browser with the debug panel (see `05` §5.18), then write the tuned values back here.

---

## 1. Motion principles

1. **Tension, then release.** Every authored move builds tension (slow start) and releases it (fast, then settling). No linear motion except for continuous time, such as idle drift.
2. **Row by row.** Structure reveals in **horizontal bands, from top to bottom**, like weft being beaten in: headlines, transitions, the drawdown, the confirmation message. This is the site's motion signature. Avoid generic fades and slide-ups.
3. **One thread leads.** At any moment the red thread (or red accent) marks where attention should go. There is never more than one red focal point on screen.
4. **Springs for input, curves for authorship.** Anything following a pointer, finger or scroll velocity uses **second-order dynamics** (springs). Anything authored (transitions, reveals) uses the named ease curves below.
5. **Calm between storms.** After every high-energy chapter comes a rest beat with less motion, fewer elements and more reading. The Draft chapter goes so far as to pause WebGL.
6. **Nothing is ever fully still** in the world (Brownian idle at ≤ 0.6° and ≤ 1.5 px), and **nothing moves without a reason** in the DOM.

## 2. Tokens

### 2.1 Durations
| Token | ms | Use |
|---|---|---|
| `instant` | 120 | Press feedback, knot tighten |
| `quick` | 240 | Cursor state morph, small UI |
| `base` | 420 | Weft-reveal per band, menu items |
| `slow` | 600 | Menu card rise, section reveals |
| `cinematic` | 900 | Preloader exit, chapter set-pieces |
| `transition` | 1100 | Shuttle pass, The Cut (total) |

### 2.2 Ease curves
| Name | CSS | GSAP | Use |
|---|---|---|---|
| **shuttle** | `cubic-bezier(.83,0,.17,1)` | `CustomEase "shuttle"` | Symmetric travel: transitions, horizontal moves |
| **tension** | `cubic-bezier(.7,0,.2,1)` | `CustomEase "tension"` | Build-ups: camera cranes, FLIP scale |
| **release** | `cubic-bezier(.16,1,.3,1)` | `"expo.out"`-like | Reveals, cursor states, menu rise |
| **unwind** | `cubic-bezier(.5,0,.75,0)` | `"power2.in"` | Exits only |

### 2.3 Springs (second-order dynamics)
These are parameterized as **f** (natural frequency, Hz), **ζ** (damping ratio) and **r** (initial response; r < 0 anticipates, r > 1 overshoots on start). Implement a single `SecondOrder` utility (scalar and vec2/3). See `05` §5.10.

| Name | f | ζ | r | Use |
|---|---|---|---|---|
| `needleRing` | 4.5 | 0.75 | 0 | Cursor ring follows the pointer |
| `needleTail` | 6.0 | 0.85 | 0 | Each of the 12 tail segments follows the previous one |
| `pickGlass` | 6.0 | 0.90 | 0 | Loupe follows the pointer |
| `camLook` | 1.2 | 1.00 | 0 | Camera look-at offset from the pointer (±1.5°) |
| `beatIn` | 1.0 | 1.00 | 0 | Beat progress toward 1 (critically damped, about 1.6 s) |
| `beatOut` | 2.2 | 0.60 | 0 | Beat release (slight overshoot = cloth relaxing) |
| `redThread` | 3.0 | 0.50 | 1.2 | The pulled red thread in F09 (springy) |
| `scrollVel` | 2.0 | 1.00 | 0 | Smoothed scroll velocity → shuttle speed |
| `weftChain` | 5.0 | 0.80 | 0 | Hero: each of the 24 weft points trailing the cursor-shuttle |
| `rowBeat` | 6.0 | 0.55 | 0 | Hero: completed row snaps into the fell (visible overshoot) |
| `warpDrop` | 2.6 | 0.50 | 0 | H01: warp threads swinging into place after unrolling |

### 2.4 Staggers and distances
- **Weft-reveal:** 8 bands per text line, 35 ms band stagger, 60 ms line stagger.
- **Menu:** 70 ms per row; holes punch 8 ms apart.
- **Transition:** 6 ms per weft row, with 24–64 rows depending on viewport height (row height ≈ 18 px).
- **DOM translate distances:** never more than 24 px (the motion is in the world, not the UI).

## 3. Scroll system

- **Engine:** Lenis smooth scroll on desktop (`lerp 0.085`, `smoothWheel true`, `syncTouch false`). **Native scrolling on touch.** Lenis runs on the GSAP ticker, and ScrollTrigger updates on each Lenis scroll event.
- **Never steal direction or momentum.** There is no autoscroll and no scroll snapping on desktop. Mobile Pattern Book uses CSS `scroll-snap` (proximity).
- **Chapter progress.** Each chapter is a DOM `<section data-chapter="…">`. One ScrollTrigger per chapter writes `progress ∈ [0,1]`, `velocity` and `direction` into a **non-reactive store** (a plain mutable object). The world reads it in `useFrame`. No React state updates per frame.
- **Reversibility.** Every world property is a pure function of chapter progress (plus input state), so scrubbing backward plays the story backward. Unweaving on reverse scroll is a feature.
- **Pinning.** Only the Pattern Book pins (400–700 vh), with `anticipatePin` to avoid jumps. Its horizontal travel is `x = -progress × (trackWidth − viewportWidth)`.
- **Scroll velocity.** Smoothed with `scrollVel` and clamped to ±3 screens/s. It drives shuttle speed in F02 and a subtle thread-sway gain (0.6–1.4×).
- **Restoration.** On route change, scroll goes to the top under cover of the transition. Back/forward navigation restores the previous position (store it per pathname).

## 4. Home choreography (keyframes by chapter)

Notation: values interpolate across chapter progress `p` with the given ease. World units are metres. The loom bed is the XZ plane, the fell line is at `z = 0`, warp runs to `z = −60`, and cloth extends toward `+z`. These camera values are starting points; the camera rail is authored in Blender and shipped as JSON (see `05` §5.6).

### 4.1 Camera rail
| Key | Chapter p | Position | Look-at | FOV | Focus | Ease to next |
|---|---|---|---|---|---|---|
| K0 | Loom 0 → 0.4 (hero) | (0, 7.5, −1.5), **top-down** (up vector −Z), so the warp reads vertical on screen between the beams | (0, 0, −1.5) | 24° | — | tension |
| K0b | Loom 1.0 | (0, 1.2, 6.0) | (0, 0, −20) | 24° | — | tension |
| K1 | 1804 1.0 | (0, 2.2, 4.0) | (0, 0, −6) | 26° | — | tension |
| K2 | Weave 0.20 | (0.15, 0.35, 0.6) | (0.15, 0, −0.2) | 18° | 0.65 m | tension |
| K3 | Weave 0.55 | (0, 7.0, 3.5) | (0, 0, 2.5) | 32° | off | release |
| K4 | Pattern Book 0 | (0, 1.5, 9.0) | (0, 1.5, 0) | 20° | off | linear (pinned) |
| K5 | Selvedge 0 | (0, 0, 10) | (0, 0, 0) | 22° | off | release |
| K6 | Thread 0 | (0, 1.0, 7.0) | (0, 0.4, 0) | 26° | off | — |

Additive layers on top of the rail:
- Brownian drift (≤ 0.6°).
- `camLook` pointer offset (≤ 1.5°, disabled on touch).
- Optional gyro parallax on mobile (≤ 2°).

### 4.2 World uniform tracks
| Uniform | Loom (hero) | 1804 | Weave | Pattern Book | Draft | Selvedge | Thread |
|---|---|---|---|---|---|---|---|
| `uHeroRows` (visitor's rows, 0–62) | input-driven; auto-completes 0–40 vh | 62 (foreground) | 62 | — | — | — | 62 (**the visitor's patch is the cloth**) |
| `uBeamGap` (beam separation, 1 = stage) | 1 → 3 (0–40 vh) | off | — | — | — | — | — |
| `uWoven` (reel rows woven 0–1) | 0 | 0 → 0.08 | 0.08 → 1 | 1 (bolt travels) | — | 1 | 1 |
| `uThreadCount` base TPI | 64 | 64 | 64 → 128 | 96 | — | 48 (portraits) | 64 |
| `uExposure` | 0 → 1 (entry) | 1 | 1 | 1 | **1 → 0** (canvas paused at 0) | 0 → 1 | 1 |
| `uPluck` enabled | ✓ | ✓ | ✗ (macro) | ✗ | ✗ | ✗ | ✓ (fringe) |
| `uSway` gain | 1 | 1 | 0.4 | 0.2 | — | 0.3 | 0.6 |
| `uRedEmphasis` | 0.8 | 1 | 0.6 | 0.4 | — | 0.4 | **1.5** |
| DOF | off | off | **on (K2 only)** | off | off | off | off |

### 4.3 DOM choreography per chapter
| Chapter | Element | Timing (chapter p or event) | Motion |
|---|---|---|---|
| Loom (hero) | H1 | 800 ms after the warp starts unrolling (H01) | Weft-reveal (8 bands × 2 lines) |
| Loom (hero) | Hint (2 lines) | +1200 ms; hides on first completed row | Opacity 0 → 1, `release`, 420 ms |
| Loom (hero) | `ROWS` / `YARN` instrument bar | +1200 ms | Opacity; counters step per row |
| Loom (hero) | H1 exit | p 0.10 → 0.35 | Bands retract right → left (reverse weft) |
| 1804 | Beat ① / ② / ③ | p 0.10 / 0.42 / 0.74 | Each weft-reveals in and retracts out at the next beat |
| 1804 | Punch cards | p 0 → 1 | Drift on curves through the haze (world, not DOM) |
| Weave | "Up close…" | p 0.05 | Weft-reveal |
| Weave | "From afar…" | p 0.55 | Weft-reveal, with "Up close…" retracting at p 0.45 |
| Weave | Principles ×3 | p 0.62 / 0.70 / 0.78 | Weft-reveal; Warp label in red |
| Weave | Beat hint | First entry to p > 0.6, once per visitor | Fades in, then out after 4 s or on first beat |
| Pattern Book | Panel labels | As each panel crosses 70% of the viewport | Weft-reveal the selvedge label |
| Draft | Page background | p 0 → 0.15 | Loom Black → Raw Silk (CSS variable crossfade) |
| Draft | Capability list | p 0.15 → 0.4 | Rows reveal, 70 ms stagger |
| Draft | Drawdown | On hover/focus of a capability | Rows render 16 ms apart, top → bottom |
| Selvedge | Labels marquee | In view | 18 px/s, opposite directions per row; pause on hover/focus |
| Thread | Red thread pull | p 0 → 0.5 | Thread end follows a spline from the cloth to the field underline (`redThread` spring) |
| Thread | "Start a thread." | p 0.35 | Weft-reveal |

## 5. Input systems

### 5.0 Hero systems (highest priority)

#### 5.0.1 Shuttle cursor: weaving rows
- **Stage model.**
  - `NT` warp threads (desktop ≈ 150, about 9 px pitch at 1600 w; tablet 110; phone 72).
  - `NR` rows (desktop 62).
  - The cloth grows from the breast beam upward. The **next row** sits just above the fell.
- **Laying the weft.** While the pointer is inside the stage, a weft polyline of 24 points trails it on `weftChain`.
  - Its first point is anchored at the selvedge where the current pass began.
  - It is drawn over warp *i* when `(i + row) % 2 == 0`, otherwise under. The over/under state is per crossing, so the interlacing is visible.
- **Pass detection.** A pass starts when the pointer enters within 2 pitches of either selvedge, or moves horizontally more than 3 pitches.
  - The pass **completes** when its horizontal extent reaches **≥ 60% of the warp width** with net horizontal travel greater than 1.5× net vertical travel.
  - Direction is free (left→right or right→left).
- **On completion.**
  1. The row is committed with the current yarn.
  2. It snaps into the fell (`rowBeat`, ~120 ms with overshoot).
  3. A clack plays; `ROWS` steps; the next row begins.
  4. At most **6 rows per second**; faster passes queue.
- **Incomplete passes.** If the pointer leaves the stage or reverses before 60%, the loose weft **relaxes** (gravity sag on the chain) and fades over 600 ms. No row is committed.
- **Vertical motion.** Vertical-dominant movement plucks the warp (§5.2), even while a pass is in progress.
- **Woven image.**
  - The wordmark Jacquard is a precomputed `NT × NR` mask (letters = 1).
  - Crossing (i, j) is **weft-faced** if it is a letter, otherwise **warp-faced** with satin binding points at `(3i + j) mod 5 == 0`.
  - Colour: weft-faced = yarn colour of row j; warp-faced = graphite.
  - The fell-edge rows glow (emissive decays over 2.5 rows).

#### 5.0.2 Yarn change (click)
- A click inside the stage that is **not** the end of a drag (moved < 4 px) cycles `yarnIndex` through four yarns:

  | Yarn | Hex |
  |---|---|
  | silk | `#EAE0CC` |
  | madder | `#E3241B` |
  | indigo | `#22306E` (lifted to `#3A4FA8` for contrast on graphite) |
  | ochre | `#C8A15A` |

- **Feedback.** A "snip" sample; the weft chain splits at the cursor and a new end appears in the new colour (160 ms). Four swatches flash beside the cursor (fade in 120 ms, hold 600 ms, fade 180 ms). The `YARN` label updates.
- **Never** resets or recolours committed rows.

#### 5.0.3 Idle auto-weave
- After **2.5 s** with no pointer input over the stage (and on touch devices after 2.5 s with no touch), a ghost shuttle crosses and weaves **one** row in 1.4 s (`shuttle` ease). Then it waits another 4 s.
- It stops permanently once the visitor completes a row themselves.
- **Reduced motion:** no auto-weave. Show a "Weave a row" button instead.

#### 5.0.4 Portal (H01) timing
| t (from preloader 100%) | Event |
|---|---|
| 0–300 ms | Thread self-pluck (F00 exit) |
| 300–700 ms | Thread translates to the back-beam y (`tension`); its body crossfades red → silk, its ends stay red |
| 500–1500 ms | Warp threads unroll from the beam, **centre-out, 4 ms stagger, 700 ms each** (`tension`), then settle on `warpDrop` |
| 800 ms | H1 weft-reveal starts |
| 1200 ms | Hint + instrument bar fade in; the 8 pre-woven rows fade up from the breast beam |
| 1500 ms | Interactive; idle timer starts |

#### 5.0.5 Scroll-out (H05) mapping
Hero progress `p` over 0–100 vh, sticky stage, native scroll:

| p | Mapping |
|---|---|
| 0 → 0.40 | `uHeroRows` auto-completes to `NR` at up to 3 rows per 1% scroll (never removes the visitor's rows). `uBeamGap` 1 → 3 (beams part). H1 retracts (0.10 → 0.35). |
| 0.40 → 1.00 | The camera interpolates from K0 to K0b along the authored rail. Warp sway gain 0.4 → 1. Pointer weaving is disabled; plucking stays enabled. |
| Reverse | Pure function of `p`, so the frontal loom returns with the same rows |

#### 5.0.6 Persistence and payoff
- **Stored.** `{ rows: Uint8Array(NR) of yarnIndex | 255 = auto-woven, startedAt }` in `sessionStorage` (key `pixelard.heroPatch`), written on every committed row.
- **F09 and `/contact`.** The patch is re-rendered as the cloth the red thread pulls from. On `/contact` it gets the caption *"You started this thread at mm:ss."*
- **No server storage, no tracking.** It stays in the visitor's tab only.

### 5.1 The Needle (cursor)
- **Visibility.** Only for `(pointer: fine)` and `(hover: hover)`. Touch devices keep the native behaviour. The native cursor stays inside text inputs and textareas.
- **Anatomy.** A 12 px ring (1.5 px Raw Silk stroke) plus a 2 px dot. The dot follows the raw pointer and the ring uses `needleRing`.
- **Tail.** 12 points, each following the previous with `needleTail`, drawn as a 1.5 px red line on the canvas overlay with alpha fading to 0 at the end. The tail is hidden when the pointer has been idle for more than 1.5 s.
- **State selection.** The nearest ancestor with `data-cursor="shuttle | pluck | pickglass | knot | beat | hidden"` decides the state. In the hero stage the default is **`shuttle`**: the ring becomes a small elongated shuttle silhouette (24 × 8 px) that rotates toward the direction of travel. World regions (warp, cloth) set the state through the canvas raycast/UV test.
- **Morph.** 240 ms with the `release` ease between states.

### 5.2 Pluck
- **Trigger.** The pointer segment from the previous frame to the current one crosses thread *i*'s screen-space line, and the pointer speed is above 0.05 px/ms.
- **Model.** Each thread stores `A` (amplitude), `t0` (pluck time) and `f` in a `1 × N` float DataTexture.
  - Displacement along the thread's normalized length `s`:
    `d(s,t) = A · e^(−(t−t0)/τ) · [ sin(πs)·sin(2π f (t−t0)) + 0.35·sin(2πs)·sin(4π f (t−t0)) ]`
  - `A = clamp(k · v⊥, 0, A_max)`, with `k = 0.004 m per px/ms` and `A_max = 0.03 m`.
  - `τ = 1.4 s`. `f = 2.2 Hz` visual (a slowed, cinematic vibration). Neighbours i±1 and i±2 receive 35% and 12% of A (sympathetic vibration).
- **Limits.** Retrigger cooldown of 120 ms per thread. At most 24 active threads; the oldest is replaced first.
- **Audio** (if on). Thread index → note in a minor pentatonic scale over 3 octaves (`note = scale[i mod 15]`), Karplus-Strong voice, velocity from A. At most 12 notes per second globally. Pan follows the thread's screen x (−0.6 to 0.6).

### 5.3 Pick glass
- **Where.** Active over woven cloth and media panels (`data-cursor="pickglass"`).
- **Shape and position.** A 160 px square (210 px in the Pattern Book) offset up and right of the pointer by 24 px, following with `pickGlass`.
- **Content.** The **same weave shader**, rendered at ×5 magnification on a DOM-synced quad. It is not a screenshot, so it stays crisp. Ruler ticks mark every thread, with a long tick every 4.
- **Label.** `×5 · {TPI} TPI` in mono 11 px, where TPI reflects the current Beat.
- **Enter / exit.** Scale 0.6 → 1 with opacity, 220 ms `release`. Exit is 160 ms `unwind`.
- **Touch.** Tap and hold on media (≥ 350 ms) shows the loupe above the finger; lifting the finger hides it.

### 5.4 Beat (press and hold)
State machine:
```
idle ──pointerdown──▶ armed ──(180 ms, moved < 8 px)──▶ beating ──pointerup / leave──▶ releasing ──(settled)──▶ idle
          │                                                        ▲
          └──moved ≥ 8 px or pointerup──▶ idle (it was a click/drag)
```
- **Beating.** `beat` springs toward 1 with `beatIn`. Thread count is `TPI = lerp(base, 512, beat^1.5)`. The beater bar's x position is `beat × clothWidth`. Thread sway is ×0.3 and exposure +6%.
- **Releasing.** `beat` springs to 0 with `beatOut`, slightly overshooting below 0. That reads as the cloth relaxing.
- **Where.** On the Weave, 1804 and Pattern Book chapters, but **not** over links, buttons or form fields.
- **Keyboard.** Holding `B` while focus is in `<main>` performs the same action. It is documented in the accessibility statement.
- **Reduced motion.** It becomes the toggle "Show high thread count" (an instant switch).
- **Audio.** A sine-plus-noise tone rises from 110 Hz to 220 Hz with `beat`. A wooden clack plays on release.

### 5.5 Knot (links and buttons)
- **Hover / focus-visible.** A red underline draws left to right (`stroke-dashoffset`, 280 ms `release`), then a small knot loop is drawn at the end (120 ms delay, 160 ms).
- **Press.** The knot scales to 0.85 (`instant`). On release it returns to 1.
- **Focus** uses the same knot plus a 2 px offset outline in the red token, so it is never hover-only. Contrast: red on Loom Black ≈ 4.7:1, red on Raw Silk ≈ 3.3:1 (meets 3:1 for non-text UI).

### 5.6 Menu (punch card)
- **Open.**
  1. The canvas blurs 8 px and exposure drops 65% (300 ms).
  2. The card rises from `y 100%` to 0 (600 ms `release`).
  3. Holes punch in sequence, 8 ms apart.
  4. Rows reveal with a 70 ms stagger.
  5. A card-punch tick plays per row if sound is on.
- **Close.** The card drops (420 ms `unwind`) and the world restores (300 ms).
- **Keyboard.** `Esc` closes. Focus is trapped while open and returns to the menu button on close. Up/down arrows move between rows.
- **Hover / focus a row.** That row's holes turn red and a knot underline is drawn.

### 5.7 Transitions
- **Shuttle pass** (between routes), total 1100 ms:
  - **Weave in, 0–520 ms.** Rows are 18 px high. Each row fills left to right over 260 ms (`shuttle` ease), staggered 6 ms top to bottom, led by a bright shuttle head.
  - **Hold, 520–620 ms.** `router.push` has resolved and the new page's scene signals `ready`.
  - **Unweave, 620–1100 ms.** Rows retract right to left, bottom to top, 240 ms each (`release` ease).
  - **Back navigation** mirrors the direction.
  - **Not ready at 520 ms?** Hold with a row shimmer for up to 2.5 s, then show the punch-card counter.
  - **Interruptible.** A new navigation during the unweave re-targets.
  - **Reduced motion.** A 200 ms cross-fade.
- **The Cut** (Pattern Book → case study): the sequence in `03` F06. FLIP from the panel's DOM rect to the viewport uses the `tension` ease.
- **Same-route anchors and hash links** never trigger a transition.

### 5.8 Preloader
1. **Load.** Progress is weighted: fonts 10%, core JS 20%, warp and shuttle geometry 25%, woven reel source 25%, audio 10% (only if sound is chosen), other 10%.
2. **Tension.** The displayed progress is smoothed (critically damped, about 400 ms) so it never jumps backward or stalls visibly.
3. **Sag.** The thread's sag is `40 px × (1 − progress)`. A micro-vibration of amplitude `2 px × (1 − progress)` adds life.
4. **Choice.** At 100%, the sound choice appears after 150 ms. **Without a choice, the site enters in silence after 6 s.**
5. **Exit.** A self-pluck, then the thread **rises to become the back beam** and the warp unrolls from it. See §5.0.4 for the full portal timing.
6. **Repeat visits** (same session): a 400 ms exit only.

### 5.9 Form (Start a thread)
- **Typing.** Each character adds a punched hole to a small card beside the field (max 64 visible; the rest scroll). A soft tick plays with 30 ms throttling.
- **Validation.** Errors appear on blur, never while typing. The field's red underline goes slack (a gentle droop, 240 ms) and the message appears below in plain text. `aria-describedby` links them.
- **Submit.**
  1. The knot tightens (`instant`).
  2. The thread retracts into the cloth (600 ms `tension`).
  3. The confirmation weft-reveals.
  4. On server error, the thread stays and an inline error appears. **Nothing is lost**: field values are preserved.

### 5.10 Touch and gesture map
| Gesture | Result |
|---|---|
| Native vertical scroll | Scroll (never hijacked) |
| Drag horizontally across the hero stage | **Weave** (the finger is the shuttle). The canvas uses `touch-action: pan-y`, so vertical scrolling stays native. |
| Tap in the hero stage | Change yarn |
| Drag horizontally across threads (outside the hero) | Pluck |
| Long-press (≥ 350 ms) on cloth or media | Beat on cloth, pick glass on media (whichever applies) |
| Device tilt | Parallax ≤ 2°. Opt-in: iOS asks permission on the first tap of "Enable tilt" in the menu. |
| Swipe in Pattern Book | Native horizontal scroll-snap (proximity) |

### 5.11 Keyboard map
| Key | Result |
|---|---|
| `Tab` / `Shift+Tab` | Focus order follows DOM order. Every interactive element has a knot focus state. |
| `Esc` | Close menu or loupe |
| `Space` (hero stage focused) | Weave one row (auto pass, 600 ms) |
| `Y` (hero stage focused) | Change yarn |
| `B` (hold) | Beat (when focus is in `<main>` and not in a field) |
| `M` | Toggle sound (announced via `aria-live`) |
| `←` / `→` | Inside the focused Pattern Book track, move one panel |

## 6. Text animation system

### 6.1 Weft-reveal (signature)
- **Split.** Text is split into **lines** (GSAP SplitText, `type: "lines"`, re-split on resize, `aria` preserved). Each line is masked by a **stair-stepped `clip-path: polygon()`** with 8 horizontal bands. Each band has its own right edge `x_b ∈ [0,1]`.
- **Animation.** Each band's `x_b` tweens 0 → 1 over 420 ms (`shuttle` ease), staggered 35 ms top to bottom within a line and 60 ms between lines. The polygon string is rebuilt per frame from the 8 values. This is cheap for headline-sized text only.
- **Exit.** The same animation reversed (bands retract right to left) at 0.8× duration.
- **Fallback.** If `clip-path` polygon animation is too costly on a device tier, reveal by line with a single `inset()` wipe.
- **Never** applied to body copy longer than 2 lines.

### 6.2 Counters
Punch-glyph counters step through integers. They **never** scramble random characters. The punch glyphs light up hole by hole (8 ms per hole) when a digit changes.

### 6.3 Body copy
Opacity 0 → 1 over 420 ms (`release`) as a block when 20% in view. No per-word animation.

## 7. Sound specification

| Layer | Source | Level | Behaviour |
|---|---|---|---|
| Room tone | Loop (wool-dampened room, 60 s, −30 LUFS) | −28 dB | Crossfades by chapter. Low-pass 2.4 kHz while the menu is open. |
| Pluck | Karplus-Strong synthesis (no samples) | −14 dB peak | See §5.2. Limiter on the bus. |
| Loom clack | 4 sample variations, round-robin | −18 dB | Row completion (≤ 8/s), Beat release |
| Shuttle air | 2 samples | −22 dB | Panel boundaries, transitions (panned L → R) |
| Beat tone | Sine plus filtered noise | −20 dB | §5.4 |
| UI ticks | 2 samples (card punch, paper) | −26 dB | Menu, typing, drawdown rows |
| Knot pull | 1 sample | −18 dB | Submit |

**Rules:**
- Off until the visitor chooses "Enter with sound" or toggles it with `M`. The choice is persisted in `localStorage`.
- `AudioContext` is created only on that user gesture.
- Ducked to −∞ when the tab is hidden; resumes on visibility.
- Master limiter at −1 dBTP.
- Total audio payload under 600 KB (Opus/AAC). Lazy-loaded after the choice.
- Never autoplay video with sound. Case-study videos are muted by default and have their own controls.

## 8. Reduced-motion map

| Feature | Default | `prefers-reduced-motion: reduce` |
|---|---|---|
| Hero portal (H01) | Centre-out cascade | Warp appears in place (200 ms fade) |
| Hero weaving | Spring-chain weft, row snap | Still available (user-initiated). Rows commit without snap or overshoot; no idle auto-weave ("Weave a row" button instead). |
| Camera rail | Continuous flight | Cut between still compositions (200 ms cross-fade) |
| Idle drift, sway | On | Off |
| Pluck | Animated plus sound | Off (sound still available on click as a "play note" affordance, optional) |
| Weft-reveal | 8-band animation | Instant |
| Beat | Hold gesture | Toggle button |
| Shuttle pass | 1100 ms | 200 ms cross-fade |
| The Cut | FLIP plus unweave | Cross-fade to the case study |
| Marquee | Moving | Static grid |
| Cursor tail | On | Off (ring only) |
| Video autoplay | Muted loops | Poster plus play button |

## 9. Performance rules for motion

- DOM animations touch **only `transform`, `opacity`, `clip-path`** (headline-only) and CSS variables. No layout properties.
- All per-frame world updates run in **one** `useFrame` loop per system, reading the non-reactive store. **No `setState` in frame loops.**
- GSAP and Lenis share one ticker (`gsap.ticker`). R3F renders on the same RAF.
- The world **pauses rendering** when the Draft chapter is fully in view, when the tab is hidden, or when the canvas is off-screen.
- On any frame over 24 ms for 30 consecutive frames, step down one quality tier (`05` §5.13). Never step back up in the same session (avoids oscillation).

## 10. Motion QA checklist

- [ ] **Hero 3-second test**, run on 5 people who have not seen the site: within 3 s, each has moved the pointer and seen a response, and can say what the studio does.
- [ ] Hero: a pass ≥ 60% always commits exactly one row; jiggles never commit; clicks after drags never change yarn.
- [ ] Hero: the idle auto-weave stops for good after the visitor's first row; the patch survives reloads within the session and shows up in F09 and `/contact`.
- [ ] Scrubbing forward and backward through every chapter is glitch-free (no pops at chapter boundaries).
- [ ] Fast flick-scrolling from top to bottom never shows unwoven or black frames, and the shuttle never outruns its rows.
- [ ] Beat cannot be triggered from links, buttons or fields. A click is never mistaken for a beat.
- [ ] The cursor never lags behind a link's hit area; the knot appears within one frame of focus.
- [ ] Transitions survive: double-clicks, back during the transition, slow network (hold path), and offline (error path).
- [ ] With reduced motion on, nothing moves except user-initiated cross-fades.
- [ ] Sound off by default, honoured across routes and reloads. `M` toggles it.
- [ ] 60 fps on tier A, ≥ 45 on tier B, ≥ 30 on tier C (see `05` §5.13 for the device matrix).
