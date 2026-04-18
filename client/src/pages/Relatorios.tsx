import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { formatCurrency, getLast6Months, monthLabel, getCurrentMonth } from "@/lib/format";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  CreditCard,
  Wallet,
  BarChart3,
  FileSpreadsheet,
  FileText,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function monthFullLabel(month: string): string {
  const [year, m] = month.split("-").map(Number);
  return `${MONTH_NAMES[m - 1]} ${year}`;
}

function prevMonth(month: string): string {
  const [year, m] = month.split("-").map(Number);
  const d = new Date(year, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function nextMonth(month: string): string {
  const [year, m] = month.split("-").map(Number);
  const d = new Date(year, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function Relatorios() {
  const last6Months = useMemo(() => getLast6Months(), []);
  const [selectedMonth, setSelectedMonth] = useState(() => getCurrentMonth());
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  const { data: evolution = [], isLoading } = trpc.dashboard.evolution.useQuery({ months: last6Months });
  const { data: expByCategory = [] } = trpc.dashboard.expensesByCategory.useQuery({ month: selectedMonth });
  const { data: expCategories = [] } = trpc.expenseCategories.list.useQuery();

  const allCategories = useMemo(() => {
    const custom = expCategories.map((c) => ({ id: c.id, name: c.name, color: c.color }));
    return [...DEFAULT_EXPENSE_CATEGORIES, ...custom];
  }, [expCategories]);

  // Filtrar apenas meses com dados reais (hasData !== false) para gráficos e totais
  const evolutionWithData = useMemo(
    () => evolution.filter((e) => (e as any).hasData !== false),
    [evolution]
  );

  const barData = useMemo(() => {
    return evolutionWithData.map((e) => ({
      month: monthLabel(e.month),
      Receitas: Number((e.totalIncome + e.totalRecurringIncome).toFixed(2)),
      Despesas: Number((e.totalDespesasReal ?? 0).toFixed(2)),
    }));
  }, [evolutionWithData]);

  const lineData = useMemo(() => {
    return evolutionWithData.map((e) => ({
      month: monthLabel(e.month),
      Saldo: Number(e.balance.toFixed(2)),
    }));
  }, [evolutionWithData]);

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

  const totals = useMemo(() => {
    if (evolutionWithData.length === 0) return { income: 0, expense: 0, balance: 0, avgBalance: 0 };
    const income = evolutionWithData.reduce((s, e) => s + e.totalIncome + e.totalRecurringIncome, 0);
    const expense = evolutionWithData.reduce((s, e) => s + (e.totalDespesasReal ?? 0), 0);
    const balance = evolutionWithData.reduce((s, e) => s + e.balance, 0);
    return { income, expense, balance, avgBalance: balance / evolutionWithData.length };
  }, [evolutionWithData]);

  // ── Export handlers ──────────────────────────────────────────────────────────

  async function handleExport(format: "pdf" | "excel") {
    const isExcel = format === "excel";
    if (isExcel) setExportingExcel(true);
    else setExportingPdf(true);

    try {
      const url = `/api/export/${isExcel ? "excel" : "pdf"}?month=${selectedMonth}`;
      const response = await fetch(url, { credentials: "include" });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Erro desconhecido" }));
        throw new Error(err.error || `HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const ext = isExcel ? "xlsx" : "pdf";
      const filename = `meu-ganho-pessoal-${selectedMonth}.${ext}`;
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);

      toast.success(`Relatório ${isExcel ? "Excel" : "PDF"} exportado com sucesso!`);
    } catch (err: any) {
      toast.error(`Erro ao exportar: ${err.message}`);
    } finally {
      if (isExcel) setExportingExcel(false);
      else setExportingPdf(false);
    }
  }

  const MONTHS_LABEL = "Últimos 6 meses";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Relatórios</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Análise financeira dos {MONTHS_LABEL}</p>
        </div>

        {/* Export + Month selector */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Month navigator */}
          <div className="flex items-center gap-1 bg-white border border-border rounded-xl px-2 py-1.5 shadow-sm">
            <button
              onClick={() => setSelectedMonth(prevMonth(selectedMonth))}
              className="p-1 rounded-lg hover:bg-muted transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            </button>
            <span className="text-sm font-medium text-foreground px-2 min-w-[130px] text-center">
              {monthFullLabel(selectedMonth)}
            </span>
            <button
              onClick={() => setSelectedMonth(nextMonth(selectedMonth))}
              className="p-1 rounded-lg hover:bg-muted transition-colors"
              disabled={selectedMonth >= getCurrentMonth()}
            >
              <ChevronRight className={`w-4 h-4 ${selectedMonth >= getCurrentMonth() ? "text-muted-foreground/30" : "text-muted-foreground"}`} />
            </button>
          </div>

          {/* Export buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("excel")}
              disabled={exportingExcel}
              className="gap-2 bg-white hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-colors"
            >
              {exportingExcel ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              )}
              <span className="hidden sm:inline">Excel</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("pdf")}
              disabled={exportingPdf}
              className="gap-2 bg-white hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-colors"
            >
              {exportingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4 text-red-500" />
              )}
              <span className="hidden sm:inline">PDF</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Recebido", value: totals.income, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Total Gasto", value: totals.expense, icon: TrendingDown, color: "text-red-500", bg: "bg-red-50" },
          { label: "Saldo Acumulado", value: totals.balance, icon: Wallet, color: totals.balance >= 0 ? "text-emerald-600" : "text-red-500", bg: totals.balance >= 0 ? "bg-emerald-50" : "bg-red-50" },
          { label: "Saldo Médio/Mês", value: totals.avgBalance, icon: BarChart3, color: totals.avgBalance >= 0 ? "text-indigo-600" : "text-red-500", bg: totals.avgBalance >= 0 ? "bg-indigo-50" : "bg-red-50" },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-2xl border border-border p-5 shadow-sm">
            <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center mb-3`}>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <p className="text-xs text-muted-foreground font-medium">{card.label}</p>
            <p className={`text-xl font-bold mt-1 ${card.color}`}>
              {isLoading ? "..." : formatCurrency(card.value)}
            </p>
          </div>
        ))}
      </div>

      {/* Bar Chart - Receitas vs Despesas */}
      <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-foreground mb-1">Receitas vs Despesas</h2>
        <p className="text-xs text-muted-foreground mb-4">{MONTHS_LABEL}</p>
        {isLoading ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">Carregando...</div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px" }}
              />
              <Legend formatter={(v) => <span style={{ fontSize: "12px", color: "#64748b" }}>{v}</span>} />
              <Bar dataKey="Receitas" fill="#10b981" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Despesas" fill="#ef4444" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Line Chart + Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground mb-1">Evolução do Saldo</h2>
          <p className="text-xs text-muted-foreground mb-4">{MONTHS_LABEL}</p>
          {isLoading ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Carregando...</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={lineData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                />
                <Line
                  type="monotone"
                  dataKey="Saldo"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  dot={{ fill: "#6366f1", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie Chart — uses selectedMonth */}
        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground mb-1">Despesas por Categoria</h2>
          <p className="text-xs text-muted-foreground mb-4">{monthFullLabel(selectedMonth)}</p>
          {pieData.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-muted-foreground gap-2">
              <TrendingDown className="w-8 h-8 opacity-30" />
              <p className="text-xs">Sem despesas categorizadas</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                />
                <Legend formatter={(v) => <span style={{ fontSize: "11px", color: "#64748b" }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Monthly Detail Table */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Detalhamento Mensal</h2>
          <span className="text-xs text-muted-foreground">{MONTHS_LABEL}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left text-xs font-semibold text-muted-foreground px-6 py-3 uppercase tracking-wider">Mês</th>
                <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3 uppercase tracking-wider">Receitas</th>
                <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3 uppercase tracking-wider">Despesas</th>
                <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3 uppercase tracking-wider">Cartão</th>
                <th className="text-right text-xs font-semibold text-muted-foreground px-6 py-3 uppercase tracking-wider">Saldo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {evolutionWithData.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-muted-foreground">Nenhum dado encontrado nos últimos 6 meses</td></tr>
              ) : evolutionWithData.map((e) => {
                const isPos = e.balance >= 0;
                const totalReceitas = e.totalIncome + e.totalRecurringIncome;
                const totalDespesas = e.totalDespesasReal ?? 0;
                return (
                  <tr key={e.month} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-3 text-sm font-medium text-foreground">{monthLabel(e.month)} {e.month.split("-")[0]}</td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-emerald-600">{formatCurrency(totalReceitas)}</td>
                    <td className="px-4 py-3 text-right text-sm text-red-500">{formatCurrency(totalDespesas)}</td>
                    <td className="px-4 py-3 text-right text-sm text-indigo-600">{formatCurrency(e.totalCreditCard)}</td>
                    <td className={`px-6 py-3 text-right text-sm font-bold ${isPos ? "text-emerald-600" : "text-red-500"}`}>
                      {isPos ? "+" : ""}{formatCurrency(e.balance)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export hint */}
      <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-100 rounded-xl px-5 py-3">
        <div className="flex items-center gap-2 text-indigo-600">
          <FileSpreadsheet className="w-4 h-4" />
          <FileText className="w-4 h-4" />
        </div>
        <p className="text-xs text-indigo-700">
          Use os botões <strong>Excel</strong> e <strong>PDF</strong> no topo da página para exportar o extrato completo do mês selecionado, incluindo receitas, despesas e lançamentos de cartão.
        </p>
      </div>
    </div>
  );
}
