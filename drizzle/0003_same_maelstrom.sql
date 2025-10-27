CREATE TABLE `individualAnswers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`respondentSessionId` int NOT NULL,
	`questionId` int NOT NULL,
	`selectedAnswer` varchar(1) NOT NULL,
	`score` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `individualAnswers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `respondentSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assessmentId` int NOT NULL,
	`groupId` int NOT NULL,
	`respondentNumber` int NOT NULL,
	`isCompleted` int NOT NULL DEFAULT 0,
	`totalScore` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `respondentSessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `answers` MODIFY COLUMN `responseCount` int NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `assessments` ADD `isCompleted` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `groups` ADD `respondentsCompleted` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `individualAnswers` ADD CONSTRAINT `individualAnswers_respondentSessionId_respondentSessions_id_fk` FOREIGN KEY (`respondentSessionId`) REFERENCES `respondentSessions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `respondentSessions` ADD CONSTRAINT `respondentSessions_assessmentId_assessments_id_fk` FOREIGN KEY (`assessmentId`) REFERENCES `assessments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `respondentSessions` ADD CONSTRAINT `respondentSessions_groupId_groups_id_fk` FOREIGN KEY (`groupId`) REFERENCES `groups`(`id`) ON DELETE no action ON UPDATE no action;