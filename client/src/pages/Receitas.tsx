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
  TrendingUp,
  RefreshCw,
  Tag,
} from "lucide-react";

const DEFAULT_CATEGORIES = [
  { id: -1, name: "Salário", color: "#10b981" },
  { id: -2, name: "Freelance", color: "#6366f1" },
  { id: -3, name: "Investimentos", color: "#f59e0b" },
  { id: -4, name: "Outros", color: "#8b5cf6" },
];

type IncomeForm = {
  description: string;
  amount: string;
  date: string;
  categoryId: string;
  isRecurring: boolean;
  notes: string;
};

const emptyForm: IncomeForm = {
  description: "",
  amount: "",
  date: new Date().toISOString().split("T")[0],
  categoryId: "",
  isRecurring: false,
  notes: "",
};

export default function Receitas() {
  const [month, setMonth] = useState(getCurrentMonth);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<IncomeForm>(emptyForm);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: incomes = [], isLoading } = trpc.incomes.list.useQuery({ month });
  const { data: categories = [] } = trpc.incomeCategories.list.useQuery();

  const allCategories = useMemo(() => {
    const custom = categories.map((c) => ({ id: c.id, name: c.name, color: c.color }));
    return [...DEFAULT_CATEGORIES, ...custom];
  }, [categories]);

  const createMutation = trpc.incomes.create.useMutation({
    onSuccess: () => {
      utils.incomes.list.invalidate();
      utils.dashboard.summary.invalidate();
      toast.success("Receita adicionada!");
      setOpen(false);
      setForm(emptyForm);
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.incomes.update.useMutation({
    onSuccess: () => {
      utils.incomes.list.invalidate();
      utils.dashboard.summary.invalidate();
      toast.success("Receita atualizada!");
      setOpen(false);
      setEditId(null);
      setForm(emptyForm);
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.incomes.delete.useMutation({
    onSuccess: () => {
      utils.incomes.list.invalidate();
      utils.dashboard.summary.invalidate();
      toast.success("Receita removida.");
      setDeleteId(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const totalMonth = useMemo(
    () => incomes.reduce((sum, i) => sum + parseFloat(String(i.amount)), 0),
    [incomes]
  );

  function openCreate() {
    setEditId(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(income: (typeof incomes)[0]) {
    setEditId(income.id);
    setForm({
      description: income.description,
      amount: String(income.amount),
      date: String(income.date).split("T")[0],
      categoryId: income.categoryId ? String(income.categoryId) : "",
      isRecurring: income.isRecurring,
      notes: income.notes ?? "",
    });
    setOpen(true);
  }

  function handleSubmit() {
    if (!form.description || !form.amount || !form.date) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    const payload = {
      description: form.description,
      amount: form.amount,
      date: form.date,
      categoryId: form.categoryId ? parseInt(form.categoryId) : null,
      isRecurring: form.isRecurring,
      notes: form.notes || null,
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

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Receitas</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Gerencie suas entradas financeiras</p>
        </div>
        <div className="flex items-center gap-3">
          <MonthPicker value={month} onChange={setMonth} />
          <Button onClick={openCreate} size="sm" className="gap-2 rounded-full">
            <Plus className="w-4 h-4" />
            Nova Receita
          </Button>
        </div>
      </div>

      {/* Summary Card */}
      <AnimatedContent delay={0.05}>
        <SpotlightCard className="p-5 flex items-center gap-4" spotlightColor="rgba(16,185,129,0.08)">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total de Receitas no Mês</p>
            <p className="text-2xl font-bold text-emerald-600 tabular-nums">
              <CurrencyCountUp value={totalMonth} />
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-muted-foreground font-medium">Lançamentos</p>
            <p className="text-xl font-semibold text-foreground">{incomes.length}</p>
          </div>
        </SpotlightCard>
      </AnimatedContent>

      {/* Table */}
      <AnimatedContent delay={0.1}>
      <div className="card-premium overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Carregando...</div>
        ) : incomes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground">
            <TrendingUp className="w-9 h-9 opacity-25" />
            <p className="text-sm">Nenhuma receita registrada neste mês.</p>
            <Button variant="outline" size="sm" onClick={openCreate} className="gap-2 rounded-full">
              <Plus className="w-4 h-4" /> Adicionar receita
            </Button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                <th className="text-left text-xs font-semibold text-muted-foreground px-6 py-3 uppercase tracking-wider">Descrição</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 uppercase tracking-wider hidden sm:table-cell">Categoria</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 uppercase tracking-wider hidden md:table-cell">Data</th>
                <th className="text-right text-xs font-semibold text-muted-foreground px-6 py-3 uppercase tracking-wider">Valor</th>
                <th className="px-4 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {incomes.map((income, idx) => {
                const cat = getCategoryInfo(income.categoryId);
                return (
                  <tr
                    key={income.id}
                    className="hover:bg-muted/20 transition-colors group"
                    style={{ animation: "row-in 0.3s ease forwards", animationDelay: `${idx * 0.04}s`, opacity: 0 }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-foreground">{income.description}</span>
                        {income.isRecurring && (
                          <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
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
                      {formatDate(String(income.date))}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-semibold text-emerald-600">{formatCurrency(String(income.amount))}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => openEdit(income)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-lg text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(income.id)}
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editId ? "Editar Receita" : "Nova Receita"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Descrição *</Label>
              <Input
                placeholder="Ex: Salário, Freelance..."
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Valor (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Data *</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Select
                value={form.categoryId || "none"}
                onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v === "none" ? "" : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem categoria</SelectItem>
                  {allCategories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Observações</Label>
              <Input
                placeholder="Opcional..."
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="recurring"
                checked={form.isRecurring}
                onChange={(e) => setForm((f) => ({ ...f, isRecurring: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="recurring" className="cursor-pointer font-normal">
                Receita recorrente (mensal)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editId ? "Salvar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Remover Receita</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Tem certeza que deseja remover esta receita? Esta ação não pode ser desfeita.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
              disabled={deleteMutation.isPending}
            >
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
