import type { SimulationId } from "@/types/simulation";

export const SIMULATION_REGISTRY: Record<
  SimulationId,
  { label: string; description: string; implemented: boolean }
> = {
  convex_lens: {
    label: "Thấu kính hội tụ",
    description: "Dựng ảnh và các tia đặc biệt qua thấu kính hội tụ.",
    implemented: true,
  },
  unknown: {
    label: "Chưa xác định",
    description: "Stella chưa tìm được mô phỏng phù hợp.",
    implemented: true,
  },
};

export const SUPPORTED_SIMULATION_IDS = Object.entries(SIMULATION_REGISTRY)
  .filter(([, value]) => value.implemented)
  .map(([key]) => key) as SimulationId[];
