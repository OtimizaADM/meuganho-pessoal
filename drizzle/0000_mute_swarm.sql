CREATE TYPE "public"."goal_type" AS ENUM('monthly', 'annual');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('cash', 'pix', 'debit', 'credit', 'transfer', 'other');--> statement-breakpoint
CREATE TYPE "public"."recurring_type" AS ENUM('income', 'expense');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('credit', 'debit');--> statement-breakpoint
CREATE TABLE "credit_card_transactions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "credit_card_transactions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"creditCardId" integer NOT NULL,
	"categoryId" integer,
	"description" varchar(255) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"date" date NOT NULL,
	"transactionType" "transaction_type" DEFAULT 'credit' NOT NULL,
	"isPaid" boolean DEFAULT false NOT NULL,
	"invoiceMonth" varchar(7) NOT NULL,
	"installmentPurchaseId" integer,
	"installmentNumber" integer,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_cards" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "credit_cards_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"lastFourDigits" varchar(4),
	"brand" varchar(50) DEFAULT 'Visa' NOT NULL,
	"creditLimit" numeric(12, 2),
	"closingDay" integer NOT NULL,
	"dueDay" integer NOT NULL,
	"color" varchar(20) DEFAULT '#6366f1' NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expense_categories" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "expense_categories_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"color" varchar(20) DEFAULT '#ef4444' NOT NULL,
	"icon" varchar(50) DEFAULT 'tag' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "expenses_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"categoryId" integer,
	"description" varchar(255) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"date" date NOT NULL,
	"isRecurring" boolean DEFAULT false NOT NULL,
	"notes" text,
	"isPaid" boolean DEFAULT false NOT NULL,
	"paidAt" date,
	"paymentMethod" "payment_method",
	"paymentCardId" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "goals" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "goals_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"type" "goal_type" NOT NULL,
	"title" varchar(150) NOT NULL,
	"description" text,
	"categoryId" integer,
	"limitAmount" numeric(12, 2) NOT NULL,
	"targetAmount" numeric(12, 2),
	"currentAmount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"month" varchar(7),
	"year" integer,
	"deadline" date,
	"isActive" boolean DEFAULT true NOT NULL,
	"isCompleted" boolean DEFAULT false NOT NULL,
	"icon" varchar(50) DEFAULT 'target',
	"color" varchar(20) DEFAULT '#6366f1' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "income_categories" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "income_categories_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"color" varchar(20) DEFAULT '#10b981' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "incomes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "incomes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"categoryId" integer,
	"description" varchar(255) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"date" date NOT NULL,
	"isRecurring" boolean DEFAULT false NOT NULL,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "installment_purchases" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "installment_purchases_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"creditCardId" integer,
	"categoryId" integer,
	"description" varchar(255) NOT NULL,
	"totalAmount" numeric(12, 2) NOT NULL,
	"installmentCount" integer NOT NULL,
	"installmentAmount" numeric(12, 2) NOT NULL,
	"firstInstallmentDate" date NOT NULL,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recurring_items" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "recurring_items_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"type" "recurring_type" NOT NULL,
	"categoryId" integer,
	"description" varchar(255) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"dayOfMonth" integer NOT NULL,
	"bankAccount" varchar(100),
	"bankName" varchar(100),
	"paymentMethod" "payment_method",
	"paymentCardId" integer,
	"isActive" boolean DEFAULT true NOT NULL,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"password" varchar(64),
	"isBlocked" boolean DEFAULT false NOT NULL,
	"blockedReason" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
