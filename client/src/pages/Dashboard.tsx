import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { MonthPicker } from "@/components/MonthPicker";
import { formatCurrency, getCurrentMonth, getLast6Months, monthLabel } from "@/lib/format";
import { useLocation } from "wouter";
import {
  TrendingUp,
  TrendingDown,
  CreditCard,
  Wallet,
  ArrowRight,
  ShoppingCart,
  AlertTriangle,
  Bell,
  CheckCircle2,
  Calendar,
  RefreshCw,
  Clock,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Banknote,
  Eye,
  EyeOff,
  PiggyBank,
  Flame,
} from "lucide-react";
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AnimatedContent } from "@/components/ui/animated-content";
import { CurrencyCountUp } from "@/components/ui/count-up";
import { GlareHover } from "@/components/ui/glare-hover";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import DueAlertsCard from "@/components/dashboard/DueAlertsCard";

function getNextMonth(month: string): string {
  const [year, m] = month.split("-").map(Number);
  const d = new Date(year, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function daysFromNow(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export default function Dashboard() {
  const [month, setMonth] = useState(getCurrentMonth);
  const [, setLocation] = useLocation();
  const [despesasExpanded, setDespesasExpanded] = useState(false);
  const [balanceHidden, setBalanceHidden] = useState(false);

  const last6Months = useMemo(() => getLast6Months(), []);
  const nextMonth = useMemo(() => getNextMonth(month), [month]);

  const { data: summary, isLoading: summaryLoading } = trpc.dashboard.summary.useQuery({ month });
  const { data: evolution = [], isLoading: evolutionLoading } = trpc.dashboard.evolution.useQuery({ months: last6Months });
  const { data: categoryBreakdown = [] } = trpc.dashboard.categoryBreakdown.useQuery({ month });
  const { data: recentIncomes = [] } = trpc.incomes.list.useQuery({ month });
  const { data: recentExpenses = [] } = trpc.expenses.list.useQuery({ month });
  const { data: dueCards = [] } = trpc.creditCards.upcomingDue.useQuery();
  const { data: futureCommitments } = trpc.dashboard.futureCommitments.useQuery({ nextMonth });
  const { data: nextPayments = [] } = trpc.dashboard.nextPayments.useQuery({ limit: 3 });

  const dueAlerts = useMemo(() => {
    const today = new Date();
    const todayDay = today.getDate();
    return dueCards
      .map((card) => {
        const dueDay = card.dueDay;
        let daysUntilDue: number;
        if (dueDay >= todayDay) {
          daysUntilDue = dueDay - todayDay;
        } else {
          const nextDue = new Date(today.getFullYear(), today.getMonth() + 1, dueDay);
          daysUntilDue = Math.ceil((nextDue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        }
        return { card, daysUntilDue };
      })
      .filter((a) => a.daysUntilDue <= 7)
      .sort((a, b) => a.daysUntilDue - b.daysUntilDue);
  }, [dueCards]);

  const evolutionData = useMemo(() => {
    return evolution.map((e) => ({
      month: monthLabel(e.month),
      Receitas: (e.totalIncome ?? 0) + (e.totalRecurringIncome ?? 0),
      Despesas: (e.totalDespesasReal ?? ((e.totalExpenses ?? 0) + (e.totalCreditCard ?? 0) + (e.totalRecurringExpense ?? 0))),
      Saldo: e.balance,
    }));
  }, [evolution]);

  const balance = summary?.balance ?? 0;
  const isPositive = balance >= 0;

  const totalReceitas = (summary?.totalIncome ?? 0) + (summary?.totalRecurringIncome ?? 0);
  const totalDespesasReal = summary?.totalDespesasReal ?? 0;
  const totalPaid = summary?.totalPaid ?? 0;
  const totalPending = summary?.totalPending ?? 0;

  // ── Insight 1 + 2: Taxa de Poupança + Comparação mês anterior ────────────
  const prevMonthStr = useMemo(() => {
    const [y, m] = month.split("-").map(Number);
    return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
  }, [month]);

  const prevEvolution = useMemo(
    () => evolution.find((e) => e.month === prevMonthStr) ?? null,
    [evolution, prevMonthStr]
  );

  const prevReceitas = prevEvolution
    ? (prevEvolution.totalIncome ?? 0) + (prevEvolution.totalRecurringIncome ?? 0)
    : null;
  const prevDespesas = prevEvolution ? (prevEvolution.totalDespesasReal ?? 0) : null;

  const savingsRate = totalReceitas > 0 ? (balance / totalReceitas) * 100 : 0;
  const savingsLabel =
    savingsRate >= 30 ? "Excelente" : savingsRate >= 20 ? "Bom" : savingsRate >= 10 ? "Atenção" : "Crítico";
  const savingsColor =
    savingsRate >= 20 ? "text-emerald-600" : savingsRate >= 10 ? "text-amber-500" : "text-red-500";
  const savingsSpotlight =
    savingsRate >= 20 ? "rgba(16,185,129,0.09)" : savingsRate >= 10 ? "rgba(245,158,11,0.09)" : "rgba(239,68,68,0.09)";
  const savingsBadgeCls =
    savingsRate >= 20
      ? "bg-emerald-50 text-emerald-700"
      : savingsRate >= 10
      ? "bg-amber-50 text-amber-700"
      : "bg-red-50 text-red-600";

  // ── Insight 3: Burn Rate ──────────────────────────────────────────────────
  const burnRate = useMemo(() => {
    if (month !== getCurrentMonth()) return null;
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dayOfMonth = now.getDate();
    const monthPct = (dayOfMonth / daysInMonth) * 100;
    const spendingPct = totalReceitas > 0 ? (totalDespesasReal / totalReceitas) * 100 : 0;
    const isAccelerated = spendingPct > monthPct + 10;
    return { dayOfMonth, daysInMonth, monthPct, spendingPct, isAccelerated };
  }, [month, totalDespesasReal, totalReceitas]);

  const totalVista = summary?.totalVista ?? 0;
  const totalCreditCard = summary?.totalCreditCard ?? 0;
  const totalExpenseVista = summary?.totalExpenseVista ?? 0;
  const totalRecurringExpense = summary?.totalRecurringExpense ?? 0;
  const totalCreditCardOnly = summary?.totalCreditCardOnly ?? 0;
  const totalInstallments = summary?.totalInstallments ?? 0;
  const totalRecurringCredit = summary?.totalRecurringCredit ?? 0;

  const despesasBreakdown = [
    {
      label: "À Vista / Débito",
      sub: `Compras: ${formatCurrency(totalExpenseVista)} · Fixas: ${formatCurrency(totalRecurringExpense)}`,
      value: totalVista,
      icon: Banknote,
      color: "text-blue-600",
      bg: "bg-blue-50",
      path: "/despesas",
    },
    {
      label: "Crédito",
      sub: `Parcelas: ${formatCurrency(totalInstallments)} · Assinaturas: ${formatCurrency(totalRecurringCredit)} · Avulsas: ${formatCurrency(totalCreditCardOnly)}`,
      value: totalCreditCard,
      icon: CreditCard,
      color: "text-violet-600",
      bg: "bg-violet-50",
      path: "/cartao",
    },
  ];

  const nextMonthLabel = useMemo(() => {
    const [y, m] = nextMonth.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  }, [nextMonth]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Visão geral das suas finanças</p>
        </div>
        <MonthPicker value={month} onChange={setMonth} />
      </div>

      {/* Hero: Balance card */}
      <AnimatedContent delay={0.05}>
      <div
        className="relative overflow-hidden rounded-2xl p-6 lg:p-8"
        style={{ background: "var(--sidebar)" }}
      >
        {/* Background decoration */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(oklch(0.72 0.20 142 / 0.6) 1px, transparent 1px), linear-gradient(90deg, oklch(0.72 0.20 142 / 0.6) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage: "radial-gradient(ellipse 80% 70% at 20% 30%, #000 20%, transparent 70%)",
            WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 20% 30%, #000 20%, transparent 70%)",
          }}
        />
        <div
          aria-hidden
          className="absolute -top-20 -right-16 w-80 h-80 rounded-full blur-3xl opacity-30"
          style={{ background: "radial-gradient(circle, oklch(0.72 0.20 142), transparent 60%)" }}
        />

        <div className="relative grid lg:grid-cols-[1fr_auto] gap-6 items-start">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-white/55 font-medium">Saldo do mês</p>
            <div className="flex items-center gap-3 mt-1.5">
              <p className="text-4xl lg:text-5xl font-bold tracking-tight text-white tabular-nums">
                {summaryLoading
                  ? <span className="opacity-40">R$ —</span>
                  : balanceHidden
                  ? "••••••"
                  : <CurrencyCountUp value={balance} />}
              </p>
              <button
                onClick={() => setBalanceHidden(!balanceHidden)}
                className="text-white/40 hover:text-white/70 transition-colors"
                aria-label="Ocultar saldo"
              >
                {balanceHidden ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </button>
            </div>
            <p className={`text-[13px] mt-1.5 font-medium ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
              {isPositive ? "Sobra disponível no mês" : "Saldo negativo no mês"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <GlareHover
              className="rounded-xl cursor-pointer"
              glareColor="#ffffff"
              glareOpacity={0.15}
              glareSize={300}
              style={{ background: "oklch(1 0 0 / 0.07)", border: "1px solid oklch(1 0 0 / 0.12)" }}
              onClick={() => setLocation("/receitas")}
            >
              <div className="p-4 text-left">
                <p className="text-[10px] text-white/55 uppercase tracking-widest font-medium">Receitas</p>
                <p className="text-base font-bold text-white mt-1.5 tabular-nums">
                  {summaryLoading ? "..." : <CurrencyCountUp value={totalReceitas} />}
                </p>
                {prevReceitas !== null && !summaryLoading && (
                  <div className="flex items-center gap-0.5 mt-1">
                    {totalReceitas >= prevReceitas
                      ? <ChevronUp className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                      : <ChevronDown className="w-3 h-3 text-red-400 flex-shrink-0" />}
                    <span className={`text-[10px] ${totalReceitas >= prevReceitas ? "text-emerald-400" : "text-red-400"}`}>
                      {formatCurrency(Math.abs(totalReceitas - prevReceitas))} vs anterior
                    </span>
                  </div>
                )}
              </div>
            </GlareHover>

            <GlareHover
              className="rounded-xl cursor-pointer"
              glareColor="#ffffff"
              glareOpacity={0.15}
              glareSize={300}
              style={{ background: "oklch(1 0 0 / 0.07)", border: "1px solid oklch(1 0 0 / 0.12)" }}
              onClick={() => setDespesasExpanded(!despesasExpanded)}
            >
              <div className="p-4 text-left">
                <p className="text-[10px] text-white/55 uppercase tracking-widest font-medium">Despesas</p>
                <p className="text-base font-bold text-white mt-1.5 tabular-nums">
                  {summaryLoading ? "..." : <CurrencyCountUp value={totalDespesasReal} />}
                </p>
                {prevDespesas !== null && !summaryLoading && (
                  <div className="flex items-center gap-0.5 mt-1">
                    {totalDespesasReal <= prevDespesas
                      ? <ChevronDown className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                      : <ChevronUp className="w-3 h-3 text-red-400 flex-shrink-0" />}
                    <span className={`text-[10px] ${totalDespesasReal <= prevDespesas ? "text-emerald-400" : "text-red-400"}`}>
                      {formatCurrency(Math.abs(totalDespesasReal - prevDespesas))} vs anterior
                    </span>
                  </div>
                )}
              </div>
            </GlareHover>
          </div>
        </div>
      </div>
      </AnimatedContent>

      {/* Insights: Taxa de Poupança + Ritmo de Gastos */}
      <AnimatedContent delay={0.08}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Taxa de Poupança */}
        <SpotlightCard className="p-5" spotlightColor={savingsSpotlight}>
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${savingsRate >= 20 ? "bg-emerald-50" : savingsRate >= 10 ? "bg-amber-50" : "bg-red-50"}`}>
                <PiggyBank className={`w-4 h-4 ${savingsColor}`} />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Taxa de Poupança</p>
                <p className="text-[11px] text-muted-foreground">do que você ganha, sobra</p>
              </div>
            </div>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${savingsBadgeCls}`}>
              {savingsLabel}
            </span>
          </div>
          <div className="flex items-end gap-2 mb-2">
            <span className={`text-3xl font-bold tabular-nums ${savingsColor}`}>
              {summaryLoading ? "—" : `${Math.abs(savingsRate).toFixed(1)}%`}
            </span>
            <span className="text-xs text-muted-foreground mb-1">
              {totalReceitas > 0 ? `${formatCurrency(Math.abs(balance))} de ${formatCurrency(totalReceitas)}` : "sem receitas"}
            </span>
          </div>
          <Progress
            value={Math.min(Math.max(savingsRate, 0), 100)}
            className={`h-1.5 ${savingsRate >= 20 ? "[&>div]:bg-emerald-500" : savingsRate >= 10 ? "[&>div]:bg-amber-500" : "[&>div]:bg-red-500"}`}
          />
        </SpotlightCard>

        {/* Ritmo de Gastos (burn rate) — só para mês atual */}
        {burnRate ? (
          <SpotlightCard
            className="p-5"
            spotlightColor={burnRate.isAccelerated ? "rgba(239,68,68,0.08)" : "rgba(99,102,241,0.07)"}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${burnRate.isAccelerated ? "bg-red-50" : "bg-indigo-50"}`}>
                  <Flame className={`w-4 h-4 ${burnRate.isAccelerated ? "text-red-500" : "text-indigo-500"}`} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">Ritmo de Gastos</p>
                  <p className="text-[11px] text-muted-foreground">dia {burnRate.dayOfMonth} de {burnRate.daysInMonth}</p>
                </div>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${burnRate.isAccelerated ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"}`}>
                {burnRate.isAccelerated ? "Acelerado" : "Saudável"}
              </span>
            </div>
            <div className="space-y-2.5">
              <div>
                <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                  <span>Mês decorrido</span>
                  <span className="font-medium text-foreground">{burnRate.monthPct.toFixed(0)}%</span>
                </div>
                <Progress value={burnRate.monthPct} className="h-1.5 [&>div]:bg-slate-400" />
              </div>
              <div>
                <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                  <span>Renda já gasta</span>
                  <span className={`font-medium ${burnRate.isAccelerated ? "text-red-500" : "text-foreground"}`}>
                    {burnRate.spendingPct.toFixed(0)}%
                  </span>
                </div>
                <Progress
                  value={Math.min(burnRate.spendingPct, 100)}
                  className={`h-1.5 ${burnRate.isAccelerated ? "[&>div]:bg-red-500" : "[&>div]:bg-indigo-500"}`}
                />
              </div>
            </div>
          </SpotlightCard>
        ) : (
          <SpotlightCard className="p-5 flex items-center gap-3" spotlightColor="rgba(99,102,241,0.07)">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
              <Flame className="w-4 h-4 text-indigo-500" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">Ritmo de Gastos</p>
              <p className="text-[11px] text-muted-foreground">Disponível apenas para o mês atual</p>
            </div>
          </SpotlightCard>
        )}
      </div>
      </AnimatedContent>

      {/* Alertas de Vencimento */}
      <AnimatedContent delay={0.1}>
      <DueAlertsCard dueAlerts={dueAlerts} />
      </AnimatedContent>

      {/* Despesas breakdown (expandable) */}
      {despesasExpanded && (
        <div className="card-premium overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-3.5 h-3.5 text-red-500" />
              <h2 className="text-sm font-semibold text-foreground">Despesas por Forma de Pagamento</h2>
            </div>
            <button
              onClick={() => setDespesasExpanded(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4 space-y-2">
            {despesasBreakdown.map((item) => (
              <div
                key={item.label}
                className="flex items-start justify-between py-2.5 px-3 rounded-xl hover:bg-muted/40 cursor-pointer transition-colors"
                onClick={() => setLocation(item.path)}
              >
                <div className="flex items-start gap-2.5">
                  <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center mt-0.5 flex-shrink-0`}>
                    <item.icon className={`w-4 h-4 ${item.color}`} />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-foreground block">{item.label}</span>
                    <span className="text-[11px] text-muted-foreground">{item.sub}</span>
                  </div>
                </div>
                <span className={`text-sm font-semibold ${item.color} flex-shrink-0 ml-2`}>
                  {formatCurrency(item.value)}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2.5 border-t border-border px-3">
              <span className="text-sm font-semibold text-foreground">Total</span>
              <span className="text-sm font-bold text-red-500">{formatCurrency(totalDespesasReal)}</span>
            </div>
            <div className="flex items-center gap-2 px-3 pt-1">
              <span className="text-[11px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                {formatCurrency(totalPaid)} pago
              </span>
              <span className="text-[11px] text-red-500 bg-red-50 px-2 py-0.5 rounded-full font-medium">
                {formatCurrency(totalPending)} pendente
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Distribuição de Despesas por Categoria */}
      <AnimatedContent delay={0.05}>
      <div className="card-premium overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-border">
          <TrendingDown className="w-4 h-4 text-red-500" />
          <h2 className="text-sm font-semibold text-foreground">Distribuição de Despesas do Mês</h2>
        </div>
        {categoryBreakdown.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-36 text-muted-foreground gap-2">
            <TrendingDown className="w-7 h-7 opacity-25" />
            <p className="text-xs">Sem despesas registradas neste mês</p>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row items-center gap-4 p-6">
            <div className="flex-shrink-0">
              <ResponsiveContainer width={200} height={200}>
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={88}
                    paddingAngle={2}
                    dataKey="total"
                    nameKey="name"
                  >
                    {categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const entry = payload[0];
                      const pct = totalDespesasReal > 0 ? ((entry.value as number / totalDespesasReal) * 100).toFixed(1) : "0";
                      return (
                        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "10px 14px", fontSize: "12px", minWidth: "150px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                            <span style={{ width: "9px", height: "9px", borderRadius: "50%", backgroundColor: entry.payload?.color, flexShrink: 0, display: "inline-block" }} />
                            <span style={{ fontWeight: 600, color: "#0f172a", fontSize: "13px" }}>{entry.name}</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: "16px" }}>
                            <span style={{ color: "#64748b" }}>Valor</span>
                            <span style={{ fontWeight: 700, color: "#0f172a" }}>{formatCurrency(entry.value as number)}</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", marginTop: "3px" }}>
                            <span style={{ color: "#64748b" }}>% total</span>
                            <span style={{ fontWeight: 600, color: "#16a34a" }}>{pct}%</span>
                          </div>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 w-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {categoryBreakdown.map((cat) => {
                  const pct = totalDespesasReal > 0 ? ((cat.total / totalDespesasReal) * 100).toFixed(1) : "0";
                  return (
                    <div key={cat.categoryId ?? cat.name} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/25 hover:bg-muted/45 transition-colors">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                        <span className="text-xs font-medium text-foreground truncate">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <span className="text-[11px] text-muted-foreground">{pct}%</span>
                        <span className="text-xs font-semibold text-foreground tabular-nums">{formatCurrency(cat.total)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border px-1">
                <span className="text-xs text-muted-foreground font-medium">Total de despesas</span>
                <span className="text-sm font-bold text-red-500 tabular-nums">{formatCurrency(totalDespesasReal)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
      </AnimatedContent>

      {/* Compromissos Futuros + Próximos Pagamentos */}
      <AnimatedContent delay={0.05}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Compromissos do Próximo Mês */}
        <div className="card-premium overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
            <Calendar className="w-4 h-4 text-primary" />
            <div>
              <h2 className="text-sm font-semibold text-foreground">Compromissos Futuros</h2>
              <p className="text-[11px] text-muted-foreground capitalize">{nextMonthLabel}</p>
            </div>
          </div>
          <div className="p-4 space-y-2">
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setLocation("/cartao")}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Cartão de Crédito</p>
                  <p className="text-[11px] text-muted-foreground">Faturas do próximo mês</p>
                </div>
              </div>
              <span className="text-sm font-bold text-indigo-600 tabular-nums">
                {formatCurrency(futureCommitments?.creditCard ?? 0)}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setLocation("/parcelamentos")}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Parcelamentos</p>
                  <p className="text-[11px] text-muted-foreground">Parcelas do próximo mês</p>
                </div>
              </div>
              <span className="text-sm font-bold text-amber-600 tabular-nums">
                {formatCurrency(futureCommitments?.installments ?? 0)}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setLocation("/recorrentes")}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                  <RefreshCw className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Despesas Fixas</p>
                  <p className="text-[11px] text-muted-foreground">Recorrentes mensais</p>
                </div>
              </div>
              <span className="text-sm font-bold text-red-500 tabular-nums">
                {formatCurrency(futureCommitments?.recurringExpenses ?? 0)}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2.5 border-t border-border px-1">
              <span className="text-sm font-semibold text-foreground">Total comprometido</span>
              <span className="text-sm font-bold text-foreground tabular-nums">
                {formatCurrency(futureCommitments?.total ?? 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Próximos Pagamentos */}
        <div className="card-premium overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Próximos Pagamentos</h2>
            </div>
            <Button variant="ghost" size="sm" className="text-xs gap-1 h-7 rounded-full" onClick={() => setLocation("/despesas")}>
              Ver todos <ArrowRight className="w-3 h-3" />
            </Button>
          </div>
          {nextPayments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-36 text-muted-foreground gap-2">
              <CheckCircle2 className="w-7 h-7 opacity-25" />
              <p className="text-xs">Nenhum pagamento pendente</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {nextPayments.map((payment, idx) => {
                const days = daysFromNow(payment.date);
                const isToday = days === 0;
                const isOverdue = days < 0;
                const isCreditCard = payment.type === "creditCard";
                return (
                  <div key={`${payment.type}-${payment.id}-${idx}`} className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isCreditCard ? "bg-indigo-50" : "bg-red-50"}`}>
                        {isCreditCard
                          ? <CreditCard className="w-4 h-4 text-indigo-600" />
                          : <TrendingDown className="w-4 h-4 text-red-500" />
                        }
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground leading-tight">{payment.description}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] text-muted-foreground">{formatDate(payment.date)}</span>
                          {isOverdue && (
                            <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">
                              {Math.abs(days)}d atraso
                            </span>
                          )}
                          {isToday && (
                            <span className="text-[10px] font-semibold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full">
                              Hoje
                            </span>
                          )}
                          {!isToday && !isOverdue && days <= 3 && (
                            <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                              {days === 1 ? "Amanhã" : `${days}d`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className={`text-sm font-bold tabular-nums ${isCreditCard ? "text-indigo-600" : "text-red-500"}`}>
                      {formatCurrency(String(payment.amount))}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      </AnimatedContent>

      {/* Charts Row */}
      <AnimatedContent delay={0.05}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card-premium p-5 lg:p-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">Evolução dos Últimos 6 Meses</h2>
          {evolutionLoading ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Carregando...</div>
          ) : (
            <ResponsiveContainer width="100%" height={210}>
              <AreaChart data={evolutionData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.01 240)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value: number, name: string) => [formatCurrency(value), name]}
                  contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                />
                <Area type="monotone" dataKey="Receitas" stroke="#22c55e" strokeWidth={2} fill="url(#colorReceitas)" />
                <Area type="monotone" dataKey="Despesas" stroke="#ef4444" strokeWidth={2} fill="url(#colorDespesas)" />
                <Line type="monotone" dataKey="Saldo" stroke="#6366f1" strokeWidth={2} dot={{ fill: "#6366f1", r: 3 }} activeDot={{ r: 5 }} strokeDasharray="5 3" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>
      </AnimatedContent>

      {/* Recent Activity */}
      <AnimatedContent delay={0.05}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card-premium overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Últimas Receitas</h2>
            <Button variant="ghost" size="sm" className="text-xs gap-1 h-7 rounded-full" onClick={() => setLocation("/receitas")}>
              Ver todas <ArrowRight className="w-3 h-3" />
            </Button>
          </div>
          {recentIncomes.length === 0 ? (
            <div className="flex items-center justify-center h-24 text-xs text-muted-foreground">
              Nenhuma receita neste mês
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentIncomes.slice(0, 5).map((income) => (
                <div key={income.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="text-sm font-medium text-foreground truncate max-w-[160px]">{income.description}</span>
                  </div>
                  <span className="text-sm font-semibold text-emerald-600 tabular-nums">{formatCurrency(String(income.amount))}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card-premium overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Últimas Despesas</h2>
            <Button variant="ghost" size="sm" className="text-xs gap-1 h-7 rounded-full" onClick={() => setLocation("/despesas")}>
              Ver todas <ArrowRight className="w-3 h-3" />
            </Button>
          </div>
          {recentExpenses.length === 0 ? (
            <div className="flex items-center justify-center h-24 text-xs text-muted-foreground">
              Nenhuma despesa neste mês
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentExpenses.slice(0, 5).map((expense) => (
                <div key={expense.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${expense.isPaid ? "bg-emerald-50" : "bg-red-50"}`}>
                      {expense.isPaid
                        ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        : <TrendingDown className="w-4 h-4 text-red-500" />
                      }
                    </div>
                    <div>
                      <span className="text-sm font-medium text-foreground truncate max-w-[140px] block">{expense.description}</span>
                      {expense.isPaid && <span className="text-[10px] text-emerald-600">Pago</span>}
                    </div>
                  </div>
                  <span className={`text-sm font-semibold tabular-nums ${expense.isPaid ? "text-muted-foreground" : "text-red-500"}`}>
                    {formatCurrency(String(expense.amount))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      </AnimatedContent>
    </div>
  );
}
