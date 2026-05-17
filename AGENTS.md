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
4. Check installed dependencies with `npm ls --depth=0` and confirm the required MVP packages are present.
5. Compare the PRD requirements against the current implementation.
6. Update `PROGRESS.md` with an implementation checklist based on the PRD.
7. Begin implementation from the highest-priority incomplete requirement.

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

> Build ConductorIQ into a polished frontend-only local product workflow that matches `PRD.md` as closely as possible and executes the full prompt-to-approved-MVP orchestration loop with completed, validated features.

The implementation target is completed, validated product behavior. Codex must not optimize for a shallow shell, visual-only prototype, or minimal pass. Completion is acceptable only when the deep completion gates below are genuinely implemented and verified. Codex must not mark a goal complete merely because the app builds, because the UI looks polished, or because one happy path reaches Launch.

Completion evidence should include:

- Running app or successful build output.
- Implemented pages and components mapped to PRD requirements.
- Persistent workflow state.
- Local LangGraph `StateGraph` execution across the required workspaces.
- Visible multi-agent orchestration.
- Generated artifacts from OpenAI, Exa, or OpenAI fallback.
- Validation and critique loops.
- Prompt craft, prompt validation, and prompt improvement artifacts.
- Comprehensive generated PRD artifact and PRD review artifact.
- Market leads, validation evidence, and evidence-source labels.
- Synthesis Plan hold state before prototype/build progression.
- GPT Image 2 prototype image output or labelled visual prompt fallback.
- Explicit prototype approval state before build-preparation agents activate.
- Launch package containing implementation plan, component map, prototype direction, PRD, market validation, risks, and next actions.
- Updated `PROGRESS.md`.

LangGraph completion evidence should include implementation paths where the local graph advances through Intake, Strategy, PRD Generation, Synthesis, Deployment, and Launch, including:

- A normal path that reaches the Synthesis hold state.
- An approval path where prototype approval unlocks Launch/build-preparation outputs.
- A rejection or revision path where rejected prototype or weak synthesis routes back to prompt improvement, PRD revision, or prototype regeneration.
- An Exa failure or insufficient-evidence branch that routes to OpenAI fallback and labels the evidence correctly.

When the user starts work with `/goal`, Codex must treat the goal as an active implementation contract:

- Continue working until the goal is complete, the PRD acceptance criteria and deep completion gates are met, or a genuine blocker prevents progress.
- Do not stop after planning, scaffolding, or partial implementation if the app is still not runnable.
- Do not stop after a single happy-path implementation if approval gates, revision loops, PRD review, market lead validation, or persistence checks are missing.
- Use `PROGRESS.md` as the live execution ledger and update it after each milestone.
- Prefer making the next highest-priority working change over asking for clarification when the PRD provides a reasonable default.
- If blocked, record the blocker, attempted fixes, and the next concrete recovery step in `PROGRESS.md`.
- Mark the goal complete only after verification proves the local app runs, builds successfully, and passes the full workflow validation matrix in Section 10.

## 4. Implementation Priorities

Prioritize in this order:

1. App runs locally without errors.
2. Six-workspace ConductorIQ shell: Intake, Strategy, PRD Generation, Synthesis, Deployment, and Launch.
3. Core cinematic visual identity and layout.
4. Idea intake, prompt crafting, prompt validation, and prompt improvement.
5. Local LangGraph orchestration runtime with approval gates and revision loops.
6. Agent roster and visible execution states for prompt, PRD, market, prototype, approval, and launch agents.
7. Strategy workspace with market leads, market signals, competitors, personas, risks, validation questions, source labels, and confidence scoring.
8. PRD Generation workspace with a comprehensive generated PRD, section completeness, PRD review findings, and PRD quality score.
9. Synthesis workspace with review-first behavior, comprehensive Synthesis Plan, interface improvement notes, and a hold state before continuation.
10. Deployment workspace with GPT Image 2 prototype generation or visual prompt fallback, prototype review, and approval/rejection controls.
11. Launch workspace with build-preparation agents, implementation plan, component map, static package export, readiness dashboard, and next actions.
12. Polish, responsiveness, and product reliability.

Do not implement unrelated features outside the PRD unless required to make the product coherent, runnable, or validated.

