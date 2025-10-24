CREATE TABLE `companies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cnpj` varchar(18) NOT NULL,
	`razaoSocial` varchar(255) NOT NULL,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `companies_id` PRIMARY KEY(`id`),
	CONSTRAINT `companies_cnpj_unique` UNIQUE(`cnpj`)
);
--> statement-breakpoint
CREATE TABLE `groups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`groupName` varchar(100) NOT NULL,
	`departmentName` varchar(255) NOT NULL,
	`respondentCount` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `groups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `assessments` DROP FOREIGN KEY `assessments_userId_users_id_fk`;
--> statement-breakpoint
ALTER TABLE `assessments` MODIFY COLUMN `compliancePercentage` decimal(5,2) NOT NULL DEFAULT '0';--> statement-breakpoint
ALTER TABLE `answers` ADD `responseCount` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `assessments` ADD `companyId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `companies` ADD CONSTRAINT `companies_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `groups` ADD CONSTRAINT `groups_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assessments` ADD CONSTRAINT `assessments_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assessments` DROP COLUMN `userId`;