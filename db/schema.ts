import {sql} from "drizzle-orm";
import {AnySQLiteColumn,check,integer,real,sqliteTable,text} from "drizzle-orm/sqlite-core";

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

export const resourceCatalog=sqliteTable("resource_catalog",{
  id:text("id").primaryKey(),
  kind:text("kind").notNull(),
  name:text("name").notNull(),
  category:text("category").notNull(),
  code:text("code").notNull(),
  specification:text("specification").notNull(),
  unit:text("unit").notNull(),
  unitPrice:integer("unit_price").notNull().default(0),
  supplier:text("supplier").notNull(),
  leadDays:integer("lead_days").notNull().default(0),
  stockQuantity:integer("stock_quantity").notNull().default(0),
  safetyStock:integer("safety_stock").notNull().default(0),
  properties:text("properties").notNull().default("{}"),
  source:text("source").notNull(),
  effectiveDate:text("effective_date").notNull(),
  enabled:integer("enabled",{mode:"boolean"}).notNull().default(true),
  createdAt:text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const equipmentAssets=sqliteTable("equipment_assets",{
  id:text("id").primaryKey(),code:text("code").notNull(),name:text("name").notNull(),category:text("category").notNull(),location:text("location").notNull(),status:text("status").notNull(),
  load:integer("load").notNull().default(0),power:integer("power").notNull().default(0),availableHours:integer("available_hours").notNull().default(0),capability:text("capability").notNull(),
  lastMaintenance:text("last_maintenance").notNull(),nextMaintenance:text("next_maintenance").notNull(),operator:text("operator").notNull(),alert:text("alert").notNull().default(""),enabled:integer("enabled",{mode:"boolean"}).notNull().default(true),
  createdAt:text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),updatedAt:text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
export const materials=sqliteTable("materials",{
  id:text("id").primaryKey(),
  materialCode:text("material_code").notNull().unique(),
  materialName:text("material_name").notNull(),
  unit:text("unit").notNull(),
  unitCost:real("unit_cost").notNull().default(0),
  defaultWasteRate:real("default_waste_rate").notNull().default(0),
  moqQuantity:integer("moq_quantity").notNull().default(1),
  alternativeMaterialId:text("alternative_material_id").references(():AnySQLiteColumn=>materials.id,{onDelete:"set null"}),
});

export const bomCalculationRules=sqliteTable("bom_calculation_rules",{
  id:text("id").primaryKey(),
  projectId:text("project_id").references(()=>projects.id,{onDelete:"cascade"}),
  templateCode:text("template_code"),
  partName:text("part_name").notNull(),
  formulaExpression:text("formula_expression").notNull(),
  defaultMaterialId:text("default_material_id").references(()=>materials.id,{onDelete:"set null"}),
},(table)=>[
  check("bom_rules_project_or_template_check",sql`${table.projectId} is not null or ${table.templateCode} is not null`),
]);

export const offcutInventory=sqliteTable("offcut_inventory",{
  id:text("id").primaryKey(),
  materialId:text("material_id").notNull().references(()=>materials.id,{onDelete:"cascade"}),
  length:integer("length").notNull(),
  width:integer("width"),
  thickness:integer("thickness"),
  residualValue:real("residual_value").notNull().default(0),
  location:text("location").notNull().default("MAIN"),
  status:text("status").notNull().default("available"),
},(table)=>[
  check("offcut_inventory_status_check",sql`${table.status} in ('available','locked','used')`),
]);

export const quotes=sqliteTable("quotes",{
  id:text("id").primaryKey(),
  quoteNo:text("quote_no").notNull().unique(),
  projectId:text("project_id").notNull().references(()=>projects.id,{onDelete:"cascade"}),
  customerName:text("customer_name").notNull(),
  targetBudget:real("target_budget"),
  status:text("status").notNull().default("draft"),
  inventoryLockStatus:text("inventory_lock_status").notNull().default("none"),
});

export const quoteVersions=sqliteTable("quote_versions",{
  id:text("id").primaryKey(),
  quoteId:text("quote_id").notNull().references(()=>quotes.id,{onDelete:"cascade"}),
  versionNumber:text("version_number").notNull(),
  internalCostJson:text("internal_cost_json",{mode:"json"}).$type<Record<string,unknown>>().notNull().default({}),
  clientFacingJson:text("client_facing_json",{mode:"json"}).$type<Record<string,unknown>>().notNull().default({}),
  totalQuotePrice:real("total_quote_price").notNull().default(0),
  calculatedMargin:real("calculated_margin").notNull().default(0),
  createdAt:integer("created_at").notNull().default(sql`(unixepoch())`),
});
