# ConductorIQ Product Requirements Document

Version: 0.1  
Date: 2026-05-17  
Status: MVP specification  
Primary build target: polished local hackathon demo

## 1. Executive Summary

ConductorIQ is an AI-native market validation workflow platform that helps founders and builders turn rough product ideas into structured, evidence-backed MVP decisions.

Instead of jumping straight from an idea into building, ConductorIQ guides the user through an autonomous validation process where specialized AI agents analyze the market, identify competitors, simulate customer personas, test assumptions, assess risks, and produce a clear recommendation on whether the idea is worth pursuing.

The product focuses on the early uncertainty stage of startup building:

> Is this idea actually worth building, and what should the MVP look like?

The product should feel less like a chatbot and more like a continuously running market validation engine: a live AI operating system where specialized agents research, critique, score, and refine the opportunity with minimal manual coordination.

The core product promise is:

> ConductorIQ autonomously coordinates continuously running AI agents to validate startup ideas and produce evidence-backed MVP recommendations.

The MVP should demonstrate the orchestration experience, persistent workflow behavior, visible agent collaboration, artifact generation, validation loops, and cinematic execution state as a frontend-only local application. It must not include backend services, authentication, billing, databases, server APIs, queues, or production infrastructure.

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

- Convert a rough startup idea into a structured MVP foundation package.
- Demonstrate visible coordination between specialized agents.
- Show persistent workflow execution with continuously active states.
- Maintain project memory and artifact dependencies.
- Generate interconnected artifacts across research, planning, design, architecture, QA, and launch.
- Trigger critique and validation loops automatically.
- Communicate the role of LangGraph as the internal orchestration engine.
- Run entirely in the browser without API keys or a backend server.
- Deliver a polished local MVP demonstration within approximately 3-4 hours, with a practical 4-5 hour ceiling if needed.

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

### 5.3 Non-Goals

- Authentication.
- Billing.
- Team administration.
- Enterprise permissions.
- Backend servers or server APIs.
- Databases or production persistence services.
- Queues or background worker infrastructure.
- Production-grade backend infrastructure.
- Microservices.
- Hosted long-running job infrastructure.
- Required API keys or live third-party API calls.
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
2. ConductorIQ initializes a project and stores the raw idea in project memory.
3. The UI represents a LangGraph-style orchestration engine decomposing the idea into graph-based workflow stages.
4. Specialized agents execute tasks across idea refinement, market research, competitor analysis, persona simulation, PRD generation, UX/UI ideation, architecture planning, MVP planning, QA review, and launch preparation.
5. Generated artifacts appear in the workspace as they become available.
6. Validation agents critique outputs generated by other agents.
7. The simulated LangGraph runtime routes execution based on task completion, dependencies, validation results, critique outcomes, and workflow state.
8. The Stitch MCP integration point generates simulated UI concepts and design iterations.
9. Generated or simulated visual assets are stored locally and reused as downstream references.
10. Coding-style agents generate MVP implementation plans or starter structures.
11. QA and validation agents simulate review from users, founders, investors, developers, and technical architects.
12. The system revisits weak outputs and improves them autonomously.
13. The final output becomes a continuously evolving MVP Foundation Package.

## 8. Required Workflow Stages

ConductorIQ must represent the product development workflow as explicit orchestration stages.

| Stage | Purpose | Example Outputs |
| --- | --- | --- |
| Idea Intake | Capture the rough concept and initialize execution state. | Raw idea, inferred product category, initial scope estimate |
| Idea Refinement | Clarify problem, audience, value proposition, and MVP framing. | Refined concept brief, assumptions, open questions |
| Market Validation | Evaluate demand signals and market opportunity. | Market insights, opportunity score, validation confidence |
| Competitor Analysis | Identify direct and adjacent competitors. | Competitor landscape, positioning gaps, differentiation notes |
| Persona Simulation | Simulate target users and stakeholder reactions. | Persona profiles, objections, jobs-to-be-done |
| PRD Generation | Produce structured product requirements. | PRD draft, feature list, acceptance criteria |
| UI/UX Ideation | Translate product intent into interface directions. | UX flows, screen concepts, interaction notes |
| Stitch Design | Generate and iterate visual UI concepts. | Design assets, UI references, mockup metadata |
| Architecture Planning | Define technical system shape and tradeoffs. | Architecture notes, stack rationale, schemas |
| MVP Planning | Convert product and architecture into an execution plan. | MVP backlog, implementation sequence, scope cuts |
| QA Review | Critique product, technical, and UX outputs. | QA findings, risk flags, revision requests |
| Launch Preparation | Package final assets for demo or early launch. | Launch plan, demo script, investor summary, readiness score |

