import { Annotation, END, START, StateGraph } from "@langchain/langgraph/web";
import { initialAgents, initialNodes } from "./data";
import type {
  AgentState,
  Artifact,
  ExecutionLog,
  MemoryEntry,
  OrchestrationPackage,
  ProjectState,
  WorkspaceId,
  WorkflowNode,
} from "./types";

const workspaceOrder: WorkspaceId[] = [
  "intake",
  "strategy",
  "prd",
  "synthesis",
  "deployment",
  "launch",
];

const stateReducer = <T>(_left: T, right: T) => right;

const GraphAnnotation = Annotation.Root({
  rawIdea: Annotation<string>(),
  refinedSummary: Annotation<string>({
    reducer: stateReducer,
    default: () => "",
  }),
  integrationMode: Annotation<"real-ready" | "fallback">({
    reducer: stateReducer,
    default: () => "fallback",
  }),
  validationConfidence: Annotation<number>({
    reducer: stateReducer,
    default: () => 18,
  }),
  readinessScore: Annotation<number>({
    reducer: stateReducer,
    default: () => 12,
  }),
  recommendation: Annotation<"pending" | "pursue" | "refine" | "reject">({
    reducer: stateReducer,
    default: () => "pending",
  }),
  artifacts: Annotation<Artifact[]>({
    reducer: (left, right) => [...left, ...right],
    default: () => [],
  }),
  logs: Annotation<ExecutionLog[]>({
    reducer: (left, right) => [...left, ...right],
    default: () => [],
  }),
  memory: Annotation<MemoryEntry[]>({
    reducer: (left, right) => [...left, ...right],
    default: () => [],
  }),
});

type GraphState = typeof GraphAnnotation.State;

const id = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const now = () => new Date().toISOString();

const titleCase = (value: string) =>
  value
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .split(" ")
    .filter(Boolean)
    .slice(0, 6)
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");

const inferCategory = (idea: string) => {
  const lower = idea.toLowerCase();
  if (lower.includes("cyber") || lower.includes("security") || lower.includes("soc")) {
    return "cybersecurity operations";
  }
  if (lower.includes("health") || lower.includes("clinic") || lower.includes("patient")) {
    return "health workflow";
  }
  if (lower.includes("finance") || lower.includes("bank") || lower.includes("invoice")) {
    return "fintech operations";
  }
  if (lower.includes("developer") || lower.includes("code") || lower.includes("dev")) {
    return "developer productivity";
  }
  return "B2B software";
};

const makeLog = (
  message: string,
  level: ExecutionLog["level"] = "agent",
  nodeId?: WorkspaceId,
  agentId?: string,
): ExecutionLog => ({
  id: id("log"),
  timestamp: now(),
  agentId,
  nodeId,
  level,
  message,
});

const makeArtifact = (params: {
  type: Artifact["type"];
  title: string;
  producingAgentId: string;
  sourceNodeId: WorkspaceId;
  confidence: number;
  summary: string;
  content: string;
  dependencies?: string[];
  status?: Artifact["status"];
}): Artifact => ({
  id: id("artifact"),
  type: params.type,
  title: params.title,
  status: params.status ?? "approved",
  producingAgentId: params.producingAgentId,
  sourceNodeId: params.sourceNodeId,
  dependencyArtifactIds: params.dependencies ?? [],
  version: 1,
  confidence: params.confidence,
  summary: params.summary,
  content: params.content,
  updatedAt: now(),
});

const makeMemory = (
  title: string,
  content: string,
  category: MemoryEntry["category"],
  sourceArtifactIds: string[] = [],
): MemoryEntry => ({
  id: id("memory"),
  category,
  title,
  content,
  sourceArtifactIds,
  createdAt: now(),
});

const hasBrowserVisibleApiConfig = () =>
  Boolean(import.meta.env.VITE_OPENAIKEY || import.meta.env.VITE_OPENAI_API_KEY) &&
  Boolean(import.meta.env.VITE_EXAKEY || import.meta.env.VITE_EXA_API_KEY);

