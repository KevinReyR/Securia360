# ADR-012 — Constancias internas e independencia de auditoría

## Decisión

Las actas aprobadas se confirman mediante constancias internas autenticadas, no mediante una firma electrónica certificada externa. Cada constancia conserva usuario, rol, fecha UTC, snapshot y huella SHA-256 del contenido aprobado; no puede editarse ni eliminarse.

Cuando un encargo de auditoría exige independencia, integrantes del equipo auditor no pueden aprobar el informe ni verificar o cerrar acciones, hallazgos o el encargo. La intervención debe realizarla otro usuario con `audits.approve`.

## Consecuencias

La plataforma obtiene trazabilidad operacional sin afirmar validez de firma certificada ni cumplimiento jurídico automático. Una futura integración de firma electrónica deberá ser una decisión separada, con proveedor autorizado, evidencia de identidad y revisión jurídica.
