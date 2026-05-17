import type {
  AssumptionTest,
  Competitor,
  MarketLead,
  MarketSignal,
  PersonaReaction,
  PrototypeAsset,
  RiskItem,
} from "./types";

interface ExternalResearchResult {
  mode: "real-ready" | "fallback";
  confidence: number;
  signals: MarketSignal[];
  marketLeads: MarketLead[];
  competitors: Competitor[];
  personas: PersonaReaction[];
  assumptionTests: AssumptionTest[];
  risks: RiskItem[];
  summary: string;
  logMessage: string;
}

export interface OpenAiAgentResult<T> {
  mode: "real-ready" | "fallback";
  data: T;
  logMessage: string;
}

const timeoutSignal = (ms: number) => {
  const controller = new AbortController();
  window.setTimeout(() => controller.abort(), ms);
  return controller.signal;
};

const extractJson = (text: string): unknown => {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    return null;
  }
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
};

const extractOpenAiText = (payload: {
  output_text?: string;
  output?: Array<{ content?: Array<{ text?: string }> }>;
}) =>
  payload.output_text ??
  payload.output?.flatMap((item) => item.content ?? []).map((content) => content.text).join("\n") ??
  "";

export const runOpenAiAgent = async <T>(
  agent: string,
  instruction: string,
  context: string,
  fallback: T,
  timeoutMs = 12000,
): Promise<OpenAiAgentResult<T>> => {
  try {
    const response = await fetch("/api/conductoriq/agent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ agent, instruction, context }),
      signal: timeoutSignal(timeoutMs),
    });

    if (!response.ok) {
      throw new Error(`OpenAI agent proxy returned ${response.status}`);
    }

    const payload = (await response.json()) as {
      output_text?: string;
      output?: Array<{ content?: Array<{ text?: string }> }>;
    };
    const parsed = extractJson(extractOpenAiText(payload));
    if (!parsed || typeof parsed !== "object") {
      throw new Error("OpenAI agent response was not valid JSON.");
    }

    return {
      mode: "real-ready",
      data: { ...fallback, ...(parsed as Partial<T>) },
      logMessage: `${agent} completed through local OpenAI proxy.`,
    };
  } catch {
    return {
      mode: "fallback",
      data: fallback,
      logMessage: `${agent} used deterministic fallback because OpenAI was unavailable, timed out, or returned insufficient JSON.`,
    };
  }
};

const normalizeOpenAiSignals = (signals: MarketSignal[] | undefined, fallback: MarketSignal[]) =>
  (signals ?? fallback).map((signal) => ({
    ...signal,
    source: "openai" as const,
  }));

const clampScore = (value: number) => Math.min(100, Math.max(0, Math.round(value)));

type LeadScoreInput = {
  painUrgency: number;
  audienceReachability: number;
  budgetFit: number;
  usageFrequency: number;
  differentiationPotential: number;
  evidenceStrength: number;
};

const calculateLeadConfidence = (score: LeadScoreInput) =>
  clampScore(
    score.painUrgency * 0.24 +
      score.audienceReachability * 0.18 +
      score.budgetFit * 0.18 +
      score.usageFrequency * 0.16 +
      score.differentiationPotential * 0.14 +
      score.evidenceStrength * 0.1,
  );

const withLeadScore = (
  lead: Omit<MarketLead, "confidence" | "scoreBreakdown" | "scoringRationale"> & {
    confidence?: number;
    scoreBreakdown: LeadScoreInput;
  },
): MarketLead => {
  const confidence = lead.confidence ?? calculateLeadConfidence(lead.scoreBreakdown);
  return {
    ...lead,
    confidence,
    scoreBreakdown: lead.scoreBreakdown,
    scoringRationale: [
      `urgency ${lead.scoreBreakdown.painUrgency}`,
      `reach ${lead.scoreBreakdown.audienceReachability}`,
      `budget ${lead.scoreBreakdown.budgetFit}`,
      `frequency ${lead.scoreBreakdown.usageFrequency}`,
      `differentiation ${lead.scoreBreakdown.differentiationPotential}`,
      `evidence ${lead.scoreBreakdown.evidenceStrength}`,
    ].join(" · "),
  };
};

