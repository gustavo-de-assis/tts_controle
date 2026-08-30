import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "./components/sidebar";
import { BottomNav } from "./components/bottom-nav";
import { auth } from "../src/auth";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Controle de Estoque Tetelestyle",
  description: "Sistema de Controle de Estoque e Vendas",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await auth();

  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="h-screen w-screen flex flex-col md:flex-row bg-background text-foreground overflow-hidden">
        <Sidebar user={session?.user} />
        <div className="flex-1 flex flex-col h-screen max-h-screen overflow-hidden relative">
          {children}
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