## 9. Agent System Requirements

The platform must include visible specialized agents. Each agent should have a name, role, execution state, current task, progress indicator, outputs, logs, dependencies, and collaboration events.

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

Codex does not need to use LangGraph to build this project. Codex may implement the application using its normal development workflow, tools, and internal process.

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

ConductorIQ should feel continuously active. For this MVP, continuous execution must be simulated entirely on the frontend with timers, deterministic state machines, mock agent outputs, staged artifact generation, rotating logs, and local browser persistence. The UI should describe a future LangGraph-backed engine, but the current MVP must not require LangGraph runtime execution, backend workers, queues, or server-hosted jobs.

Continuous execution should include:

- Periodic workflow ticks.
- Agent queue updates.
- Revalidation of weak outputs.
- Retry attempts for failed nodes.
- Artifact revision events.
- Memory synchronization.
- Readiness score recalculation.
- Console logs and graph animation.

### 10.5 Goal-Inspired Execution Contract

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
- Database schema suggestions.
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

- Top navigation with ConductorIQ brand, Orchestration, Agents, Memory, and Deploy sections.
- Left pipeline navigation with stages such as Intake, Strategy, Research, Analysis, Design, Refine, Execute, Verify, Vault, and Deploy.
- Main workspace for the active stage.
- Right-side context panel for memory, generated assets, critique, or readiness metrics.
- Bottom or embedded terminal stream for live execution logs.

### 12.3 Required Screens or Views

| View | Purpose | Key Elements |
| --- | --- | --- |
| Intake | Start a workflow from a rough idea. | Large text input, initialize button, readiness pre-compute cards, system console |
| Orchestration | Show workflow graph and active LangGraph routing. | Node graph, agent runtime cards, conditional logic panel, timeline |
| Agents | Show specialized agent roster and current work. | Agent cards, state badges, progress, handoffs |
| Memory | Show persistent project context and artifact lineage. | Memory entries, dependency map, context assets |
| Validation | Show market confidence and critique loops. | Confidence score, market grid, live research stream |
| Artifact Vault | Show generated assets and statuses. | Artifact cards, dependencies, version/status labels |
| Deploy or Launch | Show final readiness and MVP package. | Readiness score, launch assets, implementation scaffold preview |

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
- Agents generate visible outputs or simulated summaries.
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

### 13.6 Persistent Local State

- Active project state persists in localStorage or IndexedDB.
- Reloading the app restores idea, workflow state, artifacts, logs, validation scores, PRD content, and agent progress.
- A reset or new workflow action clears the current demo state.

### 13.7 Continuous Activity Simulation

- The MVP should continue updating visible states on a timer while active.
- Logs, nodes, agent statuses, and artifact cards should update even without user interaction.
- The simulation must feel coherent and deterministic, not random noise.
- The simulation must run entirely in the browser.
- Workflow state, generated artifacts, agent states, execution logs, validation scores, and PRD content must be persisted locally.

### 13.8 Prohibited MVP Infrastructure

- Do not implement authentication.
- Do not implement billing.
- Do not implement databases.
- Do not implement server APIs.
- Do not implement backend services.
- Do not implement queues or workers.
- Do not require API keys.
- Do not require LangGraph, OpenAI, Exa, Stitch MCP, Codex, or Cursor integrations to be functional at runtime.

## 14. Non-Functional Requirements

- Fast local startup.
- Responsive UI on desktop and acceptable behavior on tablet-sized screens.
- High visual polish suitable for a live demo.
- Low setup friction.
- No API keys required.
- No backend server required.
- No blocking dependency on production infrastructure.
- Stable state transitions with no confusing dead ends.
- Modular code structure suitable for rapid extension.

## 15. Technical Direction

### 15.1 Required MVP Stack

- React.
- TypeScript.
- Vite.
- TailwindCSS.
- Browser localStorage or IndexedDB.
- Frontend-only simulated orchestration runtime.

