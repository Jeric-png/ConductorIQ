export type PromptQualityLevel = "empty" | "weak" | "usable" | "strong";

export interface PromptQualityReport {
  score: number;
  level: PromptQualityLevel;
  strengths: string[];
  missingContext: string[];
  clarifyingQuestions: string[];
  assumedTargetUser: string;
  assumedPain: string;
  specificityLabel: string;
}

const includesAny = (value: string, terms: string[]) => terms.some((term) => value.includes(term));

const clampScore = (value: number) => Math.min(100, Math.max(0, Math.round(value)));

export const analyzePromptQuality = (idea: string): PromptQualityReport => {
  const trimmed = idea.trim();
  const lower = trimmed.toLowerCase();
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length;

  if (!trimmed) {
    return {
      score: 0,
      level: "empty",
      strengths: [],
      missingContext: ["Startup idea"],
      clarifyingQuestions: ["What product or startup idea should ConductorIQ validate?"],
      assumedTargetUser: "Unknown",
      assumedPain: "Unknown",
      specificityLabel: "No intake provided",
    };
  }

  const hasSpecificTargetUser =
    includesAny(lower, [
      "founder",
      "operator",
      "manager",
      "analyst",
      "student",
      "remote worker",
      "security team",
      "clinic",
      "developer",
      "designer",
      "creator",
      "organizer",
      "new city",
      "new-city",
    ]) || /for\s+(?!people\b|users\b|everyone\b)[a-z0-9 -]{4,}/.test(lower);
  const hasGenericTargetOnly = includesAny(lower, ["people", "users", "anyone", "everyone"]) && !hasSpecificTargetUser;
  const hasPain = includesAny(lower, [
    "problem",
    "pain",
    "struggle",
    "hard",
    "difficult",
    "overload",
    "slow",
    "cost",
    "lonely",
    "trust",
    "manual",
    "waste",
    "risk",
    "need",
  ]);
  const hasSolutionShape = includesAny(lower, ["app", "platform", "assistant", "workflow", "tool", "marketplace", "dashboard", "agent"]);
  const hasDomainSignal = includesAny(lower, [
    "friend",
    "social",
    "cyber",
    "security",
    "health",
    "clinic",
    "finance",
    "developer",
    "education",
    "community",
    "meetup",
    "soc",
  ]);
  const hasOutcome = includesAny(lower, [
    "so that",
    "help",
    "reduce",
    "increase",
    "save",
    "decide",
    "validate",
    "meet",
    "find",
    "connect",
    "automate",
  ]);
  const hasDifferentiation = includesAny(lower, ["unlike", "different", "better", "ai-native", "unique", "instead of"]);
  const hasBusinessContext = includesAny(lower, ["pay", "paid", "subscription", "b2b", "consumer", "market", "buyer", "customer"]);

  const strengths = [
    hasSolutionShape ? "Solution shape is present" : "",
    hasDomainSignal ? "Product domain signal is present" : "",
    hasOutcome ? "Desired user outcome is implied" : "",
    hasSpecificTargetUser ? "Specific target user is identified" : "",
    hasPain ? "Pain or motivation is stated" : "",
    hasDifferentiation ? "Differentiation signal is present" : "",
    hasBusinessContext ? "Business context is present" : "",
  ].filter(Boolean);

  const missingContext = [
    hasSpecificTargetUser ? "" : hasGenericTargetOnly ? "Specific target segment beyond generic people/users" : "Target user segment",
    hasPain ? "" : "Pain point or urgent job-to-be-done",
    hasOutcome ? "" : "Success outcome",
    hasDifferentiation ? "" : "Differentiation from existing alternatives",
    hasBusinessContext ? "" : "Business model or willingness-to-pay assumption",
    wordCount >= 14 ? "" : "Enough detail for high-confidence validation",
  ].filter(Boolean);

  const score = clampScore(
    24 +
      Math.min(18, wordCount * 1.2) +
      (hasSpecificTargetUser ? 16 : hasGenericTargetOnly ? 5 : 0) +
      (hasPain ? 14 : 0) +
      (hasSolutionShape ? 10 : 0) +
      (hasDomainSignal ? 10 : 0) +
      (hasOutcome ? 8 : 0) +
      (hasDifferentiation ? 6 : 0) +
      (hasBusinessContext ? 6 : 0),
  );

  const level: PromptQualityLevel = score >= 78 ? "strong" : score >= 62 ? "usable" : "weak";
  const isFriendIdea = includesAny(lower, ["friend", "friends", "meet people", "social", "community"]);

  return {
    score,
    level,
    strengths,
    missingContext,
    clarifyingQuestions: [
      hasSpecificTargetUser
        ? ""
        : isFriendIdea
          ? "Which first user segment matters most: new-city professionals, students, remote workers, or community organizers?"
          : "Who is the first narrow target user segment?",
      hasPain
        ? ""
        : isFriendIdea
          ? "What specific friendship pain is being solved: loneliness, finding recurring plans, safety, or matching by interests?"
          : "What urgent pain or repeated workflow makes this worth solving now?",
      hasDifferentiation
        ? ""
        : "What existing alternative does the user use today, and why is it insufficient?",
      hasBusinessContext ? "" : "Who would pay or commit time for the first version, and what proof would convince them?",
    ].filter(Boolean),
    assumedTargetUser: isFriendIdea
      ? "People seeking local friendships, with strongest initial assumption around new-city professionals or remote workers"
      : hasSpecificTargetUser
        ? "Target user inferred from intake"
        : "Generic user segment; requires clarification",
    assumedPain: isFriendIdea
      ? "Difficulty forming trusted, recurring friendships from a cold start"
      : hasPain
        ? "Pain inferred from intake wording"
        : "Pain is under-specified; downstream evidence should remain hypothesis-only",
    specificityLabel:
      level === "strong"
        ? "Strong enough for high-confidence validation"
        : level === "usable"
          ? "Usable, but downstream market claims need explicit assumptions"
          : "Generic prompt; clarify before trusting Strategy outputs",
  };
};

export const buildImprovedPromptSuggestion = (idea: string, report = analyzePromptQuality(idea)) => {
  const trimmed = idea.trim();
  if (!trimmed) {
    return "";
  }

  const targetUser =
    report.assumedTargetUser === "Generic user segment; requires clarification" ||
    report.assumedTargetUser === "Unknown"
      ? "a narrow first user segment that should be specified before validation"
      : report.assumedTargetUser;
  const pain =
    report.assumedPain === "Pain is under-specified; downstream evidence should remain hypothesis-only" ||
    report.assumedPain === "Unknown"
      ? "a repeated or urgent pain point that needs clearer evidence"
      : report.assumedPain;
  const missingContext =
    report.missingContext.length > 0
      ? `The validation should explicitly test these unknowns: ${report.missingContext.join(", ")}.`
      : "The validation should pressure-test market demand, urgency, willingness to pay, and differentiation.";
  const questions =
    report.clarifyingQuestions.length > 0
      ? `Key validation questions: ${report.clarifyingQuestions.join(" ")}`
      : "Key validation questions: what segment needs this most, what alternative is used today, and what proof would justify building the MVP?";

  return [
    `I want to validate this startup idea: ${trimmed}`,
    `Frame it for ${targetUser}.`,
    `The core pain to validate is: ${pain}.`,
    missingContext,
    questions,
    "Generate market leads, competitor hypotheses, persona objections, assumption tests, risk scoring, a comprehensive MVP PRD, a synthesis recommendation, prototype direction, and a launch-ready MVP foundation package.",
  ].join(" ");
};
