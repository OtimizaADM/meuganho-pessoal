import { and, asc, desc, eq, gte, lte, sql, SQL } from "drizzle-orm";
import { PgColumn } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/node-postgres";
import {
  InsertUser,
  users,
  incomes,
  expenses,
  creditCards,
  creditCardTransactions,
  installmentPurchases,
  incomeCategories,
  expenseCategories,
  type InsertIncome,
  type InsertExpense,
  type InsertCreditCard,
  type InsertCreditCardTransaction,
  type InsertInstallmentPurchase,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod", "password"] as const;

  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onConflictDoUpdate({ target: users.openId, set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

// ─── Income Categories ────────────────────────────────────────────────────────
export async function getIncomeCategories(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(incomeCategories).where(eq(incomeCategories.userId, userId)).orderBy(asc(incomeCategories.name));
}

export async function createIncomeCategory(userId: number, name: string, color: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(incomeCategories).values({ userId, name, color });
  return result[0];
}

export async function deleteIncomeCategory(userId: number, id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(incomeCategories).where(and(eq(incomeCategories.id, id), eq(incomeCategories.userId, userId)));
}

// ─── Expense Categories ───────────────────────────────────────────────────────
export async function getExpenseCategories(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(expenseCategories).where(eq(expenseCategories.userId, userId)).orderBy(asc(expenseCategories.name));
}

export async function createExpenseCategory(userId: number, name: string, color: string, icon: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(expenseCategories).values({ userId, name, color, icon });
}

export async function deleteExpenseCategory(userId: number, id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(expenseCategories).where(and(eq(expenseCategories.id, id), eq(expenseCategories.userId, userId)));
}

// ─── Incomes ──────────────────────────────────────────────────────────────────
export async function getIncomes(userId: number, month: string) {
  // month format: "YYYY-MM"
  const db = await getDb();
  if (!db) return [];
  const [year, m] = month.split("-").map(Number);
  const startDate = `${year}-${String(m).padStart(2, "0")}-01`;
  const endDate = `${year}-${String(m).padStart(2, "0")}-31`;
  return db
    .select()
    .from(incomes)
    .where(and(eq(incomes.userId, userId), sql`${incomes.date} >= ${startDate}`, sql`${incomes.date} <= ${endDate}`))
    .orderBy(desc(incomes.date));
}

export async function createIncome(data: InsertIncome) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(incomes).values(data);
  return result;
}

export async function updateIncome(userId: number, id: number, data: Partial<InsertIncome>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(incomes).set(data).where(and(eq(incomes.id, id), eq(incomes.userId, userId)));
}

export async function deleteIncome(userId: number, id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(incomes).where(and(eq(incomes.id, id), eq(incomes.userId, userId)));
}

// ─── Expenses ─────────────────────────────────────────────────────────────────
export async function getExpenses(userId: number, month: string) {
  const db = await getDb();
  if (!db) return [];
  const [year, m] = month.split("-").map(Number);
  const startDate = `${year}-${String(m).padStart(2, "0")}-01`;
  const endDate = `${year}-${String(m).padStart(2, "0")}-31`;
  return db
    .select()
    .from(expenses)
    .where(and(eq(expenses.userId, userId), sql`${expenses.date} >= ${startDate}`, sql`${expenses.date} <= ${endDate}`))
    .orderBy(desc(expenses.date));
}

export async function createExpense(data: InsertExpense) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(expenses).values(data);
}

export async function updateExpense(userId: number, id: number, data: Partial<InsertExpense>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(expenses).set(data).where(and(eq(expenses.id, id), eq(expenses.userId, userId)));
}

export async function deleteExpense(userId: number, id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(expenses).where(and(eq(expenses.id, id), eq(expenses.userId, userId)));
}

// ─── Credit Cards ─────────────────────────────────────────────────────────────
export async function getCreditCards(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(creditCards).where(and(eq(creditCards.userId, userId), eq(creditCards.isActive, true))).orderBy(asc(creditCards.name));
}

export async function createCreditCard(data: InsertCreditCard) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(creditCards).values(data);
}

export async function updateCreditCard(userId: number, id: number, data: Partial<InsertCreditCard>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(creditCards).set(data).where(and(eq(creditCards.id, id), eq(creditCards.userId, userId)));
}

export async function deleteCreditCard(userId: number, id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(creditCards).set({ isActive: false }).where(and(eq(creditCards.id, id), eq(creditCards.userId, userId)));
}

// ─── Credit Card Transactions ─────────────────────────────────────────────────
export async function getCreditCardTransactions(userId: number, invoiceMonth: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(creditCardTransactions)
    .where(and(eq(creditCardTransactions.userId, userId), eq(creditCardTransactions.invoiceMonth, invoiceMonth)))
    .orderBy(desc(creditCardTransactions.date));
}

