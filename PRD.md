# ConductorIQ Product Requirements Document

Version: 0.1  
Date: 2026-05-17  
Status: MVP specification  
Primary build target: polished local hackathon demo deliverable in 2 hours 30 minutes

## 1. Executive Summary

ConductorIQ is an AI-native market validation workflow platform that helps founders and builders turn rough product ideas into structured, evidence-backed MVP decisions.

Instead of jumping straight from an idea into building, ConductorIQ guides the user through an autonomous validation process where specialized AI agents analyze the market, identify competitors, simulate customer personas, test assumptions, assess risks, and produce a clear recommendation on whether the idea is worth pursuing.

The product focuses on the early uncertainty stage of startup building:

> Is this idea actually worth building, and what should the MVP look like?

The product should feel less like a chatbot and more like a continuously running market validation engine: a live AI operating system where specialized agents research, critique, score, and refine the opportunity with minimal manual coordination.

The core product promise is:

> ConductorIQ autonomously coordinates continuously running AI agents to validate startup ideas and produce evidence-backed MVP recommendations.

The MVP should demonstrate the orchestration experience, persistent workflow behavior, visible agent collaboration, artifact generation, validation loops, and cinematic execution state as a local application. It should use a real local LangGraph workflow to coordinate the validation agents, real OpenAI and Exa API calls for validation where possible, and OpenAI fallback when Exa is unavailable. It must not include authentication, billing, databases, queues, LangGraph Cloud, or production infrastructure. The implementation must be scoped to a 2 hour 30 minute build window.

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
- Demonstrate visible coordination between specialized agents.
- Show persistent workflow execution with continuously active states.
- Maintain project memory and artifact dependencies.
- Generate interconnected artifacts across market research, strategy, PRD, synthesis, deployment-readiness, and launch recommendation.
- Trigger critique and validation loops automatically.
- Communicate the role of LangGraph as the internal orchestration engine.
- Use the configured OpenAI and Exa keys for real validation calls while keeping persistence local.
- Deliver a polished local MVP demonstration within a hard 2 hour 30 minute implementation constraint.

### 5.2 MVP Priorities

- Frontend experience and cinematic product feel.
- Orchestration visualization.
- Frontend-only workflow execution simulation.
- Autonomous system illusion.
- Persistent local state.
- Modular React architecture.
- Strong demo quality.
- Clear artifact progression.
- Continuous active execution states.
- Strict scope control around the six core workspaces.

### 5.3 Two-Hour-Thirty MVP Constraint

The MVP must be completable by one coding agent in 2 hours 30 minutes. This constraint overrides any lower-priority feature detail elsewhere in the PRD.

Required within 2 hours 30 minutes:

- A Vite React TypeScript app that runs locally.
- A cinematic shell with top navigation, left workspace navigation, main content, right context panel, and live log panel.
- Six core workspaces only: Intake, Strategy, PRD Generation, Synthesis, Deployment, and Launch.
- Real API-backed validation workflow using OpenAI and Exa, with deterministic UI state transitions for progress display only.
- Local persistence with localStorage.
- Visible agent roster, status changes, confidence scores, market signals, persona feedback, competitor insights, risk flags, and generated artifacts.
- A final build recommendation: pursue, refine, or reject, with supporting evidence.

Allowed shortcuts:

- Use OpenAI fallback content only when Exa calls fail, time out, or return insufficient data.
- Use CSS-built panels, cards, graphs, and mock diagrams instead of real charting or graph libraries.
- Use a minimal real LangGraph `StateGraph` to route the six-workspace validation workflow locally.
- Represent design assets as references rather than generating new assets.
- Export the final static MVP package as downloadable local files instead of building cloud deployment or database persistence.

Out of scope for the 2 hour 30 minute MVP unless all required items are complete:

- Database-backed persistence.
- LangGraph Cloud, hosted durable workflows, or database-backed LangGraph checkpointing.
- Complex graph editing.
- Multiple projects.
- Cloud deployment flows.
- Detailed responsive tablet/mobile polish.
- Full architecture diagrams or implementation scaffolds.

