import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const readBody = async (request: { on: (event: string, callback: (chunk?: unknown) => void) => void }) =>
  new Promise<Record<string, unknown>>((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += String(chunk);
    });
    request.on("end", () => {
      try {
        resolve(body ? (JSON.parse(body) as Record<string, unknown>) : {});
      } catch (error) {
        reject(error instanceof Error ? error : new Error("Invalid JSON body"));
      }
    });
    request.on("error", (error) => reject(error instanceof Error ? error : new Error("Request failed")));
  });

const sendJson = (
  response: {
    statusCode: number;
    setHeader: (name: string, value: string) => void;
    end: (body: string) => void;
  },
  statusCode: number,
  payload: unknown,
) => {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify(payload));
};

const conductorOpenAiProxy = (mode: string): Plugin => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiKey = env.OPENAI_API_KEY || env.OPENAIKEY || env.VITE_OPENAI_API_KEY || env.VITE_OPENAIKEY;
  const textModel = env.OPENAI_TEXT_MODEL || "gpt-4.1-mini";
  const imageModel = env.OPENAI_IMAGE_MODEL || "gpt-image-1.5";

  return {
    name: "conductoriq-local-openai-proxy",
    configureServer(server) {
      server.middlewares.use("/api/conductoriq/openai-validation", async (request, response) => {
        if (request.method !== "POST") {
          sendJson(response, 405, { error: "Method not allowed" });
          return;
        }
        if (!apiKey) {
          sendJson(response, 503, { error: "OPENAI_API_KEY or OPENAIKEY is not configured in local env." });
          return;
        }

        try {
          const body = await readBody(request);
          const idea = String(body.idea ?? "");
          const category = String(body.category ?? "B2B software");
          const openAiResponse = await fetch("https://api.openai.com/v1/responses", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: textModel,
              input: `You are ConductorIQ's market validation engine. Analyze this startup idea without claiming live web access. Return strict compact JSON with keys: confidence number, summary string, signals array of {label,value,sentiment,source}, marketLeads array of {buyerType,painSignal,rationale,validationQuestion,confidence,evidenceSource}, competitors array of {name,category,threat,positioningGap,differentiation}, personas array of {persona,quote,confidence,objection,willingnessToPay}, assumptionTests array of {assumption,testMethod,passSignal,riskIfWrong}, risks array of {risk,severity,mitigation}. Label source/evidenceSource as "openai". Idea: ${idea}. Category: ${category}.`,
            }),
          });

          if (!openAiResponse.ok) {
            sendJson(response, openAiResponse.status, { error: `OpenAI returned ${openAiResponse.status}` });
            return;
          }

          sendJson(response, 200, await openAiResponse.json());
        } catch (error) {
          sendJson(response, 500, { error: error instanceof Error ? error.message : "OpenAI proxy failed" });
        }
      });

      server.middlewares.use("/api/conductoriq/agent", async (request, response) => {
        if (request.method !== "POST") {
          sendJson(response, 405, { error: "Method not allowed" });
          return;
        }
        if (!apiKey) {
          sendJson(response, 503, { error: "OPENAI_API_KEY or OPENAIKEY is not configured in local env." });
          return;
        }

        try {
          const body = await readBody(request);
          const agent = String(body.agent ?? "ConductorIQ Agent");
          const instruction = String(body.instruction ?? "");
          const context = String(body.context ?? "");
          const openAiResponse = await fetch("https://api.openai.com/v1/responses", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: textModel,
              input: [
                `You are ${agent} inside ConductorIQ, a six-workspace AI-native startup validation product.`,
                "Do not claim live web research. Use only the provided context and reasoned market hypotheses.",
                "Return strict JSON only. Do not wrap it in markdown.",
                `Instruction: ${instruction}`,
                `Context: ${context}`,
              ].join("\n\n"),
            }),
          });

          if (!openAiResponse.ok) {
            sendJson(response, openAiResponse.status, { error: `OpenAI returned ${openAiResponse.status}` });
            return;
          }

          sendJson(response, 200, await openAiResponse.json());
        } catch (error) {
          sendJson(response, 500, { error: error instanceof Error ? error.message : "OpenAI agent proxy failed" });
        }
      });

      server.middlewares.use("/api/conductoriq/gpt-image", async (request, response) => {
        if (request.method !== "POST") {
          sendJson(response, 405, { error: "Method not allowed" });
          return;
        }
        if (!apiKey) {
          sendJson(response, 503, { error: "OPENAI_API_KEY or OPENAIKEY is not configured in local env." });
          return;
        }

        try {
          const body = await readBody(request);
          const prompt = String(body.prompt ?? "");
          const imageResponse = await fetch("https://api.openai.com/v1/images/generations", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: imageModel,
              prompt,
              size: "1024x1024",
            }),
          });

          if (!imageResponse.ok) {
            let detail: unknown = null;
            try {
              detail = await imageResponse.json();
            } catch {
              detail = await imageResponse.text();
            }
            sendJson(response, imageResponse.status, {
              error: `OpenAI image generation returned ${imageResponse.status}`,
              model: imageModel,
              detail,
            });
            return;
          }

          sendJson(response, 200, await imageResponse.json());
        } catch (error) {
          sendJson(response, 500, { error: error instanceof Error ? error.message : "GPT Image proxy failed" });
        }
      });
    },
  };
};

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), conductorOpenAiProxy(mode)],
  build: {
    // The lazy orchestration chunk intentionally contains client-side LangGraph.
    // Keep warnings focused on accidental growth rather than the required local runtime.
    chunkSizeWarningLimit: 900,
  },
  define: {
    __CONDUCTORIQ_HAS_LOCAL_OPENAI_PROXY__: "true",
  },
}));
