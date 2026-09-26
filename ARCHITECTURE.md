# Kiến trúc MVP

```text
Browser
  |
  | multipart/form-data: image
  v
POST /api/analyze
  |
  +-- Không có OPENAI_API_KEY --> mock structured result
  |
  +-- Có OPENAI_API_KEY ------> OpenAI Responses API (vision)
                                  |
                                  v
                           JSON Schema output
                                  |
                                  v
                         simulationId + params
                                  |
                                  v
                      <SimulationRenderer />
                                  |
              +---------------+---------------+
              |               |               |
       convex_lens      linear_motion       unknown
              |               |
              v               v
 <ConvexLensSimulation />  <LinearMotionSimulation />
```

## Vì sao AI không generate code simulation?

- Tránh sai định luật Vật lý.
- Dễ test và kiểm chứng.
- Kết quả ổn định hơn khi demo.
- Có thể version từng simulation độc lập.
- AI làm đúng vai trò: nhận diện + điều phối + khởi tạo trạng thái.

## Contract giữa AI và frontend

AI chỉ trả JSON có schema cố định. Ví dụ:

```json
{
  "recognized": true,
  "subject": "physics",
  "grade": 9,
  "topic": "Quang học",
  "concept": "Thấu kính hội tụ",
  "simulationId": "convex_lens",
  "confidence": 0.96,
  "reason": "Hình có thấu kính hội tụ, trục chính, tiêu điểm và tia ló hội tụ.",
  "parameters": {
    "focalLengthCm": 8,
    "objectDistanceCm": 22,
    "showRays": true,
    "showFocalPoints": true
  }
}
```