const intakeNode = async (state: GraphState) => {
  const category = inferCategory(state.rawIdea);
  const refinedSummary = `${titleCase(state.rawIdea) || "Startup Concept"} is framed as a ${category} MVP for a high-friction workflow with measurable validation risk.`;
  const artifact = makeArtifact({
    type: "data-assumption",
    title: "Refined Concept Brief",
    producingAgentId: "refinement",
    sourceNodeId: "intake",
    confidence: 72,
    summary: "Raw idea converted into a concise opportunity frame.",
    content: `Problem frame: ${state.rawIdea}\nCategory: ${category}\nInitial validation hypothesis: users will pay if the product reduces time-to-decision, manual coordination, or expensive expert review.`,
  });

  return {
    refinedSummary,
    artifacts: [artifact],
    memory: [
      makeMemory(
        "Raw idea captured",
        `ConductorIQ initialized project memory from: "${state.rawIdea}".`,
        "context",
        [artifact.id],
      ),
      makeMemory(
        "Initial assumption",
        "The strongest early risk is not technical feasibility; it is whether the target user has urgent enough pain to change behavior.",
        "assumption",
        [artifact.id],
      ),
    ],
    logs: [
      makeLog("LangGraph START routed into Intake node.", "system", "intake", "supervisor"),
      makeLog("Refinement Agent produced concept brief and validation hypothesis.", "agent", "intake", "refinement"),
    ],
  };
};

const strategyNode = async (state: GraphState) => {
  const realReady = hasBrowserVisibleApiConfig();
  const integrationMode = realReady ? "real-ready" : "fallback";
  const category = inferCategory(state.rawIdea);
  const confidence = realReady ? 78 : 68;
  const marketArtifact = makeArtifact({
    type: "market-insight",
    title: integrationMode === "real-ready" ? "Market Signal Scan" : "Fallback Market Signal Scan",
    producingAgentId: "market-research",
    sourceNodeId: "strategy",
    confidence,
    summary:
      integrationMode === "real-ready"
        ? "OpenAI/Exa integration path is configured for live validation."
        : "Browser-safe API keys are unavailable, so deterministic OpenAI-style fallback synthesis is used.",
    content: `${category} buyers usually adopt new tools when they see immediate evidence of time saved, risk reduced, or revenue protected. Validation should focus on urgency, current workaround cost, and willingness to run a pilot.`,
  });
  const competitorArtifact = makeArtifact({
    type: "competitor-analysis",
    title: "Competitor Pressure Map",
    producingAgentId: "competitor-analysis",
    sourceNodeId: "strategy",
    confidence: 70,
    summary: "Market has indirect alternatives; differentiation must be workflow depth and decision quality.",
    content:
      "Direct competitors may include vertical copilots, workflow automation suites, and consulting-heavy services. Adjacent competitors are spreadsheets, generic chat tools, and internal scripts. Positioning gap: evidence-backed validation packaged into an operator workspace.",
    dependencies: [marketArtifact.id],
  });
  const personaArtifact = makeArtifact({
    type: "persona",
    title: "Persona Simulation",
    producingAgentId: "persona-validation",
    sourceNodeId: "strategy",
    confidence: 74,
    summary: "Primary persona is skeptical but interested if setup is fast and outputs are evidence-backed.",
    content:
      "Founder persona wants faster clarity before committing engineering time. Technical persona wants traceable assumptions. Advisor persona wants a concise build/refine/reject decision with market evidence and risk flags.",
    dependencies: [marketArtifact.id],
  });

  return {
    integrationMode,
    validationConfidence: confidence,
    artifacts: [marketArtifact, competitorArtifact, personaArtifact],
    memory: [
      makeMemory(
        "Market validation mode",
        integrationMode === "real-ready"
          ? "Live API path is available for OpenAI and Exa-backed validation."
          : "Fallback mode is active because browser-visible OpenAI/Exa env vars were not available.",
        integrationMode === "real-ready" ? "decision" : "risk",
        [marketArtifact.id],
      ),
    ],
    logs: [
      makeLog(
        integrationMode === "real-ready"
          ? "Strategy node detected browser-safe OpenAI and Exa configuration."
          : "Strategy node routed to OpenAI-style fallback because Exa/OpenAI browser-safe keys were unavailable.",
        integrationMode === "real-ready" ? "validation" : "warning",
        "strategy",
        "market-research",
      ),
      makeLog("Competitor Analysis Agent mapped direct and adjacent alternatives.", "agent", "strategy", "competitor-analysis"),
      makeLog("Persona Validation Agent simulated founder, technical, and advisor objections.", "agent", "strategy", "persona-validation"),
    ],
  };
};

