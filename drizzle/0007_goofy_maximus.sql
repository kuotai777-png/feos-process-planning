CREATE TABLE `loss_reasons` (
	`id` text PRIMARY KEY NOT NULL,
	`quote_id` text NOT NULL,
	`reason_category` text NOT NULL,
	`competitor_name` text,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`quote_id`) REFERENCES `quotes`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "loss_reasons_category_check" CHECK("loss_reasons"."reason_category" in ('PRICE_TOO_HIGH','LEAD_TIME_TOO_LONG','COMPETITOR_WON'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `loss_reasons_quote_id_unique` ON `loss_reasons` (`quote_id`);--> statement-breakpoint
ALTER TABLE `quotes` ADD `approval_trigger` text;--> statement-breakpoint
ALTER TABLE `quotes` ADD `reviewed_at` integer;--> statement-breakpoint
ALTER TABLE `quotes` ADD `reviewed_by` text;--> statement-breakpoint
ALTER TABLE `quotes` ADD `review_comments` text;