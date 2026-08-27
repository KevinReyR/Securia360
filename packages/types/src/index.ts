export type MobileTask = { id:string; organizationId:string; title:string; status:string; dueAt?:string|null };
export type SyncConflict = { operationId:string; reason:"server_changed"|"permission_denied"|"validation_error"; serverValue?:unknown };
