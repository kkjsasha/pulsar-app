import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pulsar. — O ecossistema que seu servidor merecia",
  description: "Vendas automáticas, tickets, analytics, automações e backup para servidores Discord. Seu bot, seu branding.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
