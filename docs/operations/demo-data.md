# Datos demostrativos de Empresa Demo Colombia SAS

La organización `Empresa Demo Colombia SAS` usa el identificador determinista
`10000000-0000-4000-8000-000000000001` y está marcada con `settings.is_demo = true`.
Todos sus nombres, correos, teléfonos, NIT, direcciones y escenarios operativos son
ficticios. No deben copiarse a organizaciones reales ni interpretarse como evidencia
de cumplimiento legal, médico o técnico.

## Contenido

La carga incluye ejemplos coherentes para:

- estructura empresarial, dos sedes, cuatro áreas y cuatro trabajadores de negocio;
- metadatos documentales sin objetos de Storage ficticios;
- hallazgo, brecha, acción, plan anual, actividades y tareas relacionadas;
- proceso, actividad, tarea de riesgo, peligro pendiente de revisión y controles;
- catálogo, plan, sesión y convocatoria de capacitación;
- catálogo, inventario, movimientos y asignación de EPP;
- contratistas, contacto, contrato, acceso pendiente, trabajador y requisito;
- incidente sin lesión, investigación, causa y acción, sin datos clínicos;
- programa de vigilancia sin historias clínicas, diagnósticos ni restricciones inventadas;
- emergencia por sede, recursos, brigada, plan borrador, simulacro, hallazgo y acción;
- COPASST, auditoría interna y revisión por la dirección en estados editables;
- indicador borrador, preferencias, automatización declarativa, importación en preview,
  conversación de Copilot y suscripción comercial de demostración.

Los estados aprobados, firmas, aceptaciones, resultados profesionales, evidencias y
archivos privados no se falsifican. Deben producirse recorriendo el flujo normal con
un actor autorizado.

## Migraciones

- `20260903000100_add_reinitializable_demo_tenant.sql`: tenant base ya registrado.
- `20260903015000_fix_polymorphic_tenant_triggers.sql`: corrige dos validadores de
  tenant que referenciaban columnas inexistentes en tablas hermanas. No amplía permisos.
- `20260903017500_fix_remaining_polymorphic_tenant_triggers.sql`: aplica el mismo
  arreglo a Contratistas, Incidentes, Emergencias, Gobierno y Automatizaciones.
- `20260903019000_fix_notification_tenant_trigger.sql`: corrige el validador de
  preferencias, notificaciones y entregas sin cambiar sus reglas de acceso.
- `20260903020000_seed_complete_demo_platform.sql`: carga idempotente por UUID.

Antes de aplicar, ejecutar `npx supabase db push --dry-run` y confirmar que solo estén
pendientes las dos últimas migraciones. No usar `db reset` sobre Mizpa360.

## Reinicio controlado

`reset_demo_organization()` solo puede ser invocada por un `saas_admin`, valida el UUID
y la marca `is_demo`, restaura estados operativos seleccionados y registra el acto en
la auditoría interna. No elimina datos ni objetos de otras organizaciones.

El reinicio no crea usuarios. La membresía administrativa se concede exclusivamente a
la cuenta confirmada `kevinreinosor@gmail.com`; las demás personas son registros de
negocio sin credenciales de acceso.
