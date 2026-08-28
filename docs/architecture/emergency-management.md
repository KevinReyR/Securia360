# Gestión de emergencias

La preparación ante emergencias se modela por sede: escenario → plan versionado → simulacro → resultado → hallazgo → acción. Las acciones pueden enlazarse a una acción de mejoramiento ya existente, sin convertir ambas entidades en la misma cosa.

Los planes se conservan como versiones. Solo una versión aprobada sin fecha de cierre puede estar vigente por sede; aprobarla exige \`emergencies.approve\`. Las acciones verificadas requieren evidencia y quedan inmutables.

## Directorio operativo y resiliencia

\`emergency_directory_entries\` almacena únicamente nombre operativo, rol y canal de contacto. La consulta requiere \`emergencies.directory_read\` y el scope de sede correspondiente. La vista \`emergency_resilient_directory\`, con \`security_invoker\`, devuelve solo contactos activos. El usuario autorizado puede guardar una copia cifrada en IndexedDB; su clave solo vive en la sesión del navegador y se pierde al cerrarla. No contiene automatización de comunicaciones masivas, datos clínicos ni instrucciones de respuesta.

## Integraciones futuras

Al completar un simulacro se registra \`emergency.drill.completed\` en la outbox transaccional, con una clave de idempotencia igual al simulacro. Consumidores futuros pueden producir notificaciones sin acoplarse al flujo operativo ni duplicarlas.
