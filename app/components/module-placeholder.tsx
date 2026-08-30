import { Construction } from "lucide-react";

interface ModulePlaceholderProps {
  title: string;
}

export function ModulePlaceholder({ title }: ModulePlaceholderProps) {
  return (
    <main className="flex-1 overflow-y-auto bg-background p-4 md:p-8 pb-20 md:pb-6">
      <div className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center">
        <section className="w-full max-w-lg rounded-xl border border-border bg-card p-10 text-center shadow-sm">
          <Construction className="mx-auto mb-4 h-10 w-10 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          <p className="mt-3 text-muted-foreground">Módulo em Breve</p>
        </section>
      </div>
    </main>
  );
}
