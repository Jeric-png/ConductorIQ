# ConductorIQ Product Requirements Document

Version: 0.1  
Date: 2026-05-17  
Status: Validated product specification  
Primary build target: completed validated local product workflow

## 1. Executive Summary

ConductorIQ is an AI-native market validation workflow platform that helps founders and builders turn rough product ideas into structured, evidence-backed MVP decisions.

Instead of jumping straight from an idea into building, ConductorIQ guides the user through an autonomous validation process where specialized AI agents analyze the market, identify competitors, simulate customer personas, test assumptions, assess risks, and produce a clear recommendation on whether the idea is worth pursuing.

The product focuses on the early uncertainty stage of startup building:

> Is this idea actually worth building, and what should the MVP look like?

The product should feel less like a chatbot and more like a continuously running market validation engine: a live AI operating system where specialized agents research, critique, score, and refine the opportunity with minimal manual coordination.

The core product promise is:

> ConductorIQ autonomously coordinates continuously running AI agents to validate startup ideas and produce evidence-backed MVP recommendations.

The product should showcase the orchestration experience, persistent workflow behavior, visible agent collaboration, artifact generation, validation loops, approval checkpoints, and cinematic execution state as a local application. It should use a real local LangGraph workflow to coordinate the validation agents and OpenAI API calls for reasoning, validation, PRD generation, critique, synthesis, and visual generation where available. If OpenAI is unavailable, the workflow must continue with clearly labelled deterministic local fallback output. It must not include authentication, billing, databases, queues, LangGraph Cloud, or production infrastructure. Completion is measured by validated feature coverage, workflow correctness, approval-gate behavior, persistence, and end-to-end browser verification rather than implementation speed.

## 2. Product Vision

Early-stage product development is risky because teams often move from enthusiasm to implementation before validating market demand, customer pain, competitive pressure, persona fit, and MVP scope. ConductorIQ collapses those validation activities into a single autonomous workflow system.

The user provides a rough idea. ConductorIQ activates a coordinated multi-agent validation workflow that decomposes the opportunity into target user, pain point, market signal, competitor, persona, risk, PRD, synthesis, deployment-readiness, and launch recommendation work. Agents pass artifacts to one another, critique intermediate claims, revisit weak assumptions, and maintain persistent project memory.

The intended product experience is continuous and operational. The platform should appear to keep working even when the user is not directly prompting it. Agent states, graph transitions, logs, memory updates, artifact revisions, validation scores, and critique events should communicate that an autonomous system is actively deciding whether the idea is worth building and what the MVP should include first.

## 3. Product Positioning

ConductorIQ is not a static AI prompt tool. It is an autonomous market validation and MVP decision engine.

### 3.1 User Perception Goals

Users should perceive ConductorIQ as:

- An AI operating system for market validation.
- An autonomous startup validation engine.
- A real-time orchestration engine.
- A cinematic multi-agent validation workspace.
- A continuously running autonomous workflow system.

### 3.2 Product Differentiation

The core innovation is persistent orchestration between specialized validation agents, not one-off AI generation. ConductorIQ should emphasize:

- Persistent workflow state.
- Multi-agent task routing.
- Artifact dependency tracking.
- Validation and critique loops.
- Autonomous retries and refinement.
- Long-running execution states.
- Continuously evolving evidence-backed MVP recommendations.

## 4. Problem Statement

Founders and early product teams often start with vague ideas but lack a structured answer to the most important early question: is this worth building now? They need market signals, competitor context, persona feedback, assumption testing, risk assessment, and MVP scope before committing time to implementation.

The current workflow is fragmented because each validation artifact is usually created in a different tool, with manual coordination between research, strategy, PRD creation, synthesis, and launch planning. Outputs often become disconnected, stale, or inconsistent. A weak market signal may not affect the PRD. A persona objection may not change MVP scope. A competitor risk may not affect the final build recommendation.

ConductorIQ solves this by treating early market validation as a persistent graph of dependent artifacts coordinated by specialized AI agents.

## 5. Goals and Non-Goals

### 5.1 Product Goals

- Convert a rough startup idea into a structured market-validation decision and MVP foundation summary.
- Show visible coordination between specialized agents.
- Show persistent workflow execution with continuously active states.
- Maintain project memory and artifact dependencies.
- Generate interconnected artifacts across market research, strategy, PRD, synthesis, deployment-readiness, and launch recommendation.
- Trigger critique and validation loops automatically.
- Communicate the role of LangGraph as the internal orchestration engine.
- Use the configured OpenAI key for real validation calls while keeping persistence local.
- Deliver a completed, validated local product workflow with approval-gated MVP package generation.

### 5.2 Product Priorities

- Frontend experience and cinematic product feel.
- Orchestration visualization.
- Validated local workflow execution.
- Observable autonomous behavior.
- Persistent local state.
- Modular React architecture.
- Production-grade local product quality.
- Clear artifact progression.
- Continuous active execution states.
- Strict scope control around the six core workspaces.

### 5.3 Completed Feature Standard

ConductorIQ should optimize for completed, validated features rather than a shallow visual shell. An implementation is insufficient unless every deep validation gate is implemented, verified, and documented in `PROGRESS.md`.

Required for the validated local product:

- A Vite React TypeScript app that runs locally.
- A cinematic shell with top navigation, left workspace navigation, main content, right context panel, and live log panel.
- Six core workspaces only: Intake, Strategy, PRD Generation, Synthesis, Deployment, and Launch.
- Real API-backed validation workflow using OpenAI, with deterministic UI state transitions for progress display only.
- Local persistence with localStorage.
- Visible agent roster, status changes, confidence scores, prompt artifacts, market leads, market signals, persona feedback, competitor insights, risk flags, comprehensive PRD artifacts, synthesis plan, prototype approval state, and generated artifacts.
- A final build recommendation: pursue, refine, or reject, with supporting evidence and approval-gated launch package.

Quality rules:

- Use deterministic fallback content only when OpenAI is unavailable, times out, or returns insufficient data, and label fallback evidence clearly.
- Fallbacks must behave as explicit product states, not hidden bypasses.
- Approval gates must be functional and must control downstream workflow progression.
- PRD generation must produce a comprehensive artifact with review findings, not a compact summary.
- Market validation must include leads, questions, evidence labels, and confidence scoring, not generic market copy.
- GPT Image 2 unavailable states must produce labelled visual prompt cards and keep prototype approval pending.
- Static export must include the full validated package, not only launch copy.

