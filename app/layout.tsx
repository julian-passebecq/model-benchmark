import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Benchmark Observatory",
  description: "Interactive model, data stack, cloud, hardware and infrastructure benchmark dashboards."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="fluent">
      <body>{children}</body>
    </html>
  );
}
