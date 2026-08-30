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
      <body className="min-h-full flex flex-col md:flex-row bg-background text-foreground">
        <Sidebar user={session?.user} />
        <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
          {children}
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
