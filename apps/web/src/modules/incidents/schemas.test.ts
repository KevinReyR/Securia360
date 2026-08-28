import { describe, expect, it } from "vitest";
import { incidentActionStateSchema, incidentSchema } from "./schemas";
describe("incident schemas",()=>{it("rejects an invalid report",()=>expect(incidentSchema.safeParse({reference_code:"x",classification:"incident",summary:"x",occurred_at:null,site_id:null}).success).toBe(false));it("only permits controlled action states",()=>expect(incidentActionStateSchema.safeParse({id:"00000000-0000-4000-8000-000000000001",status:"closed"}).success).toBe(false));});
