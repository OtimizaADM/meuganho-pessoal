import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
  date,
  numeric,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["user", "admin"]);
export const paymentMethodEnum = pgEnum("payment_method", ["cash", "pix", "debit", "credit", "transfer", "other"]);
export const transactionTypeEnum = pgEnum("transaction_type", ["credit", "debit"]);
export const recurringTypeEnum = pgEnum("recurring_type", ["income", "expense"]);
export const goalTypeEnum = pgEnum("goal_type", ["monthly", "annual"]);

export const users = pgTable("users", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum().default("user").notNull(),
  password: varchar("password", { length: 64 }),
  isBlocked: boolean("isBlocked").default(false).notNull(),
  blockedReason: text("blockedReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const incomeCategories = pgTable("income_categories", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  userId: integer("userId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  color: varchar("color", { length: 20 }).default("#10b981").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type IncomeCategory = typeof incomeCategories.$inferSelect;

export const expenseCategories = pgTable("expense_categories", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  userId: integer("userId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  color: varchar("color", { length: 20 }).default("#ef4444").notNull(),
  icon: varchar("icon", { length: 50 }).default("tag").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ExpenseCategory = typeof expenseCategories.$inferSelect;

export const incomes = pgTable("incomes", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  userId: integer("userId").notNull(),
  categoryId: integer("categoryId"),
  description: varchar("description", { length: 255 }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  date: date("date").notNull(),
  isRecurring: boolean("isRecurring").default(false).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type Income = typeof incomes.$inferSelect;
export type InsertIncome = typeof incomes.$inferInsert;

export const expenses = pgTable("expenses", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  userId: integer("userId").notNull(),
  categoryId: integer("categoryId"),
  description: varchar("description", { length: 255 }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  date: date("date").notNull(),
  isRecurring: boolean("isRecurring").default(false).notNull(),
  notes: text("notes"),
  isPaid: boolean("isPaid").default(false).notNull(),
  paidAt: date("paidAt"),
  paymentMethod: paymentMethodEnum(),
  paymentCardId: integer("paymentCardId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = typeof expenses.$inferInsert;

export const creditCards = pgTable("credit_cards", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  userId: integer("userId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  lastFourDigits: varchar("lastFourDigits", { length: 4 }),
  brand: varchar("brand", { length: 50 }).default("Visa").notNull(),
  creditLimit: numeric("creditLimit", { precision: 12, scale: 2 }),
  closingDay: integer("closingDay").notNull(),
  dueDay: integer("dueDay").notNull(),
  color: varchar("color", { length: 20 }).default("#6366f1").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type CreditCard = typeof creditCards.$inferSelect;
export type InsertCreditCard = typeof creditCards.$inferInsert;

export const creditCardTransactions = pgTable("credit_card_transactions", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  userId: integer("userId").notNull(),
  creditCardId: integer("creditCardId").notNull(),
  categoryId: integer("categoryId"),
  description: varchar("description", { length: 255 }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  date: date("date").notNull(),
  transactionType: transactionTypeEnum().default("credit").notNull(),
  isPaid: boolean("isPaid").default(false).notNull(),
  invoiceMonth: varchar("invoiceMonth", { length: 7 }).notNull(),
  installmentPurchaseId: integer("installmentPurchaseId"),
  installmentNumber: integer("installmentNumber"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type CreditCardTransaction = typeof creditCardTransactions.$inferSelect;
export type InsertCreditCardTransaction = typeof creditCardTransactions.$inferInsert;

export const installmentPurchases = pgTable("installment_purchases", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  userId: integer("userId").notNull(),
  creditCardId: integer("creditCardId"),
  categoryId: integer("categoryId"),
  description: varchar("description", { length: 255 }).notNull(),
  totalAmount: numeric("totalAmount", { precision: 12, scale: 2 }).notNull(),
  installmentCount: integer("installmentCount").notNull(),
  installmentAmount: numeric("installmentAmount", { precision: 12, scale: 2 }).notNull(),
  firstInstallmentDate: date("firstInstallmentDate").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type InstallmentPurchase = typeof installmentPurchases.$inferSelect;
export type InsertInstallmentPurchase = typeof installmentPurchases.$inferInsert;

export const recurringItems = pgTable("recurring_items", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  userId: integer("userId").notNull(),
  type: recurringTypeEnum().notNull(),
  categoryId: integer("categoryId"),
  description: varchar("description", { length: 255 }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  dayOfMonth: integer("dayOfMonth").notNull(),
  bankAccount: varchar("bankAccount", { length: 100 }),
  bankName: varchar("bankName", { length: 100 }),
  paymentMethod: paymentMethodEnum(),
  paymentCardId: integer("paymentCardId"),
  isActive: boolean("isActive").default(true).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type RecurringItem = typeof recurringItems.$inferSelect;
export type InsertRecurringItem = typeof recurringItems.$inferInsert;

export const goals = pgTable("goals", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  userId: integer("userId").notNull(),
  type: goalTypeEnum().notNull(),
  title: varchar("title", { length: 150 }).notNull(),
  description: text("description"),
  categoryId: integer("categoryId"),
  limitAmount: numeric("limitAmount", { precision: 12, scale: 2 }).notNull(),
  targetAmount: numeric("targetAmount", { precision: 12, scale: 2 }),
  currentAmount: numeric("currentAmount", { precision: 12, scale: 2 }).default("0").notNull(),
  month: varchar("month", { length: 7 }),
  year: integer("year"),
  deadline: date("deadline"),
  isActive: boolean("isActive").default(true).notNull(),
  isCompleted: boolean("isCompleted").default(false).notNull(),
  icon: varchar("icon", { length: 50 }).default("target"),
  color: varchar("color", { length: 20 }).default("#6366f1").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type Goal = typeof goals.$inferSelect;
export type InsertGoal = typeof goals.$inferInsert;