Depth rule: if a requirement cannot be fully implemented in one pass, implement the strongest working slice that preserves the full workflow contract and document the limitation in `PROGRESS.md`. Do not remove approval gates, PRD review, market lead validation, or synthesis hold behavior for premature completion.

Execution phases:

- Phase 1: audit PRD, AGENTS, current implementation, dependency baseline, and gap list in `PROGRESS.md`.
- Phase 2: implement or refine shell, routing, persistence, agent roster, logs, and state model.
- Phase 3: implement prompt craft, prompt validation, improved prompt diff, and prompt quality scoring.
- Phase 4: implement Strategy market leads, market validation questions, competitor evidence, personas, risks, and fallback/real source labels.
- Phase 5: implement comprehensive PRD generation, PRD section completeness, PRD review findings, quality score, and revision loop.
- Phase 6: implement Synthesis review-first plan, interface improvement critique, validation gaps, rerun/revise/continue controls, and hold state.
- Phase 7: implement GPT Image 2 prototype generation or visual prompt fallback, prototype review, approval/rejection states, and regeneration loop.
- Phase 8: implement Launch build-preparation agents, implementation plan, component map, final MVP package, static export, and approval-backed next actions.
- Phase 9: run full validation matrix, browser scenarios, persistence reload, build, lint, and update `PROGRESS.md`.

Do not artificially wait to consume time. The point is completed product behavior and stronger verification, not idle time. Before claiming completion, Codex must run the full validation matrix and perform a gap review against `PRD.md`.

## 5. Codex Agent Responsibilities

Codex should operate as a compact implementation team during `/goal` work. These are working responsibilities, not product agents:

- Product Extractor: read `PRD.md`, extract the six workspaces, acceptance criteria, constraints, real API requirements, and workflow states before coding.
- Implementation Lead: build the Vite React TypeScript app, keep architecture simple, and prioritize runnable increments.
- UI Builder: implement the cinematic frontend shell, workspace panels, agent cards, logs, scores, artifacts, and visual hierarchy from `Assets/`.
- Workflow Engineer: implement localStorage persistence, local file import, static package download, LangGraph `StateGraph` routing, deterministic UI ticks, OpenAI/Exa request lifecycle states, OpenAI fallback, agent state transitions, approval gates, revision loops, and recommendation scoring.
- Prompt Systems Engineer: implement crafted prompt, prompt critique, improved prompt, prompt quality score, and prompt revision loop.
- Research Validation Engineer: implement market leads, validation questions, competitor evidence, persona objections, source labels, confidence scoring, and Exa/OpenAI fallback labeling.
- PRD Systems Engineer: implement comprehensive PRD generation, PRD section completeness, PRD reviewer findings, quality score, and revision requirements.
- Prototype Systems Engineer: implement GPT Image 2 prototype generation or labelled fallback visual prompt cards, prototype approval/rejection, and regeneration states.
- Launch Package Engineer: implement implementation plan, component map, build-preparation agent outputs, final package summary, and static export contents.
- Verifier: run dependency/build/typecheck/lint/browser verification, full workflow scenarios, approval/rejection scenarios, and persistence reload checks; record results in `PROGRESS.md`.
- Git Publisher: optional only after the build is verified or when the user explicitly asks for a commit/push.

Codex should not spawn sub-agents unless the user explicitly requests delegated or parallel agent work. If sub-agents are requested, each sub-agent must receive a bounded task, a disjoint write scope, and this `AGENTS.md` context.

## 6. Stitch MCP Handling

Stitch MCP is a product integration concept for this MVP, not a required runtime dependency.

When asked to use Stitch MCP:

- First use available tool discovery to check whether a Stitch MCP tool or connector is exposed in the current Codex environment.
- If Stitch MCP is available, inspect whether a ConductorIQ project or design reference is accessible and record the result in `PROGRESS.md`.
- If Stitch MCP is not available, do not block implementation. Record that Stitch access was unavailable and continue with local `Assets/` references plus clearly labelled Stitch reference activity in the UI.
- Do not add real Stitch API calls, credentials, backend routes, or MCP runtime dependencies unless the PRD explicitly requires them and verification can remain stable.

Current verified Stitch access:

