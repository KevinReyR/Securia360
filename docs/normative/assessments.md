# Evaluaciones 0312

Cada evaluación referencia un snapshot y versión de perfil. El scoring se ejecuta solo con una regla aprobada y revisada; al completar guarda el cálculo, conserva ítems y publica `assessment.completed`. Tras validación, triggers bloquean toda modificación o eliminación de la evaluación y sus ítems.

## Evaluación Inicial empresarial

La ruta `/org/[organizationId]/compliance/initial-assessment` usa la clasificación vigente, una versión de perfil publicada y revisada y una regla de puntuación aprobada. El inicio es una operación transaccional e idempotente: crea un corte `CURRENT_STATE`, la evaluación y sus estándares, o recupera el borrador compatible ya existente.

Cada respuesta se guarda inmediatamente mediante una operación autenticada que solo admite `met` o `not_met`. El navegador no calcula el puntaje. La finalización rechaza elementos pendientes, delega el cálculo al motor de base de datos y conserva el resultado histórico. Los estándares `not_met` alimentan el plan formal de oportunidades de mejora sin duplicar registros ya detectados.

Permisos y pruebas:

| Interfaz | Lectura | Mutación | Verificación |
| --- | --- | --- | --- |
| Tarjeta y resultado de evaluación | `assessments.read` | — | Un lector consulta sin iniciar ni responder. |
| Inicio y guardado por estándar | `assessments.read` | `assessments.manage` + `snapshots.create` al iniciar | Otro tenant y un lector sin gestión son denegados. |
| Resultado y oportunidades | `assessments.read` | Cálculo con `assessments.manage` | El puntaje se produce en servidor y el histórico validado permanece inmutable. |
