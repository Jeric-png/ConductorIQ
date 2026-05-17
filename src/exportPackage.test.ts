import { describe, expect, it } from "vitest";
import { buildJsonPackage, buildMarkdownPackage, normalizeRuntime } from "./App";
import { createEmptyPackage } from "./runtimePackage";
import type { Artifact } from "./types";

const artifact: Artifact = {
  id: "artifact-prd",
  type: "prd",
  title: "Comprehensive MVP PRD Draft",
  status: "approved",
  producingAgentId: "prd",
  sourceNodeId: "prd",
  dependencyArtifactIds: [],
  version: 1,
  confidence: 88,
  summary: "Comprehensive PRD summary.",
  content: "Detailed PRD content.",
  evidenceSource: "deterministic-local",
  reviewStatus: "reviewed",
  approvalStatus: "not-required",
  updatedAt: "2026-05-17T00:00:00.000Z",
};

describe("local package export variants", () => {
  it("builds reusable Markdown and JSON package outputs", () => {
    const runtime = normalizeRuntime({
      ...createEmptyPackage(),
      artifacts: [artifact],
      marketLeads: [
        {
          buyerType: "Founder",
          painSignal: "Needs validated scope.",
          rationale: "High urgency.",
          validationQuestion: "Would this change the build decision?",
          confidence: 82,
          evidenceSource: "fallback",
        },
      ],
      project: {
        ...createEmptyPackage().project,
        name: "Validation Copilot",
        recommendation: "refine",
        validationConfidence: 82,
        readinessScore: 76,
        branchDecisions: [
          {
            id: "branch-1",
            timestamp: "2026-05-17T00:00:00.000Z",
            decision: "prototype-approved",
            fromWorkspace: "deployment",
            toWorkspace: "launch",
            reason: "Prototype approved.",
            langGraphRoute: ["deployment", "launch"],
          },
        ],
      },
    });

    const markdown = buildMarkdownPackage(runtime);
    const json = JSON.parse(buildJsonPackage(runtime)) as { project: { name: string }; artifacts: Artifact[] };

    expect(markdown).toContain("# Validation Copilot - ConductorIQ MVP Foundation Package");
    expect(markdown).toContain("Comprehensive MVP PRD Draft");
    expect(markdown).toContain("deployment -> launch");
    expect(json.project.name).toBe("Validation Copilot");
    expect(json.artifacts[0].title).toBe("Comprehensive MVP PRD Draft");
  });
});
