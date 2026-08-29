const INJECTION = /ignore\s+(all|any|previous)|system\s+prompt|developer\s+message|instructions?\s*:|tool\s*(call|use)|act\s+as/iu;
export const hasPromptInjectionPattern = (value: string) => INJECTION.test(value);
export function safeContext(value: string, max = 700) {
  return value.replace(/[\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}
export function safeInternalPath(value: string | null | undefined) {
  return !!value && value.startsWith("/") && !value.startsWith("//") && !/^[a-z][a-z0-9+.-]*:/i.test(value);
}
