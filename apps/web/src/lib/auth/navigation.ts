export function safeNextPath(value: FormDataEntryValue | string | null | undefined) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

export function isPublicAuthPath(pathname: string) {
  return pathname === "/" || pathname === "/evaluacion-inicial" || pathname.startsWith("/evaluacion-inicial/") || pathname === "/auth/login" || pathname === "/auth/callback" || pathname === "/auth/confirm" || pathname === "/auth/activate" || pathname === "/auth/invitation-session" || pathname === "/auth/forgot-password" || pathname === "/auth/reset-password";
}
