import type { CircuitConnection } from "@/types/simulation";

export type CircuitState = {
  equivalentResistanceOhm: number;
  totalCurrentA: number;
  current1A: number;
  current2A: number;
  voltage1V: number;
  voltage2V: number;
  power1W: number;
  power2W: number;
};

export function solveElectricCircuit(
  voltageV: number,
  resistor1Ohm: number,
  resistor2Ohm: number,
  connection: CircuitConnection,
  switchClosed: boolean,
): CircuitState {
  const voltage = Math.max(0, voltageV);
  const resistance1 = Math.max(0.1, resistor1Ohm);
  const resistance2 = Math.max(0.1, resistor2Ohm);
  const equivalentResistance = connection === "series"
    ? resistance1 + resistance2
    : 1 / (1 / resistance1 + 1 / resistance2);

  if (!switchClosed) {
    return {
      equivalentResistanceOhm: equivalentResistance,
      totalCurrentA: 0,
      current1A: 0,
      current2A: 0,
      voltage1V: 0,
      voltage2V: 0,
      power1W: 0,
      power2W: 0,
    };
  }

  if (connection === "series") {
    const current = voltage / equivalentResistance;
    const voltage1 = current * resistance1;
    const voltage2 = current * resistance2;
    return {
      equivalentResistanceOhm: equivalentResistance,
      totalCurrentA: current,
      current1A: current,
      current2A: current,
      voltage1V: voltage1,
      voltage2V: voltage2,
      power1W: current * current * resistance1,
      power2W: current * current * resistance2,
    };
  }

  const current1 = voltage / resistance1;
  const current2 = voltage / resistance2;
  return {
    equivalentResistanceOhm: equivalentResistance,
    totalCurrentA: current1 + current2,
    current1A: current1,
    current2A: current2,
    voltage1V: voltage,
    voltage2V: voltage,
    power1W: voltage * current1,
    power2W: voltage * current2,
  };
}
