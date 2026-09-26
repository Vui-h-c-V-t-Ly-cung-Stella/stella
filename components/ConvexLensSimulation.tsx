"use client";

import { useMemo, useState } from "react";
import { solveConvexLens } from "@/lib/physics";
import type { ConvexLensParams } from "@/types/simulation";

const W = 760;
const H = 390;
const lensX = 380;
const axisY = 210;
const pxPerCm = 9;
const objectHeight = 90;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function viImageType(value: ReturnType<typeof solveConvexLens>["imageType"]) {
  if (value === "real") return "Ảnh thật";
  if (value === "virtual") return "Ảnh ảo";
  return "Ảnh ở vô cực";
}

export default function ConvexLensSimulation({ initial }: { initial: ConvexLensParams }) {
  const [focalLength, setFocalLength] = useState(initial.focalLengthCm);
  const [objectDistance, setObjectDistance] = useState(initial.objectDistanceCm);
  const [showRays, setShowRays] = useState(initial.showRays);
  const [showFocalPoints, setShowFocalPoints] = useState(initial.showFocalPoints);

  const state = useMemo(
    () => solveConvexLens(focalLength, objectDistance),
    [focalLength, objectDistance],
  );

  const objectX = lensX - objectDistance * pxPerCm;
  const objectTop = axisY - objectHeight;
  const fPx = focalLength * pxPerCm;

  const imageX = state.imageDistanceCm == null ? null : lensX + state.imageDistanceCm * pxPerCm;
  const imageHeight = state.magnification == null ? null : state.magnification * objectHeight;
  const imageTop = imageHeight == null ? null : axisY - imageHeight;

  const ray1EndY = objectTop + ((axisY - objectTop) / fPx) * (W - 30 - lensX);
  const centerSlope = (axisY - objectTop) / (lensX - objectX);
  const ray2EndY = axisY + centerSlope * (W - 30 - lensX);

  function stellaMessage() {
    if (state.imageType === "at_infinity") {
      return "Em đang đặt vật gần tiêu điểm F. Các tia ló gần như song song nên ảnh đi ra rất xa.";
    }
    if (state.imageType === "virtual") {
      return "Vật đang nằm trong tiêu cự. Ảnh lúc này là ảnh ảo, cùng chiều và lớn hơn vật.";
    }
    if (objectDistance > 2 * focalLength + 0.4) {
      return "Vật nằm ngoài 2F: ảnh thật, ngược chiều và nhỏ hơn vật.";
    }
    if (Math.abs(objectDistance - 2 * focalLength) <= 0.4) {
      return "Vật đang gần 2F. Em có thấy ảnh gần bằng kích thước vật không?";
    }
    return "Vật nằm giữa F và 2F: ảnh thật, ngược chiều và lớn hơn vật.";
  }

  return (
    <div className="stack">
      <div className="card">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div>
            <h2 style={{ margin: 0 }}>Thí nghiệm: Thấu kính hội tụ</h2>
            <p className="muted">Kéo thanh vị trí vật hoặc chỉnh tiêu cự để quan sát.</p>
          </div>
          <button
            onClick={() => {
              setFocalLength(initial.focalLengthCm);
              setObjectDistance(initial.objectDistanceCm);
              setShowRays(initial.showRays);
              setShowFocalPoints(initial.showFocalPoints);
            }}
          >
            Làm lại
          </button>
        </div>

        <div className="sim-wrap">
          <svg viewBox={`0 0 ${W} ${H}`} className="sim-svg" aria-label="Mô phỏng thấu kính hội tụ">
            <line x1="30" y1={axisY} x2={W - 30} y2={axisY} stroke="#222" strokeWidth="2" />

            {showFocalPoints && [
              [lensX - 2 * fPx, "2F"],
              [lensX - fPx, "F"],
              [lensX + fPx, "F"],
              [lensX + 2 * fPx, "2F"],
            ].map(([x, label]) => (
              <g key={`${x}-${label}`}>
                <circle cx={x} cy={axisY} r="4" fill="#222" />
                <text x={x} y={axisY + 24} textAnchor="middle" fontSize="13">{label}</text>
              </g>
            ))}

            <path
              d={`M ${lensX} 65 C ${lensX - 30} 120 ${lensX - 30} 300 ${lensX} 355 C ${lensX + 30} 300 ${lensX + 30} 120 ${lensX} 65 Z`}
              fill="#bfe4ff"
              stroke="#1677b8"
              strokeWidth="3"
            />
            <text x={lensX} y={axisY + 24} textAnchor="middle" fontSize="13">O</text>

            <line x1={objectX} y1={axisY} x2={objectX} y2={objectTop} stroke="#d33" strokeWidth="7" />
            <polygon
              points={`${objectX},${objectTop - 18} ${objectX - 13},${objectTop + 5} ${objectX + 13},${objectTop + 5}`}
              fill="#d33"
            />
            <text x={objectX} y={objectTop - 28} textAnchor="middle" fontSize="13">Vật</text>

            {showRays && state.imageType !== "at_infinity" && (
              <g>
                <line x1={objectX} y1={objectTop} x2={lensX} y2={objectTop} stroke="#e58a00" strokeWidth="2.5" />
                <line x1={lensX} y1={objectTop} x2={W - 30} y2={ray1EndY} stroke="#e58a00" strokeWidth="2.5" />
                <line x1={objectX} y1={objectTop} x2={W - 30} y2={ray2EndY} stroke="#146bd1" strokeWidth="2.5" />

                {state.imageType === "virtual" && imageX != null && imageTop != null && (
                  <g strokeDasharray="6 5" opacity="0.7">
                    <line x1={lensX} y1={objectTop} x2={clamp(imageX, 35, lensX)} y2={clamp(imageTop, 45, 345)} stroke="#e58a00" strokeWidth="1.5" />
                    <line x1={lensX} y1={axisY} x2={clamp(imageX, 35, lensX)} y2={clamp(imageTop, 45, 345)} stroke="#146bd1" strokeWidth="1.5" />
                  </g>
                )}
              </g>
            )}

            {imageX != null && imageTop != null && state.imageType !== "at_infinity" && (
              <g>
                <line
                  x1={clamp(imageX, 35, W - 35)}
                  y1={axisY}
                  x2={clamp(imageX, 35, W - 35)}
                  y2={clamp(imageTop, 45, 345)}
                  stroke="#148a55"
                  strokeWidth="7"
                />
                <text
                  x={clamp(imageX, 35, W - 35)}
                  y={state.orientation === "upright" ? clamp(imageTop - 18, 25, H - 20) : clamp(imageTop + 28, 25, H - 20)}
                  textAnchor="middle"
                  fontSize="13"
                >
                  {viImageType(state.imageType)}
                </text>
              </g>
            )}
          </svg>
        </div>

        <div className="grid2" style={{ marginTop: 16 }}>
          <label>
            <span>Khoảng cách vật: {objectDistance.toFixed(1)} cm</span>
            <input
              type="range"
              min="5"
              max="34"
              step="0.5"
              value={objectDistance}
              onChange={(e) => setObjectDistance(Number(e.target.value))}
            />
          </label>
          <label>
            <span>Tiêu cự: {focalLength.toFixed(1)} cm</span>
            <input
              type="range"
              min="5"
              max="12"
              step="0.5"
              value={focalLength}
              onChange={(e) => setFocalLength(Number(e.target.value))}
            />
          </label>
        </div>

        <div className="row" style={{ marginTop: 14 }}>
          <label style={{ display: "flex", gap: 7, alignItems: "center" }}>
            <input type="checkbox" checked={showRays} onChange={(e) => setShowRays(e.target.checked)} />
            Hiện tia sáng
          </label>
          <label style={{ display: "flex", gap: 7, alignItems: "center" }}>
            <input type="checkbox" checked={showFocalPoints} onChange={(e) => setShowFocalPoints(e.target.checked)} />
            Hiện tiêu điểm
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
          <p>Loại ảnh: {viImageType(state.imageType)}</p>
          <p>
            Khoảng cách ảnh: {state.imageDistanceCm == null ? "rất xa" : `${Math.abs(state.imageDistanceCm).toFixed(1)} cm`}
          </p>
          <p>
            Độ phóng đại: {state.magnification == null ? "—" : Math.abs(state.magnification).toFixed(2)}×
          </p>
        </div>
      </div>
    </div>
  );
}
