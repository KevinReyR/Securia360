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
| Matriz de riesgos | `processes`, `activities`, `risk_tasks`, `risk_identifications`, `risk_controls`, `risk_control_verifications`, `risk_control_alerts` | Cadena auditable de peligro, valoración, control, eficacia histórica y alertas. |
| Capacitación | `training_catalog`, `training_plans`, `training_sessions`, `training_enrollments`, `training_attendances`, `training_evaluations`, `training_certificates` | Trazabilidad de capacitación con mínima información personal y evidencia privada. |
| EPP | `ppe_catalog`, `ppe_inventory`, `ppe_inventory_movements`, `ppe_assignments`, `ppe_deliveries`, `ppe_inspections`, `ppe_retirements` | Inventario transaccional e historial por miembro y elemento. |
| Contratistas | `contractor_organizations`, contactos, contratos, requisitos, documentos, evaluaciones y accesos portal | Portal limitado por contrato/sede y documentos verificables. |
| Incidentes | `incidents`, investigación, causas, acciones, evidencia y detalles sensibles separados | Privacidad reforzada y trazabilidad sin conclusiones automáticas. |
| Salud ocupacional | conceptos de aptitud, restricciones, programas y decisiones confirmadas | Datos mínimos, sin historias clínicas ni diagnósticos. |
| Emergencias | escenarios, recursos, brigadas, planes, simulacros, resultados, hallazgos y acciones | Preparación y simulacros trazables por sede, con planes versionados y acciones verificables. |
| Gobierno y analítica | comités, auditorías, revisión por la dirección e indicadores versionados | Históricos, segregación de aprobación y resultados reproducibles por período. |
| Notificaciones | preferencias, plantillas, bandeja y cola de entrega | Bandeja privada e idempotencia por evento lógico. |
| Automatizaciones | reglas, versiones y ejecuciones | Motor declarativo limitado, observable e idempotente. |

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
- `20260827010000_add_risk_matrix.sql`: añade matriz de peligros, controles jerarquizados, cálculos configurables y reevaluaciones históricas.
- `20260827020000_add_risk_control_follow_up.sql`: agrega verificación append-only, relaciones seguras con tareas, acciones y evidencia, además de alertas de vencimiento o ineficacia.
- `20260827020500_add_risk_domain_foreign_key_indexes.sql`: cubre las claves foráneas del dominio de matriz y seguimiento de controles.
- `20260827021000_include_control_status_in_alerts.sql`: incluye controles marcados ineficaces en las alertas abiertas.
- `20260827021500_schedule_risk_control_alerts.sql`: programa la evaluación diaria de alertas vencidas mediante `pg_cron`.
- `20260827030000_add_training_and_competencies.sql`: agrega catálogo, planes, sesiones, convocatoria, asistencia, evaluación, certificados e indicadores seguros.
- `20260827040000_add_ppe_domain.sql`: agrega catálogo, inventario, asignación, entrega transaccional, inspección y baja de EPP.
- `20260828124544_harden_ppe_inventory_and_workflows.sql`: registra movimientos inmutables, protege entrega/aceptación/inspección/baja mediante RPC transaccionales y añade historial de vida útil y reposición.
- `20260827050000_add_contractors_and_suppliers.sql`: agrega contratistas, contratos, requisitos, portal restringido y aprobaciones auditables.
- `20260828130856_harden_contractor_portal_and_document_scope.sql`: limita envíos a su contacto, habilita evidencia privada acotada por requisito y protege transiciones de aprobación.
- `20260827060000_add_incidents_and_health_sensitive_domain.sql`: agrega reporte, investigación, evidencia y detalle sensible protegido.
- `20260827070000_add_minimal_occupational_health.sql`: agrega salud ocupacional mínima y controles de privacidad por rol.
- `20260828132709_harden_incident_and_occupational_health_workflows.sql`: protege documentos sensibles, transiciones, cierre trazable y confirmación humana separada.
- `20260828134357_harden_emergency_site_scope_and_evidence.sql`: aplica RLS por sede, evidencia privada y eventos de ciclo de vida para emergencias.
- `20260826131521_allow_tenant_cascade_cleanup.sql`: conserva esa protección en operaciones directas sin bloquear cascadas del tenant.
- `20260826131659_skip_audit_during_tenant_cascade.sql`: evita recrear auditoría hija durante el borrado explícito de una organización.
- `20260826132501_preserve_existing_membership_status.sql`: una reinvitación no degrada membresías activas o suspendidas.
- `20260826144326_add_transactional_onboarding.sql`: progreso por pasos, finalización atómica, responsable SST y evento de cambio de datos fuente.
- `20260826144539_harden_transactional_onboarding.sql`: mueve las implementaciones privilegiadas al esquema privado y deja wrappers invoker en la API.
- `20260826144941_verify_transactional_onboarding.sql`: valida reanudación, idempotencia, roles, evento único y denegación entre tenants con fixtures efímeros.

1. `create_saas_core`: tablas, restricciones, RLS, RBAC, triggers y bucket `avatars`.
2. `add_core_foreign_key_indexes`: índices de cobertura para claves foráneas.
3. `verify_core_tenant_isolation`: prueba transaccional User A/Organization A permitido y Organization B denegado.
