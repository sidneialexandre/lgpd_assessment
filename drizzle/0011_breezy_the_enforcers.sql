ALTER TABLE `assessmentGroups` ADD `totalScore` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `assessmentGroups` ADD `compliancePercentage` decimal(5,2) DEFAULT '0' NOT NULL;