### 15.2 Simulated Product Architecture Concepts

The MVP should represent the following systems as product architecture concepts and simulated integration points inside the UI:

- LangGraph as the internal orchestration engine concept.
- OpenAI as the reasoning and generation provider concept.
- Exa as the market research provider concept.
- Stitch MCP as the UI/UX generation and design iteration concept.
- Codex/Cursor-style implementation agents as MVP scaffolding concepts.

Real integrations can be added later, but they must not be required for the current MVP.

### 15.3 MVP Implementation Guidance

For the hackathon MVP, implementation must use:

- In-memory orchestration plus localStorage or IndexedDB persistence.
- Static agent definitions.
- Deterministic frontend state machines.
- Timer-driven state transitions.
- Mock agent outputs.
- Staged artifact generation.
- Rotating execution logs.
- Simulated LangGraph, OpenAI, Exa, Stitch MCP, and coding-agent outputs.
- Mock artifacts with realistic content.
- UI-first architecture that can later be connected to real integrations.

The MVP must run without API keys and without a backend server. It should still model the intended production architecture faithfully enough that LangGraph's future role is clear.

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
    | "schema"
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

The MVP is acceptable when:

- A user can enter a rough idea and initialize a ConductorIQ project.
- The UI clearly looks like an autonomous orchestration workspace, not a chatbot.
- At least 10 specialized agents are visible with meaningful states.
- Workflow stages progress visibly over time.
- The orchestration graph or stage system shows dependencies and active routing.
- Artifacts appear progressively and reference upstream context.
- QA or validation loops visibly critique and revise at least one output.
- Project memory is visible and updates during execution.
- Execution logs stream continuously while autonomous mode is active.
- The final state presents an MVP Foundation Package with research, PRD, design, architecture, MVP plan, QA, and launch assets.
- Reloading the app preserves meaningful workflow state.
- The product copy explicitly communicates LangGraph as the internal orchestration backbone.

## 18. Risks and Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Product feels like a chatbot | Weak differentiation | Keep input limited to intake and focus UI on graph, agents, logs, artifacts, and memory |
| LangGraph role is misunderstood | Architecture confusion | State clearly that LangGraph is product runtime architecture, not Codex's build workflow |
| MVP overengineers backend | Missed demo deadline | Use localStorage or IndexedDB and deterministic frontend simulation only |
| Autonomy feels fake | Weak demo credibility | Make state transitions coherent, dependency-driven, and tied to artifacts |
| Real integrations are mistaken as required | Broken demo or scope creep | Treat LangGraph, OpenAI, Exa, Stitch MCP, and coding agents as simulated UI concepts |
| Visuals feel generic | Reduced impact | Follow screenshot-inspired cinematic dark UI with neon operational details |
| Workflow stalls | Bad live experience | Ensure timer-driven progression and retry fallback paths |

## 19. Future Roadmap

- Real LangGraph-backed workflow execution.
- Hosted durable workflows.
- Real OpenAI generation for every agent.
- Real Exa market research integration.
- Real Stitch MCP design generation and asset persistence.
- GitHub or local repo scaffolding integration.
- Multi-project dashboard.
- Team collaboration.
- Review and approval workflows.
- Deployable MVP starter generation.
- Evidence-backed validation scoring.
- Rich artifact version history.
- Scheduled revalidation of startup ideas over time.

## 20. Source References

- OpenAI Cookbook: [Using Goals in Codex](https://developers.openai.com/cookbook/examples/codex/using_goals_in_codex).
| Local Design Reference | Path |
| --- | --- |
| Intake and orchestration shell | `Assets/Screenshot 2026-05-17 at 9.19.46 AM.png` |
| Launch readiness layout | `Assets/Screenshot 2026-05-17 at 9.20.10 AM.png` |
| Engineering orchestration layout | `Assets/Screenshot 2026-05-17 at 9.20.28 AM.png` |
| Analysis graph layout | `Assets/Screenshot 2026-05-17 at 9.20.35 AM.png` |
| PRD generation layout | `Assets/Screenshot 2026-05-17 at 9.20.42 AM.png` |
| Validation confidence layout | `Assets/Screenshot 2026-05-17 at 9.20.49 AM.png` |
| Idea ingestion layout | `Assets/Screenshot 2026-05-17 at 9.20.55 AM.png` |
