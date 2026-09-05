# Perfiles y responsabilidades en Securia360

**Estado:** guía operativa del modelo RBAC vigente
**Actualizada:** 4 de septiembre de 2026
**Audiencia:** administradores de empresa, equipos SST, dirección, auditores y equipo interno de Reinova Labs.

Securia360 separa con claridad dos ámbitos de responsabilidad:

1. **La organización cliente:** administra su propio SG-SST, sus personas y sus datos.
2. **La plataforma Reinova Labs:** administra el producto, la revisión normativa editorial y el soporte, sin adquirir acceso implícito a la información de cada cliente.

Esta separación es una medida de seguridad. Un perfil de plataforma no reemplaza un perfil de una organización, y pertenecer a una organización no concede privilegios internos de Reinova Labs.

> Esta guía explica responsabilidades y configuraciones recomendadas. La autorización efectiva la decide siempre la combinación de permisos asignados, el alcance por sede cuando exista y las políticas de seguridad de datos. No es una declaración de cumplimiento legal, médico ni normativo automático.

## Cómo funciona el acceso

- Una persona puede pertenecer a una o varias organizaciones y tener más de un rol en cada una.
- Los permisos son **acumulativos**: una persona obtiene la suma de las capacidades de sus roles activos.
- Un rol puede limitarse a una **sede**. En ese caso, las consultas y acciones se restringen a dicha sede cuando el módulo admite alcance por sede.
- La interfaz usa `can(permission, context)` para mostrar acciones autorizadas. La base de datos aplica RLS como autoridad final, por lo que no es posible acceder a otra organización cambiando una URL o una petición.
- Los perfiles de experiencia visibles —Administración, Dirección, Gestión SST, Trabajo asignado y Auditoría— solo adaptan la presentación. **No autorizan nada por sí mismos.**
- Las capacidades sensibles requieren permisos específicos, incluso para roles de operación: por ejemplo, `incidents.sensitive`, `occupational_health.medical` o `occupational_health.confirm`.

## Perfiles internos de Reinova Labs

Estos perfiles no son roles de una empresa cliente. Se conceden por separado, se auditan y no otorgan lectura automática de datos de organizaciones.

| Perfil | Responsabilidad general | Puede hacer | Límites esenciales |
| --- | --- | --- | --- |
| **Administrador de plataforma** (`saas_admin`) | Administrar el producto comercial y su operación interna. | Gestionar planes, trials, suscripciones, límites, feature flags, conciliaciones manuales y sesiones de soporte auditadas. Puede administrar la organización demo. | No recibe permisos de una empresa cliente ni puede eludir RLS. Toda sesión de soporte necesita motivo, inicio y cierre auditados. Una suspensión comercial no elimina datos ni cambia permisos de seguridad. |
| **Soporte de plataforma** (`saas_support`) | Atender solicitudes operativas del producto con el menor acceso posible. | Consultar o atender sesiones de soporte que hayan sido autorizadas y documentadas. | No tiene suplantación invisible ni acceso persistente a información de clientes. No gestiona planes ni privilegios internos salvo autorización explícita. |
| **Administrador de revisión normativa** (`review_admin`) | Gobernar el proceso editorial y los revisores SST/jurídicos. | Administrar revisores activos, consultar historial de revisión y controlar el proceso interno de decisiones y propuestas. | No hereda permisos de organizaciones ni puede declarar cumplimiento automático. Las decisiones son append-only y no modifican históricos aprobados. |
| **Revisor SST/jurídico** (`reviewer`) | Revisar contenido normativo, metodologías, fórmulas, supuestos y textos de producto. | Registrar revisiones, aprobaciones, rechazos y propuestas de corrección/versionado con fundamento. | No edita versiones aprobadas ni ejecuta cambios críticos automáticamente. No obtiene acceso a tenants por ser revisor. |

## Perfiles de una organización

### Administrador de organización

**Rol técnico:** `organization_admin`
**Propósito:** responsable de la configuración, gobierno de acceso y operación integral de una empresa dentro de Securia360.

Puede gestionar la organización, estructura empresarial, miembros, invitaciones, roles y alcance por sede. Por diseño, tiene las capacidades funcionales que se han añadido para los módulos del tenant, pero debe delegar la operación diaria a perfiles especializados cuando sea posible.

