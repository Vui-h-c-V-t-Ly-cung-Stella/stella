"use client";

import { useEffect, useState } from "react";
import SimulationRenderer from "@/components/SimulationRenderer";
import type { SimulationAnalysis, SimulationId } from "@/types/simulation";

type ManualSimulationId = Exclude<SimulationId, "unknown">;

const MANUAL_SIMULATIONS: Record<ManualSimulationId, SimulationAnalysis> = {
  convex_lens: {
    recognized: true,
    subject: "physics",
    grade: 9,
    topic: "Quang học",
    concept: "Thấu kính hội tụ",
    simulationId: "convex_lens",
    confidence: 1,
    reason: "Bạn đã chọn mô phỏng thấu kính hội tụ theo cách thủ công.",
    parameters: {
      focalLengthCm: 8,
      objectDistanceCm: 18,
      showRays: true,
      showFocalPoints: true,
    },
    source: "manual",
  },
  linear_motion: {
    recognized: true,
    subject: "physics",
    grade: 8,
    topic: "Chuyển động",
    concept: "Chuyển động thẳng và đồ thị quãng đường - thời gian",
    simulationId: "linear_motion",
    confidence: 1,
    reason: "Bạn đã chọn mô phỏng chuyển động và đồ thị s-t theo cách thủ công.",
    parameters: {
      initialSpeedMps: 8,
      trackLengthM: 100,
      durationS: 20,
    },
    source: "manual",
  },
  electric_circuit: {
    recognized: true,
    subject: "physics",
    grade: 9,
    topic: "Điện học",
    concept: "Mạch điện nối tiếp và song song",
    simulationId: "electric_circuit",
    confidence: 1,
    reason: "Bạn đã chọn mô phỏng mạch điện theo cách thủ công.",
    parameters: {
      voltageV: 6,
      resistor1Ohm: 6,
      resistor2Ohm: 12,
      connection: "series",
    },
    source: "manual",
  },
  force_friction: {
    recognized: true,
    subject: "physics",
    grade: 8,
    topic: "Cơ học",
    concept: "Lực kéo, lực ma sát và gia tốc",
    simulationId: "force_friction",
    confidence: 1,
    reason: "Bạn đã chọn mô phỏng lực kéo và lực ma sát theo cách thủ công.",
    parameters: {
      pullingForceN: 20,
      frictionForceN: 5,
      massKg: 10,
      initialSpeedMps: 0,
      durationS: 10,
    },
    source: "manual",
  },
};

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<SimulationAnalysis | null>(null);
  const [manualSimulationId, setManualSimulationId] = useState<ManualSimulationId>("convex_lens");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function analyze() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setAnalysis(null);

    const data = new FormData();
    data.append("image", file);

    try {
      const response = await fetch("/api/analyze", { method: "POST", body: data });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Không thể phân tích ảnh.");
      setAnalysis(json as SimulationAnalysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra.");
    } finally {
      setLoading(false);
    }
  }

  function openManualSimulation() {
    setError(null);
    setAnalysis(MANUAL_SIMULATIONS[manualSimulationId]);
  }

  return (
    <main className="stack">
      <header>
        <h1 style={{ marginBottom: 6 }}>Vui học Vật lý cùng Stella</h1>
        <p className="muted" style={{ marginTop: 0 }}>
          MVP: ảnh SGK → AI nhận diện → simulation router → thí nghiệm tương tác.
        </p>
      </header>

      <section className="card stack">
        <div>
          <h2 style={{ marginTop: 0 }}>1. Chọn mô phỏng</h2>
          <div className="row">
            <label style={{ flex: "1 1 280px", maxWidth: 430, minWidth: 0 }}>
              <span>Mở thủ công</span>
              <select
                value={manualSimulationId}
                onChange={(event) => setManualSimulationId(event.target.value as ManualSimulationId)}
                style={{ width: "100%", padding: "9px 11px", border: "1px solid #999", borderRadius: 8, background: "white" }}
              >
                <option value="convex_lens">1. Thấu kính hội tụ</option>
                <option value="linear_motion">2. Chuyển động và đồ thị s-t</option>
                <option value="electric_circuit">3. Mạch điện nối tiếp và song song</option>
                <option value="force_friction">4. Lực kéo và lực ma sát</option>
              </select>
            </label>
            <button className="primary" onClick={openManualSimulation}>Mở mô phỏng đã chọn</button>
          </div>
        </div>

        <div style={{ borderTop: "1px solid #ddd", paddingTop: 16 }}>
          <h3 style={{ marginTop: 0 }}>Hoặc đưa hình minh họa cho Stella</h3>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setAnalysis(null);
              setError(null);
            }}
          />
        </div>

        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Ảnh học sinh tải lên"
            style={{ maxWidth: 430, maxHeight: 300, objectFit: "contain", border: "1px solid #ddd" }}
          />
        )}

        <div>
          <button className="primary" disabled={!file || loading} onClick={analyze}>
            {loading ? "Stella đang phân tích..." : "Phân tích và mở mô phỏng"}
          </button>
        </div>
        <small className="muted">
          Nếu chưa có OPENAI_API_KEY, server tự chạy mock mode để bạn kiểm thử flow.
        </small>
        {error && <div className="error">{error}</div>}
      </section>

      {analysis && (
        <>
          <section className="card">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div>
                <h2 style={{ marginTop: 0 }}>2. Stella đã điều phối</h2>
                <div className="row">
                  <span className="badge">
                    {analysis.source === "mock" ? "MOCK" : analysis.source === "manual" ? "MANUAL" : "AI"}
                  </span>
                  <span className="badge">simulation: {analysis.simulationId}</span>
                  <span className="badge">confidence: {(analysis.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
            <p><strong>Chủ đề:</strong> {analysis.topic}</p>
            <p><strong>Khái niệm:</strong> {analysis.concept}</p>
            <p><strong>Lớp:</strong> {analysis.grade ?? "Chưa chắc"}</p>
            <p><strong>Lý do:</strong> {analysis.reason}</p>
            <details>
              <summary>Structured output</summary>
              <pre>{JSON.stringify(analysis, null, 2)}</pre>
            </details>
          </section>

          <section>
            <h2>3. Simulation được chọn</h2>
            <SimulationRenderer analysis={analysis} />
          </section>
        </>
      )}
    </main>
  );
}
