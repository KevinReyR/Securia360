# Facturación y administración SaaS

La administración comercial es un área interna de Reinova Labs y está separada de las organizaciones cliente. Los roles `saas_admin` y `saas_support` se consultan desde `saas_admin_roles` con RLS; no se derivan de metadata de Auth ni de roles de un tenant.

## Acceso

- Sin un destino explícito, un operador interno activo llega a `/internal/saas-admin` después de iniciar sesión.
- Una URL `next` interna y validada conserva prioridad.
- La página de organizaciones y el menú de perfil muestran el acceso interno únicamente cuando la consulta del propio rol lo autoriza.
- `saas_support` puede consultar suscripciones y operar sesiones de soporte. Solo `saas_admin` administra planes, suscripciones y conciliaciones.

## Planes y versiones

`billing_plans` conserva la identidad comercial y `billing_plan_versions` congela nombre, límites y capacidades. Una versión nace en `draft`, puede publicarse una sola vez y después es inmutable. Las correcciones se realizan creando una versión sucesora. Cada suscripción referencia de forma obligatoria la versión exacta aplicada.

Los límites admitidos son personas, sedes y almacenamiento en MB. Las capacidades admitidas son Copilot, automatizaciones, importaciones, analítica y aplicación móvil. Estos valores son comerciales e informativos: nunca otorgan ni retiran permisos RBAC y no participan en políticas RLS.

## Suscripciones y conciliación

Una suscripción puede estar en prueba, activa, con pago pendiente, suspendida o cancelada. La suspensión comercial no elimina datos, membresías ni documentos y no modifica la autorización del tenant.

`billing_reconciliations` registra referencias administrativas manuales. No representa una transacción de pago. Los registros conciliados o anulados son inmutables y conservan actor, fechas y fundamento de resolución.

## Soporte y auditoría

Toda sesión de soporte requiere organización y motivo, y pasa por solicitud, inicio y cierre explícitos. No concede suplantación ni acceso implícito a datos del cliente. El ledger `saas_admin_audit` conserva cambios de planes, versiones, suscripciones, conciliaciones y soporte.

## Proveedor de pagos

No hay proveedor conectado, endpoints públicos de webhook ni cobros automáticos. Una integración futura exigirá autorización expresa, firma sobre el cuerpo crudo, idempotencia proveedor/evento, reintentos acotados y reconciliación transaccional.