const enrichOpenAiLead = (lead: MarketLead, fallbackLead: MarketLead | undefined): MarketLead => {
  const scoreBreakdown =
    lead.scoreBreakdown ??
    fallbackLead?.scoreBreakdown ?? {
      painUrgency: lead.confidence,
      audienceReachability: Math.max(50, lead.confidence - 8),
      budgetFit: Math.max(45, lead.confidence - 10),
      usageFrequency: Math.max(50, lead.confidence - 7),
      differentiationPotential: Math.max(45, lead.confidence - 12),
      evidenceStrength: 70,
    };

  return {
    ...lead,
    evidenceSource: "openai",
    priority: lead.priority ?? fallbackLead?.priority ?? "secondary",
    segment: lead.segment ?? fallbackLead?.segment ?? lead.buyerType,
    scoreBreakdown,
    confidence: clampScore(lead.confidence ?? calculateLeadConfidence(scoreBreakdown)),
    scoringRationale:
      lead.scoringRationale ??
      `OpenAI generated this lead; confidence uses ConductorIQ's urgency, reachability, budget fit, frequency, differentiation, and evidence-strength rubric.`,
  };
};

const normalizeOpenAiLeads = (leads: MarketLead[] | undefined, fallback: MarketLead[]) =>
  (leads && leads.length > 0 ? leads : fallback).map((lead, index) =>
    enrichOpenAiLead(lead, fallback[index]),
  );

const hasAny = (value: string, keywords: string[]) => keywords.some((keyword) => value.includes(keyword));

