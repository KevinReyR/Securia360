# Arquitectura del núcleo SaaS

Securia360 usa un monolito modular en Next.js y PostgreSQL/Supabase como fuente de verdad. La organización es el tenant principal. La ruta canónica de cualquier pantalla empresarial es `/org/[organizationId]/...`.

## Identidad y tenant activo

Supabase Auth verifica la identidad. La URL identifica el contexto solicitado y RLS valida que el usuario sea miembro activo. La cookie HTTP-only `securia_active_organization` es solo una preferencia para redirecciones; nunca concede acceso.

Al cambiar de organización, el selector:

1. vacía el `QueryClient`;
2. valida la membresía contra Supabase;
3. actualiza la cookie segura;
4. reconstruye la URL con el nuevo `organizationId`.

Todas las claves de TanStack Query comienzan por `['organization', organizationId]`. Las consultas de servidor incluyen además `organization_id` aunque RLS sea la autoridad final.

## Límites del monolito

- `modules/auth`: identidad y permisos centralizados.
- `modules/organizations`: tenant, onboarding y estructura empresarial.
- `lib/supabase`: clientes SSR y browser con clave publicable.
- `supabase/functions`: operaciones privilegiadas como invitaciones.

El dominio normativo y los módulos operativos permanecen fuera de esta etapa.
