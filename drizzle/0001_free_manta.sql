CREATE TABLE `process_costs` (
	`id` text PRIMARY KEY NOT NULL,
	`process_name` text NOT NULL,
	`aliases` text DEFAULT '[]' NOT NULL,
	`category` text NOT NULL,
	`equipment` text NOT NULL,
	`setup_cost` integer DEFAULT 0 NOT NULL,
	`unit_cost` integer DEFAULT 0 NOT NULL,
	`minute_cost` integer DEFAULT 0 NOT NULL,
	`labor_cost` integer DEFAULT 0 NOT NULL,
	`estimated_minutes` integer DEFAULT 0 NOT NULL,
	`source` text NOT NULL,
	`effective_date` text NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
