ALTER TABLE `respondentSessions` DROP INDEX `respondentSessions_accessToken_unique`;--> statement-breakpoint
ALTER TABLE `respondentSessions` MODIFY COLUMN `accessToken` varchar(255);