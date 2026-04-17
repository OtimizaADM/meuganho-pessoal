import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/format";
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Building2,
  CreditCard,
  Wallet,
  Smartphone,
  ArrowLeftRight,
  Banknote,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

// ─── Default categories ───────────────────────────────────────────────────────
const DEFAULT_INCOME_CATEGORIES = [
  { id: -1, name: "Salário", color: "#10b981" },
  { id: -2, name: "Freelance", color: "#3b82f6" },
  { id: -3, name: "Investimentos", color: "#8b5cf6" },
  { id: -4, name: "Aluguel", color: "#f59e0b" },
  { id: -5, name: "Outros", color: "#6b7280" },
];

const DEFAULT_EXPENSE_CATEGORIES = [
  { id: -1, name: "Alimentação", color: "#f59e0b" },
  { id: -2, name: "Transporte", color: "#3b82f6" },
  { id: -3, name: "Moradia", color: "#8b5cf6" },
  { id: -4, name: "Saúde", color: "#ef4444" },
  { id: -5, name: "Educação", color: "#06b6d4" },
  { id: -6, name: "Lazer", color: "#ec4899" },
  { id: -7, name: "Vestuário", color: "#f97316" },
  { id: -8, name: "Telefonia", color: "#0ea5e9" },
  { id: -9, name: "Streamings", color: "#a855f7" },
  { id: -10, name: "Assinaturas", color: "#14b8a6" },
  { id: -11, name: "Pets", color: "#84cc16" },
  { id: -12, name: "Academia", color: "#f43f5e" },
  { id: -13, name: "Outros", color: "#6b7280" },
];

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Dinheiro",
  pix: "Pix",
  debit: "Débito",
  credit: "Crédito",
  transfer: "Transferência",
  other: "Outro",
};

const PAYMENT_METHOD_ICONS: Record<string, React.ReactNode> = {
  cash: <Banknote className="w-3.5 h-3.5" />,
  pix: <Smartphone className="w-3.5 h-3.5" />,
  debit: <CreditCard className="w-3.5 h-3.5" />,
  credit: <CreditCard className="w-3.5 h-3.5" />,
  transfer: <ArrowLeftRight className="w-3.5 h-3.5" />,
  other: <MoreHorizontal className="w-3.5 h-3.5" />,
};

function ordinal(n: number): string {
  return `Dia ${n}`;
}

type RecurringType = "income" | "expense";

interface FormState {
  type: RecurringType;
  description: string;
  amount: string;
  dayOfMonth: string;
  categoryId: string;
  bankAccount: string;
  bankName: string;
  paymentMethod: string;
  paymentCardId: string;
  notes: string;
}

const EMPTY_FORM: FormState = {
  type: "income",
  description: "",
  amount: "",
  dayOfMonth: "5",
  categoryId: "",
  bankAccount: "",
  bankName: "",
  paymentMethod: "",
  paymentCardId: "",
  notes: "",
};

