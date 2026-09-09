# Interfaz de Cumplimiento normativo

La ruta protegida `/org/[organizationId]/compliance` permite consultar el catálogo normativo, estándares, perfiles y los estados históricos de clasificación, aplicabilidad, snapshots y evaluaciones del tenant activo.

Las fuentes, requisitos, estándares y perfiles son catálogo global de solo lectura para clientes. Un estado `pending` no constituye aprobación SST/jurídica; la interfaz lo comunica como pendiente de revisión experta y bloquea puntuaciones o snapshots que requieren una versión aprobada.

Las acciones por tenant usan `can(permission, context)`, RLS y auditoría: propuestas de clasificación (`classifications.manage`), ejecución de aplicabilidad (`applicability.evaluate`), snapshots (`snapshots.create`) y evaluación/validación (`assessments.manage`/`assessments.validate`). Los snapshots y las evaluaciones validadas son inmutables.

La migración `20260827160000_harden_compliance_workflows.sql` corrige relaciones cruzadas de tenant, hace atómica la creación de snapshots, habilita rechazo auditado de propuestas y expone únicamente wrappers RPC autenticados para operaciones transaccionales.

La Evaluación Inicial empresarial vive en `/org/[organizationId]/compliance/initial-assessment`. Reutiliza la presentación guiada por PHVA de la herramienta pública, pero no su almacenamiento local ni su cálculo cliente. Sus respuestas, versión, corte, resultado y oportunidades se guardan dentro del tenant bajo RLS. La navegación por `GET` nunca crea una evaluación; el usuario debe ejecutar explícitamente “Iniciar evaluación”.

Las tarjetas de Inicio son accesos autorizados: evaluación, tareas abiertas, acciones abiertas y vencimientos unificados. Cada consulta se ejecuta únicamente cuando el actor tiene el permiso de lectura del módulo, evitando convertir una denegación esperada en un error general del dashboard.