export async function getCreditCardTransactionsByCard(userId: number, cardId: number, invoiceMonth: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(creditCardTransactions)
    .where(
      and(
        eq(creditCardTransactions.userId, userId),
        eq(creditCardTransactions.creditCardId, cardId),
        eq(creditCardTransactions.invoiceMonth, invoiceMonth)
      )
    )
    .orderBy(desc(creditCardTransactions.date));
}

export async function createCreditCardTransaction(data: InsertCreditCardTransaction) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(creditCardTransactions).values(data);
}

export async function deleteCreditCardTransaction(userId: number, id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(creditCardTransactions).where(and(eq(creditCardTransactions.id, id), eq(creditCardTransactions.userId, userId)));
}

// ─── Installment Purchases ────────────────────────────────────────────────────
export async function getInstallmentPurchases(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(installmentPurchases).where(eq(installmentPurchases.userId, userId)).orderBy(desc(installmentPurchases.createdAt));
}

export async function createInstallmentPurchase(data: InsertInstallmentPurchase) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  // Insert the purchase
  const [inserted] = await db.insert(installmentPurchases).values(data).returning({ id: installmentPurchases.id });
  const insertId = inserted?.id;

  // Generate credit card transactions for each installment
  if (data.creditCardId && insertId) {
    const transactions: InsertCreditCardTransaction[] = [];
    for (let i = 0; i < data.installmentCount; i++) {
      const firstDate = new Date(data.firstInstallmentDate as unknown as string);
      const installmentDate = new Date(firstDate);
      installmentDate.setMonth(installmentDate.getMonth() + i);

      const year = installmentDate.getFullYear();
      const month = String(installmentDate.getMonth() + 1).padStart(2, "0");
      const day = String(installmentDate.getDate()).padStart(2, "0");
      const invoiceMonth = `${year}-${month}`;
      const dateStr = `${year}-${month}-${day}`;

      transactions.push({
        userId: data.userId,
        creditCardId: data.creditCardId,
        categoryId: data.categoryId ?? null,
        description: `${data.description} (${i + 1}/${data.installmentCount})`,
        amount: data.installmentAmount,
        date: dateStr as any,
        invoiceMonth,
        installmentPurchaseId: insertId,
        installmentNumber: i + 1,
        notes: data.notes ?? null,
      });
    }
    if (transactions.length > 0) {
      await db.insert(creditCardTransactions).values(transactions);
    }
  }

  return insertId;
}

export async function updateInstallmentPurchase(userId: number, id: number, data: { description?: string; categoryId?: number | null; notes?: string | null }) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  // Update the purchase record
  await db.update(installmentPurchases).set(data).where(and(eq(installmentPurchases.id, id), eq(installmentPurchases.userId, userId)));
  // Propagate description and categoryId to all generated transactions
  if (data.description !== undefined || data.categoryId !== undefined) {
    const purchase = await db.select().from(installmentPurchases).where(and(eq(installmentPurchases.id, id), eq(installmentPurchases.userId, userId))).limit(1);
    if (purchase[0]) {
      const txUpdate: Partial<InsertCreditCardTransaction> = {};
      if (data.categoryId !== undefined) txUpdate.categoryId = data.categoryId;
      if (data.description !== undefined) {
        // Update each transaction description keeping the (X/N) suffix
        const transactions = await db.select().from(creditCardTransactions).where(and(eq(creditCardTransactions.installmentPurchaseId, id), eq(creditCardTransactions.userId, userId)));
        for (const tx of transactions) {
          const suffix = tx.installmentNumber ? ` (${tx.installmentNumber}/${purchase[0].installmentCount})` : "";
          await db.update(creditCardTransactions).set({ description: `${data.description}${suffix}`, ...txUpdate }).where(eq(creditCardTransactions.id, tx.id));
        }
      } else if (Object.keys(txUpdate).length > 0) {
        await db.update(creditCardTransactions).set(txUpdate).where(and(eq(creditCardTransactions.installmentPurchaseId, id), eq(creditCardTransactions.userId, userId)));
      }
    }
  }
}
export async function updateCreditCardTransaction(userId: number, id: number, data: Partial<InsertCreditCardTransaction>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(creditCardTransactions).set(data).where(and(eq(creditCardTransactions.id, id), eq(creditCardTransactions.userId, userId)));
}
export async function deleteInstallmentPurchase(userId: number, id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  // Delete all generated transactions
  await db.delete(creditCardTransactions).where(
    and(eq(creditCardTransactions.installmentPurchaseId, id), eq(creditCardTransactions.userId, userId))
  );
  await db.delete(installmentPurchases).where(and(eq(installmentPurchases.id, id), eq(installmentPurchases.userId, userId)));
}

