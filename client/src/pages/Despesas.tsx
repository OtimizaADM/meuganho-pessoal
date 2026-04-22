import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { MonthPicker } from "@/components/MonthPicker";
import { formatCurrency, formatDate, getCurrentMonth } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { AnimatedContent } from "@/components/ui/animated-content";
import { CurrencyCountUp } from "@/components/ui/count-up";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  TrendingDown,
  RefreshCw,
  Tag,
  CheckCircle2,
  Clock,
  CreditCard,
  Smartphone,
  Banknote,
  ArrowLeftRight,
  MoreHorizontal,
  Wallet,
} from "lucide-react";
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
import { Switch } from "@/components/ui/switch";

const DEFAULT_CATEGORIES = [
  { id: -1, name: "Alimentação", color: "#f59e0b", icon: "utensils" },
  { id: -2, name: "Transporte", color: "#3b82f6", icon: "car" },
  { id: -3, name: "Moradia", color: "#8b5cf6", icon: "home" },
  { id: -4, name: "Saúde", color: "#ef4444", icon: "heart" },
  { id: -5, name: "Educação", color: "#06b6d4", icon: "book" },
  { id: -6, name: "Lazer", color: "#ec4899", icon: "star" },
  { id: -7, name: "Vestuário", color: "#f97316", icon: "shirt" },
  { id: -8, name: "Telefonia", color: "#0ea5e9", icon: "phone" },
  { id: -9, name: "Streamings", color: "#a855f7", icon: "play" },
  { id: -10, name: "Assinaturas", color: "#14b8a6", icon: "repeat" },
  { id: -11, name: "Pets", color: "#84cc16", icon: "paw" },
  { id: -12, name: "Academia", color: "#f43f5e", icon: "dumbbell" },
  { id: -13, name: "Outros", color: "#6b7280", icon: "tag" },
];

const PAYMENT_METHODS = [
  { value: "cash", label: "Dinheiro", icon: <Banknote className="w-3.5 h-3.5" /> },
  { value: "pix", label: "Pix", icon: <Smartphone className="w-3.5 h-3.5" /> },
  { value: "debit", label: "Débito", icon: <CreditCard className="w-3.5 h-3.5" /> },
  { value: "credit", label: "Crédito", icon: <CreditCard className="w-3.5 h-3.5" /> },
  { value: "transfer", label: "Transferência", icon: <ArrowLeftRight className="w-3.5 h-3.5" /> },
  { value: "other", label: "Outro", icon: <MoreHorizontal className="w-3.5 h-3.5" /> },
] as const;

type PaymentMethod = typeof PAYMENT_METHODS[number]["value"];

type ExpenseForm = {
  description: string;
  amount: string;
  date: string;
  categoryId: string;
  isRecurring: boolean;
  notes: string;
  isPaid: boolean;
  paymentMethod: string;
  paymentCardId: string;
};

const emptyForm: ExpenseForm = {
  description: "",
  amount: "",
  date: new Date().toISOString().split("T")[0],
  categoryId: "",
  isRecurring: false,
  notes: "",
  isPaid: false,
  paymentMethod: "",
  paymentCardId: "",
};