Out of scope for the validated local product unless all required items are complete:

- Database-backed persistence.
- LangGraph Cloud, hosted durable workflows, or database-backed LangGraph checkpointing.
- Complex graph editing.
- Multiple projects.
- Cloud deployment flows.
- Detailed responsive tablet/mobile polish.
- Full architecture diagrams or implementation scaffolds.

### 5.4 Feature Delivery Sequence

The implementation should follow this sequence. Do not advance to later phases by skipping validation gates.

| Phase | Milestone | Completion Evidence |
| --- | --- | --- |
| 1 | Project audit and scaffold | Dependency check, PRD gap list, runnable Vite React TypeScript app |
| 2 | Cinematic shell | Top bar, six-workspace left nav, main panel, right context panel, and log panel render |
| 3 | Prompt lifecycle | Crafted prompt, prompt critique, improved prompt, prompt quality score, and LangGraph prompt-validation state |
| 4 | Strategy validation workspace | OpenAI or deterministic fallback market leads, market signals, competitors, personas, risks, validation questions, source labels, and confidence score |
| 5 | PRD Generation | Comprehensive PRD artifact, section completeness, PRD review findings, quality score, and revision requirements |
| 6 | Synthesis | Review-first Synthesis Plan, interface improvements, validation gaps, rerun/revise/continue controls, and hold state |
| 7 | Deployment and prototype review | GPT Image 2 prototype output or labelled visual prompt fallback, approval/rejection controls, and regeneration state |
| 8 | Launch package | Build-preparation agents, implementation plan, component map, local static MVP package, launch next actions, and final package summary |
| 9 | Verification and polish | Build succeeds, reload persists state, approval/rejection paths work, full browser validation matrix passes |

### 5.5 Non-Goals

- Authentication.
- Billing.
- Team administration.
- Enterprise permissions.
- Production backend services.
- Databases or production persistence services.
- Queues or background worker infrastructure.
- Production-grade backend infrastructure.
- Microservices.
- Hosted long-running job infrastructure.
- Database-backed persistence.
- Real deployment automation.
- Full implementation of every generated MVP scaffold.
- Complex account or organization management.

## 6. Target Users

### 6.1 Primary Users

- Solo founders who need to turn vague ideas into validated MVP plans.
- Builders who need to move from idea to a validated MVP foundation without skipping product validation.
- Startup studio operators evaluating multiple early-stage concepts.
- Technical founders who want product, market, UX, and architecture scaffolding before implementation.

### 6.2 Secondary Users

- Product managers exploring new product opportunities.
- Designers needing AI-generated UX direction tied to product strategy.
- Engineers needing a structured MVP foundation before coding.
- Investors or advisors reviewing structured startup validation packages.

## 7. Core User Flow

1. The user enters a rough startup or software idea, for example: "Build an AI-native cybersecurity SOC assistant."
2. Alternatively, the user may select a local `.txt` or `.md` idea brief file to prefill Intake.
3. ConductorIQ initializes a project and stores the raw idea in project memory.
4. A Prompt Architect Agent crafts a stronger execution prompt from the rough idea.
5. A Prompt Validator Agent reviews the crafted prompt for clarity, specificity, missing context, target user, market assumptions, output format, and implementation feasibility.
6. The prompt is improved automatically until it is specific enough to drive market validation, PRD generation, visual prototyping, and MVP planning.
7. A local LangGraph `StateGraph` decomposes the improved prompt into the six required workspaces.
8. Strategy agents execute market lead discovery, competitor analysis, persona validation, assumption testing, risk analysis, and validation scoring using OpenAI where possible.
9. PRD Generation produces a comprehensive startup-quality `PRD.md` artifact, using this ConductorIQ PRD as the structural reference standard for depth, hierarchy, implementation orientation, risks, acceptance criteria, data models, workflow behavior, and UI requirements.
10. PRD Reviewer and QA Critic agents review the generated `PRD.md`, identify gaps, improve weak sections, and produce an explicit PRD quality score before the workflow continues.
11. Synthesis does not immediately rush into build execution. It first reviews all upstream evidence, generated PRD sections, market leads, persona objections, risks, interface requirements, and prototype direction.
12. Synthesis then produces a comprehensive Synthesis Plan that explains whether to pursue, refine, or reject; what must change; what prototype should be generated; what interface improvements are required; and what validation evidence is still weak.
13. The workflow intentionally pauses at the Synthesis checkpoint until the user reviews the Synthesis Plan and decides whether to re-run the workflow, revise the prompt, approve prototype generation, or continue.
14. If the user approves prototype generation, GPT Image 2 generates visual concept images, hero concepts, interface references, and prototype direction cards.
15. Prototype Review presents generated images and interface concepts for explicit user approval. ConductorIQ must wait for approval before moving into build planning.
16. If the user approves the prototype, Launch coordinates a group of build-preparation agents to create a complete MVP build package, including implementation plan, frontend structure, component map, user workflow, data model, styling direction, and launch checklist.
17. If the user does not approve the prototype, ConductorIQ loops back to prompt improvement, PRD revision, or prototype regeneration rather than starting implementation.
18. The final output becomes an approval-backed MVP Foundation Package containing the improved prompt, comprehensive PRD, validation evidence, synthesis plan, approved prototype direction, implementation plan, and launch next actions.

## 8. Required Workspaces and Workflow Stages

ConductorIQ must center the product around six core workspaces. Detailed agent activities may be shown inside these workspaces, but the navigation and implementation must not expand beyond these six areas.