export default function Recorrentes() {
  const [tab, setTab] = useState<RecurringType>("income");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM, type: "income" });

  const utils = trpc.useUtils();

  const { data: items = [], isLoading } = trpc.recurring.list.useQuery({ type: tab });
  const { data: incCats = [] } = trpc.incomeCategories.list.useQuery();
  const { data: expCats = [] } = trpc.expenseCategories.list.useQuery();
  const { data: cards = [] } = trpc.creditCards.list.useQuery();

  const allIncCats = useMemo(() => [...DEFAULT_INCOME_CATEGORIES, ...incCats.map(c => ({ id: c.id, name: c.name, color: c.color }))], [incCats]);
  const allExpCats = useMemo(() => [...DEFAULT_EXPENSE_CATEGORIES, ...expCats.map(c => ({ id: c.id, name: c.name, color: c.color }))], [expCats]);

  const createMutation = trpc.recurring.create.useMutation({
    onSuccess: () => { utils.recurring.list.invalidate(); toast.success("Item recorrente criado!"); setDialogOpen(false); },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.recurring.update.useMutation({
    onSuccess: () => { utils.recurring.list.invalidate(); toast.success("Item atualizado!"); setDialogOpen(false); },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.recurring.delete.useMutation({
    onSuccess: () => { utils.recurring.list.invalidate(); toast.success("Item removido!"); setDeleteId(null); },
    onError: (e) => toast.error(e.message),
  });

  function openCreate(type: RecurringType) {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, type });
    setDialogOpen(true);
  }

  function openEdit(item: any) {
    setEditingId(item.id);
    setForm({
      type: item.type,
      description: item.description,
      amount: parseFloat(item.amount).toFixed(2),
      dayOfMonth: String(item.dayOfMonth),
      categoryId: item.categoryId ? String(item.categoryId) : "",
      bankAccount: item.bankAccount ?? "",
      bankName: item.bankName ?? "",
      paymentMethod: item.paymentMethod ?? "",
      paymentCardId: item.paymentCardId ? String(item.paymentCardId) : "",
      notes: item.notes ?? "",
    });
    setDialogOpen(true);
  }

  function handleSubmit() {
    if (!form.description.trim() || !form.amount || !form.dayOfMonth) {
      toast.error("Preencha os campos obrigatórios.");
      return;
    }
    if (form.type === "expense" && !form.categoryId) {
      toast.error("Selecione uma categoria para a despesa.");
      return;
    }
    const payload = {
      type: form.type,
      description: form.description.trim(),
      amount: form.amount,
      dayOfMonth: parseInt(form.dayOfMonth),
      categoryId: form.categoryId ? parseInt(form.categoryId) : null,
      bankAccount: form.bankAccount || null,
      bankName: form.bankName || null,
      paymentMethod: (form.paymentMethod || null) as any,
      paymentCardId: form.paymentCardId ? parseInt(form.paymentCardId) : null,
      notes: form.notes || null,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const categories = tab === "income" ? allIncCats : allExpCats;
  const totalMonthly = items.reduce((s, i) => s + parseFloat(i.amount as unknown as string), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Recorrentes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Receitas e despesas fixas mensais</p>
        </div>
        <Button
          onClick={() => openCreate(tab)}
          className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          <Plus className="w-4 h-4" />
          Novo {tab === "income" ? "Recebimento" : "Gasto"} Fixo
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as RecurringType)}>
        <TabsList className="bg-muted/50 rounded-xl p-1">
          <TabsTrigger value="income" className="gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            Receitas Fixas
          </TabsTrigger>
          <TabsTrigger value="expense" className="gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <TrendingDown className="w-4 h-4 text-red-500" />
            Despesas Fixas
          </TabsTrigger>
        </TabsList>

        {/* Summary card */}
        <div className="mt-4 bg-white rounded-2xl border border-border p-5 shadow-sm flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${tab === "income" ? "bg-emerald-50" : "bg-red-50"}`}>
            <RefreshCw className={`w-5 h-5 ${tab === "income" ? "text-emerald-600" : "text-red-500"}`} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">
              Total mensal fixo — {tab === "income" ? "Receitas" : "Despesas"}
            </p>
            <p className={`text-2xl font-bold mt-0.5 ${tab === "income" ? "text-emerald-600" : "text-red-500"}`}>
              {formatCurrency(totalMonthly)}
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-muted-foreground">{items.length} {items.length === 1 ? "item" : "itens"}</p>
          </div>
        </div>

        <TabsContent value="income" className="mt-4">
          <ItemList
            items={items}
            isLoading={isLoading}
            type="income"
            categories={allIncCats}
            cards={cards}
            onEdit={openEdit}
            onDelete={(id) => setDeleteId(id)}
          />
        </TabsContent>

        <TabsContent value="expense" className="mt-4">
          <ItemList
            items={items}
            isLoading={isLoading}
            type="expense"
            categories={allExpCats}
            cards={cards}
            onEdit={openEdit}
            onDelete={(id) => setDeleteId(id)}
          />
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar" : "Novo"} {form.type === "income" ? "Recebimento" : "Gasto"} Fixo
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Descrição *</Label>
                <Input
                  placeholder={form.type === "income" ? "Ex: Salário CLT" : "Ex: Aluguel"}
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
                <Label>Dia do mês *</Label>
                <Select value={form.dayOfMonth} onValueChange={(v) => setForm((f) => ({ ...f, dayOfMonth: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <SelectItem key={d} value={String(d)}>{ordinal(d)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Categoria</Label>
                <Select value={form.categoryId || "none"} onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v === "none" ? "" : v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sem categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem categoria</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Campos específicos para receita */}
            {form.type === "income" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Banco / Conta</Label>
                  <Input
                    placeholder="Ex: Nubank, Itaú..."
                    value={form.bankName}
                    onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Número / Agência</Label>
                  <Input
                    placeholder="Ex: Conta corrente 1234"
                    value={form.bankAccount}
                    onChange={(e) => setForm((f) => ({ ...f, bankAccount: e.target.value }))}
                  />
                </div>
              </div>
            )}

            {/* Campos específicos para despesa */}
            {form.type === "expense" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Forma de pagamento</Label>
                  <Select value={form.paymentMethod || "none"} onValueChange={(v) => setForm((f) => ({ ...f, paymentMethod: v === "none" ? "" : v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Não definido</SelectItem>
                      {Object.entries(PAYMENT_METHOD_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {(form.paymentMethod === "credit" || form.paymentMethod === "debit") && (
                  <div className="space-y-1.5">
                    <Label>Cartão</Label>
                    <Select value={form.paymentCardId || "none"} onValueChange={(v) => setForm((f) => ({ ...f, paymentCardId: v === "none" ? "" : v }))}>
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

            <div className="space-y-1.5">
              <Label>Observações</Label>
              <Input
                placeholder="Opcional..."
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {editingId ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover item recorrente?</AlertDialogTitle>
            <AlertDialogDescription>
              Este item será desativado e não aparecerá mais na lista. Esta ação não pode ser desfeita.
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

// ─── Item List Component ──────────────────────────────────────────────────────
function ItemList({
  items,
  isLoading,
  type,
  categories,
  cards,
  onEdit,
  onDelete,
}: {
  items: any[];
  isLoading: boolean;
  type: RecurringType;
  categories: { id: number; name: string; color: string }[];
  cards: any[];
  onEdit: (item: any) => void;
  onDelete: (id: number) => void;
}) {
  const cardMap = useMemo(() => new Map(cards.map((c) => [c.id, c.name])), [cards]);
  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-border p-8 text-center text-sm text-muted-foreground">
        Carregando...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-border p-10 flex flex-col items-center gap-3 text-muted-foreground">
        <RefreshCw className="w-10 h-10 opacity-20" />
        <p className="text-sm font-medium">Nenhum item recorrente cadastrado</p>
        <p className="text-xs text-center max-w-xs">
          {type === "income"
            ? "Cadastre seu salário, aluguéis recebidos e outras receitas fixas mensais."
            : "Cadastre aluguel, assinaturas, mensalidades e outros gastos fixos mensais."}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="divide-y divide-border">
        {items.map((item) => {
          const cat = item.categoryId ? catMap.get(item.categoryId) : null;
          const amount = parseFloat(item.amount as unknown as string);
          const isIncome = type === "income";

          return (
            <div key={item.id} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/20 transition-colors">
              {/* Category color dot */}
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: cat?.color ?? (isIncome ? "#10b981" : "#ef4444") }}
              />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{item.description}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {cat && (
                    <span className="text-xs text-muted-foreground">{cat.name}</span>
                  )}
                  <span className="text-xs text-muted-foreground">• {ordinal(item.dayOfMonth)}</span>
                  {isIncome && item.bankName && (
                    <span className="inline-flex items-center gap-1 text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                      <Building2 className="w-3 h-3" />
                      {item.bankName}
                    </span>
                  )}
                  {!isIncome && item.paymentMethod && (
                    <span className="inline-flex items-center gap-1 text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                      {PAYMENT_METHOD_ICONS[item.paymentMethod]}
                      {PAYMENT_METHOD_LABELS[item.paymentMethod]}
                      {item.paymentCardId && cardMap.get(item.paymentCardId) && (
                        <> — {cardMap.get(item.paymentCardId)}</>
                      )}
                    </span>
                  )}
                </div>
              </div>

              {/* Amount */}
              <p className={`text-base font-bold flex-shrink-0 ${isIncome ? "text-emerald-600" : "text-red-500"}`}>
                {isIncome ? "+" : "-"}{formatCurrency(amount)}
              </p>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => onEdit(item)}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDelete(item.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-muted-foreground hover:text-red-500"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
