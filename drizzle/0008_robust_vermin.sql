CREATE TABLE `assessmentGroups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assessmentId` int NOT NULL,
	`groupId` int NOT NULL,
	`groupName` varchar(100) NOT NULL,
	`departmentName` varchar(255) NOT NULL,
	`respondentCount` int NOT NULL,
	`respondentsCompleted` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `assessmentGroups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `assessmentGroups` ADD CONSTRAINT `assessmentGroups_assessmentId_assessments_id_fk` FOREIGN KEY (`assessmentId`) REFERENCES `assessments`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assessmentGroups` ADD CONSTRAINT `assessmentGroups_groupId_groups_id_fk` FOREIGN KEY (`groupId`) REFERENCES `groups`(`id`) ON DELETE cascade ON UPDATE no action;