// ─── Dashboard Summary ────────────────────────────────────────────────────────
export async function getMonthlySummary(userId: number, month: string) {
  const db = await getDb();
  if (!db) return { totalIncome: 0, totalExpenses: 0, totalCreditCard: 0, totalRecurringIncome: 0, totalRecurringExpense: 0, balance: 0 };

  const [year, m] = month.split("-").map(Number);
  const startDate = `${year}-${String(m).padStart(2, "0")}-01`;
  const endDate = `${year}-${String(m).padStart(2, "0")}-31`;

  const [incomeResult] = await db
    .select({ total: sql<string>`COALESCE(SUM(amount), 0)` })
    .from(incomes)
    .where(and(eq(incomes.userId, userId), sql`${incomes.date} >= ${startDate}`, sql`${incomes.date} <= ${endDate}`));

  // Despesas avulsas: total, pago e em aberto
  const [expenseResult] = await db
    .select({ total: sql<string>`COALESCE(SUM(amount), 0)` })
    .from(expenses)
    .where(and(eq(expenses.userId, userId), sql`${expenses.date} >= ${startDate}`, sql`${expenses.date} <= ${endDate}`));

  const [expensePaidResult] = await db
    .select({ total: sql<string>`COALESCE(SUM(amount), 0)` })
    .from(expenses)
    .where(and(
      eq(expenses.userId, userId),
      sql`${expenses.date} >= ${startDate}`,
      sql`${expenses.date} <= ${endDate}`,
      eq(expenses.isPaid, true)
    ));

  // Parcelas do cartão no mês (installmentPurchaseId não nulo = parcelamento)
  const [ccInstallResult] = await db
    .select({ total: sql<string>`COALESCE(SUM(${creditCardTransactions.amount}), 0)` })
    .from(creditCardTransactions)
    .innerJoin(installmentPurchases, eq(creditCardTransactions.installmentPurchaseId, installmentPurchases.id))
    .where(and(eq(creditCardTransactions.userId, userId), eq(creditCardTransactions.invoiceMonth, month)));

  // Cartão puro (sem parcelamentos) no mês
  const [ccResult] = await db
    .select({ total: sql<string>`COALESCE(SUM(amount), 0)` })
    .from(creditCardTransactions)
    .where(and(eq(creditCardTransactions.userId, userId), eq(creditCardTransactions.invoiceMonth, month)));

  // Soma dos itens recorrentes ativos (aparecem todo mês)
  const [recurringIncomeResult] = await db
    .select({ total: sql<string>`COALESCE(SUM(amount), 0)` })
    .from(recurringItems)
    .where(and(eq(recurringItems.userId, userId), eq(recurringItems.type, "income"), eq(recurringItems.isActive, true)));

  // Recorrentes de despesa que NÃO são vinculadas ao cartão (pix, dinheiro, débito, transferência)
  const [recurringExpenseResult] = await db
    .select({ total: sql<string>`COALESCE(SUM(amount), 0)` })
    .from(recurringItems)
    .where(and(
      eq(recurringItems.userId, userId),
      eq(recurringItems.type, "expense"),
      eq(recurringItems.isActive, true),
      sql`(${recurringItems.paymentMethod} IS NULL OR ${recurringItems.paymentMethod} != 'credit')`
    ));

  // Recorrentes de despesa vinculadas ao cartão de crédito (assinaturas)
  const [recurringCreditResult] = await db
    .select({ total: sql<string>`COALESCE(SUM(amount), 0)` })
    .from(recurringItems)
    .where(and(
      eq(recurringItems.userId, userId),
      eq(recurringItems.type, "expense"),
      eq(recurringItems.isActive, true),
      eq(recurringItems.paymentMethod, "credit")
    ));

  // Despesas avulsas pagas à vista (pix, dinheiro, débito, transferência)
  const [expenseVistaResult] = await db
    .select({ total: sql<string>`COALESCE(SUM(amount), 0)` })
    .from(expenses)
    .where(and(
      eq(expenses.userId, userId),
      sql`${expenses.date} >= ${startDate}`,
      sql`${expenses.date} <= ${endDate}`,
      sql`(${expenses.paymentMethod} IS NULL OR ${expenses.paymentMethod} IN ('cash','pix','debit','transfer','other'))`
    ));

  // Receitas avulsas com detalhamento
  const incomeDetails = await db
    .select({ description: incomes.description, amount: incomes.amount })
    .from(incomes)
    .where(and(eq(incomes.userId, userId), sql`${incomes.date} >= ${startDate}`, sql`${incomes.date} <= ${endDate}`));

  // Receitas fixas recorrentes com detalhamento
  const recurringIncomeDetails = await db
    .select({ description: recurringItems.description, amount: recurringItems.amount })
    .from(recurringItems)
    .where(and(eq(recurringItems.userId, userId), eq(recurringItems.type, "income"), eq(recurringItems.isActive, true)));

  const totalIncome = parseFloat(incomeResult?.total ?? "0");
  const totalExpenses = parseFloat(expenseResult?.total ?? "0");
  const totalExpensesPaid = parseFloat(expensePaidResult?.total ?? "0");
  const totalExpensesPending = totalExpenses - totalExpensesPaid;
  const totalCreditCardTransactions = parseFloat(ccResult?.total ?? "0"); // lançamentos manuais no cartão
  const totalInstallments = parseFloat(ccInstallResult?.total ?? "0");
  const totalCreditCardOnly = totalCreditCardTransactions - totalInstallments; // avulsas no cartão
  const totalRecurringIncome = parseFloat(recurringIncomeResult?.total ?? "0");
  const totalRecurringExpense = parseFloat(recurringExpenseResult?.total ?? "0"); // fixas que não são cartão
  const totalRecurringCredit = parseFloat(recurringCreditResult?.total ?? "0"); // assinaturas no cartão
  const totalExpenseVista = parseFloat(expenseVistaResult?.total ?? "0"); // avulsas à vista

  // ── Breakdown por forma de pagamento ──────────────────────────────────────
  // À Vista / Débito = despesas avulsas à vista + fixas recorrentes não-cartão
  const totalVista = totalExpenseVista + totalRecurringExpense;

  // Crédito = lançamentos manuais no cartão + assinaturas recorrentes no cartão
  const totalCreditCard = totalCreditCardTransactions + totalRecurringCredit;

  // Total real de despesas do mês
  const totalDespesasReal = totalVista + totalCreditCard;

  // Pago = despesas avulsas pagas à vista
  const totalPaid = totalExpensesPaid;
  const totalPending = totalDespesasReal - totalPaid;

  // Saldo = receitas avulsas + receitas fixas - total real de despesas
  const balance = (totalIncome + totalRecurringIncome) - totalDespesasReal;

  return {
    totalIncome,
    totalExpenses,
    totalExpensesPaid,
    totalExpensesPending,
    totalCreditCard,              // total crédito (cartão + assinaturas)
    totalCreditCardTransactions,  // somente lançamentos manuais
    totalCreditCardOnly,          // avulsas no cartão (sem parcelas)
    totalInstallments,            // parcelas
    totalRecurringCredit,         // assinaturas recorrentes no cartão
    totalRecurringIncome,
    totalRecurringExpense,        // fixas não-cartão
    totalVista,                   // total à vista / débito
    totalExpenseVista,            // avulsas à vista
    totalDespesasReal,
    totalPaid,
    totalPending,
    balance,
    // Detalhamento de receitas
    incomeDetails: incomeDetails.map(i => ({ description: i.description, amount: parseFloat(i.amount as string) })),
    recurringIncomeDetails: recurringIncomeDetails.map(i => ({ description: i.description, amount: parseFloat(i.amount as string) })),
  };
}