- Remote MCP endpoint is configured in the local Codex config.
- `ConductorIQ Orchestration Workspace` is accessible as `projects/11643138006250717621`.
- Generated screen `ConductorIQ Strategic Intelligence Hub` is accessible as `projects/11643138006250717621/screens/dd063358fe864ec2a5c2378c321ae44f`.
- The project exposes desktop screens and a dark purple-accented design theme.
- Use this as an optional visual reference only; local `Assets/` remain the reliable implementation source.

## 7. Product Architecture Discipline

LangGraph is part of the ConductorIQ product architecture. The MVP application must use a real local LangGraph workflow as the internal orchestration engine that coordinates agents, state, routing, validation loops, retries, dependencies, approval checkpoints, and continuous execution.

Codex does not need to use LangGraph as its own development workflow. Codex may use normal local development tools and implementation practices. ConductorIQ itself, however, should install and use `@langchain/langgraph` during implementation.

Current dependency baseline:

- `package.json` and `package-lock.json` are present.
- React, React DOM, Vite, TypeScript, TailwindCSS, `@tailwindcss/vite`, `@langchain/langgraph`, `@langchain/core`, `openai`, `exa-js`, `lucide-react`, and `clsx` have been installed locally.
- Future Codex runs should verify this baseline with `npm ls --depth=0` before coding and should run `npm install` only if packages are missing or the lockfile is inconsistent.

When implementing the MVP:

- Build a frontend-only local application using React, TypeScript, Vite, and TailwindCSS.
- Use the installed `@langchain/langgraph` and `@langchain/core` packages for orchestration.
- Implement a local `StateGraph` with nodes for Intake, Strategy, PRD Generation, Synthesis, Deployment, and Launch, plus internal substeps for prompt validation, PRD review, synthesis hold, prototype approval, and launch build preparation.
- Keep LangGraph state serializable so localStorage can persist snapshots, artifacts, logs, scores, and selected workspace.
- Do not create extra top-level workspaces beyond Intake, Strategy, PRD Generation, Synthesis, Deployment, and Launch.
- Do not implement databases, authentication, billing, queues, workers, or production infrastructure.
- Do not use LangGraph Cloud, hosted checkpointers, database-backed checkpointing, queues, or worker infrastructure.
- Use the configured OpenAI and Exa keys for real validation calls.
- If browser-side calls would expose secrets, use a minimal local API proxy for OpenAI and Exa only; keep all persistence in localStorage.
- Use OpenAI as the fallback provider when Exa fails, times out, or returns insufficient market evidence.
- Use GPT Image 2 (`gpt-image-2`) for generated visual assets when image generation is needed.
- Support importing a local `.txt` or `.md` idea brief through the browser File API.
- Support downloading a local static MVP package from the Launch workspace; do not implement hosted deployment.
- Generate and display comprehensive PRD artifacts, PRD review artifacts, synthesis plans, market leads, interface improvement reports, prototype approval records, and launch implementation plans.
- Do not activate build-preparation/Launch implementation agents until prototype approval is explicit in state.
- Preserve rejected and revision-requested states; do not silently skip approval checkpoints.
- Represent Stitch MCP and Codex/Cursor as product architecture concepts and lightweight UI integration points.
- Represent LangGraph visibly in the UI while also using it as the actual local workflow coordinator.
- Prefer a coherent real API-backed workflow over mock-only output generation.
- If time is tight, implement one reliable full lifecycle path plus at least one rejection/revision branch before adding sophisticated branching.
- Separate orchestration state, agent definitions, artifact data, and UI components.
- Use deterministic state machines, request lifecycle states, staged artifact generation, and rotating logs so product workflows are stable.
- Persist workflow state, generated artifacts, agent states, execution logs, validation scores, and PRD content with localStorage or IndexedDB.

## 8. Progress Tracking

`PROGRESS.md` must remain current during implementation.

Each update should include:

- Completed PRD requirements.
- In-progress requirements.
- Remaining requirements.
- Known gaps or limitations.
- Verification performed.
- Next highest-priority task.
- Current deep completion gate status.
- Last browser scenario tested.
- Last approval/rejection path tested.
- Any requirement intentionally represented as fallback or deterministic local validation, with reason.

Do not mark a requirement complete unless it is implemented and verified.

`PROGRESS.md` must include a checklist with these categories:

