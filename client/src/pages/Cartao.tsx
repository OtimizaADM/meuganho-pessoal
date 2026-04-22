import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AnimatedContent } from "@/components/ui/animated-content";
import { CurrencyCountUp } from "@/components/ui/count-up";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  CreditCard, Plus, Trash2, ChevronLeft, ChevronRight,
  Repeat, ShoppingCart, Layers, Zap, Settings, AlertCircle, Pencil
} from "lucide-react";

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
import { MonthPicker } from "@/components/MonthPicker";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getInvoiceMonth(purchaseDate: string, closingDay: number): string {
  const [year, month, day] = purchaseDate.split("-").map(Number);
  if (day > closingDay) {
    const next = new Date(year, month, 1); // month is 0-indexed, so month = next month
    return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
  }
  return `${year}-${String(month).padStart(2, "0")}`;
}

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// ─── Card Visual ──────────────────────────────────────────────────────────────
function CreditCardVisual({ card }: { card: any }) {
  return (
    <div
      className="relative rounded-2xl p-5 text-white shadow-lg overflow-hidden min-w-[220px] max-w-[260px]"
      style={{ background: `linear-gradient(135deg, ${card.color} 0%, ${card.color}cc 100%)` }}
    >
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-4 right-4 w-24 h-24 rounded-full border-2 border-white" />
        <div className="absolute top-8 right-10 w-16 h-16 rounded-full border-2 border-white" />
      </div>
      <div className="relative">
        <div className="flex justify-between items-start mb-6">
          <CreditCard className="w-8 h-8 opacity-80" />
          <span className="text-xs font-medium opacity-70 uppercase tracking-wider">{card.brand}</span>
        </div>
        <div className="text-lg font-mono tracking-widest mb-1">
          •••• •••• •••• {card.lastFourDigits || "••••"}
        </div>
        <div className="text-sm font-medium opacity-90 truncate">{card.name}</div>
        <div className="flex justify-between mt-2 text-xs opacity-70">
          <span>Fecha dia {card.closingDay}</span>
          <span>Vence dia {card.dueDay}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Section Component ────────────────────────────────────────────────────────
function InvoiceSection({
  icon: Icon,
  title,
  subtitle,
  total,
  color,
  children,
  emptyMessage,
}: {
  icon: any;
  title: string;
  subtitle: string;
  total: number;
  color: string;
  children: React.ReactNode;
  emptyMessage: string;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="text-left">
            <div className="font-semibold text-sm text-foreground">{title}</div>
            <div className="text-xs text-muted-foreground">{subtitle}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-bold text-sm text-foreground">{formatCurrency(total)}</span>
          <ChevronLeft className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "-rotate-90" : "rotate-0"}`} />
        </div>
      </button>
      {open && (
        <div className="border-t border-border">
          {children}
          {total === 0 && (
            <div className="flex items-center gap-2 px-5 py-4 text-sm text-muted-foreground">
              <AlertCircle className="w-4 h-4" />
              {emptyMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Cartao() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("faturas");

  // Dialogs
  const [showNewTransaction, setShowNewTransaction] = useState(false);
  const [showNewCard, setShowNewCard] = useState(false);
  const [editTxId, setEditTxId] = useState<number | null>(null);
  const [editTxForm, setEditTxForm] = useState({ description: "", amount: "", categoryId: "", notes: "" });

  // Form states
  const [txForm, setTxForm] = useState({
    creditCardId: "",
    description: "",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    transactionType: "credit" as "credit" | "debit",
    categoryId: "",
    notes: "",
  });
  const [cardForm, setCardForm] = useState({
    name: "",
    lastFourDigits: "",
    brand: "Visa",
    creditLimit: "",
    closingDay: "10",
    dueDay: "15",
    color: "#6366f1",
  });

  // Queries
  const { data: cards = [], refetch: refetchCards } = trpc.creditCards.list.useQuery();
  const { data: customCategories = [] } = trpc.expenseCategories.list.useQuery();
  const allCategories = useMemo(() => [
    ...DEFAULT_CATEGORIES,
    ...customCategories.map((c) => ({ id: c.id, name: c.name, color: c.color })),
  ], [customCategories]);
  const { data: breakdown, refetch: refetchBreakdown } = trpc.creditCardTransactions.invoiceBreakdown.useQuery(
    { cardId: selectedCardId, invoiceMonth: selectedMonth },
    { enabled: true }
  );

  // Computed invoice month for new transaction
  const computedInvoiceMonth = useMemo(() => {
    if (txForm.transactionType === "debit") return selectedMonth;
    if (!txForm.creditCardId || !txForm.date) return selectedMonth;
    const card = cards.find((c) => c.id === Number(txForm.creditCardId));
    if (!card) return selectedMonth;
    return getInvoiceMonth(txForm.date, card.closingDay);
  }, [txForm.creditCardId, txForm.date, txForm.transactionType, cards, selectedMonth]);

  // Mutations
  const createTx = trpc.creditCardTransactions.create.useMutation({
    onSuccess: () => { refetchBreakdown(); setShowNewTransaction(false); resetTxForm(); toast.success("Lançamento adicionado!"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteTx = trpc.creditCardTransactions.delete.useMutation({
    onSuccess: () => { refetchBreakdown(); toast.success("Lançamento removido."); },
    onError: (e) => toast.error(e.message),
  });
  const updateTx = trpc.creditCardTransactions.update.useMutation({
    onSuccess: () => { refetchBreakdown(); setEditTxId(null); toast.success("Lançamento atualizado!"); },
    onError: (e) => toast.error(e.message),
  });
  const createCard = trpc.creditCards.create.useMutation({
    onSuccess: () => { refetchCards(); setShowNewCard(false); resetCardForm(); toast.success("Cartão adicionado!"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteCard = trpc.creditCards.delete.useMutation({
    onSuccess: () => { refetchCards(); toast.success("Cartão removido."); },
    onError: (e) => toast.error(e.message),
  });

  function resetTxForm() {
    setTxForm({ creditCardId: "", description: "", amount: "", date: new Date().toISOString().slice(0, 10), transactionType: "credit", categoryId: "", notes: "" });
  }
  function resetCardForm() {
    setCardForm({ name: "", lastFourDigits: "", brand: "Visa", creditLimit: "", closingDay: "10", dueDay: "15", color: "#6366f1" });
  }

  function openEditTx(tx: any) {
    setEditTxId(tx.id);
    setEditTxForm({ description: tx.description, amount: String(parseFloat(tx.amount)), categoryId: tx.categoryId ? String(tx.categoryId) : "", notes: tx.notes ?? "" });
  }
  function handleEditTxSubmit() {
    if (!editTxForm.description || !editTxForm.amount) { toast.error("Preencha descrição e valor."); return; }
    if (!editTxForm.categoryId) { toast.error("Selecione uma categoria."); return; }
    if (!editTxId) return;
    updateTx.mutate({ id: editTxId, description: editTxForm.description, amount: editTxForm.amount, categoryId: parseInt(editTxForm.categoryId), notes: editTxForm.notes || null });
  }
  function handleSubmitTx(e: React.FormEvent) {
    e.preventDefault();
    if (!txForm.creditCardId || !txForm.description || !txForm.amount) { toast.error("Preencha todos os campos obrigatórios."); return; }
    if (!txForm.categoryId) { toast.error("Selecione uma categoria."); return; }
    createTx.mutate({
      creditCardId: Number(txForm.creditCardId),
      description: txForm.description,
      amount: txForm.amount,
      date: txForm.date,
      invoiceMonth: computedInvoiceMonth,
      transactionType: txForm.transactionType,
      isPaid: txForm.transactionType === "debit",
      categoryId: txForm.categoryId ? Number(txForm.categoryId) : null,
      notes: txForm.notes || null,
    });
  }

  function handleSubmitCard(e: React.FormEvent) {
    e.preventDefault();
    if (!cardForm.name || !cardForm.closingDay || !cardForm.dueDay) { toast.error("Preencha todos os campos obrigatórios."); return; }
    createCard.mutate({
      name: cardForm.name,
      lastFourDigits: cardForm.lastFourDigits || null,
      brand: cardForm.brand,
      creditLimit: cardForm.creditLimit || null,
      closingDay: Number(cardForm.closingDay),
      dueDay: Number(cardForm.dueDay),
      color: cardForm.color,
    });
  }

  const grandTotal = breakdown?.grandTotal ?? 0;
  const filteredCards = selectedCardId ? cards.filter((c) => c.id === selectedCardId) : cards;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Cartão de Crédito</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Gerencie seus cartões e faturas</p>
        </div>
          <div className="flex items-center gap-2">
            <MonthPicker value={selectedMonth} onChange={setSelectedMonth} />
            <Button onClick={() => setShowNewTransaction(true)} className="gap-2">
              <Plus className="w-4 h-4" /> Novo Lançamento
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="faturas">Faturas</TabsTrigger>
            <TabsTrigger value="cartoes">Meus Cartões</TabsTrigger>
          </TabsList>

          {/* ── Faturas Tab ─────────────────────────────────────────────── */}
          <TabsContent value="faturas" className="space-y-5 mt-5">
            {/* Card filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant={selectedCardId === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCardId(null)}
              >
                Todos
              </Button>
              {cards.map((card) => (
                <Button
                  key={card.id}
                  variant={selectedCardId === card.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCardId(card.id)}
                  className="gap-2"
                >
                  <div className="w-2 h-2 rounded-full" style={{ background: card.color }} />
                  {card.name} {card.lastFourDigits ? `••${card.lastFourDigits}` : ""}
                </Button>
              ))}
            </div>

            {/* Total da fatura */}
            <AnimatedContent delay={0.05}>
            <SpotlightCard className="p-5 flex items-center justify-between" spotlightColor="rgba(99,102,241,0.08)">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Total da Fatura</p>
                  <p className="text-2xl font-bold text-primary tabular-nums">
                    <CurrencyCountUp value={grandTotal} />
                  </p>
                </div>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <div className="font-medium text-foreground">{selectedMonth}</div>
                <div>{cards.length} cartão{cards.length !== 1 ? "ões" : ""}</div>
              </div>
            </SpotlightCard>
            </AnimatedContent>

            {/* 4 Sections */}
            <AnimatedContent delay={0.1}>
            <div className="space-y-3">
              {/* 1. Assinaturas Fixas */}
              <InvoiceSection
                icon={Repeat}
                title="Assinaturas Fixas"
                subtitle="Recorrentes vinculadas ao cartão"
                total={breakdown?.totalSubscriptions ?? 0}
                color="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                emptyMessage="Nenhuma assinatura vinculada a este cartão. Cadastre em Recorrentes com pagamento Crédito."
              >
                {(breakdown?.subscriptions ?? []).map((sub: any) => (
                  <div key={sub.id} className="flex items-center justify-between px-5 py-3 border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-purple-400" />
                      <div>
                        <div className="text-sm font-medium text-foreground">{sub.description}</div>
                        <div className="text-xs text-muted-foreground">Dia {sub.dayOfMonth} de cada mês</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-purple-600 border-purple-200 text-xs">Recorrente</Badge>
                      <span className="font-semibold text-sm text-foreground">{formatCurrency(parseFloat(sub.amount))}</span>
                    </div>
                  </div>
                ))}
              </InvoiceSection>

              {/* 2. Parcelamentos */}
              <InvoiceSection
                icon={Layers}
                title="Parcelamentos"
                subtitle="Compras parceladas no cartão"
                total={breakdown?.totalInstallments ?? 0}
                color="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                emptyMessage="Nenhum parcelamento nesta fatura."
              >
                {(breakdown?.installments ?? []).map((tx: any) => (
                  <div key={tx.id} className="flex items-center justify-between px-5 py-3 border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-amber-400" />
                      <div>
                        <div className="text-sm font-medium text-foreground">{tx.description}</div>
                        <div className="text-xs text-muted-foreground">{formatDate(tx.date)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-amber-600 border-amber-200 text-xs">Parcela</Badge>
                      <span className="font-semibold text-sm text-foreground">{formatCurrency(parseFloat(tx.amount))}</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => openEditTx(tx)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteTx.mutate({ id: tx.id })}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </InvoiceSection>

              {/* 3. Despesas Esporádicas */}
              <InvoiceSection
                icon={ShoppingCart}
                title="Despesas Esporádicas"
                subtitle="Compras avulsas no crédito"
                total={breakdown?.totalSporadic ?? 0}
                color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                emptyMessage="Nenhuma despesa esporádica nesta fatura."
              >
                {(breakdown?.sporadic ?? []).map((tx: any) => (
                  <div key={tx.id} className="flex items-center justify-between px-5 py-3 border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-400" />
                      <div>
                        <div className="text-sm font-medium text-foreground">{tx.description}</div>
                        <div className="text-xs text-muted-foreground">{formatDate(tx.date)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-blue-600 border-blue-200 text-xs">Crédito</Badge>
                      <span className="font-semibold text-sm text-foreground">{formatCurrency(parseFloat(tx.amount))}</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => openEditTx(tx)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteTx.mutate({ id: tx.id })}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </InvoiceSection>

              {/* 4. Débito Automático */}
              <InvoiceSection
                icon={Zap}
                title="Débito Automático"
                subtitle="Lançamentos debitados diretamente"
                total={breakdown?.totalDebit ?? 0}
                color="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                emptyMessage="Nenhum débito automático nesta fatura."
              >
                {(breakdown?.debit ?? []).map((tx: any) => (
                  <div key={tx.id} className="flex items-center justify-between px-5 py-3 border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                      <div>
                        <div className="text-sm font-medium text-foreground">{tx.description}</div>
                        <div className="text-xs text-muted-foreground">{formatDate(tx.date)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-green-600 border-green-200 text-xs">Débito</Badge>
                      <Badge className="bg-green-100 text-green-700 border-0 text-xs">Pago</Badge>
                      <span className="font-semibold text-sm text-foreground">{formatCurrency(parseFloat(tx.amount))}</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => openEditTx(tx)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteTx.mutate({ id: tx.id })}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </InvoiceSection>
            </div>
            </AnimatedContent>
          </TabsContent>

          {/* ── Meus Cartões Tab ─────────────────────────────────────────── */}
          <TabsContent value="cartoes" className="mt-5">
            <div className="flex justify-end mb-4">
              <Button onClick={() => setShowNewCard(true)} variant="outline" className="gap-2">
                <Plus className="w-4 h-4" /> Novo Cartão
              </Button>
            </div>
            {cards.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Nenhum cartão cadastrado</p>
                <p className="text-sm mt-1">Adicione seu primeiro cartão para começar.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {cards.map((card) => (
                  <div key={card.id} className="relative group">
                    <CreditCardVisual card={card} />
                    <div className="mt-3 flex items-center justify-between px-1">
                      <div className="text-xs text-muted-foreground">
                        {card.creditLimit ? `Limite: ${formatCurrency(parseFloat(card.creditLimit as string))}` : "Sem limite cadastrado"}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => deleteCard.mutate({ id: card.id })}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

      {/* ── Dialog: Novo Lançamento ────────────────────────────────────────── */}
      <Dialog open={showNewTransaction} onOpenChange={setShowNewTransaction}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Lançamento</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitTx} className="space-y-4">
            {/* Tipo: Crédito / Débito */}
            <div>
              <Label>Tipo de Lançamento</Label>
              <div className="flex gap-2 mt-1.5">
                <button
                  type="button"
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${txForm.transactionType === "credit" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted/50"}`}
                  onClick={() => setTxForm((f) => ({ ...f, transactionType: "credit" }))}
                >
                  💳 Crédito
                </button>
                <button
                  type="button"
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${txForm.transactionType === "debit" ? "bg-green-600 text-white border-green-600" : "border-border text-muted-foreground hover:bg-muted/50"}`}
                  onClick={() => setTxForm((f) => ({ ...f, transactionType: "debit" }))}
                >
                  ⚡ Débito
                </button>
              </div>
              {txForm.transactionType === "debit" && (
                <p className="text-xs text-green-600 mt-1">Débito é marcado como pago automaticamente.</p>
              )}
            </div>

            <div>
              <Label>Cartão *</Label>
              <Select value={txForm.creditCardId} onValueChange={(v) => setTxForm((f) => ({ ...f, creditCardId: v }))}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Selecione o cartão" />
                </SelectTrigger>
                <SelectContent>
                  {cards.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name} {c.lastFourDigits ? `••${c.lastFourDigits}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Descrição *</Label>
              <Input className="mt-1.5" placeholder="Ex: Supermercado, Netflix..." value={txForm.description} onChange={(e) => setTxForm((f) => ({ ...f, description: e.target.value }))} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Valor (R$) *</Label>
                <Input className="mt-1.5" type="number" step="0.01" placeholder="0,00" value={txForm.amount} onChange={(e) => setTxForm((f) => ({ ...f, amount: e.target.value }))} />
              </div>
              <div>
                <Label>Data da Compra</Label>
                <Input className="mt-1.5" type="date" value={txForm.date} onChange={(e) => setTxForm((f) => ({ ...f, date: e.target.value }))} />
              </div>
            </div>

            <div>
              <Label>Categoria *</Label>
              <Select value={txForm.categoryId || ""} onValueChange={(v) => setTxForm((f) => ({ ...f, categoryId: v }))}>
                <SelectTrigger className={`mt-1.5 ${!txForm.categoryId ? "border-destructive/50" : ""}`}>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {allCategories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: c.color }} />{c.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Fatura calculada */}
            {txForm.transactionType === "credit" && txForm.creditCardId && txForm.date && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg px-4 py-2.5 text-sm">
                <span className="text-muted-foreground">Entrará na fatura de: </span>
                <span className="font-semibold text-primary">{computedInvoiceMonth}</span>
                {computedInvoiceMonth !== selectedMonth && (
                  <span className="text-xs text-amber-600 ml-2">(próximo mês — após o fechamento)</span>
                )}
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNewTransaction(false)}>Cancelar</Button>
              <Button type="submit" disabled={createTx.isPending}>
                {createTx.isPending ? "Salvando..." : "Adicionar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Editar Lançamento ──────────────────────────────────────────────────────── */}
      <Dialog open={editTxId !== null} onOpenChange={(o) => { if (!o) setEditTxId(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Editar Lançamento</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Descrição *</Label>
              <Input className="mt-1.5" value={editTxForm.description} onChange={(e) => setEditTxForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div>
              <Label>Valor (R$) *</Label>
              <Input className="mt-1.5" type="number" step="0.01" value={editTxForm.amount} onChange={(e) => setEditTxForm((f) => ({ ...f, amount: e.target.value }))} />
            </div>
            <div>
              <Label>Categoria *</Label>
              <Select value={editTxForm.categoryId || ""} onValueChange={(v) => setEditTxForm((f) => ({ ...f, categoryId: v }))}>
                <SelectTrigger className={`mt-1.5 ${!editTxForm.categoryId ? "border-destructive/50" : ""}`}>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {allCategories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: c.color }} />{c.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Observações</Label>
              <Input className="mt-1.5" placeholder="Opcional..." value={editTxForm.notes} onChange={(e) => setEditTxForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setEditTxId(null)}>Cancelar</Button>
            <Button onClick={handleEditTxSubmit} disabled={updateTx.isPending}>
              {updateTx.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Novo Cartão ────────────────────────────────────────────────────────── */}
      <Dialog open={showNewCard} onOpenChange={setShowNewCard}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Cartão</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitCard} className="space-y-4">
            <div>
              <Label>Nome do Cartão *</Label>
              <Input className="mt-1.5" placeholder="Ex: Santander, Nubank..." value={cardForm.name} onChange={(e) => setCardForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Últimos 4 dígitos</Label>
                <Input className="mt-1.5" maxLength={4} placeholder="0000" value={cardForm.lastFourDigits} onChange={(e) => setCardForm((f) => ({ ...f, lastFourDigits: e.target.value }))} />
              </div>
              <div>
                <Label>Bandeira</Label>
                <Select value={cardForm.brand} onValueChange={(v) => setCardForm((f) => ({ ...f, brand: v }))}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Visa", "Mastercard", "Elo", "Amex", "Hipercard", "Outro"].map((b) => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Dia Fechamento *</Label>
                <Input className="mt-1.5" type="number" min={1} max={31} value={cardForm.closingDay} onChange={(e) => setCardForm((f) => ({ ...f, closingDay: e.target.value }))} />
              </div>
              <div>
                <Label>Dia Vencimento *</Label>
                <Input className="mt-1.5" type="number" min={1} max={31} value={cardForm.dueDay} onChange={(e) => setCardForm((f) => ({ ...f, dueDay: e.target.value }))} />
              </div>
              <div>
                <Label>Cor</Label>
                <Input className="mt-1.5 h-10 p-1 cursor-pointer" type="color" value={cardForm.color} onChange={(e) => setCardForm((f) => ({ ...f, color: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Limite de Crédito (R$)</Label>
              <Input className="mt-1.5" type="number" step="0.01" placeholder="Ex: 5000,00" value={cardForm.creditLimit} onChange={(e) => setCardForm((f) => ({ ...f, creditLimit: e.target.value }))} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNewCard(false)}>Cancelar</Button>
              <Button type="submit" disabled={createCard.isPending}>
                {createCard.isPending ? "Salvando..." : "Adicionar Cartão"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