No puede acceder a otra organización sin una membresía activa allí, ni administrar los roles internos de Reinova Labs. Tampoco puede dejar a su organización sin un administrador global activo; el sistema protege esa condición.

### Responsable o coordinador SST

**Roles técnicos:** `sst_manager`, `sst_coordinator`
**Propósito:** liderar la ejecución y coordinación del SG-SST, priorizar riesgos, cumplimiento, acciones, evidencias y seguimiento.

Es el perfil recomendado para articular los flujos de cumplimiento, planificación, riesgos, capacitaciones, EPP, emergencias e investigaciones, siempre que se le asignen los permisos específicos de esos módulos. Puede ser global o limitado a una sede.

En la configuración base estos roles administran la estructura empresarial y el onboarding; los permisos incorporados posteriormente se deben conceder explícitamente según las funciones que la empresa delegue. No debería administrar usuarios o elevar privilegios salvo que la organización le asigne esa responsabilidad de forma consciente.

### Profesional SST

**Rol técnico:** `sst_professional`
**Propósito:** ejecutar técnicamente actividades SST bajo la dirección del coordinador o responsable SST.

Es adecuado para levantar matrices de riesgo, evidencias, capacitaciones, controles, inspecciones y seguimiento de tareas. Puede recibir permisos de gestión acotados, sin necesidad de habilitar aprobación, cierre definitivo o administración de miembros.

### Gerente o dirección

**Rol técnico:** `manager`
**Propósito:** tomar decisiones, revisar cumplimiento, aprobar prioridades y hacer seguimiento gerencial.

Su configuración recomendada privilegia consulta de indicadores, plan anual, acciones, auditorías y vencimientos, con permisos puntuales de aprobación cuando la empresa defina segregación. No requiere acceso a expedientes sensibles ni a edición operacional rutinaria.

### Talento humano

**Rol técnico:** `hr_manager`
**Propósito:** coordinar personas, estructura, capacitaciones y restricciones funcionales estrictamente necesarias.

Debe acceder solo a los datos mínimos requeridos. La información de salud ocupacional se separa: el permiso `occupational_health.hr_sensitive` permite consultar restricciones funcionales autorizadas, pero no historias clínicas ni diagnósticos. Las decisiones que afecten a una persona requieren confirmación humana por un segundo usuario autorizado.

### Responsable de operaciones

**Rol técnico:** `operations_manager`
**Propósito:** integrar la operación de sedes, procesos, controles, emergencias y ejecución de tareas con el SG-SST.

Es apropiado para gestionar acciones operativas, recursos de emergencia y controles vinculados a procesos. Los permisos de aprobación, datos sensibles y administración de acceso deben permanecer separados salvo necesidad justificada.

### Responsable de sede

**Rol técnico:** `site_manager`
**Propósito:** administrar la ejecución de una sede concreta.

Debe asignarse con alcance por sede. Puede gestionar la estructura y los flujos operativos que la organización le delegue dentro de esa sede, sin ver ni modificar información de otras sedes. Es útil para recursos de emergencia, tareas, EPP, capacitación y controles locales.

### Auditor

**Rol técnico:** `auditor`
**Propósito:** revisar evidencia, hallazgos, informes, trazabilidad y seguimiento de auditorías.

El perfil se orienta a consulta y auditoría. Si una auditoría exige independencia, quien integra el equipo auditor no puede aprobar el informe ni verificar o cerrar sus propios hallazgos o acciones, aunque tenga permisos funcionales. La segregación se aplica en la operación y no depende solo de la interfaz.

### Trabajador

**Rol técnico:** `worker`
**Propósito:** participar en los flujos que le han sido asignados.

Puede consultar su contexto organizacional y, cuando se le concedan las capacidades correspondientes, actualizar tareas propias, confirmar asistencia, consultar certificados y aceptar entregas de EPP propias. No administra estructura, permisos, otros trabajadores ni información sensible de terceros.

### Contratista

**Rol técnico:** `contractor` y acceso de portal por contrato/sede
**Propósito:** cumplir requisitos documentales y operativos de contratos autorizados.

