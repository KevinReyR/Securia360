# Eventos de dominio y outbox

`domain_events` es la outbox transaccional de Securia360. Los productores insertan el evento dentro de la misma transacción que cambia el agregado; los consumidores futuros reclaman lotes con `FOR UPDATE SKIP LOCKED` mediante una función privada y usan `idempotency_key` para que un reintento no produzca efectos duplicados.

Contrato inicial: `organization.created`, `member.invited`, `site.created`, `classification.changed`, `assessment.completed`, `risk.changed`, `document.expiring` y `task.overdue`. Solo los tres primeros tienen productor hoy; los demás quedan reservados para sus dominios.

Los payloads contienen identificadores y datos operativos mínimos. Nunca incluyen contraseñas, tokens ni secretos. Los eventos no se exponen por Data API. `audit_log` es append-only para clientes: solo tiene `SELECT` con `audit.read`; los triggers registran actor, acción, entidad, before/after e IP cuando PostgreSQL la recibe.
