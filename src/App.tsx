import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  Activity,
  Boxes,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Cpu,
  Download,
  FileText,
  Gauge,
  GitBranch,
  Layers3,
  Pause,
  Play,
  Radar,
  RefreshCcw,
  Rocket,
  Search,
  ShieldCheck,
  StepForward,
  Sparkles,
  Upload,
  Zap,
} from "lucide-react";
import { clsx } from "clsx";
import { initialNodes, workspaces } from "./data";
import { runOpenAiAgent, runPrototypeGeneration } from "./integrations";
import { analyzePromptQuality, buildImprovedPromptSuggestion } from "./promptQuality";
import { createEmptyPackage, revealPackageStep } from "./runtimePackage";
import type {
  AgentState,
  Artifact,
  ExecutionLog,
  MemoryEntry,
  OrchestrationPackage,
  PersistedAppState,
  PrototypeAsset,
  PrototypeRejectionReason,
  WorkspaceId,
  WorkflowNode,
} from "./types";

const STORAGE_KEY = "conductoriq.runtime.v1";
const FULL_PACKAGE_KEY = "conductoriq.fullPackage.v1";
export const STORAGE_SCHEMA_VERSION = 2;
const sampleIdea = "";

type DesignCheck = {
  label: string;
  status: "approved" | "blocked";
  detail: string;
};

type ExportFormat = "html" | "markdown" | "json";

const statusTone: Record<string, string> = {
  idle: "border-slate-700 bg-slate-900/80 text-slate-400",
  queued: "border-cyan-400/30 bg-cyan-400/10 text-cyan-200",
  running: "border-cyan-300/70 bg-cyan-300/15 text-cyan-100 shadow-cyan",
  waiting: "border-slate-700 bg-slate-900/70 text-slate-500",
  validating: "border-blue-400/50 bg-blue-400/10 text-blue-100",
  critiquing: "border-fuchsia-400/60 bg-fuchsia-400/10 text-fuchsia-100",
  revising: "border-amber-300/60 bg-amber-300/10 text-amber-100",
  completed: "border-emerald-300/50 bg-emerald-300/10 text-emerald-100",
  failed: "border-red-400/60 bg-red-400/10 text-red-100",
  fallback: "border-orange-300/60 bg-orange-300/10 text-orange-100",
  retrying: "border-orange-300/60 bg-orange-300/10 text-orange-100",
  paused: "border-slate-600 bg-slate-800 text-slate-300",
  pending: "border-amber-300/60 bg-amber-300/10 text-amber-100",
  generating: "border-cyan-300/70 bg-cyan-300/15 text-cyan-100",
  draft: "border-blue-300/50 bg-blue-300/10 text-blue-100",
  "under-review": "border-fuchsia-400/60 bg-fuchsia-400/10 text-fuchsia-100",
  "revision-requested": "border-orange-300/60 bg-orange-300/10 text-orange-100",
  approved: "border-emerald-300/50 bg-emerald-300/10 text-emerald-100",
  rejected: "border-red-400/60 bg-red-400/10 text-red-100",
  blocked: "border-red-400/60 bg-red-400/10 text-red-100",
  "not-started": "border-slate-700 bg-slate-900/80 text-slate-400",
  superseded: "border-slate-600 bg-slate-800 text-slate-300",
  "awaiting-user-approval": "border-amber-300/60 bg-amber-300/10 text-amber-100",
  "user-rejected": "border-red-400/60 bg-red-400/10 text-red-100",
  regenerating: "border-fuchsia-300/60 bg-fuchsia-300/10 text-fuchsia-100",
};

const recommendationTone: Record<string, string> = {
  pending: "text-slate-300",
  pursue: "text-emerald-200",
  refine: "text-amber-200",
  reject: "text-red-200",
};

const loadStoredState = (): {
  visible: PersistedAppState;
  full: OrchestrationPackage | null;
} => {
  if (typeof window === "undefined") {
    const emptyPackage = createEmptyPackage();
    return { visible: normalizeRuntime({ ...emptyPackage, selectedWorkspace: "intake", isRunning: false }), full: null };
  }

  try {
    const visibleRaw = window.localStorage.getItem(STORAGE_KEY);
    const fullRaw = window.localStorage.getItem(FULL_PACKAGE_KEY);
    if (visibleRaw) {
      const visible = normalizeRuntime(JSON.parse(visibleRaw) as PersistedAppState);
      return {
        visible,
        full: fullRaw ? normalizePackage(JSON.parse(fullRaw) as OrchestrationPackage) : null,
      };
    }
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(FULL_PACKAGE_KEY);
  }

  const emptyPackage = createEmptyPackage();
  return { visible: normalizeRuntime({ ...emptyPackage, selectedWorkspace: "intake", isRunning: false }), full: null };
};

export const normalizePackage = (value: Partial<OrchestrationPackage>): OrchestrationPackage => {
  const emptyPackage = createEmptyPackage();
  const project = value.project ?? emptyPackage.project;
  const normalizePrototypeAttemptCount = (
    asset: Partial<OrchestrationPackage["prototypeAssets"][number]>,
  ) => {
    if (asset.telemetryStatus === "not-attempted") {
      return asset.attemptCount ?? 0;
    }

    if (asset.provider === "gpt-image-2" || asset.provider === "fallback" || asset.status === "fallback") {
      return Math.max(asset.attemptCount ?? 1, 1);
    }

    return asset.attemptCount ?? 0;
  };

  return {
    ...emptyPackage,
    ...value,
    project: {
      ...emptyPackage.project,
      ...project,
      operatingMode: project.operatingMode ?? (project.status === "completed" ? "completed" : "paused"),
      synthesisApproval: project.synthesisApproval ?? "not-started",
      prototypeApproval: project.prototypeApproval ?? "not-started",
      designValidation: project.designValidation ?? "not-started",
      selectedPrototypeAssetId: project.selectedPrototypeAssetId,
      prototypeRejectionReason: project.prototypeRejectionReason ?? "regenerate-prototype",
      branchDecisions: project.branchDecisions ?? [],
    },
    nodes: (value.nodes ?? emptyPackage.nodes).map((node) => {
    const baseline = initialNodes.find((initialNode) => initialNode.id === node.id);
    return {
      ...node,
      stage: node.stage ?? baseline?.stage ?? node.label,
      requiredArtifactTypes: node.requiredArtifactTypes ?? baseline?.requiredArtifactTypes ?? [],
      validationCriteria: node.validationCriteria ?? baseline?.validationCriteria ?? [],
      nextNodeIds: node.nextNodeIds ?? baseline?.nextNodeIds ?? [],
    };
  }),
    agents: value.agents ?? emptyPackage.agents,
    artifacts: value.artifacts ?? [],
    logs: value.logs ?? emptyPackage.logs,
    memory: value.memory ?? [],
    marketSignals: value.marketSignals ?? [],
    competitors: value.competitors ?? [],
    personas: value.personas ?? [],
    risks: value.risks ?? [],
    marketLeads: value.marketLeads ?? [],
    assumptionTests: value.assumptionTests ?? [],
  prototypeAssets: (value.prototypeAssets ?? []).map((asset, index) => ({
    ...asset,
    variant: asset.variant ?? (index === 0 ? "primary" : "workflow"),
    rationale: asset.rationale ?? "Prototype direction awaiting review.",
    reviewStatus: asset.reviewStatus ?? "pending",
    telemetryStatus: asset.telemetryStatus ?? (asset.status === "generated" ? "generated" : "fallback"),
    attemptCount: normalizePrototypeAttemptCount(asset),
    failureReason:
      asset.failureReason ??
      (asset.status === "fallback" || asset.provider === "fallback"
        ? "GPT Image 2 was unavailable or this saved snapshot predated image telemetry; ConductorIQ preserved a labelled visual-prompt fallback."
        : undefined),
    lastAttemptAt: asset.lastAttemptAt ?? asset.createdAt ?? new Date().toISOString(),
  })),
    tasks: value.tasks ?? [],
  };
};

export const normalizeRuntime = (value: Partial<PersistedAppState>): PersistedAppState => ({
  ...normalizePackage(value),
  schemaVersion: STORAGE_SCHEMA_VERSION,
  selectedWorkspace: value.selectedWorkspace ?? "intake",
  isRunning: value.isRunning ?? false,
});

const formatTime = (timestamp: string) =>
  new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(timestamp));

const clientLog = (
  message: string,
  level: ExecutionLog["level"],
  nodeId: WorkspaceId,
  agentId: string,
): ExecutionLog => ({
  id: `client-log-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
  timestamp: new Date().toISOString(),
  level,
  nodeId,
  agentId,
  message,
});

const nextArtifactVersion = (
  artifacts: Artifact[],
  type: Artifact["type"],
  sourceNodeId: WorkspaceId,
) =>
  Math.max(
    0,
    ...artifacts
      .filter((artifact) => artifact.type === type && artifact.sourceNodeId === sourceNodeId)
      .map((artifact) => artifact.version),
  ) + 1;

const clientArtifact = (params: {
  type: Artifact["type"];
  title: string;
  status: Artifact["status"];
  producingAgentId: string;
  sourceNodeId: WorkspaceId;
  dependencyArtifactIds: string[];
  version: number;
  confidence: number;
  summary: string;
  content: string;
  evidenceSource?: Artifact["evidenceSource"];
  reviewStatus?: Artifact["reviewStatus"];
  approvalStatus?: Artifact["approvalStatus"];
}): Artifact => ({
  id: `client-artifact-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
  updatedAt: new Date().toISOString(),
  ...params,
});

