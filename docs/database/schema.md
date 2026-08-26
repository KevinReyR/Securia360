# Esquema inicial de base de datos

## Núcleo implementado

| Dominio | Tablas | Propósito |
| --- | --- | --- |
| Identidad | `profiles` | Extensión 1:1 de `auth.users`; no almacena contraseñas. |
| Tenancy | `organizations`, `organization_members` | Tenant principal y relación multiempresa de usuarios. |
| RBAC | `roles`, `permissions`, `role_permissions`, `member_roles` | Permisos `module.action` y alcance opcional por sede. |
| Empresa | `legal_entities`, `sites`, `areas` | Jerarquía Organización → Razón social → Sede → Área. |
| Onboarding | `organization_characteristics` | Caracterización operativa inicial para aplicabilidad futura. |
| Auditoría | `audit_log` | Estructura append-only; el cliente autenticado solo puede consultar. |

## Convenciones

- UUID como clave primaria expuesta.
- `snake_case`, `timestamptz` y UTC.
- `organization_id NOT NULL` en entidades empresariales.
- Relaciones compuestas impiden enlazar sedes, áreas o membresías entre tenants.
- Cambios de tenant en filas existentes son rechazados mediante triggers.
- Todas las tablas del esquema `public` tienen RLS activo.
- Los accesos del Data API se conceden explícitamente; `anon` no tiene acceso a tablas empresariales.

## Fuera de esta migración

Las entidades normativas (`normative_sources`, `requirements`, `minimum_standards`, `risk_methodologies`, clasificaciones y snapshots) se incorporarán en la iteración normativa. La separación conceptual definida en `AGENTS.md` no debe colapsarse en una tabla genérica de regulaciones.

## Migraciones

- `20260826013555_harden_core_security_and_tenant_api.sql`: defaults seguros, RPC `can`, identidad inmutable de membresía y auditoría.
- `20260826014615_add_secure_member_invitation_api.sql`: invitación atómica y aceptación de membresías.
- `20260826015115_protect_last_organization_admin.sql`: evita dejar un tenant sin administrador activo.
- `20260826131521_allow_tenant_cascade_cleanup.sql`: conserva esa protección en operaciones directas sin bloquear cascadas del tenant.
- `20260826131659_skip_audit_during_tenant_cascade.sql`: evita recrear auditoría hija durante el borrado explícito de una organización.
- `20260826132501_preserve_existing_membership_status.sql`: una reinvitación no degrada membresías activas o suspendidas.

1. `create_saas_core`: tablas, restricciones, RLS, RBAC, triggers y bucket `avatars`.
2. `add_core_foreign_key_indexes`: índices de cobertura para claves foráneas.
3. `verify_core_tenant_isolation`: prueba transaccional User A/Organization A permitido y Organization B denegado.