export async function getMonthlyEvolution(userId: number, months: string[]) {
  const db = await getDb();
  if (!db) return [];
  const results = await Promise.all(
    months.map(async (month) => {
      const [year, m] = month.split("-").map(Number);
      const startDate = `${year}-${String(m).padStart(2, "0")}-01`;
      const endDate = `${year}-${String(m).padStart(2, "0")}-31`;
      // Verificar se o mês tem algum lançamento real (receita avulsa, despesa avulsa ou transação de cartão)
      const [incomeCheck] = await db
        .select({ cnt: sql<number>`COUNT(*)` })
        .from(incomes)
        .where(and(eq(incomes.userId, userId), sql`${incomes.date} >= ${startDate}`, sql`${incomes.date} <= ${endDate}`));
      const [expenseCheck] = await db
        .select({ cnt: sql<number>`COUNT(*)` })
        .from(expenses)
        .where(and(eq(expenses.userId, userId), sql`${expenses.date} >= ${startDate}`, sql`${expenses.date} <= ${endDate}`));
      const [ccCheck] = await db
        .select({ cnt: sql<number>`COUNT(*)` })
        .from(creditCardTransactions)
        .where(and(eq(creditCardTransactions.userId, userId), eq(creditCardTransactions.invoiceMonth, month)));
      const hasRealData = Number(incomeCheck?.cnt ?? 0) > 0 || Number(expenseCheck?.cnt ?? 0) > 0 || Number(ccCheck?.cnt ?? 0) > 0;
      const summary = await getMonthlySummary(userId, month);
      // Se não há dados reais no mês, zerar os recorrentes para não distorcer o gráfico
      if (!hasRealData) {
        return {
          month,
          ...summary,
          totalRecurringIncome: 0,
          totalRecurringExpense: 0,
          totalRecurringCredit: 0,
          totalVista: summary.totalExpenseVista,
          totalCreditCard: summary.totalCreditCardTransactions ?? 0,
          totalDespesasReal: summary.totalExpenses + (summary.totalCreditCardTransactions ?? 0),
          balance: summary.totalIncome - (summary.totalExpenses + (summary.totalCreditCardTransactions ?? 0)),
          hasData: false,
        };
      }
      return { month, ...summary, hasData: true };
    })
  );
  return results;
}

