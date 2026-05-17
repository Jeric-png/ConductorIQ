// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import type { BranchDecision, OrchestrationPackage, PrototypeRejectionReason, WorkspaceId } from "./types";

const now = () => new Date("2026-05-17T06:00:00.000Z").toISOString();

vi.mock("./orchestration", async () => {
  const runtime = await vi.importActual<typeof import("./runtimePackage")>("./runtimePackage");

  const artifact = (
    type: OrchestrationPackage["artifacts"][number]["type"],
    sourceNodeId: WorkspaceId,
    title: string,
    producingAgentId: string,
    version = 1,
  ): OrchestrationPackage["artifacts"][number] => ({
    id: `${sourceNodeId}-${type}-${version}`,
    type,
    title,
    status: sourceNodeId === "deployment" && type === "prototype" ? "awaiting-user-approval" : "approved",
    producingAgentId,
    sourceNodeId,
    dependencyArtifactIds: sourceNodeId === "intake" ? [] : ["intake-prompt-1"],
    version,
    confidence: 82,
    summary: `${title} summary`,
    content: `${title} content with enough detail for workflow testing.`,
    evidenceSource: "deterministic-local",
    reviewStatus: sourceNodeId === "deployment" ? "under-review" : "reviewed",
    approvalStatus: sourceNodeId === "deployment" ? "pending" : "not-required",
    updatedAt: now(),
  });

  const runConductorGraph = async (rawIdea: string): Promise<OrchestrationPackage> => {
    const base = runtime.createEmptyPackage();
    const artifacts: OrchestrationPackage["artifacts"] = [
      artifact("prompt", "intake", "Crafted Validation Prompt", "prompt-architect"),
      artifact("prompt-review", "intake", "Prompt Validation Review", "prompt-validator"),
      artifact("market-insight", "strategy", "Market Validation Evidence", "market-research"),
      artifact("competitor-analysis", "strategy", "Competitor Landscape", "competitor-analysis"),
      artifact("persona", "strategy", "Persona Simulation", "persona-validation"),
      artifact("prd", "prd", "Comprehensive MVP PRD Draft", "prd"),
      artifact("prd-review", "prd", "PRD Review Findings", "prd-reviewer"),
      artifact("ux-flow", "prd", "UX Flow Requirements", "ux-ui"),
      artifact("synthesis-plan", "synthesis", "Review-First Synthesis Plan", "qa-critic"),
      artifact("interface-review", "synthesis", "Interface Improvement Critique", "interface-improvement"),
      artifact("qa-critique", "synthesis", "QA Critic Findings", "qa-critic"),
      artifact("mvp-plan", "synthesis", "Build Decision Recommendation", "qa-critic"),
      artifact("architecture", "deployment", "MVP Readiness Plan", "architecture"),
      artifact("prototype", "deployment", "Prototype Review Gate", "prototype-review"),
      artifact("implementation-plan", "launch", "Approval-Backed Implementation Plan", "build-orchestrator"),
      artifact("design-validation", "launch", "Design Validation Report", "designer"),
      artifact("launch-plan", "launch", "MVP Foundation Package", "launch"),
    ];

    return {
      ...base,
      project: {
        ...base.project,
        id: "test-project",
        name: "AI SOC Assistant",
        rawIdea,
        refinedSummary: "A validated local workflow for lean SOC teams.",
        status: "running",
        validationConfidence: 82,
        readinessScore: 86,
        recommendation: "refine",
        integrationMode: "fallback",
        synthesisApproval: "pending",
      },
      artifacts,
      logs: [
        {
          id: "test-log",
          timestamp: now(),
          level: "system",
          nodeId: "intake",
          agentId: "supervisor",
          message: "Mock LangGraph package generated for workflow test.",
        },
      ],
      memory: [],
      marketSignals: [{ label: "Urgency", value: "Alert triage pressure exists.", sentiment: "positive", source: "fallback" }],
      competitors: [{ name: "Generic Copilot", category: "Horizontal AI", threat: "medium", positioningGap: "Workflow depth gap." }],
      personas: [{ persona: "SOC Lead", quote: "I need a scoped pilot.", confidence: 81, objection: "Trust boundaries." }],
      risks: [{ risk: "Evidence may be synthetic.", severity: "medium", mitigation: "Label fallback clearly." }],
      marketLeads: [
        {
          buyerType: "Lean SOC lead",
          painSignal: "Alert queue overload.",
          rationale: "High urgency workflow.",
          validationQuestion: "Which alert decision needs drafting?",
          confidence: 80,
          evidenceSource: "fallback",
        },
      ],
      assumptionTests: [
        {
          assumption: "SOC teams want workflow-specific help.",
          testMethod: "Pilot interview.",
          passSignal: "Three teams agree to trial.",
          riskIfWrong: "Nice-to-have product.",
        },
      ],
      prototypeAssets: [
        {
          id: "prototype-primary",
          title: "Visual Prompt Fallback",
          status: "fallback",
          reviewStatus: "pending",
          telemetryStatus: "fallback",
          variant: "primary",
          rationale: "Primary direction.",
          prompt: "Primary prototype prompt.",
          provider: "fallback",
          attemptCount: 1,
          failureReason: "Mock image fallback.",
          lastAttemptAt: now(),
          createdAt: now(),
        },
        {
          id: "prototype-workflow",
          title: "Workflow Control Room Variant",
          status: "fallback",
          reviewStatus: "pending",
          telemetryStatus: "not-attempted",
          variant: "workflow",
          rationale: "Workflow direction.",
          prompt: "Workflow prototype prompt.",
          provider: "fallback",
          attemptCount: 0,
          failureReason: "Mock comparison variant.",
          lastAttemptAt: now(),
          createdAt: now(),
        },
      ],
      tasks: [{ title: "Review prototype direction", owner: "Prototype Review Agent", status: "running" }],
    };
  };

  const resolveBranchDecision = async (
    decision: BranchDecision["decision"],
    rejectionReason: PrototypeRejectionReason | "none" = "none",
  ): Promise<BranchDecision> => {
    const routeMap: Record<string, WorkspaceId> = {
      "synthesis-approved": "deployment",
      "synthesis-revision": "synthesis",
      "synthesis-rerun": "intake",
      "prototype-approved": "launch",
      "prototype-regenerated": "deployment",
      "prototype-rejected:revise-prd": "prd",
      "prototype-rejected:revise-prompt": "intake",
      "prototype-rejected:return-synthesis": "synthesis",
      "prototype-rejected:regenerate-prototype": "deployment",
    };
    const key = decision === "prototype-rejected" ? `${decision}:${rejectionReason}` : decision;
    const toWorkspace = routeMap[key] ?? "deployment";
    const fromWorkspace = decision.startsWith("synthesis") ? "synthesis" : "deployment";

    return {
      id: `branch-${key}`,
      timestamp: now(),
      decision,
      fromWorkspace,
      toWorkspace,
      reason: `Mock route ${fromWorkspace} -> ${toWorkspace}`,
      langGraphRoute: [fromWorkspace, toWorkspace],
    };
  };

  return { runConductorGraph, resolveBranchDecision };
});