### 5.4 Two-Hour-Thirty Delivery Sequence

The implementation should follow this timeboxed sequence. If time runs short, preserve the earlier milestones and simplify later visuals rather than expanding scope.

| Timebox | Milestone | Completion Evidence |
| --- | --- | --- |
| 0:00-0:15 | Project scaffold and baseline styling | Vite React TypeScript app starts locally with TailwindCSS loaded |
| 0:15-0:40 | Cinematic shell | Top bar, six-workspace left nav, main panel, right context panel, and log panel render |
| 0:40-1:05 | Local orchestration state and API proxy | Idea intake initializes workflow state, agents, scores, logs, localStorage persistence, and real validation request handlers |
| 1:05-1:40 | Strategy validation workspace | OpenAI + Exa market signals, competitors, personas, risks, validation confidence, and agent activity display |
| 1:40-2:05 | PRD Generation and Synthesis | PRD summary, feature priorities, critique loop, and pursue/refine/reject recommendation display |
| 2:05-2:20 | Deployment and Launch | MVP scope, readiness score, local static MVP package, launch next actions, and final package summary display |
| 2:20-2:30 | Verification and polish | Build succeeds, reload persists state, demo flow works end-to-end |

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
- Hackathon builders who need to move from idea to demo quickly.
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
4. A local LangGraph `StateGraph` decomposes the idea into the six required workspaces.
5. Specialized agents execute idea refinement, market research, competitor analysis, persona validation, risk analysis, PRD generation, synthesis, deployment-readiness, and launch recommendation tasks using OpenAI and Exa where possible.
6. Generated artifacts appear progressively in the active workspace and right-side context panel.
7. Validation agents critique market evidence, persona fit, competitor pressure, MVP scope, and launch risk.
8. The local LangGraph orchestration runtime routes execution based on task completion, dependencies, validation results, critique outcomes, and workflow state.
9. OpenAI and Exa activity appears in logs, cards, artifacts, and recommendation evidence; if Exa fails, OpenAI generates a clearly labelled fallback market-research synthesis.
10. The system revisits weak assumptions and improves the recommendation autonomously.
11. The final output becomes an evidence-backed MVP Foundation Package with a pursue, refine, or reject recommendation.
12. The user can download a local static MVP package containing a simple `index.html`, generated product copy, launch summary, and optional GPT Image 2 visual asset references.

## 8. Required Workspaces and Workflow Stages

ConductorIQ must center the MVP around six core workspaces. Detailed agent activities may be shown inside these workspaces, but the navigation and implementation must not expand beyond these six areas for the 2 hour 30 minute MVP.

| Workspace | Purpose | Required MVP Outputs |
| --- | --- | --- |
| Intake | Capture the rough concept and initialize validation state. | Raw idea, inferred category, validation depth, initial agent queue |
| Strategy | Evaluate market, competitors, personas, assumptions, and risks. | Market confidence, competitor cards, persona reactions, risk register |
| PRD Generation | Convert validated assumptions into a compact product requirement draft. | Problem statement, target user, MVP features, acceptance criteria |
| Synthesis | Combine evidence into a clear build decision. | Pursue/refine/reject recommendation, evidence summary, weakest assumptions |
| Deployment | Simulate MVP readiness and implementation implications. | MVP scope, stack suggestion, effort estimate, readiness score |
| Launch | Present the final MVP foundation package and local static MVP output. | Launch narrative, validation summary, next actions, final confidence score, downloadable static MVP package |

Detailed activities such as idea refinement, market validation, competitor analysis, persona simulation, UX ideation, architecture planning, QA critique, and launch preparation should be represented as agent tasks inside the six workspaces rather than separate navigable pages.

## 9. Agent System Requirements

The platform must include visible specialized agents. Each agent should have a name, role, execution state, current task, progress indicator, outputs, logs, dependencies, and collaboration events. For the 2 hour 30 minute MVP, agents may be static definitions driven by a shared frontend state machine.

### 9.1 Required Agents

