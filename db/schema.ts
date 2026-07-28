import {sql} from "drizzle-orm";
import {integer,sqliteTable,text} from "drizzle-orm/sqlite-core";

export const projects=sqliteTable("projects",{
  id:text("id").primaryKey(),
  name:text("name").notNull(),
  customer:text("customer").notNull(),
  product:text("product").notNull(),
  status:text("status").notNull().default("draft"),
  createdAt:text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const projectArtifacts=sqliteTable("project_artifacts",{
  id:integer("id").primaryKey({autoIncrement:true}),
  projectId:text("project_id").notNull().references(()=>projects.id),
  artifactType:text("artifact_type").notNull(),
  content:text("content").notNull().default("{}"),
  revision:integer("revision").notNull().default(1),
  createdAt:text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const evidenceSources=sqliteTable("evidence_sources",{
  id:integer("id").primaryKey({autoIncrement:true}),
  projectId:text("project_id").notNull().references(()=>projects.id),
  sourceType:text("source_type").notNull(),
  title:text("title").notNull(),
  sourceUrl:text("source_url"),
  citation:text("citation"),
  matchScore:integer("match_score"),
  addedBy:text("added_by").notNull().default("ai"),
  createdAt:text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const processCosts=sqliteTable("process_costs",{
  id:text("id").primaryKey(),
  processName:text("process_name").notNull(),
  aliases:text("aliases").notNull().default("[]"),
  category:text("category").notNull(),
  equipment:text("equipment").notNull(),
  setupCost:integer("setup_cost").notNull().default(0),
  unitCost:integer("unit_cost").notNull().default(0),
  minuteCost:integer("minute_cost").notNull().default(0),
  laborCost:integer("labor_cost").notNull().default(0),
  estimatedMinutes:integer("estimated_minutes").notNull().default(0),
  source:text("source").notNull(),
  effectiveDate:text("effective_date").notNull(),
  enabled:integer("enabled",{mode:"boolean"}).notNull().default(true),
  createdAt:text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