describe("ConductorIQ approval workflow", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            data: [{ b64_json: "dmlzdWFsaXNl", revised_prompt: "Mock GPT Image 2 interface concept." }],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("imports a markdown idea brief and starts the workflow from imported text", async () => {
    const user = userEvent.setup();
    render(<App />);
    const importedIdea = "Build an AI-native fraud review copilot for fintech risk teams.";
    const file = new File([`# Idea\n\n${importedIdea}`], "idea-brief.md", {
      type: "text/markdown",
    });

    await user.upload(screen.getByLabelText(/Import \.md\/\.txt/i), file);

    await waitFor(() => {
      const textarea = screen.getByPlaceholderText(/I want to build a website/i) as HTMLTextAreaElement;
      expect(textarea.value).toBe(`# Idea\n\n${importedIdea}`);
    });

    await user.click(screen.getByRole("button", { name: "Activate ConductorIQ" }));
    await waitFor(
      () => expect(screen.getByText("Synthesis Plan hold")).toBeTruthy(),
      { timeout: 12000 },
    );
  }, 22000);

  it("covers synthesis approval, prototype rejection, regeneration, approval, and Launch unlock", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(
      screen.getByPlaceholderText(/I want to build a website/i),
      "Build an AI-native fraud review copilot for fintech risk teams.",
    );
    await user.click(screen.getByRole("button", { name: "Activate ConductorIQ" }));

    await waitFor(
      () => expect(screen.getByText("Synthesis Plan hold")).toBeTruthy(),
      { timeout: 7000 },
    );

    await user.click(screen.getByRole("button", { name: "Approve Synthesis" }));
    await screen.findByText("Prototype Options");
    await screen.findByText("Visualise Prototype");
    await user.click(screen.getByRole("button", { name: "Visualise With GPT Image 2" }));
    expect((await screen.findAllByText("Visualise Image Output v2")).length).toBeGreaterThan(0);

    const selectButtons = screen.getAllByRole("button", { name: "Select Direction" });
    await user.click(selectButtons[1]);
    expect(screen.getByText("Selected")).toBeTruthy();

    await user.selectOptions(screen.getByLabelText(/Rejection route/i), "revise-prd");
    await user.click(screen.getByRole("button", { name: "Reject Selected Prototype" }));

    await waitFor(() => expect(screen.getByRole("heading", { name: "PRD Generation" })).toBeTruthy());
    expect(screen.getByText("Comprehensive MVP PRD Draft")).toBeTruthy();
    const rejectedState = JSON.parse(
      window.localStorage.getItem("conductoriq.runtime.v1") ?? "{}",
    ) as Partial<OrchestrationPackage> & { selectedWorkspace?: string };
    expect(rejectedState.selectedWorkspace).toBe("prd");
    expect(rejectedState.project?.prototypeApproval).toBe("rejected");
    expect(rejectedState.project?.branchDecisions.at(-1)?.decision).toBe("prototype-rejected");
    expect(rejectedState.project?.branchDecisions.at(-1)?.toWorkspace).toBe("prd");

    await user.click(screen.getAllByRole("button", { name: /Deployment/ })[0]);
    await user.click(screen.getByRole("button", { name: "Regenerate Prototype" }));
    await user.click(screen.getByRole("button", { name: "Approve Selected Prototype" }));

    expect((await screen.findAllByText("MVP Foundation Package")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Design Validation Report").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Export Launch File" })).toBeTruthy();
    const approvedState = JSON.parse(
      window.localStorage.getItem("conductoriq.runtime.v1") ?? "{}",
    ) as Partial<OrchestrationPackage> & { selectedWorkspace?: string };
    expect(approvedState.selectedWorkspace).toBe("launch");
    expect(approvedState.project?.prototypeApproval).toBe("approved");
    expect(approvedState.project?.branchDecisions.some((branch) => branch.decision === "prototype-approved")).toBe(true);
    expect(approvedState.project?.selectedPrototypeAssetId).toMatch(/prototype-regenerated/);
  }, 15000);
});
