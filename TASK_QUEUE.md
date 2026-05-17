# ConductorIQ Task Queue

Date: 2026-05-17  
Status: Active local execution queue  
Scope: Follow-up hardening and improvement tasks after the completed PRD implementation pass

## Queue Rules

This is a local planning queue for Codex and project work. It is not a production queue, worker system, database queue, background job service, or hosted infrastructure.

The PRD constraints still apply:

- Keep exactly six primary workspaces: Intake, Strategy, PRD Generation, Synthesis, Deployment, Launch.
- Do not add authentication, billing, databases, production queues, workers, LangGraph Cloud, or Vercel deployment unless explicitly requested later.
- Keep persistence local unless the PRD changes.
- Prefer improving product behavior, verification, and maintainability before adding visual extras.
- Do not expose private API keys in frontend code.

## Queue Status Legend

| Status | Meaning |
| --- | --- |
| Ready | Clear next task with no blocker. |
| Queued | Valid task, but lower priority than Ready items. |
| Blocked | Requires user decision, unavailable tooling, or changed requirements. |
| Accepted Limitation | Known limitation that does not block the current local product. |
| Done | Implemented and verified. |

## Current Missing Work Summary

No open P0 or P1 PRD product gap remains in `PROGRESS.md` or `WHAT_IS_MISSING.md`.

The optional hardening queue has been completed:

- The client-side LangGraph runtime is lazy-loaded and the expected orchestration chunk threshold is configured in Vite.
- React/jsdom workflow tests cover approval, rejection, regeneration, Launch unlock, export visibility, and file import.
- localStorage schema migration tests cover legacy snapshots.
- Branch decision tests cover approval and rejection routes.
- HTML, Markdown, and JSON export variants are implemented and tested.

## Active Queue

| ID | Priority | Status | Task | Why It Matters | Dependencies | Acceptance Check |
| --- | --- | --- | --- | --- | --- | --- |
| None | - | - | No active queue items remain. | Current optional hardening queue has been completed. | - | - |

## Done Queue

| ID | Status | Completed Work | Verification |
| --- | --- | --- | --- |
| D-001 | Done | Six primary workspaces implemented. | Browser verification and `PROGRESS.md`. |
| D-002 | Done | Local LangGraph StateGraph implemented. | `npm test`, browser verification. |
| D-003 | Done | Conditional branch router added for Synthesis/prototype decisions. | `npm test` branch routing tests. |
| D-004 | Done | OpenAI local proxy and deterministic fallback lifecycle implemented. | Build/lint/browser verification. |
| D-005 | Done | Strategy, PRD, Synthesis, Deployment, and Launch artifacts deepened. | Browser verification. |
| D-006 | Done | Prototype option selection, rejection, regeneration, and approval gate implemented. | Browser workflow verification. |
| D-007 | Done | Designer Agent report and Automated Design Inspection panel implemented. | Browser design check. |
| D-008 | Done | Vitest added and `npm test` fixed. | `npm test` passed. |
| D-009 | Done | `PROGRESS.md` and `WHAT_IS_MISSING.md` updated. | No unchecked missing items found by audit. |
| D-010 | Done | Q-001 code-split heavy runtime modules. Main bundle now loads separately from lazy orchestration runtime chunk. | `npm run build`, `npm run lint`, `npm test`, and browser smoke check passed. |
| D-011 | Done | Q-002 automated workflow coverage for approval/rejection paths. | `npm test` now includes React workflow test covering Synthesis approval, prototype selection, rejection route, regeneration, approval, Launch unlock, and export visibility. |
| D-012 | Done | Q-004 localStorage schema migration. | `npm test` validates old partial runtime snapshots receive current schema defaults; build and lint passed. |
| D-013 | Done | Q-003 file import automation. | `npm test` uploads a `.md` idea brief through the File API, verifies intake text, and starts the workflow. |
| D-014 | Done | Q-005 UI handler tests for branch decisions. | `npm test` verifies prototype rejection updates selected workspace/branch history and prototype approval persists Launch branch state. |
| D-015 | Done | Q-006 Markdown and JSON export variants. | Launch/Readiness expose HTML, Markdown, and JSON exports; `npm test` validates Markdown and JSON content. |
| D-016 | Done | Q-007 richer design validation checks. | Build/lint/test passed; browser verified Region overlap, Long content containment, and Contrast sample rows render with no console issues. |
| D-017 | Done | Q-008 GPT Image/prototype telemetry. Deployment prototype cards now show attempt count, telemetry status, last attempt time, generated/fallback notes, and exports include telemetry metadata. | `npm run build`, `npm run lint`, `npm test`, and browser verification passed; legacy localStorage fallback assets are migrated to show a GPT Image fallback reason. |
| D-018 | Done | Final build-warning cleanup. The expected lazy client-side LangGraph runtime chunk is explicitly configured in Vite. | `npm run build` passes without the previous large-chunk warning; `npm run lint` and `npm test` pass. |

## Next Recommended Execution Order

1. No active queue items remain. Optional next work should start from a new PRD-backed queue item or a user-requested enhancement.

## Queue Discipline For Future Codex Runs

Before starting a queued task:

1. Read `PRD.md`, `AGENTS.md`, `PROGRESS.md`, `WHAT_IS_MISSING.md`, and this file.
2. Pick the highest-priority `Ready` task unless the user names a specific task.
3. Move the task status to in-progress in `PROGRESS.md`.
4. Implement the smallest complete slice.
5. Run relevant verification.
6. Update this queue and `PROGRESS.md`.

Do not mark a task Done unless its acceptance check passes or a defensible PRD-compliant fallback is documented.
