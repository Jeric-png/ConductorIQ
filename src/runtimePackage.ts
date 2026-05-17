import { initialAgents, initialNodes } from "./data";
import { createFallbackResearch } from "./integrations";
import type { AgentState, Artifact, ExecutionLog, OrchestrationPackage, WorkspaceId, WorkflowNode } from "./types";

export const workspaceOrder: WorkspaceId[] = [
  "intake",
  "strategy",
  "prd",
  "synthesis",
  "deployment",
  "launch",
];

const id = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const now = () => new Date().toISOString();

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

const inferCategory = (idea: string) => {
  const lower = idea.toLowerCase();
  if (
    lower.includes("friend") ||
    lower.includes("social") ||
    lower.includes("community") ||
    lower.includes("meet people") ||
    lower.includes("meetup") ||
    lower.includes("lonely") ||
    lower.includes("hangout")
  ) {
    return "consumer social";
  }
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

const agentStage: Record<string, number> = {
  supervisor: 0,
  memory: 0,
  "prompt-architect": 0,
  "prompt-validator": 0,
  refinement: 0,
  "market-research": 1,
  "competitor-analysis": 1,
  "persona-validation": 1,
  prd: 2,
  "prd-reviewer": 2,
  "ux-ui": 2,
  "interface-improvement": 3,
  "qa-critic": 3,
  "gpt-image": 4,
  "prototype-review": 4,
  architecture: 4,
  "mvp-planning": 4,
  designer: 5,
  "build-orchestrator": 5,
  "stitch-design": 5,
  launch: 5,
};

const activeAgentStatus: Partial<Record<string, AgentState["status"]>> = {
  "prompt-validator": "validating",
  "market-research": "validating",
  "competitor-analysis": "validating",
  "persona-validation": "validating",
  "prd-reviewer": "critiquing",
  "interface-improvement": "validating",
  "qa-critic": "critiquing",
  "prototype-review": "validating",
  designer: "validating",
  "build-orchestrator": "running",
};

export const materializeAgents = (step: number, artifacts: Artifact[]): AgentState[] =>
  initialAgents.map((agent) => {
    const outputIds = artifacts
      .filter((artifact) => artifact.producingAgentId === agent.id)
      .map((artifact) => artifact.id);
    const stage = agentStage[agent.id] ?? workspaceOrder.length - 1;
    const priorWorkspaceIds = workspaceOrder.slice(0, stage);
    const outputDependencies = artifacts
      .filter((artifact) => outputIds.includes(artifact.id))
      .flatMap((artifact) => artifact.dependencyArtifactIds);
    const fallbackDependencies = artifacts
      .filter((artifact) => priorWorkspaceIds.includes(artifact.sourceNodeId))
      .slice(-5)
      .map((artifact) => artifact.id);
    const dependencyArtifactIds = Array.from(new Set([...outputDependencies, ...fallbackDependencies]));
    const active = stage === step;
    const waiting = stage > step;
    const status: AgentState["status"] =
      outputIds.length > 0
        ? "completed"
        : active
          ? activeAgentStatus[agent.id] ?? "running"
          : waiting
            ? "waiting"
            : "retrying";

    return {
      ...agent,
      status,
      progress: outputIds.length > 0 ? 100 : active ? 58 : waiting ? 8 : 22,
      currentTask:
        outputIds.length > 0
          ? "Artifact handed off to downstream workspace"
          : active
            ? "Processing graph-assigned validation task"
            : waiting
              ? "Waiting on upstream artifact dependency"
              : "Retrying missing artifact handoff from prior stage",
      outputArtifactIds: outputIds,
      dependencyArtifactIds,
      lastActivityAt: now(),
    };
  });

export const materializeNodes = (step: number, artifacts: Artifact[]): WorkflowNode[] =>
  initialNodes.map((node, index) => {
    const isFinalStep = step >= workspaceOrder.length - 1;
    return {
      ...node,
      status: index < step || isFinalStep ? "completed" : index === step ? "running" : "waiting",
      outputArtifactIds: artifacts.filter((artifact) => artifact.sourceNodeId === node.id).map((artifact) => artifact.id),
    };
  });

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
  const fallback = createFallbackResearch(orchestration.project.rawIdea, inferCategory(orchestration.project.rawIdea));

  return {
    ...orchestration,
    project: {
      ...orchestration.project,
      activeWorkspace,
      completedWorkspaces,
      currentStep: clampedStep,
      status: completed ? "completed" : "running",
      operatingMode: completed ? "completed" : orchestration.project.operatingMode,
      validationConfidence: Math.min(
        orchestration.project.validationConfidence,
        26 + clampedStep * 12,
      ),
      readinessScore: Math.min(orchestration.project.readinessScore, 18 + clampedStep * 14),
      recommendation: completed ? orchestration.project.recommendation : "pending",
      synthesisApproval:
        clampedStep < 3 ? "not-started" : orchestration.project.synthesisApproval,
      prototypeApproval:
        clampedStep < 4 ? "not-started" : orchestration.project.prototypeApproval,
      designValidation:
        clampedStep < 5 ? "not-started" : orchestration.project.designValidation,
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
    marketSignals: clampedStep >= 1 ? orchestration.marketSignals : [],
    competitors: clampedStep >= 1 ? orchestration.competitors : [],
    personas: clampedStep >= 1 ? orchestration.personas : [],
    marketLeads: clampedStep >= 1 ? orchestration.marketLeads : [],
    assumptionTests: clampedStep >= 1 ? orchestration.assumptionTests : [],
    prototypeAssets: clampedStep >= 4 ? orchestration.prototypeAssets : [],
    risks:
      clampedStep >= 3
        ? orchestration.risks
        : clampedStep >= 1
          ? orchestration.risks.slice(0, Math.max(1, fallback.risks.length - 1))
          : [],
    tasks: orchestration.tasks.map((task, index) => ({
      ...task,
      status: index <= clampedStep ? "done" : index === clampedStep + 1 ? "running" : "queued",
    })),
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
    operatingMode: "paused",
    synthesisApproval: "not-started",
    prototypeApproval: "not-started",
    designValidation: "not-started",
    selectedPrototypeAssetId: undefined,
    prototypeRejectionReason: "regenerate-prototype",
    branchDecisions: [],
    generatedAt: now(),
    updatedAt: now(),
  },
  agents: initialAgents,
  nodes: initialNodes,
  artifacts: [],
  logs: [makeLog("ConductorIQ local runtime waiting for idea intake.", "system", "intake", "supervisor")],
  memory: [],
  marketSignals: [],
  competitors: [],
  personas: [],
  risks: [],
  marketLeads: [],
  assumptionTests: [],
  prototypeAssets: [],
  tasks: [],
});