const createFallbackMarketLeads = (idea: string, category: string): MarketLead[] => {
  const lower = `${idea} ${category}`.toLowerCase();

  if (hasAny(lower, ["friend", "friends", "social", "community", "meet people", "meetup", "lonely", "hangout"])) {
    return [
      withLeadScore({
        buyerType: "New-city young professional",
        segment: "Consumer social / relocation",
        priority: "primary",
        painSignal: "Recently relocated users need low-friction ways to form local friendships beyond dating apps or generic events.",
        rationale: "This segment has frequent emotional pain, clear onboarding hooks, and high word-of-mouth potential, but willingness to pay is unproven.",
        validationQuestion: "Would you join three friend-matching events in the next 30 days if the app matched you by intent, availability, and interests?",
        evidenceSource: "fallback",
        scoreBreakdown: {
          painUrgency: 76,
          audienceReachability: 72,
          budgetFit: 42,
          usageFrequency: 70,
          differentiationPotential: 58,
          evidenceStrength: 44,
        },
      }),
      withLeadScore({
        buyerType: "Interest-based community organizer",
        segment: "Groups, clubs, and local communities",
        priority: "secondary",
        painSignal: "Organizers struggle to convert passive members into repeat small-group meetups.",
        rationale: "This buyer/user can supply early demand and structured events, though the product may become a community operations tool instead of pure consumer social.",
        validationQuestion: "Would organizers use the product to fill recurring small-group activities and measure repeat attendance?",
        evidenceSource: "fallback",
        scoreBreakdown: {
          painUrgency: 68,
          audienceReachability: 64,
          budgetFit: 58,
          usageFrequency: 62,
          differentiationPotential: 65,
          evidenceStrength: 46,
        },
      }),
      withLeadScore({
        buyerType: "Remote worker or student seeking recurring plans",
        segment: "Lifestyle and belonging",
        priority: "experimental",
        painSignal: "Remote routines reduce spontaneous social discovery and make casual friendship formation harder.",
        rationale: "Pain is real but diffuse; the MVP must prove repeat use and safety/trust before monetization.",
        validationQuestion: "What matching constraint would make you comfortable meeting a new friend from an app this week?",
        evidenceSource: "fallback",
        scoreBreakdown: {
          painUrgency: 62,
          audienceReachability: 69,
          budgetFit: 36,
          usageFrequency: 66,
          differentiationPotential: 54,
          evidenceStrength: 42,
        },
      }),
    ];
  }

  if (hasAny(lower, ["cyber", "security", "soc", "alert", "incident"])) {
    return [
      withLeadScore({
        buyerType: "Lean security operations lead",
        segment: "B2B cybersecurity operations",
        priority: "primary",
        painSignal: "Alert triage queues grow faster than analyst capacity.",
        rationale: "This buyer has urgent workflow pain and already spends budget on tools or analysts.",
        validationQuestion: "Which triage decision would you trust an AI assistant to draft but not execute?",
        evidenceSource: "fallback",
        scoreBreakdown: {
          painUrgency: 86,
          audienceReachability: 62,
          budgetFit: 76,
          usageFrequency: 82,
          differentiationPotential: 70,
          evidenceStrength: 50,
        },
      }),
      withLeadScore({
        buyerType: "Technical founder evaluating SOC automation",
        segment: "Founder / internal security tooling",
        priority: "secondary",
        painSignal: "Needs to decide if the wedge is alert enrichment, investigation summaries, or analyst coaching.",
        rationale: "This persona needs a validated MVP scope before building.",
        validationQuestion: "What proof would convince you to start with one workflow instead of a full SOC copilot?",
        evidenceSource: "fallback",
        scoreBreakdown: {
          painUrgency: 72,
          audienceReachability: 68,
          budgetFit: 66,
          usageFrequency: 70,
          differentiationPotential: 72,
          evidenceStrength: 48,
        },
      }),
      withLeadScore({
        buyerType: "Managed security service operator",
        segment: "MSSP operations",
        priority: "secondary",
        painSignal: "Repeatable customer environments make playbook standardization valuable.",
        rationale: "MSSPs feel repeated investigation cost and may pilot workflow-specific automation.",
        validationQuestion: "What customer-facing report or evidence chain would make this worth a pilot?",
        evidenceSource: "fallback",
        scoreBreakdown: {
          painUrgency: 74,
          audienceReachability: 55,
          budgetFit: 72,
          usageFrequency: 78,
          differentiationPotential: 66,
          evidenceStrength: 46,
        },
      }),
    ];
  }

  if (hasAny(lower, ["health", "clinic", "patient", "doctor", "care"])) {
    return [
      withLeadScore({
        buyerType: "Clinic operations manager",
        segment: "Healthcare workflow",
        priority: "primary",
        painSignal: "Administrative coordination creates delays, missed follow-ups, and staff overload.",
        rationale: "Operational pain is frequent and budget exists, but compliance and workflow trust create adoption friction.",
        validationQuestion: "Which repeated coordination task would staff delegate if auditability and privacy controls were clear?",
        evidenceSource: "fallback",
        scoreBreakdown: {
          painUrgency: 78,
          audienceReachability: 54,
          budgetFit: 68,
          usageFrequency: 80,
          differentiationPotential: 61,
          evidenceStrength: 44,
        },
      }),
      withLeadScore({
        buyerType: "Independent clinician",
        segment: "Small practice productivity",
        priority: "secondary",
        painSignal: "Small teams need lightweight tooling without enterprise implementation burden.",
        rationale: "Strong productivity need, but willingness to adopt depends on setup effort and compliance confidence.",
        validationQuestion: "Would a 15-minute setup tool that reduces follow-up admin be worth a paid pilot?",
        evidenceSource: "fallback",
        scoreBreakdown: {
          painUrgency: 70,
          audienceReachability: 60,
          budgetFit: 56,
          usageFrequency: 76,
          differentiationPotential: 58,
          evidenceStrength: 42,
        },
      }),
    ];
  }

  if (hasAny(lower, ["developer", "code", "dev", "api", "github"])) {
    return [
      withLeadScore({
        buyerType: "Engineering manager",
        segment: "Developer productivity",
        priority: "primary",
        painSignal: "Teams need to reduce cycle time without adding process overhead.",
        rationale: "Budget and urgency exist when the product ties directly to velocity, reliability, or review throughput.",
        validationQuestion: "Which development bottleneck would you pay to reduce by 20% this quarter?",
        evidenceSource: "fallback",
        scoreBreakdown: {
          painUrgency: 72,
          audienceReachability: 66,
          budgetFit: 70,
          usageFrequency: 78,
          differentiationPotential: 62,
          evidenceStrength: 44,
        },
      }),
      withLeadScore({
        buyerType: "Solo technical founder",
        segment: "Builder workflow",
        priority: "secondary",
        painSignal: "Needs faster execution without losing control over architecture and quality.",
        rationale: "Easy to reach and test, but lower immediate budget than teams.",
        validationQuestion: "What would make you trust this tool inside your build loop every day?",
        evidenceSource: "fallback",
        scoreBreakdown: {
          painUrgency: 66,
          audienceReachability: 76,
          budgetFit: 44,
          usageFrequency: 82,
          differentiationPotential: 60,
          evidenceStrength: 42,
        },
      }),
    ];
  }

  return [
    withLeadScore({
      buyerType: "Time-constrained founder",
      segment: "Startup validation",
      priority: "primary",
      painSignal: "Needs to decide whether to build before committing weeks of execution time.",
      rationale: "The pain is clear when the product shortens the path from idea to scoped MVP decision.",
      validationQuestion: "What decision would this product need to make clearer before you would trust the MVP plan?",
      evidenceSource: "fallback",
      scoreBreakdown: {
        painUrgency: 66,
        audienceReachability: 70,
        budgetFit: 52,
        usageFrequency: 58,
        differentiationPotential: 60,
        evidenceStrength: 42,
      },
    }),
    withLeadScore({
      buyerType: "Operator with repeated manual workflow",
      segment: "Workflow automation",
      priority: "secondary",
      painSignal: "Manual coordination and decision latency create recurring cost.",
      rationale: "This segment is worth testing when the idea maps to a repeated, measurable workflow.",
      validationQuestion: "Which repeated workflow has a clear before/after metric the MVP can improve?",
      evidenceSource: "fallback",
      scoreBreakdown: {
        painUrgency: 64,
        audienceReachability: 56,
        budgetFit: 58,
        usageFrequency: 68,
        differentiationPotential: 56,
        evidenceStrength: 40,
      },
    }),
  ];
};