export async function getExpensesByCategory(userId: number, month: string) {
  const db = await getDb();
  if (!db) return [];
  const [year, m] = month.split("-").map(Number);
  const startDate = `${year}-${String(m).padStart(2, "0")}-01`;
  const endDate = `${year}-${String(m).padStart(2, "0")}-31`;

  return db
    .select({
      categoryId: expenses.categoryId,
      total: sql<string>`COALESCE(SUM(${expenses.amount}), 0)`,
    })
    .from(expenses)
    .where(and(eq(expenses.userId, userId), sql`${expenses.date} >= ${startDate}`, sql`${expenses.date} <= ${endDate}`))
    .groupBy(expenses.categoryId);
}

// ─── Recurring Items ──────────────────────────────────────────────────────────
import {
  recurringItems,
  goals,
  type InsertRecurringItem,
  type InsertGoal,
} from "../drizzle/schema";

export async function getRecurringItems(userId: number, type?: "income" | "expense") {
  const db = await getDb();
  if (!db) return [];
  const conditions = type
    ? and(eq(recurringItems.userId, userId), eq(recurringItems.type, type), eq(recurringItems.isActive, true))
    : and(eq(recurringItems.userId, userId), eq(recurringItems.isActive, true));
  return db.select().from(recurringItems).where(conditions).orderBy(asc(recurringItems.description));
}

export async function createRecurringItem(data: InsertRecurringItem) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(recurringItems).values(data);
}

export async function updateRecurringItem(userId: number, id: number, data: Partial<InsertRecurringItem>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(recurringItems).set(data).where(and(eq(recurringItems.id, id), eq(recurringItems.userId, userId)));
}

export async function deleteRecurringItem(userId: number, id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(recurringItems).set({ isActive: false }).where(and(eq(recurringItems.id, id), eq(recurringItems.userId, userId)));
}

// ─── Goals ────────────────────────────────────────────────────────────────────
export async function getGoals(userId: number, type?: "monthly" | "annual") {
  const db = await getDb();
  if (!db) return [];
  const conditions = type
    ? and(eq(goals.userId, userId), eq(goals.type, type), eq(goals.isActive, true))
    : and(eq(goals.userId, userId), eq(goals.isActive, true));
  return db.select().from(goals).where(conditions).orderBy(desc(goals.createdAt));
}

export async function getMonthlyGoals(userId: number, month: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(goals).where(
    and(eq(goals.userId, userId), eq(goals.type, "monthly"), eq(goals.month as any, month), eq(goals.isActive, true))
  ).orderBy(asc(goals.title));
}

export async function getAnnualGoals(userId: number, year: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(goals).where(
    and(eq(goals.userId, userId), eq(goals.type, "annual"), eq(goals.year as any, year), eq(goals.isActive, true))
  ).orderBy(asc(goals.title));
}

export async function createGoal(data: InsertGoal) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [inserted] = await db.insert(goals).values(data).returning({ id: goals.id });
  return inserted?.id;
}

export async function updateGoal(userId: number, id: number, data: Partial<InsertGoal>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(goals).set(data).where(and(eq(goals.id, id), eq(goals.userId, userId)));
}

export async function deleteGoal(userId: number, id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(goals).set({ isActive: false }).where(and(eq(goals.id, id), eq(goals.userId, userId)));
}

// ─── Credit Card Due Alerts ───────────────────────────────────────────────────
export async function getUpcomingDueCards(userId: number) {
  const db = await getDb();
  if (!db) return [];
  // Returns all active cards with dueDay info for frontend to calculate alerts
  return db.select().from(creditCards).where(
    and(eq(creditCards.userId, userId), eq(creditCards.isActive, true))
  ).orderBy(asc(creditCards.dueDay));
}

// ─── Future Commitments (próximo mês) ────────────────────────────────────────
/**
 * Retorna compromissos financeiros do próximo mês, separados por tipo:
 * - Cartão de crédito (fatura do próximo mês)
 * - Parcelamentos (parcelas do próximo mês)
 * - Despesas fixas (recorrentes do tipo expense)
 */