El portal de contratistas está separado del selector normal de organización. Un contacto contratista solo ve sus contratos activos, las sedes autorizadas, requisitos y sus propios envíos documentales. No puede aprobar documentos, contratos, accesos, evaluaciones ni consultar datos internos o de otros contratistas.

### Consulta

**Rol técnico:** `viewer`
**Propósito:** aportar visibilidad controlada sin operar el sistema.

Su uso recomendado es para consulta de estructura, información autorizada y auditoría de lectura. No debe incluir permisos de edición, aprobación, carga de evidencia ni datos personales o sensibles que no sean imprescindibles.

## Capacidades base configuradas actualmente

El catálogo inicial entrega unas capacidades mínimas a los roles de tenant. A medida que se incorporaron módulos, sus permisos se otorgaron de forma explícita al administrador de organización; por ello, asignar un nombre de rol no es suficiente para asumir que todos los módulos estarán habilitados.

| Grupo de roles | Capacidades base incluidas | Uso práctico |
| --- | --- | --- |
| `organization_admin` | Todas las capacidades de tenant incorporadas por las migraciones: configuración, estructura, documentos, cumplimiento, planificación, prevención, gobierno, análisis, automatizaciones, importaciones, Copilot y consulta comercial. | Administración integral y delegación de permisos. |
| `sst_manager`, `sst_professional`, `sst_coordinator` | Lectura de organización y miembros; crear/editar razones sociales, sedes y áreas; gestionar onboarding; consultar auditoría. | Configuración y coordinación inicial de la empresa. Los módulos especializados se conceden adicionalmente por permiso. |
| `manager`, `auditor`, `viewer` | Lectura de organización, miembros, razones sociales, sedes, áreas y auditoría. | Consulta y seguimiento base. |
| `hr_manager`, `operations_manager`, `site_manager` | Lectura de organización, miembros, razones sociales, sedes y áreas; edición de sedes y áreas. | Coordinación de estructura. El alcance por sede es recomendable para `site_manager`. |
| `worker`, `contractor` | Lectura de organización, sedes y áreas. | Participación mínima; se amplía solo con permisos de funciones personales o alcance contractual. |

## Matriz recomendada de responsabilidades por módulo

Leyenda: **A** administra/configura; **G** gestiona operación; **V** valida, aprueba o cierra; **C** consulta; **P** actúa únicamente sobre asignaciones propias; **S** acceso limitado a sede, contrato o alcance autorizado; **—** sin acceso recomendado.
La matriz es un punto de partida de gobierno: cada celda debe convertirse en permisos explícitos mediante `can(permission, context)` y no sustituye RLS.

| Capacidad o módulo | Admin. organización | Coord. / responsable SST | Profesional SST | Gerente | TH / Operaciones / sede | Auditor | Trabajador | Contratista | Consulta |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Organización, miembros y roles | **A** | C | — | C | S | C | — | — | C |
| Razones sociales, sedes y áreas | **A** | G | G | C | G/S | C | C | C/S | C |
| Cumplimiento y evaluación 0312 | A/V | G/V | G | C/V | C/S | C | — | — | C |
| Documentos y evidencias | A | G | G | C | G/S | C | P/S | P/S | C limitado |
| Brechas, acciones, plan y tareas | A/V | G/V | G | C/V | G/S | C | P | P/S | C |
| Riesgos y controles | A/V | G/V | G | C | G/S | C | P/S | P/S | C limitado |
| Capacitaciones y certificados | A/V | G/V | G | C | G/S | C | P | P/S | C limitado |
| EPP e inspecciones | A/V | G/V | G | C | G/S | C | P (aceptación propia) | P/S | C limitado |
| Contratistas y contratos | A/V | G | G | C/V | G/S | C | — | P/S | C limitado |
| Incidentes y salud ocupacional | A (según permiso) | G/V (según permiso) | G (según permiso) | C agregado | S y mínimo necesario | C autorizado | — | — | — |
| Emergencias por sede | A/V | G/V | G | C | G/S | C | P/S | P/S | C limitado |
| Comités, auditorías y revisión directiva | A/V | G | G | C/V | G/S | G/V con independencia | — | — | C |
| Indicadores y dashboard | A/V | G | C | C/V | C/S | C | C propio | — | C limitado |
| Notificaciones y automatizaciones | A/V | G | G | C | C/S | C | P | P/S | — |
| Importaciones | A | G autorizado | G autorizado | C | G/S autorizado | C | — | — | — |
| Copilot | A | G | G | C | C/S | C | P autorizado | P/S autorizado | C limitado |
| Estado comercial y facturación | C | — | — | C | — | — | — | — | — |

