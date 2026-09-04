export function safeNextPath(value: FormDataEntryValue | string | null | undefined) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

export function isPublicAuthPath(pathname: string) {
  return pathname === "/" || pathname === "/auth/login" || pathname === "/auth/signup" || pathname === "/auth/callback" || pathname === "/auth/forgot-password" || pathname === "/auth/reset-password";
}