export async function getFutureCommitments(userId: number, nextMonth: string) {
  const db = await getDb();
  if (!db) return { creditCard: 0, installments: 0, recurringExpenses: 0, total: 0 };

  // Total de cartão de crédito no próximo mês
  const [ccResult] = await db
    .select({ total: sql<string>`COALESCE(SUM(amount), 0)` })
    .from(creditCardTransactions)
    .where(and(eq(creditCardTransactions.userId, userId), eq(creditCardTransactions.invoiceMonth, nextMonth)));

  // Total de parcelamentos no próximo mês (transações de cartão vinculadas a installmentPurchase)
  const [installResult] = await db
    .select({ total: sql<string>`COALESCE(SUM(${creditCardTransactions.amount}), 0)` })
    .from(creditCardTransactions)
    .innerJoin(installmentPurchases, eq(creditCardTransactions.installmentPurchaseId, installmentPurchases.id))
    .where(and(eq(creditCardTransactions.userId, userId), eq(creditCardTransactions.invoiceMonth, nextMonth)));

  // Total de despesas fixas recorrentes (sempre presentes todo mês)
  const [recurringResult] = await db
    .select({ total: sql<string>`COALESCE(SUM(amount), 0)` })
    .from(recurringItems)
    .where(and(eq(recurringItems.userId, userId), eq(recurringItems.type, "expense"), eq(recurringItems.isActive, true)));

  const creditCard = parseFloat(ccResult?.total ?? "0");
  const installments = parseFloat(installResult?.total ?? "0");
  const recurringExpenses = parseFloat(recurringResult?.total ?? "0");
  // creditCard já inclui parcelamentos, então separamos: cartão puro = creditCard - installments
  const creditCardOnly = creditCard - installments;

  return {
    creditCard: creditCardOnly,
    installments,
    recurringExpenses,
    total: creditCard + recurringExpenses,
  };
}

// ─── Credit Card Invoice Breakdown ──────────────────────────────────────────
/**
 * Retorna a fatura de um cartão separada em 4 seções:
 * 1. Assinaturas Fixas (recurringItems vinculados ao cartão com paymentMethod=credit)
 * 2. Parcelamentos (creditCardTransactions com installmentPurchaseId)
 * 3. Despesas Esporádicas (creditCardTransactions avulsos de crédito, sem installmentPurchaseId)
 * 4. Débito Automático (creditCardTransactions de débito)
 */
export async function getCreditCardInvoiceBreakdown(
  userId: number,
  cardId: number | null,
  invoiceMonth: string
) {
  const db = await getDb();
  if (!db) return { subscriptions: [], installments: [], sporadic: [], debit: [], totalSubscriptions: 0, totalInstallments: 0, totalSporadic: 0, totalDebit: 0, grandTotal: 0 };

  // 1. Assinaturas fixas: recurringItems vinculados ao cartão com paymentMethod=credit
  const subscriptionConditions = cardId
    ? and(
        eq(recurringItems.userId, userId),
        eq(recurringItems.type, "expense"),
        eq(recurringItems.isActive, true),
        eq(recurringItems.paymentMethod, "credit"),
        eq(recurringItems.paymentCardId, cardId)
      )
    : and(
        eq(recurringItems.userId, userId),
        eq(recurringItems.type, "expense"),
        eq(recurringItems.isActive, true),
        eq(recurringItems.paymentMethod, "credit")
      );

  const subscriptions = await db
    .select()
    .from(recurringItems)
    .where(subscriptionConditions)
    .orderBy(asc(recurringItems.description));

  // 2. Parcelamentos: transações com installmentPurchaseId
  const installmentConditions = cardId
    ? and(
        eq(creditCardTransactions.userId, userId),
        eq(creditCardTransactions.creditCardId, cardId),
        eq(creditCardTransactions.invoiceMonth, invoiceMonth),
        sql`${creditCardTransactions.installmentPurchaseId} IS NOT NULL`
      )
    : and(
        eq(creditCardTransactions.userId, userId),
        eq(creditCardTransactions.invoiceMonth, invoiceMonth),
        sql`${creditCardTransactions.installmentPurchaseId} IS NOT NULL`
      );

  const installments = await db
    .select()
    .from(creditCardTransactions)
    .where(installmentConditions)
    .orderBy(desc(creditCardTransactions.date));

  // 3. Despesas esporádicas: transações avulsas de crédito (sem installmentPurchaseId)
  const sporadicConditions = cardId
    ? and(
        eq(creditCardTransactions.userId, userId),
        eq(creditCardTransactions.creditCardId, cardId),
        eq(creditCardTransactions.invoiceMonth, invoiceMonth),
        eq(creditCardTransactions.transactionType, "credit"),
        sql`${creditCardTransactions.installmentPurchaseId} IS NULL`
      )
    : and(
        eq(creditCardTransactions.userId, userId),
        eq(creditCardTransactions.invoiceMonth, invoiceMonth),
        eq(creditCardTransactions.transactionType, "credit"),
        sql`${creditCardTransactions.installmentPurchaseId} IS NULL`
      );

  const sporadic = await db
    .select()
    .from(creditCardTransactions)
    .where(sporadicConditions)
    .orderBy(desc(creditCardTransactions.date));

  // 4. Débito automático: transações de débito
  const debitConditions = cardId
    ? and(
        eq(creditCardTransactions.userId, userId),
        eq(creditCardTransactions.creditCardId, cardId),
        eq(creditCardTransactions.invoiceMonth, invoiceMonth),
        eq(creditCardTransactions.transactionType, "debit")
      )
    : and(
        eq(creditCardTransactions.userId, userId),
        eq(creditCardTransactions.invoiceMonth, invoiceMonth),
        eq(creditCardTransactions.transactionType, "debit")
      );

  const debit = await db
    .select()
    .from(creditCardTransactions)
    .where(debitConditions)
    .orderBy(desc(creditCardTransactions.date));

  const totalSubscriptions = subscriptions.reduce((s, r) => s + parseFloat(r.amount as string), 0);
  const totalInstallments = installments.reduce((s, r) => s + parseFloat(r.amount as string), 0);
  const totalSporadic = sporadic.reduce((s, r) => s + parseFloat(r.amount as string), 0);
  const totalDebit = debit.reduce((s, r) => s + parseFloat(r.amount as string), 0);
  const grandTotal = totalSubscriptions + totalInstallments + totalSporadic + totalDebit;

  return {
    subscriptions,
    installments,
    sporadic,
    debit,
    totalSubscriptions,
    totalInstallments,
    totalSporadic,
    totalDebit,
    grandTotal,
  };
}

