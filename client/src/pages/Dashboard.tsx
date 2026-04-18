import { useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  CreditCard,
  PiggyBank,
  Eye,
  EyeOff,
  Plus,
  ArrowRight,
  AlertCircle,
  ArrowLeftRight,
  Send,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import {
  categoryColors,
  creditCards,
  evolution,
  expenses,
  formatBRL,
  goals,
  incomes,
  installments,
  summary,
} from "@/lib/finance-data";
import { Link } from "react-router-dom";

const expenseByCat = Object.entries(
  expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount;
    return acc;
  }, {})
).map(([name, value]) => ({ name, value }));

export default function Dashboard() {
  const [hidden, setHidden] = useState(false);

  return (
    <div className="space-y-8">
      {/* Hero — saldo principal, flat com depth via shadow */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-card text-white p-8 lg:p-10 shadow-elegant">
        <div className="relative grid lg:grid-cols-[1.2fr,1fr] gap-10 items-center">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-white/70 font-medium">Saldo total</p>
            <div className="flex items-end gap-3 mt-3">
              <h2 className="font-display text-5xl lg:text-6xl font-bold tracking-tighter tabular text-white">
                {hidden ? "••••••" : formatBRL(summary.balance)}
              </h2>
              <button onClick={() => setHidden((s) => !s)} className="mb-3 text-white/60 hover:text-white transition-colors">
                {hidden ? <EyeOff className="h-5 w-5" strokeWidth={1.75} /> : <Eye className="h-5 w-5" strokeWidth={1.75} />}
              </button>
            </div>
            <p className="mt-2 text-[13px] text-white/60">Atualizado agora · abril 2025</p>

            <div className="mt-7 flex flex-wrap gap-2">
              <button className="inline-flex items-center gap-2 px-4 h-10 rounded-full bg-white text-primary-deep text-[13px] font-semibold hover:bg-white/90 transition shadow-sm">
                <Plus className="h-4 w-4" strokeWidth={2.25} /> Nova transação
              </button>
              <button className="inline-flex items-center gap-2 px-4 h-10 rounded-full bg-white/10 text-white text-[13px] font-medium hover:bg-white/15 transition border border-white/20">
                <ArrowLeftRight className="h-4 w-4" strokeWidth={1.75} /> Transferir
              </button>
              <button className="inline-flex items-center gap-2 px-4 h-10 rounded-full bg-white/10 text-white text-[13px] font-medium hover:bg-white/15 transition border border-white/20">
                <Send className="h-4 w-4" strokeWidth={1.75} /> Pagar
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <MiniStat label="Receitas" value={summary.income} icon={ArrowUpRight} positive />
            <MiniStat label="Despesas" value={summary.expense} icon={ArrowDownRight} />
            <MiniStat label="Cartões" value={summary.cardsTotal} icon={CreditCard} />
            <MiniStat label="Investido" value={summary.invested} icon={PiggyBank} positive />
          </div>
        </div>
      </section>

      {/* Stats — cards limpos */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Receitas do mês" value={summary.income} delta="+12.3%" deltaPositive icon={ArrowUpRight} />
        <StatCard title="Despesas do mês" value={summary.expense} delta="-4.2%" deltaPositive icon={ArrowDownRight} />
        <StatCard title="Fatura cartões" value={summary.cardsTotal} delta="3 cartões" icon={CreditCard} />
        <StatCard title="Investido" value={summary.invested} delta="+R$ 1.240" deltaPositive icon={PiggyBank} />
      </section>

      {/* Charts */}
      <section className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card-premium p-6 lg:p-7">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="font-display font-semibold text-[17px] tracking-tight">Evolução financeira</h3>
              <p className="text-[12px] text-muted-foreground mt-0.5">Últimos 6 meses</p>
            </div>
            <div className="flex gap-3 text-[12px]">
              <Legend dot="bg-income" label="Receitas" />
              <Legend dot="bg-expense" label="Despesas" />
            </div>
          </div>
          <div className="h-72 -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={evolution} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gIncome" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--income))" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="hsl(var(--income))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gExpense" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--expense))" stopOpacity={0.14} />
                    <stop offset="100%" stopColor="hsl(var(--expense))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} dy={8} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} width={36} />
                <Tooltip
                  cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 12,
                    fontSize: 12,
                    boxShadow: "var(--shadow-elegant)",
                  }}
                  formatter={(v: number) => formatBRL(v)}
                />
                <Area type="monotone" dataKey="income" stroke="hsl(var(--income))" fill="url(#gIncome)" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                <Area type="monotone" dataKey="expense" stroke="hsl(var(--expense))" fill="url(#gExpense)" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-premium p-6 lg:p-7">
          <h3 className="font-display font-semibold text-[17px] tracking-tight">Onde gastei</h3>
          <p className="text-[12px] text-muted-foreground mt-0.5">por categoria · abril</p>
          <div className="h-44 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={expenseByCat} dataKey="value" nameKey="name" innerRadius={48} outerRadius={72} paddingAngle={2} stroke="hsl(var(--card))" strokeWidth={2}>
                  {expenseByCat.map((d, i) => (
                    <Cell key={i} fill={categoryColors[d.name] ?? "hsl(var(--primary))"} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12, boxShadow: "var(--shadow-elegant)" }}
                  formatter={(v: number) => formatBRL(v)}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2.5 mt-3">
            {expenseByCat.slice(0, 5).map((c) => (
              <div key={c.name} className="flex items-center justify-between text-[13px]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: categoryColors[c.name] }} />
                  <span className="text-foreground/80">{c.name}</span>
                </div>
                <span className="font-medium tabular">{formatBRL(c.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Transações + cards + metas */}
      <section className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card-premium p-6 lg:p-7">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display font-semibold text-[17px] tracking-tight">Últimas transações</h3>
            <Link to="/despesas" className="text-[12px] text-primary inline-flex items-center gap-1 hover:gap-1.5 transition-all font-medium">
              Ver tudo <ArrowRight className="h-3 w-3" strokeWidth={2} />
            </Link>
          </div>
          <ul className="divide-y divide-border/70">
            {[...incomes.slice(0, 2).map((i) => ({ ...i, type: "in" as const })), ...expenses.slice(0, 5).map((e) => ({ ...e, type: "out" as const }))].slice(0, 6).map((t) => (
              <li key={`${t.type}-${t.id}`} className="flex items-center gap-3.5 py-3.5 group">
                <div className={`w-9 h-9 rounded-full grid place-items-center transition-transform group-hover:scale-105 ${t.type === "in" ? "bg-income/10 text-income" : "bg-expense/10 text-expense"}`}>
                  {t.type === "in" ? <ArrowUpRight className="h-4 w-4" strokeWidth={2} /> : <ArrowDownRight className="h-4 w-4" strokeWidth={2} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-medium truncate">{t.description}</p>
                  <p className="text-[11.5px] text-muted-foreground mt-0.5">
                    {t.category} · {new Date(t.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                  </p>
                </div>
                <span className={`font-display font-semibold text-[14px] tabular ${t.type === "in" ? "text-income" : "text-foreground"}`}>
                  {t.type === "in" ? "+" : "−"} {formatBRL(t.amount)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <div className="card-premium p-6 lg:p-7">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-[17px] tracking-tight">Cartões</h3>
              <Link to="/cartao" className="text-[12px] text-primary hover:underline font-medium">Gerenciar</Link>
            </div>
            <div className="space-y-4">
              {creditCards.slice(0, 2).map((c) => {
                const pct = (c.used / c.limit) * 100;
                return (
                  <div key={c.id}>
                    <div className="flex justify-between text-[13px]">
                      <span className="font-medium">{c.name}</span>
                      <span className="text-muted-foreground tabular">•••• {c.lastDigits}</span>
                    </div>
                    <div className="h-1 bg-muted rounded-full overflow-hidden mt-2">
                      <div className="h-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex justify-between text-[11.5px] text-muted-foreground mt-1.5 tabular">
                      <span>{formatBRL(c.used)}</span>
                      <span>{formatBRL(c.limit)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card-premium p-6 lg:p-7">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-[17px] tracking-tight">Metas</h3>
              <Link to="/metas" className="text-[12px] text-primary hover:underline font-medium">Ver todas</Link>
            </div>
            <div className="space-y-4">
              {goals.slice(0, 2).map((g) => {
                const pct = Math.round((g.current / g.target) * 100);
                return (
                  <div key={g.id}>
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="font-medium flex items-center gap-1.5"><span className="text-base">{g.icon}</span> {g.title}</span>
                      <span className="text-muted-foreground tabular">{pct}%</span>
                    </div>
                    <div className="h-1 bg-muted rounded-full overflow-hidden mt-2">
                      <div className="h-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-[11.5px] text-muted-foreground mt-1.5 tabular">
                      {formatBRL(g.current)} de {formatBRL(g.target)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Alerta minimal */}
      <section className="card-premium p-4 flex items-start gap-3 border-warning/25 bg-warning/[0.03]">
        <div className="w-8 h-8 rounded-full bg-warning/10 grid place-items-center text-warning shrink-0">
          <AlertCircle className="h-4 w-4" strokeWidth={2} />
        </div>
        <div className="flex-1 text-[13px]">
          <p className="font-medium">Fatura do Roxinho vence em 3 dias</p>
          <p className="text-muted-foreground text-[11.5px] mt-0.5">
            Valor atual <span className="tabular">{formatBRL(creditCards[0].used)}</span> · {installments.length} parcelamentos ativos
          </p>
        </div>
        <Button size="sm" variant="outline" className="rounded-full text-[12px] h-8">Ver detalhes</Button>
      </section>
    </div>
  );
}

function StatCard({
  title,
  value,
  delta,
  deltaPositive,
  icon: Icon,
}: {
  title: string;
  value: number;
  delta: string;
  deltaPositive?: boolean;
  icon: any;
}) {
  return (
    <div className="card-premium p-5 group">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{title}</p>
        <div className="w-8 h-8 rounded-full bg-muted grid place-items-center text-foreground/60 group-hover:bg-primary-soft group-hover:text-primary transition-colors">
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </div>
      </div>
      <p className="font-display text-[28px] font-semibold mt-3 tracking-tight tabular">{formatBRL(value)}</p>
      <p className={`text-[11.5px] mt-1 font-medium ${deltaPositive ? "text-income" : "text-muted-foreground"}`}>{delta}</p>
    </div>
  );
}

function MiniStat({ label, value, icon: Icon, positive }: { label: string; value: number; icon: any; positive?: boolean }) {
  return (
    <div className="rounded-xl bg-white/[0.08] backdrop-blur-sm p-4 border border-white/15 hover:bg-white/[0.12] transition-colors">
      <div className="flex items-center justify-between text-[11px] text-white/70">
        <span className="uppercase tracking-wider font-medium">{label}</span>
        <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
      </div>
      <p className="font-display font-bold text-[17px] mt-1.5 tabular text-white">
        {positive ? "+" : ""}
        {formatBRL(value)}
      </p>
    </div>
  );
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
