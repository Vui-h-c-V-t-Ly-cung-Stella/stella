import { NextResponse } from "next/server";
import { STELLA_ROUTER_PROMPT } from "@/lib/stellaPrompt";
import type { SimulationAnalysis } from "@/types/simulation";

export const runtime = "nodejs";

const analysisSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    recognized: { type: "boolean" },
    subject: { type: "string", enum: ["physics", "unknown"] },
    grade: { anyOf: [{ type: "integer", enum: [7, 8, 9] }, { type: "null" }] },
    topic: { type: "string" },
    concept: { type: "string" },
    simulationId: { type: "string", enum: ["convex_lens", "unknown"] },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    reason: { type: "string" },
    parameters: {
      anyOf: [
        {
          type: "object",
          additionalProperties: false,
          properties: {
            focalLengthCm: { type: "number", minimum: 4, maximum: 15 },
            objectDistanceCm: { type: "number", minimum: 5, maximum: 40 },
            showRays: { type: "boolean" },
            showFocalPoints: { type: "boolean" }
          },
          required: ["focalLengthCm", "objectDistanceCm", "showRays", "showFocalPoints"]
        },
        { type: "null" }
      ]
    }
  },
  required: [
    "recognized",
    "subject",
    "grade",
    "topic",
    "concept",
    "simulationId",
    "confidence",
    "reason",
    "parameters"
  ]
} as const;

function mockResult(): SimulationAnalysis {
  return {
    recognized: true,
    subject: "physics",
    grade: 9,
    topic: "Quang học",
    concept: "Thấu kính hội tụ",
    simulationId: "convex_lens",
    confidence: 0.99,
    reason: "Mock mode: dùng mô phỏng thấu kính hội tụ để kiểm thử luồng điều phối.",
    parameters: {
      focalLengthCm: 8,
      objectDistanceCm: 22,
      showRays: true,
      showFocalPoints: true,
    },
    source: "mock",
  };
}

function extractOutputText(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const maybe = payload as { output_text?: unknown; output?: unknown };
  if (typeof maybe.output_text === "string" && maybe.output_text.trim()) {
    return maybe.output_text;
  }

  if (!Array.isArray(maybe.output)) return null;
  for (const item of maybe.output) {
    if (!item || typeof item !== "object") continue;
    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (!part || typeof part !== "object") continue;
      const text = (part as { text?: unknown }).text;
      if (typeof text === "string" && text.trim()) return text;
    }
  }
  return null;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const image = formData.get("image");

  if (!(image instanceof File)) {
    return NextResponse.json({ error: "Thiếu file ảnh." }, { status: 400 });
  }

  if (!image.type.startsWith("image/")) {
    return NextResponse.json({ error: "File phải là ảnh." }, { status: 400 });
  }

  if (image.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: "Ảnh tối đa 8 MB trong MVP." }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(mockResult());
  }

  const bytes = Buffer.from(await image.arrayBuffer());
  const dataUrl = `data:${image.type};base64,${bytes.toString("base64")}`;
  const model = process.env.OPENAI_MODEL || "gpt-5.6-luna";

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: STELLA_ROUTER_PROMPT },
            { type: "input_image", image_url: dataUrl, detail: "high" },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "stella_simulation_router",
          description: "Kết quả nhận diện hình Vật lý và lựa chọn simulation phù hợp.",
          strict: true,
          schema: analysisSchema,
        },
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("OpenAI error", response.status, detail);
    return NextResponse.json(
      { error: "Không thể phân tích ảnh bằng AI. Kiểm tra API key/model rồi thử lại." },
      { status: 502 },
    );
  }

  const payload: unknown = await response.json();
  const outputText = extractOutputText(payload);
  if (!outputText) {
    return NextResponse.json({ error: "AI không trả về structured output hợp lệ." }, { status: 502 });
  }

  try {
    const parsed = JSON.parse(outputText) as Omit<SimulationAnalysis, "source">;
    const result: SimulationAnalysis = { ...parsed, source: "openai" };
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Không đọc được JSON từ AI." }, { status: 502 });
  }
}
