# Auditoría de interfaz por dominios

Fecha: 2026-08-27. Alcance: Etapa 40A. Esta matriz diferencia explícitamente el modelo de datos existente de los flujos que una persona usuaria puede completar en la interfaz. La existencia de una tabla o de RLS no equivale a un módulo terminado.

## Flujos disponibles

| Dominio / tablas principales | Interfaz | Acción usable | Permiso centralizado | Prueba actual | Estado |
| --- | --- | --- | --- | --- | --- |
| Organización | Ajustes de organización | Consultar y actualizar identidad | `organization.update` | Unitarias de navegación y aislamiento Data API configurable | Parcial: falta prueba E2E |
| Razones sociales | Configuración / Estructura | Crear, editar, activar, desactivar y eliminar con restricción | `legal_entities.*` | Validadores y aislamiento Data API configurable | Parcial: falta integración CRUD |
| Sedes | Configuración / Estructura | Crear, editar, activar, desactivar y eliminar con aviso de cascada | `sites.*` con alcance de sede | Validadores y aislamiento Data API configurable | Parcial: falta integración CRUD |
| Áreas | Configuración / Estructura | Crear, editar, activar, desactivar y eliminar con confirmación | `areas.*` con alcance de sede | Validadores y aislamiento Data API configurable | Parcial: falta integración CRUD |
| Miembros y roles | Configuración / Miembros | Invitar, suspender, asignar y retirar roles | `members.*` | Aislamiento Data API configurable y cobertura de navegación | Parcial: falta E2E de escalamiento |
| Onboarding | Mi SG-SST | Completar/reanudar nueve pasos | Permisos del tenant y función transaccional | Formularios y validadores unitarios | Parcial: falta E2E |
| Documentos, versiones y evidencias | Documentos | Cargar, listar, filtrar, paginar, abrir detalle, crear versión, descargar enlace firmado, archivar y eliminar lógicamente | `documents.read/create/update/delete` | Validadores de identidad; aislamiento Data API configurable | Disponible: falta integración Storage/E2E |
| Brechas y acciones | Planificación | Consultar brechas y acciones | `improvements.read` | Sin prueba de flujo | Lectura únicamente; no marcar como completo |
| Riesgos y controles | Riesgos | Consultar controles y registrar verificación | `risks.read/validate` | Sin prueba de flujo | Parcial; faltan creación y reevaluación |
| EPP | EPP | Catálogo → inventario → asignación → entrega/reposición → aceptación → inspección → baja | `ppe.read/manage/validate` y aceptación propia | Validadores, concurrencia/RLS configurable y navegación | Disponible; integración remota se ejecuta solo en entorno aislado autorizado |

## Dominios con datos, pero sin flujo web mínimo

Comités, auditorías, revisión por la dirección e indicadores cuentan con ruta protegida, formularios, estados, auditoría e inmutabilidad de aprobación. Analítica distingue explícitamente métricas vivas de resultados históricos calculados en servidor. Administración SaaS cuenta con acceso automático para operadores internos, planes versionados, suscripciones, conciliación manual, soporte e historial auditado. Incidentes, Salud ocupacional y Emergencias ya cuentan con un flujo vertical protegido; los datos sensibles y los recursos por sede requieren sus permisos específicos.

## Priorización

### P0

- Añadir pruebas de integración reales para CRUD de organización, estructura, miembros y documentos, incluido Storage privado y aislamiento entre Organization A y B.
- Añadir E2E para login, creación/onboarding, cambio de organización, carga y descarga de documento, y logout.
- Completar en UI las operaciones de acciones de mejoramiento y la creación del flujo Proceso → Actividad → Tarea → Peligro → Evaluación → Control.

### P1

- Exponer cumplimiento (fuentes, requisitos, 0312, perfiles, clasificación, aplicabilidad, snapshots y evaluaciones) solo cuando cuente con creación/lectura/acción/auditoría completos.
- Exponer planificación/tareas con responsables, evidencias y aprobación antes de habilitar el resto de módulos operativos.
- Incorporar paginación del lado del servidor y filtros semánticos para Estructura y Miembros, que aún filtran listas en memoria.

### P2

- Crear flujos verticales para dominios operativos restantes, siguiendo la secuencia de la Etapa 40A.
- Reemplazar el placeholder de notificaciones cuando las entregas in-app tengan un flujo de bandeja autorizado.

## Seguridad y límites

Los documentos permanecen en buckets privados. El servidor construye el path con el tenant y no acepta un path desde el formulario. Las descargas se emiten como enlaces firmados de 60 segundos después de verificar el permiso y la pertenencia al tenant. La eliminación es lógica y las versiones no se eliminan desde la interfaz.

No se declara cumplimiento legal ni preparación para producción mediante esta auditoría.
