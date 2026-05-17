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
  | "awaiting-user-approval"
  | "user-rejected"
  | "regenerating"
  | "superseded"
  | "failed"
  | "fallback";

export type ArtifactType =
  | "prompt"
  | "prompt-review"
  | "market-insight"
  | "competitor-analysis"
  | "persona"
  | "prd"
  | "prd-review"
  | "ux-flow"
  | "ui-mockup"
  | "architecture"
  | "data-assumption"
  | "synthesis-plan"
  | "interface-review"
  | "prototype"
  | "design-validation"
  | "implementation-plan"
  | "mvp-plan"
  | "qa-critique"
  | "launch-plan";

export type AgentRole =
  | "supervisor"
  | "memory"
  | "prompt-architect"
  | "prompt-validator"
  | "refinement"
  | "market-research"
  | "competitor-analysis"
  | "persona-validation"
  | "prd"
  | "prd-reviewer"
  | "ux-ui"
  | "interface-improvement"
  | "gpt-image"
  | "prototype-review"
  | "designer"
  | "stitch-design"
  | "architecture"
  | "mvp-planning"
  | "qa-critic"
  | "build-orchestrator"
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
  evidenceSource?: "user-input" | "openai" | "gpt-image-2" | "fallback" | "deterministic-local";
  reviewStatus?: "not-reviewed" | "under-review" | "reviewed" | "revision-required";
  approvalStatus?: "not-required" | "pending" | "approved" | "rejected";
  updatedAt: string;
}

export interface MarketSignal {
  label: string;
  value: string;
  sentiment: "positive" | "neutral" | "negative";
  source: "openai" | "fallback";
}

export interface Competitor {
  name: string;
  category: string;
  threat: "low" | "medium" | "high";
  positioningGap: string;
  differentiation?: string;
}

export interface PersonaReaction {
  persona: string;
  quote: string;
  confidence: number;
  objection: string;
  willingnessToPay?: string;
}

export interface MarketLead {
  buyerType: string;
  painSignal: string;
  rationale: string;
  validationQuestion: string;
  confidence: number;
  evidenceSource: "openai" | "fallback";
  priority?: "primary" | "secondary" | "experimental";
  segment?: string;
  scoreBreakdown?: {
    painUrgency: number;
    audienceReachability: number;
    budgetFit: number;
    usageFrequency: number;
    differentiationPotential: number;
    evidenceStrength: number;
  };
  scoringRationale?: string;
}

export interface AssumptionTest {
  assumption: string;
  testMethod: string;
  passSignal: string;
  riskIfWrong: string;
}

export interface PrototypeAsset {
  id: string;
  title: string;
  status: "generated" | "fallback";
  reviewStatus?: "pending" | "selected" | "rejected" | "superseded";
  telemetryStatus?: "generated" | "fallback" | "not-attempted";
  variant: "primary" | "workflow" | "evidence" | "regenerated";
  rationale: string;
  prompt: string;
  imageDataUrl?: string;
  provider: "gpt-image-2" | "fallback";
  attemptCount: number;
  failureReason?: string;
  lastAttemptAt: string;
  createdAt: string;
}

export type PrototypeRejectionReason =
  | "regenerate-prototype"
  | "revise-prompt"
  | "revise-prd"
  | "return-synthesis";

export interface BranchDecision {
  id: string;
  timestamp: string;
  decision:
    | "synthesis-approved"
    | "synthesis-revision"
    | "synthesis-rerun"
    | "prototype-approved"
    | "prototype-rejected"
    | "prototype-regenerated";
  fromWorkspace: WorkspaceId;
  toWorkspace: WorkspaceId;
  reason: string;
  langGraphRoute: string[];
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
  stage: string;
  label: string;
  status: WorkflowStatus;
  assignedAgentId: string;
  dependencyNodeIds: WorkspaceId[];
  requiredArtifactTypes: ArtifactType[];
  validationCriteria: string[];
  outputArtifactIds: string[];
  retryCount: number;
  maxRetries: number;
  nextNodeIds: WorkspaceId[];
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
  synthesisApproval: "not-started" | "pending" | "approved" | "revision-requested";
  prototypeApproval: "not-started" | "pending" | "approved" | "rejected";
  designValidation: "not-started" | "running" | "approved" | "blocked";
  selectedPrototypeAssetId?: string;
  prototypeRejectionReason?: PrototypeRejectionReason;
  branchDecisions: BranchDecision[];
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
  marketLeads: MarketLead[];
  assumptionTests: AssumptionTest[];
  prototypeAssets: PrototypeAsset[];
  tasks: TaskItem[];
}

export interface PersistedAppState extends OrchestrationPackage {
  schemaVersion: number;
  selectedWorkspace: WorkspaceId;
  isRunning: boolean;
}
