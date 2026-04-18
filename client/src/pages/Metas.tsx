import { Plus, Target as TargetIcon, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBRL, goals } from "@/lib/finance-data";

export default function Metas() {
  const total = goals.reduce((s, g) => s + g.target, 0);
  const saved = goals.reduce((s, g) => s + g.current, 0);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl lg:text-3xl font-semibold tracking-tight">Metas financeiras</h2>
          <p className="text-[13px] text-muted-foreground mt-1">Visualize seus objetivos e o quanto falta</p>
        </div>
        <Button className="rounded-full h-10 px-5 text-[13px] font-medium shadow-sm">
          <Plus className="h-4 w-4 mr-1.5" strokeWidth={2} /> Nova meta
        </Button>
      </header>

      <section className="rounded-3xl bg-gradient-card text-white p-7 lg:p-9 shadow-elegant overflow-hidden relative">
        <div className="relative grid md:grid-cols-3 gap-8 items-center">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-white/70 font-medium">Progresso geral</p>
            <p className="font-display text-5xl font-bold mt-2 tabular tracking-tighter text-white">{Math.round((saved / total) * 100)}%</p>
            <p className="text-[13px] text-white/70 mt-2 tabular">{formatBRL(saved)} de {formatBRL(total)}</p>
          </div>
          <div className="md:col-span-2">
            <div className="h-2 bg-white/15 rounded-full overflow-hidden">
              <div className="h-full bg-white transition-all duration-700" style={{ width: `${(saved / total) * 100}%` }} />
            </div>
            <div className="flex justify-between text-[12px] text-white/70 mt-2.5">
              <span>Início</span>
              <span className="tabular">Faltam {formatBRL(total - saved)}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {goals.map((g) => {
          const pct = Math.round((g.current / g.target) * 100);
          const months = Math.max(1, Math.round((new Date(g.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)));
          const monthly = (g.target - g.current) / months;
          return (
            <div key={g.id} className="card-premium p-6 group">
              <div className="flex items-center justify-between">
                <div className="text-3xl">{g.icon}</div>
                <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-primary-soft text-primary tabular">{pct}%</span>
              </div>
              <h3 className="font-display font-semibold text-[16px] mt-4 tracking-tight">{g.title}</h3>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                Prazo: {new Date(g.deadline).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
              </p>

              <div className="mt-5">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Atual</p>
                    <p className="font-display font-semibold text-[20px] mt-0.5 tabular tracking-tight">{formatBRL(g.current)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Meta</p>
                    <p className="font-medium mt-0.5 tabular text-[14px]">{formatBRL(g.target)}</p>
                  </div>
                </div>
                <div className="h-1 bg-muted rounded-full overflow-hidden mt-3">
                  <div className="h-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-4 flex items-center gap-2 text-[12px] text-muted-foreground">
                  <TrendingUp className="h-3.5 w-3.5 text-income" strokeWidth={2} />
                  Guarde <strong className="text-foreground font-medium tabular">{formatBRL(monthly)}</strong>/mês
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-5 rounded-full text-[12px] h-9">
                <TargetIcon className="h-3.5 w-3.5 mr-1.5" strokeWidth={1.75} /> Aportar
              </Button>
            </div>
          );
        })}
      </section>
    </div>
  );
}