// ─── Next Payments ────────────────────────────────────────────────────────────
/**
 * Retorna os próximos N pagamentos a vencer (despesas avulsas pendentes + vencimentos de cartão)
 * ordenados por data de vencimento
 */
export async function getNextPayments(userId: number, limit: number = 3) {
  const db = await getDb();
  if (!db) return [];

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  // Próximas despesas avulsas não pagas
  const pendingExpenses = await db
    .select({
      id: expenses.id,
      description: expenses.description,
      amount: expenses.amount,
      date: expenses.date,
      type: sql<string>`'expense'`,
    })
    .from(expenses)
    .where(and(
      eq(expenses.userId, userId),
      eq(expenses.isPaid, false),
      sql`${expenses.date} >= ${todayStr}`
    ))
    .orderBy(asc(expenses.date))
    .limit(limit);

  // Próximos vencimentos de fatura de cartão (baseado no dueDay do cartão)
  const cards = await db
    .select()
    .from(creditCards)
    .where(and(eq(creditCards.userId, userId), eq(creditCards.isActive, true)));

  const cardDueDates: Array<{
    id: number;
    description: string;
    amount: string | number;
    date: string;
    type: string;
    cardName?: string;
  }> = [];

  for (const card of cards) {
    // Calcula o próximo vencimento
    const dueDay = card.dueDay;
    const thisMonthDue = new Date(today.getFullYear(), today.getMonth(), dueDay);
    const nextDue = thisMonthDue >= today ? thisMonthDue : new Date(today.getFullYear(), today.getMonth() + 1, dueDay);

    const dueMonth = `${nextDue.getFullYear()}-${String(nextDue.getMonth() + 1).padStart(2, "0")}`;
    const dueDateStr = nextDue.toISOString().slice(0, 10);

    // Busca o total da fatura do mês de vencimento
    const [invoiceTotal] = await db
      .select({ total: sql<string>`COALESCE(SUM(amount), 0)` })
      .from(creditCardTransactions)
      .where(and(
        eq(creditCardTransactions.userId, userId),
        eq(creditCardTransactions.creditCardId, card.id),
        eq(creditCardTransactions.invoiceMonth, dueMonth)
      ));

    const total = parseFloat(invoiceTotal?.total ?? "0");
    if (total > 0) {
      cardDueDates.push({
        id: card.id,
        description: `Fatura ${card.name}`,
        amount: total,
        date: dueDateStr,
        type: "creditCard",
        cardName: card.name,
      });
    }
  }

  // Combina e ordena por data
  const allPayments = [
    ...pendingExpenses.map(e => ({
      id: e.id,
      description: e.description,
      amount: e.amount,
      date: typeof e.date === "string" ? e.date : (e.date as Date).toISOString().slice(0, 10),
      type: "expense" as const,
    })),
    ...cardDueDates,
  ];

  allPayments.sort((a, b) => a.date.localeCompare(b.date));
  return allPayments.slice(0, limit);
}

