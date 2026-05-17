# ConductorIQ Agent Instructions

This file defines how Codex should work in this repository. It does not replace the product requirements.

## 1. Source of Truth

`PRD.md` is the primary source of truth for ConductorIQ product requirements.

Codex must treat `PRD.md` as authoritative for:

- Product scope.
- Feature requirements.
- Workflow stages.
- UI/UX direction.
- Page structure.
- Orchestration behavior.
- MVP priorities.
- Implementation constraints.

If there is a conflict between this `AGENTS.md` file and `PRD.md`:

- Follow `PRD.md` for product requirements.
- Follow `AGENTS.md` for working behavior, progress tracking, and implementation discipline.

## 2. Required Start-of-Work Routine

Before implementing product changes, Codex must:

1. Read `PRD.md` fully.
2. Extract required pages, components, workflows, data structures, states, and constraints.
3. Inspect the existing codebase.
4. Compare the PRD requirements against the current implementation.
5. Update `PROGRESS.md` with an implementation checklist based on the PRD.
6. Begin implementation from the highest-priority incomplete requirement.

If `PROGRESS.md` does not exist, create it before starting product implementation.

## 3. Goal-Oriented Working Contract

ConductorIQ should be implemented with a goal-oriented discipline inspired by OpenAI's Codex Goals guidance:

- Define the concrete outcome before starting a multi-step task.
- Identify the evidence that proves completion.
- Preserve explicit constraints while working.
- Iterate based on the latest evidence from files, tests, logs, and rendered UI.
- Stop and report blockers when no defensible path remains.

Reference: https://developers.openai.com/cookbook/examples/codex/using_goals_in_codex

For this repository, the persistent implementation goal is:

> Build ConductorIQ into a polished frontend-only local MVP that matches `PRD.md` as closely as possible within the hard 2 hour 30 minute MVP constraint.

Completion evidence should include:

- Running app or successful build output.
- Implemented pages and components mapped to PRD requirements.
- Persistent workflow state.
- Visible multi-agent orchestration.
- Generated or simulated artifacts.
- Validation and critique loops.
- Updated `PROGRESS.md`.

When the user starts work with `/goal`, Codex must treat the goal as an active implementation contract:

- Continue working until the goal is complete, the 2 hour 30 minute MVP acceptance criteria are met, or a genuine blocker prevents progress.
- Do not stop after planning, scaffolding, or partial implementation if the app is still not runnable.
- Use `PROGRESS.md` as the live execution ledger and update it after each milestone.
- Prefer making the next highest-priority working change over asking for clarification when the PRD provides a reasonable default.
- If blocked, record the blocker, attempted fixes, and the next concrete recovery step in `PROGRESS.md`.
- Mark the goal complete only after verification proves the local app runs or builds successfully.

## 4. Implementation Priorities

Prioritize in this order:

1. App runs locally without errors.
2. Six-workspace ConductorIQ shell: Intake, Strategy, PRD Generation, Synthesis, Deployment, and Launch.
3. Core cinematic visual identity and layout.
4. Idea intake and workflow activation.
5. Deterministic frontend orchestration state machine.
6. Agent roster and visible execution states.
7. Strategy workspace with market signals, competitors, personas, risks, and validation confidence.
8. PRD Generation and Synthesis workspaces with generated artifacts and final pursue/refine/reject recommendation.
9. Deployment and Launch workspaces with MVP scope, readiness, and next actions.
10. Polish, responsiveness, and demo reliability.

Do not implement unrelated features outside the PRD unless required to make the MVP coherent, runnable, or demo-ready.

Timeboxing rule: if a requirement cannot fit in the 2 hour 30 minute MVP window, implement the smallest believable visual simulation that satisfies the user-facing acceptance criteria and document the shortcut in `PROGRESS.md`.

Two-hour-thirty execution budget:

- 0:00-0:15: scaffold Vite React TypeScript app and TailwindCSS.
- 0:15-0:40: build the cinematic shell and six-workspace navigation.
- 0:40-1:05: implement intake, localStorage state, agents, logs, and deterministic workflow ticks.
- 1:05-1:40: implement Strategy validation content: market signals, competitors, personas, risks, and scores.
- 1:40-2:05: implement PRD Generation and Synthesis with critique loop and pursue/refine/reject recommendation.
- 2:05-2:20: implement Deployment and Launch summaries.
- 2:20-2:30: verify build, reload persistence, and end-to-end demo flow.

## 5. Codex Agent Responsibilities

Codex should operate as a compact implementation team during `/goal` work. These are working responsibilities, not product agents:

- Product Extractor: read `PRD.md`, extract the six workspaces, acceptance criteria, constraints, and required simulated states before coding.
- Implementation Lead: build the Vite React TypeScript app, keep architecture simple, and prioritize runnable increments.
- UI Builder: implement the cinematic frontend shell, workspace panels, agent cards, logs, scores, artifacts, and visual hierarchy from `Assets/`.
- Simulation Engineer: implement localStorage persistence, deterministic timers, workflow ticks, mock outputs, agent state transitions, and recommendation scoring.
- Verifier: run install/build/typecheck/browser verification where available and record results in `PROGRESS.md`.
- Git Publisher: optional only after the build is verified or when the user explicitly asks for a commit/push.