const createFallbackSignals = (category: string): MarketSignal[] => [
  {
    label: "Urgency",
    value: `${category} users respond when the workflow solves a repeated, painful, or emotionally urgent job.`,
    sentiment: "positive",
    source: "fallback",
  },
  {
    label: "Adoption friction",
    value: "Trust, setup effort, safety, switching cost, and willingness to pay must be validated before build commitment.",
    sentiment: "neutral",
    source: "fallback",
  },
  {
    label: "Market timing",
    value: "AI-native workflow adoption is plausible when positioned around a concrete user job rather than novelty.",
    sentiment: "positive",
    source: "fallback",
  },
];

export const createFallbackResearch = (idea: string, category: string): ExternalResearchResult => {
  const marketLeads = createFallbackMarketLeads(idea, category);
  const confidence = clampScore(
    marketLeads.reduce((total, lead) => total + lead.confidence, 0) / Math.max(1, marketLeads.length),
  );

  return {
    mode: "fallback",
    confidence,
    signals: createFallbackSignals(category),
    marketLeads,
    competitors: [
    {
      name: "Generic AI copilots",
      category: "Horizontal AI",
      threat: "medium",
      positioningGap: "ConductorIQ can win through structured validation workflow and artifact lineage.",
      differentiation: "Specialize around validation state, evidence lineage, and approval gates instead of generic chat.",
    },
    {
      name: "Consultants and agencies",
      category: "Manual services",
      threat: "medium",
      positioningGap: "Faster first-pass evidence package with repeatable execution state.",
      differentiation: "Offer repeatable autonomous validation at local-product speed before paid consulting.",
    },
    {
      name: "Internal spreadsheets",
      category: "Workflow workaround",
      threat: "high",
      positioningGap: "Replace scattered assumptions with traceable agent-generated decisions.",
      differentiation: "Centralize market, PRD, synthesis, prototype, and launch evidence in one workflow.",
    },
  ],
  personas: [
    {
      persona: "Solo founder",
      quote: "I need to know whether this is worth two weeks of building before I start.",
      confidence: 82,
      objection: "Will the recommendation be specific enough to change my roadmap?",
      willingnessToPay: "Likely to pay for time savings if the output narrows scope and prevents wasted build cycles.",
    },
    {
      persona: "Technical founder",
      quote: "Show me the assumptions, evidence chain, and why the MVP scope is this narrow.",
      confidence: 76,
      objection: "I do not want generic strategy output that ignores implementation risk.",
      willingnessToPay: "Will pay only if the workflow exposes architecture risk and concrete acceptance criteria.",
    },
    {
      persona: "Advisor / investor",
      quote: "The value is in the clarity of the go/no-go decision and the strongest risks.",
      confidence: 71,
      objection: "Evidence needs to be distinguishable from confident AI prose.",
      willingnessToPay: "Values comparable validation packages across ideas more than one-off generated copy.",
    },
  ],
  assumptionTests: [
    {
      assumption: "The target user has urgent enough pain to change workflow.",
      testMethod: "Run five interviews focused on current workaround cost and decision latency.",
      passSignal: "At least three users describe the same weekly pain and agree to review a prototype.",
      riskIfWrong: "The MVP becomes a nice-to-have workflow dashboard instead of a buying trigger.",
    },
    {
      assumption: "Users trust AI-generated validation if evidence labels are explicit.",
      testMethod: "Show fallback-labelled and OpenAI-labelled artifacts side by side.",
      passSignal: "Users can explain which claims are hypotheses and which are validated enough to act on.",
      riskIfWrong: "The product feels like confident generic prose and loses decision credibility.",
    },
    {
      assumption: "A narrow approval-gated workflow is more useful than open-ended chat.",
      testMethod: "Compare task completion against a blank chat prompt for the same startup idea.",
      passSignal: "Users reach a clearer pursue/refine/reject decision faster in ConductorIQ.",
      riskIfWrong: "The workflow adds ceremony without improving confidence.",
    },
  ],
  risks: [
    {
      risk: "Generated evidence may feel synthetic without external citations.",
      severity: "high",
      mitigation: "Label deterministic fallback mode clearly when OpenAI is unavailable.",
    },
    {
      risk: "The idea can remain too broad after intake.",
      severity: "medium",
      mitigation: "Force MVP scope cuts in Synthesis and Deployment.",
    },
    {
      risk: "Users may expect code generation instead of validation.",
      severity: "medium",
      mitigation: "Position Launch as an MVP foundation package, not full app generation.",
    },
    ],
    summary: `${idea} has enough structure for a validation workflow. Market lead confidence is calculated from pain urgency, audience reachability, budget fit, usage frequency, differentiation potential, and fallback evidence strength. The strongest proof point remains buyer urgency and willingness to pay.`,
    logMessage: "External APIs unavailable or not browser-safe; deterministic fallback research package generated.",
  };
};

