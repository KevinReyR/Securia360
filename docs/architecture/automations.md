# Automatizaciones declarativas

Las automatizaciones consumen eventos de dominio sin cambiar el estado global de la outbox. Cada regla tiene versiones inmutables y solo una versión aprobada puede activarse. El motor acepta únicamente condiciones de presencia o igualdad sobre campos permitidos y las acciones `create_task` y `record_only`.

El consumidor privado se ejecuta cada cinco minutos con `SKIP LOCKED`. La combinación versión/evento/modo garantiza una ejecución real y una simulación como máximo. Los fallos transitorios se reintentan tras 1, 5 y 30 minutos; después quedan descartados con un error acotado, visible solo a quien tenga autorización.

`automations.manage` crea borradores, pausas y simulaciones. `automations.approve` aprueba, activa, reintenta y ejecuta el apagado de emergencia. No hay SQL, código, webhooks, interpolación libre de payloads ni ejecución directa desde Data API.