Codex should not spawn sub-agents unless the user explicitly requests delegated or parallel agent work. If sub-agents are requested, each sub-agent must receive a bounded task, a disjoint write scope, and this `AGENTS.md` context.

## 6. Stitch MCP Handling

Stitch MCP is a product integration concept for this MVP, not a required runtime dependency.

When asked to use Stitch MCP:

- First use available tool discovery to check whether a Stitch MCP tool or connector is exposed in the current Codex environment.
- If Stitch MCP is available, inspect whether a ConductorIQ project or design reference is accessible and record the result in `PROGRESS.md`.
- If Stitch MCP is not available, do not block implementation. Record that Stitch access was unavailable and continue with local `Assets/` references plus simulated Stitch activity in the UI.
- Do not add real Stitch API calls, credentials, backend routes, or MCP runtime dependencies during the 2 hour 30 minute MVP.

Current verified Stitch access:

- Remote MCP endpoint is configured in the local Codex config.
- `ConductorIQ Orchestration Workspace` is accessible as `projects/11643138006250717621`.
- The project exposes desktop screens and a dark purple-accented design theme.
- Use this as an optional visual reference only; local `Assets/` remain the reliable implementation source.

## 7. Product Architecture Discipline

LangGraph is part of the ConductorIQ product architecture. It should be represented as the internal orchestration engine that coordinates agents, state, routing, validation loops, retries, dependencies, approval checkpoints, and continuous execution.

Codex does not need to use LangGraph as its own development workflow. Codex may use normal local development tools and implementation practices.

When implementing the MVP:

- Build a frontend-only local application using React, TypeScript, Vite, and TailwindCSS.
- Do not create extra top-level workspaces beyond Intake, Strategy, PRD Generation, Synthesis, Deployment, and Launch.
- Do not implement a backend server, server APIs, databases, authentication, billing, queues, workers, or production infrastructure.
- Do not require API keys.
- Represent LangGraph, OpenAI, Exa, Stitch MCP, and Codex/Cursor as product architecture concepts and simulated integration points inside the UI.
- Prefer a coherent browser-only simulation over incomplete real infrastructure.
- Keep the architecture modular enough to replace simulation with real integrations later.
- Separate orchestration state, agent definitions, artifact data, and UI components.
- Use timers, deterministic state machines, mock agent outputs, staged artifact generation, and rotating logs so demos are stable.
- Persist workflow state, generated artifacts, agent states, execution logs, validation scores, and PRD content with localStorage or IndexedDB.

## 8. Progress Tracking

`PROGRESS.md` must remain current during implementation.

Each update should include:

- Completed PRD requirements.
- In-progress requirements.
- Remaining requirements.
- Known gaps or shortcuts.
- Verification performed.
- Next highest-priority task.

Do not mark a requirement complete unless it is implemented and verified.

## 9. GitHub Commit Discipline

GitHub commits and pushes are optional during the 2 hour 30 minute MVP build. Building and verifying the app takes priority over publishing milestones.

Working rules:

- Commit only after a coherent milestone if verification has passed and doing so will not endanger the 2 hour 30 minute delivery window.
- Keep commits small enough that each one has a clear purpose and can be reviewed independently.
- Run the most relevant available verification before committing.
- Do not commit broken or partially applied work unless the commit message explicitly marks it as a checkpoint and the user asked for that behavior.
- Push successful commits to `origin` only when requested or when there is enough time after verification.
- Do not commit secrets, `.env` files, local cache folders, build outputs, or dependency folders.
- Use concise imperative commit messages, for example `Add frontend orchestration shell` or `Implement local workflow persistence`.
- Before committing, inspect `git status --short` and make sure only intended ConductorIQ files are staged.

If GitHub authentication fails because an environment token is invalid, prefer using the stored `gh` account for `Jeric-png` by running GitHub commands with `GITHUB_TOKEN` unset.

## 10. Verification Discipline

After meaningful implementation changes, Codex should run the most relevant available checks:

- Typecheck.
- Build.
- Lint, if configured.
- Unit tests, if present.
- Browser verification for frontend behavior when a dev server is available.

If a check cannot run, record why in `PROGRESS.md` or the final response.

## 11. UX Discipline

ConductorIQ should not look or behave like a generic chatbot.

Implementation should preserve the PRD's intended feel:

- Cinematic dark interface.
- Cyan and purple operational accents.
- Left pipeline navigation.
- Top navigation with autonomous mode.
- Agent cards and execution states.
- Graph, timeline, or stage-based orchestration visualization.
- Live terminal-style logs.
- Artifact cards and dependency signals.
- Memory and validation panels.
- Readiness and confidence metrics.

Screenshots and Stitch designs are visual references only. Obey the PRD scope over screenshots if they conflict. Do not copy screenshot navigation labels that are outside the six required workspaces.

## 12. Scope Control

Avoid:

- Authentication.
- Billing.
- Multi-tenant administration.
- Enterprise governance.
- Production deployment complexity.
- Microservices.
- Unrelated dashboards.
- Features not grounded in the PRD.
- Work that does not help complete the 2 hour 30 minute MVP acceptance criteria.

Prefer:

- Demo reliability.
- Clear orchestration illusion.
- Strong product storytelling.
- Local-first persistence.
- Modular React and TypeScript code.
- Fast iteration.
