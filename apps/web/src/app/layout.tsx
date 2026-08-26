import type { Metadata } from "next";
import { QueryProvider } from "@/providers/query-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Securia360",
  description: "Gestión empresarial del SG-SST",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body><QueryProvider>{children}</QueryProvider></body>
    </html>
  );
}