// ─── Category Breakdown (para gráfico de rosca no Dashboard) ─────────────────
export async function getCategoryBreakdown(userId: number, month: string) {
  const db = await getDb();
  if (!db) return [];

  const [year, m] = month.split("-").map(Number);
  const startDate = `${year}-${String(m).padStart(2, "0")}-01`;
  const endDate = `${year}-${String(m).padStart(2, "0")}-31`;

  // 1. Despesas avulsas agrupadas por categoria
  const expenseRows = await db
    .select({
      categoryId: expenses.categoryId,
      total: sql<string>`COALESCE(SUM(${expenses.amount}), 0)`,
    })
    .from(expenses)
    .where(
      and(
        eq(expenses.userId, userId),
        sql`${expenses.date} >= ${startDate}`,
        sql`${expenses.date} <= ${endDate}`
      )
    )
    .groupBy(expenses.categoryId);

  // 2. Recorrentes de despesa agrupadas por categoria
  const recurringRows = await db
    .select({
      categoryId: recurringItems.categoryId,
      total: sql<string>`COALESCE(SUM(${recurringItems.amount}), 0)`,
    })
    .from(recurringItems)
    .where(
      and(
        eq(recurringItems.userId, userId),
        eq(recurringItems.type, "expense"),
        eq(recurringItems.isActive, true)
      )
    )
    .groupBy(recurringItems.categoryId);

  // 3. Transações de cartão (crédito) do mês agrupadas por categoria
  const ccRows = await db
    .select({
      categoryId: creditCardTransactions.categoryId,
      total: sql<string>`COALESCE(SUM(${creditCardTransactions.amount}), 0)`,
    })
    .from(creditCardTransactions)
    .where(
      and(
        eq(creditCardTransactions.userId, userId),
        eq(creditCardTransactions.transactionType, "credit"),
        eq(creditCardTransactions.invoiceMonth, month),
        sql`${creditCardTransactions.installmentPurchaseId} IS NULL`
      )
    )
    .groupBy(creditCardTransactions.categoryId);

  // 4. Parcelamentos do mês agrupados por categoria
  const installRows = await db
    .select({
      categoryId: installmentPurchases.categoryId,
      total: sql<string>`COALESCE(SUM(${creditCardTransactions.amount}), 0)`,
    })
    .from(creditCardTransactions)
    .innerJoin(
      installmentPurchases,
      eq(creditCardTransactions.installmentPurchaseId, installmentPurchases.id)
    )
    .where(
      and(
        eq(creditCardTransactions.userId, userId),
        eq(creditCardTransactions.invoiceMonth, month)
      )
    )
    .groupBy(installmentPurchases.categoryId);

  // Categorias padrão (IDs negativos, definidas apenas no frontend)
  const DEFAULT_CATEGORIES: { id: number; name: string; color: string }[] = [
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
  // Buscar categorias personalizadas do usuário no banco
  const customCats = await db
    .select()
    .from(expenseCategories)
    .where(eq(expenseCategories.userId, userId));
  // Consolidar totais por categoryId
  const totalsMap = new Map<number | null, number>();
  const addToMap = (rows: { categoryId: number | null; total: string }[]) => {
    for (const row of rows) {
      const key = row.categoryId ?? null;
      totalsMap.set(key, (totalsMap.get(key) ?? 0) + parseFloat(row.total));
    }
  };
  addToMap(expenseRows);
  addToMap(recurringRows);
  addToMap(ccRows);
  addToMap(installRows);
  // Montar resultado com nome e cor da categoria
  const result: { categoryId: number | null; name: string; color: string; total: number }[] = [];
  for (const [catId, total] of Array.from(totalsMap.entries())) {
    if (total <= 0) continue;
    // Primeiro busca nas categorias padrão (IDs negativos), depois nas personalizadas
    const defaultCat = catId !== null ? DEFAULT_CATEGORIES.find((c) => c.id === catId) : null;
    const customCat = catId !== null ? customCats.find((c) => c.id === catId) : null;
    const cat = defaultCat ?? customCat;
    // Se catId é null, significa lançamento sem categoria atribuída
    const name = cat?.name ?? (catId === null ? "Sem Categoria" : "Outros");
    const color = cat?.color ?? (catId === null ? "#94a3b8" : "#6b7280");
    result.push({
      categoryId: catId,
      name,
      color,
      total,
    });
  }

  // Ordenar por maior valor
  result.sort((a, b) => b.total - a.total);
  return result;
}

// ─── Auth helpers ─────────────────────────────────────────────────────────────
export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return result[0];
}

export async function getUserByEmailAndPassword(email: string, hashedPassword: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(users)
    .where(and(eq(users.email, email), eq(users.password, hashedPassword)))
    .limit(1);
  return result[0];
}
