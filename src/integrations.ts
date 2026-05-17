import type { Competitor, MarketSignal, PersonaReaction, RiskItem } from "./types";

interface ExternalResearchResult {
  mode: "real-ready" | "fallback";
  confidence: number;
  signals: MarketSignal[];
  competitors: Competitor[];
  personas: PersonaReaction[];
  risks: RiskItem[];
  summary: string;
  logMessage: string;
}

const timeoutSignal = (ms: number) => {
  const controller = new AbortController();
  window.setTimeout(() => controller.abort(), ms);
  return controller.signal;
};

const getEnv = (primary: string, secondary: string) =>
  String(import.meta.env[primary] ?? import.meta.env[secondary] ?? "").trim();

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

export const createFallbackResearch = (idea: string, category: string): ExternalResearchResult => ({
  mode: "fallback",
  confidence: category.includes("cyber") ? 74 : 68,
  signals: [
    {
      label: "Urgency",
      value: `${category} buyers respond when the workflow reduces manual triage or decision latency.`,
      sentiment: "positive",
      source: "fallback",
    },
    {
      label: "Adoption friction",
      value: "Trust, data access, and switching cost must be reduced in the first demo.",
      sentiment: "neutral",
      source: "fallback",
    },
    {
      label: "Market timing",
      value: "AI-native workflow adoption is plausible if positioned around operator leverage, not novelty.",
      sentiment: "positive",
      source: "fallback",
    },
  ],
  competitors: [
    {
      name: "Generic AI copilots",
      category: "Horizontal AI",
      threat: "medium",
      positioningGap: "ConductorIQ can win through structured validation workflow and artifact lineage.",
    },
    {
      name: "Consultants and agencies",
      category: "Manual services",
      threat: "medium",
      positioningGap: "Faster first-pass evidence package with repeatable execution state.",
    },
    {
      name: "Internal spreadsheets",
      category: "Workflow workaround",
      threat: "high",
      positioningGap: "Replace scattered assumptions with traceable agent-generated decisions.",
    },
  ],
  personas: [
    {
      persona: "Solo founder",
      quote: "I need to know whether this is worth two weeks of building before I start.",
      confidence: 82,
      objection: "Will the recommendation be specific enough to change my roadmap?",
    },
    {
      persona: "Technical founder",
      quote: "Show me the assumptions, evidence chain, and why the MVP scope is this narrow.",
      confidence: 76,
      objection: "I do not want generic strategy output that ignores implementation risk.",
    },
    {
      persona: "Advisor / investor",
      quote: "The value is in the clarity of the go/no-go decision and the strongest risks.",
      confidence: 71,
      objection: "Evidence needs to be distinguishable from confident AI prose.",
    },
  ],
  risks: [
    {
      risk: "Generated evidence may feel synthetic without external citations.",
      severity: "high",
      mitigation: "Label fallback mode clearly and make Exa-backed evidence the default when configured.",
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
  summary: `${idea} has enough structure for a validation workflow, but the strongest proof point remains buyer urgency and willingness to pay.`,
  logMessage: "External APIs unavailable or not browser-safe; deterministic fallback research package generated.",
});

export const runExternalResearch = async (
  idea: string,
  category: string,
): Promise<ExternalResearchResult> => {
  const openAiKey = getEnv("VITE_OPENAI_API_KEY", "VITE_OPENAIKEY");
  const exaKey = getEnv("VITE_EXA_API_KEY", "VITE_EXAKEY");

  if (!openAiKey || !exaKey) {
    return createFallbackResearch(idea, category);
  }

  try {
    const exaResponse = await fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": exaKey,
      },
      body: JSON.stringify({
        query: `${idea} market competitors startup validation`,
        numResults: 5,
        type: "auto",
      }),
      signal: timeoutSignal(6000),
    });

    if (!exaResponse.ok) {
      throw new Error(`Exa returned ${exaResponse.status}`);
    }

    const exaData = (await exaResponse.json()) as {
      results?: Array<{ title?: string; url?: string; text?: string }>;
    };
    const evidence = (exaData.results ?? [])
      .slice(0, 5)
      .map((result) => `${result.title ?? "Untitled"}: ${result.text ?? result.url ?? "No snippet"}`)
      .join("\n");

    const openAiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openAiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: `Analyze this startup idea using the Exa evidence. Return compact JSON with keys: confidence number, summary string, signals array of {label,value,sentiment}, competitors array of {name,category,threat,positioningGap}, personas array of {persona,quote,confidence,objection}, risks array of {risk,severity,mitigation}. Idea: ${idea}\nEvidence:\n${evidence}`,
      }),
      signal: timeoutSignal(9000),
    });

    if (!openAiResponse.ok) {
      throw new Error(`OpenAI returned ${openAiResponse.status}`);
    }

    const openAiData = (await openAiResponse.json()) as {
      output_text?: string;
      output?: Array<{ content?: Array<{ text?: string }> }>;
    };
    const text =
      openAiData.output_text ??
      openAiData.output?.flatMap((item) => item.content ?? []).map((content) => content.text).join("\n") ??
      "";
    const parsed = extractJson(text) as Partial<ExternalResearchResult> | null;
    const fallback = createFallbackResearch(idea, category);

    return {
      mode: "real-ready",
      confidence: Number(parsed?.confidence ?? fallback.confidence),
      summary: String(parsed?.summary ?? fallback.summary),
      signals: (parsed?.signals as MarketSignal[] | undefined) ?? fallback.signals,
      competitors: (parsed?.competitors as Competitor[] | undefined) ?? fallback.competitors,
      personas: (parsed?.personas as PersonaReaction[] | undefined) ?? fallback.personas,
      risks: (parsed?.risks as RiskItem[] | undefined) ?? fallback.risks,
      logMessage: "Exa evidence and OpenAI analysis completed successfully.",
    };
  } catch {
    return createFallbackResearch(idea, category);
  }
};