| Agent | Responsibility | Primary Artifacts |
| --- | --- | --- |
| Workflow Supervisor Agent | Coordinates stage order, dependency resolution, retries, and approval checkpoints. | Workflow plan, execution state, routing decisions |
| Memory Agent | Maintains project memory, context summaries, artifact lineage, and dependency references. | Memory entries, context blocks, dependency map |
| Refinement Agent | Turns raw ideas into clear problem, user, market, and MVP framing. | Refined brief, assumptions, concept summary |
| Market Research Agent | Simulates market signals and future research API behavior to validate demand. | Market insights, trend notes, confidence score |
| Competitor Analysis Agent | Identifies alternatives and positioning opportunities. | Competitor grid, differentiation notes |
| Persona Validation Agent | Simulates user and stakeholder perspectives. | Personas, objections, validation notes |
| PRD Agent | Generates and revises product requirements. | PRD sections, feature requirements, acceptance criteria |
| UX/UI Agent | Converts product requirements into user flows and UI concepts. | User flows, screen map, interaction requirements |
| Stitch Design Agent | Simulates Stitch MCP visual concepts and design iterations. | UI mockups, design references, visual iteration notes |
| Architecture Agent | Defines MVP technical architecture and implementation constraints. | Stack decisions, architecture diagram notes, schemas |
| MVP Planning Agent | Produces build plan, backlog, and implementation sequencing. | MVP backlog, milestone plan, scaffold notes |
| QA Critic Agent | Reviews outputs for ambiguity, feasibility, risk, and missing requirements. | Critique events, revision requests, risk flags |
| Launch Agent | Packages launch assets and readiness summaries. | Demo script, launch checklist, readiness score |

To stay within 3 hours, the UI may show all agents as compact cards while actively simulating only the highest-impact validation agents: Workflow Supervisor, Market Research, Competitor Analysis, Persona Validation, PRD, QA Critic, Memory, and Launch.

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

ConductorIQ should feel continuously active. For this MVP, workflow progression should be driven by a real local LangGraph `StateGraph`, real OpenAI and Exa calls where possible, and deterministic local state transitions for visual progress, retries, and status updates. LangGraph should route the major workflow stages and agent handoffs; UI timers may animate progress and logs, but they must not replace the graph as the primary workflow coordinator. The current MVP must not require LangGraph Cloud, databases, queues, or production-hosted jobs.

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

To keep the 2 hour 30 minute build feasible, the MVP LangGraph implementation should be intentionally small:

- Use `@langchain/langgraph` with a single local `StateGraph`.
- Model the six top-level nodes as `intake`, `strategy`, `prdGeneration`, `synthesis`, `deployment`, and `launch`.
- Keep graph state serializable so snapshots can be persisted to localStorage.
- Route Exa failure or insufficient evidence to an OpenAI fallback branch.
- Route weak validation confidence to a critique or revision pass before final synthesis.
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

- Market insights.
- Competitor analysis.
- Persona definitions.
- PRD drafts.
- UX flows.
- UI mockups.
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

### 11.3 Artifact States

Artifacts should support visible states:

- Pending.
- Generating.
- Draft.
- Under review.
- Revision requested.
- Approved.
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
| Intake | Start a workflow from a rough idea. | Large text input, initialize button, readiness pre-compute cards, system console |
| Strategy | Show market validation, competitor pressure, personas, and risk signals. | Confidence score, market grid, competitor cards, persona feedback, risk flags |
| PRD Generation | Show requirements being generated from validated evidence. | PRD sections, feature priorities, acceptance criteria, critique notes |
| Synthesis | Show the evidence-backed build decision. | Pursue/refine/reject recommendation, evidence summary, weak assumptions |
| Deployment | Show MVP readiness and implementation implications. | MVP scope, simulated stack insight, effort estimate, readiness score |
| Launch | Show final MVP foundation package. | Final validation score, launch narrative, next actions, artifact summary |

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

## 13. Functional Requirements

### 13.1 Idea Intake

