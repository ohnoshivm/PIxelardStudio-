# AGENTS.md: guidance for agents working in this repository

## Project status
- **Pixelards** is an Australian, AI-first, branding-first creative studio.
- The site is in **creative exploration** for the concept **THE LIVING SIGNAL** (`docs/living-signal/`).
- The studio has chosen **Direction A, "Every Piece Is Whole"**. It is awaiting approval of the identity decisions listed in `02` §9.
- **No identity (logo, palette, type, materials) is final, and no production website code may be written until the studio approves.**
- **Claude Code is the sole production environment.**
- The earlier "Warp & Weft" pack for "Pixelard" is archived in `docs/archive/2026-10-warp-and-weft/` and superseded.

## Read first
1. `docs/living-signal/00-brief-and-principles.md`: brief, strategy, standards, judging criteria.
2. `docs/living-signal/01-candidates.md`: the six candidate executions the studio chose from.
3. `docs/living-signal/02-direction-a-every-piece-is-whole.md`: the chosen direction, keyframes and open decisions.

## Non-negotiables (now, and for production later)
- Do not fabricate case studies, client results, awards, testimonials or credentials. Label placeholders.
- No AI clichés (glowing brains, neural-net graphs, sparkle icons, purple-blue AI gradients). No meaningless particles, stock 3D blobs or excessive glassmorphism.
- Do not copy lusion.co's identity, assets, layout or interactions (list in `00` §3).
- Never use or imitate Aboriginal and Torres Strait Islander art, symbols or stories.
- Production work will be DOM-first, accessible (WCAG 2.2 AA), performant (60 fps desktop / 30 fps mid-range mobile), never blocks zoom, never hijacks touch scroll, and honours `prefers-reduced-motion`.
- Client media is shown unaltered: no effects on client work.

## Keyframe comps
- Keyframes in `docs/living-signal/keyframes/` are design comps: real three.js plus DOM pages screenshotted headlessly.
- Their sources in `keyframes/src/` are **exploration code, not production code**. Interim fonts are open-source stand-ins.
