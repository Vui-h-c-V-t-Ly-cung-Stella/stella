"use client";

import { useEffect, useState } from "react";
import SimulationRenderer from "@/components/SimulationRenderer";
import type { SimulationAnalysis } from "@/types/simulation";

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<SimulationAnalysis | null>(null);
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
          <h2 style={{ marginTop: 0 }}>1. Đưa hình minh họa cho Stella</h2>
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
                  <span className="badge">{analysis.source === "mock" ? "MOCK" : "AI"}</span>
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
