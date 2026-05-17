import { Annotation, END, START, StateGraph } from "@langchain/langgraph/web";
import { initialAgents, initialNodes } from "./data";
import { createFallbackResearch, runExternalResearch, runOpenAiAgent, runPrototypeGeneration } from "./integrations";
import { analyzePromptQuality } from "./promptQuality";
import type {
  AgentState,
  AssumptionTest,
  Artifact,
  BranchDecision,
  Competitor,
  ExecutionLog,
  MarketLead,
  MarketSignal,
  MemoryEntry,
  OrchestrationPackage,
  PersonaReaction,
  ProjectState,
  PrototypeAsset,
  PrototypeRejectionReason,
  RiskItem,
  TaskItem,
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
  marketSignals: Annotation<MarketSignal[]>({
    reducer: stateReducer,
    default: () => [],
  }),
  competitors: Annotation<Competitor[]>({
    reducer: stateReducer,
    default: () => [],
  }),
  personas: Annotation<PersonaReaction[]>({
    reducer: stateReducer,
    default: () => [],
  }),
  risks: Annotation<RiskItem[]>({
    reducer: stateReducer,
    default: () => [],
  }),
  marketLeads: Annotation<MarketLead[]>({
    reducer: stateReducer,
    default: () => [],
  }),
  assumptionTests: Annotation<AssumptionTest[]>({
    reducer: stateReducer,
    default: () => [],
  }),
  prototypeAssets: Annotation<PrototypeAsset[]>({
    reducer: stateReducer,
    default: () => [],
  }),
  tasks: Annotation<TaskItem[]>({
    reducer: stateReducer,
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
  evidenceSource?: Artifact["evidenceSource"];
  version?: number;
  reviewStatus?: Artifact["reviewStatus"];
  approvalStatus?: Artifact["approvalStatus"];
}): Artifact => ({
  id: id("artifact"),
  type: params.type,
  title: params.title,
  status: params.status ?? "approved",
  producingAgentId: params.producingAgentId,
  sourceNodeId: params.sourceNodeId,
  dependencyArtifactIds: params.dependencies ?? [],
  version: params.version ?? 1,
  confidence: params.confidence,
  summary: params.summary,
  content: params.content,
  evidenceSource: params.evidenceSource,
  reviewStatus: params.reviewStatus,
  approvalStatus: params.approvalStatus,
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

const section = (title: string, body: string) => `## ${title}\n${body.trim()}`;

interface PromptAgentData {
  craftedPrompt: string;
  promptReview: string;
  promptScore: number;
  refinedSummary?: string;
}

interface PrdAgentData {
  prdContent: string;
  prdReview: string;
  uxFlow: string;
  prdQualityScore: number;
}

interface SynthesisAgentData {
  recommendation: "pursue" | "refine" | "reject";
  synthesisPlan: string;
  interfaceReview: string;
  critique: string;
  recommendationRationale: string;
  synthesisConfidence: number;
  interfaceConfidence: number;
}

interface LaunchAgentData {
  implementationPlan: string;
  prototypeBuild: string;
  designValidation: string;
  launchPackage: string;
  readinessConfidence: number;
}

const clampScore = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(100, Math.max(0, parsed)) : fallback;
};

const normalizeRecommendation = (value: unknown, fallback: "pursue" | "refine" | "reject") =>
  value === "pursue" || value === "refine" || value === "reject" ? value : fallback;

const textField = (value: unknown, fallback: string): string => {
  if (typeof value === "string" && value.trim()) {
    return value;
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => textField(item, ""))
      .filter(Boolean)
      .join("\n");
  }
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, entry]) => `${titleCase(key) || key}: ${textField(entry, "")}`)
      .join("\n");
  }
  return fallback;
};