### Manejo de información sensible

La columna de Incidentes y Salud ocupacional no equivale a una autorización amplia. Deben asignarse permisos separados y justificados:

| Información o decisión | Permiso requerido | Regla de protección |
| --- | --- | --- |
| Detalle y evidencia sensible de incidentes | `incidents.sensitive` | Solo para personas expresamente autorizadas. |
| Gestión de incidentes | `incidents.manage` | Crear, investigar y gestionar, sin conclusiones médicas o jurídicas automáticas. |
| Cierre de incidente | `incidents.close` | Requiere investigación y acciones en estado admisible, además de motivo y auditoría. |
| Aptitud y restricciones funcionales | `occupational_health.medical` | Personal médico autorizado; no se capturan historias clínicas ni diagnósticos nuevos. |
| Consulta de restricciones funcionales | `occupational_health.hr_sensitive` | Talento humano solo recibe el mínimo necesario. |
| Confirmar decisiones que afectan personas | `occupational_health.confirm` | El confirmador debe ser un usuario autorizado distinto de quien creó la decisión. |

## Responsabilidades de aprobación y segregación

Las aprobaciones no deben concentrarse siempre en quien ejecuta el trabajo. La empresa debe asignar validadores con independencia cuando la operación lo requiera.

| Operación | Ejecuta normalmente | Valida o aprueba normalmente | Regla de seguridad |
| --- | --- | --- | --- |
| Clasificación y aplicabilidad | Coordinador o profesional SST | Responsable SST, administrador o validador delegado | Los cambios críticos requieren revisión humana; no se aplican automáticamente. |
| Evaluación, acción de mejora y cierre de brecha | Profesional SST o responsable asignado | Responsable SST, gerente o administrador delegado | Una acción validada no cierra sola la brecha: debe existir cierre explícito autorizado. |
| Plan anual y cierre de tareas | Equipo operativo | Gerencia, responsable SST o administrador delegado | Las dependencias y aprobaciones se preservan en auditoría. |
| Riesgos, controles y reevaluación | Profesional SST u operaciones | Responsable SST o validador delegado | La metodología debe estar revisada/aprobada; la decisión conserva criterio profesional. |
| Incidentes y salud ocupacional | Personal autorizado | Perfil independiente según el caso | Datos sensibles mínimos y segunda confirmación en decisiones personales. |
| Auditorías | Equipo auditor | Persona con `audits.approve` no integrante del equipo cuando se exige independencia | El auditor no puede autoaprobar ni cerrar sus hallazgos si la configuración exige segregación. |
| Actas y revisión por la dirección | Secretaría o responsable del comité | Perfil con `committees.approve` o autorización equivalente | Lo aprobado queda inmutable; las firmas son constancias internas autenticadas. |
| Planes de emergencia y acciones verificadas | Responsable de sede o SST | Perfil con `emergencies.approve` | Una acción verificada exige evidencia y se vuelve inmutable. |

## Recomendaciones para asignar perfiles

1. **Otorgar el menor privilegio útil.** Empiece con lectura o alcance por sede y amplíe solo cuando haya una responsabilidad real.
2. **Separar gestión y validación.** Configure permisos `*.manage` y `*.validate`/`*.approve` en personas distintas para procesos críticos.
3. **Usar alcance por sede.** Es preferible asignar a responsables de sede el alcance mínimo necesario, antes que acceso global.
4. **No reutilizar perfiles internos.** `saas_admin`, `saas_support`, `review_admin` y `reviewer` no deben concederse como parte de la operación cotidiana de un cliente.
5. **Revisar membresías suspendidas.** Una membresía suspendida deja de autorizar acceso, aunque la persona conserve asignaciones de rol históricas.
6. **Auditar periódicamente.** Revise roles, permisos, accesos por sede, invitaciones y sesiones de soporte desde el registro de auditoría.
7. **Evitar cuentas compartidas.** Cada usuario debe usar su propia cuenta para que aprobaciones, evidencias y decisiones sean atribuibles.

