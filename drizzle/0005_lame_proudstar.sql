ALTER TABLE `materials` ADD `moq_quantity` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `offcut_inventory` ADD `location` text DEFAULT 'MAIN' NOT NULL;--> statement-breakpoint
ALTER TABLE `quotes` ADD `inventory_lock_status` text DEFAULT 'none' NOT NULL;