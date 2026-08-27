# ADR-014: Onboarding reanudable y transaccional

## Estado

Aceptado.

## Contexto

El onboarding captura datos fuente distribuidos entre organización, razón social, sedes, membresías y caracterización. Guardar cada tabla desde el navegador podía dejar configuraciones parciales, duplicar filas al reintentar y mezclar tenants si la aplicación enviaba un identificador incorrecto.

## Decisión

- Mantener un único borrador `onboarding_progress` por organización, actualizado por sección.
- Validar cada paso con el mismo contrato Zod en cliente y servidor.
- Consolidar los nueve pasos mediante una función PostgreSQL que bloquea el borrador, verifica usuario y permiso, y realiza todos los cambios en una transacción.
- Usar constraints y `ON CONFLICT` para NIT, código de sede, rol e idempotencia.
- Mantener implementaciones privilegiadas en `private` y exponer wrappers `SECURITY INVOKER` con grants explícitos.
- Emitir una sola vez `organization.classification_source_changed` con los datos fuente y `requires_human_review = true`.

## Consecuencias

El usuario puede cerrar y retomar el flujo sin perder pasos guardados. Una falla de finalización revierte toda la consolidación. El clasificador futuro podrá consumir el evento sin que esta etapa calcule perfiles 0312 ni aplique cambios normativos automáticamente.