| Workspace | Purpose | Required MVP Outputs |
| --- | --- | --- |
| Intake | Capture the rough concept, craft a stronger prompt, validate the prompt, and initialize validation state. | Raw idea, crafted prompt, prompt critique, improved prompt, inferred category, validation depth, initial agent queue |
| Strategy | Evaluate market leads, competitors, personas, assumptions, and risks. | Market confidence, market lead list, competitor cards, persona reactions, risk register, validation evidence |
| PRD Generation | Generate a comprehensive startup-quality PRD and review it before downstream use. | Full PRD.md draft, feature requirements, acceptance criteria, UX requirements, technical direction, PRD review notes, PRD quality score |
| Synthesis | Review all upstream outputs and produce a comprehensive hold-point synthesis plan before rerunning or continuing. | Pursue/refine/reject recommendation, synthesis plan, weak evidence, interface improvements, validation gaps, rerun recommendations |
| Deployment | Prepare the approved prototype and MVP execution package without starting build prematurely. | Prototype brief, GPT Image 2 generation status, approved prototype state, MVP scope, stack suggestion, effort estimate, readiness score |
| Launch | Coordinate build-preparation agents after user approval and package the final MVP foundation. | Approved prototype summary, implementation plan, component map, launch narrative, validation summary, next actions, downloadable package |

Detailed activities such as idea refinement, market validation, competitor analysis, persona simulation, UX ideation, architecture planning, QA critique, and launch preparation should be represented as agent tasks inside the six workspaces rather than separate navigable pages.

## 9. Agent System Requirements

The platform must include visible specialized agents. Each agent should have a name, role, execution state, current task, progress indicator, outputs, logs, dependencies, and collaboration events. Agents may use deterministic local state where real integrations are unavailable, but the workflow state must remain coherent and verifiable.

### 9.1 Required Agents

| Agent | Responsibility | Primary Artifacts |
| --- | --- | --- |
| Workflow Supervisor Agent | Coordinates stage order, dependency resolution, retries, and approval checkpoints. | Workflow plan, execution state, routing decisions |
| Memory Agent | Maintains project memory, context summaries, artifact lineage, and dependency references. | Memory entries, context blocks, dependency map |
| Prompt Architect Agent | Converts the rough idea into a structured, high-context execution prompt. | Crafted prompt, prompt sections, target output contract |
| Prompt Validator Agent | Reviews and improves the crafted prompt for clarity, constraints, feasibility, and completeness. | Prompt critique, improved prompt, validation score |
| Refinement Agent | Turns raw ideas into clear problem, user, market, and MVP framing. | Refined brief, assumptions, concept summary |
| Market Research Agent | Finds market signals, market leads, demand patterns, and external validation evidence. | Market insights, lead list, trend notes, confidence score |
| Competitor Analysis Agent | Identifies alternatives and positioning opportunities. | Competitor grid, differentiation notes |
| Persona Validation Agent | Simulates user and stakeholder perspectives. | Personas, objections, validation notes |
| PRD Agent | Generates a comprehensive PRD using ConductorIQ's own PRD as the depth and structure benchmark. | Full PRD.md, feature requirements, acceptance criteria |
| PRD Reviewer Agent | Reviews the generated PRD for missing scope, weak requirements, poor implementation detail, and unclear acceptance criteria. | PRD review, revision requests, PRD quality score |
| UX/UI Agent | Converts product requirements into user flows and UI concepts. | User flows, screen map, interaction requirements |
| Interface Improvement Agent | Reviews generated interface direction and proposes improvements to navigation, hierarchy, copy, validation visibility, and approval states. | Interface critique, improvement backlog, UX validation notes |
| GPT Image Agent | Generates visual concepts, hero images, interface references, and prototype imagery using GPT Image 2. | Generated images, visual prompts, prototype image set |
| Prototype Review Agent | Holds generated images and prototype concepts for explicit user approval before build planning starts. | Approval request, prototype review notes, approval state |
| Stitch Design Agent | Simulates Stitch MCP visual concepts and design iterations. | UI mockups, design references, visual iteration notes |
| Architecture Agent | Defines MVP technical architecture and implementation constraints. | Stack decisions, architecture diagram notes, schemas |
| MVP Planning Agent | Produces build plan, backlog, and implementation sequencing. | MVP backlog, milestone plan, scaffold notes |
| QA Critic Agent | Reviews outputs for ambiguity, feasibility, risk, and missing requirements. | Critique events, revision requests, risk flags |
| Build Orchestrator Agent | Activates only after prototype approval and coordinates implementation preparation agents. | Build readiness plan, component map, execution sequence |
| Launch Agent | Packages launch assets, implementation plan, approved prototype direction, and readiness summaries. | Product walkthrough script, launch checklist, readiness score, MVP package |

The UI may show all agents as compact cards while actively executing the highest-impact agents: Workflow Supervisor, Prompt Architect, Prompt Validator, Market Research, Competitor Analysis, Persona Validation, PRD, PRD Reviewer, QA Critic, GPT Image, Prototype Review, Memory, and Launch.

### 9.2 Agent States

Agents must visually transition through states:

- Idle.
- Queued.
- Running.
- Waiting on dependency.
- Validating.
- Critiquing.
- Revising.
- Completed.
- Failed.
- Retrying.
- Paused.

### 9.3 Collaboration Behavior

Agents should appear to collaborate through:

- Artifact handoffs.
- Dependency locks.
- Critique requests.
- Revision loops.
- Memory updates.
- Supervisor routing decisions.
- Console-style inter-agent messages.
- Shared workflow graph transitions.

## 10. LangGraph Orchestration Architecture

LangGraph is part of the ConductorIQ product architecture itself. It is the internal orchestration engine that ConductorIQ uses to coordinate agents, manage workflow state, route tasks, trigger validation loops, and support continuous execution.

Codex does not need to use LangGraph as its own development workflow. However, the ConductorIQ application itself must include a minimal local LangGraph implementation for the MVP. The implementation should use `@langchain/langgraph` and a compact `StateGraph` that coordinates the six required workspaces and agent steps without LangGraph Cloud, external workers, queues, or database-backed checkpointing.

### 10.1 LangGraph Responsibilities

The LangGraph orchestration layer should coordinate:

- Persistent workflow execution.
- Graph-based agent routing.
- Workflow progression.
- Context persistence.
- Artifact memory.
- Execution state.
- Dependency tracking.
- Validation loops.
- Retry logic.
- Approval checkpoints.
- Autonomous looping behaviors.
- Continuous execution cycles.
- Multi-agent communication.
- Conditional execution branching.
- Prompt validation loops.
- PRD review and revision loops.
- Synthesis hold states.
- Prototype approval gates.
- Build-preparation activation only after approval.

