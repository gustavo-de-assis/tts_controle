"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  BarChart3, 
  Settings,
  HelpCircle
} from "lucide-react";
import { signOut } from "next-auth/react";

interface SidebarProps {
  user?: { name?: string | null; email?: string | null; role?: string };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  if (pathname === "/login") return null;

  const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Produtos", href: "/produtos", icon: Package },
    { name: "Vendas", href: "/vendas", icon: ShoppingCart },
    { name: "Relatórios", href: "/relatorios", icon: BarChart3 },
  ];

  const bottomItems = [
    { name: "Configurações", href: "/configuracoes", icon: Settings },
    { name: "Ajuda", href: "/ajuda", icon: HelpCircle },
  ];

  return (
    <aside className="w-64 border-r border-border bg-sidebar h-screen flex flex-col sticky top-0 shrink-0">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="bg-primary text-primary-foreground p-1.5 rounded-md font-bold text-xl leading-none">
            S
          </div>
          <span className="font-semibold text-lg tracking-tight">StockApp</span>
        </div>
      </div>

      <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
          Menu Principal
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive 
                  ? "bg-accent text-accent-foreground shadow-sm" 
                  : "text-foreground hover:bg-muted"
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}

        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-8 mb-2 px-2">
          Suporte
        </div>
        {bottomItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive 
                  ? "bg-accent text-accent-foreground shadow-sm" 
                  : "text-foreground hover:bg-muted"
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
            US
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium leading-none mb-1">{user?.name ?? "Usuário"}</span>
            <span className="text-xs text-muted-foreground">{user?.email ?? ""}</span>
          </div>
        </div>
        <button type="button" onClick={() => signOut({ callbackUrl: "/login" })} className="mt-3 w-full rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted">
          Sair
        </button>
      </div>
    </aside>
  );
}
