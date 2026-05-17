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
import { createEmptyPackage, revealPackageStep, runConductorGraph } from "./orchestration";
import { workspaces } from "./data";
import type {
  AgentState,
  Artifact,
  ExecutionLog,
  MemoryEntry,
  OrchestrationPackage,
  PersistedAppState,
  WorkspaceId,
  WorkflowNode,
} from "./types";

const STORAGE_KEY = "conductoriq.runtime.v1";
const FULL_PACKAGE_KEY = "conductoriq.fullPackage.v1";
const sampleIdea = "Build an AI-native cybersecurity SOC assistant for lean security teams.";

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
  retrying: "border-orange-300/60 bg-orange-300/10 text-orange-100",
  paused: "border-slate-600 bg-slate-800 text-slate-300",
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
    return { visible: { ...emptyPackage, selectedWorkspace: "intake", isRunning: false }, full: null };
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
  return { visible: { ...emptyPackage, selectedWorkspace: "intake", isRunning: false }, full: null };
};

const normalizePackage = (value: OrchestrationPackage): OrchestrationPackage => ({
  ...value,
  marketSignals: value.marketSignals ?? [],
  competitors: value.competitors ?? [],
  personas: value.personas ?? [],
  risks: value.risks ?? [],
  tasks: value.tasks ?? [],
  project: {
    ...value.project,
    operatingMode: value.project.operatingMode ?? (value.project.status === "completed" ? "completed" : "paused"),
  },
});

const normalizeRuntime = (value: PersistedAppState): PersistedAppState => ({
  ...normalizePackage(value),
  selectedWorkspace: value.selectedWorkspace ?? "intake",
  isRunning: value.isRunning ?? false,
});

