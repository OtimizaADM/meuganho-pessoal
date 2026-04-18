import { CalendarClock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBRL, installments } from "@/lib/finance-data";

export default function Parcelamentos() {
  const total = installments.reduce((s, i) => s + i.total, 0);
  const paid = installments.reduce((s, i) => s + (i.total / i.installments) * i.paid, 0);
  const remaining = total - paid;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl lg:text-3xl font-semibold tracking-tight">Parcelamentos</h2>
          <p className="text-[13px] text-muted-foreground mt-1">Acompanhe todas as compras divididas</p>
        </div>
        <Button className="rounded-full h-10 px-5 text-[13px] font-medium shadow-sm">
          <Plus className="h-4 w-4 mr-1.5" strokeWidth={2} /> Novo parcelamento
        </Button>
      </header>

      <section className="grid sm:grid-cols-3 gap-4">
        <Stat title="Total parcelado" value={total} />
        <Stat title="Já pago" value={paid} positive />
        <Stat title="Restante" value={remaining} accent />
      </section>

      <section className="grid md:grid-cols-2 gap-5">
        {installments.map((i) => {
          const pct = (i.paid / i.installments) * 100;
          const monthly = i.total / i.installments;
          return (
            <div key={i.id} className="card-premium p-6 group">
              <div className="flex items-start justify-between">
                <div className="w-11 h-11 rounded-full bg-primary-soft text-primary grid place-items-center transition-transform group-hover:scale-105">
                  <CalendarClock className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground">{i.card}</span>
              </div>
              <h3 className="font-display font-semibold text-[16px] mt-5 tracking-tight">{i.description}</h3>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                Início em {new Date(i.startDate).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
              </p>

              <div className="flex justify-between items-end mt-5">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Parcela mensal</p>
                  <p className="font-display font-semibold text-[22px] mt-0.5 tabular tracking-tight">{formatBRL(monthly)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Total</p>
                  <p className="font-medium mt-0.5 tabular text-[14px]">{formatBRL(i.total)}</p>
                </div>
              </div>

              <div className="mt-5">
                <div className="flex justify-between text-[11.5px] text-muted-foreground mb-1.5 tabular">
                  <span>{i.paid} de {i.installments} parcelas</span>
                  <span>{Math.round(pct)}%</span>
                </div>
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}

function Stat({ title, value, positive, accent }: { title: string; value: number; positive?: boolean; accent?: boolean }) {
  return (
    <div className="card-premium p-6">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{title}</p>
      <p className={`font-display text-[32px] font-semibold mt-2 tabular tracking-tight ${positive ? "text-income" : accent ? "text-installment" : ""}`}>
        {formatBRL(value)}
      </p>
    </div>
  );
}
