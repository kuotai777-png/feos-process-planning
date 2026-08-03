import {z} from "zod";

const materialSyncItem=z.object({
  material_code:z.string().trim().min(1).max(100),
  material_name:z.string().trim().min(1).max(200).optional(),
  unit:z.string().trim().min(1).max(20).optional(),
  unit_cost:z.number().finite().nonnegative(),
  default_waste_rate:z.number().finite().min(0).max(1),
  moq_quantity:z.number().int().positive(),
  alternative_material_id:z.string().trim().min(1).max(100).nullable().optional(),
}).strict();

export const materialSyncSchema=z.union([
  z.array(materialSyncItem).min(1).max(500),
  z.object({materials:z.array(materialSyncItem).min(1).max(500)}).strict(),
]).transform(value=>Array.isArray(value)?{materials:value}:value);

export const availabilityCheckSchema=z.object({
  material_code:z.string().trim().min(1).max(100),
  length:z.number().int().positive(),
  width:z.number().int().positive(),
  thickness:z.number().int().positive().optional(),
  limit:z.number().int().min(1).max(100).default(50),
}).strict();

export const inventoryReserveSchema=z.object({
  quote_no:z.string().trim().min(1).max(100),
  items:z.array(z.object({offcut_id:z.string().trim().min(1).max(100)}).strict()).min(1).max(500),
}).strict();

const bomDetail=z.object({
  material_code:z.string().trim().min(1).max(100),
  quantity:z.number().finite().positive(),
  unit:z.string().trim().min(1).max(20),
  offcut_ids:z.array(z.string().trim().min(1).max(100)).max(500).default([]),
}).strict();

export const orderCreateSchema=z.object({
  quote_no:z.string().trim().min(1).max(100),
  quote_version_id:z.string().trim().min(1).max(100).optional(),
  contract_reference:z.string().trim().min(1).max(200),
  bom_details:z.array(bomDetail).min(1).max(1000),
}).strict();