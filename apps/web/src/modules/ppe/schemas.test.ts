import { describe, expect, it } from "vitest";
import { deliverySchema, movementSchema, ppeCatalogSchema } from "./schemas";

const id = "10000000-0000-4000-8000-000000000001";
describe("PPE schemas", () => {
  it("rejects an empty inventory movement", () => expect(movementSchema.safeParse({ inventory_id: id, movement_type: "purchase", quantity: 0, note: "", evidence_document_version_id: "" }).success).toBe(false));
  it("requires a positive delivery", () => expect(deliverySchema.safeParse({ assignment_id: id, inventory_id: id, quantity: -1, evidence_document_version_id: "", delivery_kind: "initial" }).success).toBe(false));
  it("accepts catalog useful life and optional tenant links", () => expect(ppeCatalogSchema.safeParse({ code: "CASCO-01", name: "Casco dieléctrico", category: "Cabeza", description: "", useful_life_days: "365", hazard_id: "", risk_control_id: "" }).success).toBe(true));
});