- Users can enter a rough startup or product idea.
- Users can select a local `.txt` or `.md` file to import an idea brief into the Intake text area.
- Imported files are read in the browser with the File API and are not uploaded to a database.
- The system creates or resets a local project.
- The system estimates complexity, scope, validation depth, and MVP time.
- The system initializes workflow graph nodes and agent states.

### 13.2 Workflow Activation

- Users can start an autonomous workflow.
- The workflow begins from intake and advances through required stages.
- The system shows active agent, active node, current stage, and execution logs.
- The workflow can continue without additional user messages.

### 13.3 Agent Execution

- Each required agent appears in the UI.
- Agents generate visible outputs from OpenAI, Exa, or OpenAI fallback.
- Agent state changes are visible.
- Agents pass artifacts to downstream agents.
- Agents can wait on dependencies.

### 13.4 Validation and Critique

- QA Critic Agent reviews outputs from other agents.
- Critique events can trigger revisions.
- Weak or ambiguous outputs are flagged.
- Validation confidence should update as research and critique events complete.

### 13.5 Artifact Generation

- The system displays generated artifacts progressively.
- Artifacts should appear connected to agents and workflow nodes.
- Artifacts should be reusable by downstream stages.
- The final workflow should produce an MVP Foundation Package.
- The Launch workspace should provide a downloadable static MVP package.
- The package should be generated locally as simple static files, not deployed to a hosted environment.
- Minimum static package contents: `index.html`, product positioning copy, MVP feature summary, validation recommendation, launch next actions, and optional GPT Image 2-generated asset reference.

### 13.6 Persistent Local State

- Active project state persists in localStorage or IndexedDB.
- Reloading the app restores idea, workflow state, artifacts, logs, validation scores, PRD content, and agent progress.
- A reset or new workflow action clears the current demo state.
- Downloaded static MVP package files are separate local exports and are not treated as the source of truth after download.

### 13.7 Continuous Activity Simulation

- The MVP should continue updating visible states while validation is active.
- Logs, nodes, agent statuses, and artifact cards should update based on real request lifecycle states and deterministic local workflow ticks.
- Deterministic ticks are allowed for progress visualization only; validation outputs should come from OpenAI, Exa, or OpenAI fallback.
- The workflow must run locally without a database.
- Workflow state, generated artifacts, agent states, execution logs, validation scores, and PRD content must be persisted locally.

### 13.8 Prohibited MVP Infrastructure

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
- High visual polish suitable for a live demo.
- Low setup friction.
- OpenAI and Exa keys may be required for real validation; OpenAI fallback must handle Exa failure.
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
- Local LangGraph orchestration runtime with real OpenAI + Exa validation calls.

### 15.2 API-Backed Product Architecture

The MVP should use real OpenAI and Exa calls while keeping all storage local and avoiding databases.

- OpenAI should power reasoning, synthesis, persona simulation, risk analysis, PRD generation, critique, fallback market research, and final recommendation.
- Exa should power market research, competitor discovery, and external evidence gathering.
- GPT Image 2 (`gpt-image-2`) should power generated visual assets, concept images, or launch/hero imagery when image generation is needed.
- LangGraph should execute the local agent workflow through a compact `StateGraph` and also be represented clearly in the UI as the orchestration backbone.
- Stitch MCP remains an optional design reference and screen-generation tool, not a runtime dependency.
- Codex/Cursor-style implementation agents remain MVP scaffolding concepts represented in the UI.

Implementation should read keys from local environment variables and never commit secrets.

Stitch MCP access must not block the 2 hour 30 minute MVP. If a Stitch MCP connector is available in the environment, Codex may inspect whether a ConductorIQ design/project is accessible and reference it as an external design source. If no Stitch MCP tool is exposed, the UI should continue using local `Assets/` references and simulated Stitch activity in agent logs and design cards.

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

For the hackathon MVP, implementation must use:

