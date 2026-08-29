# Securia Copilot

Copilot recupera únicamente metadatos y extractos operativos que la persona autenticada ya puede consultar mediante RLS: documentos autorizados (sin binarios ni texto extraído), requisitos, evaluaciones y valoraciones de riesgo. Cada respuesta registra conversación personal, fuente, snapshot mínimo, versión cuando existe, actor, tenant y ejecución.

OpenAI se usa solo desde el servidor mediante la Responses API, con `store: false`, sin herramientas, búsqueda web, acceso a archivos remotos ni ejecución de funciones. Configura en Vercel únicamente `OPENAI_API_KEY` y `OPENAI_COPILOT_MODEL`; ninguna usa el prefijo `NEXT_PUBLIC_`. Si faltan, la interfaz muestra el estado de configuración sin revelar secretos.

Las fuentes se delimitan como contexto no confiable, se limitan en longitud y se analizan contra patrones de prompt injection. No existe un ejecutor autónomo: toda propuesta es un registro auditable y su aceptación o rechazo no cambia otra entidad. Clasificación, aprobaciones, cierres y asuntos legales o médicos requieren siempre intervención humana por sus flujos normales.
