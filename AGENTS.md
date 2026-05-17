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

> Build ConductorIQ into a polished local MVP that matches `PRD.md` as closely as possible within the 4-5 hour MVP constraint.

Completion evidence should include:

- Running app or successful build output.
- Implemented pages and components mapped to PRD requirements.
- Persistent workflow state.
- Visible multi-agent orchestration.
- Generated or simulated artifacts.
- Validation and critique loops.
- Updated `PROGRESS.md`.

## 4. Implementation Priorities

Prioritize in this order:

1. App runs locally without errors.
2. Core ConductorIQ visual identity and layout.
3. Idea intake and workflow activation.
4. Agent roster and visible execution states.
5. Orchestration graph or stage visualization.
6. Artifact vault and generated asset cards.
7. Project memory and dependency tracking.
8. Validation, critique, retry, and revision loops.
9. Launch or deploy readiness view.
10. Polish, responsiveness, and demo reliability.

Do not implement unrelated features outside the PRD unless required to make the MVP coherent, runnable, or demo-ready.

## 5. Product Architecture Discipline

LangGraph is part of the ConductorIQ product architecture. It should be represented as the internal orchestration engine that coordinates agents, state, routing, validation loops, retries, dependencies, approval checkpoints, and continuous execution.

Codex does not need to use LangGraph as its own development workflow. Codex may use normal local development tools and implementation practices.

When implementing the MVP:

- Build a frontend-only local application using React, TypeScript, Vite, and TailwindCSS.
- Do not implement a backend server, server APIs, databases, authentication, billing, queues, workers, or production infrastructure.
- Do not require API keys.
- Represent LangGraph, OpenAI, Exa, Stitch MCP, and Codex/Cursor as product architecture concepts and simulated integration points inside the UI.
- Prefer a coherent browser-only simulation over incomplete real infrastructure.
- Keep the architecture modular enough to replace simulation with real integrations later.
- Separate orchestration state, agent definitions, artifact data, and UI components.
- Use timers, deterministic state machines, mock agent outputs, staged artifact generation, and rotating logs so demos are stable.
- Persist workflow state, generated artifacts, agent states, execution logs, validation scores, and PRD content with localStorage or IndexedDB.

## 6. Progress Tracking

`PROGRESS.md` must remain current during implementation.

Each update should include:

- Completed PRD requirements.
- In-progress requirements.
- Remaining requirements.
- Known gaps or shortcuts.
- Verification performed.
- Next highest-priority task.

Do not mark a requirement complete unless it is implemented and verified.

## 7. GitHub Commit Discipline

Codex should commit progressively to GitHub during implementation instead of waiting until the end of a large build.

Working rules:

- Commit after each coherent milestone, such as scaffolding the app, implementing the orchestration state model, building the intake flow, adding agent simulation, adding artifact persistence, or completing visual polish.
- Keep commits small enough that each one has a clear purpose and can be reviewed independently.
- Run the most relevant available verification before committing.
- Do not commit broken or partially applied work unless the commit message explicitly marks it as a checkpoint and the user asked for that behavior.
- Push successful milestone commits to `origin` so GitHub remains current.
- Do not commit secrets, `.env` files, local cache folders, build outputs, or dependency folders.
- Use concise imperative commit messages, for example `Add frontend orchestration shell` or `Implement local workflow persistence`.
- Before committing, inspect `git status --short` and make sure only intended ConductorIQ files are staged.

If GitHub authentication fails because an environment token is invalid, prefer using the stored `gh` account for `Jeric-png` by running GitHub commands with `GITHUB_TOKEN` unset.

## 8. Verification Discipline

After meaningful implementation changes, Codex should run the most relevant available checks:

- Typecheck.
- Build.
- Lint, if configured.
- Unit tests, if present.
- Browser verification for frontend behavior when a dev server is available.

If a check cannot run, record why in `PROGRESS.md` or the final response.

## 9. UX Discipline

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

## 10. Scope Control

Avoid:

- Authentication.
- Billing.
- Multi-tenant administration.
- Enterprise governance.
- Production deployment complexity.
- Microservices.
- Unrelated dashboards.
- Features not grounded in the PRD.

Prefer:

- Demo reliability.
- Clear orchestration illusion.
- Strong product storytelling.
- Local-first persistence.
- Modular React and TypeScript code.
- Fast iteration.