const intakeNode = async (state: GraphState) => {
  const category = inferCategory(state.rawIdea);
  const promptQuality = analyzePromptQuality(state.rawIdea);
  const fallbackRefinedSummary = `${titleCase(state.rawIdea) || "Startup Concept"} is framed as a ${category} MVP for a high-friction workflow with measurable validation risk.`;
  const fallbackPromptData: PromptAgentData = {
    refinedSummary:
      promptQuality.level === "weak"
        ? `${fallbackRefinedSummary} The initial intake is generic, so ConductorIQ will treat target user, pain, and monetization claims as assumptions until clarified.`
        : fallbackRefinedSummary,
    craftedPrompt: [
      section("Role", "Act as an autonomous startup validation team evaluating whether this idea is worth building now."),
      section("Raw idea", state.rawIdea),
      section("Prompt quality gate", `${promptQuality.specificityLabel}. Score: ${promptQuality.score}/100.`),
      section("Assumed target user", promptQuality.assumedTargetUser),
      section("Assumed pain", promptQuality.assumedPain),
      section("Missing context", promptQuality.missingContext.length > 0 ? promptQuality.missingContext.join("\n") : "No major missing context detected."),
      section("Clarifying questions", promptQuality.clarifyingQuestions.length > 0 ? promptQuality.clarifyingQuestions.join("\n") : "Proceed with current prompt."),
      section("Output contract", "Produce market leads, competitor hypotheses, persona objections, risks, a comprehensive PRD, prototype direction, and a pursue/refine/reject recommendation."),
      section("Constraints", "Use six workspaces only. Keep persistence local. Use OpenAI when available and label deterministic fallback outputs when unavailable."),
    ].join("\n\n"),
    promptReview: [
      `Clarity score: ${promptQuality.score}/100.`,
      `Specificity: ${promptQuality.specificityLabel}.`,
      `Strengths: ${promptQuality.strengths.length > 0 ? promptQuality.strengths.join("; ") : "Idea exists, but concrete validation context is limited."}`,
      `Missing context: ${promptQuality.missingContext.length > 0 ? promptQuality.missingContext.join("; ") : "No critical prompt gaps detected."}`,
      `Clarifying questions: ${promptQuality.clarifyingQuestions.length > 0 ? promptQuality.clarifyingQuestions.join(" | ") : "None required before Strategy."}`,
      "Revision applied: narrowed the workflow to market validation first, then PRD, synthesis, prototype approval, and launch package.",
      "Weak prompt trigger: if target user or pain is missing, Strategy must label market claims as hypothesis-only.",
    ].join("\n"),
    promptScore: promptQuality.score,
  };
  const promptAgent = await runOpenAiAgent<PromptAgentData>(
    "Prompt Architect and Prompt Validator Agents",
    "Craft a structured validation prompt and critique it. Return JSON with craftedPrompt, promptReview, promptScore number, and refinedSummary.",
    JSON.stringify({
      rawIdea: state.rawIdea,
      category,
      promptQuality,
      requiredWorkspaces: workspaceOrder,
      constraints: ["localStorage persistence", "OpenAI with fallback", "no database", "six primary workspaces only"],
    }),
    fallbackPromptData,
  );
  const promptData = {
    ...promptAgent.data,
    craftedPrompt: textField(promptAgent.data.craftedPrompt, fallbackPromptData.craftedPrompt),
    promptReview: textField(promptAgent.data.promptReview, fallbackPromptData.promptReview),
    refinedSummary: textField(promptAgent.data.refinedSummary, fallbackPromptData.refinedSummary ?? fallbackRefinedSummary),
    promptScore: clampScore(promptAgent.data.promptScore, fallbackPromptData.promptScore),
  };
  const refinedSummary = promptData.refinedSummary || fallbackRefinedSummary;
  const artifact = makeArtifact({
    type: "data-assumption",
    title: "Refined Concept Brief",
    producingAgentId: "refinement",
    sourceNodeId: "intake",
    confidence: Math.max(45, promptQuality.score - 8),
    summary: "Raw idea converted into a concise opportunity frame.",
    content: `Problem frame: ${state.rawIdea}\nCategory: ${category}\nPrompt quality: ${promptQuality.score}/100 (${promptQuality.level})\nAssumed target user: ${promptQuality.assumedTargetUser}\nAssumed pain: ${promptQuality.assumedPain}\nClarifying questions:\n${promptQuality.clarifyingQuestions.join("\n") || "None required."}\nInitial validation hypothesis: users will pay if the product solves a repeated, urgent, or emotionally meaningful job with a clearer first-user segment than the initial intake provides.`,
    evidenceSource: "user-input",
    reviewStatus: "not-reviewed",
    approvalStatus: "not-required",
  });
  const craftedPrompt = makeArtifact({
    type: "prompt",
    title: "Crafted Validation Prompt",
    producingAgentId: "prompt-architect",
    sourceNodeId: "intake",
    confidence: Math.max(45, promptData.promptScore - 4),
    summary: "Prompt Architect converted the rough idea into a structured validation brief.",
    content: promptData.craftedPrompt,
    dependencies: [artifact.id],
    evidenceSource: promptAgent.mode === "real-ready" ? "openai" : "deterministic-local",
    reviewStatus: "under-review",
    approvalStatus: "not-required",
  });
  const promptReview = makeArtifact({
    type: "prompt-review",
    title: "Prompt Validation Review",
    producingAgentId: "prompt-validator",
    sourceNodeId: "intake",
    confidence: promptData.promptScore,
    summary: "Prompt Validator checked clarity, target user, evidence needs, MVP feasibility, and output shape.",
    content: promptData.promptReview,
    dependencies: [craftedPrompt.id],
    evidenceSource: promptAgent.mode === "real-ready" ? "openai" : "deterministic-local",
    reviewStatus: "reviewed",
    approvalStatus: "not-required",
  });

  return {
    refinedSummary,
    tasks: [
      { title: "Craft structured validation prompt", owner: "Prompt Architect Agent", status: "done" },
      { title: "Validate prompt quality and output contract", owner: "Prompt Validator Agent", status: "done" },
      { title: "Frame user and pain hypothesis", owner: "Refinement Agent", status: "done" },
      { title: "Collect market and competitor signals", owner: "Market Research Agent", status: "running" },
      { title: "Simulate persona objections", owner: "Persona Validation Agent", status: "queued" },
      { title: "Draft MVP PRD", owner: "PRD Agent", status: "queued" },
      { title: "Review generated PRD", owner: "PRD Reviewer Agent", status: "queued" },
      { title: "Validate interface clarity", owner: "Designer Agent", status: "queued" },
      { title: "Hold prototype for approval", owner: "Prototype Review Agent", status: "queued" },
      { title: "Produce final recommendation", owner: "QA Critic Agent", status: "queued" },
    ],
    artifacts: [artifact, craftedPrompt, promptReview],
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
      makeLog(promptAgent.logMessage, promptAgent.mode === "real-ready" ? "validation" : "warning", "intake", "prompt-architect"),
      makeLog("Prompt Validator Agent approved prompt quality and constraints.", "validation", "intake", "prompt-validator"),
      makeLog("Refinement Agent produced concept brief and validation hypothesis.", "agent", "intake", "refinement"),
    ],
  };
};

