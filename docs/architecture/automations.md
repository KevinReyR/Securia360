# Automatizaciones

Las reglas son datos versionados y declarativos: un tipo de evento, condiciones de claves permitidas y una acción limitada. No aceptan SQL, JavaScript ni nombres de funciones.

Cada ejecución está ligada a regla-versión y evento, es idempotente, soporta dry-run, registra resultado y se limita por hora. El estado emergency_stopped permite detener una regla de inmediato. Las revisiones agregadas pueden invocar el consumidor privado desde Cron sin procesar importaciones fila a fila.
