export type WorkspaceId =
  | "intake"
  | "strategy"
  | "prd"
  | "synthesis"
  | "deployment"
  | "launch";

export type WorkflowStatus =
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

export type ArtifactStatus =
  | "pending"
  | "generating"
  | "draft"
  | "under-review"
  | "revision-requested"
  | "approved"
  | "superseded"
  | "failed";

export type ArtifactType =
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

export type AgentRole =
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

export interface AgentState {
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

export interface Artifact {
  id: string;
  type: ArtifactType;
  title: string;
  status: ArtifactStatus;
  producingAgentId: string;
  sourceNodeId: WorkspaceId;
  dependencyArtifactIds: string[];
  version: number;
  confidence: number;
  summary: string;
  content: string;
  updatedAt: string;
}

export interface MarketSignal {
  label: string;
  value: string;
  sentiment: "positive" | "neutral" | "negative";
  source: "exa" | "openai" | "fallback";
}

export interface Competitor {
  name: string;
  category: string;
  threat: "low" | "medium" | "high";
  positioningGap: string;
}

export interface PersonaReaction {
  persona: string;
  quote: string;
  confidence: number;
  objection: string;
}

export interface RiskItem {
  risk: string;
  severity: "low" | "medium" | "high";
  mitigation: string;
}

export interface TaskItem {
  title: string;
  owner: string;
  status: "queued" | "running" | "done";
}

export interface ExecutionLog {
  id: string;
  timestamp: string;
  agentId?: string;
  nodeId?: WorkspaceId;
  level: "system" | "agent" | "validation" | "warning" | "error";
  message: string;
}

export interface MemoryEntry {
  id: string;
  category: "context" | "decision" | "assumption" | "risk" | "dependency" | "revision";
  title: string;
  content: string;
  sourceArtifactIds: string[];
  createdAt: string;
}

export interface WorkflowNode {
  id: WorkspaceId;
  label: string;
  status: WorkflowStatus;
  assignedAgentId: string;
  dependencyNodeIds: WorkspaceId[];
  outputArtifactIds: string[];
  retryCount: number;
  maxRetries: number;
}

export interface ProjectState {
  id: string;
  name: string;
  rawIdea: string;
  refinedSummary: string;
  status: WorkflowStatus;
  activeWorkspace: WorkspaceId;
  completedWorkspaces: WorkspaceId[];
  currentStep: number;
  readinessScore: number;
  validationConfidence: number;
  recommendation: "pending" | "pursue" | "refine" | "reject";
  integrationMode: "real-ready" | "fallback";
  operatingMode: "autonomous" | "paused" | "completed";
  generatedAt: string;
  updatedAt: string;
}

export interface OrchestrationPackage {
  project: ProjectState;
  agents: AgentState[];
  nodes: WorkflowNode[];
  artifacts: Artifact[];
  logs: ExecutionLog[];
  memory: MemoryEntry[];
  marketSignals: MarketSignal[];
  competitors: Competitor[];
  personas: PersonaReaction[];
  risks: RiskItem[];
  tasks: TaskItem[];
}

export interface PersistedAppState extends OrchestrationPackage {
  selectedWorkspace: WorkspaceId;
  isRunning: boolean;
}
