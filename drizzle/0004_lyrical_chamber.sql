CREATE TABLE `bom_calculation_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text,
	`template_code` text,
	`part_name` text NOT NULL,
	`formula_expression` text NOT NULL,
	`default_material_id` text,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`default_material_id`) REFERENCES `materials`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "bom_rules_project_or_template_check" CHECK("bom_calculation_rules"."project_id" is not null or "bom_calculation_rules"."template_code" is not null)
);
--> statement-breakpoint
CREATE TABLE `materials` (
	`id` text PRIMARY KEY NOT NULL,
	`material_code` text NOT NULL,
	`material_name` text NOT NULL,
	`unit` text NOT NULL,
	`unit_cost` real DEFAULT 0 NOT NULL,
	`default_waste_rate` real DEFAULT 0 NOT NULL,
	`alternative_material_id` text,
	FOREIGN KEY (`alternative_material_id`) REFERENCES `materials`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `materials_material_code_unique` ON `materials` (`material_code`);--> statement-breakpoint
CREATE TABLE `offcut_inventory` (
	`id` text PRIMARY KEY NOT NULL,
	`material_id` text NOT NULL,
	`length` integer NOT NULL,
	`width` integer,
	`thickness` integer,
	`residual_value` real DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'available' NOT NULL,
	FOREIGN KEY (`material_id`) REFERENCES `materials`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "offcut_inventory_status_check" CHECK("offcut_inventory"."status" in ('available','locked','used'))
);
--> statement-breakpoint
CREATE TABLE `quote_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`quote_id` text NOT NULL,
	`version_number` text NOT NULL,
	`internal_cost_json` text DEFAULT '{}' NOT NULL,
	`client_facing_json` text DEFAULT '{}' NOT NULL,
	`total_quote_price` real DEFAULT 0 NOT NULL,
	`calculated_margin` real DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`quote_id`) REFERENCES `quotes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `quotes` (
	`id` text PRIMARY KEY NOT NULL,
	`quote_no` text NOT NULL,
	`project_id` text NOT NULL,
	`customer_name` text NOT NULL,
	`target_budget` real,
	`status` text DEFAULT 'draft' NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `quotes_quote_no_unique` ON `quotes` (`quote_no`);