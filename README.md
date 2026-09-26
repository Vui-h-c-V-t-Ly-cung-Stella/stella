# Vui học Vật lý cùng Stella — MVP

Prototype TypeScript/Next.js cho flow:

1. Học sinh tải/chụp ảnh minh họa trong SGK.
2. Stella Vision phân tích ảnh.
3. AI trả về `simulationId` theo schema cố định.
4. Simulation Router chọn component phù hợp.
5. Mô phỏng nhận các tham số ban đầu từ AI.

Hiện MVP chỉ implement simulation `convex_lens` (thấu kính hội tụ) + fallback `unknown`.

## Chạy nhanh

```bash
npm install
cp .env.example .env.local
npm run dev
```

Mở http://localhost:3000

### Không có API key

Để `OPENAI_API_KEY` trống. App sẽ chạy **mock mode** và route ảnh sang mô phỏng thấu kính hội tụ để bạn test toàn bộ UI/flow.

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
  SimulationRenderer.tsx     # chọn component theo simulationId
lib/
  physics.ts                 # công thức thấu kính
  simulationRegistry.ts      # danh sách simulation được phép
  stellaPrompt.ts            # prompt điều phối AI
types/
  simulation.ts              # types dùng chung
```

## Ý tưởng mở rộng

Thêm simulation mới theo pattern:

1. Thêm ID vào `SimulationId`.
2. Đăng ký trong `simulationRegistry.ts`.
3. Tạo component simulation.
4. Thêm case trong `SimulationRenderer.tsx`.
5. Thêm ID vào JSON schema của AI route.

AI không tự viết physics engine. Nó chỉ nhận diện và điều phối tới simulation đã được kiểm chứng.