## Catálogo de permisos por familia

La siguiente referencia ayuda a convertir responsabilidades en configuración concreta. El sufijo expresa la capacidad: `read` consulta, `manage` opera, `validate` verifica/cierra y `approve` aprueba cuando el dominio lo separa.

| Familia | Permisos disponibles |
| --- | --- |
| Organización y estructura | `organization.read/update`, `members.read/create/update/roles_manage`, `legal_entities.*`, `sites.*`, `areas.*`, `onboarding.manage`, `audit.read` |
| Cumplimiento | `classifications.*`, `applicability.read/evaluate`, `snapshots.read/create`, `assessments.read/manage/validate` |
| Trabajo y prevención | `improvements.read/manage/validate`, `planning.read/manage`, `tasks.update_status/approve`, `risks.read/manage/validate`, `documents.*` |
| Operación | `training.read/manage/validate/participants`, `ppe.read/manage/validate`, `contractors.read/manage/approve`, `emergencies.read/manage/approve/directory_read` |
| Información sensible | `incidents.read/manage/sensitive/close`, `occupational_health.read/manage/hr_sensitive/medical/confirm` |
| Gobierno y análisis | `committees.read/manage/approve`, `audits.read/manage/approve`, `analytics.read/manage/approve` |
| Automatización y herramientas | `notifications.read/manage/templates_approve`, `automations.read/manage/approve`, `imports.read/manage`, `copilot.read/manage/confirm_critical` |
| Comercial del tenant | `billing.read/manage` |

## Ejemplos de configuración inicial

| Escenario | Perfil recomendado | Ajuste recomendado |
| --- | --- | --- |
| Empresa pequeña con una persona SST | Administrador de organización + Responsable SST | Separar la validación de acciones y auditorías hacia gerencia o un asesor externo cuando sea viable. |
| Empresa multisede | Administrador global, Coordinador SST global y Responsables de sede | Asignar `site_manager` con alcance por sede; reservar aprobaciones globales para coordinación o gerencia. |
| Auditoría externa | Auditor | Conceder solo lectura y capacidades de auditoría; activar independencia donde aplique y limitar el período de acceso. |
| Trabajadores operativos | Trabajador | Tareas propias, capacitación, certificados y aceptación de EPP propia; sin acceso a información de compañeros. |
| Contratista de una sede | Contratista + acceso de portal | Vincular explícitamente a contrato y sede activa; permitir únicamente requisitos y documentos propios. |
| Revisión de contenido normativo | Revisor SST/jurídico interno | Usar `reviewer` o `review_admin`, separado de roles de organizaciones. |

## Límites que nunca deben relajarse

- Un usuario de Organización A no puede leer, modificar ni descargar datos de Organización B sin una membresía y permisos válidos allí.
- Una persona sin permiso no puede forzar acciones desde la URL, la interfaz o la API de datos.
- El rol `organization_admin` es global dentro de una empresa. Solo otro administrador global puede concederlo o retirarlo, y siempre debe quedar al menos uno activo.
- Los datos médicos, incidentes sensibles, evidencias privadas y documentos no se vuelven públicos por cambiar de rol o de pantalla.
- El Copilot no cambia clasificaciones, aprueba evaluaciones, cierra hallazgos ni toma decisiones legales o médicas. Sus propuestas requieren intervención humana y quedan auditadas.
- La plataforma comercial no modifica el modelo de seguridad: una suspensión de suscripción no borra información ni revoca RLS de forma encubierta.

## Mantenimiento de esta guía

Actualice este documento cuando se cree una familia de permisos, cambie una regla de segregación o se habilite un nuevo perfil interno. Para cada cambio, verifique al menos:

1. permisos y alcance por sede;
2. políticas RLS y pruebas entre organizaciones;
3. auditoría de acciones críticas;
4. textos de interfaz y experiencia por capacidades;
5. documentación de privacidad cuando intervengan datos personales o sensibles.
