# ConductorIQ Workflow Review and Problems

Date: 2026-05-17  
Reviewer: Codex  
Scope: Current local ConductorIQ application workflow, validation depth, issues, and recommended improvements

## 1. Current Workflow Verdict

ConductorIQ is not just a static application shell. It currently has a working local product workflow with:

- Exactly six primary workspaces: Intake, Strategy, PRD Generation, Synthesis, Deployment, Launch.
- A local LangGraph `StateGraph` path that generates the orchestration package.
- A timer/reveal runtime that progressively exposes workflow outputs.
- LocalStorage persistence for workflow state, artifacts, logs, approvals, selected workspace, and generated package data.
- OpenAI proxy attempts through the Vite dev server when a local key is configured.
- Deterministic fallback when OpenAI or GPT Image generation is unavailable.
- Functional Synthesis approval, revision, and rerun controls.
- Functional prototype approval, rejection, and regeneration controls.
- Launch lock behavior before prototype approval.
- HTML, Markdown, and JSON package export.
- Automated tests for orchestration, storage migration, export content, file import, and approval/rejection UI paths.

However, the workflow is not fully validated in the sense of real-world market validation. It is best described as a validated local product workflow with AI/fallback-generated market hypotheses.

The product validates that the application flow works. It does not yet validate that the startup idea is commercially strong using live external evidence, customer interviews, real competitor data, or durable background research.

## 2. User Workflow Walkthrough

### 2.1 Intake

The user starts in Intake and provides a rough idea manually or imports a `.txt` / `.md` idea brief through the browser File API.

When the workflow starts:

- A local project is created.
- Project state is persisted.
- The Prompt Architect creates a crafted validation prompt.
- The Prompt Validator critiques the prompt.
- The app produces an improved prompt and prompt quality score.
- LangGraph initializes the six-workspace package.
- Execution logs and agent states begin updating.

### 2.2 Strategy

Strategy presents market validation outputs:

- Market signals.
- Market leads.
- Competitor hypotheses.
- Persona reactions.
- Assumption tests.
- Risk register.
- Validation confidence and opportunity scoring.
- Evidence labels showing OpenAI or fallback mode.

Important limitation: Strategy does not perform live web research. The Vite proxy explicitly instructs OpenAI not to claim live web access. Therefore market evidence is reasoned synthesis, not sourced research.

### 2.3 PRD Generation

PRD Generation creates a comprehensive PRD artifact and review layer:

- Executive summary.
- Problem statement.
- Target users.
- Goals and non-goals.
- Workflow and feature requirements.
- UX requirements.
- Technical direction.
- Data model.
- Acceptance criteria.
- Risks and roadmap.
- PRD review findings and quality score.

The PRD is richer than a summary card, but its quality depends heavily on the initial idea and generated Strategy context.

### 2.4 Synthesis

Synthesis is a real workflow gate. It reviews upstream artifacts before allowing the user to continue.

The user can:

- Approve Synthesis.
- Request Revision.
- Rerun Validation.

Synthesis produces:

- Synthesis Plan.
- Pursue / refine / reject recommendation.
- Evidence summary.
- Validation gaps.
- Interface improvements.
- Product risks.
- Branch decision records.

This is one of the stronger parts of the current workflow because downstream progression is blocked until approval.

### 2.5 Deployment

Deployment prepares prototype direction and MVP readiness.

It includes:

- Prototype options.
- GPT Image 2 attempt path through the local proxy.
- Labelled visual-prompt fallback when image generation is unavailable.
- Prototype telemetry: attempt count, status, last attempt time, fallback reason.
- Prototype approval and rejection controls.
- Regeneration after rejection.

Launch remains locked until prototype approval is recorded.

### 2.6 Launch

Launch unlocks after prototype approval.

It includes:

- MVP Foundation Package.
- Implementation plan.
- Component map.
- Risk and next actions.
- Design Validation Report.
- Readiness metrics.
- Export buttons for HTML, Markdown, and JSON.

Launch is an MVP foundation package generator, not a real app builder or deployment pipeline.

## 3. What Is Wrong With The Current Workflow

### P0 Problems

No current issue appears to block the app from running locally based on recent validation.

### P1 Product Problems

#### P1-001: Market validation is still hypothesis-based, not evidence-backed

The app generates market leads, competitors, personas, and risks, but it does not connect to live market research, search results, customer data, or verified competitor sources.

Current impact:

- The product can look more evidence-backed than it actually is.
- Users may over-trust generated recommendations.
- The Strategy workspace is useful for structured thinking but not true validation.

Recommended fix:

- Add a real research evidence layer with cited sources.
- Require each market lead and competitor claim to include source type, citation URL or interview note, recency, and confidence.
- Keep hypothesis-only claims visually separate from sourced evidence.

#### P1-002: The workflow generates the full package upfront, then reveals it over time

`runConductorGraph` creates the complete orchestration package when the workflow starts. The UI then reveals workspaces progressively with `revealPackageStep`.

Current impact:

