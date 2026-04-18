import { CreditCard as CardIcon, Plus, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { creditCards, formatBRL, installments } from "@/lib/finance-data";

export default function Cartao() {
  const totalLimit = creditCards.reduce((s, c) => s + c.limit, 0);
  const totalUsed = creditCards.reduce((s, c) => s + c.used, 0);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl lg:text-3xl font-semibold tracking-tight">Cartões de crédito</h2>
          <p className="text-[13px] text-muted-foreground mt-1">Gerencie limites, faturas e gastos</p>
        </div>
        <Button className="rounded-full h-10 px-5 text-[13px] font-medium shadow-sm">
          <Plus className="h-4 w-4 mr-1.5" strokeWidth={2} /> Adicionar cartão
        </Button>
      </header>

      <section className="grid sm:grid-cols-3 gap-4">
        <Stat title="Limite total" value={totalLimit} />
        <Stat title="Utilizado" value={totalUsed} accent />
        <Stat title="Disponível" value={totalLimit - totalUsed} positive />
      </section>

      <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {creditCards.map((c) => {
          const pct = (c.used / c.limit) * 100;
          return (
            <div
              key={c.id}
              className="relative rounded-2xl p-5 text-white overflow-hidden bg-gradient-card aspect-[1.6/1] flex flex-col justify-between shadow-elegant hover:scale-[1.02] transition-transform duration-300"
            >
              <div className="flex items-start justify-between relative">
                <div>
                  <p className="text-[10px] text-white/60 uppercase tracking-widest font-medium">{c.brand}</p>
                  <p className="font-display font-semibold mt-1 tracking-tight text-white">{c.name}</p>
                </div>
                <Wifi className="h-5 w-5 rotate-90 text-white/50" strokeWidth={1.75} />
              </div>
              <div className="relative">
                <p className="font-mono tracking-[0.3em] text-[13px] text-white/80">•••• •••• •••• {c.lastDigits}</p>
                <div className="flex justify-between items-end mt-3 text-xs">
                  <div>
                    <p className="text-white/60 text-[10px] uppercase tracking-wider">Vence dia</p>
                    <p className="font-bold text-[13px] mt-0.5 tabular text-white">{c.dueDay}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/60 text-[10px] uppercase tracking-wider">Fatura</p>
                    <p className="font-bold text-[13px] mt-0.5 tabular text-white">{formatBRL(c.used)}</p>
                  </div>
                </div>
                <div className="h-0.5 mt-3 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white" style={{ width: `${pct}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <section className="card-premium p-6 lg:p-7">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-semibold text-[17px] tracking-tight">Compras parceladas no cartão</h3>
          <span className="text-[12px] text-muted-foreground">{installments.length} ativas</span>
        </div>
        <ul className="divide-y divide-border/70">
          {installments.map((i) => {
            const pct = (i.paid / i.installments) * 100;
            return (
              <li key={i.id} className="py-4 flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-full bg-installment/10 text-installment grid place-items-center transition-transform group-hover:scale-105">
                  <CardIcon className="h-4 w-4" strokeWidth={1.75} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-3">
                    <p className="font-medium truncate text-[14px]">{i.description}</p>
                    <span className="font-display font-semibold tabular text-[14px]">{formatBRL(i.total)}</span>
                  </div>
                  <p className="text-[12px] text-muted-foreground mt-0.5">
                    {i.card} · {i.paid}/{i.installments} parcelas pagas
                  </p>
                  <div className="h-1 bg-muted rounded-full overflow-hidden mt-2">
                    <div className="h-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function Stat({ title, value, positive, accent }: { title: string; value: number; positive?: boolean; accent?: boolean }) {
  return (
    <div className="card-premium p-6">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{title}</p>
      <p className={`font-display text-[32px] font-semibold mt-2 tabular tracking-tight ${positive ? "text-income" : accent ? "text-primary" : ""}`}>
        {formatBRL(value)}
      </p>
    </div>
  );
}
