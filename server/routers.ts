import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  getIncomeCategories,
  createIncomeCategory,
  deleteIncomeCategory,
  getExpenseCategories,
  createExpenseCategory,
  deleteExpenseCategory,
  getIncomes,
  createIncome,
  updateIncome,
  deleteIncome,
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getCreditCards,
  createCreditCard,
  updateCreditCard,
  deleteCreditCard,
  getCreditCardTransactions,
  getCreditCardTransactionsByCard,
  createCreditCardTransaction,
  deleteCreditCardTransaction,
  updateCreditCardTransaction,
  getInstallmentPurchases,
  createInstallmentPurchase,
  updateInstallmentPurchase,
  deleteInstallmentPurchase,
  getMonthlySummary,
  getMonthlyEvolution,
  getExpensesByCategory,
  getRecurringItems,
  createRecurringItem,
  updateRecurringItem,
  deleteRecurringItem,
  getGoals,
  getMonthlyGoals,
  getAnnualGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  getUpcomingDueCards,
  getFutureCommitments,
  getNextPayments,
  getCreditCardInvoiceBreakdown,
  getCategoryBreakdown,
} from "./db";

const PAYMENT_METHODS = ["cash", "pix", "debit", "credit", "transfer", "other"] as const;

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Income Categories ───────────────────────────────────────────────────
  incomeCategories: router({
    list: protectedProcedure.query(({ ctx }) => getIncomeCategories(ctx.user.id)),
    create: protectedProcedure
      .input(z.object({ name: z.string().min(1), color: z.string().default("#10b981") }))
      .mutation(({ ctx, input }) => createIncomeCategory(ctx.user.id, input.name, input.color)),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) => deleteIncomeCategory(ctx.user.id, input.id)),
  }),

  // ─── Expense Categories ──────────────────────────────────────────────────
  expenseCategories: router({
    list: protectedProcedure.query(({ ctx }) => getExpenseCategories(ctx.user.id)),
    create: protectedProcedure
      .input(z.object({ name: z.string().min(1), color: z.string().default("#ef4444"), icon: z.string().default("tag") }))
      .mutation(({ ctx, input }) => createExpenseCategory(ctx.user.id, input.name, input.color, input.icon)),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) => deleteExpenseCategory(ctx.user.id, input.id)),
  }),

  // ─── Incomes ─────────────────────────────────────────────────────────────
  incomes: router({
    list: protectedProcedure
      .input(z.object({ month: z.string() }))
      .query(({ ctx, input }) => getIncomes(ctx.user.id, input.month)),
    create: protectedProcedure
      .input(z.object({
        description: z.string().min(1),
        amount: z.string(),
        date: z.string(),
        categoryId: z.number().optional().nullable(),
        isRecurring: z.boolean().default(false),
        notes: z.string().optional().nullable(),
      }))
      .mutation(({ ctx, input }) =>
        createIncome({
          userId: ctx.user.id,
          description: input.description,
          amount: input.amount as any,
          date: input.date as any,
          categoryId: input.categoryId ?? null,
          isRecurring: input.isRecurring,
          notes: input.notes ?? null,
        })
      ),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        description: z.string().min(1).optional(),
        amount: z.string().optional(),
        date: z.string().optional(),
        categoryId: z.number().optional().nullable(),
        isRecurring: z.boolean().optional(),
        notes: z.string().optional().nullable(),
      }))
      .mutation(({ ctx, input }) => {
        const { id, ...data } = input;
        return updateIncome(ctx.user.id, id, data as any);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) => deleteIncome(ctx.user.id, input.id)),
  }),

  // ─── Expenses ────────────────────────────────────────────────────────────
  expenses: router({
    list: protectedProcedure
      .input(z.object({ month: z.string() }))
      .query(({ ctx, input }) => getExpenses(ctx.user.id, input.month)),
    create: protectedProcedure
      .input(z.object({
        description: z.string().min(1),
        amount: z.string(),
        date: z.string(),
        categoryId: z.number().optional().nullable(),
        isRecurring: z.boolean().default(false),
        notes: z.string().optional().nullable(),
        isPaid: z.boolean().default(false),
        paidAt: z.string().optional().nullable(),
        paymentMethod: z.enum(PAYMENT_METHODS).optional().nullable(),
        paymentCardId: z.number().optional().nullable(),
      }))
      .mutation(({ ctx, input }) =>
        createExpense({
          userId: ctx.user.id,
          description: input.description,
          amount: input.amount as any,
          date: input.date as any,
          categoryId: input.categoryId ?? null,
          isRecurring: input.isRecurring,
          notes: input.notes ?? null,
          isPaid: input.isPaid,
          paidAt: (input.paidAt ?? null) as any,
          paymentMethod: input.paymentMethod ?? null,
          paymentCardId: input.paymentCardId ?? null,
        })
      ),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        description: z.string().min(1).optional(),
        amount: z.string().optional(),
        date: z.string().optional(),
        categoryId: z.number().optional().nullable(),
        isRecurring: z.boolean().optional(),
        notes: z.string().optional().nullable(),
        isPaid: z.boolean().optional(),
        paidAt: z.string().optional().nullable(),
        paymentMethod: z.enum(PAYMENT_METHODS).optional().nullable(),
        paymentCardId: z.number().optional().nullable(),
      }))
      .mutation(({ ctx, input }) => {
        const { id, ...data } = input;
        return updateExpense(ctx.user.id, id, data as any);
      }),
    markPaid: protectedProcedure
      .input(z.object({
        id: z.number(),
        isPaid: z.boolean(),
        paymentMethod: z.enum(PAYMENT_METHODS).optional().nullable(),
        paymentCardId: z.number().optional().nullable(),
        paidAt: z.string().optional().nullable(),
      }))
      .mutation(({ ctx, input }) =>
        updateExpense(ctx.user.id, input.id, {
          isPaid: input.isPaid,
          paymentMethod: input.paymentMethod ?? null,
          paymentCardId: input.paymentCardId ?? null,
          paidAt: (input.isPaid ? (input.paidAt ?? new Date().toISOString().slice(0, 10)) : null) as any,
        })
      ),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) => deleteExpense(ctx.user.id, input.id)),
  }),

  // ─── Credit Cards ─────────────────────────────────────────────────────────
  creditCards: router({
    list: protectedProcedure.query(({ ctx }) => getCreditCards(ctx.user.id)),
    upcomingDue: protectedProcedure.query(({ ctx }) => getUpcomingDueCards(ctx.user.id)),
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        lastFourDigits: z.string().length(4).optional().nullable(),
        brand: z.string().default("Visa"),
        creditLimit: z.string().optional().nullable(),
        closingDay: z.number().min(1).max(31),
        dueDay: z.number().min(1).max(31),
        color: z.string().default("#6366f1"),
      }))
      .mutation(({ ctx, input }) =>
        createCreditCard({
          userId: ctx.user.id,
          name: input.name,
          lastFourDigits: input.lastFourDigits ?? null,
          brand: input.brand,
          creditLimit: input.creditLimit as any,
          closingDay: input.closingDay,
          dueDay: input.dueDay,
          color: input.color,
          isActive: true,
        })
      ),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        lastFourDigits: z.string().length(4).optional().nullable(),
        brand: z.string().optional(),
        creditLimit: z.string().optional().nullable(),
        closingDay: z.number().min(1).max(31).optional(),
        dueDay: z.number().min(1).max(31).optional(),
        color: z.string().optional(),
      }))
      .mutation(({ ctx, input }) => {
        const { id, ...data } = input;
        return updateCreditCard(ctx.user.id, id, data as any);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) => deleteCreditCard(ctx.user.id, input.id)),
  }),

  // ─── Credit Card Transactions ─────────────────────────────────────────────
  creditCardTransactions: router({
    listByMonth: protectedProcedure
      .input(z.object({ invoiceMonth: z.string() }))
      .query(({ ctx, input }) => getCreditCardTransactions(ctx.user.id, input.invoiceMonth)),
    listByCard: protectedProcedure
      .input(z.object({ cardId: z.number(), invoiceMonth: z.string() }))
      .query(({ ctx, input }) => getCreditCardTransactionsByCard(ctx.user.id, input.cardId, input.invoiceMonth)),
    create: protectedProcedure
      .input(z.object({
        creditCardId: z.number(),
        description: z.string().min(1),
        amount: z.string(),
        date: z.string(),
        invoiceMonth: z.string(),
        transactionType: z.enum(["credit", "debit"]).default("credit"),
        isPaid: z.boolean().optional(),
        categoryId: z.number().optional().nullable(),
        notes: z.string().optional().nullable(),
      }))
      .mutation(({ ctx, input }) =>
        createCreditCardTransaction({
          userId: ctx.user.id,
          creditCardId: input.creditCardId,
          description: input.description,
          amount: input.amount as any,
          date: input.date as any,
          invoiceMonth: input.invoiceMonth,
          transactionType: input.transactionType,
          isPaid: input.transactionType === "debit" ? true : (input.isPaid ?? false),
          categoryId: input.categoryId ?? null,
          installmentPurchaseId: null,
          installmentNumber: null,
          notes: input.notes ?? null,
        })
      ),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        creditCardId: z.number().optional().nullable(),
        description: z.string().min(1).optional(),
        amount: z.string().optional(),
        date: z.string().optional(),
        invoiceMonth: z.string().optional(),
        transactionType: z.enum(["credit", "debit"]).optional(),
        isPaid: z.boolean().optional(),
        categoryId: z.number().optional().nullable(),
        notes: z.string().optional().nullable(),
      }))
      .mutation(({ ctx, input }) => {
        const { id, ...data } = input;
        return updateCreditCardTransaction(ctx.user.id, id, data as any);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) => deleteCreditCardTransaction(ctx.user.id, input.id)),
    invoiceBreakdown: protectedProcedure
      .input(z.object({ cardId: z.number().nullable(), invoiceMonth: z.string() }))
      .query(({ ctx, input }) => getCreditCardInvoiceBreakdown(ctx.user.id, input.cardId, input.invoiceMonth)),
  }),

  // ─── Installment Purchases ────────────────────────────────────────────────
  installments: router({
    list: protectedProcedure.query(({ ctx }) => getInstallmentPurchases(ctx.user.id)),
    create: protectedProcedure
      .input(z.object({
        creditCardId: z.number().optional().nullable(),
        description: z.string().min(1),
        totalAmount: z.string(),
        installmentCount: z.number().min(2).max(120),
        installmentAmount: z.string(),
        firstInstallmentDate: z.string(),
        categoryId: z.number().optional().nullable(),
        notes: z.string().optional().nullable(),
      }))
      .mutation(({ ctx, input }) =>
        createInstallmentPurchase({
          userId: ctx.user.id,
          creditCardId: input.creditCardId ?? null,
          description: input.description,
          totalAmount: input.totalAmount as any,
          installmentCount: input.installmentCount,
          installmentAmount: input.installmentAmount as any,
          firstInstallmentDate: input.firstInstallmentDate as any,
          categoryId: input.categoryId ?? null,
          notes: input.notes ?? null,
        })
      ),
     update: protectedProcedure
      .input(z.object({
        id: z.number(),
        description: z.string().min(1).optional(),
        categoryId: z.number().optional().nullable(),
        notes: z.string().optional().nullable(),
      }))
      .mutation(({ ctx, input }) => {
        const { id, ...data } = input;
        return updateInstallmentPurchase(ctx.user.id, id, data);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) => deleteInstallmentPurchase(ctx.user.id, input.id)),
  }),
  // ─── Recurring Items ──────────────────────────────────────────────────────
  recurring: router({
    list: protectedProcedure
      .input(z.object({ type: z.enum(["income", "expense"]).optional() }))
      .query(({ ctx, input }) => getRecurringItems(ctx.user.id, input.type)),
    create: protectedProcedure
      .input(z.object({
        type: z.enum(["income", "expense"]),
        description: z.string().min(1),
        amount: z.string(),
        dayOfMonth: z.number().min(1).max(31),
        categoryId: z.number().optional().nullable(),
        bankAccount: z.string().optional().nullable(),
        bankName: z.string().optional().nullable(),
        paymentMethod: z.enum(PAYMENT_METHODS).optional().nullable(),
        paymentCardId: z.number().optional().nullable(),
        notes: z.string().optional().nullable(),
      }))
      .mutation(({ ctx, input }) =>
        createRecurringItem({
          userId: ctx.user.id,
          type: input.type,
          description: input.description,
          amount: input.amount as any,
          dayOfMonth: input.dayOfMonth,
          categoryId: input.categoryId ?? null,
          bankAccount: input.bankAccount ?? null,
          bankName: input.bankName ?? null,
          paymentMethod: input.paymentMethod ?? null,
          paymentCardId: input.paymentCardId ?? null,
          notes: input.notes ?? null,
          isActive: true,
        })
      ),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        description: z.string().min(1).optional(),
        amount: z.string().optional(),
        dayOfMonth: z.number().min(1).max(31).optional(),
        categoryId: z.number().optional().nullable(),
        bankAccount: z.string().optional().nullable(),
        bankName: z.string().optional().nullable(),
        paymentMethod: z.enum(PAYMENT_METHODS).optional().nullable(),
        paymentCardId: z.number().optional().nullable(),
        isActive: z.boolean().optional(),
        notes: z.string().optional().nullable(),
      }))
      .mutation(({ ctx, input }) => {
        const { id, ...data } = input;
        return updateRecurringItem(ctx.user.id, id, data as any);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) => deleteRecurringItem(ctx.user.id, input.id)),
  }),

  // ─── Goals ────────────────────────────────────────────────────────────────
  goals: router({
    listMonthly: protectedProcedure
      .input(z.object({ month: z.string() }))
      .query(({ ctx, input }) => getMonthlyGoals(ctx.user.id, input.month)),
    listAnnual: protectedProcedure
      .input(z.object({ year: z.number() }))
      .query(({ ctx, input }) => getAnnualGoals(ctx.user.id, input.year)),
    create: protectedProcedure
      .input(z.object({
        type: z.enum(["monthly", "annual"]),
        title: z.string().min(1),
        description: z.string().optional().nullable(),
        categoryId: z.number().optional().nullable(),
        limitAmount: z.string(),
        targetAmount: z.string().optional().nullable(),
        currentAmount: z.string().optional().default("0"),
        month: z.string().optional().nullable(),
        year: z.number().optional().nullable(),
        deadline: z.string().optional().nullable(),
        icon: z.string().optional().default("target"),
        color: z.string().optional().default("#6366f1"),
      }))
      .mutation(({ ctx, input }) =>
        createGoal({
          userId: ctx.user.id,
          type: input.type,
          title: input.title,
          description: input.description ?? null,
          categoryId: input.categoryId ?? null,
          limitAmount: input.limitAmount as any,
          targetAmount: (input.targetAmount ?? null) as any,
          currentAmount: (input.currentAmount ?? "0") as any,
          month: input.month ?? null,
          year: input.year ?? null,
          deadline: (input.deadline ?? null) as any,
          icon: input.icon ?? "target",
          color: input.color ?? "#6366f1",
          isActive: true,
          isCompleted: false,
        })
      ),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        description: z.string().optional().nullable(),
        limitAmount: z.string().optional(),
        targetAmount: z.string().optional().nullable(),
        currentAmount: z.string().optional(),
        deadline: z.string().optional().nullable(),
        isCompleted: z.boolean().optional(),
        icon: z.string().optional(),
        color: z.string().optional(),
      }))
      .mutation(({ ctx, input }) => {
        const { id, ...data } = input;
        return updateGoal(ctx.user.id, id, data as any);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) => deleteGoal(ctx.user.id, input.id)),
  }),

  // ─── Dashboard & Reports ──────────────────────────────────────────────────
  dashboard: router({
    summary: protectedProcedure
      .input(z.object({ month: z.string() }))
      .query(({ ctx, input }) => getMonthlySummary(ctx.user.id, input.month)),
    evolution: protectedProcedure
      .input(z.object({ months: z.array(z.string()) }))
      .query(({ ctx, input }) => getMonthlyEvolution(ctx.user.id, input.months)),
    expensesByCategory: protectedProcedure
      .input(z.object({ month: z.string() }))
      .query(({ ctx, input }) => getExpensesByCategory(ctx.user.id, input.month)),
    futureCommitments: protectedProcedure
      .input(z.object({ nextMonth: z.string() }))
      .query(({ ctx, input }) => getFutureCommitments(ctx.user.id, input.nextMonth)),
    nextPayments: protectedProcedure
      .input(z.object({ limit: z.number().default(3) }))
      .query(({ ctx, input }) => getNextPayments(ctx.user.id, input.limit)),
    categoryBreakdown: protectedProcedure
      .input(z.object({ month: z.string() }))
      .query(({ ctx, input }) => getCategoryBreakdown(ctx.user.id, input.month)),
  }),
});

export type AppRouter = typeof appRouter;
