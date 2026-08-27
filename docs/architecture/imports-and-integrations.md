# Importaciones e integraciones

Las conexiones externas permanecen en borrador hasta autorización explícita. El framework actual solo almacena su configuración no secreta.

CSV y XLSX siguen el flujo archivo → staging por fila → validación/preview → confirmación → efectos auditables. La clave de idempotencia y el hash evitan repeticiones. Un cierre exitoso emite workforce.import.completed una sola vez; el recálculo de clasificación se solicita de forma agregada.
