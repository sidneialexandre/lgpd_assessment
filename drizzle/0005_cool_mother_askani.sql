ALTER TABLE `answers` DROP FOREIGN KEY `answers_assessmentId_assessments_id_fk`;
--> statement-breakpoint
ALTER TABLE `individualAnswers` DROP FOREIGN KEY `individualAnswers_respondentSessionId_respondentSessions_id_fk`;
--> statement-breakpoint
ALTER TABLE `respondentSessions` DROP FOREIGN KEY `respondentSessions_assessmentId_assessments_id_fk`;
--> statement-breakpoint
ALTER TABLE `respondentSessions` DROP FOREIGN KEY `respondentSessions_groupId_groups_id_fk`;
--> statement-breakpoint
ALTER TABLE `answers` ADD CONSTRAINT `answers_assessmentId_assessments_id_fk` FOREIGN KEY (`assessmentId`) REFERENCES `assessments`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `individualAnswers` ADD CONSTRAINT `individualAnswers_respondentSessionId_respondentSessions_id_fk` FOREIGN KEY (`respondentSessionId`) REFERENCES `respondentSessions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `respondentSessions` ADD CONSTRAINT `respondentSessions_assessmentId_assessments_id_fk` FOREIGN KEY (`assessmentId`) REFERENCES `assessments`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `respondentSessions` ADD CONSTRAINT `respondentSessions_groupId_groups_id_fk` FOREIGN KEY (`groupId`) REFERENCES `groups`(`id`) ON DELETE cascade ON UPDATE no action;