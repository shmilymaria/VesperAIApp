// @note credit costs stored as integers where 10000 = 100.00%
// @note e.g. cost 100 = 1.00% per message

export interface ModelConfig {
  id: string;
  label: string;
  provider: "google";
  modelId: string;
  cost: number;
  description: string;
}

export const MODELS: Record<string, ModelConfig> = {
  "gemini-2.0-flash": {
    id: "gemini-2.0-flash",
    label: "Gemini 2.0 Flash",
    provider: "google",
    modelId: "gemini-2.0-flash",
    cost: 45,
    description: "Fast multimodal model",
  },
  "gemini-2.5-flash": {
    id: "gemini-2.5-flash",
    label: "Gemini 2.5 Flash",
    provider: "google",
    modelId: "gemini-2.5-flash",
    cost: 65,
    description: "Latest flash generation",
  },
} as const;

export const DEFAULT_MODEL = "gemini-2.5-flash";

// @note list of model ids for schema validation
export const MODEL_IDS = Object.keys(MODELS);

export function getModelCost(modelId: string): number {
  const model = MODELS[modelId];
  if (!model) {
    throw new Error(`unknown model: ${modelId}`);
  }
  return model.cost;
}

// @note format credits as percentage for display (e.g. 5275 -> "52.75%")
export function formatCredits(credits: number): string {
  const percent = credits / 100;
  return `${percent.toFixed(percent % 1 === 0 ? 0 : 2)}%`;
}
