import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/format";
import {
  Target,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  TrendingDown,
  Car,
  Smartphone,
  Home,
  Plane,
  GraduationCap,
  Heart,
  Gift,
  Landmark,
  ShoppingBag,
  Zap,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedContent } from "@/components/ui/animated-content";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

// ─── Icon options for goals ───────────────────────────────────────────────────
const GOAL_ICONS: Record<string, React.ReactNode> = {
  target: <Target className="w-5 h-5" />,
  car: <Car className="w-5 h-5" />,
  smartphone: <Smartphone className="w-5 h-5" />,
  home: <Home className="w-5 h-5" />,
  plane: <Plane className="w-5 h-5" />,
  graduation: <GraduationCap className="w-5 h-5" />,
  heart: <Heart className="w-5 h-5" />,
  gift: <Gift className="w-5 h-5" />,
  bank: <Landmark className="w-5 h-5" />,
  shopping: <ShoppingBag className="w-5 h-5" />,
  expense: <TrendingDown className="w-5 h-5" />,
  zap: <Zap className="w-5 h-5" />,
};

const GOAL_COLORS = [
  { value: "#6366f1", label: "Índigo" },
  { value: "#10b981", label: "Verde" },
  { value: "#f59e0b", label: "Âmbar" },
  { value: "#ef4444", label: "Vermelho" },
  { value: "#3b82f6", label: "Azul" },
  { value: "#8b5cf6", label: "Roxo" },
  { value: "#ec4899", label: "Rosa" },
  { value: "#14b8a6", label: "Teal" },
];

const DEFAULT_EXPENSE_CATEGORIES = [
  { id: -1, name: "Alimentação" },
  { id: -2, name: "Transporte" },
  { id: -3, name: "Moradia" },
  { id: -4, name: "Saúde" },
  { id: -5, name: "Educação" },
  { id: -6, name: "Lazer" },
  { id: -7, name: "Vestuário" },
  { id: -8, name: "Telefonia" },
  { id: -9, name: "Streamings" },
  { id: -10, name: "Assinaturas" },
  { id: -11, name: "Pets" },
  { id: -12, name: "Academia" },
  { id: -13, name: "Outros" },
];

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function currentMonthStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function currentYear() {
  return new Date().getFullYear();
}

function formatMonth(m: string) {
  const [y, mo] = m.split("-").map(Number);
  return `${MONTH_NAMES[mo - 1]} ${y}`;
}

interface MonthlyFormState {
  title: string;
  description: string;
  categoryId: string;
  limitAmount: string;
  icon: string;
  color: string;
}

interface AnnualFormState {
  title: string;
  description: string;
  targetAmount: string;
  currentAmount: string;
  deadline: string;
  icon: string;
  color: string;
}

const EMPTY_MONTHLY: MonthlyFormState = {
  title: "",
  description: "",
  categoryId: "",
  limitAmount: "",
  icon: "target",
  color: "#6366f1",
};

const EMPTY_ANNUAL: AnnualFormState = {
  title: "",
  description: "",
  targetAmount: "",
  currentAmount: "0",
  deadline: "",
  icon: "target",
  color: "#6366f1",
};