// Dialog for marking a despesa as paid
function MarkPaidDialog({
  expense,
  cards,
  onConfirm,
  onClose,
  isPending,
}: {
  expense: any;
  cards: any[];
  onConfirm: (data: { paymentMethod: PaymentMethod; paymentCardId: number | null }) => void;
  onClose: () => void;
  isPending: boolean;
}) {
  const [method, setMethod] = useState<string>(expense.paymentMethod ?? "");
  const [cardId, setCardId] = useState<string>(expense.paymentCardId ? String(expense.paymentCardId) : "");

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            Marcar como Paga
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Despesa: <span className="font-medium text-foreground">{expense.description}</span>
          </p>
          <div className="space-y-1.5">
            <Label>Forma de pagamento *</Label>
            <Select value={method || "none"} onValueChange={(v) => setMethod(v === "none" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Selecione...</SelectItem>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    <span className="flex items-center gap-2">{m.icon} {m.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(method === "credit" || method === "debit") && (
            <div className="space-y-1.5">
              <Label>Cartão</Label>
              <Select value={cardId || "none"} onValueChange={(v) => setCardId(v === "none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {cards.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={() => {
              if (!method) { toast.error("Selecione a forma de pagamento."); return; }
              onConfirm({
                paymentMethod: method as PaymentMethod,
                paymentCardId: cardId ? parseInt(cardId) : null,
              });
            }}
            disabled={isPending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Confirmar Pagamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Despesas() {
  const [month, setMonth] = useState(getCurrentMonth);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<ExpenseForm>(emptyForm);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [markPaidExpense, setMarkPaidExpense] = useState<any | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "paid" | "pending">("all");

  const utils = trpc.useUtils();
  const { data: expenses = [], isLoading } = trpc.expenses.list.useQuery({ month });
  const { data: categories = [] } = trpc.expenseCategories.list.useQuery();
  const { data: cards = [] } = trpc.creditCards.list.useQuery();

  const allCategories = useMemo(() => {
    const custom = categories.map((c) => ({ id: c.id, name: c.name, color: c.color, icon: c.icon }));
    return [...DEFAULT_CATEGORIES, ...custom];
  }, [categories]);

  const cardMap = useMemo(() => new Map(cards.map((c) => [c.id, c.name])), [cards]);

  const createMutation = trpc.expenses.create.useMutation({
    onSuccess: () => {
      utils.expenses.list.invalidate();
      utils.dashboard.summary.invalidate();
      toast.success("Despesa adicionada!");
      setOpen(false);
      setForm(emptyForm);
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.expenses.update.useMutation({
    onSuccess: () => {
      utils.expenses.list.invalidate();
      utils.dashboard.summary.invalidate();
      toast.success("Despesa atualizada!");
      setOpen(false);
      setEditId(null);
      setForm(emptyForm);
    },
    onError: (e) => toast.error(e.message),
  });

  const markPaidMutation = trpc.expenses.markPaid.useMutation({
    onSuccess: () => {
      utils.expenses.list.invalidate();
      toast.success("Despesa marcada como paga!");
      setMarkPaidExpense(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.expenses.delete.useMutation({
    onSuccess: () => {
      utils.expenses.list.invalidate();
      utils.dashboard.summary.invalidate();
      toast.success("Despesa removida.");
      setDeleteId(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const totalMonth = useMemo(
    () => expenses.reduce((sum, e) => sum + parseFloat(String(e.amount)), 0),
    [expenses]
  );
  const totalPaid = useMemo(
    () => expenses.filter((e) => e.isPaid).reduce((sum, e) => sum + parseFloat(String(e.amount)), 0),
    [expenses]
  );
  const totalPending = totalMonth - totalPaid;

  const filteredExpenses = useMemo(() => {
    if (filterStatus === "paid") return expenses.filter((e) => e.isPaid);
    if (filterStatus === "pending") return expenses.filter((e) => !e.isPaid);
    return expenses;
  }, [expenses, filterStatus]);

  function openCreate() {
    setEditId(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(expense: (typeof expenses)[0]) {
    setEditId(expense.id);
    setForm({
      description: expense.description,
      amount: String(expense.amount),
      date: String(expense.date).split("T")[0],
      categoryId: expense.categoryId ? String(expense.categoryId) : "",
      isRecurring: expense.isRecurring,
      notes: expense.notes ?? "",
      isPaid: expense.isPaid,
      paymentMethod: expense.paymentMethod ?? "",
      paymentCardId: expense.paymentCardId ? String(expense.paymentCardId) : "",
    });
    setOpen(true);
  }

  function handleSubmit() {
    if (!form.description || !form.amount || !form.date) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    if (!form.categoryId) {
      toast.error("Selecione uma categoria.");
      return;
    }
    const payload = {
      description: form.description,
      amount: form.amount,
      date: form.date,
      categoryId: parseInt(form.categoryId),
      isRecurring: form.isRecurring,
      notes: form.notes || null,
      isPaid: form.isPaid,
      paymentMethod: (form.paymentMethod || null) as any,
      paymentCardId: form.paymentCardId ? parseInt(form.paymentCardId) : null,
    };
    if (editId) {
      updateMutation.mutate({ id: editId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  function getCategoryInfo(categoryId: number | null) {
    if (!categoryId) return null;
    return allCategories.find((c) => c.id === categoryId) ?? null;
  }

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of expenses) {
      const cat = getCategoryInfo(e.categoryId);
      const key = cat?.name ?? "Sem categoria";
      map.set(key, (map.get(key) ?? 0) + parseFloat(String(e.amount)));
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [expenses]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Despesas</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Controle seus gastos mensais</p>
        </div>
        <div className="flex items-center gap-3">
          <MonthPicker value={month} onChange={setMonth} />
          <Button onClick={openCreate} size="sm" className="gap-2 rounded-full">
            <Plus className="w-4 h-4" />
            Nova Despesa
          </Button>
        </div>
      </div>

      {/* Summary */}
      <AnimatedContent delay={0.05}>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <SpotlightCard className="p-5 flex items-center gap-3 sm:col-span-1" spotlightColor="rgba(239,68,68,0.08)">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
            <TrendingDown className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total do Mês</p>
            <p className="text-xl font-bold text-red-500 tabular-nums">
              <CurrencyCountUp value={totalMonth} />
            </p>
          </div>
        </SpotlightCard>
        <SpotlightCard className="p-5 flex items-center gap-3 sm:col-span-1" spotlightColor="rgba(16,185,129,0.08)">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Pagas</p>
            <p className="text-xl font-bold text-emerald-600 tabular-nums">
              <CurrencyCountUp value={totalPaid} />
            </p>
          </div>
        </SpotlightCard>
        <SpotlightCard className="p-5 flex items-center gap-3 sm:col-span-1" spotlightColor="rgba(245,158,11,0.08)">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Pendentes</p>
            <p className="text-xl font-bold text-amber-600 tabular-nums">
              <CurrencyCountUp value={totalPending} />
            </p>
          </div>
        </SpotlightCard>
        <SpotlightCard className="p-5 sm:col-span-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">Top Categorias</p>
          <div className="space-y-1.5">
            {byCategory.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhum dado</p>
            ) : (
              byCategory.map(([name, total]) => (
                <div key={name} className="flex items-center justify-between">
                  <span className="text-xs text-foreground truncate">{name}</span>
                  <span className="text-xs font-semibold text-red-500 ml-2">{formatCurrency(total)}</span>
                </div>
              ))
            )}
          </div>
        </SpotlightCard>
      </div>
      </AnimatedContent>

      {/* Filter tabs */}
      <div className="flex items-center gap-2">
        {(["all", "pending", "paid"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filterStatus === s
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {s === "all" ? `Todas (${expenses.length})` : s === "pending" ? `Pendentes (${expenses.filter((e) => !e.isPaid).length})` : `Pagas (${expenses.filter((e) => e.isPaid).length})`}
          </button>
        ))}
      </div>

      {/* Table */}
      <AnimatedContent delay={0.1}>
      <div className="card-premium overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Carregando...</div>
        ) : filteredExpenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground">
            <TrendingDown className="w-9 h-9 opacity-25" />
            <p className="text-sm">Nenhuma despesa encontrada.</p>
            <Button variant="outline" size="sm" onClick={openCreate} className="gap-2 rounded-full">
              <Plus className="w-4 h-4" /> Adicionar despesa
            </Button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 uppercase tracking-wider w-10">Status</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 uppercase tracking-wider">Descrição</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 uppercase tracking-wider hidden sm:table-cell">Categoria</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 uppercase tracking-wider hidden md:table-cell">Data</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 uppercase tracking-wider hidden lg:table-cell">Pagamento</th>
                <th className="text-right text-xs font-semibold text-muted-foreground px-6 py-3 uppercase tracking-wider">Valor</th>
                <th className="px-4 py-3 w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredExpenses.map((expense, idx) => {
                const cat = getCategoryInfo(expense.categoryId);
                const pmLabel = PAYMENT_METHODS.find((m) => m.value === expense.paymentMethod);
                const cardName = expense.paymentCardId ? cardMap.get(expense.paymentCardId) : null;
                return (
                  <tr
                    key={expense.id}
                    className={`hover:bg-muted/20 transition-colors group ${expense.isPaid ? "opacity-75" : ""}`}
                    style={{ animation: "row-in 0.3s ease forwards", animationDelay: `${idx * 0.04}s`, opacity: 0 }}
                  >
                    {/* Status button */}
                    <td className="px-4 py-4">
                      <button
                        onClick={() => {
                          if (!expense.isPaid) {
                            setMarkPaidExpense(expense);
                          } else {
                            markPaidMutation.mutate({ id: expense.id, isPaid: false });
                          }
                        }}
                        className="flex items-center justify-center"
                        title={expense.isPaid ? "Clique para marcar como pendente" : "Clique para marcar como paga"}
                      >
                        {expense.isPaid ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <Clock className="w-5 h-5 text-amber-400" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium text-sm ${expense.isPaid ? "line-through text-muted-foreground" : "text-foreground"}`}>
                          {expense.description}
                        </span>
                        {expense.isRecurring && (
                          <RefreshCw className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden sm:table-cell">
                      {cat ? (
                        <Badge
                          variant="secondary"
                          className="text-xs gap-1"
                          style={{ backgroundColor: cat.color + "20", color: cat.color, borderColor: cat.color + "40" }}
                        >
                          <Tag className="w-2.5 h-2.5" />
                          {cat.name}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground hidden md:table-cell">
                      {formatDate(String(expense.date))}
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      {expense.isPaid && pmLabel ? (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                          {pmLabel.icon}
                          {pmLabel.label}
                          {cardName && <> — {cardName}</>}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-semibold ${expense.isPaid ? "text-muted-foreground" : "text-red-500"}`}>
                        {formatCurrency(String(expense.amount))}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!expense.isPaid && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-lg text-emerald-600 hover:bg-emerald-50"
                            title="Marcar como paga"
                            onClick={() => setMarkPaidExpense(expense)}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => openEdit(expense)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-lg text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteId(expense.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      </AnimatedContent>

      {/* Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? "Editar" : "Nova"} Despesa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Descrição *</Label>
                <Input
                  placeholder="Ex: Supermercado"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Valor (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Data *</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Categoria</Label>
                <Select
                  value={form.categoryId || "none"}
                  onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v === "none" ? "" : v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sem categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem categoria</SelectItem>
                    {allCategories.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Status de pagamento */}
            <div className="flex items-center justify-between rounded-xl border border-border p-3 bg-muted/20">
              <div className="flex items-center gap-2">
                {form.isPaid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Clock className="w-4 h-4 text-amber-500" />
                )}
                <Label className="cursor-pointer">
                  {form.isPaid ? "Paga" : "Pendente"}
                </Label>
              </div>
              <Switch
                checked={form.isPaid}
                onCheckedChange={(v) => setForm((f) => ({ ...f, isPaid: v }))}
              />
            </div>

            {form.isPaid && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Forma de pagamento</Label>
                  <Select
                    value={form.paymentMethod || "none"}
                    onValueChange={(v) => setForm((f) => ({ ...f, paymentMethod: v === "none" ? "" : v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Não definido</SelectItem>
                      {PAYMENT_METHODS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          <span className="flex items-center gap-2">{m.icon} {m.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {(form.paymentMethod === "credit" || form.paymentMethod === "debit") && (
                  <div className="space-y-1.5">
                    <Label>Cartão</Label>
                    <Select
                      value={form.paymentCardId || "none"}
                      onValueChange={(v) => setForm((f) => ({ ...f, paymentCardId: v === "none" ? "" : v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {cards.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Observações</Label>
                <Input
                  placeholder="Opcional..."
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch
                  id="recurring"
                  checked={form.isRecurring}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, isRecurring: v }))}
                />
                <Label htmlFor="recurring" className="cursor-pointer text-sm">Recorrente</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {editId ? "Salvar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark Paid Dialog */}
      {markPaidExpense && (
        <MarkPaidDialog
          expense={markPaidExpense}
          cards={cards}
          onConfirm={({ paymentMethod, paymentCardId }) => {
            markPaidMutation.mutate({
              id: markPaidExpense.id,
              isPaid: true,
              paymentMethod,
              paymentCardId,
            });
          }}
          onClose={() => setMarkPaidExpense(null)}
          isPending={markPaidMutation.isPending}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover despesa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
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
