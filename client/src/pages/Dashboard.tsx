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
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Button } from "@/components/ui/button";

const DEFAULT_EXPENSE_CATEGORIES = [
  { id: -1, name: "Alimentação", color: "#f59e0b" },
  { id: -2, name: "Transporte", color: "#3b82f6" },
  { id: -3, name: "Moradia", color: "#8b5cf6" },
  { id: -4, name: "Saúde", color: "#ef4444" },
  { id: -5, name: "Educação", color: "#06b6d4" },
  { id: -6, name: "Lazer", color: "#ec4899" },
  { id: -7, name: "Vestuário", color: "#f97316" },
  { id: -8, name: "Outros", color: "#6b7280" },
];

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

  const last6Months = useMemo(() => getLast6Months(), []);
  const nextMonth = useMemo(() => getNextMonth(month), [month]);

  const { data: summary, isLoading: summaryLoading } = trpc.dashboard.summary.useQuery({ month });
  const { data: evolution = [], isLoading: evolutionLoading } = trpc.dashboard.evolution.useQuery({ months: last6Months });
  const { data: expByCategory = [] } = trpc.dashboard.expensesByCategory.useQuery({ month });
  const { data: expCategories = [] } = trpc.expenseCategories.list.useQuery();
  const { data: categoryBreakdown = [] } = trpc.dashboard.categoryBreakdown.useQuery({ month });
  const { data: recentIncomes = [] } = trpc.incomes.list.useQuery({ month });
  const { data: recentExpenses = [] } = trpc.expenses.list.useQuery({ month });
  const { data: dueCards = [] } = trpc.creditCards.upcomingDue.useQuery();
  const { data: futureCommitments } = trpc.dashboard.futureCommitments.useQuery({ nextMonth });
  const { data: nextPayments = [] } = trpc.dashboard.nextPayments.useQuery({ limit: 3 });

  // Alertas de vencimento de fatura (7 dias)
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

  const allCategories = useMemo(() => {
    const custom = expCategories.map((c) => ({ id: c.id, name: c.name, color: c.color }));
    return [...DEFAULT_EXPENSE_CATEGORIES, ...custom];
  }, [expCategories]);

  const pieData = useMemo(() => {
    return expByCategory
      .filter((e) => parseFloat(e.total) > 0)
      .map((e) => {
        const cat = allCategories.find((c) => c.id === e.categoryId);
        return {
          name: cat?.name ?? "Sem categoria",
          value: parseFloat(e.total),
          color: cat?.color ?? "#6b7280",
        };
      });
  }, [expByCategory, allCategories]);

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

  // Totais corretos do mês
  const totalReceitas = (summary?.totalIncome ?? 0) + (summary?.totalRecurringIncome ?? 0);
  const totalDespesasReal = summary?.totalDespesasReal ?? 0;
  const totalPaid = summary?.totalPaid ?? 0;
  const totalPending = summary?.totalPending ?? 0;

  // Breakdown de despesas para o card expandível
  // Breakdown por forma de pagamento (conforme esboço do usuário)
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Visão geral das suas finanças</p>
        </div>
        <MonthPicker value={month} onChange={setMonth} />
      </div>

      {/* Alertas de Vencimento */}
      {dueAlerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-amber-200">
            <Bell className="w-4 h-4 text-amber-600" />
            <h2 className="text-sm font-semibold text-amber-800">Alertas de Vencimento de Fatura</h2>
          </div>
          <div className="flex flex-wrap gap-3 px-5 py-3">
            {dueAlerts.map(({ card, daysUntilDue }) => {
              const isToday = daysUntilDue === 0;
              const isUrgent = daysUntilDue <= 2;
              return (
                <div key={card.id} className="flex items-center gap-2 bg-white border border-amber-200 rounded-xl px-3 py-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: card.color + "20" }}>
                    <CreditCard className="w-3.5 h-3.5" style={{ color: card.color }} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{card.name}</p>
                    {isToday ? (
                      <p className="text-xs font-bold text-red-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Vence hoje!</p>
                    ) : isUrgent ? (
                      <p className="text-xs text-orange-600">{daysUntilDue === 1 ? "Vence amanhã" : `${daysUntilDue} dias`}</p>
                    ) : (
                      <p className="text-xs text-amber-600">Vence em {daysUntilDue} dias</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Linha 1: Receitas | Despesas | Saldo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Receitas */}
        <div
          className="bg-white rounded-2xl border border-border p-5 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setLocation("/receitas")}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
          </div>
          <p className="text-xs text-muted-foreground font-medium">Receitas do Mês</p>
          <p className="text-xl font-bold mt-1 text-emerald-600">
            {summaryLoading ? "..." : formatCurrency(totalReceitas)}
          </p>
          {(summary?.totalRecurringIncome ?? 0) > 0 && (
            <p className="text-[11px] text-muted-foreground mt-0.5">
              + {formatCurrency(summary?.totalRecurringIncome ?? 0)} fixas
            </p>
          )}
        </div>

        {/* Despesas — card expandível */}
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden col-span-1">
          <div
            className="p-5 cursor-pointer hover:bg-muted/30 transition-colors"
            onClick={() => setDespesasExpanded(!despesasExpanded)}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-500" />
              </div>
              {despesasExpanded
                ? <ChevronUp className="w-4 h-4 text-muted-foreground/70" />
                : <ChevronDown className="w-4 h-4 text-muted-foreground/70" />
              }
            </div>
            <p className="text-xs text-muted-foreground font-medium">Despesas do Mês</p>
            <p className="text-xl font-bold mt-1 text-red-500">
              {summaryLoading ? "..." : formatCurrency(totalDespesasReal)}
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full font-medium">
                {formatCurrency(totalPaid)} pago
              </span>
              <span className="text-[10px] text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full font-medium">
                {formatCurrency(totalPending)} aberto
              </span>
            </div>
          </div>

          {/* Detalhamento expansível por forma de pagamento */}
          {despesasExpanded && (
            <div className="border-t border-border bg-muted/20 px-4 py-3 space-y-2">
              {despesasBreakdown.map((item) => (
                <div
                  key={item.label}
                  className="flex items-start justify-between py-2 px-2 rounded-lg hover:bg-white/70 cursor-pointer transition-colors"
                  onClick={(e) => { e.stopPropagation(); setLocation(item.path); }}
                >
                  <div className="flex items-start gap-2">
                    <div className={`w-6 h-6 rounded-md ${item.bg} flex items-center justify-center mt-0.5 flex-shrink-0`}>
                      <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                    </div>
                    <div>
                      <span className="text-xs font-medium text-foreground block">{item.label}</span>
                      {'sub' in item && <span className="text-[10px] text-muted-foreground">{item.sub}</span>}
                    </div>
                  </div>
                  <span className={`text-xs font-semibold ${item.color} flex-shrink-0 ml-2`}>
                    {formatCurrency(item.value)}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-1.5 border-t border-border/60 px-2">
                <span className="text-xs font-semibold text-foreground">Total</span>
                <span className="text-xs font-bold text-red-500">{formatCurrency(totalDespesasReal)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Saldo */}
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className={`w-10 h-10 rounded-xl ${isPositive ? "bg-emerald-50" : "bg-red-50"} flex items-center justify-center`}>
              <Wallet className={`w-5 h-5 ${isPositive ? "text-emerald-600" : "text-red-500"}`} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground font-medium">Saldo do Mês</p>
          <p className={`text-xl font-bold mt-1 ${isPositive ? "text-emerald-600" : "text-red-500"}`}>
            {summaryLoading ? "..." : formatCurrency(balance)}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{isPositive ? "disponível" : "negativo"}</p>
        </div>
      </div>

      {/* Gráfico de Distribuição de Despesas por Categoria */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-border">
          <TrendingDown className="w-4 h-4 text-red-500" />
          <h2 className="text-sm font-semibold text-foreground">Distribuição de Despesas do Mês</h2>
        </div>
        {categoryBreakdown.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground gap-2">
            <TrendingDown className="w-8 h-8 opacity-30" />
            <p className="text-xs">Sem despesas registradas neste mês</p>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row items-center gap-4 p-6">
            {/* Gráfico de rosca */}
            <div className="flex-shrink-0">
              <ResponsiveContainer width={220} height={220}>
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
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
                        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "10px 14px", fontSize: "12px", minWidth: "160px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                            <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: entry.payload?.color, flexShrink: 0, display: "inline-block" }} />
                            <span style={{ fontWeight: 600, color: "#0f172a" }}>{entry.name}</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: "16px" }}>
                            <span style={{ color: "#64748b" }}>Valor</span>
                            <span style={{ fontWeight: 700, color: "#0f172a" }}>{formatCurrency(entry.value as number)}</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", marginTop: "4px" }}>
                            <span style={{ color: "#64748b" }}>% do total</span>
                            <span style={{ fontWeight: 600, color: "#6366f1" }}>{pct}%</span>
                          </div>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legenda detalhada */}
            <div className="flex-1 w-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {categoryBreakdown.map((cat) => {
                  const pct = totalDespesasReal > 0 ? ((cat.total / totalDespesasReal) * 100).toFixed(1) : "0";
                  return (
                    <div key={cat.categoryId ?? cat.name} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                        <span className="text-xs font-medium text-foreground truncate">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <span className="text-[11px] text-muted-foreground">{pct}%</span>
                        <span className="text-xs font-semibold text-foreground">{formatCurrency(cat.total)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border px-1">
                <span className="text-xs text-muted-foreground font-medium">Total de despesas</span>
                <span className="text-sm font-bold text-red-500">{formatCurrency(totalDespesasReal)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Compromissos Futuros + Próximos Pagamentos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Compromissos do Próximo Mês */}
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-border">
            <Calendar className="w-4 h-4 text-indigo-500" />
            <div>
              <h2 className="text-sm font-semibold text-foreground">Compromissos Futuros</h2>
              <p className="text-[11px] text-muted-foreground capitalize">{nextMonthLabel}</p>
            </div>
          </div>
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50/60 border border-indigo-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Cartão de Crédito</p>
                  <p className="text-[11px] text-muted-foreground">Faturas do próximo mês</p>
                </div>
              </div>
              <span className="text-sm font-bold text-indigo-600">
                {formatCurrency(futureCommitments?.creditCard ?? 0)}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/60 border border-amber-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Parcelamentos</p>
                  <p className="text-[11px] text-muted-foreground">Parcelas do próximo mês</p>
                </div>
              </div>
              <span className="text-sm font-bold text-amber-600">
                {formatCurrency(futureCommitments?.installments ?? 0)}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-red-50/60 border border-red-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                  <RefreshCw className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Despesas Fixas</p>
                  <p className="text-[11px] text-muted-foreground">Recorrentes mensais</p>
                </div>
              </div>
              <span className="text-sm font-bold text-red-500">
                {formatCurrency(futureCommitments?.recurringExpenses ?? 0)}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-sm font-semibold text-foreground">Total comprometido</span>
              <span className="text-base font-bold text-foreground">
                {formatCurrency(futureCommitments?.total ?? 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Próximos Pagamentos */}
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-semibold text-foreground">Próximos Pagamentos</h2>
            </div>
            <Button variant="ghost" size="sm" className="text-xs gap-1 h-7" onClick={() => setLocation("/despesas")}>
              Ver todos <ArrowRight className="w-3 h-3" />
            </Button>
          </div>
          {nextPayments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground gap-2">
              <CheckCircle2 className="w-8 h-8 opacity-30" />
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
                  <div key={`${payment.type}-${payment.id}-${idx}`} className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isCreditCard ? "bg-indigo-50" : "bg-red-50"}`}>
                        {isCreditCard
                          ? <CreditCard className="w-4 h-4 text-indigo-600" />
                          : <TrendingDown className="w-4 h-4 text-red-500" />
                        }
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground leading-tight">{payment.description}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          <span className="text-[11px] text-muted-foreground">{formatDate(payment.date)}</span>
                          {isOverdue && (
                            <span className="text-[11px] font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">
                              Atrasado {Math.abs(days)}d
                            </span>
                          )}
                          {isToday && (
                            <span className="text-[11px] font-semibold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full">
                              Hoje!
                            </span>
                          )}
                          {!isToday && !isOverdue && days <= 3 && (
                            <span className="text-[11px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                              {days === 1 ? "Amanhã" : `${days} dias`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className={`text-sm font-bold ${isCreditCard ? "text-indigo-600" : "text-red-500"}`}>
                      {formatCurrency(String(payment.amount))}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-border p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground mb-4">Evolução dos Últimos 6 Meses</h2>
          {evolutionLoading ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Carregando...</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={evolutionData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                />
                <Area type="monotone" dataKey="Receitas" stroke="#10b981" strokeWidth={2} fill="url(#colorReceitas)" />
                <Area type="monotone" dataKey="Despesas" stroke="#ef4444" strokeWidth={2} fill="url(#colorDespesas)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground mb-4">Despesas por Categoria</h2>
          {pieData.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-muted-foreground gap-2">
              <TrendingDown className="w-8 h-8 opacity-30" />
              <p className="text-xs">Sem despesas no mês</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                />
                <Legend formatter={(value) => <span style={{ fontSize: "11px", color: "#64748b" }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Últimas Receitas</h2>
            <Button variant="ghost" size="sm" className="text-xs gap-1 h-7" onClick={() => setLocation("/receitas")}>
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
                <div key={income.id} className="flex items-center justify-between px-6 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="text-sm font-medium text-foreground truncate max-w-[160px]">{income.description}</span>
                  </div>
                  <span className="text-sm font-semibold text-emerald-600">{formatCurrency(String(income.amount))}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Últimas Despesas</h2>
            <Button variant="ghost" size="sm" className="text-xs gap-1 h-7" onClick={() => setLocation("/despesas")}>
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
                <div key={expense.id} className="flex items-center justify-between px-6 py-3">
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
                  <span className={`text-sm font-semibold ${expense.isPaid ? "text-muted-foreground line-through" : "text-red-500"}`}>
                    {formatCurrency(String(expense.amount))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
