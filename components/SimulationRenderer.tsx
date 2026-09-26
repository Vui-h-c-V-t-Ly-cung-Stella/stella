"use client";

import ConvexLensSimulation from "@/components/ConvexLensSimulation";
import ElectricCircuitSimulation from "@/components/ElectricCircuitSimulation";
import LinearMotionSimulation from "@/components/LinearMotionSimulation";
import type {
  ConvexLensParams,
  ElectricCircuitParams,
  LinearMotionParams,
  SimulationAnalysis,
  SimulationParams,
} from "@/types/simulation";

function isConvexLensParams(params: SimulationParams | null): params is ConvexLensParams {
  return params != null && "focalLengthCm" in params;
}

function isLinearMotionParams(params: SimulationParams | null): params is LinearMotionParams {
  return params != null && "initialSpeedMps" in params;
}

function isElectricCircuitParams(params: SimulationParams | null): params is ElectricCircuitParams {
  return params != null && "voltageV" in params;
}

export default function SimulationRenderer({ analysis }: { analysis: SimulationAnalysis }) {
  if (analysis.simulationId === "convex_lens" && isConvexLensParams(analysis.parameters)) {
    return <ConvexLensSimulation initial={analysis.parameters} />;
  }

  if (analysis.simulationId === "linear_motion" && isLinearMotionParams(analysis.parameters)) {
    return <LinearMotionSimulation initial={analysis.parameters} />;
  }

  if (analysis.simulationId === "electric_circuit" && isElectricCircuitParams(analysis.parameters)) {
    return <ElectricCircuitSimulation initial={analysis.parameters} />;
  }

  return (
    <div className="card">
      <h2>Chưa có mô phỏng phù hợp</h2>
      <p className="muted">
        Stella chưa thể ghép hình này với một simulation đã được kiểm chứng trong MVP.
      </p>
    </div>
  );
}
