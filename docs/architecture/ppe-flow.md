# EPP: inventario y trazabilidad

El módulo `/org/[organizationId]/ppe` administra catálogo, inventario por sede y talla, asignación a miembros activos, entrega, reposición, aceptación, inspección, vida útil y baja. El miembro organizacional representa al trabajador para este alcance; no se almacenan datos personales adicionales.

## Controles de seguridad

- `ppe.read` permite consultar inventario e historial del tenant; cada trabajador puede consultar sus propias asignaciones y entregas para aceptar una entrega pendiente.
- `ppe.manage` crea catálogo, asociaciones a peligros o controles, ubicaciones de inventario, asignaciones y movimientos de entrada.
- `ppe.validate` registra entregas, reposiciones, inspecciones y bajas. La aceptación solo se permite al trabajador asignado.
- El saldo no se edita desde Data API. Entradas, ajustes y devoluciones se escriben en `ppe_inventory_movements`; las entregas generan un movimiento negativo dentro de la misma transacción y bloquean la fila de inventario.
- EPP retirado no admite nuevas entregas. Inspecciones fallidas o con reposición requerida no crean una entrega automática: marcan la asignación para que SST decida y registre la reposición.

## Evidencias

Las evidencias son documentos privados en `evidences`. El servidor construye la ruta con organización y asignación, valida tipo y tamaño, elimina el objeto si falla la persistencia de metadatos y solo vincula versiones del mismo tenant. Las descargas se realizan desde el flujo documental mediante URL firmada temporal.

## Privacidad y límites

El módulo solo conserva el miembro asignado, sede, talla y eventos operativos necesarios. No declara cumplimiento legal automático ni reemplaza la decisión profesional de SST.
