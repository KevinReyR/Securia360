# ADR-011 — Revisión humana normativa append-only

## Decisión

El contenido normativo, técnico y editorial de Securia360 se gobierna mediante un paquete interno separado de los tenants. Los roles `review_admin` y `reviewer` no derivan de membresías de organización ni de roles de cliente.

Cada revisión registra un snapshot, responsable, fecha UTC, decisión y fundamento. Las decisiones y auditorías son append-only. Una propuesta aprobada genera un artefacto sucesor pendiente de nueva revisión; no modifica fuentes, requisitos, estándares, perfiles, fórmulas, reglas ni textos publicados.

## Consecuencias

- La plataforma conserva trazabilidad de criterio humano sin declarar cumplimiento legal automático.
- Los contenidos de UI, supuestos y casos de prueba aprobados requieren un cambio de repositorio revisable antes de llegar al producto.
- El primer administrador interno se inicializa desde una cuenta confirmada; los siguientes se asignan desde el panel por otro administrador.
