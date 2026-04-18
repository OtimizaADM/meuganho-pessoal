import { ArrowDownRight, CheckCircle2, Clock, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { categoryColors, expenses, formatBRL } from "@/lib/finance-data";

export default function Despesas() {
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const paid = expenses.filter((e) => e.paid).reduce((s, e) => s + e.amount, 0);
  const open = total - paid;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl lg:text-3xl font-semibold tracking-tight">Despesas</h2>
          <p className="text-[13px] text-muted-foreground mt-1">Controle todos os seus gastos</p>
        </div>
        <Button className="rounded-full h-10 px-5 text-[13px] font-medium shadow-sm">
          <Plus className="h-4 w-4 mr-1.5" strokeWidth={2} /> Nova despesa
        </Button>
      </header>

      <section className="grid sm:grid-cols-3 gap-4">
        <div className="card-premium p-6">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Total</p>
          <p className="font-display text-[32px] font-semibold mt-2 tabular tracking-tight">{formatBRL(total)}</p>
          <p className="text-[12px] text-muted-foreground mt-2">{expenses.length} lançamentos</p>
        </div>
        <div className="card-premium p-6">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="h-3 w-3 text-income" strokeWidth={2} /> Pago
          </p>
          <p className="font-display text-[32px] font-semibold text-income mt-2 tabular tracking-tight">{formatBRL(paid)}</p>
          <div className="h-1 bg-muted rounded-full overflow-hidden mt-3">
            <div className="h-full bg-income transition-all duration-500" style={{ width: `${(paid / total) * 100}%` }} />
          </div>
        </div>
        <div className="card-premium p-6">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1.5 font-medium">
            <Clock className="h-3 w-3 text-warning" strokeWidth={2} /> Em aberto
          </p>
          <p className="font-display text-[32px] font-semibold text-warning mt-2 tabular tracking-tight">{formatBRL(open)}</p>
          <p className="text-[12px] text-muted-foreground mt-2">{expenses.filter((e) => !e.paid).length} a pagar</p>
        </div>
      </section>

      <div className="card-premium overflow-hidden">
        <div className="p-4 border-b border-border flex flex-wrap items-center gap-3">
          <div className="flex-1 flex items-center gap-2 px-3.5 h-10 rounded-full bg-muted min-w-[200px]">
            <Search className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
            <input placeholder="Buscar..." className="flex-1 bg-transparent outline-none text-[13px]" />
          </div>
          <div className="flex gap-1.5">
            <Chip label="Todas" active />
            <Chip label="Pagas" />
            <Chip label="Pendentes" />
          </div>
        </div>
        <ul className="divide-y divide-border/70">
          {expenses.map((e) => (
            <li key={e.id} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/40 transition-colors group">
              <div
                className="w-10 h-10 rounded-full grid place-items-center transition-transform group-hover:scale-105"
                style={{ background: `${categoryColors[e.category] ?? "hsl(var(--primary))"}1a`, color: categoryColors[e.category] }}
              >
                <ArrowDownRight className="h-4 w-4" strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate text-[14px]">{e.description}</p>
                  {e.paid ? (
                    <span className="text-[10px] uppercase tracking-wider text-income bg-income/10 px-2 py-0.5 rounded-full font-medium">Pago</span>
                  ) : (
                    <span className="text-[10px] uppercase tracking-wider text-warning bg-warning/10 px-2 py-0.5 rounded-full font-medium">Pendente</span>
                  )}
                </div>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  {e.category} · {new Date(e.date).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <span className="font-display font-semibold tabular text-[14px]">− {formatBRL(e.amount)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Chip({ label, active }: { label: string; active?: boolean }) {
  return (
    <button
      className={`px-3.5 h-9 rounded-full text-[12px] font-medium transition-all ${
        active ? "bg-foreground text-background" : "bg-muted hover:bg-muted/70 text-muted-foreground"
      }`}
    >
      {label}
    </button>
  );
}
