# Capacitaciones y competencias

El módulo sigue el flujo catálogo → plan → sesión → convocatoria → asistencia → evaluación objetiva → certificado → evidencia. Se usan membresías existentes, sin duplicar información personal ni registrar datos de salud.

Las evaluaciones usan preguntas de selección única ponderadas. PostgreSQL valida todas las respuestas, calcula el puntaje y emite un certificado únicamente cuando la asistencia es `present` y se alcanza el porcentaje aprobatorio de la plantilla publicada. La interfaz no calcula ni decide resultados.

Los indicadores proceden de `training_plan_indicators` con `security_invoker`. Las convocatorias, resultados y certificados están restringidos a la propia persona o a usuarios con permisos explícitos de gestión, validación o detalle de participantes. Evidencias usan las versiones privadas del dominio de documentos.
