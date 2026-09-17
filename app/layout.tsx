import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Protocolo Coceira | Área do aluno", description: "Seu espaço de cuidado canino" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="pt-BR"><body>{children}</body></html>; }
