import { describe, expect, it } from "vitest";
import { assessmentSchema, controlSchema, identificationSchema } from "./risk-schemas";
const id="10000000-0000-4000-8000-000000000001";
describe("risk schemas",()=>{
 it("requires tenant-safe identities and structured hierarchy",()=>expect(controlSchema.safeParse({risk_identification_id:id,control_type:"ENGINEERING",description:"Guard",responsible_user_id:"",target_date:"",task_id:"",improvement_action_id:"",evidence_document_version_id:""}).success).toBe(true));
 it("rejects invalid identification and evaluation identities",()=>{expect(identificationSchema.safeParse({risk_task_id:"x",hazard_id:id,description:"Peligro"}).success).toBe(false);expect(assessmentSchema.safeParse({risk_identification_id:id,risk_methodology_version_id:"x",parent_risk_assessment_id:"",input_data:"{}"}).success).toBe(false);});
});