- In-memory orchestration plus localStorage persistence.
- A minimal local LangGraph `StateGraph` for workspace routing and agent handoffs.
- Static agent definitions.
- Deterministic frontend state machines for UI animation and progress display.
- Real OpenAI + Exa request lifecycle states.
- OpenAI fallback outputs when Exa fails or times out.
- Staged artifact generation.
- Rotating execution logs.
- GPT Image 2 for generated visual artifacts when required.
- UI-first architecture that can later be connected to real integrations.

The MVP must run without a database. If secrets cannot be safely called from the browser, use a minimal local API proxy for OpenAI and Exa while keeping all persistence in localStorage. The local LangGraph graph must remain lightweight enough to run during the demo without hosted workflow infrastructure.

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
    | "competitor-analysis"
    | "persona"
    | "prd"
    | "ux-flow"
    | "ui-mockup"
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
    | "superseded"
    | "failed";
  producingAgentId: string;
  sourceNodeId: string;
  dependencyArtifactIds: string[];
  version: number;
  confidence: number;
  summary: string;
  content: string;
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

The MVP is acceptable within the 2 hour 30 minute build window when:

- A user can enter a rough idea and initialize a ConductorIQ project.
- The MVP uses a real local LangGraph `StateGraph` to execute at least one end-to-end path across Intake, Strategy, PRD Generation, Synthesis, Deployment, and Launch.
- The UI clearly looks like an autonomous market-validation workspace, not a chatbot.
- The six required workspaces are visible: Intake, Strategy, PRD Generation, Synthesis, Deployment, and Launch.
- At least 8 specialized agents are visible with meaningful states.
- Workflow stages progress visibly over time through local LangGraph routing plus deterministic frontend progress animation.
- The orchestration graph, timeline, or stage system shows dependencies and active routing.
- Artifacts appear progressively and reference upstream context.
- QA or validation loops visibly critique and revise at least one output.
- Project memory is visible and updates during execution.
- Execution logs stream continuously while autonomous mode is active.
- The final state presents an evidence-backed recommendation: pursue, refine, or reject.
- The final state presents an MVP Foundation Package with market evidence, competitor insights, persona feedback, PRD summary, MVP scope, risk notes, and launch next actions.
- The user can import an idea brief from a local `.txt` or `.md` file.
- The user can download a static MVP package generated locally with no database connection.
- Reloading the app preserves meaningful workflow state.
- The product copy explicitly communicates LangGraph as the internal orchestration backbone.
- The app builds successfully with no database and uses OpenAI/Exa keys only through local environment configuration.

## 18. Risks and Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Product feels like a chatbot | Weak differentiation | Keep input limited to intake and focus UI on graph, agents, logs, artifacts, and memory |
| LangGraph role is misunderstood | Architecture confusion | State clearly that LangGraph is product runtime architecture, not Codex's build workflow |
| MVP overengineers backend | Missed demo deadline | Use localStorage for persistence and only a minimal local API proxy if needed to protect OpenAI/Exa secrets |
| Autonomy feels fake | Weak demo credibility | Make state transitions coherent, dependency-driven, and tied to artifacts |
| Real integration scope expands too far | Broken demo or scope creep | Use only a minimal local LangGraph `StateGraph`, OpenAI + Exa for validation, GPT Image 2 for visuals, and keep Stitch/Codex as lightweight UI concepts |
| Visuals feel generic | Reduced impact | Follow screenshot-inspired cinematic dark UI with neon operational details |
| Workflow stalls | Bad live experience | Ensure timer-driven progression and retry fallback paths |

## 19. Future Roadmap

- LangGraph Cloud-backed durable workflow execution.
- Hosted durable workflows.
- More comprehensive OpenAI generation for every agent.
- Deeper Exa market research integration.
- Real Stitch MCP design generation and asset persistence.
- GitHub or local repo scaffolding integration.
- Multi-project dashboard.
- Team collaboration.
- Review and approval workflows.
- Deployable MVP starter generation.
- Evidence-backed validation scoring.
- Rich artifact version history.
- Scheduled revalidation of startup ideas over time.

Future roadmap items must not be implemented in the 2 hour 30 minute MVP unless the required acceptance criteria are already complete and verified.

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
