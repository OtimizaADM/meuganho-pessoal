import { ArrowDownRight, ArrowUpRight, Plus, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBRL, recurring } from "@/lib/finance-data";

export default function Recorrentes() {
  const inc = recurring.filter((r) => r.type === "income").reduce((s, r) => s + r.amount, 0);
  const exp = recurring.filter((r) => r.type === "expense").reduce((s, r) => s + r.amount, 0);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl lg:text-3xl font-semibold tracking-tight">Lançamentos recorrentes</h2>
          <p className="text-[13px] text-muted-foreground mt-1">Configure receitas e despesas que se repetem todo mês</p>
        </div>
        <Button className="rounded-full h-10 px-5 text-[13px] font-medium shadow-sm">
          <Plus className="h-4 w-4 mr-1.5" strokeWidth={2} /> Novo recorrente
        </Button>
      </header>

      <section className="grid sm:grid-cols-3 gap-4">
        <div className="card-premium p-6">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Entradas/mês</p>
          <p className="font-display text-[32px] font-semibold text-income mt-2 tabular tracking-tight">+ {formatBRL(inc)}</p>
        </div>
        <div className="card-premium p-6">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Saídas/mês</p>
          <p className="font-display text-[32px] font-semibold text-expense mt-2 tabular tracking-tight">− {formatBRL(exp)}</p>
        </div>
        <div className="rounded-2xl bg-gradient-card text-white p-6 shadow-elegant">
          <p className="text-[11px] uppercase tracking-wider text-white/70 font-medium">Sobra projetada</p>
          <p className="font-display text-[32px] font-bold mt-2 tabular tracking-tight text-white">{formatBRL(inc - exp)}</p>
          <p className="text-[12px] text-white/70 mt-1">com base nos recorrentes</p>
        </div>
      </section>

      <div className="card-premium overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
            <tr>
              <th className="text-left px-5 py-3">Lançamento</th>
              <th className="text-left px-5 py-3 hidden md:table-cell">Categoria</th>
              <th className="text-left px-5 py-3">Dia</th>
              <th className="text-right px-5 py-3">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/70">
            {recurring.map((r) => (
              <tr key={r.id} className="hover:bg-muted/40 transition-colors group">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full grid place-items-center transition-transform group-hover:scale-105 ${r.type === "income" ? "bg-income/10 text-income" : "bg-expense/10 text-expense"}`}>
                      {r.type === "income" ? <ArrowUpRight className="h-4 w-4" strokeWidth={2} /> : <ArrowDownRight className="h-4 w-4" strokeWidth={2} />}
                    </div>
                    <div>
                      <p className="font-medium text-[14px]">{r.name}</p>
                      <p className="text-[11.5px] text-muted-foreground inline-flex items-center gap-1 mt-0.5">
                        <Repeat className="h-3 w-3" strokeWidth={1.75} /> Mensal
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 hidden md:table-cell">
                  <span className="text-[11px] px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-medium">{r.category}</span>
                </td>
                <td className="px-5 py-4 text-[13px]">Todo dia <strong className="font-medium tabular">{r.day}</strong></td>
                <td className={`px-5 py-4 text-right font-display font-semibold tabular text-[14px] ${r.type === "income" ? "text-income" : ""}`}>
                  {r.type === "income" ? "+" : "−"} {formatBRL(r.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
