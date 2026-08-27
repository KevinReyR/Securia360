# Capacitaciones y competencias

El flujo trazable es Plan → Sesión → Convocatoria → Asistencia → Evaluación → Certificado/Evidencia. Las relaciones con requisitos y estándares mínimos son opcionales y no convierten la capacitación en una interpretación normativa automática.

Las personas convocadas se representan mediante la membresía ya existente de la organización. No se duplican nombres, documentos de identidad, datos de salud ni resultados sensibles en este dominio. Los documentos de asistencia, certificados y demás evidencia se enlazan por `document_versions`, conservando los controles de acceso privados del dominio de documentos.

`training_plan_indicators` calcula cobertura como asistentes presentes sobre convocados y eficacia como evaluaciones aprobadas sobre evaluadas. Es una vista con `security_invoker`; la UI solo consume los resultados y no calcula indicadores por su cuenta.
