CREATE TABLE `goals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('monthly','annual') NOT NULL,
	`title` varchar(150) NOT NULL,
	`description` text,
	`categoryId` int,
	`limitAmount` decimal(12,2) NOT NULL,
	`targetAmount` decimal(12,2),
	`currentAmount` decimal(12,2) NOT NULL DEFAULT '0',
	`month` varchar(7),
	`year` int,
	`deadline` date,
	`isActive` boolean NOT NULL DEFAULT true,
	`isCompleted` boolean NOT NULL DEFAULT false,
	`icon` varchar(50) DEFAULT 'target',
	`color` varchar(20) NOT NULL DEFAULT '#6366f1',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `goals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `recurring_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('income','expense') NOT NULL,
	`categoryId` int,
	`description` varchar(255) NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`dayOfMonth` int NOT NULL,
	`bankAccount` varchar(100),
	`bankName` varchar(100),
	`paymentMethod` enum('cash','pix','debit','credit','transfer','other'),
	`paymentCardId` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `recurring_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `expenses` ADD `isPaid` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `expenses` ADD `paidAt` date;--> statement-breakpoint
ALTER TABLE `expenses` ADD `paymentMethod` enum('cash','pix','debit','credit','transfer','other');--> statement-breakpoint
ALTER TABLE `expenses` ADD `paymentCardId` int;