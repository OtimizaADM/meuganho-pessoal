import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the db module
vi.mock("./db", () => ({
  getIncomeCategories: vi.fn().mockResolvedValue([]),
  createIncomeCategory: vi.fn().mockResolvedValue({ id: 1, name: "Salário", color: "#10b981", userId: 1 }),
  deleteIncomeCategory: vi.fn().mockResolvedValue(undefined),
  getExpenseCategories: vi.fn().mockResolvedValue([]),
  createExpenseCategory: vi.fn().mockResolvedValue({ id: 1, name: "Alimentação", color: "#f59e0b", icon: "utensils", userId: 1 }),
  deleteExpenseCategory: vi.fn().mockResolvedValue(undefined),
  getIncomes: vi.fn().mockResolvedValue([]),
  createIncome: vi.fn().mockResolvedValue({
    id: 1,
    userId: 1,
    description: "Salário",
    amount: "5000.00",
    date: "2026-03-01",
    categoryId: null,
    isRecurring: false,
    notes: null,
  }),
  updateIncome: vi.fn().mockResolvedValue(undefined),
  deleteIncome: vi.fn().mockResolvedValue(undefined),
  getExpenses: vi.fn().mockResolvedValue([]),
  createExpense: vi.fn().mockResolvedValue({
    id: 1,
    userId: 1,
    description: "Supermercado",
    amount: "350.00",
    date: "2026-03-05",
    categoryId: null,
    isRecurring: false,
    notes: null,
  }),
  updateExpense: vi.fn().mockResolvedValue(undefined),
  deleteExpense: vi.fn().mockResolvedValue(undefined),
  getCreditCards: vi.fn().mockResolvedValue([]),
  createCreditCard: vi.fn().mockResolvedValue({
    id: 1,
    userId: 1,
    name: "Nubank",
    lastFourDigits: "1234",
    brand: "Mastercard",
    creditLimit: "5000.00",
    closingDay: 20,
    dueDay: 10,
    color: "#6366f1",
    isActive: true,
  }),
  updateCreditCard: vi.fn().mockResolvedValue(undefined),
  deleteCreditCard: vi.fn().mockResolvedValue(undefined),
  getCreditCardTransactions: vi.fn().mockResolvedValue([]),
  getCreditCardTransactionsByCard: vi.fn().mockResolvedValue([]),
  createCreditCardTransaction: vi.fn().mockResolvedValue({
    id: 1,
    userId: 1,
    creditCardId: 1,
    description: "Restaurante",
    amount: "120.00",
    date: "2026-03-10",
    invoiceMonth: "2026-03",
    categoryId: null,
    installmentPurchaseId: null,
    installmentNumber: null,
    notes: null,
  }),
  deleteCreditCardTransaction: vi.fn().mockResolvedValue(undefined),
  getInstallmentPurchases: vi.fn().mockResolvedValue([]),
  createInstallmentPurchase: vi.fn().mockResolvedValue({
    id: 1,
    userId: 1,
    description: "Notebook",
    totalAmount: "3000.00",
    installmentCount: 12,
    installmentAmount: "250.00",
    firstInstallmentDate: "2026-03-01",
    categoryId: null,
    notes: null,
  }),
  deleteInstallmentPurchase: vi.fn().mockResolvedValue(undefined),
  getMonthlySummary: vi.fn().mockResolvedValue({
    totalIncome: 5000,
    totalExpenses: 1200,
    totalCreditCard: 800,
    balance: 3000,
  }),
  getMonthlyEvolution: vi.fn().mockResolvedValue([]),
  getExpensesByCategory: vi.fn().mockResolvedValue([]),
}));

function createAuthContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("incomeCategories", () => {
  it("list returns empty array", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.incomeCategories.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("create returns new category", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.incomeCategories.create({ name: "Salário", color: "#10b981" });
    expect(result).toMatchObject({ name: "Salário", color: "#10b981" });
  });
});

describe("expenseCategories", () => {
  it("list returns empty array", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.expenseCategories.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("create returns new category", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.expenseCategories.create({ name: "Alimentação", color: "#f59e0b", icon: "utensils" });
    expect(result).toMatchObject({ name: "Alimentação" });
  });
});

describe("incomes", () => {
  it("list returns array for given month", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.incomes.list({ month: "2026-03" });
    expect(Array.isArray(result)).toBe(true);
  });

  it("create returns new income", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.incomes.create({
      description: "Salário",
      amount: "5000.00",
      date: "2026-03-01",
      categoryId: null,
      isRecurring: false,
      notes: null,
    });
    expect(result).toMatchObject({ description: "Salário", amount: "5000.00" });
  });
});

describe("expenses", () => {
  it("list returns array for given month", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.expenses.list({ month: "2026-03" });
    expect(Array.isArray(result)).toBe(true);
  });

  it("create returns new expense", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.expenses.create({
      description: "Supermercado",
      amount: "350.00",
      date: "2026-03-05",
      categoryId: null,
      isRecurring: false,
      notes: null,
    });
    expect(result).toMatchObject({ description: "Supermercado" });
  });
});

describe("creditCards", () => {
  it("list returns empty array", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.creditCards.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("create returns new card", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.creditCards.create({
      name: "Nubank",
      lastFourDigits: "1234",
      brand: "Mastercard",
      creditLimit: "5000.00",
      closingDay: 20,
      dueDay: 10,
      color: "#6366f1",
    });
    expect(result).toMatchObject({ name: "Nubank", brand: "Mastercard" });
  });
});

describe("installments", () => {
  it("list returns empty array", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.installments.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("create returns new installment purchase", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.installments.create({
      description: "Notebook",
      totalAmount: "3000.00",
      installmentCount: 12,
      installmentAmount: "250.00",
      firstInstallmentDate: "2026-03-01",
      creditCardId: null,
      categoryId: null,
      notes: null,
    });
    expect(result).toMatchObject({ description: "Notebook", installmentCount: 12 });
  });
});

describe("dashboard", () => {
  it("summary returns financial totals", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.dashboard.summary({ month: "2026-03" });
    expect(result).toMatchObject({
      totalIncome: expect.any(Number),
      totalExpenses: expect.any(Number),
      totalCreditCard: expect.any(Number),
      balance: expect.any(Number),
    });
  });

  it("evolution returns array", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.dashboard.evolution({ months: ["2026-01", "2026-02", "2026-03"] });
    expect(Array.isArray(result)).toBe(true);
  });
});
