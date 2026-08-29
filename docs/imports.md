# Importaciones de estructura y trabajadores

El módulo acepta un archivo CSV o XLSX por entidad: razones sociales, sedes, áreas o trabajadores. Cada archivo se analiza antes de modificar datos y conserva filas, mapeo, errores y efectos para auditoría.

## Datos permitidos

La nómina mínima contiene código interno, nombres, apellidos, correo laboral opcional, estado y vínculos con razón social, sede y área. No se deben importar identificaciones, salarios, salud, diagnósticos ni credenciales de acceso.

## Seguridad e idempotencia

Los archivos permanecen en el bucket privado `import-staging` bajo la ruta `organization_id/import_job_id`. Solo quien dispone de `imports.read` o `imports.manage` puede consultar el historial; confirmar y revertir requieren `imports.manage`. Un mismo contenido, entidad y mapeo reutiliza el trabajo existente.

La confirmación es transaccional y solo procede sin errores. Una importación de trabajadores emite una vez `workforce.import.completed` y crea una única solicitud de recálculo para revisión humana; nunca cambia una clasificación automáticamente.

## Reversión

La reversión es lógica. Los registros creados quedan archivados y una actualización se restaura solo si no cambió desde la importación. Si un usuario hizo cambios posteriores, el sistema conserva el dato y registra un conflicto en lugar de sobrescribirlo.
