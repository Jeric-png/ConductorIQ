import { describe, expect, it } from "vitest";
import { normalizeRuntime, STORAGE_SCHEMA_VERSION } from "./App";
import { createEmptyPackage } from "./runtimePackage";
import type { PersistedAppState } from "./types";

describe("localStorage runtime migration", () => {
  it("hydrates old partial runtime snapshots with current schema defaults", () => {
    const oldSnapshot = {
      ...createEmptyPackage(),
      selectedWorkspace: "deployment",
      isRunning: true,
      project: {
        ...createEmptyPackage().project,
        rawIdea: "Build an AI SOC assistant",
        prototypeApproval: "rejected",
      },
      prototypeAssets: [
        {
          id: "legacy-prototype",
          title: "Legacy Prototype",
          status: "fallback",
          prompt: "Legacy prompt",
          provider: "fallback",
          createdAt: "2026-05-17T00:00:00.000Z",
        },
      ],
    } as unknown as Partial<PersistedAppState>;

    const migrated = normalizeRuntime(oldSnapshot);

    expect(migrated.schemaVersion).toBe(STORAGE_SCHEMA_VERSION);
    expect(migrated.selectedWorkspace).toBe("deployment");
    expect(migrated.project.prototypeRejectionReason).toBe("regenerate-prototype");
    expect(migrated.project.branchDecisions).toEqual([]);
    expect(migrated.prototypeAssets[0].variant).toBe("primary");
    expect(migrated.prototypeAssets[0].reviewStatus).toBe("pending");
    expect(migrated.prototypeAssets[0].rationale).toBe("Prototype direction awaiting review.");
    expect(migrated.prototypeAssets[0].attemptCount).toBe(1);
    expect(migrated.prototypeAssets[0].failureReason).toContain("GPT Image 2 was unavailable");
    expect(migrated.prototypeAssets[0].lastAttemptAt).toBe("2026-05-17T00:00:00.000Z");
  });
});