const strategyNode = async (state: GraphState) => {
  const category = inferCategory(state.rawIdea);
  const research = await runExternalResearch(state.rawIdea, category);
  const integrationMode = research.mode;
  const confidence = research.confidence;
  const marketArtifact = makeArtifact({
    type: "market-insight",
    title: integrationMode === "real-ready" ? "Market Signal Scan" : "Fallback Market Signal Scan",
    producingAgentId: "market-research",
    sourceNodeId: "strategy",
    confidence,
    summary:
      integrationMode === "real-ready"
        ? "OpenAI integration path is configured for live validation."
        : "Browser-safe API keys are unavailable, so deterministic OpenAI-style fallback synthesis is used.",
    content: research.summary,
    evidenceSource: integrationMode === "real-ready" ? "openai" : "fallback",
    status: integrationMode === "real-ready" ? "approved" : "fallback",
    reviewStatus: "reviewed",
    approvalStatus: "not-required",
  });
  const competitorArtifact = makeArtifact({
    type: "competitor-analysis",
    title: "Competitor Pressure Map",
    producingAgentId: "competitor-analysis",
    sourceNodeId: "strategy",
    confidence: 70,
    summary: "Market has indirect alternatives; differentiation must be workflow depth and decision quality.",
    content: research.competitors
      .map((competitor) => `${competitor.name} (${competitor.threat} threat): ${competitor.positioningGap}\nDifferentiation: ${competitor.differentiation ?? "Use workflow depth and traceable validation state."}`)
      .join("\n"),
    dependencies: [marketArtifact.id],
    evidenceSource: integrationMode === "real-ready" ? "openai" : "fallback",
    reviewStatus: "reviewed",
    approvalStatus: "not-required",
  });
  const personaArtifact = makeArtifact({
    type: "persona",
    title: "Persona Simulation",
    producingAgentId: "persona-validation",
    sourceNodeId: "strategy",
    confidence: 74,
    summary: "Primary persona is skeptical but interested if setup is fast and outputs are evidence-backed.",
    content: research.personas
      .map((persona) => `${persona.persona}: "${persona.quote}"\nObjection: ${persona.objection}\nWillingness to pay: ${persona.willingnessToPay ?? "Unknown until interview validation."}`)
      .join("\n"),
    dependencies: [marketArtifact.id],
    evidenceSource: integrationMode === "real-ready" ? "openai" : "fallback",
    reviewStatus: "reviewed",
    approvalStatus: "not-required",
  });
  const leadArtifact = makeArtifact({
    type: "market-insight",
    title: "Market Leads and Validation Questions",
    producingAgentId: "market-research",
    sourceNodeId: "strategy",
    confidence: Math.max(66, confidence - 4),
    summary: "Strategy produced target lead segments, likely pain signals, and interview questions.",
    content: [
      ...research.marketLeads.map(
        (lead, index) =>
          [
            `Lead ${index + 1}: ${lead.buyerType}`,
            `Segment: ${lead.segment ?? "Unclassified"}`,
            `Priority: ${lead.priority ?? "secondary"}`,
            `Pain: ${lead.painSignal}`,
            `Rationale: ${lead.rationale}`,
            `Question: ${lead.validationQuestion}`,
            `Confidence: ${lead.confidence}%`,
            `Score breakdown: ${lead.scoringRationale ?? "No rubric available."}`,
            `Evidence: ${lead.evidenceSource}`,
          ].join("\n"),
      ),
      `Evidence label: ${integrationMode === "real-ready" ? "OpenAI reasoning" : "deterministic fallback / hypothesis-only"}.`,
    ].join("\n"),
    dependencies: [marketArtifact.id],
    evidenceSource: integrationMode === "real-ready" ? "openai" : "fallback",
    reviewStatus: "reviewed",
    approvalStatus: "not-required",
  });
  const assumptionArtifact = makeArtifact({
    type: "data-assumption",
    title: "Assumption Test Plan",
    producingAgentId: "market-research",
    sourceNodeId: "strategy",
    confidence: Math.max(65, confidence - 6),
    summary: "Strategy converted weak claims into testable assumptions and pass/fail signals.",
    content: research.assumptionTests
      .map(
        (test, index) =>
          `Test ${index + 1}: ${test.assumption}\nMethod: ${test.testMethod}\nPass signal: ${test.passSignal}\nRisk if wrong: ${test.riskIfWrong}`,
      )
      .join("\n\n"),
    dependencies: [leadArtifact.id],
    evidenceSource: integrationMode === "real-ready" ? "openai" : "fallback",
    reviewStatus: "under-review",
    approvalStatus: "not-required",
  });

  return {
    integrationMode,
    validationConfidence: confidence,
    marketSignals: research.signals,
    competitors: research.competitors,
    personas: research.personas,
    risks: research.risks,
    marketLeads: research.marketLeads,
    assumptionTests: research.assumptionTests,
    tasks: state.tasks.map((task) =>
      task.owner === "Market Research Agent" || task.owner === "Persona Validation Agent"
        ? { ...task, status: "done" }
        : task.owner === "PRD Agent"
          ? { ...task, status: "running" }
          : task,
    ),
    artifacts: [marketArtifact, leadArtifact, competitorArtifact, personaArtifact, assumptionArtifact],
    memory: [
      makeMemory(
        "Market validation mode",
        integrationMode === "real-ready"
          ? "Live API path is available for OpenAI-backed validation."
          : "Fallback mode is active because browser-visible OpenAI env vars were not available.",
        integrationMode === "real-ready" ? "decision" : "risk",
        [marketArtifact.id],
      ),
    ],
    logs: [
      makeLog(
        research.logMessage,
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
  const topCompetitor = state.competitors[0]?.name ?? "manual alternatives";
  const topPersona = state.personas[0]?.persona ?? "time-constrained founder";
  const topRisk = state.risks[0]?.risk ?? "evidence quality remains unproven";
  const leadSummary = state.marketLeads
    .slice(0, 3)
    .map((lead) => `${lead.buyerType}: ${lead.validationQuestion}`)
    .join("\n");
  const assumptionSummary = state.assumptionTests
    .slice(0, 3)
    .map((test) => `${test.assumption} -> ${test.passSignal}`)
    .join("\n");
  const fallbackPrdData: PrdAgentData = {
    prdContent: [
      section("Executive Summary", `${state.refinedSummary} The MVP must answer whether the idea is worth building now and what the first scoped product should include.`),
      section("Problem Statement", `Founders move from idea to implementation before validating market urgency, target persona fit, competitor pressure, and execution risk. This workflow converts "${state.rawIdea}" into an evidence-backed MVP decision.`),
      section("Target Users", `Primary: ${topPersona}. Secondary: technical founders, product operators, and advisors who need structured validation before committing build effort.`),
      section("Goals", "Produce a validated recommendation, comprehensive PRD, prototype direction, risk register, and launch/build-preparation package."),
      section("Non-Goals", "No authentication, billing, database, hosted queues, production deployment, or unrelated dashboards."),
      section("Core User Flow", "Intake captures the idea, Strategy validates market signals, PRD Generation formalizes scope, Synthesis reviews and holds for approval, Deployment prepares prototype direction, and Launch packages the approved MVP foundation."),
      section("Feature Requirements", "Idea intake, file import, prompt validation, market leads, competitor hypotheses, persona objections, risk scoring, PRD review, synthesis decision, prototype approval, design validation, and local package export."),
      section("UX Requirements", "The interface must feel operational and cinematic, prioritize graph state and agent collaboration, avoid chatbot-first layout, expose approval gates, and keep long artifacts readable."),
      section("Technical Direction", "React + Vite + TypeScript + TailwindCSS, localStorage persistence, local LangGraph StateGraph, OpenAI when available, deterministic fallback when unavailable."),
      section("Data Model", "Persist project state, agents, workflow nodes, artifacts, logs, memory, market signals, competitors, personas, risks, approval state, and design validation state."),
      section("Market Leads", leadSummary || "No market leads were available; keep claims labelled as fallback hypotheses."),
      section("Assumption Tests", assumptionSummary || "No assumption tests were available; require founder interviews before widening MVP scope."),
      section("Acceptance Criteria", "User receives a pursue/refine/reject recommendation with supporting evidence, PRD, prototype direction, implementation plan, design validation report, risks, next actions, and downloadable package."),
      section("Risks", `Top competitor pressure: ${topCompetitor}. Top execution risk: ${topRisk}. These risks must influence synthesis and launch scope.`),
      section("Roadmap", "Add live web research, richer image generation, repository scaffolding, multi-project dashboard, and durable hosted workflows after the local workflow is validated."),
    ].join("\n\n"),
    prdReview: [
      "Quality score: 88/100. Section completeness: 14/14 required sections present.",
      "Passed: executive summary, users, goals/non-goals, workflow, feature requirements, UX requirements, technical direction, data model, acceptance criteria, risks, and roadmap are present.",
      "Revision request: keep market evidence labels visible in downstream Synthesis and avoid treating fallback hypotheses as external proof.",
      "Implementation note: Launch must remain locked until prototype and design validation are approved.",
    ].join("\n"),
    uxFlow:
      "Primary path: Intake -> Strategy -> PRD Generation -> Synthesis -> Deployment -> Launch. Design should avoid chat-first interaction and emphasize graph status, agent cards, artifact cards, memory, and terminal logs.",
    prdQualityScore: 88,
  };
  const prdAgent = await runOpenAiAgent<PrdAgentData>(
    "PRD Agent and PRD Reviewer Agent",
    "Generate a comprehensive startup-quality PRD and a PRD reviewer report. Return JSON with prdContent, prdReview, uxFlow, and prdQualityScore number.",
    JSON.stringify({
      rawIdea: state.rawIdea,
      refinedSummary: state.refinedSummary,
      marketLeads: state.marketLeads,
      competitors: state.competitors,
      personas: state.personas,
      risks: state.risks,
      requiredSections: [
        "executive summary",
        "vision",
        "problem statement",
        "users",
        "goals",
        "non-goals",
        "workflow",
        "feature requirements",
        "UX requirements",
        "technical direction",
        "data model",
        "acceptance criteria",
        "risks",
        "roadmap",
      ],
    }),
    fallbackPrdData,
    15000,
  );
  const prdData = {
    ...prdAgent.data,
    prdContent: textField(prdAgent.data.prdContent, fallbackPrdData.prdContent),
    prdReview: textField(prdAgent.data.prdReview, fallbackPrdData.prdReview),
    uxFlow: textField(prdAgent.data.uxFlow, fallbackPrdData.uxFlow),
    prdQualityScore: clampScore(prdAgent.data.prdQualityScore, fallbackPrdData.prdQualityScore),
  };
  const prdArtifact = makeArtifact({
    type: "prd",
    title: "Comprehensive MVP PRD Draft",
    producingAgentId: "prd",
    sourceNodeId: "prd",
    confidence: Math.max(70, prdData.prdQualityScore - 4),
    summary: "Comprehensive product requirements generated from prompt, strategy evidence, persona objections, and risk analysis.",
    content: prdData.prdContent,
    dependencies: state.artifacts.map((artifact) => artifact.id),
    evidenceSource: prdAgent.mode === "real-ready" ? "openai" : "deterministic-local",
    reviewStatus: "under-review",
    approvalStatus: "not-required",
  });
  const prdReviewArtifact = makeArtifact({
    type: "prd-review",
    title: "PRD Review Findings",
    producingAgentId: "prd-reviewer",
    sourceNodeId: "prd",
    confidence: prdData.prdQualityScore,
    summary: "PRD Reviewer checked hierarchy, coverage, acceptance criteria, technical constraints, and risk traceability.",
    content: prdData.prdReview,
    dependencies: [prdArtifact.id],
    evidenceSource: prdAgent.mode === "real-ready" ? "openai" : "deterministic-local",
    reviewStatus: "reviewed",
    approvalStatus: "not-required",
  });
  const uxArtifact = makeArtifact({
    type: "ux-flow",
    title: "Workspace Flow",
    producingAgentId: "ux-ui",
    sourceNodeId: "prd",
    confidence: 73,
    summary: "Six-workspace navigation preserves focus while agents run inside each stage.",
    content: prdData.uxFlow,
    dependencies: [prdArtifact.id, prdReviewArtifact.id],
    evidenceSource: prdAgent.mode === "real-ready" ? "openai" : "deterministic-local",
    reviewStatus: "reviewed",
    approvalStatus: "not-required",
  });

  return {
    validationConfidence: Math.max(state.validationConfidence, 74),
    tasks: state.tasks.map((task) =>
      task.owner === "PRD Agent"
        ? { ...task, status: "done" }
        : task.owner === "PRD Reviewer Agent"
          ? { ...task, status: "done" }
        : task.owner === "QA Critic Agent"
          ? { ...task, status: "running" }
          : task,
    ),
    artifacts: [prdArtifact, prdReviewArtifact, uxArtifact],
    memory: [
      makeMemory(
        "PRD scope locked",
        "MVP requirements are constrained to six workspaces and one complete validation-to-launch package.",
        "decision",
        [prdArtifact.id],
      ),
    ],
    logs: [
      makeLog(prdAgent.logMessage, prdAgent.mode === "real-ready" ? "validation" : "warning", "prd", "prd"),
      makeLog("PRD Reviewer Agent produced quality score and revision constraints.", "validation", "prd", "prd-reviewer"),
      makeLog("UX/UI Agent converted the PRD into six workspace interaction flow.", "agent", "prd", "ux-ui"),
    ],
  };
};

const synthesisNode = async (state: GraphState) => {
  const fallbackRecommendation =
    state.validationConfidence >= 76 ? "pursue" : state.validationConfidence >= 55 ? "refine" : "reject";
  const fallbackSynthesisData: SynthesisAgentData = {
    recommendation: fallbackRecommendation,
    synthesisPlan: [
      section("Evidence Review", `Reviewed ${state.artifacts.length} upstream artifacts, ${state.competitors.length} competitor hypotheses, ${state.personas.length} persona reactions, and ${state.risks.length} risk flags.`),
      section("Market Lead Readout", state.marketLeads.map((lead) => `${lead.buyerType}: ${lead.painSignal} (${lead.confidence}%, ${lead.evidenceSource})`).join("\n") || "No lead data available; keep output in fallback mode."),
      section("Assumption Test Readout", state.assumptionTests.map((test) => `${test.assumption}\nPass signal: ${test.passSignal}`).join("\n\n") || "No assumption tests available."),
      section("Validation Gaps", "Buyer urgency, willingness to pay, trust in AI-generated evidence, and first-workflow narrowness remain the highest-risk assumptions."),
      section("Interface Improvements", "Keep approval gates visually explicit, show fallback labels beside evidence, keep long PRD sections scrollable, and keep primary actions in the active workspace."),
      section("Decision Logic", `Current confidence supports ${fallbackRecommendation.toUpperCase()} if prototype approval and design validation pass. If rejected, route back to PRD revision or prototype regeneration.`),
      section("Hold State", "Workflow pauses here until the user approves continuation, requests revision, or reruns validation."),
    ].join("\n\n"),
    interfaceReview: [
      "UI clarity score: 88/100. Primary action should be visible within five seconds on every workspace.",
      "Workflow coherence score: 86/100. The six-stage path is clear, but locked states must explain the next action.",
      "Trust and evidence score: 84/100. Fallback/hypothesis-only labels must appear near Strategy evidence and not only in logs.",
      "Visual hierarchy critique: graph state, agents, artifacts, memory, and logs should remain more prominent than chat-style input.",
      "Copy improvement pass: rewrite vague labels into action verbs such as Approve Synthesis, Rerun Validation, Regenerate Prototype, and Export Launch File.",
      "Prototype readiness checklist: approval gate visible, fallback label visible, long artifact content scrollable, no extra top-level workspaces, Launch lock visible.",
    ].join("\n"),
    critique:
      "Strong signals: clear workflow pain, high value of faster decisions, and strong product walkthrough narrative. Weakest assumptions: willingness to pay, trust in generated evidence, and whether the wedge is narrow enough for first users.",
    recommendationRationale:
      fallbackRecommendation === "pursue"
        ? "Proceed with a focused MVP because evidence quality, target pain, and product clarity are strong enough for a pilot."
        : "Refine before scaling implementation. Run sharper customer interviews and validate willingness to pay before expanding scope.",
    synthesisConfidence: Math.max(72, state.validationConfidence),
    interfaceConfidence: 83,
  };
  const synthesisAgent = await runOpenAiAgent<SynthesisAgentData>(
    "Synthesis, QA Critic, and Interface Improvement Agents",
    "Review all upstream outputs first. Return JSON with recommendation pursue/refine/reject, synthesisPlan, interfaceReview, critique, recommendationRationale, synthesisConfidence number, interfaceConfidence number.",
    JSON.stringify({
      rawIdea: state.rawIdea,
      refinedSummary: state.refinedSummary,
      validationConfidence: state.validationConfidence,
      artifacts: state.artifacts.map((artifact) => ({
        title: artifact.title,
        type: artifact.type,
        summary: artifact.summary,
        evidenceSource: artifact.evidenceSource,
      })),
      marketLeads: state.marketLeads,
      competitors: state.competitors,
      personas: state.personas,
      risks: state.risks,
      requiredBehavior: "Produce review-first plan, interface critique, validation gaps, and hold-state recommendation.",
    }),
    fallbackSynthesisData,
    15000,
  );
  const synthesisData = {
    ...synthesisAgent.data,
    recommendation: normalizeRecommendation(synthesisAgent.data.recommendation, fallbackRecommendation),
    synthesisPlan: textField(synthesisAgent.data.synthesisPlan, fallbackSynthesisData.synthesisPlan),
    interfaceReview: textField(synthesisAgent.data.interfaceReview, fallbackSynthesisData.interfaceReview),
    critique: textField(synthesisAgent.data.critique, fallbackSynthesisData.critique),
    recommendationRationale: textField(
      synthesisAgent.data.recommendationRationale,
      fallbackSynthesisData.recommendationRationale,
    ),
    synthesisConfidence: clampScore(synthesisAgent.data.synthesisConfidence, fallbackSynthesisData.synthesisConfidence),
    interfaceConfidence: clampScore(synthesisAgent.data.interfaceConfidence, fallbackSynthesisData.interfaceConfidence),
  };
  const recommendation = synthesisData.recommendation;
  const synthesisPlanArtifact = makeArtifact({
    type: "synthesis-plan",
    title: "Review-First Synthesis Plan",
    producingAgentId: "qa-critic",
    sourceNodeId: "synthesis",
    confidence: synthesisData.synthesisConfidence,
    summary: "Synthesis reviews all upstream evidence before allowing prototype or launch progression.",
    content: synthesisData.synthesisPlan,
    status: "under-review",
    dependencies: state.artifacts.map((artifact) => artifact.id),
    evidenceSource: synthesisAgent.mode === "real-ready" ? "openai" : "deterministic-local",
    version: 2,
    reviewStatus: "under-review",
    approvalStatus: "pending",
  });
  const interfaceArtifact = makeArtifact({
    type: "interface-review",
    title: "Interface Improvement Critique",
    producingAgentId: "interface-improvement",
    sourceNodeId: "synthesis",
    confidence: synthesisData.interfaceConfidence,
    summary: "Interface Improvement Agent reviewed hierarchy, copy, trust signals, approval clarity, and artifact readability.",
    content: synthesisData.interfaceReview,
    dependencies: [synthesisPlanArtifact.id],
    evidenceSource: synthesisAgent.mode === "real-ready" ? "openai" : "deterministic-local",
    reviewStatus: "reviewed",
    approvalStatus: "not-required",
  });
  const critiqueArtifact = makeArtifact({
    type: "qa-critique",
    title: "Validation Critique",
    producingAgentId: "qa-critic",
    sourceNodeId: "synthesis",
    confidence: 71,
    summary: "QA review found the idea direction viable but dependent on sharper buyer urgency proof.",
    content: synthesisData.critique,
    status: "under-review",
    dependencies: [synthesisPlanArtifact.id],
    evidenceSource: synthesisAgent.mode === "real-ready" ? "openai" : "deterministic-local",
    reviewStatus: "under-review",
    approvalStatus: "not-required",
  });
  const synthesisArtifact = makeArtifact({
    type: "mvp-plan",
    title: `${recommendation.toUpperCase()} Recommendation`,
    producingAgentId: "qa-critic",
    sourceNodeId: "synthesis",
    confidence: Math.max(64, state.validationConfidence),
    summary: `Recommendation: ${recommendation}. Build only around the narrowest validation workflow first.`,
    content: synthesisData.recommendationRationale,
    dependencies: [synthesisPlanArtifact.id, critiqueArtifact.id],
    evidenceSource: synthesisAgent.mode === "real-ready" ? "openai" : "deterministic-local",
    reviewStatus: "reviewed",
    approvalStatus: "pending",
  });

  return {
    recommendation,
    validationConfidence: Math.max(state.validationConfidence, 72),
    risks: [
      ...state.risks,
      {
        risk: "Weak buyer urgency can reduce willingness to pay.",
        severity: "high",
        mitigation: "Validate a paid pilot promise before expanding product surface area.",
      },
    ],
    tasks: state.tasks.map((task) =>
      task.owner === "QA Critic Agent"
        ? { ...task, status: "done" }
        : task.owner === "Interface Improvement Agent"
          ? { ...task, status: "done" }
        : task.owner === "Prototype Review Agent"
          ? { ...task, status: "running" }
        : task.owner === "MVP Planning Agent"
          ? { ...task, status: "queued" }
          : task,
    ),
    artifacts: [synthesisPlanArtifact, interfaceArtifact, critiqueArtifact, synthesisArtifact],
    memory: [
      makeMemory(
        "QA critique loop",
        "The critique loop requested stronger proof of urgency and kept the final MVP scope narrow.",
        "revision",
        [critiqueArtifact.id],
      ),
    ],
    logs: [
      makeLog(synthesisAgent.logMessage, synthesisAgent.mode === "real-ready" ? "validation" : "warning", "synthesis", "qa-critic"),
      makeLog("Synthesis entered hold state for user review before prototype progression.", "system", "synthesis", "supervisor"),
      makeLog("Interface Improvement Agent produced UX clarity and validation visibility critique.", "validation", "synthesis", "interface-improvement"),
      makeLog("QA Critic Agent reviewed market evidence, persona objections, and PRD assumptions.", "validation", "synthesis", "qa-critic"),
      makeLog(`Synthesis node produced ${recommendation.toUpperCase()} recommendation.`, "system", "synthesis", "supervisor"),
    ],
  };
};

const deploymentNode = async (state: GraphState) => {
  const readinessScore = Math.min(92, Math.max(64, state.validationConfidence + 10));
  const imagePrompt = `Cinematic dark AI-native orchestration workspace for "${state.rawIdea}". Show exactly six product workspaces, glowing LangGraph routing nodes, specialized agent cards, market evidence vault, synthesis approval checkpoint, prototype review gate, launch readiness dashboard, cyan and fuchsia accents, no chatbot layout.`;
  const prototypeAsset = await runPrototypeGeneration(state.rawIdea, imagePrompt);
  const prototypeOptions: PrototypeAsset[] = [
    prototypeAsset,
    {
      id: `prototype-workflow-${Date.now().toString(36)}`,
      title: "Workflow Control Room Variant",
      status: "fallback",
      reviewStatus: "pending",
      telemetryStatus: "not-attempted",
      variant: "workflow",
      rationale: "Prioritizes graph routing, agent states, approval checkpoints, and operator trust during the live workflow.",
      prompt: `${imagePrompt} Variant: make the six-workspace graph and agent execution stream the visual center; emphasize Synthesis hold and Launch lock states.`,
      provider: "fallback",
      attemptCount: 0,
      failureReason: "No image call attempted for this deterministic comparison variant.",
      lastAttemptAt: now(),
      createdAt: now(),
    },
    {
      id: `prototype-evidence-${Date.now().toString(36)}`,
      title: "Evidence Vault Variant",
      status: "fallback",
      reviewStatus: "pending",
      telemetryStatus: "not-attempted",
      variant: "evidence",
      rationale: "Prioritizes market evidence, PRD completeness, artifact lineage, confidence scoring, and final decision credibility.",
      prompt: `${imagePrompt} Variant: make market leads, PRD artifacts, evidence-source labels, and pursue/refine/reject decision cards visually dominant.`,
      provider: "fallback",
      attemptCount: 0,
      failureReason: "No image call attempted for this deterministic comparison variant.",
      lastAttemptAt: now(),
      createdAt: now(),
    },
  ];
  const deploymentArtifact = makeArtifact({
    type: "architecture",
    title: "MVP Readiness Plan",
    producingAgentId: "architecture",
    sourceNodeId: "deployment",
    confidence: readinessScore,
    summary: "Frontend-first stack is suitable for a validated local product workflow without production infrastructure.",
    content:
      "Suggested stack: React, Vite, TypeScript, TailwindCSS, localStorage, local LangGraph StateGraph, optional local API proxy for secrets. Execution risk is moderate and mostly tied to external API reliability, approval gates, design validation, and scope creep.",
    dependencies: state.artifacts.map((artifact) => artifact.id),
    evidenceSource: "deterministic-local",
    reviewStatus: "reviewed",
    approvalStatus: "not-required",
  });
  const prototypeArtifact = makeArtifact({
    type: "prototype",
    title: prototypeAsset.status === "generated" ? "GPT Image 2 Prototype Concept" : "GPT Image 2 Prototype Direction Fallback",
    producingAgentId: "gpt-image",
    sourceNodeId: "deployment",
    confidence: prototypeAsset.status === "generated" ? 86 : 78,
    summary:
      prototypeAsset.status === "generated"
        ? "GPT Image 2 generated a prototype concept through the local OpenAI proxy."
        : "Visual prototype direction is prepared as a labelled prompt fallback until safe image generation is available.",
    content: [
      `Status: ${prototypeAsset.status === "generated" ? "generated image" : "pending image generation / visual-prompt fallback"}.`,
      `Provider: ${prototypeAsset.provider}.`,
      `Prompt: ${prototypeAsset.prompt}`,
      "Hero direction: autonomous startup validation control room with cyan and fuchsia operational accents, dense but readable panels, and visible artifact lineage.",
      "Approval requirement: user must approve this prototype direction before Launch/build-preparation agents unlock.",
    ].join("\n"),
    status: prototypeAsset.status === "generated" ? "awaiting-user-approval" : "fallback",
    dependencies: [deploymentArtifact.id],
    evidenceSource: prototypeAsset.status === "generated" ? "gpt-image-2" : "fallback",
    version: prototypeAsset.status === "generated" ? 1 : 2,
    reviewStatus: "under-review",
    approvalStatus: "pending",
  });
  const prototypeReviewArtifact = makeArtifact({
    type: "prototype",
    title: "Prototype Review Gate",
    producingAgentId: "prototype-review",
    sourceNodeId: "deployment",
    confidence: 80,
    summary: "Prototype Review Agent is waiting for explicit approval or rejection.",
    content: "Available actions: approve prototype direction, reject and regenerate, or route back to Synthesis/PRD revision. Launch remains locked until approval is recorded.",
    status: "awaiting-user-approval",
    dependencies: [prototypeArtifact.id],
    evidenceSource: "deterministic-local",
    reviewStatus: "under-review",
    approvalStatus: "pending",
  });

  return {
    readinessScore,
    tasks: [
      ...state.tasks.map((task) =>
        task.owner === "MVP Planning Agent" ? { ...task, status: "done" as const } : task,
      ),
      { title: "Review prototype direction", owner: "Prototype Review Agent", status: "running" },
      { title: "Package local launch file", owner: "Launch Agent", status: "queued" },
    ],
    artifacts: [deploymentArtifact, prototypeArtifact, prototypeReviewArtifact],
    prototypeAssets: prototypeOptions,
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
      makeLog(
      prototypeAsset.status === "generated"
        ? "GPT Image Agent generated prototype concept through the local proxy."
          : "GPT Image Agent produced labelled visual prompt fallback for prototype review.",
        prototypeAsset.status === "generated" ? "validation" : "warning",
        "deployment",
        "gpt-image",
      ),
      makeLog("Prototype Review Agent prepared three selectable directions: primary, workflow control room, and evidence vault.", "agent", "deployment", "prototype-review"),
      makeLog("Prototype Review Agent locked Launch until explicit approval.", "system", "deployment", "prototype-review"),
    ],
  };
};

const launchNode = async (state: GraphState) => {
  const approvedPrototype = state.prototypeAssets.find((asset) => asset.reviewStatus === "selected") ?? state.prototypeAssets[0];
  const fallbackLaunchData: LaunchAgentData = {
    implementationPlan: [
      section("Component Map", "App shell, WorkspaceNav, TopBar, OrchestrationGraph, AgentGrid, ArtifactVault, ContextPanel, ApprovalGate, DesignValidationReport, LaunchPackageExport."),
      section("State Model", "Persist project, agents, nodes, artifacts, logs, memory, scores, selected workspace, synthesis approval, prototype approval, and design validation."),
      section("Execution Sequence", "Intake -> Strategy -> PRD Generation -> Synthesis hold -> Deployment prototype review -> approved Launch package."),
      section("Risk Controls", "Keep OpenAI unavailable states labelled, keep Launch locked before approval, and keep final package export local."),
    ].join("\n\n"),
    prototypeBuild: [
      section("Approved Prototype Direction", approvedPrototype ? `${approvedPrototype.title} (${approvedPrototype.provider}, ${approvedPrototype.variant}). ${approvedPrototype.rationale}` : "No prototype direction was available; keep Launch locked until approval."),
      section("Prototype Screen Plan", "Build a static local prototype with: hero validation console, six-workspace progress rail, market lead cards, PRD completeness panel, Synthesis approval gate, Deployment visual preview, and Launch package export."),
      section("Interaction Contract", "Intake accepts a rough idea; Strategy and PRD panels render generated evidence; Synthesis must be approved; Deployment prototype must be approved; Launch exports the MVP foundation package."),
      section("Component Scaffold", [
        "PrototypeShell",
        "ValidationHero",
        "WorkspaceProgressRail",
        "MarketEvidencePanel",
        "PrototypePreviewCard",
        "LaunchPackageSummary",
      ].join(" -> ")),
      section("Starter Markup", [
        "<main class=\"prototype-shell\">",
        "  <section class=\"validation-hero\">Recommendation, confidence, and next action</section>",
        "  <section class=\"workspace-grid\">Six approved ConductorIQ workspaces</section>",
        "  <section class=\"evidence-vault\">Market leads, risks, personas, and PRD scope</section>",
        "  <section class=\"launch-package\">Implementation plan and export actions</section>",
        "</main>",
      ].join("\n")),
    ].join("\n\n"),
    designValidation: [
      "Status: approved.",
      "Checked: six-workspace navigation, main artifact panel, right context panel, logs, cards, badges, buttons, approval states, fallback labels, and long-content wrapping.",
      "No blocking layout issue detected in code-level design review. Browser validation must confirm no overlap or clipping at runtime.",
      "Recommendations: keep Launch lock messaging visible, avoid adding new top-level workspaces, and preserve scroll containers for PRD/artifact content.",
    ].join("\n"),
    launchPackage: `Launch narrative: ${state.refinedSummary}\nRecommendation: ${state.recommendation.toUpperCase()}.\nNext actions: interview 5 target users, validate willingness to pay, run the six-workspace product walkthrough, and cut all features not tied to the build decision.`,
    readinessConfidence: Math.max(78, state.readinessScore),
  };
  const launchAgent = await runOpenAiAgent<LaunchAgentData>(
    "Launch, Build Orchestrator, and Designer Agents",
    "Create final launch package content after prototype approval. Return JSON with implementationPlan, prototypeBuild, designValidation, launchPackage, and readinessConfidence number.",
    JSON.stringify({
      rawIdea: state.rawIdea,
      refinedSummary: state.refinedSummary,
      recommendation: state.recommendation,
      readinessScore: state.readinessScore,
      validationConfidence: state.validationConfidence,
      risks: state.risks,
      prototypeAssets: state.prototypeAssets.map((asset) => ({
        title: asset.title,
        status: asset.status,
        provider: asset.provider,
        prompt: asset.prompt,
      })),
      constraints: ["local export only", "no auth", "no database", "six workspaces only", "build-preparation after approval"],
    }),
    fallbackLaunchData,
    15000,
  );
  const launchData = {
    ...launchAgent.data,
    implementationPlan: textField(launchAgent.data.implementationPlan, fallbackLaunchData.implementationPlan),
    prototypeBuild: textField(launchAgent.data.prototypeBuild, fallbackLaunchData.prototypeBuild),
    designValidation: textField(launchAgent.data.designValidation, fallbackLaunchData.designValidation),
    launchPackage: textField(launchAgent.data.launchPackage, fallbackLaunchData.launchPackage),
    readinessConfidence: clampScore(launchAgent.data.readinessConfidence, fallbackLaunchData.readinessConfidence),
  };
  const implementationArtifact = makeArtifact({
    type: "implementation-plan",
    title: "Approval-Backed Implementation Plan",
    producingAgentId: "build-orchestrator",
    sourceNodeId: "launch",
    confidence: launchData.readinessConfidence,
    summary: "Build Orchestrator translated the approved prototype direction into a frontend implementation package.",
    content: launchData.implementationPlan,
    dependencies: state.artifacts.map((artifact) => artifact.id),
    evidenceSource: launchAgent.mode === "real-ready" ? "openai" : "deterministic-local",
    reviewStatus: "reviewed",
    approvalStatus: "approved",
  });
  const prototypeBuildArtifact = makeArtifact({
    type: "mvp-plan",
    title: "Approved Prototype Build Scaffold",
    producingAgentId: "build-orchestrator",
    sourceNodeId: "launch",
    confidence: launchData.readinessConfidence,
    summary: "Build Orchestrator converted the approved prototype direction into a concrete static prototype scaffold.",
    content: launchData.prototypeBuild,
    dependencies: [implementationArtifact.id, ...(approvedPrototype ? [approvedPrototype.id] : [])],
    evidenceSource: launchAgent.mode === "real-ready" ? "openai" : "deterministic-local",
    version: 1,
    reviewStatus: "reviewed",
    approvalStatus: "approved",
  });
  const designArtifact = makeArtifact({
    type: "design-validation",
    title: "Design Validation Report",
    producingAgentId: "designer",
    sourceNodeId: "launch",
    confidence: 90,
    summary: "Designer Agent approved the layout for desktop readability, no obvious overlap, visible actions, and coherent operational hierarchy.",
    content: launchData.designValidation,
    dependencies: [implementationArtifact.id, prototypeBuildArtifact.id],
    evidenceSource: launchAgent.mode === "real-ready" ? "openai" : "deterministic-local",
    reviewStatus: "reviewed",
    approvalStatus: "approved",
  });
  const launchArtifact = makeArtifact({
    type: "launch-plan",
    title: "MVP Foundation Package",
    producingAgentId: "launch",
    sourceNodeId: "launch",
    confidence: Math.max(state.readinessScore, state.validationConfidence),
    summary: "Final package contains validation decision, PRD summary, MVP scope, risks, and next actions.",
    content: launchData.launchPackage,
    dependencies: [implementationArtifact.id, prototypeBuildArtifact.id, designArtifact.id],
    evidenceSource: launchAgent.mode === "real-ready" ? "openai" : "deterministic-local",
    version: 2,
    reviewStatus: "reviewed",
    approvalStatus: "approved",
  });

  return {
    tasks: state.tasks.map((task) =>
      task.owner === "Launch Agent" || task.owner === "Designer Agent" || task.owner === "Build Orchestrator Agent"
        ? { ...task, status: "done" }
        : task,
    ),
    artifacts: [implementationArtifact, prototypeBuildArtifact, designArtifact, launchArtifact],
    memory: [
      makeMemory(
        "Launch package ready",
        "The final MVP foundation package is ready for local export from the Launch workspace.",
        "decision",
        [launchArtifact.id],
      ),
    ],
    logs: [
      makeLog(launchAgent.logMessage, launchAgent.mode === "real-ready" ? "validation" : "warning", "launch", "build-orchestrator"),
      makeLog("Build Orchestrator Agent created approval-backed implementation plan.", "agent", "launch", "build-orchestrator"),
      makeLog("Designer Agent produced approved Design Validation Report.", "validation", "launch", "designer"),
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

const BranchAnnotation = Annotation.Root({
  decision: Annotation<BranchDecision["decision"]>(),
  rejectionReason: Annotation<PrototypeRejectionReason | "none">({
    reducer: stateReducer,
    default: () => "none",
  }),
  fromWorkspace: Annotation<WorkspaceId>({
    reducer: stateReducer,
    default: () => "synthesis",
  }),
  toWorkspace: Annotation<WorkspaceId>({
    reducer: stateReducer,
    default: () => "synthesis",
  }),
  route: Annotation<string[]>({
    reducer: stateReducer,
    default: () => [],
  }),
  reason: Annotation<string>({
    reducer: stateReducer,
    default: () => "",
  }),
});

type BranchState = typeof BranchAnnotation.State;

const routeBranch = (state: BranchState) => {
  if (state.decision === "synthesis-approved") {
    return "toDeployment";
  }
  if (state.decision === "synthesis-rerun") {
    return "toIntake";
  }
  if (state.decision === "prototype-approved") {
    return "toLaunch";
  }
  if (state.decision === "prototype-regenerated") {
    return "toDeploymentRevision";
  }
  if (state.decision === "prototype-rejected") {
    if (state.rejectionReason === "revise-prompt") return "toIntake";
    if (state.rejectionReason === "revise-prd") return "toPrd";
    if (state.rejectionReason === "return-synthesis") return "toSynthesis";
    return "toDeploymentRevision";
  }
  return "toSynthesis";
};

const branchGraph = new StateGraph(BranchAnnotation)
  .addNode("router", (state) => ({
    reason: `Evaluating ${state.decision} with reason ${state.rejectionReason}.`,
  }))
  .addNode("toDeployment", () => ({
    toWorkspace: "deployment" as const,
    route: ["synthesis", "deployment"],
    reason: "Synthesis approval unlocked Deployment prototype review.",
  }))
  .addNode("toLaunch", () => ({
    toWorkspace: "launch" as const,
    route: ["deployment", "launch"],
    reason: "Prototype approval unlocked Launch and build-preparation agents.",
  }))
  .addNode("toIntake", () => ({
    toWorkspace: "intake" as const,
    route: ["deployment", "intake"],
    reason: "Branch routed back to Intake and prompt revision because upstream framing needs correction.",
  }))
  .addNode("toPrd", () => ({
    toWorkspace: "prd" as const,
    route: ["deployment", "prd"],
    reason: "Branch routed back to PRD Generation because requirements need revision before prototype approval.",
  }))
  .addNode("toSynthesis", () => ({
    toWorkspace: "synthesis" as const,
    route: ["deployment", "synthesis"],
    reason: "Branch routed back to Synthesis for plan revision before Deployment can proceed.",
  }))
  .addNode("toDeploymentRevision", () => ({
    toWorkspace: "deployment" as const,
    route: ["deployment", "deployment"],
    reason: "Branch stayed in Deployment and requested regenerated prototype direction.",
  }))
  .addEdge(START, "router")
  .addConditionalEdges("router", routeBranch, [
    "toDeployment",
    "toLaunch",
    "toIntake",
    "toPrd",
    "toSynthesis",
    "toDeploymentRevision",
  ])
  .addEdge("toDeployment", END)
  .addEdge("toLaunch", END)
  .addEdge("toIntake", END)
  .addEdge("toPrd", END)
  .addEdge("toSynthesis", END)
  .addEdge("toDeploymentRevision", END)
  .compile();

export const resolveBranchDecision = async (
  decision: BranchDecision["decision"],
  rejectionReason: PrototypeRejectionReason | "none" = "none",
): Promise<BranchDecision> => {
  const fromWorkspace: WorkspaceId =
    decision.startsWith("synthesis") ? "synthesis" : "deployment";
  const result = await branchGraph.invoke({
    decision,
    rejectionReason,
    fromWorkspace,
    toWorkspace: fromWorkspace,
    route: [],
    reason: "",
  });

  return {
    id: id("branch"),
    timestamp: now(),
    decision,
    fromWorkspace,
    toWorkspace: result.toWorkspace,
    reason: result.reason,
    langGraphRoute: result.route.length > 0 ? result.route : [fromWorkspace, result.toWorkspace],
  };
};

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
  operatingMode: "autonomous",
  synthesisApproval: "pending",
  prototypeApproval: "not-started",
  designValidation: "not-started",
  selectedPrototypeAssetId: undefined,
  prototypeRejectionReason: "regenerate-prototype",
  branchDecisions: [],
  generatedAt: now(),
  updatedAt: now(),
});

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

const materializeAgents = (step: number, artifacts: Artifact[]): AgentState[] =>
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
    marketSignals: [],
    competitors: [],
    personas: [],
    risks: [],
    marketLeads: [],
    assumptionTests: [],
    prototypeAssets: [],
    tasks: [],
  });

  return {
    project: createProject(rawIdea, result),
    agents: materializeAgents(0, result.artifacts),
    nodes: materializeNodes(0, result.artifacts),
    artifacts: result.artifacts,
    logs: result.logs,
    memory: result.memory,
    marketSignals: result.marketSignals,
    competitors: result.competitors,
    personas: result.personas,
    risks: result.risks,
    marketLeads: result.marketLeads,
    assumptionTests: result.assumptionTests,
    prototypeAssets: result.prototypeAssets,
    tasks: result.tasks,
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