const clientMemory = (
  category: MemoryEntry["category"],
  title: string,
  content: string,
  sourceArtifactIds: string[],
): MemoryEntry => ({
  id: `client-memory-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
  category,
  title,
  content,
  sourceArtifactIds,
  createdAt: new Date().toISOString(),
});

const runGraphRuntime = async (rawIdea: string) => {
  const { runConductorGraph } = await import("./orchestration");
  return runConductorGraph(rawIdea);
};

const resolveWorkflowBranch = async (
  ...args: Parameters<typeof import("./orchestration").resolveBranchDecision>
) => {
  const { resolveBranchDecision } = await import("./orchestration");
  return resolveBranchDecision(...args);
};

const appendWorkflowEvents = <T extends OrchestrationPackage>(
  packageState: T,
  events: {
    artifacts?: Artifact[];
    logs?: ExecutionLog[];
    memory?: MemoryEntry[];
    prototypeAssets?: PrototypeAsset[];
    project?: Partial<OrchestrationPackage["project"]>;
  },
): T => {
  const artifacts = events.artifacts ?? [];
  const prototypeAssets = [...packageState.prototypeAssets];
  for (const asset of events.prototypeAssets ?? []) {
    const existingIndex = prototypeAssets.findIndex((existing) => existing.id === asset.id);
    if (existingIndex >= 0) {
      prototypeAssets[existingIndex] = { ...prototypeAssets[existingIndex], ...asset };
    } else {
      prototypeAssets.push(asset);
    }
  }
  return {
    ...packageState,
    artifacts: [...packageState.artifacts, ...artifacts],
    logs: [...packageState.logs, ...(events.logs ?? [])],
    memory: [...packageState.memory, ...(events.memory ?? [])],
    prototypeAssets,
    nodes: packageState.nodes.map((node) => {
      const nodeArtifactIds = artifacts
        .filter((artifact) => artifact.sourceNodeId === node.id)
        .map((artifact) => artifact.id);
      return nodeArtifactIds.length > 0
        ? { ...node, outputArtifactIds: [...node.outputArtifactIds, ...nodeArtifactIds] }
        : node;
    }),
    project: {
      ...packageState.project,
      ...(events.project ?? {}),
      updatedAt: new Date().toISOString(),
    },
  };
};

const parseRgb = (value: string): [number, number, number] | null => {
  const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) {
    return null;
  }
  return [Number(match[1]), Number(match[2]), Number(match[3])];
};

const luminance = ([red, green, blue]: [number, number, number]) => {
  const transform = (channel: number) => {
    const normalized = channel / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * transform(red) + 0.7152 * transform(green) + 0.0722 * transform(blue);
};

const contrastRatio = (foreground: string, background: string) => {
  const foregroundRgb = parseRgb(foreground);
  const backgroundRgb = parseRgb(background) ?? [4, 5, 11] as [number, number, number];
  if (!foregroundRgb) {
    return 7;
  }
  const lighter = Math.max(luminance(foregroundRgb), luminance(backgroundRgb));
  const darker = Math.min(luminance(foregroundRgb), luminance(backgroundRgb));
  return (lighter + 0.05) / (darker + 0.05);
};

const hasMeaningfulOverlap = (first: DOMRect, second: DOMRect) => {
  const width = Math.max(0, Math.min(first.right, second.right) - Math.max(first.left, second.left));
  const height = Math.max(0, Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top));
  return width * height > 400;
};

const workspaceIcon = (id: WorkspaceId) => {
  const iconMap = {
    intake: FileText,
    strategy: Radar,
    prd: BrainCircuit,
    synthesis: GitBranch,
    deployment: Cpu,
    launch: Rocket,
  };
  return iconMap[id];
};

function App() {
  const initialState = loadStoredState();
  const [idea, setIdea] = useState(initialState.visible.project.rawIdea || sampleIdea);
  const [runtime, setRuntime] = useState<PersistedAppState>(initialState.visible);
  const [fullPackage, setFullPackage] = useState<OrchestrationPackage | null>(initialState.full);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isVisualising, setIsVisualising] = useState(false);
  const [isApprovingPrototype, setIsApprovingPrototype] = useState(false);
  const [isRefiningPrompt, setIsRefiningPrompt] = useState(false);
  const [refinedPrompt, setRefinedPrompt] = useState("");
  const [promptRefinementSource, setPromptRefinementSource] = useState<"openai" | "deterministic-local" | "idle">("idle");
  const [error, setError] = useState("");
  const [tickMs, setTickMs] = useState(1600);
  const [designChecks, setDesignChecks] = useState<DesignCheck[]>([]);
  const fullPackageRef = useRef<OrchestrationPackage | null>(initialState.full);

  const revealWithGateState = (
    orchestration: OrchestrationPackage,
    step: number,
    current: PersistedAppState,
  ): PersistedAppState => {
    const visible = revealPackageStep(orchestration, step);
    const synthesisHoldActive = step >= 3 && current.project.synthesisApproval !== "approved";
    const prototypeHoldActive = step >= 4 && current.project.prototypeApproval !== "approved";
    const nextProject = {
      ...visible.project,
      status: synthesisHoldActive || prototypeHoldActive ? "paused" : visible.project.status,
      operatingMode:
        synthesisHoldActive || prototypeHoldActive
          ? "paused"
          : visible.project.status === "completed"
            ? "completed"
            : visible.project.operatingMode,
      synthesisApproval:
        step < 3
          ? "not-started"
          : current.project.synthesisApproval === "approved"
            ? "approved"
            : "pending",
      prototypeApproval:
        step < 4
          ? "not-started"
          : current.project.prototypeApproval === "approved"
            ? "approved"
            : current.project.prototypeApproval === "rejected"
              ? "rejected"
              : "pending",
      designValidation:
        step >= 5 && current.project.prototypeApproval === "approved"
          ? "approved"
          : step < 5
            ? "not-started"
            : current.project.designValidation,
      selectedPrototypeAssetId: current.project.selectedPrototypeAssetId ?? visible.project.selectedPrototypeAssetId,
      prototypeRejectionReason: current.project.prototypeRejectionReason ?? visible.project.prototypeRejectionReason,
      branchDecisions: current.project.branchDecisions ?? visible.project.branchDecisions,
    } satisfies PersistedAppState["project"];

    return {
      ...visible,
      schemaVersion: STORAGE_SCHEMA_VERSION,
      project: nextProject,
      nodes: visible.nodes.map((node) =>
        (synthesisHoldActive && node.id === "synthesis") || (prototypeHoldActive && node.id === "deployment")
          ? { ...node, status: "paused" }
          : node,
      ),
      prototypeAssets: visible.prototypeAssets.map((asset) => ({
        ...asset,
        reviewStatus:
          asset.id === nextProject.selectedPrototypeAssetId
            ? "selected"
            : asset.reviewStatus ?? "pending",
      })),
      selectedWorkspace: visible.project.activeWorkspace,
      isRunning: visible.project.status !== "completed" && !synthesisHoldActive && !prototypeHoldActive,
    };
  };

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(runtime));
  }, [runtime]);

  useEffect(() => {
    fullPackageRef.current = fullPackage;
    if (fullPackage) {
      window.localStorage.setItem(FULL_PACKAGE_KEY, JSON.stringify(fullPackage));
    }
  }, [fullPackage]);

  useEffect(() => {
    if (!runtime.isRunning || !fullPackageRef.current) {
      return;
    }

    const timer = window.setInterval(() => {
      setRuntime((current) => {
        if (current.project.currentStep >= 3 && current.project.synthesisApproval !== "approved") {
          return {
            ...current,
            isRunning: false,
            selectedWorkspace: "synthesis",
            project: {
              ...current.project,
              activeWorkspace: "synthesis",
              operatingMode: "paused",
              synthesisApproval: current.project.synthesisApproval === "not-started" ? "pending" : current.project.synthesisApproval,
            },
            logs: [
              ...current.logs,
              clientLog("Synthesis hold active: waiting for approve, revision, or rerun decision.", "system", "synthesis", "supervisor"),
            ],
          };
        }

        if (current.project.currentStep >= 4 && current.project.prototypeApproval !== "approved") {
          return {
            ...current,
            isRunning: false,
            selectedWorkspace: "deployment",
            project: {
              ...current.project,
              activeWorkspace: "deployment",
              operatingMode: "paused",
              prototypeApproval: current.project.prototypeApproval === "not-started" ? "pending" : current.project.prototypeApproval,
            },
            logs: [
              ...current.logs,
              clientLog("Prototype review gate active: Launch remains locked until approval.", "system", "deployment", "prototype-review"),
            ],
          };
        }

        const nextStep = Math.min(current.project.currentStep + 1, workspaces.length - 1);
        return revealWithGateState(fullPackageRef.current as OrchestrationPackage, nextStep, current);
      });
    }, tickMs);

    return () => window.clearInterval(timer);
  }, [runtime.isRunning, tickMs]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const navCount = document.querySelectorAll("[data-workspace-nav='true']").length;
      const workspaceRegion = document.querySelector("[data-design-region='workspace']");
      const contextRegion = document.querySelector("[data-design-region='context']");
      const logRegion = document.querySelector("[data-design-region='logs']");
      const workspaceRect = workspaceRegion?.getBoundingClientRect();
      const contextRect = contextRegion?.getBoundingClientRect();
      const logRect = logRegion?.getBoundingClientRect();
      const horizontalOverflow = document.documentElement.scrollWidth > window.innerWidth + 8;
      const primaryActions = Array.from(document.querySelectorAll("button")).filter((button) => {
        const rect = button.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && !button.hasAttribute("disabled");
      }).length;
      const regionOverlap =
        workspaceRect && contextRect ? hasMeaningfulOverlap(workspaceRect, contextRect) : false;
      const longContentOverflow = Array.from(document.querySelectorAll("article, pre")).filter((element) =>
        element.scrollWidth > element.clientWidth + 4,
      ).length;
      const contrastSamples = Array.from(document.querySelectorAll("button, h1, h2, h3, p, article"))
        .map((element) => {
          const style = window.getComputedStyle(element);
          return contrastRatio(style.color, style.backgroundColor);
        })
        .filter((ratio) => Number.isFinite(ratio));
      const lowContrastCount = contrastSamples.filter((ratio) => ratio < 3).length;

      setDesignChecks([
        {
          label: "Six-workspace navigation",
          status: navCount === 6 ? "approved" : "blocked",
          detail: `${navCount}/6 primary workspace buttons detected.`,
        },
        {
          label: "Workspace region",
          status: workspaceRect && workspaceRect.width > 320 && workspaceRect.height > 280 ? "approved" : "blocked",
          detail: workspaceRect ? `${Math.round(workspaceRect.width)}x${Math.round(workspaceRect.height)} visible workspace area.` : "Workspace region missing.",
        },
        {
          label: "Context panel",
          status: contextRect && contextRect.height > 280 ? "approved" : "blocked",
          detail: contextRect ? `${Math.round(contextRect.width)}x${Math.round(contextRect.height)} context panel available.` : "Context region missing.",
        },
        {
          label: "Execution logs",
          status: logRect && logRect.height > 80 ? "approved" : "blocked",
          detail: logRect ? `${Math.round(logRect.height)}px log stream with scroll container.` : "Log stream missing.",
        },
        {
          label: "Horizontal overflow",
          status: horizontalOverflow ? "blocked" : "approved",
          detail: horizontalOverflow ? "Page has horizontal overflow beyond viewport." : "No document-level horizontal overflow detected.",
        },
        {
          label: "Primary actions",
          status: primaryActions > 0 ? "approved" : "blocked",
          detail: `${primaryActions} enabled visible actions detected for the current workspace.`,
        },
        {
          label: "Region overlap",
          status: regionOverlap ? "blocked" : "approved",
          detail: regionOverlap ? "Workspace and context regions overlap." : "No workspace/context panel overlap detected.",
        },
        {
          label: "Long content containment",
          status: longContentOverflow > 0 ? "blocked" : "approved",
          detail:
            longContentOverflow > 0
              ? `${longContentOverflow} long-content containers exceed their width.`
              : "Artifact and code-style content stay within their containers.",
        },
        {
          label: "Contrast sample",
          status: lowContrastCount > 0 ? "blocked" : "approved",
          detail:
            lowContrastCount > 0
              ? `${lowContrastCount}/${contrastSamples.length} sampled text surfaces are below 3:1 contrast.`
              : `${contrastSamples.length} sampled text surfaces meet the practical contrast threshold.`,
        },
      ]);
    }, 120);

    return () => window.clearTimeout(timer);
  }, [runtime.selectedWorkspace, runtime.project.currentStep, runtime.artifacts.length, runtime.prototypeAssets.length]);

  const activeWorkspace = workspaces.find((workspace) => workspace.id === runtime.selectedWorkspace) ?? workspaces[0];
  const activeArtifacts = runtime.artifacts.filter((artifact) => artifact.sourceNodeId === activeWorkspace.id);
  const visibleLogs = runtime.logs.slice(-12).reverse();

  const updateIdea = (nextIdea: string) => {
    setIdea(nextIdea);
    setRefinedPrompt("");
    setPromptRefinementSource("idle");
  };

  const startWorkflow = async () => {
    const trimmedIdea = idea.trim();
    if (!trimmedIdea) {
      setError("Enter a startup idea before activating the orchestration runtime.");
      return;
    }

    setError("");
    setIsGenerating(true);

    try {
      const graphPackage = await runGraphRuntime(trimmedIdea);
      const visible = revealWithGateState(graphPackage, 0, {
        ...normalizeRuntime({ ...createEmptyPackage(), selectedWorkspace: "intake", isRunning: false }),
      });
      setFullPackage(graphPackage);
      setRuntime({
        ...visible,
        selectedWorkspace: "intake",
        isRunning: true,
      });
    } catch (graphError) {
      setError(graphError instanceof Error ? graphError.message : "LangGraph workflow failed to initialize.");
    } finally {
      setIsGenerating(false);
    }
  };

  const resetWorkflow = () => {
    const emptyPackage = createEmptyPackage();
    setIdea(sampleIdea);
    setFullPackage(null);
    setRuntime(normalizeRuntime({ ...emptyPackage, selectedWorkspace: "intake", isRunning: false }));
    window.localStorage.removeItem(FULL_PACKAGE_KEY);
  };

  const importBrief = async (file: File | undefined) => {
    if (!file) {
      return;
    }

    if (!file.name.endsWith(".txt") && !file.name.endsWith(".md")) {
      setError("Only .txt and .md idea briefs are supported.");
      return;
    }

    setIdea(await file.text());
    setRefinedPrompt("");
    setPromptRefinementSource("idle");
    setError("");
  };

  const refinePrompt = async () => {
    const trimmedIdea = idea.trim();
    if (!trimmedIdea) {
      setError("Enter a startup idea before refining the prompt.");
      return;
    }

    setError("");
    setIsRefiningPrompt(true);
    const promptQuality = analyzePromptQuality(trimmedIdea);
    const fallback = {
      improvedPrompt: buildImprovedPromptSuggestion(trimmedIdea, promptQuality),
      rationale:
        "Deterministic refinement added target-user, pain, missing-context, validation-question, and output-contract framing.",
    };

    try {
      const result = await runOpenAiAgent(
        "Prompt Refinement Agent",
        [
          "Rewrite the user's rough startup idea into a stronger validation prompt for ConductorIQ.",
          "Keep it concise enough for an intake field, but specific enough for market validation.",
          "Do not invent unsupported facts. Label unknown target users, pain, monetization, or differentiation as assumptions to test.",
          "Return strict JSON with improvedPrompt string and rationale string.",
        ].join(" "),
        JSON.stringify({
          rawIdea: trimmedIdea,
          promptQuality,
          requiredOutputs: [
            "market leads",
            "competitor hypotheses",
            "persona objections",
            "assumption tests",
            "risk scoring",
            "comprehensive PRD",
            "synthesis recommendation",
            "prototype direction",
          ],
        }),
        fallback,
        9000,
      );
      const improvedPrompt =
        typeof result.data.improvedPrompt === "string" && result.data.improvedPrompt.trim()
          ? result.data.improvedPrompt.trim()
          : fallback.improvedPrompt;

      setRefinedPrompt(improvedPrompt);
      setPromptRefinementSource(result.mode === "real-ready" ? "openai" : "deterministic-local");
      setRuntime((current) => ({
        ...current,
        logs: [
          ...current.logs,
          clientLog(
            result.mode === "real-ready"
              ? "Prompt Refinement Agent generated an improved prompt through the local OpenAI proxy."
              : "Prompt Refinement Agent used deterministic fallback for improved prompt suggestion.",
            result.mode === "real-ready" ? "agent" : "warning",
            "intake",
            "prompt-validator",
          ),
        ],
      }));
    } finally {
      setIsRefiningPrompt(false);
    }
  };

  const useRefinedPrompt = () => {
    const nextPrompt = refinedPrompt || buildImprovedPromptSuggestion(idea);
    if (!nextPrompt) {
      setError("Enter a startup idea before applying an improved prompt.");
      return;
    }
    setIdea(nextPrompt);
    setRefinedPrompt(nextPrompt);
    setPromptRefinementSource((current) => current === "idle" ? "deterministic-local" : current);
    setError("");
  };

  const downloadPackage = (format: ExportFormat = "html") => {
    const output =
      format === "markdown"
        ? buildMarkdownPackage(runtime)
        : format === "json"
          ? buildJsonPackage(runtime)
          : buildStaticPackage(runtime);
    const mimeType =
      format === "markdown"
        ? "text/markdown"
        : format === "json"
          ? "application/json"
          : "text/html";
    const extension = format === "markdown" ? "md" : format;
    const blob = new Blob([output], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `conductoriq-mvp-package.${extension}`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const pauseWorkflow = () => {
    setRuntime((current) => ({
      ...current,
      isRunning: false,
      project: { ...current.project, operatingMode: "paused" },
    }));
  };

  const resumeWorkflow = () => {
    if (!fullPackageRef.current || runtime.project.status === "completed") {
      return;
    }
    setRuntime((current) => ({
      ...current,
      isRunning: true,
      project: { ...current.project, operatingMode: "autonomous" },
    }));
  };

  const stepWorkflow = () => {
    if (!fullPackageRef.current) {
      return;
    }
    setRuntime((current) => {
      if (current.project.currentStep >= 3 && current.project.synthesisApproval !== "approved") {
        return {
          ...current,
          isRunning: false,
          selectedWorkspace: "synthesis",
          project: {
            ...current.project,
            activeWorkspace: "synthesis",
            operatingMode: "paused",
            synthesisApproval: current.project.synthesisApproval === "not-started" ? "pending" : current.project.synthesisApproval,
          },
          logs: [
            ...current.logs,
            clientLog("Manual step blocked by Synthesis approval gate.", "warning", "synthesis", "supervisor"),
          ],
        };
      }
      if (current.project.currentStep >= 4 && current.project.prototypeApproval !== "approved") {
        return {
          ...current,
          isRunning: false,
          selectedWorkspace: "deployment",
          project: {
            ...current.project,
            activeWorkspace: "deployment",
            operatingMode: "paused",
            prototypeApproval: current.project.prototypeApproval === "not-started" ? "pending" : current.project.prototypeApproval,
          },
          logs: [
            ...current.logs,
            clientLog("Manual step blocked by prototype approval gate.", "warning", "deployment", "prototype-review"),
          ],
        };
      }
      const nextStep = Math.min(current.project.currentStep + 1, workspaces.length - 1);
      const visible = revealWithGateState(fullPackageRef.current as OrchestrationPackage, nextStep, current);
      return {
        ...visible,
        selectedWorkspace: visible.project.activeWorkspace,
        isRunning: false,
        project: { ...visible.project, operatingMode: visible.project.status === "completed" ? "completed" : "paused" },
      };
    });
  };

  const syncFullPackageEvents = (events: Parameters<typeof appendWorkflowEvents>[1]) => {
    setFullPackage((current) => {
      if (!current) {
        return current;
      }
      const next = appendWorkflowEvents(current, events);
      fullPackageRef.current = next;
      return next;
    });
  };

  const approveSynthesis = async () => {
    if (!fullPackageRef.current) {
      return;
    }
    const branch = await resolveWorkflowBranch("synthesis-approved");
    syncFullPackageEvents({
      project: {
        synthesisApproval: "approved",
        branchDecisions: [...runtime.project.branchDecisions, branch],
      },
      logs: [
        clientLog(`LangGraph branch routed ${branch.langGraphRoute.join(" -> ")}: ${branch.reason}`, "system", "synthesis", "supervisor"),
      ],
    });
    setRuntime((current) => {
      const approvedCurrent = {
        ...current,
        project: {
          ...current.project,
          synthesisApproval: "approved" as const,
          branchDecisions: [...current.project.branchDecisions, branch],
        },
      };
      const visible = revealWithGateState(fullPackageRef.current as OrchestrationPackage, 4, approvedCurrent);
      return {
        ...visible,
        isRunning: false,
        selectedWorkspace: "deployment",
        project: {
          ...visible.project,
          operatingMode: "paused",
          synthesisApproval: "approved",
          prototypeApproval: "pending",
          branchDecisions: [...current.project.branchDecisions, branch],
        },
        logs: [
          ...visible.logs,
          clientLog(`LangGraph branch routed ${branch.langGraphRoute.join(" -> ")}: ${branch.reason}`, "system", "synthesis", "supervisor"),
          clientLog("User approved Synthesis Plan; Deployment prototype review unlocked.", "validation", "synthesis", "supervisor"),
        ],
      };
    });
  };

  const requestSynthesisRevision = async () => {
    const branch = await resolveWorkflowBranch("synthesis-revision");
    const dependencyArtifactIds = runtime.artifacts
      .filter((artifact) => artifact.sourceNodeId === "synthesis" || artifact.sourceNodeId === "prd")
      .map((artifact) => artifact.id);
    const revisionArtifact = clientArtifact({
      type: "synthesis-plan",
      title: "Synthesis Revision Request",
      status: "revision-requested",
      producingAgentId: "qa-critic",
      sourceNodeId: "synthesis",
      dependencyArtifactIds,
      version: nextArtifactVersion(runtime.artifacts, "synthesis-plan", "synthesis"),
      confidence: 72,
      summary: "User requested a synthesis revision before prototype generation can proceed.",
      content: [
        "Revision reason: downstream Deployment remains locked until the Synthesis Plan is accepted or rerun.",
        "Required checks: revisit weak assumptions, confirm the MVP boundary, refresh validation questions, and tighten interface improvement notes.",
        "Routing decision: hold at Synthesis and either rerun validation from Intake/Strategy or approve the revised direction.",
      ].join("\n"),
      evidenceSource: "user-input",
      reviewStatus: "revision-required",
      approvalStatus: "pending",
    });
    const revisionLog = clientLog(
      "User requested Synthesis revision; a versioned revision artifact was added and Deployment remains locked.",
      "warning",
      "synthesis",
      "qa-critic",
    );
    const revisionMemory = clientMemory(
      "revision",
      "Synthesis revision requested",
      "The user blocked prototype generation pending an improved Synthesis Plan or full validation rerun.",
      [revisionArtifact.id],
    );
    const events = {
      artifacts: [revisionArtifact],
      logs: [revisionLog],
      memory: [revisionMemory],
      project: {
        synthesisApproval: "revision-requested" as const,
        branchDecisions: [...runtime.project.branchDecisions, branch],
      },
    } satisfies Parameters<typeof appendWorkflowEvents>[1];

    syncFullPackageEvents(events);
    setRuntime((current) => ({
      ...appendWorkflowEvents(current, events),
      isRunning: false,
      selectedWorkspace: "synthesis",
      project: {
        ...current.project,
        activeWorkspace: "synthesis",
        operatingMode: "paused",
        synthesisApproval: "revision-requested",
        branchDecisions: [...current.project.branchDecisions, branch],
      },
      logs: [
        ...appendWorkflowEvents(current, events).logs,
        clientLog(`LangGraph branch held ${branch.langGraphRoute.join(" -> ")}: ${branch.reason}`, "system", "synthesis", "supervisor"),
      ],
    }));
  };

  const rerunValidation = async () => {
    const branch = await resolveWorkflowBranch("synthesis-rerun");
    setRuntime((current) => ({
      ...current,
      isRunning: false,
      selectedWorkspace: "intake",
      project: {
        ...current.project,
        activeWorkspace: "intake",
        operatingMode: "paused",
        synthesisApproval: "not-started",
        prototypeApproval: "not-started",
        designValidation: "not-started",
        branchDecisions: [...current.project.branchDecisions, branch],
      },
      logs: [
        ...current.logs,
        clientLog(`LangGraph branch routed ${branch.langGraphRoute.join(" -> ")}: ${branch.reason}`, "system", "synthesis", "supervisor"),
        clientLog("User requested a full validation rerun from the Synthesis hold.", "system", "synthesis", "supervisor"),
      ],
    }));
    void startWorkflow();
  };

  const selectPrototype = (assetId: string) => {
    const updatedAssets = runtime.prototypeAssets.map((asset) => ({
      ...asset,
      reviewStatus: asset.id === assetId ? "selected" as const : "pending" as const,
    }));
    const selectedAsset = updatedAssets.find((asset) => asset.id === assetId);
    const selectionLog = clientLog(
      `Prototype option selected for review: ${selectedAsset?.title ?? assetId}.`,
      "validation",
      "deployment",
      "prototype-review",
    );

    syncFullPackageEvents({
      prototypeAssets: updatedAssets,
      logs: [selectionLog],
      project: { selectedPrototypeAssetId: assetId },
    });
    setRuntime((current) => ({
      ...current,
      prototypeAssets: updatedAssets,
      logs: [...current.logs, selectionLog],
      project: {
        ...current.project,
        selectedPrototypeAssetId: assetId,
        updatedAt: new Date().toISOString(),
      },
    }));
  };

  const approvePrototype = async () => {
    if (isApprovingPrototype) {
      return;
    }
    setIsApprovingPrototype(true);
    const sourcePackage = fullPackageRef.current ?? runtime;
    const selectedAssetId = runtime.project.selectedPrototypeAssetId ?? runtime.prototypeAssets[0]?.id;
    const branch = await resolveWorkflowBranch("prototype-approved");
    const selectedAssets = runtime.prototypeAssets.map((asset) => ({
      ...asset,
      reviewStatus: asset.id === selectedAssetId ? "selected" as const : "superseded" as const,
    }));
    const selectedAsset = selectedAssets.find((asset) => asset.id === selectedAssetId) ?? selectedAssets[0];
    const prototypeBuildArtifact = clientArtifact({
      type: "mvp-plan",
      title: "Approved Prototype Build Scaffold",
      status: "approved",
      producingAgentId: "build-orchestrator",
      sourceNodeId: "launch",
      confidence: Math.max(runtime.project.readinessScore, 82),
      summary: "Build Orchestrator converted the approved prototype direction into a static local prototype scaffold.",
      content: [
        `Approved direction: ${selectedAsset?.title ?? "Prototype direction"} (${selectedAsset?.provider ?? "fallback"}).`,
        "",
        "Prototype surface:",
        "- Hero validation console with final recommendation, confidence, and primary next action.",
        "- Six-workspace progress rail: Intake, Strategy, PRD Generation, Synthesis, Deployment, Launch.",
        "- Market evidence panel showing leads, competitors, personas, assumption tests, and risk flags.",
        "- Prototype preview section using the approved visual direction.",
        "- Launch package section with implementation plan, component map, export actions, and next steps.",
        "",
        "Starter component scaffold:",
        "<PrototypeShell>",
        "  <ValidationHero />",
        "  <WorkspaceProgressRail />",
        "  <MarketEvidencePanel />",
        "  <ApprovedPrototypePreview />",
        "  <LaunchPackageSummary />",
        "</PrototypeShell>",
        "",
        `Prototype prompt: ${selectedAsset?.prompt ?? "No prototype prompt recorded."}`,
      ].join("\n"),
      dependencyArtifactIds: [
        ...runtime.artifacts.filter((artifact) => artifact.sourceNodeId === "deployment" || artifact.sourceNodeId === "synthesis").map((artifact) => artifact.id),
        selectedAsset?.id ?? "selected-prototype",
      ],
      version: nextArtifactVersion(runtime.artifacts, "mvp-plan", "launch"),
      evidenceSource: "deterministic-local",
      reviewStatus: "reviewed",
      approvalStatus: "approved",
    });
    syncFullPackageEvents({
      prototypeAssets: selectedAssets,
      project: {
        selectedPrototypeAssetId: selectedAssetId,
        prototypeApproval: "approved",
        designValidation: "approved",
        branchDecisions: [...runtime.project.branchDecisions, branch],
      },
      artifacts: [prototypeBuildArtifact],
      logs: [
        clientLog(`LangGraph branch routed ${branch.langGraphRoute.join(" -> ")}: ${branch.reason}`, "system", "deployment", "supervisor"),
      ],
    });
    setRuntime((current) => {
      const approvedCurrent = {
        ...current,
        prototypeAssets: selectedAssets,
        project: {
          ...current.project,
          synthesisApproval: "approved" as const,
          prototypeApproval: "approved" as const,
          designValidation: "approved" as const,
          selectedPrototypeAssetId: selectedAssetId,
          branchDecisions: [...current.project.branchDecisions, branch],
        },
      };
      const visible = revealWithGateState(sourcePackage as OrchestrationPackage, 5, approvedCurrent);
      const hasPrototypeBuild = visible.artifacts.some((artifact) => artifact.title === prototypeBuildArtifact.title);
      return {
        ...visible,
        selectedWorkspace: "launch",
        isRunning: false,
        project: {
          ...visible.project,
          status: "completed",
          operatingMode: "completed",
          synthesisApproval: "approved",
          prototypeApproval: "approved",
          designValidation: "approved",
          selectedPrototypeAssetId: selectedAssetId,
          branchDecisions: [...current.project.branchDecisions, branch],
        },
        prototypeAssets: selectedAssets,
        artifacts: hasPrototypeBuild ? visible.artifacts : [...visible.artifacts, prototypeBuildArtifact],
        logs: [
          ...visible.logs,
          clientLog(`LangGraph branch routed ${branch.langGraphRoute.join(" -> ")}: ${branch.reason}`, "system", "deployment", "supervisor"),
          clientLog("User approved prototype direction; Launch package and Design Validation Report unlocked.", "validation", "deployment", "prototype-review"),
        ],
      };
    });
    window.setTimeout(() => setIsApprovingPrototype(false), 300);
  };

  const setPrototypeRejectionReason = (reason: PrototypeRejectionReason) => {
    setRuntime((current) => ({
      ...current,
      project: {
        ...current.project,
        prototypeRejectionReason: reason,
        updatedAt: new Date().toISOString(),
      },
    }));
  };

  const rejectPrototype = async () => {
    const reason = runtime.project.prototypeRejectionReason ?? "regenerate-prototype";
    const branch = await resolveWorkflowBranch("prototype-rejected", reason);
    const reasonCopy: Record<PrototypeRejectionReason, string> = {
      "regenerate-prototype": "Regenerate the visual direction inside Deployment.",
      "revise-prompt": "Return to Intake and revise the core prompt/framing.",
      "revise-prd": "Return to PRD Generation and revise product requirements.",
      "return-synthesis": "Return to Synthesis and revise the decision plan.",
    };
    const selectedWorkspace = branch.toWorkspace;
    const rejectionArtifact = clientArtifact({
      type: "prototype",
      title: "Prototype Rejection Record",
      status: "revision-requested",
      producingAgentId: "prototype-review",
      sourceNodeId: "deployment",
      dependencyArtifactIds: runtime.artifacts
        .filter((artifact) => artifact.sourceNodeId === "deployment" || artifact.sourceNodeId === "synthesis")
        .map((artifact) => artifact.id),
      version: nextArtifactVersion(runtime.artifacts, "prototype", "deployment"),
      confidence: 64,
      summary: "The current prototype direction was rejected and must be regenerated before Launch can unlock.",
      content: [
        "Approval result: rejected.",
        `Selected rejection route: ${reason}.`,
        `Required revision: ${reasonCopy[reason]}`,
        "Launch lock: build-preparation agents remain blocked until a revised prototype is approved.",
        `LangGraph branch: ${branch.langGraphRoute.join(" -> ")}.`,
      ].join("\n"),
      evidenceSource: "user-input",
      reviewStatus: "reviewed",
      approvalStatus: "rejected",
    });
    const rejectionLog = clientLog(
      "User rejected prototype direction; Launch remains locked and a revision artifact was recorded.",
      "warning",
      "deployment",
      "prototype-review",
    );
    const rejectionMemory = clientMemory(
      "revision",
      "Prototype rejected",
      "Prototype Review Agent recorded a rejected direction and requires regeneration before Launch.",
      [rejectionArtifact.id],
    );
    const events = {
      artifacts: [rejectionArtifact],
      logs: [rejectionLog],
      memory: [rejectionMemory],
      prototypeAssets: runtime.prototypeAssets.map((asset) => ({
        ...asset,
        reviewStatus:
          asset.id === runtime.project.selectedPrototypeAssetId ? "rejected" as const : asset.reviewStatus ?? "pending" as const,
      })),
      project: {
        prototypeApproval: "rejected" as const,
        designValidation: "blocked" as const,
        prototypeRejectionReason: reason,
        branchDecisions: [...runtime.project.branchDecisions, branch],
      },
    } satisfies Parameters<typeof appendWorkflowEvents>[1];

    syncFullPackageEvents(events);
    const updatedAssets = events.prototypeAssets;
    setRuntime((current) => ({
      ...appendWorkflowEvents(current, events),
      prototypeAssets: updatedAssets,
      isRunning: false,
      selectedWorkspace,
      project: {
        ...current.project,
        activeWorkspace: selectedWorkspace,
        operatingMode: "paused",
        prototypeApproval: "rejected",
        designValidation: "blocked",
        prototypeRejectionReason: reason,
        branchDecisions: [...current.project.branchDecisions, branch],
      },
      logs: [
        ...appendWorkflowEvents(current, events).logs,
        clientLog(`LangGraph branch routed ${branch.langGraphRoute.join(" -> ")}: ${branch.reason}`, "system", "deployment", "supervisor"),
      ],
    }));
  };

  const regeneratePrototype = async () => {
    const branch = await resolveWorkflowBranch("prototype-regenerated", "regenerate-prototype");
    const version = nextArtifactVersion(runtime.artifacts, "prototype", "deployment");
    const regeneratedPrompt = [
      `Revision ${version}: Create a cinematic dark ConductorIQ prototype focused on ${runtime.project.name}.`,
      "Emphasize six-workspace navigation, approval gates, visible agent cards, market evidence, PRD review, Synthesis hold, and Launch lock states.",
      "Use cyan/purple operational accents, readable dense panels, non-overlapping cards, scrollable long content, and clear approve/reject controls.",
    ].join(" ");
    const regeneratedAsset: PrototypeAsset = {
      id: `prototype-regenerated-${Date.now().toString(36)}`,
      title: `Regenerated Prototype Direction v${version}`,
      status: "fallback",
      reviewStatus: "selected",
      telemetryStatus: "fallback",
      variant: "regenerated",
      rationale: "Regenerated after prototype rejection to satisfy the Launch approval gate.",
      prompt: regeneratedPrompt,
      provider: "fallback",
      attemptCount: 1,
      failureReason: "Regenerated locally as a labelled fallback prompt after prototype rejection.",
      lastAttemptAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    const regeneratedArtifact = clientArtifact({
      type: "prototype",
      title: `Regenerated Prototype Direction v${version}`,
      status: "fallback",
      producingAgentId: "gpt-image",
      sourceNodeId: "deployment",
      dependencyArtifactIds: runtime.artifacts
        .filter((artifact) => artifact.sourceNodeId === "deployment" || artifact.sourceNodeId === "synthesis")
        .map((artifact) => artifact.id),
      version,
      confidence: 78,
      summary: "A revised prototype direction is ready for approval using the deterministic visual-prompt fallback.",
      content: regeneratedPrompt,
      evidenceSource: "fallback",
      reviewStatus: "under-review",
      approvalStatus: "pending",
    });
    const regeneratedLog = clientLog(
      "Prototype regeneration produced a new versioned fallback prompt; approval is required before Launch.",
      "agent",
      "deployment",
      "gpt-image",
    );
    const regeneratedMemory = clientMemory(
      "revision",
      "Prototype regenerated",
      "A revised prototype prompt was generated after rejection. Launch remains locked until approval.",
      [regeneratedArtifact.id],
    );
    const events = {
      artifacts: [regeneratedArtifact],
      logs: [regeneratedLog],
      memory: [regeneratedMemory],
      prototypeAssets: [regeneratedAsset],
      project: {
        selectedPrototypeAssetId: regeneratedAsset.id,
        prototypeApproval: "pending" as const,
        designValidation: "not-started" as const,
        prototypeRejectionReason: "regenerate-prototype" as const,
        branchDecisions: [...runtime.project.branchDecisions, branch],
      },
    } satisfies Parameters<typeof appendWorkflowEvents>[1];

    syncFullPackageEvents(events);
    setRuntime((current) => ({
      ...appendWorkflowEvents(current, events),
      isRunning: false,
      selectedWorkspace: "deployment",
      project: {
        ...current.project,
        activeWorkspace: "deployment",
        operatingMode: "paused",
        prototypeApproval: "pending",
        designValidation: "not-started",
        selectedPrototypeAssetId: regeneratedAsset.id,
        prototypeRejectionReason: "regenerate-prototype",
        branchDecisions: [...current.project.branchDecisions, branch],
      },
      logs: [
        ...appendWorkflowEvents(current, events).logs,
        clientLog(`LangGraph branch routed ${branch.langGraphRoute.join(" -> ")}: ${branch.reason}`, "system", "deployment", "supervisor"),
      ],
    }));
  };

  const visualisePrototype = async () => {
    if (runtime.project.currentStep < 4) {
      const blockedLog = clientLog(
        "Visualise step blocked until Synthesis is approved and Deployment is unlocked.",
        "warning",
        "deployment",
        "gpt-image",
      );
      setRuntime((current) => ({
        ...current,
        logs: [...current.logs, blockedLog],
      }));
      return;
    }

    setIsVisualising(true);
    const version = nextArtifactVersion(runtime.artifacts, "prototype", "deployment");
    const selectedAsset = runtime.prototypeAssets.find(
      (asset) => asset.id === runtime.project.selectedPrototypeAssetId,
    );
    const visualPrompt = [
      `Visualise prototype direction v${version} for: ${runtime.project.rawIdea || runtime.project.name}.`,
      selectedAsset?.prompt ? `Base direction: ${selectedAsset.prompt}` : "",
      "Create a cinematic product interface concept, not a logo.",
      "Show the six ConductorIQ workspaces, agent activity, validation evidence, PRD review, Synthesis hold, prototype approval, and Launch readiness.",
      "Use a dark operational workspace with cyan and purple accents, clear cards, readable labels, and no overlapping panels.",
    ]
      .filter(Boolean)
      .join(" ");

    try {
      const generatedAsset = await runPrototypeGeneration(runtime.project.rawIdea, visualPrompt);
      const visualAsset: PrototypeAsset = {
        ...generatedAsset,
        title:
          generatedAsset.status === "generated"
            ? `Visualise Image Output v${version}`
            : `Visualise Prompt Fallback v${version}`,
        variant: "regenerated",
        reviewStatus: "selected",
        rationale:
          generatedAsset.status === "generated"
            ? "Explicit Visualise step generated a GPT Image 2 prototype asset for Deployment review."
            : "Explicit Visualise step preserved a labelled fallback prompt because GPT Image 2 was unavailable.",
      };
      const visualArtifact = clientArtifact({
        type: "prototype",
        title: visualAsset.title,
        status: visualAsset.status === "generated" ? "awaiting-user-approval" : "fallback",
        producingAgentId: "gpt-image",
        sourceNodeId: "deployment",
        dependencyArtifactIds: runtime.artifacts
          .filter((artifact) => artifact.sourceNodeId === "synthesis" || artifact.sourceNodeId === "deployment")
          .map((artifact) => artifact.id)
          .slice(-8),
        version,
        confidence: visualAsset.status === "generated" ? 89 : 76,
        summary:
          visualAsset.status === "generated"
            ? "GPT Image 2 generated a visual prototype asset through the explicit Visualise step."
            : "GPT Image 2 was unavailable, so ConductorIQ created a labelled visual prompt fallback for approval.",
        content: [
          `Provider: ${visualAsset.provider}.`,
          `Telemetry: ${visualAsset.telemetryStatus ?? visualAsset.status}.`,
          `Attempt count: ${visualAsset.attemptCount}.`,
          visualAsset.imageDataUrl ? "Image payload: generated and stored as a local data URL for this session." : "Image payload: unavailable.",
          visualAsset.failureReason ? `Fallback note: ${visualAsset.failureReason}` : "",
          "",
          "Visual prompt:",
          visualAsset.prompt,
        ]
          .filter(Boolean)
          .join("\n"),
        evidenceSource: visualAsset.status === "generated" ? "gpt-image-2" : "fallback",
        reviewStatus: "under-review",
        approvalStatus: "pending",
      });
      const visualLog = clientLog(
        visualAsset.status === "generated"
          ? "Visualise step generated a GPT Image 2 prototype image; approval is still required before Launch."
          : "Visualise step fell back to a labelled visual prompt; approval is still required before Launch.",
        visualAsset.status === "generated" ? "agent" : "warning",
        "deployment",
        "gpt-image",
      );
      const visualMemory = clientMemory(
        "decision",
        "Visualise step completed",
        `${visualAsset.title} is now the selected prototype direction. Launch remains locked until explicit approval.`,
        [visualArtifact.id],
      );
      const events = {
        artifacts: [visualArtifact],
        logs: [visualLog],
        memory: [visualMemory],
        prototypeAssets: [
          ...runtime.prototypeAssets.map((asset) => ({
            ...asset,
            reviewStatus:
              asset.id === visualAsset.id
                ? "selected" as const
                : asset.reviewStatus === "selected"
                  ? "superseded" as const
                  : asset.reviewStatus ?? "pending" as const,
          })),
          visualAsset,
        ],
        project: {
          selectedPrototypeAssetId: visualAsset.id,
          prototypeApproval: "pending" as const,
          designValidation: "not-started" as const,
        },
      } satisfies Parameters<typeof appendWorkflowEvents>[1];

      syncFullPackageEvents(events);
      setRuntime((current) => {
        const updated = appendWorkflowEvents(current, events);
        return {
          ...updated,
          isRunning: false,
          selectedWorkspace: "deployment",
          agents: updated.agents.map((agent) =>
            agent.id === "gpt-image"
              ? {
                  ...agent,
                  status: visualAsset.status === "generated" ? "completed" : "retrying",
                  progress: visualAsset.status === "generated" ? 100 : 72,
                  currentTask:
                    visualAsset.status === "generated"
                      ? "Generated explicit Visualise prototype image."
                      : "Generated labelled Visualise fallback prompt.",
                  outputArtifactIds: [...new Set([...agent.outputArtifactIds, visualArtifact.id])],
                  lastActivityAt: new Date().toISOString(),
                }
              : agent,
          ),
          project: {
            ...updated.project,
            activeWorkspace: "deployment",
            operatingMode: "paused",
            selectedPrototypeAssetId: visualAsset.id,
            prototypeApproval: "pending",
            designValidation: "not-started",
          },
        };
      });
    } finally {
      setIsVisualising(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#04050b] text-slate-100">
      <div className="fixed inset-0 bg-grid opacity-60" />
      <div className="fixed inset-0 bg-radial" />
      <div className="relative flex min-h-screen flex-col">
        <TopBar runtime={runtime} />
        <div className="grid flex-1 grid-cols-1 gap-4 p-4 lg:grid-cols-[260px_minmax(0,1fr)_340px]">
          <aside className="panel-glass p-3">
            <div className="mb-3 flex items-center justify-between px-2">
              <span className="mono text-[10px] uppercase tracking-[0.32em] text-cyan-200/70">Primary Workspaces</span>
              <span className="rounded-full border border-cyan-300/20 px-2 py-1 text-[10px] text-cyan-100">6 only</span>
            </div>
            <nav className="space-y-2">
              {workspaces.map((workspace, index) => (
                <WorkspaceButton
                  key={workspace.id}
                  id={workspace.id}
                  index={index}
                  active={runtime.selectedWorkspace === workspace.id}
                  completed={runtime.project.completedWorkspaces.includes(workspace.id)}
                  running={runtime.isRunning && runtime.project.activeWorkspace === workspace.id && runtime.project.status === "running"}
                  label={workspace.label}
                  description={workspace.description}
                  onClick={() => setRuntime((current) => ({ ...current, selectedWorkspace: workspace.id }))}
                />
              ))}
            </nav>
            <div className="mt-4 rounded-2xl border border-fuchsia-300/20 bg-fuchsia-400/5 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-fuchsia-100">
                <GitBranch size={16} />
                LangGraph Runtime
              </div>
              <p className="text-xs leading-5 text-slate-400">
                Local `StateGraph` coordinates the six workspace nodes, while UI ticks reveal state,
                artifacts, and logs for controlled product walkthrough pacing.
              </p>
            </div>
          </aside>

          <main className="panel-glass flex min-h-[calc(100vh-112px)] flex-col overflow-hidden" data-design-region="workspace">
            <WorkspaceHeader
              workspace={activeWorkspace}
              runtime={runtime}
              onStart={startWorkflow}
              isGenerating={isGenerating}
              onReset={resetWorkflow}
              onPause={pauseWorkflow}
              onResume={resumeWorkflow}
              onStep={stepWorkflow}
              tickMs={tickMs}
              setTickMs={setTickMs}
            />
            <div className="grid flex-1 gap-4 overflow-y-auto p-4 xl:grid-cols-[1.1fr_0.9fr]">
              <section className="space-y-4">
                {activeWorkspace.id === "intake" ? (
                  <>
                    <IntakeWorkspace
                      idea={idea}
                      setIdea={updateIdea}
                      importBrief={importBrief}
                      startWorkflow={startWorkflow}
                      isGenerating={isGenerating}
                      error={error}
                      refinedPrompt={refinedPrompt}
                      promptRefinementSource={promptRefinementSource}
                      isRefiningPrompt={isRefiningPrompt}
                      onRefinePrompt={refinePrompt}
                      onUseRefinedPrompt={useRefinedPrompt}
                    />
                    {activeArtifacts.length > 0 ? (
                      <div className="space-y-3">
                        {activeArtifacts.map((artifact) => (
                          <ArtifactCard key={artifact.id} artifact={artifact} />
                        ))}
                      </div>
                    ) : null}
                  </>
                ) : (
                  <WorkspaceIntelligence
                    workspaceId={activeWorkspace.id}
                    artifacts={activeArtifacts}
                    runtime={runtime}
                    onSelectPrototype={selectPrototype}
                    onVisualisePrototype={visualisePrototype}
                    isVisualising={isVisualising}
                    deploymentGate={
                      <ApprovalGatePanel
                        runtime={runtime}
                        activeWorkspace={activeWorkspace.id}
                        onApproveSynthesis={approveSynthesis}
                        onRequestSynthesisRevision={requestSynthesisRevision}
                        onRerunValidation={rerunValidation}
                        onApprovePrototype={approvePrototype}
                        onRejectPrototype={rejectPrototype}
                        onRegeneratePrototype={regeneratePrototype}
                        onSetPrototypeRejectionReason={setPrototypeRejectionReason}
                      />
                    }
                  />
                )}
                {activeWorkspace.id !== "deployment" ? (
                  <ApprovalGatePanel
                    runtime={runtime}
                    activeWorkspace={activeWorkspace.id}
                    onApproveSynthesis={approveSynthesis}
                    onRequestSynthesisRevision={requestSynthesisRevision}
                    onRerunValidation={rerunValidation}
                    onApprovePrototype={approvePrototype}
                    onRejectPrototype={rejectPrototype}
                    onRegeneratePrototype={regeneratePrototype}
                    onSetPrototypeRejectionReason={setPrototypeRejectionReason}
                  />
                ) : null}
                <OrchestrationGraph nodes={runtime.nodes} activeWorkspace={runtime.project.activeWorkspace} />
              </section>

              <section className="space-y-4">
                <AgentGrid agents={runtime.agents} />
                <ReadinessPanel runtime={runtime} onDownload={downloadPackage} />
              </section>
            </div>
            <LogStream logs={visibleLogs} />
          </main>

          <aside className="panel-glass flex min-h-[calc(100vh-112px)] flex-col overflow-hidden" data-design-region="context">
            <ContextPanel
              memory={runtime.memory}
              artifacts={runtime.artifacts}
              project={runtime.project}
              runtime={runtime}
              designChecks={designChecks}
              downloadPackage={downloadPackage}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}

function TopBar({ runtime }: { runtime: PersistedAppState }) {
  return (
    <header className="relative z-10 border-b border-white/10 bg-black/35 px-5 py-4 backdrop-blur-xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/40 bg-cyan-300/10 shadow-cyan">
            <Sparkles className="text-cyan-100" size={20} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold tracking-tight">ConductorIQ</h1>
              <span className="mono rounded-full border border-emerald-300/30 bg-emerald-300/10 px-2 py-1 text-[10px] uppercase tracking-[0.24em] text-emerald-100">
                Autonomous Mode
              </span>
            </div>
            <p className="text-sm text-slate-400">AI-native market validation and MVP execution workspace</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-right sm:min-w-[460px]">
          <Metric label="Validation" value={`${runtime.project.validationConfidence}%`} />
          <Metric label="Readiness" value={`${runtime.project.readinessScore}%`} />
          <Metric
            label="Decision"
            value={runtime.project.recommendation.toUpperCase()}
            className={recommendationTone[runtime.project.recommendation]}
          />
        </div>
      </div>
    </header>
  );
}

function Metric({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
      <div className="mono text-[10px] uppercase tracking-[0.24em] text-slate-500">{label}</div>
      <div className={clsx("mt-1 text-lg font-semibold text-cyan-100", className)}>{value}</div>
    </div>
  );
}

function WorkspaceButton({
  id,
  index,
  active,
  completed,
  running,
  label,
  description,
  onClick,
}: {
  id: WorkspaceId;
  index: number;
  active: boolean;
  completed: boolean;
  running: boolean;
  label: string;
  description: string;
  onClick: () => void;
}) {
  const Icon = workspaceIcon(id);

  return (
    <button
      type="button"
      data-workspace-nav="true"
      onClick={onClick}
      className={clsx(
        "group w-full rounded-2xl border p-3 text-left transition duration-200",
        active
          ? "border-cyan-300/60 bg-cyan-300/10 shadow-cyan"
          : "border-white/10 bg-white/[0.03] hover:border-cyan-300/30 hover:bg-white/[0.06]",
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={clsx(
            "flex h-9 w-9 items-center justify-center rounded-xl border",
            running
              ? "animate-pulse border-cyan-300/70 bg-cyan-300/15 text-cyan-100"
              : completed
                ? "border-emerald-300/40 bg-emerald-300/10 text-emerald-100"
                : "border-white/10 bg-black/30 text-slate-400",
          )}
        >
          {completed ? <CheckCircle2 size={16} /> : <Icon size={16} />}
        </div>
        <div className="min-w-0">
          <div className="mono text-[10px] uppercase tracking-[0.22em] text-slate-500">
            {String(index).padStart(2, "0")}
          </div>
          <div className="truncate font-semibold text-slate-100">{label}</div>
        </div>
        <ChevronRight className="ml-auto text-slate-600 transition group-hover:text-cyan-200" size={16} />
      </div>
      <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-500">{description}</p>
    </button>
  );
}

function WorkspaceHeader({
  workspace,
  runtime,
  onStart,
  isGenerating,
  onReset,
  onPause,
  onResume,
  onStep,
  tickMs,
  setTickMs,
}: {
  workspace: (typeof workspaces)[number];
  runtime: PersistedAppState;
  onStart: () => void;
  isGenerating: boolean;
  onReset: () => void;
  onPause: () => void;
  onResume: () => void;
  onStep: () => void;
  tickMs: number;
  setTickMs: (value: number) => void;
}) {
  return (
    <div className="border-b border-white/10 p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="mono mb-2 text-[10px] uppercase tracking-[0.32em] text-cyan-200/70">
            {workspace.eyebrow}
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">{workspace.label}</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-400">{workspace.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            className="rounded-full border border-white/10 bg-white/[0.055] px-3 py-2 text-xs font-semibold text-slate-200 outline-none"
            value={tickMs}
            onChange={(event) => setTickMs(Number(event.target.value))}
            aria-label="Workflow speed"
          >
            <option value={2400}>Deliberate</option>
            <option value={1600}>Standard</option>
            <option value={850}>Rapid walkthrough</option>
          </select>
          <button
            className="btn-secondary"
            type="button"
            onClick={runtime.isRunning ? onPause : onResume}
            disabled={runtime.project.status === "idle" || runtime.project.status === "completed"}
          >
            {runtime.isRunning ? <Pause size={15} /> : <Play size={15} />}
            {runtime.isRunning ? "Pause" : "Resume"}
          </button>
          <button
            className="btn-secondary"
            type="button"
            onClick={onStep}
            disabled={runtime.project.status === "idle" || runtime.project.status === "completed"}
          >
            <StepForward size={15} />
            Step
          </button>
          <button className="btn-secondary" type="button" onClick={onReset}>
            <RefreshCcw size={15} />
            Reset
          </button>
          <button className="btn-primary" type="button" onClick={onStart} disabled={isGenerating}>
            <Play size={15} />
            {runtime.project.status === "idle" ? "Activate Workflow" : "Re-run Graph"}
          </button>
        </div>
      </div>
    </div>
  );
}

function IntakeWorkspace({
  idea,
  setIdea,
  importBrief,
  startWorkflow,
  isGenerating,
  error,
  refinedPrompt,
  promptRefinementSource,
  isRefiningPrompt,
  onRefinePrompt,
  onUseRefinedPrompt,
}: {
  idea: string;
  setIdea: (idea: string) => void;
  importBrief: (file: File | undefined) => void;
  startWorkflow: () => void;
  isGenerating: boolean;
  error: string;
  refinedPrompt: string;
  promptRefinementSource: "openai" | "deterministic-local" | "idle";
  isRefiningPrompt: boolean;
  onRefinePrompt: () => void;
  onUseRefinedPrompt: () => void;
}) {
  const promptQuality = analyzePromptQuality(idea);
  const suggestedPrompt = refinedPrompt || buildImprovedPromptSuggestion(idea, promptQuality);
  const suggestionSource = refinedPrompt ? promptRefinementSource : "deterministic-local";

  return (
    <div className="rounded-3xl border border-cyan-300/20 bg-cyan-300/[0.04] p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="mono text-[10px] uppercase tracking-[0.28em] text-cyan-200/70">Idea intake</div>
          <h3 className="mt-1 text-lg font-semibold">Describe the startup idea</h3>
        </div>
        <label className="btn-secondary cursor-pointer">
          <Upload size={15} />
          Import .md/.txt
          <input
            className="hidden"
            type="file"
            accept=".md,.txt"
            onChange={(event) => void importBrief(event.target.files?.[0])}
          />
        </label>
      </div>
      <textarea
        value={idea}
        onChange={(event) => setIdea(event.target.value)}
        className="min-h-[190px] w-full resize-none rounded-2xl border border-white/10 bg-black/40 p-4 text-sm leading-6 text-slate-100 outline-none transition focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/15"
        placeholder="Example: I want to build a website that helps people discover and book local hobby classes."
      />
      {error ? <p className="mt-3 text-sm text-red-200">{error}</p> : null}
      <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="mono text-[10px] uppercase tracking-[0.22em] text-cyan-200/70">Prompt readiness gate</div>
            <div className="mt-1 text-sm font-semibold">{promptQuality.specificityLabel}</div>
          </div>
          <span className={clsx("status-pill", promptQuality.level === "strong" ? statusTone.approved : promptQuality.level === "usable" ? statusTone.pending : statusTone["revision-requested"])}>
            {promptQuality.score}/100 · {promptQuality.level}
          </span>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold text-slate-300">Assumed user</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">{promptQuality.assumedTargetUser}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-300">Assumed pain</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">{promptQuality.assumedPain}</p>
          </div>
        </div>
        {promptQuality.missingContext.length > 0 ? (
          <div className="mt-3 rounded-xl border border-amber-300/20 bg-amber-300/10 p-3">
            <p className="text-xs font-semibold text-amber-100">Missing context before high-confidence validation</p>
            <p className="mt-1 text-xs leading-5 text-amber-100/75">{promptQuality.missingContext.join(" · ")}</p>
          </div>
        ) : null}
        {promptQuality.clarifyingQuestions.length > 0 ? (
          <div className="mt-3">
            <p className="text-xs font-semibold text-slate-300">Clarifying questions ConductorIQ will carry into Strategy</p>
            <ul className="mt-2 space-y-1 text-xs leading-5 text-slate-500">
              {promptQuality.clarifyingQuestions.slice(0, 3).map((question) => (
                <li key={question}>• {question}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
      <div className="mt-4 rounded-2xl border border-fuchsia-300/20 bg-fuchsia-300/[0.045] p-4">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mono text-[10px] uppercase tracking-[0.22em] text-fuchsia-100/70">Prompt refinement studio</div>
            <div className="mt-1 text-sm font-semibold">Improve the intake before running validation</div>
          </div>
          <span className={clsx("status-pill", statusTone[suggestionSource === "openai" ? "approved" : "fallback"])}>
            {suggestionSource === "openai" ? "OpenAI refined" : "local suggestion"}
          </span>
        </div>
        <p className="text-xs leading-5 text-slate-400">
          Use this when the original idea is too generic. The OpenAI path uses the local proxy; if it fails,
          ConductorIQ keeps a deterministic improved prompt so the workflow does not stall.
        </p>
        {suggestedPrompt ? (
          <div className="mt-3 rounded-2xl border border-white/10 bg-black/30 p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-cyan-100">Suggested improved prompt</span>
              <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                {promptQuality.score}/100 source prompt
              </span>
            </div>
            <p className="text-xs leading-6 text-slate-300">{suggestedPrompt}</p>
          </div>
        ) : (
          <div className="mt-3 rounded-2xl border border-white/10 bg-black/30 p-4 text-xs text-slate-500">
            Type a rough idea to see a suggested improved prompt.
          </div>
        )}
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <button
            className="btn-secondary justify-center"
            type="button"
            onClick={onRefinePrompt}
            disabled={isRefiningPrompt || !idea.trim()}
          >
            <Sparkles size={15} />
            {isRefiningPrompt ? "Refining Prompt..." : "Refine with OpenAI"}
          </button>
          <button
            className="btn-primary justify-center"
            type="button"
            onClick={onUseRefinedPrompt}
            disabled={!suggestedPrompt}
          >
            <CheckCircle2 size={15} />
            Use Improved Prompt
          </button>
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <IntakeSignal icon={ShieldCheck} title="Scope Guard" text="Six workspaces only, no auth, no billing, no database." />
        <IntakeSignal icon={GitBranch} title="LangGraph Path" text="StateGraph routes Intake through Launch with fallback branches." />
        <IntakeSignal icon={Zap} title="Fallback Mode" text="External failures become labeled fallback states, not blockers." />
      </div>
      <button className="btn-primary mt-5 w-full justify-center py-4" type="button" onClick={startWorkflow} disabled={isGenerating}>
        <Play size={16} />
        {isGenerating ? "Compiling LangGraph package..." : "Activate ConductorIQ"}
      </button>
      {isGenerating ? (
        <p className="mt-3 text-center text-xs leading-5 text-cyan-100/70">
          Running local LangGraph orchestration. OpenAI calls may take a few seconds; unavailable services will fall back to labelled deterministic outputs.
        </p>
      ) : null}
    </div>
  );
}

function IntakeSignal({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof ShieldCheck;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <Icon className="mb-3 text-cyan-200" size={18} />
      <div className="font-semibold">{title}</div>
      <p className="mt-1 text-xs leading-5 text-slate-500">{text}</p>
    </div>
  );
}

function ScoreChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1">
      <div className="text-slate-500">{label}</div>
      <div className="mt-0.5 font-semibold text-cyan-100">{value}</div>
    </div>
  );
}

function ApprovalGatePanel({
  runtime,
  activeWorkspace,
  onApproveSynthesis,
  onRequestSynthesisRevision,
  onRerunValidation,
  onApprovePrototype,
  onRejectPrototype,
  onRegeneratePrototype,
  onSetPrototypeRejectionReason,
}: {
  runtime: PersistedAppState;
  activeWorkspace: WorkspaceId;
  onApproveSynthesis: () => void | Promise<void>;
  onRequestSynthesisRevision: () => void | Promise<void>;
  onRerunValidation: () => void | Promise<void>;
  onApprovePrototype: () => void | Promise<void>;
  onRejectPrototype: () => void | Promise<void>;
  onRegeneratePrototype: () => void | Promise<void>;
  onSetPrototypeRejectionReason: (reason: PrototypeRejectionReason) => void;
}) {
  if (activeWorkspace === "synthesis" && runtime.project.currentStep >= 3) {
    return (
      <div className="rounded-3xl border border-fuchsia-300/30 bg-fuchsia-400/[0.07] p-5">
        <div className="mono text-[10px] uppercase tracking-[0.28em] text-fuchsia-100/70">Approval checkpoint</div>
        <h3 className="mt-1 text-lg font-semibold">Synthesis Plan hold</h3>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          The workflow is paused after reviewing prompt, strategy, PRD, risks, and interface quality. Approve to unlock
          Deployment prototype review, or request revision to keep downstream work locked.
        </p>
        <p className="mt-2 rounded-2xl border border-white/10 bg-black/25 p-3 text-xs leading-5 text-slate-400">
          No hidden background step is running at this checkpoint. ConductorIQ already generated the Synthesis Plan and is waiting for your decision.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className={clsx("status-pill", statusTone[runtime.project.synthesisApproval])}>
            {runtime.project.synthesisApproval}
          </span>
          <button className="btn-primary" type="button" onClick={onApproveSynthesis}>
            <CheckCircle2 size={15} />
            Approve Synthesis
          </button>
          <button className="btn-secondary" type="button" onClick={onRequestSynthesisRevision}>
            <RefreshCcw size={15} />
            Request Revision
          </button>
          <button className="btn-secondary" type="button" onClick={onRerunValidation}>
            <GitBranch size={15} />
            Rerun Validation
          </button>
        </div>
      </div>
    );
  }

  if (activeWorkspace === "deployment" && runtime.project.currentStep >= 4) {
    const selectedAsset = runtime.prototypeAssets.find(
      (asset) => asset.id === runtime.project.selectedPrototypeAssetId,
    ) ?? runtime.prototypeAssets[0];
    const hasPrototypeAsset = Boolean(selectedAsset);

    return (
      <div className="rounded-3xl border border-amber-300/30 bg-amber-300/[0.07] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mono text-[10px] uppercase tracking-[0.28em] text-amber-100/70">Prototype checkpoint</div>
            <h3 className="mt-1 text-lg font-semibold">Approve the selected prototype direction</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              Review the prototype options above first. Approval unlocks Launch, build-preparation agents,
              and the Design Validation Report.
            </p>
          </div>
          <span className={clsx("status-pill self-start", statusTone[runtime.project.prototypeApproval])}>
            {runtime.project.prototypeApproval}
          </span>
        </div>
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Selected for approval</div>
          <div className="mt-2 text-sm font-semibold text-cyan-100">{selectedAsset?.title ?? "No prototype selected yet"}</div>
          <p className="mt-2 text-xs leading-5 text-slate-400">
            {hasPrototypeAsset
              ? selectedAsset.rationale
              : "Generate or select a prototype direction before approval. If image generation is unavailable, approve the labelled visual-prompt fallback."}
          </p>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(220px,360px)_1fr]">
          <label className="flex flex-col gap-1 text-xs text-slate-400">
            Rejection route
            <select
              className="rounded-2xl border border-white/10 bg-black/40 px-3 py-3 text-slate-100 outline-none focus:border-cyan-300/60"
              value={runtime.project.prototypeRejectionReason ?? "regenerate-prototype"}
              onChange={(event) => onSetPrototypeRejectionReason(event.target.value as PrototypeRejectionReason)}
            >
              <option value="regenerate-prototype">Regenerate prototype</option>
              <option value="revise-prompt">Revise prompt</option>
              <option value="revise-prd">Revise PRD</option>
              <option value="return-synthesis">Return to Synthesis</option>
            </select>
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              className="btn-primary justify-center"
              type="button"
              onPointerDown={(event) => {
                event.preventDefault();
                void onApprovePrototype();
              }}
              onClick={onApprovePrototype}
              disabled={!hasPrototypeAsset}
            >
              <CheckCircle2 size={15} />
              Approve Selected Prototype
            </button>
            <button className="btn-secondary justify-center" type="button" onClick={onRejectPrototype} disabled={!hasPrototypeAsset}>
              <RefreshCcw size={15} />
              Reject Selected Prototype
            </button>
            {runtime.project.prototypeApproval === "rejected" ? (
              <button className="btn-secondary justify-center sm:col-span-2" type="button" onClick={onRegeneratePrototype}>
                <Sparkles size={15} />
                Regenerate Prototype
              </button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  if (activeWorkspace === "launch") {
    return (
      <div className="rounded-3xl border border-emerald-300/30 bg-emerald-300/[0.07] p-5">
        <div className="mono text-[10px] uppercase tracking-[0.28em] text-emerald-100/70">Launch gate status</div>
        <h3 className="mt-1 text-lg font-semibold">Approval-backed package</h3>
        <div className="mt-3 grid gap-2 text-xs md:grid-cols-3">
          <ConsoleRow label="Synthesis" value={runtime.project.synthesisApproval} />
          <ConsoleRow label="Prototype" value={runtime.project.prototypeApproval} />
          <ConsoleRow label="Design" value={runtime.project.designValidation} />
        </div>
      </div>
    );
  }

  return null;
}

function WorkspaceIntelligence({
  workspaceId,
  artifacts,
  runtime,
  onSelectPrototype,
  onVisualisePrototype,
  isVisualising,
  deploymentGate,
}: {
  workspaceId: WorkspaceId;
  artifacts: Artifact[];
  runtime: PersistedAppState;
  onSelectPrototype: (assetId: string) => void;
  onVisualisePrototype: () => void;
  isVisualising: boolean;
  deploymentGate?: ReactNode;
}) {
  if (artifacts.length === 0) {
    if (workspaceId === "launch") {
      return (
        <div className="space-y-3">
          <WorkspaceBoard
            workspaceId={workspaceId}
            runtime={runtime}
            onSelectPrototype={onSelectPrototype}
            onVisualisePrototype={onVisualisePrototype}
            isVisualising={isVisualising}
          />
          <div className="empty-state">
            <Activity className="text-cyan-200" size={26} />
            <h3 className="mt-4 text-lg font-semibold">Launch package waiting on prototype approval</h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              The prototype build preview is visible above. Final Launch artifacts unlock after a selected prototype is approved.
            </p>
          </div>
        </div>
      );
    }
    return (
      <div className="empty-state">
        <Activity className="text-cyan-200" size={26} />
        <h3 className="mt-4 text-lg font-semibold">Waiting on upstream graph output</h3>
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
          The LangGraph runtime will reveal this workspace when dependency nodes complete.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <WorkspaceBoard
        workspaceId={workspaceId}
        runtime={runtime}
        onSelectPrototype={onSelectPrototype}
        onVisualisePrototype={onVisualisePrototype}
        isVisualising={isVisualising}
      />
      {workspaceId === "deployment" ? deploymentGate : null}
      {artifacts.map((artifact) => (
        <ArtifactCard key={artifact.id} artifact={artifact} />
      ))}
      {workspaceId === "synthesis" ? (
        <DecisionCard recommendation={runtime.project.recommendation} confidence={runtime.project.validationConfidence} />
      ) : null}
    </div>
  );
}

function WorkspaceBoard({
  workspaceId,
  runtime,
  onSelectPrototype,
  onVisualisePrototype,
  isVisualising,
}: {
  workspaceId: WorkspaceId;
  runtime: PersistedAppState;
  onSelectPrototype: (assetId: string) => void;
  onVisualisePrototype: () => void;
  isVisualising: boolean;
}) {
  if (workspaceId === "strategy") {
    return (
      <div className="grid gap-3 xl:grid-cols-2">
        <BoardCard title="Market Leads" icon={Radar}>
          {runtime.marketLeads.map((lead) => (
            <div key={`${lead.buyerType}-${lead.validationQuestion}`} className="rounded-2xl border border-white/10 bg-black/25 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{lead.buyerType}</div>
                  <div className="mt-1 text-xs text-cyan-200">
                    {lead.confidence}% · {lead.evidenceSource}
                    {lead.priority ? ` · ${lead.priority}` : ""}
                  </div>
                  {lead.segment ? <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-500">{lead.segment}</div> : null}
                </div>
                <span className={clsx("status-pill", statusTone[lead.evidenceSource === "openai" ? "approved" : "fallback"])}>
                  {lead.evidenceSource}
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-400">{lead.painSignal}</p>
              <p className="mt-2 text-xs leading-5 text-slate-500">Rationale: {lead.rationale}</p>
              {lead.scoreBreakdown ? (
                <div className="mt-3 grid grid-cols-3 gap-2 text-[10px] text-slate-400">
                  <ScoreChip label="Urgency" value={lead.scoreBreakdown.painUrgency} />
                  <ScoreChip label="Reach" value={lead.scoreBreakdown.audienceReachability} />
                  <ScoreChip label="Budget" value={lead.scoreBreakdown.budgetFit} />
                  <ScoreChip label="Freq." value={lead.scoreBreakdown.usageFrequency} />
                  <ScoreChip label="Diff." value={lead.scoreBreakdown.differentiationPotential} />
                  <ScoreChip label="Evidence" value={lead.scoreBreakdown.evidenceStrength} />
                </div>
              ) : null}
              {lead.scoringRationale ? (
                <p className="mt-2 text-[11px] leading-5 text-slate-500">Scoring: {lead.scoringRationale}</p>
              ) : null}
              <p className="mt-2 text-xs leading-5 text-amber-100/80">Question: {lead.validationQuestion}</p>
            </div>
          ))}
        </BoardCard>
        <BoardCard title="Market Signals" icon={Search}>
          {runtime.marketSignals.map((signal) => (
            <div key={signal.label} className="rounded-2xl border border-white/10 bg-black/25 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{signal.label}</span>
                <span
                  className={clsx(
                    "rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.16em]",
                    signal.sentiment === "positive"
                      ? "bg-emerald-300/10 text-emerald-100"
                      : signal.sentiment === "negative"
                        ? "bg-red-300/10 text-red-100"
                        : "bg-amber-300/10 text-amber-100",
                  )}
                >
                  {signal.source}
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-400">{signal.value}</p>
            </div>
          ))}
        </BoardCard>
        <BoardCard title="Competitor Pressure" icon={Radar}>
          {runtime.competitors.map((competitor) => (
            <div key={competitor.name} className="rounded-2xl border border-white/10 bg-black/25 p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">{competitor.name}</span>
                <span className="text-xs uppercase text-fuchsia-200">{competitor.threat}</span>
              </div>
              <div className="mt-1 text-xs text-slate-500">{competitor.category}</div>
              <p className="mt-2 text-xs leading-5 text-slate-400">{competitor.positioningGap}</p>
              {competitor.differentiation ? (
                <p className="mt-2 text-xs leading-5 text-cyan-100/80">Differentiation: {competitor.differentiation}</p>
              ) : null}
            </div>
          ))}
        </BoardCard>
        <BoardCard title="Assumption Tests" icon={ShieldCheck}>
          {runtime.assumptionTests.map((test) => (
            <div key={test.assumption} className="rounded-2xl border border-white/10 bg-black/25 p-3">
              <div className="font-medium">{test.assumption}</div>
              <p className="mt-2 text-xs leading-5 text-slate-400">Method: {test.testMethod}</p>
              <p className="mt-2 text-xs leading-5 text-emerald-100/80">Pass: {test.passSignal}</p>
              <p className="mt-2 text-xs leading-5 text-amber-100/80">Risk: {test.riskIfWrong}</p>
            </div>
          ))}
        </BoardCard>
      </div>
    );
  }

  if (workspaceId === "prd") {
    return (
      <div className="grid gap-3 xl:grid-cols-2">
        <BoardCard title="Persona Objections" icon={BrainCircuit}>
          {runtime.personas.map((persona) => (
            <div key={persona.persona} className="rounded-2xl border border-white/10 bg-black/25 p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">{persona.persona}</span>
                <span className="text-xs text-cyan-200">{persona.confidence}%</span>
              </div>
              <p className="mt-2 text-xs italic leading-5 text-slate-300">"{persona.quote}"</p>
              <p className="mt-2 text-xs leading-5 text-slate-500">Objection: {persona.objection}</p>
            </div>
          ))}
        </BoardCard>
        <BoardCard title="Execution Tasks" icon={Boxes}>
          {runtime.tasks.map((task) => (
            <div key={task.title} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/25 p-3">
              <div>
                <div className="text-sm font-medium">{task.title}</div>
                <div className="text-xs text-slate-500">{task.owner}</div>
              </div>
              <span className={clsx("status-pill", statusTone[task.status === "done" ? "completed" : task.status])}>{task.status}</span>
            </div>
          ))}
        </BoardCard>
      </div>
    );
  }

  if (workspaceId === "deployment") {
    return (
      <div className="space-y-3">
        <VisualiseStepPanel
          runtime={runtime}
          onVisualisePrototype={onVisualisePrototype}
          isVisualising={isVisualising}
        />
        <PrototypeAssetBoard runtime={runtime} onSelectPrototype={onSelectPrototype} />
        <BoardCard title="Risk Register" icon={ShieldCheck}>
          <div className="grid gap-3 md:grid-cols-2">
            {runtime.risks.map((risk) => (
              <div key={risk.risk} className="rounded-2xl border border-white/10 bg-black/25 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{risk.risk}</span>
                  <span className="text-xs uppercase text-amber-200">{risk.severity}</span>
                </div>
                <p className="text-xs leading-5 text-slate-500">{risk.mitigation}</p>
              </div>
            ))}
          </div>
        </BoardCard>
      </div>
    );
  }

  if (workspaceId === "synthesis") {
    const interfaceReview = runtime.artifacts.find((artifact) => artifact.type === "interface-review");
    const interfaceLines = interfaceReview?.content.split("\n").filter(Boolean) ?? [];
    return (
      <div className="grid gap-3 xl:grid-cols-2">
        <BoardCard title="Interface Validation Scores" icon={Gauge}>
          {interfaceLines.map((line) => {
            const [label, ...rest] = line.split(":");
            return (
              <div key={line} className="rounded-2xl border border-white/10 bg-black/25 p-3">
                <div className="text-sm font-medium text-cyan-100">{label}</div>
                <p className="mt-2 text-xs leading-5 text-slate-400">{rest.join(":").trim() || line}</p>
              </div>
            );
          })}
        </BoardCard>
        <BoardCard title="Risk Register" icon={ShieldCheck}>
          <div className="grid gap-3">
            {runtime.risks.map((risk) => (
              <div key={risk.risk} className="rounded-2xl border border-white/10 bg-black/25 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{risk.risk}</span>
                  <span className="text-xs uppercase text-amber-200">{risk.severity}</span>
                </div>
                <p className="text-xs leading-5 text-slate-500">{risk.mitigation}</p>
              </div>
            ))}
          </div>
        </BoardCard>
      </div>
    );
  }

  if (workspaceId === "launch") {
    const selectedPrototype =
      runtime.prototypeAssets.find((asset) => asset.id === runtime.project.selectedPrototypeAssetId) ??
      runtime.prototypeAssets.find((asset) => asset.reviewStatus === "selected") ??
      runtime.prototypeAssets[0];
    const launchUnlocked = runtime.project.prototypeApproval === "approved";
    return (
      <div className="grid gap-3 xl:grid-cols-[1.15fr_0.85fr]">
        <BoardCard title="Prototype Build Preview" icon={Rocket}>
          <div className="rounded-3xl border border-cyan-300/20 bg-cyan-300/[0.045] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="mono text-[10px] uppercase tracking-[0.26em] text-cyan-200/70">
                  {launchUnlocked ? "Approved build scaffold" : "Locked build scaffold"}
                </div>
                <h3 className="mt-2 text-lg font-semibold">
                  {launchUnlocked ? "Static MVP prototype ready to build" : "Approve prototype to unlock build"}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {launchUnlocked
                    ? "Launch now converts the selected prototype direction into a concrete local scaffold and exportable MVP package."
                    : "The final prototype build remains locked until the selected Deployment direction is approved."}
                </p>
              </div>
              <span className={clsx("status-pill", statusTone[launchUnlocked ? "approved" : "awaiting-user-approval"])}>
                {launchUnlocked ? "build ready" : "approval required"}
              </span>
            </div>
            {selectedPrototype ? (
              <div className="mt-4">
                <PrototypeVisualPreview asset={selectedPrototype} compact />
              </div>
            ) : null}
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {["ValidationHero", "WorkspaceProgressRail", "MarketEvidencePanel", "ApprovedPrototypePreview", "LaunchPackageSummary", "ExportControls"].map((component) => (
                <div key={component} className="rounded-2xl border border-white/10 bg-black/25 p-3">
                  <div className="font-medium text-cyan-100">{component}</div>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {launchUnlocked
                      ? "Included in the local prototype scaffold."
                      : "Queued until prototype approval is recorded."}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </BoardCard>
        <BoardCard title="Risk Register" icon={ShieldCheck}>
          <div className="grid gap-3">
            {runtime.risks.map((risk) => (
              <div key={risk.risk} className="rounded-2xl border border-white/10 bg-black/25 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{risk.risk}</span>
                  <span className="text-xs uppercase text-amber-200">{risk.severity}</span>
                </div>
                <p className="text-xs leading-5 text-slate-500">{risk.mitigation}</p>
              </div>
            ))}
          </div>
        </BoardCard>
      </div>
    );
  }

  return null;
}

function VisualiseStepPanel({
  runtime,
  onVisualisePrototype,
  isVisualising,
}: {
  runtime: PersistedAppState;
  onVisualisePrototype: () => void;
  isVisualising: boolean;
}) {
  const isDeploymentUnlocked = runtime.project.currentStep >= 4 && runtime.project.synthesisApproval === "approved";
  const selectedAsset = runtime.prototypeAssets.find(
    (asset) => asset.id === runtime.project.selectedPrototypeAssetId,
  ) ?? runtime.prototypeAssets[0];
  const generatedImageCount = runtime.prototypeAssets.filter((asset) => asset.provider === "gpt-image-2").length;
  const fallbackCount = runtime.prototypeAssets.filter((asset) => asset.provider === "fallback").length;

  return (
    <BoardCard title="Visualise Prototype" icon={Sparkles}>
      <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.06] p-4">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mono text-[10px] uppercase tracking-[0.26em] text-cyan-200/70">Internal deployment step</div>
            <h3 className="mt-1 text-lg font-semibold">Generate visual direction with GPT Image 2</h3>
          </div>
          <span className={clsx("status-pill", statusTone[isDeploymentUnlocked ? "queued" : "waiting"])}>
            {isDeploymentUnlocked ? "ready" : "locked"}
          </span>
        </div>
        <p className="text-sm leading-6 text-slate-300">
          Visualise uses the existing local GPT Image proxy. If image generation fails or the key is unavailable,
          ConductorIQ creates a labelled visual-prompt fallback and keeps the approval gate intact.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Selected direction</div>
            <div className="mt-2 text-sm font-medium text-cyan-100">{selectedAsset?.title ?? "No prototype selected"}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Generated images</div>
            <div className="mt-2 text-sm font-medium text-emerald-100">{generatedImageCount}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Fallback prompts</div>
            <div className="mt-2 text-sm font-medium text-amber-100">{fallbackCount}</div>
          </div>
        </div>
        {selectedAsset ? (
          <div className="mt-4">
            <PrototypeVisualPreview asset={selectedAsset} compact />
          </div>
        ) : null}
        {!isDeploymentUnlocked ? (
          <p className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/10 p-3 text-xs leading-5 text-amber-100">
            Approve Synthesis first. Visualise is intentionally inside Deployment and does not create a seventh workspace.
          </p>
        ) : null}
        <button
          className="btn-primary mt-4 w-full justify-center"
          type="button"
          onClick={onVisualisePrototype}
          disabled={!isDeploymentUnlocked || isVisualising}
        >
          <Sparkles size={16} />
          {isVisualising ? "Generating Visual..." : "Visualise With GPT Image 2"}
        </button>
      </div>
    </BoardCard>
  );
}

function PrototypeAssetBoard({
  runtime,
  onSelectPrototype,
}: {
  runtime: PersistedAppState;
  onSelectPrototype: (assetId: string) => void;
}) {
  return (
    <BoardCard title="Prototype Options" icon={Sparkles}>
      {runtime.prototypeAssets.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-black/25 p-3 text-sm text-slate-500">
          Prototype generation waits for Deployment. GPT Image 2 falls back to a labelled visual prompt if unavailable.
        </div>
      ) : (
        runtime.prototypeAssets.map((asset) => (
          <div
            key={asset.id}
            className={clsx(
              "rounded-2xl border bg-black/25 p-3",
              runtime.project.selectedPrototypeAssetId === asset.id
                ? "border-cyan-300/60 shadow-cyan"
                : "border-white/10",
            )}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <div className="font-medium">{asset.title}</div>
                <div className="mt-1 text-xs text-cyan-200">
                  {asset.provider} · {asset.variant} · {asset.reviewStatus ?? "pending"}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  Attempts {asset.attemptCount} · {asset.telemetryStatus ?? asset.status} · Last{" "}
                  {formatTime(asset.lastAttemptAt)}
                </div>
              </div>
              <span className={clsx("status-pill", statusTone[asset.status === "generated" ? "approved" : "fallback"])}>
                {asset.status}
              </span>
            </div>
            {asset.imageDataUrl ? (
              <img
                src={asset.imageDataUrl}
                alt={asset.title}
                className="mb-3 aspect-video w-full rounded-2xl border border-white/10 object-cover"
              />
            ) : (
              <PrototypeVisualPreview asset={asset} />
            )}
            <p className="mb-2 text-xs leading-5 text-emerald-100/80">Rationale: {asset.rationale}</p>
            {asset.failureReason ? (
              <p className="mb-2 rounded-xl border border-amber-300/20 bg-amber-300/10 p-2 text-xs leading-5 text-amber-100">
                Generation note: {asset.failureReason}
              </p>
            ) : null}
            <p className="text-xs leading-5 text-slate-400">{asset.prompt}</p>
            <button
              className="btn-secondary mt-3 w-full justify-center"
              type="button"
              onClick={() => onSelectPrototype(asset.id)}
              disabled={runtime.project.selectedPrototypeAssetId === asset.id}
            >
              <CheckCircle2 size={15} />
              {runtime.project.selectedPrototypeAssetId === asset.id ? "Selected" : "Select Direction"}
            </button>
          </div>
        ))
      )}
    </BoardCard>
  );
}

function PrototypeVisualPreview({ asset, compact = false }: { asset: PrototypeAsset; compact?: boolean }) {
  const promptLines = asset.prompt
    .split(/[.\n]/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, compact ? 2 : 4);

  return (
    <div className={clsx("overflow-hidden rounded-2xl border border-cyan-300/20 bg-[#070b14]", compact ? "p-3" : "mb-3 p-4")}>
      {asset.imageDataUrl ? (
        <div className="relative aspect-video overflow-hidden rounded-xl border border-cyan-300/25 bg-black">
          <img src={asset.imageDataUrl} alt={asset.title} className="h-full w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
            <div className="text-xs font-semibold text-cyan-100">Generated prototype image</div>
            <div className="mt-1 text-[11px] text-slate-300">Rendered from the local GPT Image proxy response.</div>
          </div>
        </div>
      ) : (
        <div className="relative aspect-video rounded-xl border border-white/10 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.22),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(217,70,239,0.2),transparent_32%),linear-gradient(135deg,rgba(15,23,42,0.96),rgba(2,6,23,0.98))] p-3">
          <div className="absolute inset-0 bg-grid opacity-20" />
          <div className="relative grid h-full grid-cols-[0.28fr_0.72fr] gap-3">
            <div className="rounded-xl border border-white/10 bg-black/35 p-2">
              <div className="mb-2 h-2 w-16 rounded-full bg-cyan-200/60" />
              {["Intake", "Strategy", "PRD", "Launch"].map((item, index) => (
                <div key={item} className="mb-2 rounded-lg border border-white/10 bg-white/[0.04] p-2">
                  <div className={clsx("h-1.5 rounded-full", index === 1 ? "bg-fuchsia-300/70" : "bg-cyan-300/40")} />
                </div>
              ))}
            </div>
            <div className="grid grid-rows-[0.28fr_0.72fr] gap-3">
              <div className="rounded-xl border border-white/10 bg-black/35 p-3">
                <div className="flex items-center justify-between">
                  <div className="h-2 w-32 rounded-full bg-slate-200/70" />
                  <div className="h-5 w-20 rounded-full border border-amber-200/40 bg-amber-200/10" />
                </div>
                <div className="mt-3 h-2 w-48 rounded-full bg-cyan-200/30" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {["Evidence", "Agents", "Prototype"].map((item, index) => (
                  <div key={item} className="rounded-xl border border-white/10 bg-black/35 p-3">
                    <div className={clsx("mb-3 h-8 w-8 rounded-lg", index === 2 ? "bg-fuchsia-300/25" : "bg-cyan-300/20")} />
                    <div className="mb-2 h-2 rounded-full bg-slate-200/55" />
                    <div className="h-2 w-2/3 rounded-full bg-slate-500/40" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-xs font-semibold text-cyan-100">{asset.imageDataUrl ? "Generated image preview" : "Fallback visual storyboard"}</div>
          <div className="mt-1 text-[11px] text-slate-500">{asset.provider} · {asset.telemetryStatus ?? asset.status}</div>
        </div>
        <span className={clsx("status-pill", statusTone[asset.status === "generated" ? "approved" : "fallback"])}>
          {asset.status === "generated" ? "image" : "prompt visual"}
        </span>
      </div>
      {!compact && promptLines.length > 0 ? (
        <ul className="mt-3 space-y-1 text-[11px] leading-5 text-slate-400">
          {promptLines.map((line) => (
            <li key={line}>- {line}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function BoardCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Search;
  children: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="text-cyan-200" size={17} />
        <h3 className="font-semibold">{title}</h3>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function ArtifactCard({ artifact }: { artifact: Artifact }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/[0.045] p-5 shadow-soft">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="mono text-[10px] uppercase tracking-[0.26em] text-cyan-200/60">{artifact.type}</div>
          <h3 className="mt-1 text-lg font-semibold">{artifact.title}</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-black/25 px-2 py-1 text-[10px] text-slate-400">
              v{artifact.version}
            </span>
            {artifact.evidenceSource ? (
              <span className={clsx("status-pill", statusTone[artifact.evidenceSource === "fallback" ? "fallback" : "approved"])}>
                {artifact.evidenceSource}
              </span>
            ) : null}
            {artifact.reviewStatus ? (
              <span className={clsx("status-pill", statusTone[artifact.reviewStatus === "reviewed" ? "approved" : artifact.reviewStatus === "revision-required" ? "revision-requested" : "under-review"])}>
                review: {artifact.reviewStatus}
              </span>
            ) : null}
            {artifact.approvalStatus ? (
              <span className={clsx("status-pill", statusTone[artifact.approvalStatus === "rejected" ? "user-rejected" : artifact.approvalStatus])}>
                approval: {artifact.approvalStatus}
              </span>
            ) : null}
          </div>
        </div>
        <span className={clsx("status-pill", statusTone[artifact.status])}>{artifact.status}</span>
      </div>
      <p className="text-sm leading-6 text-slate-300">{artifact.summary}</p>
      <pre className="mt-4 whitespace-pre-wrap rounded-2xl border border-white/10 bg-black/30 p-4 text-xs leading-6 text-slate-400">
        {artifact.content}
      </pre>
      <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
        <span>Agent: {artifact.producingAgentId}</span>
        <span>{artifact.dependencyArtifactIds.length} deps · Confidence {artifact.confidence}% · Updated {formatTime(artifact.updatedAt)}</span>
      </div>
    </article>
  );
}

function DecisionCard({
  recommendation,
  confidence,
}: {
  recommendation: PersistedAppState["project"]["recommendation"];
  confidence: number;
}) {
  return (
    <div className="rounded-3xl border border-fuchsia-300/30 bg-gradient-to-br from-fuchsia-400/15 to-cyan-400/10 p-5">
      <div className="mono text-[10px] uppercase tracking-[0.28em] text-fuchsia-100/70">Synthesis decision</div>
      <div className={clsx("mt-2 text-3xl font-semibold", recommendationTone[recommendation])}>
        {recommendation.toUpperCase()}
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-300">
        Confidence sits at {confidence}%. The recommendation is derived from market pressure,
        persona objections, PRD scope, critique findings, and readiness constraints.
      </p>
    </div>
  );
}

function OrchestrationGraph({
  nodes,
  activeWorkspace,
}: {
  nodes: WorkflowNode[];
  activeWorkspace: WorkspaceId;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="mono text-[10px] uppercase tracking-[0.28em] text-cyan-200/70">Graph routing</div>
          <h3 className="mt-1 font-semibold">LangGraph StateGraph Nodes</h3>
        </div>
        <GitBranch className="text-cyan-200" size={20} />
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {nodes.map((node) => (
          <div
            key={node.id}
            className={clsx(
              "relative rounded-2xl border p-4",
              node.id === activeWorkspace ? "border-cyan-300/60 bg-cyan-300/10" : "border-white/10 bg-white/[0.03]",
            )}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold">{node.label}</span>
              <span className={clsx("status-pill", statusTone[node.status])}>{node.status}</span>
            </div>
            <div className="mt-3 text-xs leading-5 text-slate-500">
              Stage: {node.stage}
              <br />
              Agent: {node.assignedAgentId}
              <br />
              Artifacts: {node.outputArtifactIds.length}
              <br />
              Retries: {node.retryCount}/{node.maxRetries}
            </div>
            <div className="mt-3 rounded-xl border border-white/10 bg-black/25 p-3 text-[11px] leading-5 text-slate-400">
              <div className="mono mb-1 uppercase tracking-[0.18em] text-cyan-200/70">Validation</div>
              <ul className="space-y-1">
                {node.validationCriteria.slice(0, 2).map((criterion) => (
                  <li key={criterion}>- {criterion}</li>
                ))}
              </ul>
              <div className="mt-2 text-slate-500">
                Requires {node.requiredArtifactTypes.length} artifact types · Routes to{" "}
                {node.nextNodeIds.length > 0 ? node.nextNodeIds.join(", ") : "END"}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AgentGrid({ agents }: { agents: AgentState[] }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="mono text-[10px] uppercase tracking-[0.28em] text-cyan-200/70">Agent mesh</div>
          <h3 className="mt-1 font-semibold">Specialized validation agents</h3>
        </div>
        <Boxes className="text-cyan-200" size={20} />
      </div>
      <div className="grid max-h-[420px] gap-3 overflow-y-auto pr-1">
        {agents.map((agent) => (
          <div key={agent.id} className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
            <div className="mb-2 flex items-start justify-between gap-3">
              <div>
                <div className="font-medium">{agent.name}</div>
                <div className="text-xs text-slate-500">{agent.currentTask}</div>
              </div>
              <span className={clsx("status-pill", statusTone[agent.status])}>{agent.status}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-fuchsia-300"
                style={{ width: `${agent.progress}%` }}
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
              <span className="rounded-full border border-white/10 px-2 py-1 text-slate-500">
                deps {agent.dependencyArtifactIds.length}
              </span>
              <span className="rounded-full border border-white/10 px-2 py-1 text-slate-500">
                outputs {agent.outputArtifactIds.length}
              </span>
              {agent.dependencyArtifactIds.slice(0, 2).map((dependencyId) => (
                <span key={dependencyId} className="max-w-32 truncate rounded-full border border-cyan-300/20 px-2 py-1 text-cyan-100/80">
                  {dependencyId}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReadinessPanel({
  runtime,
  onDownload,
}: {
  runtime: PersistedAppState;
  onDownload: (format?: ExportFormat) => void;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.025] p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="mono text-[10px] uppercase tracking-[0.28em] text-cyan-200/70">Deployment readiness</div>
          <h3 className="mt-1 font-semibold">MVP execution score</h3>
        </div>
        <Gauge className="text-cyan-200" size={22} />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <ScoreRing label="Validation" value={runtime.project.validationConfidence} />
        <ScoreRing label="Readiness" value={runtime.project.readinessScore} />
      </div>
      <button className="btn-secondary mt-5 w-full justify-center" type="button" onClick={() => onDownload("html")}>
        <Download size={15} />
        Download HTML Package
      </button>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button className="btn-secondary justify-center" type="button" onClick={() => onDownload("markdown")}>
          <Download size={15} />
          Markdown
        </button>
        <button className="btn-secondary justify-center" type="button" onClick={() => onDownload("json")}>
          <Download size={15} />
          JSON
        </button>
      </div>
    </div>
  );
}

function ScoreRing({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-300/10 text-xl font-semibold text-cyan-100">
        {value}%
      </div>
      <div className="mono mt-3 text-[10px] uppercase tracking-[0.22em] text-slate-500">{label}</div>
    </div>
  );
}

function LogStream({ logs }: { logs: ExecutionLog[] }) {
  return (
    <div className="border-t border-white/10 bg-black/45 p-4" data-design-region="logs">
      <div className="mb-3 flex items-center gap-2">
        <Activity className="text-cyan-200" size={16} />
        <span className="mono text-[10px] uppercase tracking-[0.28em] text-cyan-200/70">Execution stream</span>
      </div>
      <div className="grid max-h-40 gap-2 overflow-y-auto font-mono text-xs">
        {logs.map((log) => (
          <div key={log.id} className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
            <span className="text-slate-600">{formatTime(log.timestamp)}</span>
            <span className="w-20 shrink-0 uppercase text-cyan-300/80">{log.level}</span>
            <span className="text-slate-300">{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function IntegrationDiagnostics({ runtime }: { runtime: PersistedAppState }) {
  const openAiCount = runtime.artifacts.filter((artifact) => artifact.evidenceSource === "openai").length;
  const fallbackCount = runtime.artifacts.filter((artifact) =>
    artifact.evidenceSource === "fallback" || artifact.evidenceSource === "deterministic-local"
  ).length;
  const imageCount = runtime.prototypeAssets.filter((asset) => asset.provider === "gpt-image-2").length;
  const recentCalls = runtime.logs
    .filter((log) =>
      log.message.includes("OpenAI") ||
      log.message.includes("fallback") ||
      log.message.includes("GPT Image") ||
      log.message.includes("local proxy")
    )
    .slice(-5)
    .reverse();

  return (
    <div className="rounded-2xl border border-fuchsia-300/20 bg-fuchsia-400/[0.045] p-4">
      <div className="mb-3 flex items-center gap-2 font-semibold">
        <Zap className="text-fuchsia-200" size={16} />
        Integration Diagnostics
      </div>
      <div className="grid gap-2 text-xs">
        <ConsoleRow label="OpenAI artifacts" value={String(openAiCount)} />
        <ConsoleRow label="Fallback artifacts" value={String(fallbackCount)} />
        <ConsoleRow label="GPT Image assets" value={String(imageCount)} />
      </div>
      <div className="mt-3 space-y-2">
        {recentCalls.length === 0 ? (
          <p className="text-xs leading-5 text-slate-500">No integration calls have been attempted yet.</p>
        ) : (
          recentCalls.map((log) => (
            <div key={log.id} className="rounded-xl border border-white/10 bg-black/25 p-2 text-xs leading-5 text-slate-400">
              <span className="text-cyan-200">{log.agentId ?? "system"}</span> · {log.message}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function DesignInspectionPanel({ checks }: { checks: DesignCheck[] }) {
  const blockedCount = checks.filter((check) => check.status === "blocked").length;

  return (
    <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.04] p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-semibold">
          <ShieldCheck className="text-emerald-200" size={16} />
          Automated Design Inspection
        </div>
        <span className={clsx("status-pill", statusTone[blockedCount === 0 ? "approved" : "blocked"])}>
          {blockedCount === 0 ? "approved" : `${blockedCount} blocked`}
        </span>
      </div>
      <div className="space-y-2">
        {checks.length === 0 ? (
          <p className="text-xs leading-5 text-slate-500">Waiting for rendered workspace measurements.</p>
        ) : (
          checks.map((check) => (
            <div key={check.label} className="rounded-xl border border-white/10 bg-black/25 p-2">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-medium text-slate-200">{check.label}</span>
                <span className={clsx("status-pill", statusTone[check.status])}>{check.status}</span>
              </div>
              <p className="mt-1 text-xs leading-5 text-slate-500">{check.detail}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ContextPanel({
  memory,
  artifacts,
  project,
  runtime,
  designChecks,
  downloadPackage,
}: {
  memory: MemoryEntry[];
  artifacts: Artifact[];
  project: PersistedAppState["project"];
  runtime: PersistedAppState;
  designChecks: DesignCheck[];
  downloadPackage: (format?: ExportFormat) => void;
}) {
  return (
    <>
      <div className="border-b border-white/10 p-5">
        <div className="mono text-[10px] uppercase tracking-[0.28em] text-cyan-200/70">Project memory</div>
        <h3 className="mt-1 text-lg font-semibold">{project.name}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-400">{project.refinedSummary}</p>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.045] p-4">
          <div className="mb-3 flex items-center gap-2 font-semibold">
            <Gauge className="text-cyan-200" size={16} />
            Operating Console
          </div>
          <div className="grid gap-2 text-xs">
            <ConsoleRow label="Mode" value={project.operatingMode} />
            <ConsoleRow label="Integration" value={project.integrationMode} />
            <ConsoleRow label="Active node" value={project.activeWorkspace} />
            <ConsoleRow label="Graph step" value={`${project.currentStep + 1}/6`} />
            <ConsoleRow label="Artifacts" value={String(artifacts.length)} />
            <ConsoleRow label="Open risks" value={String(runtime.risks.length)} />
            <ConsoleRow label="Synthesis" value={project.synthesisApproval} />
            <ConsoleRow label="Prototype" value={project.prototypeApproval} />
            <ConsoleRow label="Design" value={project.designValidation} />
            <ConsoleRow label="Branches" value={String(project.branchDecisions.length)} />
            <ConsoleRow label="Reject route" value={project.prototypeRejectionReason ?? "regenerate-prototype"} />
          </div>
        </div>
        <IntegrationDiagnostics runtime={runtime} />
        <DesignInspectionPanel checks={designChecks} />
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <div className="mb-3 flex items-center gap-2 font-semibold">
            <Layers3 className="text-cyan-200" size={16} />
            Artifact Vault
          </div>
          <div className="space-y-2">
            {artifacts.length === 0 ? (
              <p className="text-sm text-slate-500">Artifacts will appear as graph nodes complete.</p>
            ) : (
              artifacts.slice(-6).map((artifact) => (
                <div key={artifact.id} className="rounded-xl border border-white/10 bg-black/25 p-3">
                  <div className="text-sm font-medium">{artifact.title}</div>
                  <div className="text-xs text-slate-500">
                    {artifact.type} · v{artifact.version} · {artifact.confidence}% confidence
                    {artifact.reviewStatus ? ` · review ${artifact.reviewStatus}` : ""}
                    {artifact.approvalStatus ? ` · approval ${artifact.approvalStatus}` : ""}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <div className="mb-3 flex items-center gap-2 font-semibold">
            <BrainCircuit className="text-fuchsia-200" size={16} />
            Memory Sync
          </div>
          <div className="space-y-2">
            {memory.length === 0 ? (
              <p className="text-sm text-slate-500">Memory is waiting for intake context.</p>
            ) : (
              memory.slice(-7).map((entry) => (
                <div key={entry.id} className="rounded-xl border border-white/10 bg-black/25 p-3">
                  <div className="mono text-[9px] uppercase tracking-[0.22em] text-slate-500">{entry.category}</div>
                  <div className="mt-1 text-sm font-medium">{entry.title}</div>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{entry.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 p-5">
        <button className="btn-primary w-full justify-center" type="button" onClick={() => downloadPackage("html")}>
          <Download size={15} />
          Export Launch File
        </button>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button className="btn-secondary justify-center" type="button" onClick={() => downloadPackage("markdown")}>
            <Download size={15} />
            Export MD
          </button>
          <button className="btn-secondary justify-center" type="button" onClick={() => downloadPackage("json")}>
            <Download size={15} />
            Export JSON
          </button>
        </div>
      </div>
    </>
  );
}

function ConsoleRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/25 px-3 py-2">
      <span className="mono uppercase tracking-[0.18em] text-slate-500">{label}</span>
      <span className="font-medium text-cyan-100">{value}</span>
    </div>
  );
}

export function buildJsonPackage(runtime: PersistedAppState) {
  return JSON.stringify(
    {
      schemaVersion: runtime.schemaVersion,
      project: runtime.project,
      artifacts: runtime.artifacts,
      marketSignals: runtime.marketSignals,
      marketLeads: runtime.marketLeads,
      competitors: runtime.competitors,
      personas: runtime.personas,
      risks: runtime.risks,
      assumptionTests: runtime.assumptionTests,
      prototypeAssets: runtime.prototypeAssets.map((asset) => ({
        id: asset.id,
        title: asset.title,
        status: asset.status,
        reviewStatus: asset.reviewStatus,
        variant: asset.variant,
        rationale: asset.rationale,
        provider: asset.provider,
        prompt: asset.prompt,
        telemetryStatus: asset.telemetryStatus,
        attemptCount: asset.attemptCount,
        failureReason: asset.failureReason,
        lastAttemptAt: asset.lastAttemptAt,
        hasImage: Boolean(asset.imageDataUrl),
        createdAt: asset.createdAt,
      })),
      branchDecisions: runtime.project.branchDecisions,
      tasks: runtime.tasks,
      exportedAt: new Date().toISOString(),
    },
    null,
    2,
  );
}

export function buildMarkdownPackage(runtime: PersistedAppState) {
  const artifactSections = runtime.artifacts
    .map(
      (artifact) => [
        `## ${artifact.title}`,
        "",
        `- Type: ${artifact.type}`,
        `- Version: ${artifact.version}`,
        `- Status: ${artifact.status}`,
        `- Evidence: ${artifact.evidenceSource ?? "not-labelled"}`,
        `- Review: ${artifact.reviewStatus ?? "not-labelled"}`,
        `- Approval: ${artifact.approvalStatus ?? "not-labelled"}`,
        `- Confidence: ${artifact.confidence}%`,
        "",
        artifact.summary,
        "",
        "```text",
        artifact.content,
        "```",
      ].join("\n"),
    )
    .join("\n\n");
  const marketLeads = runtime.marketLeads
    .map((lead) => `- **${lead.buyerType}** (${lead.confidence}%, ${lead.evidenceSource}${lead.priority ? `, ${lead.priority}` : ""}): ${lead.painSignal} Segment: ${lead.segment ?? "unclassified"}. Scoring: ${lead.scoringRationale ?? "No scoring rubric available."} Validation question: ${lead.validationQuestion}`)
    .join("\n");
  const prototypes = runtime.prototypeAssets
    .map((asset) => `- **${asset.title}** (${asset.variant}, ${asset.provider}, ${asset.reviewStatus ?? "pending"}): ${asset.rationale} Attempts: ${asset.attemptCount}. Status: ${asset.telemetryStatus ?? asset.status}.${asset.failureReason ? ` Note: ${asset.failureReason}` : ""}`)
    .join("\n");
  const branches = runtime.project.branchDecisions
    .map((branch) => `- **${branch.decision}**: ${branch.langGraphRoute.join(" -> ")}. ${branch.reason}`)
    .join("\n");

  return [
    `# ${runtime.project.name} - ConductorIQ MVP Foundation Package`,
    "",
    `Recommendation: **${runtime.project.recommendation.toUpperCase()}**`,
    `Validation confidence: ${runtime.project.validationConfidence}%`,
    `Readiness score: ${runtime.project.readinessScore}%`,
    `Synthesis approval: ${runtime.project.synthesisApproval}`,
    `Prototype approval: ${runtime.project.prototypeApproval}`,
    `Design validation: ${runtime.project.designValidation}`,
    "",
    "## Refined Summary",
    "",
    runtime.project.refinedSummary,
    "",
    "## Market Leads",
    "",
    marketLeads || "- No market leads generated.",
    "",
    "## Prototype Directions",
    "",
    prototypes || "- No prototype assets generated.",
    "",
    "## LangGraph Branch Decisions",
    "",
    branches || "- No branch decisions recorded.",
    "",
    artifactSections,
  ].join("\n");
}

