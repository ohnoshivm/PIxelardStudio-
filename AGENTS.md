# AGENTS.md: guidance for agents working in this repository

## Project status
- **Pixelards** is an Australian, AI-first, branding-first creative studio.
- The site is in **creative exploration** for the concept **THE LIVING SIGNAL** (`docs/living-signal/`).
- **Reset (9 Oct 2026):** the studio rejected Direction A, "Every Piece Is Whole", and the six candidates in `01` as far below Lusion's level. Those documents are kept as a record only and are not to be developed further.
- The bar is now **Lusion-level craft**. The reference set is `03-sites-that-rival-lusion.md`. New concepting must be visual-first: concept art, motion and real-GPU review, not stills-only argument.
- If a capability is missing (image or video generation, a GPU browser, Figma, a deploy target), **ask the studio for it** rather than pushing through without it.
- **No identity (logo, palette, type, materials) is final, and no production website code may be written until the studio approves.**
- **Claude Code is the sole production environment.**
- The earlier "Warp & Weft" pack for "Pixelard" is archived in `docs/archive/2026-10-warp-and-weft/` and superseded.

## Read first
1. `docs/living-signal/00-brief-and-principles.md`: brief, strategy, standards, judging criteria.
2. `docs/living-signal/01-candidates.md`: the six rejected candidate executions, kept as a record.
3. `docs/living-signal/02-direction-a-every-piece-is-whole.md`: the rejected Direction A, kept as a record.
4. `docs/living-signal/03-sites-that-rival-lusion.md`: the 15-site reference set at Lusion's level, with what to take from each and what to avoid.

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
