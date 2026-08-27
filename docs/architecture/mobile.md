# Aplicación móvil

apps/mobile es un proyecto Expo separado de la UI web. Comparte únicamente tipos, validación y dominio. La sesión y cola offline usan almacenamiento seguro del dispositivo; no contienen service_role ni secretos de servidor.

La cola conserva claves de idempotencia por operación y expone conflictos explícitos. La sincronización debe usar endpoints protegidos por RLS y borrar sesión/cola al cerrar sesión.
