# Matriz de peligros y valoración

La matriz conserva la cadena Proceso → Actividad → Tarea → Peligro → Identificación → Valoración → Control. Las reevaluaciones son filas nuevas de `risk_assessments` que apuntan a la valoración previa y mantienen la versión exacta de metodología empleada.

Los valores ND, NE, NP, NC y NR, sus interpretaciones, aceptabilidad, personas expuestas, peor consecuencia y presencia de requisito legal se guardan como datos de valoración o de identificación. El cálculo solo opera sobre fórmulas aprobadas y revisadas por expertos de la versión metodológica seleccionada; no presupone que GTC 45 esté aprobada ni codifica sus tablas como lógica fija.

## Controles y verificación

Cada control usa obligatoriamente uno de los tipos `ELIMINATION`, `SUBSTITUTION`, `ENGINEERING`, `ADMINISTRATIVE` o `PPE`. La interfaz los presenta en ese orden para orientar la priorización, sin reemplazar el análisis profesional.

Los controles pueden vincular una tarea, una acción de mejora y una versión privada de documento. Todas esas relaciones se verifican contra el mismo `organization_id`. Las verificaciones se escriben en `risk_control_verifications`: son append-only, identifican al verificador, registran la eficacia y pueden aportar nueva evidencia privada. El estado actual del control es un resumen derivado de la última verificación, no un valor editable de forma directa.

`risk_control_alerts` mantiene las alertas abiertas de controles vencidos o ineficaces. Se actualizan en la misma transacción cuando cambia un control o se registra una verificación, y su auditoría permite conocer aperturas y cierres. `pg_cron` ejecuta diariamente a las 00:05 de Colombia el evaluador privado de todos los controles; esta automatización solo actualiza alertas, no toma decisiones profesionales.