export function buildStaticPackage(runtime: PersistedAppState) {
  const artifacts = runtime.artifacts
    .map(
      (artifact) => `
        <section>
          <h2>${artifact.title}</h2>
          <p><strong>${artifact.type}</strong> · confidence ${artifact.confidence}%</p>
          <p>Version ${artifact.version} · Status ${artifact.status} · Evidence ${artifact.evidenceSource ?? "not-labelled"} · Review ${artifact.reviewStatus ?? "not-labelled"} · Approval ${artifact.approvalStatus ?? "not-labelled"} · Dependencies ${artifact.dependencyArtifactIds.length}</p>
          <p>${artifact.summary}</p>
          <pre>${artifact.content}</pre>
        </section>
      `,
    )
    .join("");
  const signals = runtime.marketSignals
    .map((signal) => `<li><strong>${signal.label}</strong>: ${signal.value} (${signal.source})</li>`)
    .join("");
  const competitors = runtime.competitors
    .map((competitor) => `<li><strong>${competitor.name}</strong> (${competitor.threat}): ${competitor.positioningGap}<br/>Differentiation: ${competitor.differentiation ?? "workflow depth and traceable validation state"}</li>`)
    .join("");
  const leads = runtime.marketLeads
    .map(
      (lead) =>
        `<li><strong>${lead.buyerType}</strong> (${lead.confidence}%, ${lead.evidenceSource}${lead.priority ? `, ${lead.priority}` : ""})<br/>Segment: ${lead.segment ?? "unclassified"}<br/>Pain: ${lead.painSignal}<br/>Question: ${lead.validationQuestion}<br/>Rationale: ${lead.rationale}<br/>Scoring: ${lead.scoringRationale ?? "No scoring rubric available."}</li>`,
    )
    .join("");
  const assumptions = runtime.assumptionTests
    .map(
      (test) =>
        `<li><strong>${test.assumption}</strong><br/>Method: ${test.testMethod}<br/>Pass signal: ${test.passSignal}<br/>Risk if wrong: ${test.riskIfWrong}</li>`,
    )
    .join("");
  const prototypes = runtime.prototypeAssets
    .map(
      (asset) =>
        `<li><strong>${asset.title}</strong> (${asset.provider}, ${asset.status}, ${asset.variant}, ${asset.reviewStatus ?? "pending"})<br/>Rationale: ${asset.rationale}<br/>Attempts: ${asset.attemptCount}. Telemetry: ${asset.telemetryStatus ?? asset.status}. Last attempt: ${asset.lastAttemptAt}. ${asset.failureReason ? `Failure reason: ${asset.failureReason}` : ""}<br/><pre>${asset.prompt}</pre>${asset.imageDataUrl ? `<img src="${asset.imageDataUrl}" alt="${asset.title}" />` : ""}</li>`,
    )
    .join("");
  const branches = runtime.project.branchDecisions
    .map(
      (branch) =>
        `<li><strong>${branch.decision}</strong>: ${branch.langGraphRoute.join(" -> ")}<br/>Reason: ${branch.reason}</li>`,
    )
    .join("");
  const risks = runtime.risks
    .map((risk) => `<li><strong>${risk.severity}</strong>: ${risk.risk}. Mitigation: ${risk.mitigation}</li>`)
    .join("");

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${runtime.project.name} · ConductorIQ MVP Package</title>
    <style>
      body { margin: 0; font-family: Inter, ui-sans-serif, system-ui; background: #05070f; color: #e5f7ff; line-height: 1.6; }
      main { max-width: 920px; margin: 0 auto; padding: 56px 24px; }
      section { border: 1px solid rgba(125, 231, 255, 0.18); border-radius: 24px; padding: 24px; margin: 18px 0; background: rgba(255,255,255,0.04); }
      h1 { font-size: 42px; line-height: 1.05; }
      h2 { color: #8be9ff; }
      pre { white-space: pre-wrap; background: rgba(0,0,0,.35); padding: 16px; border-radius: 16px; color: #bdd3df; }
      .pill { display: inline-block; border: 1px solid rgba(52,211,153,.35); color: #bbf7d0; border-radius: 999px; padding: 6px 10px; font-size: 12px; text-transform: uppercase; letter-spacing: .16em; }
    </style>
  </head>
  <body>
    <main>
      <span class="pill">ConductorIQ MVP Foundation Package</span>
      <h1>${runtime.project.name}</h1>
      <p>${runtime.project.refinedSummary}</p>
      <section>
        <h2>Final Recommendation</h2>
        <p>${runtime.project.recommendation.toUpperCase()} with ${runtime.project.validationConfidence}% validation confidence and ${runtime.project.readinessScore}% deployment readiness.</p>
        <p>Synthesis approval: ${runtime.project.synthesisApproval}. Prototype approval: ${runtime.project.prototypeApproval}. Design validation: ${runtime.project.designValidation}.</p>
      </section>
      <section>
        <h2>Market Signals</h2>
        <ul>${signals}</ul>
      </section>
      <section>
        <h2>Market Leads</h2>
        <ul>${leads}</ul>
      </section>
      <section>
        <h2>Competitor Pressure</h2>
        <ul>${competitors}</ul>
      </section>
      <section>
        <h2>Assumption Tests</h2>
        <ul>${assumptions}</ul>
      </section>
      <section>
        <h2>Prototype Direction</h2>
        <ul>${prototypes}</ul>
      </section>
      <section>
        <h2>LangGraph Branch Decisions</h2>
        <ul>${branches || "<li>No approval branch decisions recorded.</li>"}</ul>
      </section>
      <section>
        <h2>Risk Register</h2>
        <ul>${risks}</ul>
      </section>
      ${artifacts}
      <section>
        <h2>Next Actions</h2>
        <ol>
          <li>Interview five target users against the strongest pain assumption.</li>
          <li>Validate willingness to pay before widening MVP scope.</li>
          <li>Prototype only the features tied directly to the build decision.</li>
          <li>Re-run ConductorIQ when new evidence changes the assumptions.</li>
        </ol>
      </section>
    </main>
  </body>
</html>`;
}

export default App;
