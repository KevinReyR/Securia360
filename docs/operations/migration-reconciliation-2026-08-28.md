# Reconciliación de migraciones — 28 de agosto de 2026

## Alcance

El proyecto remoto objetivo es **Mizpa360** (`khnsudlcrpljlnvtynki`). No se realizaron despliegues de la aplicación ni se alteraron datos de negocio.

## Resultado

Se reconcilió el historial de migraciones entre el repositorio y Supabase. El desfase consistía en registros históricos con identificadores distintos que representaban cambios ya presentes en el esquema remoto. La reconciliación ajustó únicamente el historial de `supabase_migrations`; no eliminó tablas, filas, buckets ni archivos.

Después del preflight y la reconciliación, se aplicaron mediante migraciones forward-only estas cuatro migraciones pendientes:

- `20260827160000_harden_compliance_workflows`
- `20260827170000_enable_rls_for_classification_metadata`
- `20260828024252_allow_assignee_task_status_updates`
- `20260828034144_secure_risk_assessment_and_methodology_review`

## Controles verificados

- El repositorio quedó vinculado al ref remoto esperado antes de aplicar cambios.
- La aplicación se realizó con `supabase db push`; no se ejecutó SQL ad hoc ni un reinicio de base de datos.
- Las migraciones incorporan restricciones, RLS, auditoría y funciones con permisos explícitos para los flujos afectados.
- La configuración de CI ya no conecta automáticamente con `securia360-ci`; las validaciones remotas destructivas permanecen manuales y deshabilitadas por defecto.

## Riesgos operativos pendientes

- Confirmar en el panel de Supabase que PITR/backups estén habilitados y documentar el RPO/RTO acordado antes de próximos cambios de esquema.
- El asesor de seguridad de Supabase puede informar la protección contra contraseñas filtradas como pendiente de configuración en Auth; debe habilitarse desde el panel cuando sea compatible con la política de acceso.
- Las pruebas remotas que crean usuarios o archivos efímeros no deben ejecutarse contra Mizpa360 sin autorización específica.

Toda corrección futura debe ser una nueva migración forward-only y seguir el mismo preflight de historial, salud y RLS.
