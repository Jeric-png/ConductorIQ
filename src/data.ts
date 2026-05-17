import type { AgentState, WorkspaceId, WorkflowNode } from "./types";

export const workspaces: Array<{
  id: WorkspaceId;
  label: string;
  eyebrow: string;
  description: string;
}> = [
  {
    id: "intake",
    label: "Intake",
    eyebrow: "00 idea ingestion",
    description: "Capture the raw product concept and initialize the validation graph.",
  },
  {
    id: "strategy",
    label: "Strategy",
    eyebrow: "01 market validation",
    description: "Evaluate market pressure, competitors, personas, assumptions, and risks.",
  },
  {
    id: "prd",
    label: "PRD Generation",
    eyebrow: "02 requirement synthesis",
    description: "Transform validation evidence into a focused MVP requirements draft.",
  },
  {
    id: "synthesis",
    label: "Synthesis",
    eyebrow: "03 build decision",
    description: "Produce a pursue, refine, or reject recommendation with evidence.",
  },
  {
    id: "deployment",
    label: "Deployment",
    eyebrow: "04 execution readiness",
    description: "Assess MVP scope, implementation risk, stack fit, and readiness.",
  },
  {
    id: "launch",
    label: "Launch",
    eyebrow: "05 final package",
    description: "Package validation evidence, next actions, and static MVP export.",
  },
];

export const initialAgents: AgentState[] = [
  ["supervisor", "Workflow Supervisor Agent", "Routes stages, retries, dependencies, and graph transitions."],
  ["memory", "Memory Agent", "Maintains project context, artifact lineage, and decisions."],
  ["refinement", "Refinement Agent", "Clarifies problem, audience, value proposition, and assumptions."],
  ["market-research", "Market Research Agent", "Collects market signals and demand evidence."],
  ["competitor-analysis", "Competitor Analysis Agent", "Maps alternatives, saturation, and positioning gaps."],
  ["persona-validation", "Persona Validation Agent", "Simulates customer and stakeholder reactions."],
  ["prd", "PRD Agent", "Generates product requirements and acceptance criteria."],
  ["ux-ui", "UX/UI Agent", "Converts requirements into flow and interface implications."],
  ["stitch-design", "Stitch Design Agent", "Represents design iteration and UI concept handoffs."],
  ["architecture", "Architecture Agent", "Defines stack direction and implementation risk."],
  ["mvp-planning", "MVP Planning Agent", "Creates MVP backlog, scope cuts, and execution sequence."],
  ["qa-critic", "QA Critic Agent", "Critiques ambiguity, feasibility, and validation gaps."],
  ["launch", "Launch Agent", "Packages launch narrative, readiness, and next actions."],
].map(([role, name, description], index) => ({
  id: String(role),
  role: role as AgentState["role"],
  name: String(name),
  description: String(description),
  status: index === 0 ? "queued" : "idle",
  currentTask: index === 0 ? "Awaiting idea intake" : "Standing by for graph routing",
  progress: 0,
  outputArtifactIds: [],
  dependencyArtifactIds: [],
  lastActivityAt: new Date().toISOString(),
}));

export const initialNodes: WorkflowNode[] = [
  {
    id: "intake",
    label: "Intake",
    status: "queued",
    assignedAgentId: "refinement",
    dependencyNodeIds: [],
    outputArtifactIds: [],
    retryCount: 0,
    maxRetries: 1,
  },
  {
    id: "strategy",
    label: "Strategy",
    status: "waiting",
    assignedAgentId: "market-research",
    dependencyNodeIds: ["intake"],
    outputArtifactIds: [],
    retryCount: 0,
    maxRetries: 2,
  },
  {
    id: "prd",
    label: "PRD Generation",
    status: "waiting",
    assignedAgentId: "prd",
    dependencyNodeIds: ["strategy"],
    outputArtifactIds: [],
    retryCount: 0,
    maxRetries: 1,
  },
  {
    id: "synthesis",
    label: "Synthesis",
    status: "waiting",
    assignedAgentId: "qa-critic",
    dependencyNodeIds: ["prd"],
    outputArtifactIds: [],
    retryCount: 0,
    maxRetries: 1,
  },
  {
    id: "deployment",
    label: "Deployment",
    status: "waiting",
    assignedAgentId: "architecture",
    dependencyNodeIds: ["synthesis"],
    outputArtifactIds: [],
    retryCount: 0,
    maxRetries: 1,
  },
  {
    id: "launch",
    label: "Launch",
    status: "waiting",
    assignedAgentId: "launch",
    dependencyNodeIds: ["deployment"],
    outputArtifactIds: [],
    retryCount: 0,
    maxRetries: 1,
  },
];
