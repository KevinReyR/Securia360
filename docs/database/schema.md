# Esquema inicial de base de datos

## Núcleo implementado

| Dominio | Tablas | Propósito |
| --- | --- | --- |
| Identidad | `profiles` | Extensión 1:1 de `auth.users`; no almacena contraseñas. |
| Tenancy | `organizations`, `organization_members` | Tenant principal y relación multiempresa de usuarios. |
| RBAC | `roles`, `permissions`, `role_permissions`, `member_roles` | Permisos `module.action` y alcance opcional por sede. |
| Empresa | `legal_entities`, `sites`, `areas` | Jerarquía Organización → Razón social → Sede → Área. |
| Onboarding | `onboarding_progress`, `organization_characteristics` | Borrador reanudable y caracterización operativa inicial. |
| Eventos | `domain_events` | Evento transaccional interno para el clasificador futuro; sin acceso directo del Data API. |
| Auditoría | `audit_log` | Estructura append-only; el cliente autenticado solo puede consultar. |
| Mejoramiento | `improvement_findings`, `improvement_gaps`, `improvement_actions` | Trazabilidad desde la evaluación, requisito o hallazgo hacia acción, evidencia y validación. |
| Planificación | `annual_plans`, `plan_activities`, `tasks` y tablas auxiliares | Plan anual, actividades y tareas reutilizables con dependencias, recurrencia y evidencia. |
| Riesgos | `risk_methodologies`, versiones y configuraciones | Metodologías técnicas versionadas y evaluaciones que conservan la versión exacta usada. |

## Convenciones

- UUID como clave primaria expuesta.
- `snake_case`, `timestamptz` y UTC.
- `organization_id NOT NULL` en entidades empresariales.
- Relaciones compuestas impiden enlazar sedes, áreas o membresías entre tenants.
- Cambios de tenant en filas existentes son rechazados mediante triggers.
- Todas las tablas del esquema `public` tienen RLS activo.
- Los accesos del Data API se conceden explícitamente; `anon` no tiene acceso a tablas empresariales.

## Eliminación de estructura empresarial

- Una razón social con sedes no se puede eliminar (`RESTRICT`). Primero deben eliminarse o reasignarse sus sedes.
- Eliminar una sede elimina sus áreas y asignaciones con alcance de sede (`CASCADE`); la interfaz exige escribir el nombre de la sede para confirmar.
- Eliminar un área conserva sus áreas hijas y las deja sin área superior (`SET NULL`); la interfaz exige la misma confirmación.
- Las acciones consultan y eliminan siempre por `organization_id` e `id`; ni los formularios ni el cliente pueden cambiar el tenant de una fila o enlazar relaciones de otro tenant.

## Fuera de esta migración

Las entidades normativas (`normative_sources`, `requirements`, `minimum_standards`, `risk_methodologies`, clasificaciones y snapshots) se incorporarán en la iteración normativa. La separación conceptual definida en `AGENTS.md` no debe colapsarse en una tabla genérica de regulaciones.

## Migraciones

- `20260826013555_harden_core_security_and_tenant_api.sql`: defaults seguros, RPC `can`, identidad inmutable de membresía y auditoría.
- `20260826014615_add_secure_member_invitation_api.sql`: invitación atómica y aceptación de membresías.
- `20260826015115_protect_last_organization_admin.sql`: evita dejar un tenant sin administrador activo.
- `20260826243000_allow_creator_admin_bootstrap.sql`: permite únicamente la asignación inicial y segura del creador como administrador global durante el bootstrap de su organización.
- `20260826250000_add_improvement_plan.sql`: convierte resultados no cumplidos en brechas y acciones idempotentes, con evidencia, validación, auditoría y RLS.
- `20260826260000_add_planning_and_tasks.sql`: agrega plan anual, actividades, tareas, dependencias, comentarios, evidencias y recurrencias UTC idempotentes.
- `20260826270000_add_versioned_risk_methodologies.sql`: añade metodologías técnicas, GTC 45 estructural y evaluaciones con versión exacta.
- `20260826131521_allow_tenant_cascade_cleanup.sql`: conserva esa protección en operaciones directas sin bloquear cascadas del tenant.
- `20260826131659_skip_audit_during_tenant_cascade.sql`: evita recrear auditoría hija durante el borrado explícito de una organización.
- `20260826132501_preserve_existing_membership_status.sql`: una reinvitación no degrada membresías activas o suspendidas.
- `20260826144326_add_transactional_onboarding.sql`: progreso por pasos, finalización atómica, responsable SST y evento de cambio de datos fuente.
- `20260826144539_harden_transactional_onboarding.sql`: mueve las implementaciones privilegiadas al esquema privado y deja wrappers invoker en la API.
- `20260826144941_verify_transactional_onboarding.sql`: valida reanudación, idempotencia, roles, evento único y denegación entre tenants con fixtures efímeros.

1. `create_saas_core`: tablas, restricciones, RLS, RBAC, triggers y bucket `avatars`.
2. `add_core_foreign_key_indexes`: índices de cobertura para claves foráneas.
3. `verify_core_tenant_isolation`: prueba transaccional User A/Organization A permitido y Organization B denegado.
