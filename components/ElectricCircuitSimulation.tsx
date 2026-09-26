"use client";

import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { solveElectricCircuit } from "@/lib/circuit";
import type { CircuitConnection, ElectricCircuitParams } from "@/types/simulation";

type ComponentId = "battery" | "switch" | "lamp1" | "lamp2";
type Point = { x: number; y: number };
type ComponentPositions = Record<ComponentId, Point>;

const W = 760;
const H = 360;

const SERIES_POSITIONS: ComponentPositions = {
  battery: { x: 90, y: 190 },
  switch: { x: 235, y: 100 },
  lamp1: { x: 430, y: 100 },
  lamp2: { x: 590, y: 100 },
};

const PARALLEL_POSITIONS: ComponentPositions = {
  battery: { x: 90, y: 190 },
  switch: { x: 235, y: 90 },
  lamp1: { x: 500, y: 130 },
  lamp2: { x: 500, y: 245 },
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function initialPositions(connection: CircuitConnection): ComponentPositions {
  const source = connection === "series" ? SERIES_POSITIONS : PARALLEL_POSITIONS;
  return Object.fromEntries(
    Object.entries(source).map(([key, point]) => [key, { ...point }]),
  ) as ComponentPositions;
}

function constrainedPosition(id: ComponentId, point: Point): Point {
  if (id === "battery") {
    return { x: clamp(point.x, 65, 160), y: clamp(point.y, 155, 245) };
  }
  if (id === "switch") {
    return { x: clamp(point.x, 190, 325), y: clamp(point.y, 70, 155) };
  }
  return { x: clamp(point.x, 390, 640), y: clamp(point.y, 75, 275) };
}

function orthogonalPath(from: Point, to: Point) {
  return `M ${from.x} ${from.y} L ${from.x} ${to.y} L ${to.x} ${to.y}`;
}

function circuitPaths(connection: CircuitConnection, positions: ComponentPositions) {
  const batteryTop = { x: positions.battery.x, y: positions.battery.y - 42 };
  const batteryBottom = { x: positions.battery.x, y: positions.battery.y + 42 };
  const switchLeft = { x: positions.switch.x - 38, y: positions.switch.y };
  const switchRight = { x: positions.switch.x + 38, y: positions.switch.y };
  const lamp1Left = { x: positions.lamp1.x - 30, y: positions.lamp1.y };
  const lamp1Right = { x: positions.lamp1.x + 30, y: positions.lamp1.y };
  const lamp2Left = { x: positions.lamp2.x - 30, y: positions.lamp2.y };
  const lamp2Right = { x: positions.lamp2.x + 30, y: positions.lamp2.y };

  if (connection === "series") {
    const returnY = 310;
    return [
      orthogonalPath(batteryTop, switchLeft),
      orthogonalPath(switchRight, lamp1Left),
      orthogonalPath(lamp1Right, lamp2Left),
      `M ${lamp2Right.x} ${lamp2Right.y} L 690 ${lamp2Right.y} L 690 ${returnY} L ${batteryBottom.x} ${returnY} L ${batteryBottom.x} ${batteryBottom.y}`,
    ];
  }

  const leftBusX = 360;
  const rightBusX = 665;
  const returnY = 315;
  const branchTop = Math.min(switchRight.y, lamp1Left.y, lamp2Left.y);
  const branchBottom = Math.max(lamp1Left.y, lamp2Left.y);
  return [
    orthogonalPath(batteryTop, switchLeft),
    `M ${switchRight.x} ${switchRight.y} L ${leftBusX} ${switchRight.y}`,
    `M ${leftBusX} ${branchTop} L ${leftBusX} ${branchBottom}`,
    `M ${leftBusX} ${lamp1Left.y} L ${lamp1Left.x} ${lamp1Left.y}`,
    `M ${leftBusX} ${lamp2Left.y} L ${lamp2Left.x} ${lamp2Left.y}`,
    `M ${lamp1Right.x} ${lamp1Right.y} L ${rightBusX} ${lamp1Right.y}`,
    `M ${lamp2Right.x} ${lamp2Right.y} L ${rightBusX} ${lamp2Right.y}`,
    `M ${rightBusX} ${Math.min(lamp1Right.y, lamp2Right.y)} L ${rightBusX} ${returnY} L ${batteryBottom.x} ${returnY} L ${batteryBottom.x} ${batteryBottom.y}`,
  ];
}

export default function ElectricCircuitSimulation({ initial }: { initial: ElectricCircuitParams }) {
  const initialVoltageV = clamp(initial.voltageV, 1.5, 12);
  const initialResistance1 = clamp(initial.resistor1Ohm, 1, 20);
  const initialResistance2 = clamp(initial.resistor2Ohm, 1, 20);
  const [connection, setConnection] = useState<CircuitConnection>(initial.connection);
  const [voltageV, setVoltageV] = useState(initialVoltageV);
  const [resistor1Ohm, setResistor1Ohm] = useState(initialResistance1);
  const [resistor2Ohm, setResistor2Ohm] = useState(initialResistance2);
  const [switchClosed, setSwitchClosed] = useState(true);
  const [positions, setPositions] = useState(() => initialPositions(initial.connection));
  const [dragging, setDragging] = useState<ComponentId | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const state = useMemo(
    () => solveElectricCircuit(voltageV, resistor1Ohm, resistor2Ohm, connection, switchClosed),
    [connection, resistor1Ohm, resistor2Ohm, switchClosed, voltageV],
  );
  const wirePaths = useMemo(() => circuitPaths(connection, positions), [connection, positions]);
  const activeDashDuration = clamp(1.2 / (state.totalCurrentA + 0.2), 0.25, 1.2);

  function setMode(nextConnection: CircuitConnection) {
    setConnection(nextConnection);
    setPositions(initialPositions(nextConnection));
    setDragging(null);
  }

  function resetSimulation() {
    setConnection(initial.connection);
    setVoltageV(initialVoltageV);
    setResistor1Ohm(initialResistance1);
    setResistor2Ohm(initialResistance2);
    setSwitchClosed(true);
    setPositions(initialPositions(initial.connection));
    setDragging(null);
  }

  function pointerPosition(event: ReactPointerEvent<SVGSVGElement>): Point | null {
    const svg = svgRef.current;
    if (!svg) return null;
    const bounds = svg.getBoundingClientRect();
    return {
      x: ((event.clientX - bounds.left) / bounds.width) * W,
      y: ((event.clientY - bounds.top) / bounds.height) * H,
    };
  }

  function startDragging(id: ComponentId, event: ReactPointerEvent<SVGGElement>) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(id);
  }

  function moveComponent(event: ReactPointerEvent<SVGSVGElement>) {
    if (!dragging) return;
    const point = pointerPosition(event);
    if (!point) return;
    setPositions((current) => ({
      ...current,
      [dragging]: constrainedPosition(dragging, point),
    }));
  }

  function lampOpacity(powerW: number) {
    if (!switchClosed) return 0.08;
    return 0.18 + 0.82 * clamp(powerW / 12, 0, 1);
  }

  function stellaMessage() {
    if (!switchClosed) return "Công tắc đang mở nên mạch không kín và không có dòng điện chạy qua bóng đèn.";
    if (connection === "series") {
      return "Mạch nối tiếp có cùng dòng điện qua hai bóng; hiệu điện thế được chia theo điện trở của từng bóng.";
    }
    return "Mạch song song có cùng hiệu điện thế trên hai nhánh; dòng điện tổng bằng tổng dòng điện các nhánh.";
  }

  return (
    <div className="stack">
      <div className="card">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div>
            <h2 style={{ margin: 0 }}>Thí nghiệm: Mạch điện một chiều</h2>
            <p className="muted">So sánh dòng điện, hiệu điện thế và độ sáng trong hai cách mắc mạch.</p>
          </div>
          <button onClick={resetSimulation}>Làm lại</button>
        </div>

        <div className="row" style={{ marginBottom: 14 }}>
          <button
            className={connection === "series" ? "primary" : undefined}
            aria-pressed={connection === "series"}
            onClick={() => setMode("series")}
          >
            Nối tiếp
          </button>
          <button
            className={connection === "parallel" ? "primary" : undefined}
            aria-pressed={connection === "parallel"}
            onClick={() => setMode("parallel")}
          >
            Song song
          </button>
          <button onClick={() => setPositions(initialPositions(connection))}>Sắp xếp lại sơ đồ</button>
        </div>

        <div className="sim-wrap">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            className="sim-svg"
            aria-label="Mô phỏng mạch điện nối tiếp và song song"
            style={{ touchAction: "none" }}
            onPointerMove={moveComponent}
            onPointerUp={() => setDragging(null)}
            onPointerCancel={() => setDragging(null)}
          >
            {wirePaths.map((path, index) => (
              <path key={`wire-${index}`} d={path} fill="none" stroke="#333" strokeWidth="3" strokeLinejoin="round" />
            ))}

            {switchClosed && state.totalCurrentA > 0 && wirePaths.map((path, index) => (
              <path
                key={`current-${index}`}
                d={path}
                fill="none"
                stroke="#146bd1"
                strokeWidth="2"
                strokeDasharray="8 8"
                opacity="0.75"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  from="16"
                  to="0"
                  dur={`${activeDashDuration}s`}
                  repeatCount="indefinite"
                />
              </path>
            ))}

            <g
              transform={`translate(${positions.battery.x} ${positions.battery.y})`}
              style={{ cursor: dragging === "battery" ? "grabbing" : "grab" }}
              onPointerDown={(event) => startDragging("battery", event)}
            >
              <line x1="0" y1="-42" x2="0" y2="-12" stroke="#333" strokeWidth="3" />
              <line x1="-20" y1="-12" x2="20" y2="-12" stroke="#d33" strokeWidth="4" />
              <line x1="-12" y1="10" x2="12" y2="10" stroke="#222" strokeWidth="4" />
              <line x1="0" y1="10" x2="0" y2="42" stroke="#333" strokeWidth="3" />
              <text x="28" y="4" fontSize="13">Pin</text>
              <text x="0" y="-20" textAnchor="middle" fontSize="13">+</text>
              <text x="0" y="28" textAnchor="middle" fontSize="13">−</text>
            </g>

            <g
              transform={`translate(${positions.switch.x} ${positions.switch.y})`}
              style={{ cursor: dragging === "switch" ? "grabbing" : "grab" }}
              onPointerDown={(event) => startDragging("switch", event)}
            >
              <circle cx="-38" cy="0" r="5" fill="#222" />
              <circle cx="38" cy="0" r="5" fill="#222" />
              <line
                x1="-34"
                y1="-2"
                x2={switchClosed ? 34 : 25}
                y2={switchClosed ? -2 : -24}
                stroke={switchClosed ? "#146bd1" : "#222"}
                strokeWidth="5"
                strokeLinecap="round"
              />
              <text x="0" y="-34" textAnchor="middle" fontSize="13">Công tắc</text>
            </g>

            {(["lamp1", "lamp2"] as const).map((id, index) => {
              const lampState = index === 0
                ? { resistance: resistor1Ohm, power: state.power1W }
                : { resistance: resistor2Ohm, power: state.power2W };
              return (
                <g
                  key={id}
                  transform={`translate(${positions[id].x} ${positions[id].y})`}
                  style={{ cursor: dragging === id ? "grabbing" : "grab" }}
                  onPointerDown={(event) => startDragging(id, event)}
                >
                  <line x1="-30" y1="0" x2="-22" y2="0" stroke="#333" strokeWidth="3" />
                  <line x1="22" y1="0" x2="30" y2="0" stroke="#333" strokeWidth="3" />
                  <circle cx="0" cy="0" r="22" fill="#ffd84d" fillOpacity={lampOpacity(lampState.power)} stroke="#222" strokeWidth="3" />
                  <line x1="-13" y1="-13" x2="13" y2="13" stroke="#555" strokeWidth="2" />
                  <line x1="13" y1="-13" x2="-13" y2="13" stroke="#555" strokeWidth="2" />
                  <text x="0" y="-32" textAnchor="middle" fontSize="13">Bóng {index + 1}</text>
                  <text x="0" y="42" textAnchor="middle" fontSize="12">{lampState.resistance.toFixed(0)} Ω</text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="row" style={{ marginTop: 14 }}>
          <label style={{ display: "flex", gap: 7, alignItems: "center" }}>
            <input
              type="checkbox"
              checked={switchClosed}
              onChange={(event) => setSwitchClosed(event.target.checked)}
            />
            Đóng công tắc
          </label>
        </div>

        <div className="grid2" style={{ marginTop: 16 }}>
          <label>
            <span>Hiệu điện thế nguồn: {voltageV.toFixed(1)} V</span>
            <input type="range" min="1.5" max="12" step="0.5" value={voltageV} onChange={(event) => setVoltageV(Number(event.target.value))} />
          </label>
          <label>
            <span>Điện trở bóng 1: {resistor1Ohm.toFixed(0)} Ω</span>
            <input type="range" min="1" max="20" step="1" value={resistor1Ohm} onChange={(event) => setResistor1Ohm(Number(event.target.value))} />
          </label>
          <label>
            <span>Điện trở bóng 2: {resistor2Ohm.toFixed(0)} Ω</span>
            <input type="range" min="1" max="20" step="1" value={resistor2Ohm} onChange={(event) => setResistor2Ohm(Number(event.target.value))} />
          </label>
        </div>
      </div>

      <div className="grid2">
        <div className="card">
          <strong>Stella</strong>
          <p>{stellaMessage()}</p>
          <strong>Các bước tính toàn mạch</strong>
          {connection === "series" ? (
            <p>
              R<sub>tđ</sub> = R<sub>1</sub> + R<sub>2</sub> = {resistor1Ohm.toFixed(0)} + {resistor2Ohm.toFixed(0)} = {state.equivalentResistanceOhm.toFixed(2)} Ω
            </p>
          ) : (
            <p>
              R<sub>tđ</sub> = (R<sub>1</sub> × R<sub>2</sub>) / (R<sub>1</sub> + R<sub>2</sub>) = ({resistor1Ohm.toFixed(0)} × {resistor2Ohm.toFixed(0)}) / ({resistor1Ohm.toFixed(0)} + {resistor2Ohm.toFixed(0)}) = {state.equivalentResistanceOhm.toFixed(2)} Ω
            </p>
          )}
          {switchClosed ? (
            <p>
              I = U / R<sub>tđ</sub> = {voltageV.toFixed(2)} / {state.equivalentResistanceOhm.toFixed(2)} = {state.totalCurrentA.toFixed(2)} A
            </p>
          ) : (
            <p>Mạch hở ⇒ I = 0 A.</p>
          )}
          <p><strong>Kết quả:</strong> R<sub>tđ</sub> = {state.equivalentResistanceOhm.toFixed(2)} Ω, I = {state.totalCurrentA.toFixed(2)} A</p>
        </div>
        <div className="card">
          <strong>Số đo hai bóng</strong>
          {switchClosed ? (
            <>
              <p>
                <strong>Bóng 1</strong><br />
                {connection === "series" ? (
                  <>
                    I<sub>1</sub> = I = {state.current1A.toFixed(2)} A<br />
                    U<sub>1</sub> = I × R<sub>1</sub> = {state.current1A.toFixed(4)} × {resistor1Ohm.toFixed(0)} = {state.voltage1V.toFixed(2)} V
                  </>
                ) : (
                  <>
                    U<sub>1</sub> = U = {state.voltage1V.toFixed(2)} V<br />
                    I<sub>1</sub> = U<sub>1</sub> / R<sub>1</sub> = {state.voltage1V.toFixed(2)} / {resistor1Ohm.toFixed(0)} = {state.current1A.toFixed(2)} A
                  </>
                )}<br />
                P<sub>1</sub> = U<sub>1</sub> × I<sub>1</sub> = {state.voltage1V.toFixed(4)} × {state.current1A.toFixed(4)} = {state.power1W.toFixed(2)} W<br />
                <strong>Kết quả:</strong> I = {state.current1A.toFixed(2)} A, U = {state.voltage1V.toFixed(2)} V, P = {state.power1W.toFixed(2)} W
              </p>
              <p>
                <strong>Bóng 2</strong><br />
                {connection === "series" ? (
                  <>
                    I<sub>2</sub> = I = {state.current2A.toFixed(2)} A<br />
                    U<sub>2</sub> = I × R<sub>2</sub> = {state.current2A.toFixed(4)} × {resistor2Ohm.toFixed(0)} = {state.voltage2V.toFixed(2)} V
                  </>
                ) : (
                  <>
                    U<sub>2</sub> = U = {state.voltage2V.toFixed(2)} V<br />
                    I<sub>2</sub> = U<sub>2</sub> / R<sub>2</sub> = {state.voltage2V.toFixed(2)} / {resistor2Ohm.toFixed(0)} = {state.current2A.toFixed(2)} A
                  </>
                )}<br />
                P<sub>2</sub> = U<sub>2</sub> × I<sub>2</sub> = {state.voltage2V.toFixed(4)} × {state.current2A.toFixed(4)} = {state.power2W.toFixed(2)} W<br />
                <strong>Kết quả:</strong> I = {state.current2A.toFixed(2)} A, U = {state.voltage2V.toFixed(2)} V, P = {state.power2W.toFixed(2)} W
              </p>
            </>
          ) : (
            <>
              <p>I<sub>1</sub> = I<sub>2</sub> = 0 A vì mạch không kín.</p>
              <p>P<sub>1</sub> = U<sub>1</sub> × I<sub>1</sub> = 0 W; P<sub>2</sub> = U<sub>2</sub> × I<sub>2</sub> = 0 W.</p>
              <p><strong>Kết quả:</strong> cả hai bóng đều tắt.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
