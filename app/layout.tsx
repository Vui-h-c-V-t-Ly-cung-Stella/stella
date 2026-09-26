import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vui học Vật lý cùng Stella",
  description: "MVP điều phối mô phỏng Vật lý bằng AI",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
