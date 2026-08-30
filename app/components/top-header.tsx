import React from "react";
import { Search, Bell } from "lucide-react";

export function TopHeader() {
  return (
    <header className="bg-card border-b border-border h-16 flex items-center justify-between px-8 shrink-0">
      <div className="flex-1 max-w-2xl">
        <div className="relative w-full max-w-md hidden md:block">
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

      <div className="flex items-center gap-4">
        <button
          type="button"
          className="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-accent ring-2 ring-card" />
        </button>

        <div className="h-8 w-px bg-border mx-2" />

        <div className="flex items-center gap-3 cursor-pointer">
          <div className="text-right hidden md:block">
            <div className="text-sm font-semibold text-foreground leading-tight">Admin</div>
            <div className="text-xs text-muted-foreground">Loja Principal</div>
          </div>
          <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-accent to-orange-300 flex items-center justify-center text-white font-bold shadow-sm">
            AD
          </div>
        </div>
      </div>
    </header>
  );
}
