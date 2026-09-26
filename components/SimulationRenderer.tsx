"use client";

import ConvexLensSimulation from "@/components/ConvexLensSimulation";
import type { SimulationAnalysis } from "@/types/simulation";

export default function SimulationRenderer({ analysis }: { analysis: SimulationAnalysis }) {
  if (analysis.simulationId === "convex_lens" && analysis.parameters) {
    return <ConvexLensSimulation initial={analysis.parameters} />;
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