const formatTime = (timestamp: string) =>
  new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(timestamp));

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
  const [error, setError] = useState("");
  const [tickMs, setTickMs] = useState(1600);
  const fullPackageRef = useRef<OrchestrationPackage | null>(initialState.full);

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
        const nextStep = Math.min(current.project.currentStep + 1, workspaces.length - 1);
        const visible = revealPackageStep(fullPackageRef.current as OrchestrationPackage, nextStep);
        return {
          ...visible,
          selectedWorkspace: visible.project.activeWorkspace,
          isRunning: visible.project.status !== "completed",
        };
      });
    }, tickMs);

    return () => window.clearInterval(timer);
  }, [runtime.isRunning, tickMs]);

  const activeWorkspace = workspaces.find((workspace) => workspace.id === runtime.selectedWorkspace) ?? workspaces[0];
  const activeArtifacts = runtime.artifacts.filter((artifact) => artifact.sourceNodeId === activeWorkspace.id);
  const visibleLogs = runtime.logs.slice(-12).reverse();

  const startWorkflow = async () => {
    const trimmedIdea = idea.trim();
    if (!trimmedIdea) {
      setError("Enter a startup idea before activating the orchestration runtime.");
      return;
    }

    setError("");
    setIsGenerating(true);

    try {
      const graphPackage = await runConductorGraph(trimmedIdea);
      const visible = revealPackageStep(graphPackage, 0);
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
    setRuntime({ ...emptyPackage, selectedWorkspace: "intake", isRunning: false });
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
    setError("");
  };

  const downloadPackage = () => {
    const html = buildStaticPackage(runtime);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "conductoriq-mvp-package.html";
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
      const nextStep = Math.min(current.project.currentStep + 1, workspaces.length - 1);
      const visible = revealPackageStep(fullPackageRef.current as OrchestrationPackage, nextStep);
      return {
        ...visible,
        selectedWorkspace: visible.project.activeWorkspace,
        isRunning: false,
        project: { ...visible.project, operatingMode: visible.project.status === "completed" ? "completed" : "paused" },
      };
    });
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
                  running={runtime.project.activeWorkspace === workspace.id && runtime.project.status === "running"}
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
                artifacts, and logs for demo pacing.
              </p>
            </div>
          </aside>

          <main className="panel-glass flex min-h-[calc(100vh-112px)] flex-col overflow-hidden">
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
                  <IntakeWorkspace
                    idea={idea}
                    setIdea={setIdea}
                    importBrief={importBrief}
                    startWorkflow={startWorkflow}
                    isGenerating={isGenerating}
                    error={error}
                  />
                ) : (
                  <WorkspaceIntelligence workspaceId={activeWorkspace.id} artifacts={activeArtifacts} runtime={runtime} />
                )}
                <OrchestrationGraph nodes={runtime.nodes} activeWorkspace={runtime.project.activeWorkspace} />
              </section>

              <section className="space-y-4">
                <AgentGrid agents={runtime.agents} />
                <ReadinessPanel runtime={runtime} onDownload={downloadPackage} />
              </section>
            </div>
            <LogStream logs={visibleLogs} />
          </main>

          <aside className="panel-glass flex min-h-[calc(100vh-112px)] flex-col overflow-hidden">
            <ContextPanel
              memory={runtime.memory}
              artifacts={runtime.artifacts}
              project={runtime.project}
              runtime={runtime}
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
            <option value={850}>Rapid demo</option>
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
}: {
  idea: string;
  setIdea: (idea: string) => void;
  importBrief: (file: File | undefined) => void;
  startWorkflow: () => void;
  isGenerating: boolean;
  error: string;
}) {
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
        placeholder="Example: Build an AI-native cybersecurity SOC assistant."
      />
      {error ? <p className="mt-3 text-sm text-red-200">{error}</p> : null}
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <IntakeSignal icon={ShieldCheck} title="Scope Guard" text="Six workspaces only, no auth, no billing, no database." />
        <IntakeSignal icon={GitBranch} title="LangGraph Path" text="StateGraph routes Intake through Launch with fallback branches." />
        <IntakeSignal icon={Zap} title="Demo Mode" text="External failures become labeled fallback states, not blockers." />
      </div>
      <button className="btn-primary mt-5 w-full justify-center py-4" type="button" onClick={startWorkflow} disabled={isGenerating}>
        <Play size={16} />
        {isGenerating ? "Compiling LangGraph package..." : "Activate ConductorIQ"}
      </button>
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

function WorkspaceIntelligence({
  workspaceId,
  artifacts,
  runtime,
}: {
  workspaceId: WorkspaceId;
  artifacts: Artifact[];
  runtime: PersistedAppState;
}) {
  if (artifacts.length === 0) {
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
      <WorkspaceBoard workspaceId={workspaceId} runtime={runtime} />
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
}: {
  workspaceId: WorkspaceId;
  runtime: PersistedAppState;
}) {
  if (workspaceId === "strategy") {
    return (
      <div className="grid gap-3 xl:grid-cols-2">
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

  if (workspaceId === "synthesis" || workspaceId === "deployment" || workspaceId === "launch") {
    return (
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
    );
  }

  return null;
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
        </div>
        <span className={clsx("status-pill", statusTone[artifact.status])}>{artifact.status}</span>
      </div>
      <p className="text-sm leading-6 text-slate-300">{artifact.summary}</p>
      <pre className="mt-4 whitespace-pre-wrap rounded-2xl border border-white/10 bg-black/30 p-4 text-xs leading-6 text-slate-400">
        {artifact.content}
      </pre>
      <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
        <span>Agent: {artifact.producingAgentId}</span>
        <span>Confidence {artifact.confidence}%</span>
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
              Agent: {node.assignedAgentId}
              <br />
              Artifacts: {node.outputArtifactIds.length}
              <br />
              Retries: {node.retryCount}/{node.maxRetries}
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
  onDownload: () => void;
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
      <button className="btn-secondary mt-5 w-full justify-center" type="button" onClick={onDownload}>
        <Download size={15} />
        Download Static MVP Package
      </button>
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
    <div className="border-t border-white/10 bg-black/45 p-4">
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

function ContextPanel({
  memory,
  artifacts,
  project,
  runtime,
  downloadPackage,
}: {
  memory: MemoryEntry[];
  artifacts: Artifact[];
  project: PersistedAppState["project"];
  runtime: PersistedAppState;
  downloadPackage: () => void;
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
          </div>
        </div>
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
                  <div className="text-xs text-slate-500">{artifact.type} · {artifact.confidence}% confidence</div>
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
        <button className="btn-primary w-full justify-center" type="button" onClick={downloadPackage}>
          <Download size={15} />
          Export Launch File
        </button>
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

function buildStaticPackage(runtime: PersistedAppState) {
  const artifacts = runtime.artifacts
    .map(
      (artifact) => `
        <section>
          <h2>${artifact.title}</h2>
          <p><strong>${artifact.type}</strong> · confidence ${artifact.confidence}%</p>
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
    .map((competitor) => `<li><strong>${competitor.name}</strong> (${competitor.threat}): ${competitor.positioningGap}</li>`)
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
      </section>
      <section>
        <h2>Market Signals</h2>
        <ul>${signals}</ul>
      </section>
      <section>
        <h2>Competitor Pressure</h2>
        <ul>${competitors}</ul>
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