- Intake and prompt lifecycle.
- Strategy and market validation.
- Comprehensive PRD generation.
- PRD review and revision.
- Synthesis Plan and hold state.
- GPT Image/prototype generation.
- Prototype approval/rejection.
- Launch build-preparation package.
- Persistence and reload.
- Browser verification.
- Build/lint/typecheck verification.

## 9. GitHub Commit Discipline

GitHub commits and pushes are optional during product implementation. Building and verifying the app takes priority over publishing milestones.

Working rules:

- Commit only after a coherent milestone if verification has passed.
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

- Dependency check with `npm ls --depth=0`.
- Typecheck.
- Build.
- Lint, if configured.
- Unit tests, if present.
- Browser verification for frontend behavior when a dev server is available.

If a check cannot run, record why in `PROGRESS.md` or the final response.

### 10.1 Deep Completion Gates

Codex must not mark a goal complete until all deep completion gates are either implemented and verified or explicitly documented as blocked with a defensible fallback:

- Gate 1: Intake accepts typed idea and `.txt`/`.md` file import.
- Gate 2: Prompt Architect produces a crafted prompt artifact.
- Gate 3: Prompt Validator produces critique, improved prompt, and prompt quality score.
- Gate 4: LangGraph records prompt validation before Strategy runs.
- Gate 5: Strategy produces market leads, market signals, competitors, personas, risks, validation questions, evidence-source labels, and confidence score.
- Gate 6: Exa/OpenAI real-call path is attempted when safely configured, and fallback path is clearly labelled when unavailable.
- Gate 7: PRD Generation produces a comprehensive PRD artifact with strong hierarchy and implementation detail.
- Gate 8: PRD Reviewer produces review findings, missing-section flags, and PRD quality score.
- Gate 9: Synthesis produces a comprehensive Synthesis Plan and enters a visible hold state before prototype/build progression.
- Gate 10: Interface Improvement produces UI critique, copy improvements, hierarchy feedback, and prototype readiness checklist.
- Gate 11: Deployment produces GPT Image 2 images or labelled visual prompt fallback cards.
- Gate 12: Prototype Review exposes approve, reject, and regenerate/revise states.
- Gate 13: Launch/build-preparation agents remain locked until approval is recorded.
- Gate 14: Approved path unlocks implementation plan, component map, launch package, and static export.
- Gate 15: Rejected path routes back to prompt revision, PRD revision, synthesis, or prototype regeneration.
- Gate 16: Reload restores current workflow state, artifacts, approval state, logs, scores, selected workspace, and PRD content.
- Gate 17: Final package export contains improved prompt, comprehensive PRD, PRD review, market leads, synthesis plan, prototype direction, implementation plan, risks, and next actions.

### 10.2 Browser Validation Matrix

Browser verification must test more than one happy path. At minimum, verify and record:

- Scenario A: New idea entered manually, workflow reaches Synthesis hold, and Launch remains locked before approval.
- Scenario B: User approves prototype direction, workflow unlocks Launch/build-preparation outputs, and static export is available.
- Scenario C: User rejects prototype direction, workflow returns to revision/regeneration state and does not unlock Launch.
- Scenario D: Reload during or after workflow restores state correctly.
- Scenario E: Strategy shows market leads, competitors, personas, risks, and source labels.
- Scenario F: PRD Generation shows comprehensive PRD content and PRD review findings.
- Scenario G: Synthesis shows comprehensive plan and interface improvement notes.
- Scenario H: Fallback mode clearly labels unavailable external integrations and still completes the local workflow.

### 10.3 Completion Bar

The completion bar is intentionally high. A run is incomplete if any of the following are true:

- The app only shows generic artifact cards without workspace-specific product behavior.
- The workflow skips prompt validation.
- The generated PRD is only a short summary.
- Market validation lacks market leads or validation questions.
- Synthesis immediately proceeds to Launch without a hold state.
- Prototype approval is only decorative and does not gate Launch/build outputs.
- Rejection or revision path is missing.
- Reload loses approval state, PRD content, logs, or artifacts.
- Browser verification only checks that the app loads.

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
- Work that does not help complete the PRD acceptance criteria.

Prefer:

- Product reliability.
- Clear orchestration behavior.
- Strong product storytelling.
- Local-first persistence.
- Modular React and TypeScript code.
- Fast iteration.
