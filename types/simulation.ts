export type SimulationId = "convex_lens" | "unknown";

export type ConvexLensParams = {
  focalLengthCm: number;
  objectDistanceCm: number;
  showRays: boolean;
  showFocalPoints: boolean;
};

export type SimulationAnalysis = {
  recognized: boolean;
  subject: "physics" | "unknown";
  grade: 7 | 8 | 9 | null;
  topic: string;
  concept: string;
  simulationId: SimulationId;
  confidence: number;
  reason: string;
  parameters: ConvexLensParams | null;
  source: "openai" | "mock";
};
