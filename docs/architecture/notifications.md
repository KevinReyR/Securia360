# Notificaciones in-app

La bandeja es personal y se consulta con RLS por `recipient_user_id`. El encabezado usa Realtime únicamente para inserciones de `notifications`; la lectura normal continúa siendo el respaldo para una desconexión. La suscripción no recibe eventos de dominio ni necesita credenciales privilegiadas.

Cada organización tiene preferencias por usuario. Solo su propietario puede cambiarlas; `notifications.manage` administra plantillas y `notifications.templates_approve` aprueba una versión. Las plantillas aprobadas o archivadas son inmutables. Los enlaces se restringen a rutas internas de la organización activa.

Las horas silenciosas admiten rangos nocturnos. Afectan exclusivamente la cola de correo; la bandeja in-app permanece inmediata. El correo no está conectado a SMTP todavía, por lo que no se envía ningún contenido fuera de Securia360.

## Matriz interfaz → permiso → prueba

| Flujo | Protección | Cobertura |
| --- | --- | --- |
| Bandeja, lectura y contador | RLS de destinatario; enlace interno validado | unitarias de enlace/estado; integración Data API pendiente de ejecutarse solo en entorno aislado autorizado |
| Preferencias propias | RLS por propietario e identidad inmutable | unitarias de quiet hours; validación Zod |
| Plantillas | `notifications.manage` / `notifications.templates_approve`, trigger de inmutabilidad | validación Zod y verificación de RLS en migración |
| Consumo/outbox | tabla privada, idempotency key y `SKIP LOCKED` | revisión de migración; pruebas de integración sin fixtures en Mizpa360 |