export const runExternalResearch = async (
  idea: string,
  category: string,
): Promise<ExternalResearchResult> => {
  try {
    const openAiResponse = await fetch("/api/conductoriq/openai-validation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idea, category }),
      signal: timeoutSignal(9000),
    });

    if (!openAiResponse.ok) {
      throw new Error(`OpenAI returned ${openAiResponse.status}`);
    }

    const openAiData = (await openAiResponse.json()) as {
      output_text?: string;
      output?: Array<{ content?: Array<{ text?: string }> }>;
    };
    const text = extractOpenAiText(openAiData);
    const parsed = extractJson(text) as Partial<ExternalResearchResult> | null;
    const fallback = createFallbackResearch(idea, category);

    return {
      mode: "real-ready",
      confidence: Number(parsed?.confidence ?? fallback.confidence),
      summary: String(parsed?.summary ?? fallback.summary),
      signals: normalizeOpenAiSignals(parsed?.signals as MarketSignal[] | undefined, fallback.signals),
      marketLeads: normalizeOpenAiLeads(parsed?.marketLeads as MarketLead[] | undefined, fallback.marketLeads),
      competitors: (parsed?.competitors as Competitor[] | undefined) ?? fallback.competitors,
      personas: (parsed?.personas as PersonaReaction[] | undefined) ?? fallback.personas,
      assumptionTests: (parsed?.assumptionTests as AssumptionTest[] | undefined) ?? fallback.assumptionTests,
      risks: (parsed?.risks as RiskItem[] | undefined) ?? fallback.risks,
      logMessage: "OpenAI market validation analysis completed through local proxy.",
    };
  } catch {
    return createFallbackResearch(idea, category);
  }
};

