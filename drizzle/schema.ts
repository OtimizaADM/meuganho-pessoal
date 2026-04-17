import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  date,
} from "drizzle-orm/mysql-core";

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),

  // Auth próprio (sem Manus OAuth)
  password: varchar("password", { length: 64 }),

  // Bloqueio de conta
  isBlocked: boolean("isBlocked").default(false).notNull(),
  blockedReason: text("blockedReason"),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Income Categories ────────────────────────────────────────────────────────
export const incomeCategories = mysqlTable("income_categories", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  color: varchar("color", { length: 20 }).default("#10b981").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type IncomeCategory = typeof incomeCategories.$inferSelect;

// ─── Expense Categories ───────────────────────────────────────────────────────
export const expenseCategories = mysqlTable("expense_categories", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  color: varchar("color", { length: 20 }).default("#ef4444").notNull(),
  icon: varchar("icon", { length: 50 }).default("tag").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ExpenseCategory = typeof expenseCategories.$inferSelect;

// ─── Incomes ──────────────────────────────────────────────────────────────────
export const incomes = mysqlTable("incomes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  categoryId: int("categoryId"),
  description: varchar("description", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  date: date("date").notNull(),
  isRecurring: boolean("isRecurring").default(false).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Income = typeof incomes.$inferSelect;
export type InsertIncome = typeof incomes.$inferInsert;

// ─── Expenses ─────────────────────────────────────────────────────────────────
export const expenses = mysqlTable("expenses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  categoryId: int("categoryId"),
  description: varchar("description", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  date: date("date").notNull(),
  isRecurring: boolean("isRecurring").default(false).notNull(),
  notes: text("notes"),
  // Pagamento
  isPaid: boolean("isPaid").default(false).notNull(),
  paidAt: date("paidAt"),
  paymentMethod: mysqlEnum("paymentMethod", [
    "cash", "pix", "debit", "credit", "transfer", "other"
  ]),
  paymentCardId: int("paymentCardId"), // referência ao cartão se paymentMethod = credit/debit
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = typeof expenses.$inferInsert;

// ─── Credit Cards ─────────────────────────────────────────────────────────────
export const creditCards = mysqlTable("credit_cards", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  lastFourDigits: varchar("lastFourDigits", { length: 4 }),
  brand: varchar("brand", { length: 50 }).default("Visa").notNull(),
  creditLimit: decimal("creditLimit", { precision: 12, scale: 2 }),
  closingDay: int("closingDay").notNull(),
  dueDay: int("dueDay").notNull(),
  color: varchar("color", { length: 20 }).default("#6366f1").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CreditCard = typeof creditCards.$inferSelect;
export type InsertCreditCard = typeof creditCards.$inferInsert;

// ─── Credit Card Transactions ─────────────────────────────────────────────────────
export const creditCardTransactions = mysqlTable("credit_card_transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  creditCardId: int("creditCardId").notNull(),
  categoryId: int("categoryId"),
  description: varchar("description", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  date: date("date").notNull(),
  // credit = entra na fatura (mês calculado pelo fechamento), debit = débito imediato
  transactionType: mysqlEnum("transactionType", ["credit", "debit"]).default("credit").notNull(),
  isPaid: boolean("isPaid").default(false).notNull(), // débito é sempre true
  invoiceMonth: varchar("invoiceMonth", { length: 7 }).notNull(),
  installmentPurchaseId: int("installmentPurchaseId"),
  installmentNumber: int("installmentNumber"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CreditCardTransaction = typeof creditCardTransactions.$inferSelect;
export type InsertCreditCardTransaction = typeof creditCardTransactions.$inferInsert;

// ─── Installment Purchases ────────────────────────────────────────────────────
export const installmentPurchases = mysqlTable("installment_purchases", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  creditCardId: int("creditCardId"),
  categoryId: int("categoryId"),
  description: varchar("description", { length: 255 }).notNull(),
  totalAmount: decimal("totalAmount", { precision: 12, scale: 2 }).notNull(),
  installmentCount: int("installmentCount").notNull(),
  installmentAmount: decimal("installmentAmount", { precision: 12, scale: 2 }).notNull(),
  firstInstallmentDate: date("firstInstallmentDate").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InstallmentPurchase = typeof installmentPurchases.$inferSelect;
export type InsertInstallmentPurchase = typeof installmentPurchases.$inferInsert;

// ─── Recurring Items (receitas e despesas fixas) ──────────────────────────────
export const recurringItems = mysqlTable("recurring_items", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["income", "expense"]).notNull(),
  categoryId: int("categoryId"),
  description: varchar("description", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  dayOfMonth: int("dayOfMonth").notNull(), // dia do mês em que ocorre (1-31)
  // Para receitas: conta bancária onde cai o valor
  bankAccount: varchar("bankAccount", { length: 100 }),
  bankName: varchar("bankName", { length: 100 }),
  // Para despesas: forma de pagamento padrão
  paymentMethod: mysqlEnum("paymentMethod", [
    "cash", "pix", "debit", "credit", "transfer", "other"
  ]),
  paymentCardId: int("paymentCardId"),
  isActive: boolean("isActive").default(true).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RecurringItem = typeof recurringItems.$inferSelect;
export type InsertRecurringItem = typeof recurringItems.$inferInsert;

// ─── Goals (metas financeiras) ────────────────────────────────────────────────
export const goals = mysqlTable("goals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["monthly", "annual"]).notNull(),
  title: varchar("title", { length: 150 }).notNull(),
  description: text("description"),
  // Para metas mensais: limite de gasto por categoria
  categoryId: int("categoryId"), // null = meta geral de saldo
  limitAmount: decimal("limitAmount", { precision: 12, scale: 2 }).notNull(),
  // Para metas anuais: valor-alvo e progresso manual
  targetAmount: decimal("targetAmount", { precision: 12, scale: 2 }),
  currentAmount: decimal("currentAmount", { precision: 12, scale: 2 }).default("0").notNull(),
  // Período
  month: varchar("month", { length: 7 }), // YYYY-MM para metas mensais
  year: int("year"),                        // ano para metas anuais
  deadline: date("deadline"),               // prazo final para metas anuais
  // Status
  isActive: boolean("isActive").default(true).notNull(),
  isCompleted: boolean("isCompleted").default(false).notNull(),
  // Ícone/cor para identificação visual
  icon: varchar("icon", { length: 50 }).default("target"),
  color: varchar("color", { length: 20 }).default("#6366f1").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Goal = typeof goals.$inferSelect;
export type InsertGoal = typeof goals.$inferInsert;
