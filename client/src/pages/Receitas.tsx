import { ArrowUpRight, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBRL, incomes } from "@/lib/finance-data";

export default function Receitas() {
  const total = incomes.reduce((s, i) => s + i.amount, 0);
  const byCat = incomes.reduce<Record<string, number>>((acc, i) => {
    acc[i.category] = (acc[i.category] ?? 0) + i.amount;
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl lg:text-3xl font-semibold tracking-tight">Receitas</h2>
          <p className="text-[13px] text-muted-foreground mt-1">Tudo que entrou em abril de 2025</p>
        </div>
        <Button className="rounded-full h-10 px-5 text-[13px] font-medium shadow-sm">
          <Plus className="h-4 w-4 mr-1.5" strokeWidth={2} /> Nova receita
        </Button>
      </header>

      <section className="grid sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-gradient-card text-white p-6 shadow-elegant">
          <p className="text-[11px] uppercase tracking-wider text-white/70 font-medium">Total no mês</p>
          <p className="font-display text-[32px] font-bold mt-2 tracking-tight tabular text-white">{formatBRL(total)}</p>
          <p className="text-[12px] text-white/70 mt-2 inline-flex items-center gap-1">
            <ArrowUpRight className="h-3 w-3" strokeWidth={2} /> +12.3% vs março
          </p>
        </div>
        {Object.entries(byCat).slice(0, 2).map(([cat, val]) => (
          <div key={cat} className="card-premium p-6">
            <p className="text-[11px] uppercase text-muted-foreground tracking-wider font-medium">{cat}</p>
            <p className="font-display text-[28px] font-semibold mt-2 tabular tracking-tight">{formatBRL(val)}</p>
            <div className="h-1 bg-muted rounded-full overflow-hidden mt-3">
              <div className="h-full bg-income transition-all duration-500" style={{ width: `${(val / total) * 100}%` }} />
            </div>
          </div>
        ))}
      </section>

      <div className="card-premium overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2 px-3.5 h-10 rounded-full bg-muted">
            <Search className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
            <input placeholder="Buscar por descrição..." className="flex-1 bg-transparent outline-none text-[13px]" />
          </div>
          <select className="h-10 px-4 rounded-full bg-muted text-[13px] outline-none border-none">
            <option>Todas categorias</option>
            <option>Salário</option>
            <option>Freelance</option>
            <option>Investimentos</option>
          </select>
        </div>
        <ul className="divide-y divide-border/70">
          {incomes.map((i) => (
            <li key={i.id} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/40 transition-colors group">
              <div className="w-10 h-10 rounded-full bg-income/10 text-income grid place-items-center transition-transform group-hover:scale-105">
                <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate text-[14px]">{i.description}</p>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  {i.category} · {new Date(i.date).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <span className="font-display font-semibold text-income tabular text-[14px]">+ {formatBRL(i.amount)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