- The app feels autonomous, but the execution model is closer to staged reveal than true step-by-step agent execution.
- Approval gates control UI progression, but many downstream artifacts already exist in memory before the user approves.
- This weakens the product claim of continuous orchestration.

Recommended fix:

- Move from upfront package generation to incremental graph execution.
- Generate Strategy only after prompt validation.
- Generate PRD only after Strategy completes.
- Generate Deployment only after Synthesis approval.
- Generate Launch only after prototype approval.

#### P1-003: OpenAI outputs are merged into fallback structures, which can mask weak model output

The OpenAI agent helper merges parsed JSON into deterministic fallback defaults. This keeps the app stable, but it may hide incomplete or low-quality AI responses.

Current impact:

- A weak OpenAI response can still appear complete because fallback fields fill the gaps.
- Users cannot easily distinguish model-generated fields from fallback-filled fields.
- Quality scoring may look more reliable than it is.

Recommended fix:

- Track field provenance at the artifact section level.
- Show which fields came from OpenAI, fallback, user input, or local rules.
- Flag incomplete OpenAI responses as partial rather than silently completed.

#### P1-004: Synthesis and prototype approval gates are functional, but not deeply causal

The app records approval, rejection, revision, rerun, and regeneration. However, the downstream content is not always regenerated from changed upstream state in a deeply causal way.

Current impact:

- Revisions create artifacts and branch logs, but they do not always rebuild all dependent artifacts from scratch.
- Approval gates can feel like workflow controls rather than true decision checkpoints.

Recommended fix:

- Add dependency invalidation.
- When Strategy, PRD, or prototype changes, mark downstream artifacts stale.
- Force dependent agents to regenerate or explicitly reuse prior artifacts with justification.

#### P1-005: The product lacks real scoring methodology

Validation confidence, readiness score, PRD quality, and opportunity quality are useful UI signals, but their formulas are not transparent enough.

Current impact:

- Scores can feel arbitrary.
- Users may not understand what to do to improve the score.

Recommended fix:

- Add a scoring rubric panel.
- Break scores into dimensions: pain urgency, buyer clarity, competitive intensity, MVP feasibility, evidence strength, risk severity, and prototype readiness.
- Link each score to concrete evidence and missing validation tasks.

### P2 Product Problems

#### P2-001: Continuous execution is mostly visual, not durable background execution

The product uses local timers, localStorage, and UI ticks. This matches the local-first constraint, but it is not true background execution.

Current impact:

- Work does not continue when the browser is closed.
- Long-running revalidation is simulated.

Recommended fix:

- For local-only mode, add a resumed-work detector that records elapsed time and creates catch-up logs on reload.
- For future production mode, add durable workflow execution behind the same LangGraph state model.

#### P2-002: File import is implemented but not visually strong

The app supports `.txt` / `.md` file import, but the UX could better communicate imported file metadata and parsed assumptions.

Recommended fix:

- Show imported filename, character count, extracted sections, and detected assumptions.
- Let users compare typed idea vs imported brief.

#### P2-003: The generated PRD can become long but still lives inside card UI

The PRD is comprehensive, but long content inside dense cards can be harder to review than a document-style mode.

Recommended fix:

- Add a PRD document viewer mode.
- Add section navigation, copy buttons, completeness status, and section-level review notes.

#### P2-004: Prototype generation lacks visual comparison depth

Deployment shows multiple prototype directions and fallback prompts, but visual review is still limited.

Recommended fix:

- Add a side-by-side prototype comparison table.
- Score each option on clarity, trust, workflow fit, implementation complexity, and founder appeal.
- Let rejection reasons target a specific prototype section.

#### P2-005: The Designer Agent validation is useful but mostly checklist-based

The Designer Agent and automated inspection check important layout conditions, but they do not yet perform true visual regression testing.

Recommended fix:

- Add screenshot capture checks for all six workspaces.
- Store design validation snapshots.
- Compare key layout regions for overflow and clipped content.

### P3 Technical Problems

#### P3-001: Client-side LangGraph still creates a large lazy chunk

The app code-splits the runtime, but the LangGraph orchestration chunk remains large.

Recommended fix:

- Keep the current code split for local mode.
- Consider a smaller custom local state machine for demo mode, or move LangGraph execution to a local Node runtime if future constraints allow.

#### P3-002: The Vite OpenAI proxy is dev-server specific

The local proxy works during Vite development. A static build alone does not provide `/api/conductoriq/*` endpoints unless hosted with an equivalent server/proxy.

Current impact:

- The app can run as a static frontend with fallback.
- Real OpenAI calls depend on the local dev server proxy, not the static build.

Recommended fix:

- Make this explicit in the UI diagnostics.
- Add a local runtime status card: Static fallback mode vs Vite local OpenAI proxy mode.

#### P3-003: Environment variable handling accepts legacy names

The proxy accepts `OPENAI_API_KEY`, `OPENAIKEY`, `VITE_OPENAI_API_KEY`, and `VITE_OPENAIKEY`.

Current impact:

- Backward compatibility is convenient.
- `VITE_` naming can confuse users because Vite conventionally exposes those variables to client code.

