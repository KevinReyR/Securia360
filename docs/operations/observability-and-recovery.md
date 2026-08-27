# Observabilidad y recuperación

## Señales

Cada operación server-side debe incluir correlation_id, actor, tenant, acción, resultado y duración. Nunca registrar tokens, contraseñas, contenido documental, datos de salud, correo completo o payloads sin redacción.

Medir: errores por ruta, latencia p50/p95, fallos de Auth, backlog/edad de domain_events, entregas de notificación, ejecuciones de automatización e importaciones fallidas. Alertar por error sostenido, cola sin progreso y migración fallida. El endpoint autenticado api/auth/context verifica sesión y coherencia de identidad; el proveedor de hosting debe complementar con health check de disponibilidad.

## Backups y objetivos

Supabase gestiona copias según el plan contratado. Definir RPO de 24 h y RTO de 4 h para el MVP, confirmar retención contratada y documentar cada restauración. Una restauración se prueba únicamente en proyecto/branch seguro, nunca sobre producción.

## Simulacro

1. Crear entorno aislado desde respaldo.
2. Aplicar migraciones y verificar esquema, RLS, Storage y usuarios de prueba.
3. Ejecutar flujo login → tenant → lectura y una prueba de aislamiento.
4. Comparar conteos y registrar duración, pérdida estimada y hallazgos.

## Runbooks

### Auth degradado

Verificar estado de Supabase Auth, callback y dominios permitidos. No desactivar RLS. Comunicar impacto y conservar correlation_id.

### Migración fallida

Detener despliegues, capturar error y estado de migraciones. Corregir con una nueva migración; nunca reescribir una ya aplicada.

### Fuga de acceso

Revocar sesiones afectadas, deshabilitar el usuario o membresía, preservar logs, revisar RLS y ejecutar la matriz IDOR. Notificar según obligación aplicable.

### Cola atascada

Inspeccionar edad, locked_at y last_error. Liberar solo elementos vencidos mediante consumidor controlado; mantener idempotency_key.

### Proveedor externo caído

Pausar reintentos agresivos, marcar entregas como failed con backoff y mantener la operación interna. No perder eventos ni reenviar duplicados.
