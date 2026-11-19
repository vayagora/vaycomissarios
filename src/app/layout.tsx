import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Vay Agora · Portal do Comissário", template: "%s · Vay Agora" },
  description: "Portal do comissário da Vay Agora.",
};

export const viewport: Viewport = { themeColor: "#715BCA" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
