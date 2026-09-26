export type SimulationId = "convex_lens" | "linear_motion" | "electric_circuit" | "unknown";

export type ConvexLensParams = {
  focalLengthCm: number;
  objectDistanceCm: number;
  showRays: boolean;
  showFocalPoints: boolean;
};

export type LinearMotionParams = {
  initialSpeedMps: number;
  trackLengthM: number;
  durationS: number;
};

export type CircuitConnection = "series" | "parallel";

export type ElectricCircuitParams = {
  voltageV: number;
  resistor1Ohm: number;
  resistor2Ohm: number;
  connection: CircuitConnection;
};

export type SimulationParams = ConvexLensParams | LinearMotionParams | ElectricCircuitParams;

export type SimulationAnalysis = {
  recognized: boolean;
  subject: "physics" | "unknown";
  grade: 7 | 8 | 9 | null;
  topic: string;
  concept: string;
  simulationId: SimulationId;
  confidence: number;
  reason: string;
  parameters: SimulationParams | null;
  source: "openai" | "mock";
};
