"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { solveForceFriction } from "@/lib/dynamics";
import type { ForceFrictionParams } from "@/types/simulation";

type SpeedSample = {
  timeS: number;
  speedMps: number;
};

const W = 760;
const H = 450;
const trackLeft = 55;
const trackRight = 710;
const trackY = 145;
const trackLengthM = 100;
const graphLeft = 65;
const graphRight = 720;
const graphTop = 255;
const graphBottom = 410;
const graphMaxSpeedMps = 50;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export default function ForceFrictionSimulation({ initial }: { initial: ForceFrictionParams }) {
  const defaults = useMemo(() => ({
    pullingForceN: clamp(initial.pullingForceN, 0, 40),
    frictionForceN: clamp(initial.frictionForceN, 0, 30),
    massKg: clamp(initial.massKg, 5, 30),
    initialSpeedMps: clamp(initial.initialSpeedMps, 0, 10),
    durationS: clamp(initial.durationS, 5, 20),
  }), [initial]);
  const [pullingForceN, setPullingForceN] = useState(defaults.pullingForceN);
  const [frictionForceN, setFrictionForceN] = useState(defaults.frictionForceN);
  const [massKg, setMassKg] = useState(defaults.massKg);
  const [initialSpeedMps, setInitialSpeedMps] = useState(defaults.initialSpeedMps);
  const [durationS, setDurationS] = useState(defaults.durationS);
  const [speedMps, setSpeedMps] = useState(defaults.initialSpeedMps);
  const [positionM, setPositionM] = useState(0);
  const [elapsedS, setElapsedS] = useState(0);
  const [running, setRunning] = useState(false);
  const [samples, setSamples] = useState<SpeedSample[]>([
    { timeS: 0, speedMps: defaults.initialSpeedMps },
  ]);
  const speedRef = useRef(defaults.initialSpeedMps);
  const positionRef = useRef(0);
  const elapsedRef = useRef(0);

  const dynamics = solveForceFriction(pullingForceN, frictionForceN, massKg, speedMps);

  useEffect(() => {
    if (!running) return;

    let animationFrame = 0;
    let lastFrameTime = performance.now();

    const animate = (now: number) => {
      const frameDeltaS = Math.min((now - lastFrameTime) / 1000, 0.1);
      lastFrameTime = now;
      const remainingTimeS = durationS - elapsedRef.current;
      const deltaS = Math.min(frameDeltaS, remainingTimeS);
      const currentSpeed = speedRef.current;
      const currentDynamics = solveForceFriction(
        pullingForceN,
        frictionForceN,
        massKg,
        currentSpeed,
      );

      let movingTimeS = deltaS;
      if (currentDynamics.accelerationMps2 < 0 && currentSpeed > 0) {
        movingTimeS = Math.min(deltaS, currentSpeed / -currentDynamics.accelerationMps2);
      }

      const nextSpeed = Math.max(
        0,
        currentSpeed + currentDynamics.accelerationMps2 * movingTimeS,
      );
      const distanceDeltaM = Math.max(
        0,
        currentSpeed * movingTimeS
          + 0.5 * currentDynamics.accelerationMps2 * movingTimeS * movingTimeS,
      );
      const nextPositionM = Math.min(trackLengthM, positionRef.current + distanceDeltaM);
      const nextElapsedS = elapsedRef.current + deltaS;

      if (currentSpeed > 0 && nextSpeed === 0) {
        const stopSample = {
          timeS: elapsedRef.current + movingTimeS,
          speedMps: 0,
        };
        setSamples((current) => {
          const last = current.at(-1);
          if (last && last.timeS === stopSample.timeS && last.speedMps === 0) {
            return current;
          }
          return [...current, stopSample];
        });
      }

      speedRef.current = nextSpeed;
      positionRef.current = nextPositionM;
      elapsedRef.current = nextElapsedS;
      setSpeedMps(nextSpeed);
      setPositionM(nextPositionM);
      setElapsedS(nextElapsedS);

      if (nextPositionM >= trackLengthM || nextElapsedS >= durationS) {
        setRunning(false);
        return;
      }

      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [durationS, frictionForceN, massKg, pullingForceN, running]);

  const completed = positionM >= trackLengthM || elapsedS >= durationS;
  const carX = trackLeft + (positionM / trackLengthM) * (trackRight - trackLeft);
  const graphPoints = useMemo(() => {
    const points = [...samples];
    const last = points.at(-1);
    if (!last || last.timeS !== elapsedS || last.speedMps !== speedMps) {
      points.push({ timeS: elapsedS, speedMps });
    }
    return points.map((sample) => {
      const x = graphLeft + (sample.timeS / durationS) * (graphRight - graphLeft);
      const y = graphBottom - (sample.speedMps / graphMaxSpeedMps) * (graphBottom - graphTop);
      return `${x},${clamp(y, graphTop, graphBottom)}`;
    }).join(" ");
  }, [durationS, elapsedS, samples, speedMps]);

  function captureSample() {
    const sample = { timeS: elapsedRef.current, speedMps: speedRef.current };
    setSamples((current) => {
      const last = current.at(-1);
      if (last && last.timeS === sample.timeS && last.speedMps === sample.speedMps) {
        return current;
      }
      return [...current, sample];
    });
  }

  function resetMotion(resetDefaults = true) {
    setRunning(false);
    const nextInitialSpeed = resetDefaults ? defaults.initialSpeedMps : initialSpeedMps;
    speedRef.current = nextInitialSpeed;
    positionRef.current = 0;
    elapsedRef.current = 0;
    setSpeedMps(nextInitialSpeed);
    setPositionM(0);
    setElapsedS(0);
    setSamples([{ timeS: 0, speedMps: nextInitialSpeed }]);
    if (resetDefaults) {
      setPullingForceN(defaults.pullingForceN);
      setFrictionForceN(defaults.frictionForceN);
      setMassKg(defaults.massKg);
      setInitialSpeedMps(defaults.initialSpeedMps);
      setDurationS(defaults.durationS);
    }
  }

  function toggleRunning() {
    if (running) {
      captureSample();
      setRunning(false);
      return;
    }
    if (completed) resetMotion(false);
    setRunning(true);
  }

  function changeLiveValue(setter: (value: number) => void, value: number) {
    captureSample();
    setter(value);
  }

  function changeInitialSpeed(value: number) {
    setRunning(false);
    setInitialSpeedMps(value);
    speedRef.current = value;
    positionRef.current = 0;
    elapsedRef.current = 0;
    setSpeedMps(value);
    setPositionM(0);
    setElapsedS(0);
    setSamples([{ timeS: 0, speedMps: value }]);
  }

  function changeDuration(value: number) {
    resetMotion(false);
    setDurationS(value);
  }

  function stellaMessage() {
    if (positionM >= trackLengthM) return "Xe đã tới cuối quãng đường quan sát.";
    if (elapsedS >= durationS) return "Đã hết thời gian quan sát.";
    if (speedMps <= 0.001 && pullingForceN <= frictionForceN) {
      return "Lực kéo chưa thắng được ma sát nghỉ nên xe vẫn đứng yên.";
    }
    if (Math.abs(dynamics.netForceN) < 0.001) {
      return "Hai lực cân bằng nên xe chuyển động thẳng đều.";
    }
    if (dynamics.accelerationMps2 > 0) {
      return "Lực kéo lớn hơn lực ma sát nên xe nhanh dần; đồ thị v-t đi lên.";
    }
    return "Lực ma sát lớn hơn lực kéo nên xe chậm dần; đồ thị v-t đi xuống.";
  }

  const forceScale = 2.3;
  const pullArrowLength = pullingForceN * forceScale;
  const frictionArrowLength = dynamics.appliedFrictionN * forceScale;
  const forceCenterX = W / 2;
  const graphTicks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="stack">
      <div className="card">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div>
            <h2 style={{ margin: 0 }}>Thí nghiệm: Lực kéo và lực ma sát</h2>
            <p className="muted">Thay đổi lực và khối lượng để quan sát gia tốc cùng đồ thị v-t.</p>
          </div>
          <div className="row">
            <button onClick={toggleRunning}>{running ? "Tạm dừng" : completed ? "Chạy lại" : elapsedS > 0 ? "Tiếp tục" : "Bắt đầu"}</button>
            <button onClick={() => resetMotion()}>Làm lại</button>
          </div>
        </div>

        <div className="sim-wrap">
          <svg viewBox={`0 0 ${W} ${H}`} className="sim-svg" aria-label="Mô phỏng xe chịu lực kéo và lực ma sát">
            <defs>
              <marker id="pull-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                <path d="M 0 0 L 8 4 L 0 8 Z" fill="#16834c" />
              </marker>
              <marker id="friction-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                <path d="M 0 0 L 8 4 L 0 8 Z" fill="#d46a00" />
              </marker>
            </defs>

            <line x1={trackLeft} y1={trackY} x2={trackRight} y2={trackY} stroke="#222" strokeWidth="3" />
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const x = trackLeft + ratio * (trackRight - trackLeft);
              return (
                <g key={`track-${ratio}`}>
                  <line x1={x} y1={trackY - 5} x2={x} y2={trackY + 6} stroke="#222" strokeWidth="2" />
                  <text x={x} y={trackY + 24} textAnchor="middle" fontSize="12">{ratio * trackLengthM} m</text>
                </g>
              );
            })}

            <g transform={`translate(${carX - 28} 101)`}>
              <path d="M 3 28 L 7 16 L 17 14 L 24 5 L 41 5 L 49 14 L 55 17 L 55 28 Z" fill="#d33" stroke="#9f1f1f" strokeWidth="2" />
              <circle cx="16" cy="29" r="6" fill="#222" />
              <circle cx="44" cy="29" r="6" fill="#222" />
              <path d="M 25 8 H 39 L 45 14 H 20 Z" fill="#bfe4ff" />
            </g>

            {pullArrowLength > 0 && (
              <g>
                <line x1={forceCenterX} y1="65" x2={forceCenterX + pullArrowLength} y2="65" stroke="#16834c" strokeWidth="4" markerEnd="url(#pull-arrow)" />
                <text x={forceCenterX + pullArrowLength / 2} y="52" textAnchor="middle" fontSize="12" fill="#11663c">F kéo</text>
              </g>
            )}
            {frictionArrowLength > 0 && (
              <g>
                <line x1={forceCenterX} y1="90" x2={forceCenterX - frictionArrowLength} y2="90" stroke="#d46a00" strokeWidth="4" markerEnd="url(#friction-arrow)" />
                <text x={forceCenterX - frictionArrowLength / 2} y="80" textAnchor="middle" fontSize="12" fill="#9b4d00">F ma sát</text>
              </g>
            )}

            <text x={graphLeft} y={graphTop - 18} fontSize="14" fontWeight="bold">Đồ thị v-t</text>
            <line x1={graphLeft} y1={graphTop} x2={graphLeft} y2={graphBottom} stroke="#222" strokeWidth="2" />
            <line x1={graphLeft} y1={graphBottom} x2={graphRight} y2={graphBottom} stroke="#222" strokeWidth="2" />
            {graphTicks.map((ratio) => {
              const x = graphLeft + ratio * (graphRight - graphLeft);
              const y = graphBottom - ratio * (graphBottom - graphTop);
              return (
                <g key={`graph-${ratio}`}>
                  <line x1={x} y1={graphTop} x2={x} y2={graphBottom} stroke="#e2e2e2" />
                  <line x1={graphLeft} y1={y} x2={graphRight} y2={y} stroke="#e2e2e2" />
                  <text x={x} y={graphBottom + 20} textAnchor="middle" fontSize="11">{(ratio * durationS).toFixed(1)}</text>
                  <text x={graphLeft - 10} y={y + 4} textAnchor="end" fontSize="11">{(ratio * graphMaxSpeedMps).toFixed(0)}</text>
                </g>
              );
            })}
            <polyline points={graphPoints} fill="none" stroke="#146bd1" strokeWidth="3" />
            <circle
              cx={graphLeft + (elapsedS / durationS) * (graphRight - graphLeft)}
              cy={clamp(graphBottom - (speedMps / graphMaxSpeedMps) * (graphBottom - graphTop), graphTop, graphBottom)}
              r="5"
              fill="#146bd1"
            />
            <text x={graphRight} y={graphBottom + 38} textAnchor="end" fontSize="12">t (s)</text>
            <text x={graphLeft - 8} y={graphTop - 8} textAnchor="end" fontSize="12">v (m/s)</text>
          </svg>
        </div>

        <div className="grid2" style={{ marginTop: 16 }}>
          <label>
            <span>Lực kéo: {pullingForceN.toFixed(0)} N</span>
            <input type="range" min="0" max="40" step="1" value={pullingForceN} onChange={(event) => changeLiveValue(setPullingForceN, Number(event.target.value))} />
          </label>
          <label>
            <span>Lực ma sát cực đại: {frictionForceN.toFixed(0)} N</span>
            <input type="range" min="0" max="30" step="1" value={frictionForceN} onChange={(event) => changeLiveValue(setFrictionForceN, Number(event.target.value))} />
          </label>
          <label>
            <span>Khối lượng xe: {massKg.toFixed(0)} kg</span>
            <input type="range" min="5" max="30" step="1" value={massKg} onChange={(event) => changeLiveValue(setMassKg, Number(event.target.value))} />
          </label>
          <label>
            <span>Vận tốc ban đầu: {initialSpeedMps.toFixed(1)} m/s</span>
            <input type="range" min="0" max="10" step="0.5" value={initialSpeedMps} disabled={running} onChange={(event) => changeInitialSpeed(Number(event.target.value))} />
          </label>
          <label>
            <span>Thời gian quan sát: {durationS.toFixed(0)} s</span>
            <input type="range" min="5" max="20" step="1" value={durationS} disabled={running} onChange={(event) => changeDuration(Number(event.target.value))} />
          </label>
        </div>
      </div>

      <div className="grid2">
        <div className="card">
          <strong>Stella</strong>
          <p>{stellaMessage()}</p>
          <p>F<sub>hợp</sub> = F<sub>kéo</sub> - F<sub>ma sát</sub> = {pullingForceN.toFixed(0)} - {dynamics.appliedFrictionN.toFixed(0)} = {dynamics.netForceN.toFixed(2)} N</p>
          <p>a = F<sub>hợp</sub> / m = {dynamics.netForceN.toFixed(2)} / {massKg.toFixed(0)} = {dynamics.accelerationMps2.toFixed(2)} m/s²</p>
        </div>
        <div className="card">
          <strong>Kết quả</strong>
          <p>Thời gian: {elapsedS.toFixed(1)} s / {durationS.toFixed(0)} s</p>
          <p>Quãng đường: {positionM.toFixed(1)} m / {trackLengthM} m</p>
          <p>Vận tốc hiện tại: {speedMps.toFixed(2)} m/s</p>
          <p>Gia tốc hiện tại: {dynamics.accelerationMps2.toFixed(2)} m/s²</p>
        </div>
      </div>
    </div>
  );
}
