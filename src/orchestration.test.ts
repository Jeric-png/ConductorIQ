import { describe, expect, it } from "vitest";
import { createFallbackResearch } from "./integrations";
import { resolveBranchDecision } from "./orchestration";
import { analyzePromptQuality } from "./promptQuality";
import { createEmptyPackage, revealPackageStep } from "./runtimePackage";

describe("ConductorIQ orchestration helpers", () => {
  it("creates a six-workspace empty package with local-only defaults", () => {
    const runtime = createEmptyPackage();

    expect(runtime.nodes.map((node) => node.id)).toEqual([
      "intake",
      "strategy",
      "prd",
      "synthesis",
      "deployment",
      "launch",
    ]);
    expect(runtime.project.prototypeRejectionReason).toBe("regenerate-prototype");
    expect(runtime.project.branchDecisions).toEqual([]);
  });

  it("reveals workflow state without skipping approval-gated workspaces", () => {
    const runtime = createEmptyPackage();
    const revealed = revealPackageStep(runtime, 3);

    expect(revealed.project.activeWorkspace).toBe("synthesis");
    expect(revealed.project.synthesisApproval).toBe("not-started");
    expect(revealed.project.prototypeApproval).toBe("not-started");
  });

  it("produces fallback research with explicit source labels", () => {
    const fallback = createFallbackResearch("Build an AI SOC assistant", "cybersecurity operations");

    expect(fallback.mode).toBe("fallback");
    expect(fallback.marketLeads.length).toBeGreaterThanOrEqual(3);
    expect(fallback.marketLeads.every((lead) => lead.evidenceSource === "fallback")).toBe(true);
    expect(fallback.marketLeads.every((lead) => lead.scoreBreakdown)).toBe(true);
    expect(fallback.signals.every((signal) => signal.source === "fallback")).toBe(true);
  });

  it("calculates consumer-social market leads for friendship ideas", () => {
    const fallback = createFallbackResearch(
      "I want to build an app that allows people to meet friends",
      "consumer social",
    );

    expect(fallback.marketLeads[0].buyerType).toBe("New-city young professional");
    expect(fallback.marketLeads[0].segment).toContain("Consumer social");
    expect(fallback.marketLeads[0].confidence).toBeGreaterThan(50);
    expect(fallback.marketLeads[0].confidence).toBeLessThan(80);
    expect(fallback.summary).toContain("Market lead confidence is calculated");
  });

  it("flags generic intake prompts before downstream validation", () => {
    const generic = analyzePromptQuality("I want to build an app that allows people to meet friends");
    const specific = analyzePromptQuality(
      "Build a consumer social app for new-city remote workers who struggle to make recurring local friends, starting with curated small-group weekend plans and safety-first matching.",
    );

    expect(generic.level).not.toBe("strong");
    expect(generic.missingContext).toContain("Specific target segment beyond generic people/users");
    expect(generic.clarifyingQuestions.length).toBeGreaterThan(0);
    expect(specific.score).toBeGreaterThan(generic.score);
  });

  it("routes prototype rejection reasons through the conditional LangGraph branch router", async () => {
    const promptRoute = await resolveBranchDecision("prototype-rejected", "revise-prompt");
    const prdRoute = await resolveBranchDecision("prototype-rejected", "revise-prd");
    const synthesisRoute = await resolveBranchDecision("prototype-rejected", "return-synthesis");
    const regenerateRoute = await resolveBranchDecision("prototype-rejected", "regenerate-prototype");

    expect(promptRoute.toWorkspace).toBe("intake");
    expect(prdRoute.toWorkspace).toBe("prd");
    expect(synthesisRoute.toWorkspace).toBe("synthesis");
    expect(regenerateRoute.toWorkspace).toBe("deployment");
  });

  it("routes approval gates forward through the conditional LangGraph branch router", async () => {
    const synthesis = await resolveBranchDecision("synthesis-approved");
    const prototype = await resolveBranchDecision("prototype-approved");

    expect(synthesis.langGraphRoute).toEqual(["synthesis", "deployment"]);
    expect(prototype.langGraphRoute).toEqual(["deployment", "launch"]);
  });
});
