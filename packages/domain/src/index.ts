export type TenantScoped = { organizationId: string };
export type SyncOperation = TenantScoped & { idempotencyKey: string; entity: "task" | "inspection" | "evidence"; operation: "create" | "update"; payload: Record<string, unknown>; createdAt: string };
