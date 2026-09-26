"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { LinearMotionParams } from "@/types/simulation";

type MotionSample = {
  timeS: number;
  positionM: number;
};

const W = 760;
const H = 410;
const trackLeft = 55;
const trackRight = 710;
const trackY = 120;
const graphLeft = 65;
const graphRight = 720;
const graphTop = 210;
const graphBottom = 365;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export default function LinearMotionSimulation({ initial }: { initial: LinearMotionParams }) {
  const initialTrackLengthM = clamp(initial.trackLengthM, 50, 500);
  const initialDurationS = clamp(initial.durationS, 5, 60);
  const initialSpeedMps = clamp(initial.initialSpeedMps, 0, 20);
  const [speedMps, setSpeedMps] = useState(initialSpeedMps);
  const [trackLengthM, setTrackLengthM] = useState(initialTrackLengthM);
  const [durationS, setDurationS] = useState(initialDurationS);
  const [positionM, setPositionM] = useState(0);
  const [elapsedS, setElapsedS] = useState(0);
  const [running, setRunning] = useState(false);
  const [samples, setSamples] = useState<MotionSample[]>([{ timeS: 0, positionM: 0 }]);
  const positionRef = useRef(0);
  const elapsedRef = useRef(0);

  useEffect(() => {
    if (!running) return;

    let animationFrame = 0;
    let lastFrameTime = performance.now();

    const animate = (now: number) => {
      const frameDeltaS = Math.min((now - lastFrameTime) / 1000, 0.1);
      lastFrameTime = now;

      let actualDeltaS = Math.min(frameDeltaS, durationS - elapsedRef.current);
      if (speedMps > 0 && positionRef.current + speedMps * frameDeltaS >= trackLengthM) {
        actualDeltaS = Math.min(actualDeltaS, (trackLengthM - positionRef.current) / speedMps);
      }

      const nextElapsedS = elapsedRef.current + actualDeltaS;
      const nextPositionM = Math.min(
        trackLengthM,
        positionRef.current + speedMps * actualDeltaS,
      );

      elapsedRef.current = nextElapsedS;
      positionRef.current = nextPositionM;
      setElapsedS(nextElapsedS);
      setPositionM(nextPositionM);

      if (nextPositionM >= trackLengthM || nextElapsedS >= durationS) {
        setRunning(false);
        return;
      }

      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [durationS, running, speedMps, trackLengthM]);

  const reachedTrackEnd = positionM >= trackLengthM;
  const reachedTimeLimit = elapsedS >= durationS;
  const completed = reachedTrackEnd || reachedTimeLimit;
  const graphDurationS = durationS;
  const carX = trackLeft + (positionM / trackLengthM) * (trackRight - trackLeft);
  const graphPoints = useMemo(() => {
    const points = [...samples];
    const last = points.at(-1);
    if (!last || last.timeS !== elapsedS || last.positionM !== positionM) {
      points.push({ timeS: elapsedS, positionM });
    }

    return points
      .map(({ timeS, positionM: samplePosition }) => {
        const x = graphLeft + (timeS / graphDurationS) * (graphRight - graphLeft);
        const y = graphBottom - (samplePosition / trackLengthM) * (graphBottom - graphTop);
        return `${x},${y}`;
      })
      .join(" ");
  }, [elapsedS, graphDurationS, positionM, samples, trackLengthM]);

  function resetMotion(resetDefaults = true) {
    setRunning(false);
    positionRef.current = 0;
    elapsedRef.current = 0;
    setPositionM(0);
    setElapsedS(0);
    setSamples([{ timeS: 0, positionM: 0 }]);
    if (resetDefaults) {
      setSpeedMps(initialSpeedMps);
      setTrackLengthM(initialTrackLengthM);
      setDurationS(initialDurationS);
    }
  }

  function toggleRunning() {
    if (running) {
      setRunning(false);
      return;
    }

    if (completed) resetMotion(false);
    setRunning(true);
  }

  function changeSpeed(nextSpeed: number) {
    const currentTimeS = elapsedRef.current;
    const currentPositionM = positionRef.current;
    setElapsedS(currentTimeS);
    setPositionM(currentPositionM);
    setSamples((current) => {
      const last = current.at(-1);
      if (last && last.timeS === currentTimeS && last.positionM === currentPositionM) {
        return current;
      }
      return [...current, { timeS: currentTimeS, positionM: currentPositionM }];
    });
    setSpeedMps(nextSpeed);
  }

  function changeTrackLength(nextTrackLengthM: number) {
    resetMotion(false);
    setTrackLengthM(nextTrackLengthM);
  }

  function changeDuration(nextDurationS: number) {
    resetMotion(false);
    setDurationS(nextDurationS);
  }

  function stellaMessage() {
    if (reachedTrackEnd) return "Xe đã tới cuối quãng đường. Đồ thị dừng tại vị trí lớn nhất.";
    if (reachedTimeLimit) return "Đã hết thời gian quan sát. Đồ thị dừng tại thời điểm đã chọn.";
    if (running && speedMps === 0) return "Xe đang đứng yên nên đồ thị s-t là một đoạn nằm ngang.";
    if (running) return "Độ dốc của đồ thị chính là tốc độ. Hãy đổi tốc độ khi xe đang chạy để quan sát.";
    if (elapsedS > 0) return "Mô phỏng đang tạm dừng. Quãng đường và thời gian hiện được giữ nguyên.";
    return "Bắt đầu cho xe chạy, sau đó thay đổi tốc độ để so sánh độ dốc của đồ thị.";
  }

  const trackTicks = [0, 0.25, 0.5, 0.75, 1];
  const graphTicks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="stack">
      <div className="card">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div>
            <h2 style={{ margin: 0 }}>Thí nghiệm: Chuyển động và đồ thị s-t</h2>
            <p className="muted">Cho xe chạy và thay đổi tốc độ để quan sát độ dốc đồ thị.</p>
          </div>
          <div className="row">
            <button onClick={toggleRunning}>{running ? "Tạm dừng" : completed ? "Chạy lại" : "Bắt đầu"}</button>
            <button onClick={() => resetMotion()}>Làm lại</button>
          </div>
        </div>

        <div className="sim-wrap">
          <svg viewBox={`0 0 ${W} ${H}`} className="sim-svg" aria-label="Mô phỏng xe chạy và đồ thị quãng đường theo thời gian">
            <line x1={trackLeft} y1={trackY} x2={trackRight} y2={trackY} stroke="#222" strokeWidth="3" />
            {trackTicks.map((ratio) => {
              const x = trackLeft + ratio * (trackRight - trackLeft);
              return (
                <g key={`track-${ratio}`}>
                  <line x1={x} y1={trackY - 6} x2={x} y2={trackY + 6} stroke="#222" strokeWidth="2" />
                  <text x={x} y={trackY + 25} textAnchor="middle" fontSize="12">
                    {(ratio * trackLengthM).toFixed(0)} m
                  </text>
                </g>
              );
            })}

            <g transform={`translate(${carX - 28} 76)`}>
              <path d="M 3 28 L 7 16 L 17 14 L 24 5 L 41 5 L 49 14 L 55 17 L 55 28 Z" fill="#d33" stroke="#9f1f1f" strokeWidth="2" />
              <circle cx="16" cy="29" r="6" fill="#222" />
              <circle cx="44" cy="29" r="6" fill="#222" />
              <path d="M 25 8 H 39 L 45 14 H 20 Z" fill="#bfe4ff" />
            </g>

            <text x={graphLeft} y={graphTop - 20} fontSize="14" fontWeight="bold">Đồ thị s-t</text>
            <line x1={graphLeft} y1={graphTop} x2={graphLeft} y2={graphBottom} stroke="#222" strokeWidth="2" />
            <line x1={graphLeft} y1={graphBottom} x2={graphRight} y2={graphBottom} stroke="#222" strokeWidth="2" />

            {graphTicks.map((ratio) => {
              const x = graphLeft + ratio * (graphRight - graphLeft);
              const y = graphBottom - ratio * (graphBottom - graphTop);
              return (
                <g key={`graph-${ratio}`}>
                  <line x1={x} y1={graphTop} x2={x} y2={graphBottom} stroke="#e2e2e2" strokeWidth="1" />
                  <line x1={graphLeft} y1={y} x2={graphRight} y2={y} stroke="#e2e2e2" strokeWidth="1" />
                  <text x={x} y={graphBottom + 20} textAnchor="middle" fontSize="11">
                    {(ratio * graphDurationS).toFixed(1)}
                  </text>
                  <text x={graphLeft - 10} y={y + 4} textAnchor="end" fontSize="11">
                    {(ratio * trackLengthM).toFixed(0)}
                  </text>
                </g>
              );
            })}

            <polyline points={graphPoints} fill="none" stroke="#146bd1" strokeWidth="3" />
            <circle
              cx={graphLeft + (elapsedS / graphDurationS) * (graphRight - graphLeft)}
              cy={graphBottom - (positionM / trackLengthM) * (graphBottom - graphTop)}
              r="5"
              fill="#146bd1"
            />
            <text x={graphRight} y={graphBottom + 38} textAnchor="end" fontSize="12">t (s)</text>
            <text x={graphLeft - 8} y={graphTop - 8} textAnchor="end" fontSize="12">s (m)</text>
          </svg>
        </div>

        <div className="grid2" style={{ marginTop: 16 }}>
          <label>
            <span>Tốc độ: {speedMps.toFixed(1)} m/s</span>
            <input
              type="range"
              min="0"
              max="20"
              step="0.5"
              value={speedMps}
              onChange={(event) => changeSpeed(Number(event.target.value))}
            />
          </label>
          <label>
            <span>Quãng đường tối đa: {trackLengthM.toFixed(0)} m</span>
            <input
              type="range"
              min="50"
              max="500"
              step="10"
              value={trackLengthM}
              disabled={running}
              onChange={(event) => changeTrackLength(Number(event.target.value))}
            />
          </label>
          <label>
            <span>Thời gian quan sát: {durationS.toFixed(0)} s</span>
            <input
              type="range"
              min="5"
              max="60"
              step="5"
              value={durationS}
              disabled={running}
              onChange={(event) => changeDuration(Number(event.target.value))}
            />
          </label>
        </div>
      </div>

      <div className="grid2">
        <div className="card">
          <strong>Stella</strong>
          <p>{stellaMessage()}</p>
        </div>
        <div className="card">
          <strong>Kết quả</strong>
          <p>Thời gian: {elapsedS.toFixed(1)} s / {durationS.toFixed(0)} s</p>
          <p>Quãng đường: {positionM.toFixed(1)} m / {trackLengthM.toFixed(0)} m</p>
          <p>Tốc độ hiện tại: {speedMps.toFixed(1)} m/s</p>
        </div>
      </div>
    </div>
  );
}