export const runPrototypeGeneration = async (
  idea: string,
  prompt: string,
): Promise<PrototypeAsset> => {
  let failureReason = "GPT Image was unavailable, timed out, or returned no image through the local proxy.";
  try {
    const response = await fetch("/api/conductoriq/gpt-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
      signal: timeoutSignal(45000),
    });

    if (!response.ok) {
      let detail = "";
      try {
        const payload = await response.json() as { error?: string; model?: string; detail?: unknown };
        const upstreamMessage =
          typeof payload.detail === "object" && payload.detail && "error" in payload.detail
            ? JSON.stringify((payload.detail as { error?: unknown }).error)
            : typeof payload.detail === "string"
              ? payload.detail
              : "";
        detail = [payload.error, payload.model ? `model ${payload.model}` : "", upstreamMessage].filter(Boolean).join(" · ");
      } catch {
        detail = await response.text();
      }
      failureReason = `Image proxy returned ${response.status}${detail ? `: ${detail}` : ""}`;
      throw new Error(failureReason);
    }

    const payload = (await response.json()) as {
      data?: Array<{ b64_json?: string; url?: string; revised_prompt?: string }>;
    };
    const firstImage = payload.data?.[0];
    if (!firstImage?.b64_json && !firstImage?.url) {
      failureReason = `Image response did not include b64_json or url. Response keys: ${Object.keys(firstImage ?? {}).join(", ") || "none"}.`;
      throw new Error("Image response did not include b64_json.");
    }

    return {
      id: `prototype-${Date.now().toString(36)}`,
      title: "GPT Image Interface Concept",
      status: "generated",
      reviewStatus: "pending",
      telemetryStatus: "generated",
      variant: "primary",
      rationale: "Primary generated concept from GPT Image for the approved Deployment review gate.",
      prompt: firstImage.revised_prompt ?? prompt,
      imageDataUrl: firstImage.b64_json ? `data:image/png;base64,${firstImage.b64_json}` : firstImage.url,
      provider: "gpt-image-2",
      attemptCount: 1,
      lastAttemptAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    if (error instanceof Error && error.message && !failureReason.includes(error.message)) {
      failureReason = error.message;
    }
    return {
      id: `prototype-${Date.now().toString(36)}`,
      title: "Visual Prompt Fallback",
      status: "fallback",
      reviewStatus: "pending",
      telemetryStatus: "fallback",
      variant: "primary",
      rationale: "Primary fallback concept preserved for prototype approval when GPT Image 2 is unavailable.",
      prompt: `${prompt}\nFallback reason: GPT Image 2 was unavailable through the local proxy. Preserve this prompt as prototype direction for later generation. Idea: ${idea}`,
      provider: "fallback",
      attemptCount: 1,
      failureReason,
      lastAttemptAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
  }
};
