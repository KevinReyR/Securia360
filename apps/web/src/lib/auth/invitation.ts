import { z } from "zod";

const organizationIdSchema = z.uuid();

export const invitationSessionSchema = z.object({
  accessToken: z.string().min(1).max(8192),
  refreshToken: z.string().min(1).max(2048),
  organizationId: organizationIdSchema,
}).strict();

export const accountActivationSchema = z.object({
  organizationId: organizationIdSchema,
  password: z.string().min(10, "Usa al menos 10 caracteres.").max(72),
  confirmation: z.string(),
  first_name: z.string().trim().min(1, "Ingresa tu primer nombre.").max(80),
  middle_name: z.string().trim().max(200).optional().transform((value) => value || null),
  last_name: z.string().trim().min(1, "Ingresa tu primer apellido.").max(80),
  second_last_name: z.string().trim().max(200).optional().transform((value) => value || null),
  phone: z.string().trim().min(7, "Ingresa un teléfono válido.").max(30),
}).refine((value) => value.password === value.confirmation, {
  message: "Las contraseñas no coinciden.",
  path: ["confirmation"],
});

export function activationPath(organizationId: string) {
  if (!organizationIdSchema.safeParse(organizationId).success) return null;
  const params = new URLSearchParams({ organizationId });
  return `/auth/activate?${params.toString()}`;
}

export function resolveInviteRedirect(value: string | null, applicationOrigin: string) {
  if (!value) return null;

  try {
    const expectedOrigin = new URL(applicationOrigin).origin;
    const candidate = new URL(value, expectedOrigin);
    if (candidate.origin !== expectedOrigin || candidate.pathname !== "/auth/activate") return null;
    const organizationId = candidate.searchParams.get("organizationId") ?? "";
    if ([...candidate.searchParams.keys()].some((key) => key !== "organizationId")) return null;
    return activationPath(organizationId);
  } catch {
    return null;
  }
}

export function isSameOriginRequest(origin: string | null, requestUrl: string) {
  if (!origin) return false;

  try {
    return new URL(origin).origin === new URL(requestUrl).origin;
  } catch {
    return false;
  }
}
