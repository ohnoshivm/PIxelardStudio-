# AGENTS.md: guidance for coding agents (Codex)

## Project status
This is pre-production. The creative direction is complete and **no application code exists yet**. Start with milestone **M0**, then **M1 (the hero)**, as defined in `docs/creative/05-technical-brief-codex.md` §8.

## Read before writing code (in this order)
1. `docs/creative/05-technical-brief-codex.md`: stack, architecture, budgets, milestones. **Source of truth for engineering.**
2. `docs/creative/04-motion-interaction-spec.md`: every timing, spring, gesture and state machine.
3. `docs/creative/03-experience-storyboards.md`: what each screen must look and feel like (frames in `docs/creative/storyboards/`).
4. `docs/creative/01-reference-analysis.md` §D3–D4: the rules, and what must **not** be copied from the reference.

Precedence when documents disagree: 05 → 04 → 03 → 02 → 01. Record deviations as ADRs in `docs/decisions/`.

## Non-negotiables
- DOM-first: every route works without WebGL. One persistent `<Canvas>` lives in the root layout.
- No React `setState` inside frame loops. Per-frame state lives in mutable stores.
- Visuals are pure functions of (scroll progress, input state, time), so reverse scrolling is exact.
- Never block zoom. Never hijack touch scrolling. Honour `prefers-reduced-motion`.
- Never invent real clients, projects, people or quotes. Use content flagged `placeholder: true`.
- Never apply weave or distortion effects to client media inside case studies.
- Don't copy lusion.co's identity: palette, jack/cross physics pile, rounded hero card, logo-window preloader, tunnels, astronauts.

## Conventions
- TypeScript strict, pnpm, ESLint and Prettier. Vitest for unit tests, Playwright for e2e.
- Motion values come from `lib/motion/tokens.ts`, never magic numbers. Springs use `SecondOrder`.
- Shaders live in `.glsl` files with a comment citing the spec section they implement.
- Small PRs with preview deploys; include perf numbers for any 3D change.
- New runtime dependencies need a one-line justification and an update to the stack table in 05 §2.

## Commands
Define these in M0 and keep this section updated: `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm e2e`.
