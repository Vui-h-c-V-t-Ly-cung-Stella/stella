# STELLA

Prototype TypeScript/Next.js cho flow:

1. Học sinh tải/chụp ảnh minh họa trong SGK.
2. Stella Vision phân tích ảnh.
3. AI trả về `simulationId` theo schema cố định.
4. Simulation Router chọn component phù hợp.
5. Mô phỏng nhận các tham số ban đầu từ AI.

Trong giai đoạn MVP, trang đầu cũng có bộ chọn thủ công để mở trực tiếp một trong bốn mô phỏng mà không phụ thuộc API hoặc mock mode.

Hiện MVP implement `convex_lens` (thấu kính hội tụ), `linear_motion` (chuyển động thẳng + đồ thị s-t), `force_friction` (lực kéo, ma sát + đồ thị v-t), `electric_circuit` (mạch điện nối tiếp/song song) và fallback `unknown`.

## Chạy nhanh

```bash
npm install
cp .env.example .env.local
npm run dev
```

Mở http://localhost:3000

### Không có API key

Để `OPENAI_API_KEY` trống. App sẽ chạy **mock mode**. Dùng `STELLA_MOCK_SIMULATION=linear_motion`, `force_friction` hoặc `electric_circuit` để chọn mô phỏng; mặc định là thấu kính hội tụ.

### Có OpenAI API key

Điền:

```env
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5.6-luna
```

API key chỉ được đọc trong server route `app/api/analyze/route.ts`, không gửi xuống browser.

## Cấu trúc chính

```text
app/
  api/analyze/route.ts       # AI vision -> structured routing result
  page.tsx                   # upload + result + router
components/
  ConvexLensSimulation.tsx   # mô phỏng chạy thật
  ElectricCircuitSimulation.tsx # mạch điện nối tiếp/song song
  ForceFrictionSimulation.tsx # lực kéo, ma sát + đồ thị v-t
  LinearMotionSimulation.tsx # xe chạy + đồ thị s-t trực tiếp
  SimulationRenderer.tsx     # chọn component theo simulationId
lib/
  circuit.ts                 # định luật Ohm cho hai kiểu mạch
  dynamics.ts                # hợp lực, ma sát và gia tốc
  physics.ts                 # công thức thấu kính
  stellaPrompt.ts            # prompt điều phối AI
types/
  simulation.ts              # types dùng chung
```

## Ý tưởng mở rộng

Thêm simulation mới theo pattern:

1. Thêm ID vào `SimulationId`.
2. Tạo component simulation.
3. Thêm case trong `SimulationRenderer.tsx`.
4. Thêm ID vào JSON schema của AI route.

AI không tự viết physics engine. Nó chỉ nhận diện và điều phối tới simulation đã được kiểm chứng.
