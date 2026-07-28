CREATE TABLE `equipment_assets` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`location` text NOT NULL,
	`status` text NOT NULL,
	`load` integer DEFAULT 0 NOT NULL,
	`power` integer DEFAULT 0 NOT NULL,
	`available_hours` integer DEFAULT 0 NOT NULL,
	`capability` text NOT NULL,
	`last_maintenance` text NOT NULL,
	`next_maintenance` text NOT NULL,
	`operator` text NOT NULL,
	`alert` text DEFAULT '' NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
