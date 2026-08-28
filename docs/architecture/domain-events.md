# Eventos de dominio y outbox

`domain_events` es la outbox transaccional de Securia360. Los productores insertan el evento dentro de la misma transacción que cambia el agregado; los consumidores futuros reclaman lotes con `FOR UPDATE SKIP LOCKED` mediante una función privada y usan `idempotency_key` para que un reintento no produzca efectos duplicados.

Contrato inicial: `organization.created`, `member.invited`, `site.created`, `classification.changed`, `assessment.completed`, `risk.changed`, `document.expiring` y `task.overdue`. Solo los tres primeros tienen productor hoy; los demás quedan reservados para sus dominios.

Los payloads contienen identificadores y datos operativos mínimos. Nunca incluyen contraseñas, tokens ni secretos. Los eventos no se exponen por Data API. `audit_log` es append-only para clientes: solo tiene `SELECT` con `audit.read`; los triggers registran actor, acción, entidad, before/after e IP cuando PostgreSQL la recibe.

## Consumidor de notificaciones

`notification_event_consumptions` es un consumidor independiente: registra una sola reclamación por evento, no modifica el estado compartido de `domain_events` y procesa lotes con `SKIP LOCKED`. Cada intento tiene disponibilidad, bloqueo, error acotado y backoff limitado; un fallo terminal no vuelve a producir notificaciones duplicadas.

Para los eventos soportados, el consumidor crea de inmediato una notificación in-app para cada miembro activo que no la haya desactivado. El correo queda únicamente en cola: se difiere hasta el final de las horas silenciosas y no existe un proveedor SMTP en esta etapa. Las plantillas son versionadas; si no hay una aprobada se usa un mensaje genérico seguro. Ningún mensaje incluye el payload completo ni información sensible.

Las automatizaciones son otro consumidor independiente: no actualizan `domain_events.status`. Solo procesan eventos posteriores a la activación de una regla y conservan idempotencia por versión, evento y modo de ejecución.