### 10.2 Workflow Graph Model

Each project should be represented as a graph of workflow nodes. Nodes represent agent tasks, validation gates, artifact generation steps, approval checkpoints, or retry paths.

Each node should define:

- Node ID.
- Stage.
- Assigned agent.
- Input dependencies.
- Required artifacts.
- Execution status.
- Validation criteria.
- Retry count.
- Output artifacts.
- Next routing conditions.

### 10.3 Routing Rules

The orchestration engine should route work based on:

- Whether dependencies are complete.
- Whether validation passed.
- Whether critique produced required revisions.
- Whether a failure is retryable.
- Whether an approval checkpoint blocks progress.
- Whether an artifact has become stale because upstream context changed.

### 10.4 Continuous Execution

ConductorIQ should feel continuously active. For this MVP, workflow progression should be driven by a real local LangGraph `StateGraph`, real OpenAI calls where possible, and deterministic local state transitions for visual progress, retries, and status updates. LangGraph should route the major workflow stages and agent handoffs; UI timers may animate progress and logs, but they must not replace the graph as the primary workflow coordinator. The current MVP must not require LangGraph Cloud, databases, queues, or production-hosted jobs.

Continuous execution should include:

- Periodic workflow ticks.
- Agent queue updates.
- Revalidation of weak outputs.
- Retry attempts for failed nodes.
- Artifact revision events.
- Memory synchronization.
- Readiness score recalculation.
- Console logs and graph animation.

### 10.5 MVP LangGraph Scope

To keep the local product maintainable, the LangGraph implementation should be focused and explicit:

- Use `@langchain/langgraph` with a single local `StateGraph`.
- Model the six top-level nodes as `intake`, `strategy`, `prdGeneration`, `synthesis`, `deployment`, and `launch`.
- Keep graph state serializable so snapshots can be persisted to localStorage.
- Route OpenAI failure or insufficient evidence to a deterministic local fallback branch.
- Route weak validation confidence to a critique or revision pass before final synthesis.
- Route weak prompt quality back to Prompt Architect before market validation.
- Route weak PRD quality back to PRD Agent before Synthesis.
- Pause after Synthesis until the user approves rerun, revision, prototype generation, or continuation.
- Pause after GPT Image 2 prototype generation until the user approves the prototype direction.
- Keep browser UI state, artifacts, logs, scores, and selected workspace in localStorage.
- Do not use LangGraph Cloud, hosted workers, external queues, or a database checkpointer.
- If time is tight, prioritize one successful end-to-end graph path over sophisticated branching.

### 10.6 Goal-Inspired Execution Contract

The product should borrow the practical operating pattern described by OpenAI's Codex Goals guidance: persistent objectives should have a clear outcome, verification surface, constraints, iteration policy, and blocked stop condition.

For ConductorIQ, each project workflow should behave like a persistent objective:

- Outcome: produce a validated MVP Foundation Package.
- Verification surface: generated artifacts, validation scores, critique events, readiness checks, and completed workflow nodes.
- Constraints: remain within MVP scope, preserve artifact consistency, and avoid unrelated product features.
- Iteration policy: revisit the weakest incomplete or failed artifacts first.
- Blocked stop condition: surface unresolved ambiguity or intentionally unavailable real integrations as product states, not runtime failures.