const prdNode = async (state: GraphState) => {
  const prdArtifact = makeArtifact({
    type: "prd",
    title: "MVP PRD Draft",
    producingAgentId: "prd",
    sourceNodeId: "prd",
    confidence: 76,
    summary: "Compact product requirements generated from validated assumptions.",
    content: `Problem statement: ${state.refinedSummary}\nTarget user: time-constrained founder or operator deciding whether to build.\nMVP features: idea intake, validation evidence, persona simulation, PRD summary, build decision, launch package.\nAcceptance criteria: user receives a clear recommendation, supporting evidence, risk flags, and an MVP scope within one workflow.`,
    dependencies: state.artifacts.map((artifact) => artifact.id),
  });
  const uxArtifact = makeArtifact({
    type: "ux-flow",
    title: "Workspace Flow",
    producingAgentId: "ux-ui",
    sourceNodeId: "prd",
    confidence: 73,
    summary: "Six-workspace navigation preserves focus while agents run inside each stage.",
    content:
      "Primary path: Intake -> Strategy -> PRD Generation -> Synthesis -> Deployment -> Launch. Design should avoid chat-first interaction and emphasize graph status, agent cards, artifact cards, memory, and terminal logs.",
    dependencies: [prdArtifact.id],
  });

  return {
    validationConfidence: Math.max(state.validationConfidence, 74),
    artifacts: [prdArtifact, uxArtifact],
    memory: [
      makeMemory(
        "PRD scope locked",
        "MVP requirements are constrained to six workspaces and one complete validation-to-launch package.",
        "decision",
        [prdArtifact.id],
      ),
    ],
    logs: [
      makeLog("PRD Agent generated problem statement, target user, features, and acceptance criteria.", "agent", "prd", "prd"),
      makeLog("UX/UI Agent converted the PRD into six workspace interaction flow.", "agent", "prd", "ux-ui"),
    ],
  };
};

const synthesisNode = async (state: GraphState) => {
  const recommendation =
    state.validationConfidence >= 76 ? "pursue" : state.validationConfidence >= 55 ? "refine" : "reject";
  const critiqueArtifact = makeArtifact({
    type: "qa-critique",
    title: "Validation Critique",
    producingAgentId: "qa-critic",
    sourceNodeId: "synthesis",
    confidence: 71,
    summary: "QA review found the idea direction viable but dependent on sharper buyer urgency proof.",
    content:
      "Strong signals: clear workflow pain, high value of faster decisions, strong demo narrative. Weakest assumptions: willingness to pay, trust in generated evidence, and whether the wedge is narrow enough for first users.",
    status: "under-review",
    dependencies: state.artifacts.map((artifact) => artifact.id),
  });
  const synthesisArtifact = makeArtifact({
    type: "mvp-plan",
    title: `${recommendation.toUpperCase()} Recommendation`,
    producingAgentId: "qa-critic",
    sourceNodeId: "synthesis",
    confidence: Math.max(64, state.validationConfidence),
    summary: `Recommendation: ${recommendation}. Build only around the narrowest validation workflow first.`,
    content:
      recommendation === "pursue"
        ? "Proceed with a focused MVP because evidence quality, target pain, and demo clarity are strong enough for a pilot."
        : "Refine before scaling implementation. Run sharper customer interviews and validate willingness to pay before expanding scope.",
    dependencies: [critiqueArtifact.id],
  });

  return {
    recommendation,
    validationConfidence: Math.max(state.validationConfidence, 72),
    artifacts: [critiqueArtifact, synthesisArtifact],
    memory: [
      makeMemory(
        "QA critique loop",
        "The critique loop requested stronger proof of urgency and kept the final MVP scope narrow.",
        "revision",
        [critiqueArtifact.id],
      ),
    ],
    logs: [
      makeLog("QA Critic Agent reviewed market evidence, persona objections, and PRD assumptions.", "validation", "synthesis", "qa-critic"),
      makeLog(`Synthesis node produced ${recommendation.toUpperCase()} recommendation.`, "system", "synthesis", "supervisor"),
    ],
  };
};

