import { z } from "zod";
export const mobileSyncOperationSchema = z.object({ organizationId:z.string().uuid(),idempotencyKey:z.string().uuid(),entity:z.enum(["task","inspection","evidence"]),operation:z.enum(["create","update"]),payload:z.record(z.string(),z.unknown()),createdAt:z.string().datetime() });