Reference: [Using Goals in Codex](https://developers.openai.com/cookbook/examples/codex/using_goals_in_codex).

## 11. Artifact and Memory Requirements

### 11.1 Artifact Types

ConductorIQ should generate and display artifacts such as:

- Crafted prompts.
- Prompt critiques.
- Improved prompts.
- Market leads.
- Market insights.
- Competitor analysis.
- Persona definitions.
- Comprehensive PRD drafts.
- PRD review reports.
- Synthesis plans.
- Interface improvement reports.
- UX flows.
- UI mockups.
- GPT Image 2 visual concepts.
- Prototype approval records.
- Stitch design assets.
- Architecture notes.
- Data model assumptions.
- Feature breakdowns.
- MVP implementation plans.
- QA critiques.
- Launch plans.
- Investor summaries.

### 11.2 Artifact Metadata

Each artifact should include:

- ID.
- Title.
- Type.
- Producing agent.
- Source workflow node.
- Status.
- Version.
- Confidence score.
- Dependency list.
- Last updated timestamp.
- Summary.
- Content payload.
- Review status when applicable.
- Approval status when applicable.
- Evidence source label: OpenAI, GPT Image 2, fallback, user input, or deterministic local validation.

### 11.3 Artifact States

Artifacts should support visible states:

- Pending.
- Generating.
- Draft.
- Under review.
- Revision requested.
- Approved.
- Awaiting user approval.
- User rejected.
- Regenerating.
- Superseded.
- Failed.

### 11.4 Project Memory

Project memory should persist:

- Raw idea.
- Refined concept.
- Key assumptions.
- Agent decisions.
- Validation findings.
- Artifact dependencies.
- Open risks.
- Revision history summaries.
- Current orchestration state.

For the MVP, browser localStorage or IndexedDB is the only allowed persistence layer. The implementation should persist enough state that reloading the app preserves the active project, agent progress, artifacts, logs, validation scores, PRD content, and selected workflow stage.

## 12. UX and Interface Requirements

The UI should be cinematic, technical, and operational. It should not resemble a generic chat interface.

### 12.1 Visual Direction

Use the local design references in the `Assets/` folder as the product's visual baseline:

- `Assets/Screenshot 2026-05-17 at 9.19.46 AM.png`
- `Assets/Screenshot 2026-05-17 at 9.20.10 AM.png`
- `Assets/Screenshot 2026-05-17 at 9.20.28 AM.png`
- `Assets/Screenshot 2026-05-17 at 9.20.35 AM.png`
- `Assets/Screenshot 2026-05-17 at 9.20.42 AM.png`
- `Assets/Screenshot 2026-05-17 at 9.20.49 AM.png`
- `Assets/Screenshot 2026-05-17 at 9.20.55 AM.png`

The screenshots and Stitch screens are visual references only. Some references contain extra navigation labels such as Research, Analysis, Design, Refine, Execute, Verify, or Vault. Those labels must not become top-level navigation in the MVP. If used, they may appear only as internal agent activities, log messages, or artifact categories under the six required workspaces.

- Dark black and charcoal surfaces.
- Cyan and purple neon accents.
- Gradient buttons and readiness indicators.
- Glowing active states.
- Thin grid backgrounds.
- Monospace labels for system state.
- Console-style execution logs.
- Card-based generated assets.
- Dense but readable orchestration panels.

### 12.2 Core Layout

The MVP should include:

- Top navigation with ConductorIQ brand, autonomous mode indicator, validation confidence, and final recommendation state.
- Left pipeline navigation with exactly six workspaces: Intake, Strategy, PRD Generation, Synthesis, Deployment, and Launch.
- Main workspace for the active stage.
- Right-side context panel for memory, generated assets, critique, or readiness metrics.
- Bottom or embedded terminal stream for live execution logs.

### 12.3 Required Screens or Views

| View | Purpose | Key Elements |
| --- | --- | --- |
| Intake | Start a workflow from a rough idea and improve the execution prompt before validation. | Large text input, file import, crafted prompt panel, prompt validation score, improved prompt diff, initialize button, system console |
| Strategy | Show market validation, market leads, competitor pressure, personas, and risk signals. | Confidence score, market lead table, source labels, market grid, competitor cards, persona feedback, risk flags |
| PRD Generation | Show a comprehensive `PRD.md` being generated and reviewed from validated evidence. | PRD outline, section completeness, feature priorities, acceptance criteria, UX requirements, PRD review notes, PRD quality score |
| Synthesis | Review first, then hold on a comprehensive synthesis plan before re-running or continuing. | Pursue/refine/reject recommendation, comprehensive synthesis plan, evidence summary, weak assumptions, interface improvements, validation gaps, rerun/continue controls |
| Deployment | Show prototype generation and MVP readiness without starting build before approval. | GPT Image 2 status, generated prototype images, approval checkpoint, MVP scope, stack insight, effort estimate, readiness score |
| Launch | After approval, show build-preparation agents and final MVP foundation package. | Approved prototype summary, implementation plan, component map, final validation score, launch narrative, next actions, artifact summary |

### 12.4 Required UX Signals

The interface should continuously signal autonomy:

- Animated active nodes.
- Progress bars.
- Streaming logs.
- Agent status changes.
- Memory sync events.
- Validation warnings.
- Artifact dependency highlights.
- Retry counters.
- Readiness score changes.
- "Autonomous Mode" indicator.
- Prompt quality score and prompt improvement diff.
- PRD completeness score and PRD reviewer findings.
- Explicit approval checkpoint before prototype-to-build transition.
- Prototype approval state: pending, approved, rejected, regenerating.
- Interface improvement and validation notes surfaced as first-class cards.

### 12.5 Interface Improvement and Validation Requirements

ConductorIQ should not only generate product artifacts; it should also critique and improve the interface direction that would be used for the user's MVP.

The interface improvement layer should provide:

- A UI clarity score that evaluates whether the proposed MVP interface explains its primary user action within five seconds.
- A workflow coherence score that evaluates whether the user's path through the MVP is obvious.
- A trust and evidence score that evaluates whether validation claims are visibly supported by sources, assumptions, or rationale.
- A visual hierarchy critique that identifies crowded sections, weak calls to action, missing empty states, and unclear approval states.
- A copy improvement pass that rewrites vague interface labels into action-oriented product language.
- A prototype readiness checklist that must pass before Launch can coordinate build-preparation agents.
- A clear distinction between generated design suggestions, approved prototype direction, and implementation-ready scope.

## 13. Functional Requirements

### 13.1 Idea Intake

- Users can enter a rough startup or product idea.
- Users can select a local `.txt` or `.md` file to import an idea brief into the Intake text area.
- Imported files are read in the browser with the File API and are not uploaded to a database.
- The system creates or resets a local project.
- The system estimates complexity, scope, validation depth, and MVP time.
- The system initializes workflow graph nodes and agent states.
- The system must craft a structured prompt from the rough idea before starting downstream validation.
- The system must validate and improve the crafted prompt before Strategy, PRD Generation, or image generation begins.
- The improved prompt should include target user, problem hypothesis, market assumptions, validation questions, desired PRD depth, visual prototype requirements, build constraints, and output format.
- The UI should show the original idea, crafted prompt, validation critique, and improved prompt as separate visible artifacts.

### 13.2 Workflow Activation

- Users can start an autonomous workflow.
- The workflow begins from intake and advances through required stages.
- The system shows active agent, active node, current stage, and execution logs.
- The workflow can continue without additional user messages.

### 13.3 Agent Execution

- Each required agent appears in the UI.
- Agents generate visible outputs from OpenAI or deterministic local fallback.
- Agent state changes are visible.
- Agents pass artifacts to downstream agents.
- Agents can wait on dependencies.

### 13.4 Validation and Critique

- QA Critic Agent reviews outputs from other agents.
- Critique events can trigger revisions.
- Weak or ambiguous outputs are flagged.
- Validation confidence should update as research and critique events complete.
- Prompt Validator Agent must critique the crafted prompt before validation starts.
- PRD Reviewer Agent must critique the generated `PRD.md` before Synthesis starts.
- Interface Improvement Agent must critique UI/UX direction before prototype approval.
- Synthesis must review first and generate a comprehensive Synthesis Plan before any build-preparation work begins.
- Synthesis must support a hold state where the user can approve, request revision, or re-run the workflow with improved prompt context.

### 13.5 Comprehensive PRD Generation

- The PRD Agent must generate a comprehensive `PRD.md` artifact rather than a short summary.
- The generated PRD should use this ConductorIQ PRD as a reference for structure, depth, hierarchy, implementation orientation, and acceptance criteria.
- The generated PRD should include executive summary, vision, problem statement, goals, non-goals, users, workflow, feature requirements, UX requirements, technical direction, data models, acceptance criteria, risks, roadmap, and source assumptions.
- The PRD should explain how market evidence, persona objections, and competitor analysis affect product scope.
- The PRD should include implementation constraints and explicitly identify what should not be built.
- The PRD should include measurable acceptance criteria and product-readiness requirements.
- The PRD Reviewer Agent must produce review findings, missing sections, ambiguity flags, and a PRD quality score.
- If the PRD quality score is below the configured threshold, ConductorIQ should revise the PRD before Synthesis.

### 13.6 Artifact Generation

- The system displays generated artifacts progressively.
- Artifacts should appear connected to agents and workflow nodes.
- Artifacts should be reusable by downstream stages.
- The final workflow should produce an MVP Foundation Package.
- The Launch workspace should provide a downloadable static MVP package.
- The package should be generated locally as simple static files, not deployed to a hosted environment.
- Minimum static package contents: improved prompt, comprehensive PRD, PRD review, market validation, synthesis plan, approved prototype direction, implementation plan, product positioning copy, MVP feature summary, validation recommendation, launch next actions, and optional GPT Image 2-generated asset reference.

### 13.7 GPT Image and Prototype Approval

- GPT Image 2 should generate prototype visuals, hero concepts, interface mockup references, or concept assets when the workflow reaches the approved image-generation step.
- The generated image prompt should be derived from the improved prompt, PRD, synthesis plan, and interface improvement notes.
- Generated images should be shown as prototype options with status, rationale, and associated UX direction.
- ConductorIQ must wait for explicit user approval before treating any generated prototype as approved.
- If the user rejects the prototype, the workflow should offer regenerate, revise prompt, revise PRD, or return to Synthesis.
- Build-preparation agents must not activate until a prototype or prototype direction has been approved.
- If GPT Image 2 is unavailable, ConductorIQ may produce detailed visual prompt cards and clearly label the prototype as pending image generation.

### 13.8 Market Leads and Validation

- Strategy must look for market leads and validation signals, not only generic market summaries.
- Market leads may include customer segments, buyer titles, communities, search queries, competitor users, pain indicators, and possible interview targets.
- Each market lead should include rationale, likely pain, validation question, confidence, and evidence source.
- OpenAI should produce market and competitor discovery, lead quality synthesis, persona fit analysis, urgency assessment, and validation gaps.
- If OpenAI fails or is unavailable, deterministic local fallback should produce clearly labelled hypothesis-only market lead outputs.
- Synthesis must distinguish evidence-backed leads from hypothesis-only leads.

### 13.9 Persistent Local State

- Active project state persists in localStorage or IndexedDB.
- Reloading the app restores idea, workflow state, artifacts, logs, validation scores, PRD content, and agent progress.
- A reset or new workflow action clears the current local workflow state.
- Downloaded static MVP package files are separate local exports and are not treated as the source of truth after download.

### 13.10 Continuous Activity Execution

- The product should continue updating visible states while validation is active.
- Logs, nodes, agent statuses, and artifact cards should update based on real request lifecycle states and deterministic local workflow ticks.
- Deterministic ticks are allowed for progress visualization only; validation outputs should come from OpenAI or clearly labelled deterministic fallback.
- The workflow must run locally without a database.
- Workflow state, generated artifacts, agent states, execution logs, validation scores, and PRD content must be persisted locally.

### 13.11 Approval Checkpoints

- The workflow must support explicit approval checkpoints for Synthesis Plan review and prototype approval.
- Approval checkpoint states should include pending review, approved, rejected, revision requested, and regenerated.
- The UI must make it clear when ConductorIQ is waiting for the user and when agents are actively running.
- The system must not start MVP build-preparation agents after prototype generation until the user approves.
- If the user approves, Launch should coordinate build-preparation agents to create the MVP package.
- If the user rejects, the Workflow Supervisor Agent should route back to prompt improvement, PRD revision, image regeneration, or Synthesis depending on the rejection reason.

### 13.12 Prohibited MVP Infrastructure

- Do not implement authentication.
- Do not implement billing.
- Do not implement databases.
- Do not implement production backend services.
- Do not implement queues or workers.
- Do not require LangGraph Cloud, Stitch MCP, Codex, or Cursor integrations to be functional at runtime.
- Do not use database-backed LangGraph checkpointing.

## 14. Non-Functional Requirements

- Fast local startup.
- Responsive UI on desktop and acceptable behavior on tablet-sized screens.
- High visual polish suitable for a product walkthrough.
- Low setup friction.
- An OpenAI key may be required for real validation; deterministic fallback must handle OpenAI unavailability.
- No database required.
- No blocking dependency on production infrastructure.
- Stable state transitions with no confusing dead ends.
- Modular code structure suitable for rapid extension.

## 15. Technical Direction

### 15.1 Required MVP Stack

- React.
- TypeScript.
- Vite.
- TailwindCSS.
- `@langchain/langgraph`.
- `@langchain/core` if required by the LangGraph implementation.
- Browser localStorage or IndexedDB.
- Local LangGraph orchestration runtime with real OpenAI validation calls.

As of 2026-05-17, the local repository has `package.json` and `package-lock.json` with the MVP dependency baseline installed: React, React DOM, Vite, TypeScript, TailwindCSS, `@tailwindcss/vite`, `@langchain/langgraph`, `@langchain/core`, `openai`, `lucide-react`, and `clsx`. Implementation should verify this with `npm ls --depth=0` before coding and reinstall only if the lockfile or installed modules are inconsistent.

### 15.2 API-Backed Product Architecture

The MVP should use real OpenAI calls while keeping all storage local and avoiding databases.

- OpenAI should power reasoning, market research synthesis, competitor discovery hypotheses, persona simulation, risk analysis, PRD generation, critique, fallback market research, and final recommendation.
- GPT Image 2 (`gpt-image-2`) should power generated visual assets, concept images, or launch/hero imagery when image generation is needed.
- LangGraph should execute the local agent workflow through a compact `StateGraph` and also be represented clearly in the UI as the orchestration backbone.
- Stitch MCP remains an optional design reference and screen-generation tool, not a runtime dependency.
- Codex/Cursor-style implementation agents remain MVP scaffolding concepts represented in the UI.

Implementation should read keys from local environment variables and never commit secrets.

Stitch MCP access must not block the validated local product. If a Stitch MCP connector is available in the environment, Codex may inspect whether a ConductorIQ design/project is accessible and reference it as an external design source. If no Stitch MCP tool is exposed, the UI should continue using local `Assets/` references and clearly labelled Stitch reference activity in agent logs and design cards.

Verified Stitch reference as of 2026-05-17:

- Project title: `ConductorIQ Orchestration Workspace`.
- Project resource: `projects/11643138006250717621`.
- Generated MVP screen: `ConductorIQ Strategic Intelligence Hub`.
- Generated screen resource: `projects/11643138006250717621/screens/dd063358fe864ec2a5c2378c321ae44f`.
- Visibility: private.
- Device type: desktop.
- Theme signals: dark mode, Geist headline typography, Inter body typography, JetBrains Mono labels, purple custom accent.
- Usage for MVP: optional visual reference only; do not block implementation on live Stitch screen retrieval.

### 15.3 MVP Implementation Guidance

For the validated local product, implementation must use:

- In-memory orchestration plus localStorage persistence.
- A minimal local LangGraph `StateGraph` for workspace routing and agent handoffs.
- Static agent definitions.
- Deterministic frontend state machines for UI animation and progress display.
- Real OpenAI request lifecycle states.
- Deterministic fallback outputs when OpenAI fails, times out, or is unavailable.
- Staged artifact generation.
- Rotating execution logs.
- GPT Image 2 for generated visual artifacts when required.
- UI-first architecture that can later be connected to real integrations.

The MVP must run without a database. If secrets cannot be safely called from the browser, use a minimal local API proxy for OpenAI while keeping all persistence in localStorage. The local LangGraph graph must remain lightweight enough to run without hosted workflow infrastructure.

Dependency verification is part of the implementation contract. Before building features, confirm that `@langchain/langgraph`, `@langchain/core`, `openai`, React, Vite, TypeScript, and TailwindCSS are installed and available from the current lockfile.

## 16. Suggested TypeScript Data Models

```ts
type WorkflowStatus =
  | "idle"
  | "queued"
  | "running"
  | "waiting"
  | "validating"
  | "critiquing"
  | "revising"
  | "completed"
  | "failed"
  | "retrying"
  | "paused";

type AgentRole =
  | "supervisor"
  | "memory"
  | "refinement"
  | "market-research"
  | "competitor-analysis"
  | "persona-validation"
  | "prd"
  | "ux-ui"
  | "stitch-design"
  | "architecture"
  | "mvp-planning"
  | "qa-critic"
  | "launch";

interface ProjectState {
  id: string;
  name: string;
  rawIdea: string;
  refinedSummary?: string;
  status: WorkflowStatus;
  activeStageId: string;
  readinessScore: number;
  validationConfidence: number;
  createdAt: string;
  updatedAt: string;
}

interface AgentState {
  id: string;
  role: AgentRole;
  name: string;
  description: string;
  status: WorkflowStatus;
  currentTask: string;
  progress: number;
  outputArtifactIds: string[];
  dependencyArtifactIds: string[];
  lastActivityAt: string;
}

interface WorkflowNode {
  id: string;
  stageId: string;
  label: string;
  assignedAgentId: string;
  status: WorkflowStatus;
  dependencyNodeIds: string[];
  outputArtifactIds: string[];
  validationCriteria: string[];
  retryCount: number;
  maxRetries: number;
  nextNodeIds: string[];
}

interface Artifact {
  id: string;
  type:
    | "market-insight"
    | "market-lead"
    | "competitor-analysis"
    | "persona"
    | "crafted-prompt"
    | "prompt-critique"
    | "improved-prompt"
    | "prd"
    | "prd-review"
    | "synthesis-plan"
    | "interface-improvement"
    | "ux-flow"
    | "ui-mockup"
    | "gpt-image"
    | "prototype-approval"
    | "architecture"
    | "data-assumption"
    | "mvp-plan"
    | "qa-critique"
    | "launch-plan";
  title: string;
  status:
    | "pending"
    | "generating"
    | "draft"
    | "under-review"
    | "revision-requested"
    | "approved"
    | "awaiting-user-approval"
    | "user-rejected"
    | "regenerating"
    | "superseded"
    | "failed";
  producingAgentId: string;
  sourceNodeId: string;
  dependencyArtifactIds: string[];
  version: number;
  confidence: number;
  summary: string;
  content: string;
  evidenceSource?: "user-input" | "openai" | "gpt-image-2" | "fallback" | "deterministic-local";
  reviewStatus?: "not-reviewed" | "under-review" | "reviewed" | "revision-required";
  approvalStatus?: "not-required" | "pending" | "approved" | "rejected";
  updatedAt: string;
}

interface ExecutionLog {
  id: string;
  timestamp: string;
  agentId?: string;
  nodeId?: string;
  level: "system" | "agent" | "validation" | "warning" | "error";
  message: string;
}

interface MemoryEntry {
  id: string;
  category: "context" | "decision" | "assumption" | "risk" | "dependency" | "revision";
  title: string;
  content: string;
  sourceArtifactIds: string[];
  createdAt: string;
}
```

## 17. MVP Acceptance Criteria

The product is acceptable when:

- A user can enter a rough idea and initialize a ConductorIQ project.
- The system crafts, validates, and improves a structured prompt before downstream generation.
- The MVP uses a real local LangGraph `StateGraph` to execute at least one end-to-end path across Intake, Strategy, PRD Generation, Synthesis, Deployment, and Launch.
- The UI clearly looks like an autonomous market-validation workspace, not a chatbot.
- The six required workspaces are visible: Intake, Strategy, PRD Generation, Synthesis, Deployment, and Launch.
- At least 8 specialized agents are visible with meaningful states.
- Workflow stages progress visibly over time through local LangGraph routing plus deterministic frontend progress animation.
- The orchestration graph, timeline, or stage system shows dependencies and active routing.
- Artifacts appear progressively and reference upstream context.
- QA or validation loops visibly critique and revise at least one output.
- PRD Generation produces a comprehensive PRD artifact, not only a compact PRD summary.
- PRD Review visibly critiques the generated PRD and surfaces improvement recommendations.
- Strategy surfaces market leads and validation signals in addition to market summaries.
- Synthesis reviews upstream outputs first and produces a comprehensive Synthesis Plan before continuing.
- The workflow supports a visible hold or approval checkpoint before prototype-to-build progression.
- GPT Image 2 prototype generation is represented as generated images or clearly labelled visual prompt cards.
- The product waits for user approval before treating a generated prototype as build-ready.
- Interface improvement and validation notes are visible in the workflow.
- Project memory is visible and updates during execution.
- Execution logs stream continuously while autonomous mode is active.
- The final state presents an evidence-backed recommendation: pursue, refine, or reject.
- The final state presents an MVP Foundation Package with improved prompt, comprehensive PRD, PRD review, market evidence, market leads, competitor insights, persona feedback, synthesis plan, approved prototype direction, MVP scope, risk notes, implementation plan, and launch next actions.
- The user can import an idea brief from a local `.txt` or `.md` file.
- The user can download a static MVP package generated locally with no database connection.
- Reloading the app preserves meaningful workflow state.
- The product copy explicitly communicates LangGraph as the internal orchestration backbone.
- The app builds successfully with no database and uses the OpenAI key only through local environment configuration.

### 17.1 Full Workflow Validation Matrix

The product should be validated against the complete intended workflow, not only a single happy path. Completion requires evidence for the following scenarios:

| Scenario | Required Validation |
| --- | --- |
| Manual idea intake | User enters a rough idea and sees crafted prompt, prompt critique, improved prompt, and initialized graph state |
| File-based intake | User imports a `.txt` or `.md` idea brief and the prompt lifecycle still runs |
| Market validation | Strategy shows market leads, market signals, competitors, personas, risks, validation questions, source labels, and confidence score |
| External fallback | If OpenAI is unavailable, fallback outputs are labelled and the workflow does not stall |
| Comprehensive PRD | PRD Generation produces a detailed PRD artifact with sections comparable in depth and structure to this ConductorIQ PRD |
| PRD review | PRD Reviewer surfaces missing sections, ambiguity flags, implementation gaps, and a PRD quality score |
| Synthesis hold | Synthesis reviews upstream outputs, generates a comprehensive Synthesis Plan, and pauses before prototype/build progression |
| Interface improvement | Interface Improvement Agent produces UI clarity, workflow coherence, visual hierarchy, copy, and trust/evidence critique |
| Prototype generation | Deployment creates GPT Image 2 visual outputs or labelled visual prompt fallback cards |
| Approval path | User approval unlocks Launch and build-preparation agents |
| Rejection path | User rejection routes back to prompt revision, PRD revision, Synthesis, or prototype regeneration without unlocking Launch |
| Launch package | Launch produces implementation plan, component map, approved prototype direction, final package, risks, and next actions |
| Persistence | Reload restores current workspace, approval state, PRD content, artifacts, logs, scores, and memory |
| Export | Static export includes improved prompt, comprehensive PRD, PRD review, market leads, synthesis plan, prototype direction, implementation plan, risks, and next actions |

### 17.2 Incomplete Product Conditions

The product should be considered incomplete if:

- The workflow finishes directly after a compact PRD summary.
- Synthesis does not pause for review or approval.
- Prototype approval does not actually gate Launch/build-preparation outputs.
- The generated PRD lacks strong hierarchy, detailed requirements, acceptance criteria, UX direction, technical constraints, risks, and implementation notes.
- Strategy lacks market leads, validation questions, or source labels.
- Interface improvement appears only as generic copy and does not critique UI clarity, workflow coherence, visual hierarchy, copy, and evidence trust.
- Rejection/regeneration paths are missing.
- Reload loses workflow or approval state.
- Browser validation only proves that the app loads.

## 18. Risks and Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Product feels like a chatbot | Weak differentiation | Keep input limited to intake and focus UI on graph, agents, logs, artifacts, and memory |
| LangGraph role is misunderstood | Architecture confusion | State clearly that LangGraph is product runtime architecture, not Codex's build workflow |
| MVP overengineers backend | Slower product validation and unnecessary complexity | Use localStorage for persistence and only a minimal local API proxy if needed to protect OpenAI secrets |
| Autonomy feels fake | Weak product credibility | Make state transitions coherent, dependency-driven, and tied to artifacts |
| Real integration scope expands too far | Broken workflow or scope creep | Use only a focused local LangGraph `StateGraph`, OpenAI for validation, GPT Image 2 for visuals, and keep Stitch/Codex as lightweight UI concepts |
| Visuals feel generic | Reduced impact | Follow screenshot-inspired cinematic dark UI with neon operational details |
| Workflow stalls | Bad live experience | Ensure timer-driven progression and retry fallback paths |

## 19. Future Roadmap

- LangGraph Cloud-backed durable workflow execution.
- Hosted durable workflows.
- More comprehensive OpenAI generation for every agent.
- Optional external web research provider integration.
- Real Stitch MCP design generation and asset persistence.
- GitHub or local repo scaffolding integration.
- Multi-project dashboard.
- Team collaboration.
- Review and approval workflows.
- Deployable MVP starter generation.
- Evidence-backed validation scoring.
- Rich artifact version history.
- Scheduled revalidation of startup ideas over time.

Future roadmap items must not be implemented unless the required acceptance criteria are already complete and verified.

## 20. Source References

- OpenAI Cookbook: [Using Goals in Codex](https://developers.openai.com/cookbook/examples/codex/using_goals_in_codex).
- OpenAI model reference: [GPT Image 2](https://developers.openai.com/api/docs/models/gpt-image-2).
- Verified Stitch project reference: `ConductorIQ Orchestration Workspace` at `projects/11643138006250717621`.

| Local Design Reference | Path |
| --- | --- |
| Intake and orchestration shell | `Assets/Screenshot 2026-05-17 at 9.19.46 AM.png` |
| Launch readiness layout | `Assets/Screenshot 2026-05-17 at 9.20.10 AM.png` |
| Engineering orchestration layout | `Assets/Screenshot 2026-05-17 at 9.20.28 AM.png` |
| Analysis graph layout | `Assets/Screenshot 2026-05-17 at 9.20.35 AM.png` |
| PRD generation layout | `Assets/Screenshot 2026-05-17 at 9.20.42 AM.png` |
| Validation confidence layout | `Assets/Screenshot 2026-05-17 at 9.20.49 AM.png` |
| Idea ingestion layout | `Assets/Screenshot 2026-05-17 at 9.20.55 AM.png` |