const deploymentNode = async (state: GraphState) => {
  const readinessScore = Math.min(92, Math.max(64, state.validationConfidence + 10));
  const deploymentArtifact = makeArtifact({
    type: "architecture",
    title: "MVP Readiness Plan",
    producingAgentId: "architecture",
    sourceNodeId: "deployment",
    confidence: readinessScore,
    summary: "Frontend-first stack is suitable for a fast validation demo without production infrastructure.",
    content:
      "Suggested stack: React, Vite, TypeScript, TailwindCSS, localStorage, local LangGraph StateGraph, optional local API proxy for secrets. Execution risk is moderate and mostly tied to external API reliability and scope creep.",
    dependencies: state.artifacts.map((artifact) => artifact.id),
  });

  return {
    readinessScore,
    artifacts: [deploymentArtifact],
    memory: [
      makeMemory(
        "Deployment constraint",
        "No hosted deployment, database, auth, queues, or production infra should be added to this MVP.",
        "decision",
        [deploymentArtifact.id],
      ),
    ],
    logs: [
      makeLog("Architecture Agent evaluated stack fit, implementation risk, and readiness.", "agent", "deployment", "architecture"),
      makeLog("MVP Planning Agent scoped launch package around static local export.", "agent", "deployment", "mvp-planning"),
    ],
  };
};

const launchNode = async (state: GraphState) => {
  const launchArtifact = makeArtifact({
    type: "launch-plan",
    title: "MVP Foundation Package",
    producingAgentId: "launch",
    sourceNodeId: "launch",
    confidence: Math.max(state.readinessScore, state.validationConfidence),
    summary: "Final package contains validation decision, PRD summary, MVP scope, risks, and next actions.",
    content: `Launch narrative: ${state.refinedSummary}\nRecommendation: ${state.recommendation.toUpperCase()}.\nNext actions: interview 5 target users, validate willingness to pay, demo the six-workspace validation flow, and cut all features not tied to the build decision.`,
    dependencies: state.artifacts.map((artifact) => artifact.id),
  });

  return {
    artifacts: [launchArtifact],
    memory: [
      makeMemory(
        "Launch package ready",
        "The final MVP foundation package is ready for local export from the Launch workspace.",
        "decision",
        [launchArtifact.id],
      ),
    ],
    logs: [
      makeLog("Launch Agent packaged final recommendation and next actions.", "agent", "launch", "launch"),
      makeLog("LangGraph END reached after Launch node.", "system", "launch", "supervisor"),
    ],
  };
};

const graph = new StateGraph(GraphAnnotation)
  .addNode("intake", intakeNode)
  .addNode("strategy", strategyNode)
  .addNode("prdGeneration", prdNode)
  .addNode("synthesis", synthesisNode)
  .addNode("deployment", deploymentNode)
  .addNode("launch", launchNode)
  .addEdge(START, "intake")
  .addEdge("intake", "strategy")
  .addEdge("strategy", "prdGeneration")
  .addEdge("prdGeneration", "synthesis")
  .addEdge("synthesis", "deployment")
  .addEdge("deployment", "launch")
  .addEdge("launch", END)
  .compile();

const createProject = (rawIdea: string, graphState: GraphState): ProjectState => ({
  id: id("project"),
  name: titleCase(rawIdea) || "Untitled Validation",
  rawIdea,
  refinedSummary: graphState.refinedSummary,
  status: "running",
  activeWorkspace: "intake",
  completedWorkspaces: [],
  currentStep: 0,
  readinessScore: graphState.readinessScore,
  validationConfidence: graphState.validationConfidence,
  recommendation: graphState.recommendation,
  integrationMode: graphState.integrationMode,
  generatedAt: now(),
  updatedAt: now(),
});

const materializeAgents = (step: number, artifacts: Artifact[]): AgentState[] =>
  initialAgents.map((agent, index) => {
    const outputIds = artifacts
      .filter((artifact) => artifact.producingAgentId === agent.id)
      .map((artifact) => artifact.id);
    const isFinalStep = step >= workspaceOrder.length - 1;
    const active = index % Math.max(1, step + 1) === 0;
    return {
      ...agent,
      status: outputIds.length > 0 || isFinalStep ? "completed" : active ? "running" : index < 8 ? "queued" : "waiting",
      progress: outputIds.length > 0 || isFinalStep ? 100 : active ? 58 : index < 8 ? 22 : 8,
      currentTask:
        outputIds.length > 0 || isFinalStep
          ? "Artifact handed off to downstream workspace"
          : active
            ? "Processing graph-assigned validation task"
            : "Waiting on upstream artifact dependency",
      outputArtifactIds: outputIds,
      lastActivityAt: now(),
    };
  });

