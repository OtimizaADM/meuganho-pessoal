import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
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
import { Plus, Trash2, ShoppingCart, CreditCard, Calendar, Layers, Pencil } from "lucide-react";

const DEFAULT_CATEGORIES = [
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

type EditForm = { description: string; categoryId: string; notes: string };
const emptyEditForm: EditForm = { description: "", categoryId: "", notes: "" };

type InstallmentForm = {
  creditCardId: string;
  description: string;
  totalAmount: string;
  installmentCount: string;
  firstInstallmentDate: string;
  categoryId: string;
  notes: string;
};

const emptyForm: InstallmentForm = {
  creditCardId: "",
  description: "",
  totalAmount: "",
  installmentCount: "2",
  firstInstallmentDate: new Date().toISOString().split("T")[0],
  categoryId: "",
  notes: "",
};

export default function Parcelamentos() {
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditForm>(emptyEditForm);
  const [form, setForm] = useState<InstallmentForm>(emptyForm);

  const utils = trpc.useUtils();
  const { data: installments = [], isLoading } = trpc.installments.list.useQuery();
  const { data: cards = [] } = trpc.creditCards.list.useQuery();
  const { data: categories = [] } = trpc.expenseCategories.list.useQuery();

  const allCategories = useMemo(() => {
    const custom = categories.map((c) => ({ id: c.id, name: c.name, color: c.color }));
    return [...DEFAULT_CATEGORIES, ...custom];
  }, [categories]);

  const installmentAmount = useMemo(() => {
    const total = parseFloat(form.totalAmount);
    const count = parseInt(form.installmentCount);
    if (!total || !count || count < 1) return 0;
    return total / count;
  }, [form.totalAmount, form.installmentCount]);

  const updateMutation = trpc.installments.update.useMutation({
    onSuccess: () => {
      utils.installments.list.invalidate();
      utils.creditCardTransactions.listByMonth.invalidate();
      utils.dashboard.summary.invalidate();
      toast.success("Parcelamento atualizado!");
      setEditId(null);
      setEditForm(emptyEditForm);
    },
    onError: (e) => toast.error(e.message),
  });

  const createMutation = trpc.installments.create.useMutation({
    onSuccess: () => {
      utils.installments.list.invalidate();
      utils.creditCardTransactions.listByMonth.invalidate();
      utils.dashboard.summary.invalidate();
      toast.success("Parcelamento criado! As parcelas foram lançadas automaticamente.");
      setOpen(false);
      setForm(emptyForm);
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.installments.delete.useMutation({
    onSuccess: () => {
      utils.installments.list.invalidate();
      utils.creditCardTransactions.listByMonth.invalidate();
      utils.dashboard.summary.invalidate();
      toast.success("Parcelamento removido. Todas as parcelas foram excluídas.");
      setDeleteId(null);
    },
    onError: (e) => toast.error(e.message),
  });

  function handleSubmit() {
    if (!form.description || !form.totalAmount || !form.installmentCount || !form.firstInstallmentDate) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    if (!form.categoryId) {
      toast.error("Selecione uma categoria.");
      return;
    }
    const count = parseInt(form.installmentCount);
    if (count < 2 || count > 120) {
      toast.error("Número de parcelas deve ser entre 2 e 120.");
      return;
    }
    createMutation.mutate({
      creditCardId: form.creditCardId ? parseInt(form.creditCardId) : null,
      description: form.description,
      totalAmount: form.totalAmount,
      installmentCount: count,
      installmentAmount: installmentAmount.toFixed(2),
      firstInstallmentDate: form.firstInstallmentDate,
      categoryId: parseInt(form.categoryId),
      notes: form.notes || null,
    });
  }

  function handleEditSubmit() {
    if (!editForm.description) { toast.error("Preencha a descrição."); return; }
    if (!editForm.categoryId) { toast.error("Selecione uma categoria."); return; }
    if (!editId) return;
    updateMutation.mutate({ id: editId, description: editForm.description, categoryId: parseInt(editForm.categoryId), notes: editForm.notes || null });
  }

  function openEdit(purchase: (typeof installments)[0]) {
    setEditId(purchase.id);
    setEditForm({ description: purchase.description, categoryId: purchase.categoryId ? String(purchase.categoryId) : "", notes: purchase.notes ?? "" });
  }

  function getCardById(id: number | null) {
    if (!id) return null;
    return cards.find((c) => c.id === id) ?? null;
  }

  function getCategoryById(id: number | null) {
    if (!id) return null;
    return allCategories.find((c) => c.id === id) ?? null;
  }

  function getInstallmentProgress(purchase: (typeof installments)[0]) {
    const firstDate = new Date(purchase.firstInstallmentDate as unknown as string);
    const now = new Date();
    const monthsPassed = (now.getFullYear() - firstDate.getFullYear()) * 12 + (now.getMonth() - firstDate.getMonth());
    const paid = Math.min(Math.max(monthsPassed + 1, 0), purchase.installmentCount);
    return { paid, total: purchase.installmentCount };
  }

  const totalActive = useMemo(() => {
    return installments.reduce((sum, i) => sum + parseFloat(String(i.installmentAmount)), 0);
  }, [installments]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Parcelamentos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Registre uma vez — as parcelas aparecem automaticamente nos meses seguintes
          </p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setOpen(true); }} size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Parcelamento
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-border p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
            <ShoppingCart className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Parcelamentos Ativos</p>
            <p className="text-2xl font-bold text-foreground">{installments.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-border p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
            <Layers className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Parcela Mensal Total</p>
            <p className="text-2xl font-bold text-indigo-600">{formatCurrency(totalActive)}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-border p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
            <Calendar className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Parcelado</p>
            <p className="text-2xl font-bold text-purple-600">
              {formatCurrency(installments.reduce((s, i) => s + parseFloat(String(i.totalAmount)), 0))}
            </p>
          </div>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48 text-muted-foreground bg-white rounded-2xl border border-border">
          Carregando...
        </div>
      ) : installments.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground bg-white rounded-2xl border border-border">
          <ShoppingCart className="w-10 h-10 opacity-30" />
          <p className="text-sm">Nenhum parcelamento cadastrado.</p>
          <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Adicionar parcelamento
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {installments.map((purchase) => {
            const card = getCardById(purchase.creditCardId);
            const category = getCategoryById(purchase.categoryId);
            const progress = getInstallmentProgress(purchase);
            const progressPct = Math.round((progress.paid / progress.total) * 100);
            const remaining = purchase.installmentCount - progress.paid;

            return (
              <div key={purchase.id} className="bg-white rounded-2xl border border-border p-5 shadow-sm group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground">{purchase.description}</h3>
                      {card && (
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded-lg flex items-center gap-1"
                          style={{ backgroundColor: card.color + "20", color: card.color }}
                        >
                          <CreditCard className="w-3 h-3" />
                          {card.name}
                        </span>
                      )}
                      {!card && (
                        <Badge variant="secondary" className="text-xs">Débito/Dinheiro</Badge>
                      )}
                      {category && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-lg" style={{ backgroundColor: category.color + "20", color: category.color }}>
                          {category.name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span>
                        {formatCurrency(String(purchase.installmentAmount))}/mês
                      </span>
                      <span>·</span>
                      <span>
                        {progress.paid}/{progress.total} parcelas
                      </span>
                      <span>·</span>
                      <span>
                        {remaining > 0 ? `${remaining} restantes` : "Concluído"}
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${progressPct}%`,
                          backgroundColor: card?.color ?? "#6366f1",
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-foreground">{formatCurrency(String(purchase.totalAmount))}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {purchase.installmentCount}x de {formatCurrency(String(purchase.installmentAmount))}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      1ª parcela: {formatDate(String(purchase.firstInstallmentDate))}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="sm" className="gap-1.5 h-8 text-muted-foreground hover:text-foreground" onClick={() => openEdit(purchase)}>
                    <Pencil className="w-3.5 h-3.5" /> Editar
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive gap-1.5 h-8" onClick={() => setDeleteId(purchase.id)}>
                    <Trash2 className="w-3.5 h-3.5" /> Remover
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Parcelamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Descrição *</Label>
              <Input
                placeholder="Ex: Notebook, Geladeira, Viagem..."
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Valor Total (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={form.totalAmount}
                  onChange={(e) => setForm((f) => ({ ...f, totalAmount: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Nº de Parcelas *</Label>
                <Input
                  type="number"
                  min="2"
                  max="120"
                  value={form.installmentCount}
                  onChange={(e) => setForm((f) => ({ ...f, installmentCount: e.target.value }))}
                />
              </div>
            </div>

            {/* Preview */}
            {installmentAmount > 0 && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-sm">
                <p className="text-muted-foreground">Valor de cada parcela:</p>
                <p className="text-lg font-bold text-primary">{formatCurrency(installmentAmount)}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Data da 1ª Parcela *</Label>
              <Input
                type="date"
                value={form.firstInstallmentDate}
                onChange={(e) => setForm((f) => ({ ...f, firstInstallmentDate: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Cartão de Crédito</Label>
              <Select
                value={form.creditCardId || "none"}
                onValueChange={(v) => setForm((f) => ({ ...f, creditCardId: v === "none" ? "" : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Débito / Dinheiro</SelectItem>
                  {cards.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Categoria *</Label>
              <Select value={form.categoryId || ""} onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}>
                <SelectTrigger className={!form.categoryId ? "border-destructive/50" : ""}>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {DEFAULT_CATEGORIES.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: c.color }} />{c.name}</span>
                    </SelectItem>
                  ))}
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: c.color }} />{c.name}</span>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Criando..." : "Criar Parcelamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editId !== null} onOpenChange={(o) => { if (!o) { setEditId(null); setEditForm(emptyEditForm); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Editar Parcelamento</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Descrição *</Label>
              <Input placeholder="Descrição do parcelamento" value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Categoria *</Label>
              <Select value={editForm.categoryId || ""} onValueChange={(v) => setEditForm((f) => ({ ...f, categoryId: v }))}>
                <SelectTrigger className={!editForm.categoryId ? "border-destructive/50" : ""}>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {DEFAULT_CATEGORIES.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: c.color }} />{c.name}</span>
                    </SelectItem>
                  ))}
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: c.color }} />{c.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Observações</Label>
              <Input placeholder="Opcional..." value={editForm.notes} onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
            <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
              A alteração da descrição e categoria será aplicada a todas as parcelas geradas automaticamente.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditId(null); setEditForm(emptyEditForm); }}>Cancelar</Button>
            <Button onClick={handleEditSubmit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Remover Parcelamento</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Todas as parcelas geradas serão removidas dos lançamentos do cartão. Esta ação não pode ser desfeita.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
              disabled={deleteMutation.isPending}
            >
              Remover Tudo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
