# Comités, auditorías e indicadores

Los comités usan tipos configurables; COPASST y Convivencia son semillas, no reglas rígidas. Cada período conserva sus miembros, reuniones, agenda, asistencia, acta y compromisos enlazables a tareas. Un acta aprobada es inmutable. Las firmas son constancias internas autenticadas: preservan el usuario, rol declarado, fecha UTC, snapshot y huella SHA-256 del acta; no equivalen a una firma electrónica certificada.

Las auditorías separan programa, ejecución, equipo, lista, evidencia, hallazgo, informe y acción. Si una ejecución requiere independencia, cualquier integrante del equipo auditor queda impedido de aprobar su propio informe y de verificar o cerrar hallazgos, acciones o la auditoría. El cierre exige informe aprobado y hallazgos resueltos; verificar una acción exige evidencia privada vinculada.

La revisión por la dirección conserva entradas, decisiones, compromisos y acta estructurada. Una vez aprobada, la revisión y sus registros dependientes se bloquean contra actualización o eliminación. Estas herramientas respaldan la gestión y la trazabilidad; no declaran cumplimiento legal automático.

Los indicadores separan catálogo, versión y resultados históricos. Las ejecuciones usan una clave de idempotencia y guardan la versión exacta, período, dimensiones y explicación. El dashboard es una vista de estado actual con security invoker; no sustituye snapshots normativos.

## Indicadores y dashboard gerencial

`/org/:organizationId/analytics` muestra dos conceptos que no se mezclan: el estado vivo de tareas, acciones y documentos mediante `management_dashboard_metrics`, y los resultados históricos inmutables de `indicator_results`. Una ejecución histórica conserva la fórmula, fuente, meta, dirección y explicación usadas; no se modifica ni se recalcula silenciosamente.

La primera versión admite únicamente tres plantillas de cálculo de servidor: `open_tasks_count`, `open_improvement_actions_count` y `active_documents_count`. `source_config` no acepta SQL ni fórmulas arbitrarias. Las versiones se crean en borrador y solo `analytics.approve` puede aprobarlas; una versión aprobada o archivada queda inmutable. Los resultados y ejecuciones no tienen escritura directa por Data API: una RPC autorizada solicita un cálculo en PostgreSQL y el job diario de cierre usa la misma función idempotente.

El job `securia360-calculate-indicators` se ejecuta a las 00:15 de Bogotá. Genera la fotografía del período cerrado según la periodicidad. Los conteos iniciales son de alcance organizacional; razón social y sede se filtran solo cuando un resultado futuro lleve ese alcance validado por FK. La interfaz comunica expresamente cuando el desglose no existe, en lugar de inferirlo.

| Interfaz | Permiso | Prueba |
| --- | --- | --- |
| Catálogo y borradores | `analytics.manage` | Zod y RLS de Org A/Org B |
| Aprobación de versión | `analytics.approve` | transición e inmutabilidad |
| Consulta histórica y dashboard | `analytics.read` | Data API sin fuga de tenant |
| Solicitud de cálculo | `analytics.manage` | plantilla cerrada e idempotencia |
