import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { categoryColors, evolution, expenses, formatBRL, incomes } from "@/lib/finance-data";
import { Download, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const byCat = Object.entries(
  expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount;
    return acc;
  }, {})
).map(([name, value]) => ({ name, value }));

const balance = evolution.map((m) => ({ month: m.month, saldo: m.income - m.expense }));

export default function Relatorios() {
  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl lg:text-3xl font-semibold tracking-tight">Relatórios</h2>
          <p className="text-[13px] text-muted-foreground mt-1">Análise completa das suas finanças</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-full h-10 px-4 text-[13px]">
            <Download className="h-4 w-4 mr-1.5" strokeWidth={1.75} /> Exportar PDF
          </Button>
          <Button className="rounded-full h-10 px-5 text-[13px] font-medium shadow-sm">
            <Sparkles className="h-4 w-4 mr-1.5" strokeWidth={1.75} /> Insights IA
          </Button>
        </div>
      </header>

      <section className="grid lg:grid-cols-2 gap-4">
        <Card title="Saldo mensal" subtitle="Receitas − Despesas">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={balance} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} dy={8} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} width={36} />
              <Tooltip
                cursor={{ fill: "hsl(var(--muted) / 0.5)" }}
                contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12, boxShadow: "var(--shadow-elegant)" }}
                formatter={(v: number) => formatBRL(v)}
              />
              <Bar dataKey="saldo" radius={[6, 6, 0, 0]} barSize={28}>
                {balance.map((d, i) => (
                  <Cell key={i} fill={d.saldo >= 0 ? "hsl(var(--income))" : "hsl(var(--expense))"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Distribuição por categoria" subtitle="abril 2025">
          <div className="grid grid-cols-2 gap-4 items-center">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={byCat} dataKey="value" nameKey="name" innerRadius={52} outerRadius={88} paddingAngle={2} stroke="hsl(var(--card))" strokeWidth={2}>
                  {byCat.map((d, i) => (
                    <Cell key={i} fill={categoryColors[d.name] ?? "hsl(var(--primary))"} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12, boxShadow: "var(--shadow-elegant)" }}
                  formatter={(v: number) => formatBRL(v)}
                />
              </PieChart>
            </ResponsiveContainer>
            <ul className="space-y-2.5 text-[13px]">
              {byCat.map((c) => (
                <li key={c.name} className="flex justify-between items-center">
                  <span className="inline-flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: categoryColors[c.name] }} />
                    <span className="text-foreground/80">{c.name}</span>
                  </span>
                  <span className="font-medium tabular">{formatBRL(c.value)}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </section>

      <Card title="Tendência" subtitle="Receitas vs despesas — últimos 6 meses">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={evolution} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
            <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} dy={8} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} width={36} />
            <Tooltip
              cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
              contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12, boxShadow: "var(--shadow-elegant)" }}
              formatter={(v: number) => formatBRL(v)}
            />
            <Line type="monotone" dataKey="income" stroke="hsl(var(--income))" strokeWidth={2} dot={{ r: 3, strokeWidth: 0, fill: "hsl(var(--income))" }} activeDot={{ r: 5, strokeWidth: 0 }} />
            <Line type="monotone" dataKey="expense" stroke="hsl(var(--expense))" strokeWidth={2} dot={{ r: 3, strokeWidth: 0, fill: "hsl(var(--expense))" }} activeDot={{ r: 5, strokeWidth: 0 }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <section className="grid sm:grid-cols-3 gap-4">
        <Mini title="Maior receita" value={Math.max(...incomes.map((i) => i.amount))} tone="income" />
        <Mini title="Maior despesa" value={Math.max(...expenses.map((e) => e.amount))} tone="expense" />
        <Mini title="Ticket médio gasto" value={expenses.reduce((s, e) => s + e.amount, 0) / expenses.length} tone="installment" />
      </section>
    </div>
  );
}

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="card-premium p-6 lg:p-7">
      <div className="mb-5">
        <h3 className="font-display font-semibold text-[17px] tracking-tight">{title}</h3>
        {subtitle && <p className="text-[12px] text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function Mini({ title, value, tone }: { title: string; value: number; tone: "income" | "expense" | "installment" }) {
  return (
    <div className="card-premium p-6">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{title}</p>
      <p className={`font-display text-[28px] font-semibold mt-2 tabular tracking-tight text-${tone}`}>{formatBRL(value)}</p>
    </div>
  );
}
