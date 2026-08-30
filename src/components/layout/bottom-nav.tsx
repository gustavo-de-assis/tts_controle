"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  BarChart3, 
  Settings 
} from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();

  if (pathname === "/login") return null;

  const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Produtos", href: "/produtos", icon: Package },
    { name: "Vendas", href: "/vendas", icon: ShoppingCart },
    { name: "Relatórios", href: "/relatorios", icon: BarChart3 },
    { name: "Configurações", href: "/configuracoes", icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 w-full md:hidden bg-[#131b2e] border-t border-slate-800 flex items-center justify-around py-2 px-1">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`relative flex flex-col items-center justify-center gap-1 flex-1 py-1 text-[11px] font-medium transition-colors ${
              isActive 
                ? "text-[#f97316]" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {isActive && (
              <span className="absolute -top-2 h-0.5 w-8 bg-[#f97316] rounded-full" />
            )}
            <Icon className="w-5 h-5" />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