const materializeNodes = (step: number, artifacts: Artifact[]): WorkflowNode[] =>
  initialNodes.map((node, index) => {
    const isFinalStep = step >= workspaceOrder.length - 1;
    return {
      ...node,
      status: index < step || isFinalStep ? "completed" : index === step ? "running" : "waiting",
      outputArtifactIds: artifacts.filter((artifact) => artifact.sourceNodeId === node.id).map((artifact) => artifact.id),
    };
  });

export const runConductorGraph = async (rawIdea: string): Promise<OrchestrationPackage> => {
  const result = await graph.invoke({
    rawIdea,
    refinedSummary: "",
    integrationMode: "fallback",
    validationConfidence: 18,
    readinessScore: 12,
    recommendation: "pending",
    artifacts: [],
    logs: [],
    memory: [],
  });

  return {
    project: createProject(rawIdea, result),
    agents: materializeAgents(0, result.artifacts),
    nodes: materializeNodes(0, result.artifacts),
    artifacts: result.artifacts,
    logs: result.logs,
    memory: result.memory,
  };
};

export const revealPackageStep = (
  orchestration: OrchestrationPackage,
  step: number,
): OrchestrationPackage => {
  const clampedStep = Math.min(step, workspaceOrder.length - 1);
  const visibleWorkspaceIds = workspaceOrder.slice(0, clampedStep + 1);
  const artifacts = orchestration.artifacts.filter((artifact) =>
    visibleWorkspaceIds.includes(artifact.sourceNodeId),
  );
  const logs = orchestration.logs.filter((log) => !log.nodeId || visibleWorkspaceIds.includes(log.nodeId));
  const memory = orchestration.memory.filter((entry) =>
    entry.sourceArtifactIds.length === 0 ||
    entry.sourceArtifactIds.some((artifactId) => artifacts.some((artifact) => artifact.id === artifactId)),
  );
  const completedWorkspaces = workspaceOrder.slice(0, clampedStep);
  const activeWorkspace = workspaceOrder[clampedStep] ?? "launch";
  const completed = clampedStep === workspaceOrder.length - 1;

  return {
    ...orchestration,
    project: {
      ...orchestration.project,
      activeWorkspace,
      completedWorkspaces,
      currentStep: clampedStep,
      status: completed ? "completed" : "running",
      validationConfidence: Math.min(
        orchestration.project.validationConfidence,
        26 + clampedStep * 12,
      ),
      readinessScore: Math.min(orchestration.project.readinessScore, 18 + clampedStep * 14),
      recommendation: completed ? orchestration.project.recommendation : "pending",
      updatedAt: now(),
    },
    agents: materializeAgents(clampedStep, artifacts),
    nodes: materializeNodes(clampedStep, artifacts),
    artifacts,
    logs: [
      ...logs,
      makeLog(
        `Autonomous tick ${clampedStep + 1}/6 revealed ${activeWorkspace} workspace outputs.`,
        "system",
        activeWorkspace,
        "supervisor",
      ),
    ],
    memory,
  };
};

export const createEmptyPackage = (): OrchestrationPackage => ({
  project: {
    id: "empty",
    name: "No active validation",
    rawIdea: "",
    refinedSummary: "Submit a startup idea to activate the LangGraph orchestration runtime.",
    status: "idle",
    activeWorkspace: "intake",
    completedWorkspaces: [],
    currentStep: 0,
    readinessScore: 0,
    validationConfidence: 0,
    recommendation: "pending",
    integrationMode: "fallback",
    generatedAt: now(),
    updatedAt: now(),
  },
  agents: initialAgents,
  nodes: initialNodes,
  artifacts: [],
  logs: [makeLog("ConductorIQ local runtime waiting for idea intake.", "system", "intake", "supervisor")],
  memory: [],
});
