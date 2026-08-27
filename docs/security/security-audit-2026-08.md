# Auditoría de seguridad — 2026-08

## Resultado

No se encontraron hallazgos críticos o altos abiertos en el asesor de Supabase. RLS está habilitado en las tablas públicas revisadas. Las colas internas de webhooks y entregas tienen políticas explícitas de denegación para el Data API.

## Matriz reproducible

1. Con dos usuarios autenticados, consultar e insertar una fila de organización A usando el token de organización B: debe devolver cero filas o 403.
2. Repetir con una sede de otra organización y con una membresía suspendida.
3. Intentar asignarse un rol administrativo, aprobar un informe propio y completar una acción sin evidencia: debe ser denegado.
4. Llamar al Data API sin JWT y con JWT vencido: debe ser denegado.
5. Intentar leer las colas internas desde el cliente: debe ser denegado.

## P2 operativo

Activar Leaked Password Protection en Supabase Auth. Es una configuración de proyecto y no se puede activar de forma segura desde una migración.