Recommended fix:

- Prefer only `OPENAI_API_KEY` and `OPENAIKEY` for the local proxy.
- Warn if a `VITE_` OpenAI key is detected.

## 4. Recommended Improvements

### Improvement 1: Add Real Evidence Mode

Add a dedicated Evidence Mode that separates:

- Hypothesis-only generated analysis.
- OpenAI reasoned synthesis.
- User-provided evidence.
- Live source-backed research.

Each Strategy artifact should show evidence provenance, source recency, and confidence.

### Improvement 2: Make LangGraph Incremental

Refactor the graph so each stage runs only when its prerequisites are satisfied.

Required behavior:

- Intake runs first.
- Strategy runs after prompt validation.
- PRD runs after Strategy.
- Synthesis runs after PRD review.
- Deployment runs only after Synthesis approval.
- Launch runs only after prototype approval.

This would make the product feel more genuinely autonomous and less like a staged package reveal.

### Improvement 3: Add Artifact Dependency Invalidation

When an upstream artifact changes, downstream artifacts should become stale.

Examples:

- Prompt revision should mark Strategy, PRD, Synthesis, Deployment, and Launch stale.
- PRD revision should mark Synthesis, Deployment, and Launch stale.
- Prototype rejection should mark Launch locked and prototype artifacts revision-requested.

### Improvement 4: Add Transparent Scoring Rubrics

Replace opaque scores with explainable scoring.

Recommended dimensions:

- Problem urgency.
- Buyer clarity.
- Competitive pressure.
- Differentiation strength.
- MVP feasibility.
- Evidence quality.
- Prototype readiness.
- Launch readiness.

### Improvement 5: Improve PRD Review Experience

Turn PRD Generation into a more document-native workspace:

- Sticky section outline.
- Section completeness badges.
- Inline review findings.
- Missing requirement warnings.
- Copy/export per section.
- Version comparison after revision.

### Improvement 6: Improve Prototype Review

Deployment should support richer prototype decision-making:

- Side-by-side prototype cards.
- Strengths and weaknesses per option.
- Prototype readiness score.
- Rejection reason mapped to required regeneration changes.
- Visual asset history.

### Improvement 7: Add Workflow Replay and Audit Trail

Add a timeline that shows:

- Every agent action.
- Every artifact created.
- Every branch decision.
- Every approval/rejection.
- Every fallback event.
- Every stale artifact.

This would make the product more credible as an orchestration platform.

### Improvement 8: Improve Local Runtime Diagnostics

Add a diagnostics panel that shows:

- OpenAI proxy available or unavailable.
- GPT Image 2 available or fallback.
- Static build fallback mode.
- localStorage schema version.
- Last successful API call.
- Last fallback reason.

### Improvement 9: Add User Evidence Input

Allow users to upload or paste:

- Customer interview notes.
- Competitor URLs.
- Landing page copy.
- Survey responses.
- Existing PRD drafts.
- Support tickets or sales notes.

Then have agents cite these as user-provided evidence.

### Improvement 10: Add Guided Validation Tasks

After Synthesis, generate a practical validation task list:

- Interview script.
- Landing page smoke test.
- Concierge MVP test.
- Pricing test.
- Competitor teardown checklist.
- Demo script.

This would turn recommendations into actionable next steps.

## 5. Recommended Next Task Queue

| ID | Priority | Task | Acceptance Check |
| --- | --- | --- | --- |
| P-001 | P1 | Refactor workflow from upfront package generation to incremental stage execution. | Deployment artifacts do not exist until Synthesis is approved; Launch artifacts do not exist until prototype is approved. |
| P-002 | P1 | Add evidence provenance model. | Every Strategy claim shows `hypothesis`, `openai`, `user-provided`, or `source-backed`. |
| P-003 | P1 | Add scoring rubric breakdown. | Validation and readiness scores display dimension-level inputs and explanations. |
| P-004 | P1 | Add artifact stale/dependency invalidation. | Revising prompt/PRD/prototype marks dependent artifacts stale and blocks Launch until refreshed. |
| P-005 | P2 | Add PRD document viewer. | PRD has section navigation, review notes, section scores, and readable long-form layout. |
| P-006 | P2 | Add runtime diagnostics panel. | UI shows OpenAI proxy status, GPT Image status, fallback reason, schema version, and last API attempt. |
| P-007 | P2 | Add user evidence import. | User can add interview notes or competitor URLs and Strategy/PRD cite them as user-provided evidence. |
| P-008 | P2 | Add visual workflow replay. | Timeline shows agent actions, branch decisions, approvals, rejections, fallbacks, and exports. |

## 6. Bottom Line

ConductorIQ is currently a functional, validated local workflow application, not just a static UI.

The main weakness is not UI completeness. The main weakness is product truthfulness: the workflow looks like market validation, but the actual market evidence is mostly OpenAI reasoning or deterministic fallback unless future live research/user-evidence inputs are added.

The next major product upgrade should make evidence provenance, incremental orchestration, dependency invalidation, and scoring methodology more rigorous.
