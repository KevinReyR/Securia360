# Securia360

Securia360 es una plataforma empresarial de gestión SG-SST desarrollada por Reinova Labs. La experiencia visual y sus patrones de interacción están documentados en [docs/design/experience-system.md](docs/design/experience-system.md). La evaluación de nombre e identidad permanece abierta y se documenta en [docs/brand/identity-and-naming.md](docs/brand/identity-and-naming.md).

Núcleo SaaS multiempresa de Reinova Labs para Securia360. Esta iteración incorpora autenticación, RBAC, aislamiento por RLS y estructura empresarial sobre Next.js y Supabase.

## Requisitos

- Node.js 22 o superior
- Un proyecto de Supabase

## Configuración local

1. Instala dependencias con `npm install` en la raíz.
2. Copia `apps/web/.env.example` a `apps/web/.env.local`.
3. En Supabase, abre **Project Settings → API** y copia la URL y la clave publicable. Nunca uses la clave secreta o `service_role` en variables `NEXT_PUBLIC_*`.
4. En **Authentication → URL Configuration**, configura `http://localhost:3000` como Site URL y agrega `http://localhost:3000/auth/callback` a Redirect URLs.
5. Define `NEXT_PUBLIC_SITE_URL` con la URL canónica de la aplicación. En local usa `http://localhost:3000`.
6. Ejecuta `npm run dev` y abre `http://localhost:3000`.

## Comprobaciones

```text
npm run typecheck
npm run lint
npm run test
npm run build
```

## Alcance actual

- Alta, confirmación, inicio y cierre de sesión con correo y contraseña.
- Sesiones SSR almacenadas en cookies.
- Renovación de tokens desde el proxy de Next.js.
- Validación de identidad con `getClaims()` en el borde y en el layout privado.
- Redirecciones internas validadas para impedir redirecciones abiertas.
- Selector de organización con rutas canónicas `/org/[organizationId]` y limpieza de caché al cambiar de tenant.
- Perfil, organización, razones sociales, sedes, áreas, miembros, roles y onboarding inicial.
- Permisos centralizados con `can(permission)` y alcance opcional por sede.
- Invitaciones mediante Edge Function autenticada; la clave `service_role` existe solo en el runtime de Supabase.
- Design system estilo shadcn/ui con Tailwind, primitivas Radix y app shell B2B responsive.
- Onboarding empresarial reanudable de nueve pasos con finalización transaccional e idempotente.
- Sidebar móvil/escritorio, breadcrumbs, búsqueda `Ctrl/Cmd + K`, notificaciones y menú de perfil.

## Base de datos

El núcleo SaaS ya está versionado en `supabase/migrations` e incluye perfiles, organizaciones, membresías, RBAC, razones sociales, sedes, áreas, caracterización, auditoría y el bucket privado de avatares. Consulta `docs/database/schema.md` y `docs/security/multi-tenancy.md`.

Los cambios remotos se aplican siempre desde migraciones versionadas y forward-only. Mizpa360 (`khnsudlcrpljlnvtynki`) solo recibe migraciones desde Codex cuando el usuario lo solicita explícitamente, tras revisar historial, drift, backup/PITR y RLS. Las pruebas remotas con usuarios o Storage efímero requieren un entorno aislado autorizado y nunca se ejecutan contra Mizpa360.