export default function Metas() {
  const [tab, setTab] = useState<"monthly" | "annual">("monthly");
  const [month, setMonth] = useState(currentMonthStr);
  const [year, setYear] = useState(currentYear);

  const [monthlyDialogOpen, setMonthlyDialogOpen] = useState(false);
  const [annualDialogOpen, setAnnualDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [monthlyForm, setMonthlyForm] = useState<MonthlyFormState>({ ...EMPTY_MONTHLY });
  const [annualForm, setAnnualForm] = useState<AnnualFormState>({ ...EMPTY_ANNUAL });

  const utils = trpc.useUtils();

  const { data: monthlyGoals = [], isLoading: loadingMonthly } = trpc.goals.listMonthly.useQuery({ month });
  const { data: annualGoals = [], isLoading: loadingAnnual } = trpc.goals.listAnnual.useQuery({ year });
  const { data: expCats = [] } = trpc.expenseCategories.list.useQuery();
  const { data: expensesByCategory = [] } = trpc.dashboard.expensesByCategory.useQuery({ month });

  const allExpCats = useMemo(() => [
    ...DEFAULT_EXPENSE_CATEGORIES,
    ...expCats.map((c) => ({ id: c.id, name: c.name })),
  ], [expCats]);

  const expenseByCatMap = useMemo(() => {
    const map = new Map<number, number>();
    expensesByCategory.forEach((e) => {
      if (e.categoryId != null) map.set(e.categoryId, parseFloat(e.total));
    });
    return map;
  }, [expensesByCategory]);

  const createMutation = trpc.goals.create.useMutation({
    onSuccess: () => {
      utils.goals.listMonthly.invalidate();
      utils.goals.listAnnual.invalidate();
      toast.success("Meta criada com sucesso!");
      setMonthlyDialogOpen(false);
      setAnnualDialogOpen(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.goals.update.useMutation({
    onSuccess: () => {
      utils.goals.listMonthly.invalidate();
      utils.goals.listAnnual.invalidate();
      toast.success("Meta atualizada!");
      setMonthlyDialogOpen(false);
      setAnnualDialogOpen(false);
      setEditingId(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.goals.delete.useMutation({
    onSuccess: () => {
      utils.goals.listMonthly.invalidate();
      utils.goals.listAnnual.invalidate();
      toast.success("Meta removida!");
      setDeleteId(null);
    },
    onError: (e) => toast.error(e.message),
  });

  function navigateMonth(dir: -1 | 1) {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(y, m - 1 + dir, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  function openCreateMonthly() {
    setEditingId(null);
    setMonthlyForm({ ...EMPTY_MONTHLY });
    setMonthlyDialogOpen(true);
  }

  function openEditMonthly(goal: any) {
    setEditingId(goal.id);
    setMonthlyForm({
      title: goal.title,
      description: goal.description ?? "",
      categoryId: goal.categoryId ? String(goal.categoryId) : "",
      limitAmount: parseFloat(goal.limitAmount).toFixed(2),
      icon: goal.icon ?? "target",
      color: goal.color ?? "#6366f1",
    });
    setMonthlyDialogOpen(true);
  }

  function openCreateAnnual() {
    setEditingId(null);
    setAnnualForm({ ...EMPTY_ANNUAL });
    setAnnualDialogOpen(true);
  }

  function openEditAnnual(goal: any) {
    setEditingId(goal.id);
    setAnnualForm({
      title: goal.title,
      description: goal.description ?? "",
      targetAmount: parseFloat(goal.targetAmount ?? "0").toFixed(2),
      currentAmount: parseFloat(goal.currentAmount ?? "0").toFixed(2),
      deadline: goal.deadline ?? "",
      icon: goal.icon ?? "target",
      color: goal.color ?? "#6366f1",
    });
    setAnnualDialogOpen(true);
  }

  function handleSubmitMonthly() {
    if (!monthlyForm.title.trim() || !monthlyForm.limitAmount) {
      toast.error("Preencha os campos obrigatórios.");
      return;
    }
    const payload = {
      type: "monthly" as const,
      title: monthlyForm.title.trim(),
      description: monthlyForm.description || null,
      categoryId: monthlyForm.categoryId ? parseInt(monthlyForm.categoryId) : null,
      limitAmount: monthlyForm.limitAmount,
      month,
      year: parseInt(month.split("-")[0]),
      icon: monthlyForm.icon,
      color: monthlyForm.color,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  function handleSubmitAnnual() {
    if (!annualForm.title.trim() || !annualForm.targetAmount) {
      toast.error("Preencha os campos obrigatórios.");
      return;
    }
    const payload = {
      type: "annual" as const,
      title: annualForm.title.trim(),
      description: annualForm.description || null,
      limitAmount: annualForm.targetAmount,
      targetAmount: annualForm.targetAmount,
      currentAmount: annualForm.currentAmount || "0",
      year,
      deadline: annualForm.deadline || null,
      icon: annualForm.icon,
      color: annualForm.color,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  function handleUpdateProgress(goal: any, newAmount: string) {
    updateMutation.mutate({
      id: goal.id,
      currentAmount: newAmount,
      isCompleted: parseFloat(newAmount) >= parseFloat(goal.targetAmount ?? goal.limitAmount),
    });
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Metas Financeiras</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Controle de limites mensais e objetivos anuais</p>
        </div>
        <Button
          onClick={() => tab === "monthly" ? openCreateMonthly() : openCreateAnnual()}
          className="gap-2 rounded-full"
        >
          <Plus className="w-4 h-4" />
          Nova Meta {tab === "monthly" ? "Mensal" : "Anual"}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as "monthly" | "annual")}>
        <TabsList className="bg-muted/40 rounded-xl p-1">
          <TabsTrigger value="monthly" className="gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <TrendingDown className="w-4 h-4 text-primary" />
            Metas Mensais
          </TabsTrigger>
          <TabsTrigger value="annual" className="gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Target className="w-4 h-4 text-amber-500" />
            Objetivos Anuais
          </TabsTrigger>
        </TabsList>

        {/* Monthly Tab */}
        <TabsContent value="monthly" className="mt-4 space-y-4">
          {/* Month navigator */}
          <div className="card-premium flex items-center justify-between px-5 py-3">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-foreground">{formatMonth(month)}</span>
            <button
              onClick={() => navigateMonth(1)}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {loadingMonthly ? (
            <div className="card-premium p-8 text-center text-sm text-muted-foreground">Carregando...</div>
          ) : monthlyGoals.length === 0 ? (
            <EmptyState
              type="monthly"
              onAdd={openCreateMonthly}
            />
          ) : (
            <AnimatedContent delay={0.05}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {monthlyGoals.map((goal, idx) => {
                const limit = parseFloat(goal.limitAmount as unknown as string);
                const spent = goal.categoryId ? (expenseByCatMap.get(goal.categoryId) ?? 0) : 0;
                const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
                const isOver = spent > limit;
                const isWarning = pct >= 80 && !isOver;
                const catName = goal.categoryId
                  ? allExpCats.find((c) => c.id === goal.categoryId)?.name
                  : null;
                const spotlightColor = isOver ? "rgba(239,68,68,0.08)" : isWarning ? "rgba(245,158,11,0.08)" : "rgba(99,102,241,0.07)";

                return (
                  <SpotlightCard
                    key={goal.id}
                    className="p-5 space-y-4"
                    spotlightColor={spotlightColor}
                    style={{ animation: "row-in 0.35s ease forwards", animationDelay: `${idx * 0.07}s`, opacity: 0 } as React.CSSProperties}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                          style={{ backgroundColor: goal.color ?? "#6366f1" }}
                        >
                          {GOAL_ICONS[goal.icon ?? "target"]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{goal.title}</p>
                          {catName && (
                            <p className="text-xs text-muted-foreground">{catName}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {isOver && (
                          <Badge variant="destructive" className="text-xs gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Excedido
                          </Badge>
                        )}
                        {isWarning && (
                          <Badge className="text-xs gap-1 bg-amber-100 text-amber-700 border-amber-200">
                            <AlertTriangle className="w-3 h-3" />
                            Atenção
                          </Badge>
                        )}
                        {!isOver && !isWarning && pct > 0 && (
                          <Badge className="text-xs gap-1 bg-emerald-50 text-emerald-700 border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            No limite
                          </Badge>
                        )}
                        <button
                          onClick={() => openEditMonthly(goal)}
                          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteId(goal.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-muted-foreground hover:text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">
                          {goal.categoryId ? "Gasto no mês" : "Limite geral"}
                        </span>
                        <span className={`font-semibold ${isOver ? "text-red-500" : isWarning ? "text-amber-600" : "text-foreground"}`}>
                          {formatCurrency(spent)} / {formatCurrency(limit)}
                        </span>
                      </div>
                      <Progress
                        value={pct}
                        className={`h-2 ${isOver ? "[&>div]:bg-red-500" : isWarning ? "[&>div]:bg-amber-500" : "[&>div]:bg-emerald-500"}`}
                      />
                      <p className="text-xs text-muted-foreground text-right">
                        {pct.toFixed(0)}% utilizado
                        {limit - spent > 0 && !isOver && (
                          <> · {formatCurrency(limit - spent)} disponível</>
                        )}
                        {isOver && (
                          <span className="text-red-500"> · {formatCurrency(spent - limit)} acima do limite</span>
                        )}
                      </p>
                    </div>
                  </SpotlightCard>
                );
              })}
            </div>
            </AnimatedContent>
          )}
        </TabsContent>

        {/* Annual Tab */}
        <TabsContent value="annual" className="mt-4 space-y-4">
          {/* Year navigator */}
          <div className="flex items-center justify-between bg-white rounded-2xl border border-border px-5 py-3 shadow-sm">
            <button
              onClick={() => setYear((y) => y - 1)}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-foreground">{year}</span>
            <button
              onClick={() => setYear((y) => y + 1)}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {loadingAnnual ? (
            <div className="bg-white rounded-2xl border border-border p-8 text-center text-sm text-muted-foreground">Carregando...</div>
          ) : annualGoals.length === 0 ? (
            <EmptyState type="annual" onAdd={openCreateAnnual} />
          ) : (
            <AnimatedContent delay={0.05}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {annualGoals.map((goal, idx) => {
                const target = parseFloat(goal.targetAmount ?? goal.limitAmount as unknown as string);
                const current = parseFloat(goal.currentAmount as unknown as string ?? "0");
                const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;
                const isCompleted = goal.isCompleted || pct >= 100;
                const remaining = Math.max(target - current, 0);

                return (
                  <div
                    key={goal.id}
                    className={`card-premium p-5 space-y-4 ${isCompleted ? "border-emerald-200" : ""}`}
                    style={{ animation: "row-in 0.35s ease forwards", animationDelay: `${idx * 0.07}s`, opacity: 0 }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                          style={{ backgroundColor: goal.color ?? "#6366f1" }}
                        >
                          {GOAL_ICONS[goal.icon ?? "target"]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{goal.title}</p>
                          {goal.deadline && (
                            <p className="text-xs text-muted-foreground">
                              Prazo: {new Date(goal.deadline).toLocaleDateString("pt-BR")}
                            </p>
                          )}
                          {goal.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">{goal.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {isCompleted && (
                          <Badge className="text-xs gap-1 bg-emerald-100 text-emerald-700 border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Concluído
                          </Badge>
                        )}
                        <button
                          onClick={() => openEditAnnual(goal)}
                          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteId(goal.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-muted-foreground hover:text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Progresso</span>
                        <span className="font-semibold">
                          {formatCurrency(current)} / {formatCurrency(target)}
                        </span>
                      </div>
                      <Progress
                        value={pct}
                        className={`h-2.5 ${isCompleted ? "[&>div]:bg-emerald-500" : "[&>div]:bg-indigo-500"}`}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{pct.toFixed(0)}% alcançado</span>
                        {!isCompleted && <span>{formatCurrency(remaining)} restante</span>}
                      </div>
                    </div>

                    {/* Update progress input */}
                    {!isCompleted && (
                      <UpdateProgressInline
                        goal={goal}
                        onUpdate={handleUpdateProgress}
                        isPending={updateMutation.isPending}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            </AnimatedContent>
          )}
        </TabsContent>
      </Tabs>

      {/* Monthly Goal Dialog */}
      <Dialog open={monthlyDialogOpen} onOpenChange={setMonthlyDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar" : "Nova"} Meta Mensal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Título da meta *</Label>
              <Input
                placeholder="Ex: Limite de alimentação"
                value={monthlyForm.title}
                onChange={(e) => setMonthlyForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Limite (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={monthlyForm.limitAmount}
                  onChange={(e) => setMonthlyForm((f) => ({ ...f, limitAmount: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Categoria de despesa</Label>
                <Select
                  value={monthlyForm.categoryId || "none"}
                  onValueChange={(v) => setMonthlyForm((f) => ({ ...f, categoryId: v === "none" ? "" : v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Geral" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Geral (todas as despesas)</SelectItem>
                    {allExpCats.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Ícone</Label>
                <Select value={monthlyForm.icon} onValueChange={(v) => setMonthlyForm((f) => ({ ...f, icon: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(GOAL_ICONS).map(([k, icon]) => (
                      <SelectItem key={k} value={k}>
                        <span className="flex items-center gap-2">{icon} {k}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Cor</Label>
                <Select value={monthlyForm.color} onValueChange={(v) => setMonthlyForm((f) => ({ ...f, color: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GOAL_COLORS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        <span className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: c.value }} />
                          {c.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Input
                placeholder="Opcional..."
                value={monthlyForm.description}
                onChange={(e) => setMonthlyForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMonthlyDialogOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleSubmitMonthly}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {editingId ? "Salvar" : "Criar Meta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Annual Goal Dialog */}
      <Dialog open={annualDialogOpen} onOpenChange={setAnnualDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar" : "Novo"} Objetivo Anual</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Título do objetivo *</Label>
              <Input
                placeholder="Ex: Comprar um carro, Viagem para Europa..."
                value={annualForm.title}
                onChange={(e) => setAnnualForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Valor alvo (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={annualForm.targetAmount}
                  onChange={(e) => setAnnualForm((f) => ({ ...f, targetAmount: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Valor atual (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={annualForm.currentAmount}
                  onChange={(e) => setAnnualForm((f) => ({ ...f, currentAmount: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Prazo</Label>
                <Input
                  type="date"
                  value={annualForm.deadline}
                  onChange={(e) => setAnnualForm((f) => ({ ...f, deadline: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Ícone</Label>
                <Select value={annualForm.icon} onValueChange={(v) => setAnnualForm((f) => ({ ...f, icon: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(GOAL_ICONS).map(([k, icon]) => (
                      <SelectItem key={k} value={k}>
                        <span className="flex items-center gap-2">{icon} {k}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Cor</Label>
              <Select value={annualForm.color} onValueChange={(v) => setAnnualForm((f) => ({ ...f, color: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GOAL_COLORS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: c.value }} />
                        {c.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Input
                placeholder="Opcional..."
                value={annualForm.description}
                onChange={(e) => setAnnualForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAnnualDialogOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleSubmitAnnual}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {editingId ? "Salvar" : "Criar Objetivo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover meta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta meta será desativada. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function EmptyState({ type, onAdd }: { type: "monthly" | "annual"; onAdd: () => void }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-10 flex flex-col items-center gap-3 text-muted-foreground">
      <Target className="w-10 h-10 opacity-20" />
      <p className="text-sm font-medium">
        {type === "monthly" ? "Nenhuma meta mensal definida" : "Nenhum objetivo anual definido"}
      </p>
      <p className="text-xs text-center max-w-xs">
        {type === "monthly"
          ? "Defina limites de gastos por categoria para controlar melhor suas despesas mensais."
          : "Cadastre seus grandes objetivos financeiros como comprar um carro, fazer uma viagem ou guardar para a aposentadoria."}
      </p>
      <Button size="sm" variant="outline" onClick={onAdd} className="mt-2 gap-2">
        <Plus className="w-3.5 h-3.5" />
        {type === "monthly" ? "Criar primeira meta" : "Criar primeiro objetivo"}
      </Button>
    </div>
  );
}

function UpdateProgressInline({
  goal,
  onUpdate,
  isPending,
}: {
  goal: any;
  onUpdate: (goal: any, newAmount: string) => void;
  isPending: boolean;
}) {
  const [value, setValue] = useState(parseFloat(goal.currentAmount ?? "0").toFixed(2));

  return (
    <div className="flex items-center gap-2 pt-1 border-t border-border">
      <Label className="text-xs text-muted-foreground whitespace-nowrap">Atualizar progresso:</Label>
      <Input
        type="number"
        step="0.01"
        className="h-7 text-xs"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <Button
        size="sm"
        className="h-7 text-xs px-3 bg-indigo-600 hover:bg-indigo-700 text-white"
        onClick={() => onUpdate(goal, value)}
        disabled={isPending}
      >
        Salvar
      </Button>
    </div>
  );
}
