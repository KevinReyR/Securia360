# Planificación y tareas

El plan anual, actividades y tareas reutilizan la migración `20260826260000_add_planning_and_tasks.sql`. Todas las fechas se persisten como `timestamptz` en UTC. Una tarea puede vincular una actividad, un plan o una acción de mejoramiento mediante referencias, sin fusionar sus dominios.

Las reglas de recurrencia generan una primera ocurrencia con una clave estable `rule_id:utc_instant`; la restricción única `(organization_id, occurrence_key)` hace idempotente la generación posterior. Las dependencias se validan por organización y PostgreSQL impide completar una tarea bloqueada. El responsable puede actualizar únicamente el estado de su propia tarea; la gestión completa, aprobación y evidencias requieren los permisos de planificación correspondientes.
