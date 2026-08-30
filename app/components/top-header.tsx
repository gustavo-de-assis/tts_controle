import React from "react";
import { Search, Bell } from "lucide-react";

export function TopHeader() {
  return (
    <header className="bg-card border-b border-border h-16 flex items-center justify-between px-4 md:px-8 shrink-0">
      {/* Mobile Logo */}
      <div className="flex md:hidden items-center gap-2.5">
        <div className="bg-primary text-primary-foreground p-1.5 rounded-md font-bold text-lg leading-none">
          S
        </div>
        <span className="font-semibold text-base tracking-tight text-foreground">StockApp</span>
      </div>

      {/* Desktop Search Input */}
      <div className="hidden md:block flex-1 max-w-2xl">
        <div className="relative w-full max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-border rounded-full leading-5 bg-muted/50 text-foreground placeholder-muted-foreground focus:outline-none focus:bg-card focus:ring-2 focus:ring-accent focus:border-accent sm:text-sm transition-colors"
            placeholder="Pesquisar em todo o sistema..."
          />
        </div>
      </div>

      {/* Mobile & Desktop Actions */}
      <div className="flex items-center gap-2 md:gap-4 ml-auto">
        <button
          type="button"
          aria-label="Buscar"
          className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted"
        >
          <Search className="w-5 h-5" />
        </button>

        <button
          type="button"
          aria-label="Notificações"
          className="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#f97316] text-[10px] font-bold text-white ring-2 ring-card">
            2
          </span>
        </button>

        <div className="h-8 w-px bg-border mx-1 md:mx-2" />

        <div className="flex items-center gap-2 md:gap-3 cursor-pointer">
          <div className="text-right hidden md:block">
            <div className="text-sm font-semibold text-foreground leading-tight">Admin</div>
            <div className="text-xs text-muted-foreground">Loja Principal</div>
          </div>
          <div className="h-8 w-8 md:h-9 md:w-9 rounded-full bg-gradient-to-tr from-[#f97316] to-amber-400 flex items-center justify-center text-white font-bold text-xs md:text-sm shadow-sm">
            AD
          </div>
        </div>
      </div>
    </header>
  );
}
