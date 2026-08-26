# PROMPT MAESTRO PARA CODEX — SECURIA360

Quiero iniciar y desarrollar una plataforma SaaS empresarial llamada **Securia360**, desarrollada por **Reinova Labs**, orientada inicialmente a la gestión integral, automatizada e inteligente del Sistema de Gestión de Seguridad y Salud en el Trabajo — SG-SST en Colombia.

La plataforma debe diseñarse desde el inicio como un producto:

* SaaS.
* Multiempresa.
* Multisede.
* Multirrol.
* Multisector.
* Escalable.
* Seguro.
* Auditable.
* Modular.
* Preparado para inteligencia artificial.
* Preparado para automatizaciones.
* Preparado para aplicación móvil.
* Preparado para integraciones empresariales futuras.
* Preparado para versionamiento normativo.
* Preparado para cambios futuros en legislación, estándares y metodologías.

No construir todo el producto en una sola iteración.

El objetivo inicial es establecer correctamente la **arquitectura técnica, estructura de proyecto, seguridad, multi-tenancy, RBAC, modelo empresarial y arquitectura normativa**, de forma que todos los módulos posteriores puedan construirse sin rediseñar el núcleo.

---

# 1. VISIÓN DEL PRODUCTO

Securia360 debe convertirse en una plataforma integral para administrar el SG-SST de una organización.

El flujo central del producto debe ser:

```text
FUENTE NORMATIVA / TÉCNICA
↓
REQUISITO / ESTÁNDAR / METODOLOGÍA
↓
APLICABILIDAD
↓
EVALUACIÓN
↓
BRECHA
↓
ACCIÓN
↓
RESPONSABLE
↓
TAREA
↓
EVIDENCIA
↓
VALIDACIÓN
↓
CUMPLIMIENTO
↓
INDICADOR
↓
AUTOMATIZACIÓN
↓
MEJORA CONTINUA
```

La experiencia funcional debe seguir:

**Detectar → Priorizar → Asignar → Ejecutar → Evidenciar → Verificar → Mejorar.**

---

# 2. MARCO NORMATIVO PRINCIPAL

La arquitectura debe contemplar explícitamente cuatro fuentes principales para Colombia:

## 2.1 Ley 1562 de 2012

Debe tratarse como parte del marco legal del Sistema General de Riesgos Laborales y del SG-SST.

Debe poder originar:

* requisitos;
* obligaciones;
* conceptos;
* referencias legales;
* relaciones con otros instrumentos normativos.

Tipo:

```text
LAW
```

---

## 2.2 Decreto 1072 de 2015

Debe modelarse como una fuente normativa estructural del SG-SST.

Debe influir funcionalmente en módulos como:

* política SST;
* organización del sistema;
* planificación;
* evaluación inicial;
* objetivos;
* plan anual;
* indicadores;
* identificación de peligros;
* controles;
* gestión del cambio;
* adquisiciones;
* contratación;
* emergencias;
* auditorías;
* revisión por la dirección;
* acciones preventivas;
* acciones correctivas;
* mejora continua.

Tipo:

```text
DECREE
```

No reducir el Decreto 1072 a una simple referencia documental.

Debe poder originar requisitos operativos dentro de la plataforma.

---

## 2.3 Resolución 0312 de 2019

Debe tratarse como la fuente principal para los **Estándares Mínimos del SG-SST**.

Debe permitir:

* perfiles de aplicabilidad;
* conjuntos de estándares;
* ponderaciones;
* evaluación;
* puntajes;
* clasificación;
* plan de mejoramiento;
* histórico;
* cambios de perfil por número de trabajadores o clase de riesgo.

Tipo:

```text
RESOLUTION
```

Muy importante:

**Los estándares mínimos NO deben modelarse simplemente como requirements genéricos.**

Debe existir una entidad específica para:

```text
minimum_standards
```

y otra para perfiles:

```text
standard_profiles
```

---

## 2.4 GTC 45

Debe tratarse como una **guía técnica / metodología**, no como una ley o resolución.

Debe soportar la metodología para:

* identificación de peligros;
* clasificación de peligros;
* valoración del riesgo;
* controles existentes;
* aceptabilidad;
* medidas de intervención;
* reevaluación.

Tipo:

```text
TECHNICAL_GUIDE
```

No hardcodear la plataforma únicamente a GTC 45.

Crear una arquitectura de:

```text
risk_methodologies
```

para que GTC 45 sea inicialmente una metodología disponible, pero puedan existir otras en el futuro.

---

# 3. PRINCIPIO DE MODELADO NORMATIVO

No utilizar una única tabla `regulations` para representar todo.

Separar claramente:

```text
FUENTES NORMATIVAS
LEGISLACIÓN
ESTÁNDARES MÍNIMOS
METODOLOGÍAS TÉCNICAS
REQUISITOS
```

La arquitectura conceptual debe ser:

```text
normative_sources
│
├── LAW
├── DECREE
├── RESOLUTION
├── CIRCULAR
├── TECHNICAL_GUIDE
├── TECHNICAL_STANDARD
└── INTERNAL_STANDARD
        │
        ▼
normative_source_versions
        │
        ├── requirements
        ├── minimum_standards
        └── methodology references
```

---

# 4. ENTIDADES NORMATIVAS FUTURAS OBLIGATORIAS

Preparar el diseño para soportar:

```text
normative_sources
normative_source_versions

requirements

minimum_standards

standard_profiles
standard_profile_versions
profile_standards

applicability_rules

risk_methodologies
risk_methodology_versions

organization_classifications
classification_change_proposals

organization_requirements

organization_standard_snapshots
organization_standard_snapshot_items

assessments
assessment_items
```

No es obligatorio crear todas estas tablas en la primera iteración si todavía no se usarán, pero:

* documentarlas;
* evitar decisiones que impidan implementarlas correctamente;
* preparar relaciones conceptuales;
* definir convenciones.

---

# 5. DIFERENCIA ENTRE REQUIREMENT, STANDARD Y METHODOLOGY

Mantener esta separación estricta.

## Requirement

Representa una obligación o requerimiento derivado de una fuente normativa.

Ejemplo:

```text
Realizar auditoría anual del SG-SST
```

---

## Minimum Standard

Representa un estándar evaluable, especialmente de la Resolución 0312.

Ejemplo:

```text
Estándar mínimo aplicable a determinado perfil empresarial
```

Debe poder contener:

* código;
* descripción;
* peso;
* ciclo PHVA;
* criterio;
* evidencia esperada;
* perfil aplicable;
* versión.

---

## Methodology

Representa una metodología técnica.

Ejemplo:

```text
GTC45_RISK_ASSESSMENT
```

Debe poder contener:

* variables;
* reglas;
* catálogos;
* fórmulas;
* criterios de interpretación;
* versión.

---

# 6. PERFIL NORMATIVO SEGÚN RESOLUCIÓN 0312

La empresa no debe tener una categoría estática almacenada directamente como:

```text
organization.profile = "A"
```

Debe existir un histórico temporal.

Preparar:

```text
organization_classifications
```

Con campos futuros como:

```text
id
organization_id
employee_count
risk_class
ciiu_code
economic_activity
standard_profile_id
effective_from
effective_to
change_reason
confirmed_by
confirmed_at
```

La empresa debe poder cambiar de perfil sin perder el histórico.

---

# 7. CAMBIOS DE CLASIFICACIÓN

Cuando cambie una variable relevante:

```text
employee_count
risk_class
ciiu_code
economic_activity
```

la arquitectura debe permitir:

```text
Cambio detectado
↓
Classification Evaluator
↓
Perfil actual
vs
Perfil propuesto
↓
Change Proposal
↓
Revisión humana
↓
Aprobación
↓
Cerrar clasificación anterior
↓
Crear clasificación nueva
↓
Recalcular estándares
↓
Analizar brechas
```

No aplicar automáticamente cambios críticos sin revisión humana.

---

# 8. SNAPSHOTS

Preparar explícitamente cuatro tipos de estado histórico:

```text
CURRENT_STATE
MONTHLY_SNAPSHOT
MANUAL_SNAPSHOT
CLASSIFICATION_CHANGE_SNAPSHOT
```

## Current State

Representa los datos vivos actuales.

## Monthly Snapshot

Fotografía histórica mensual e inmutable.

## Manual Snapshot

Fotografía extraordinaria creada por usuario autorizado.

## Classification Change Snapshot

Fotografía asociada a un cambio de clasificación normativa.

Nunca sustituir los datos transaccionales por snapshots.

---

# 9. RECÁLCULO DE CLASIFICACIÓN

Debe poder ocurrir:

* automáticamente por eventos críticos;
* manualmente por usuario autorizado;
* opcionalmente mediante revisión nocturna.

Ejemplos de eventos:

```text
worker.created
worker.terminated
risk_class.changed
economic_activity.changed
workforce.import.completed
```

Evitar ejecutar cientos de recálculos durante importaciones masivas.

Ejemplo correcto:

```text
500 workers imported
↓
1 import.completed
↓
1 classification recalculation
```

---

# 10. GTC 45 — ARQUITECTURA DE RIESGOS

Preparar el dominio de riesgos para soportar:

```text
Process
↓
Activity
↓
Task
↓
Hazard
↓
Possible Effects
↓
Existing Controls
↓
Risk Assessment
↓
Acceptability
↓
Intervention Measures
↓
Follow-up
↓
Reassessment
```

Entidades futuras esperadas:

```text
processes
activities
risk_tasks

hazard_catalog

risk_identifications
risk_assessments
risk_controls

risk_methodologies
risk_methodology_versions
```

---

# 11. VARIABLES DE GTC 45

El diseño debe permitir almacenar, cuando corresponda:

* proceso;
* zona/lugar;
* actividad;
* tarea;
* rutinaria / no rutinaria;
* peligro;
* descripción;
* clasificación;
* efectos posibles;
* controles en la fuente;
* controles en el medio;
* controles en el individuo;
* nivel de deficiencia;
* nivel de exposición;
* nivel de probabilidad;
* interpretación;
* nivel de consecuencia;
* nivel de riesgo;
* interpretación del riesgo;
* aceptabilidad;
* número de expuestos;
* peor consecuencia;
* existencia de requisito legal;
* medidas de intervención.

No implementar toda la metodología todavía, pero el modelo futuro debe permitirlo.

---

# 12. JERARQUÍA DE CONTROLES

Los controles de riesgo deben soportar:

```text
ELIMINATION
SUBSTITUTION
ENGINEERING
ADMINISTRATIVE
PPE
```

No guardar los controles únicamente como texto libre.

Cada control futuro debe poder tener:

* tipo;
* descripción;
* responsable;
* fecha;
* estado;
* evidencia;
* efectividad.

---

# 13. STACK TECNOLÓGICO

## Frontend

Utilizar:

* Next.js.
* React.
* TypeScript.
* Tailwind CSS.
* shadcn/ui.
* TanStack Query.
* React Hook Form.
* Zod.

Usar versiones estables y compatibles.

Mantener lockfile versionado.

---

# 14. BACKEND

Utilizar:

**Supabase**

Componentes:

* PostgreSQL.
* Supabase Auth.
* Supabase Storage.
* Edge Functions.
* Realtime únicamente cuando aporte valor.
* Cron posteriormente.

PostgreSQL debe ser la fuente única de verdad de los datos transaccionales.

---

# 15. ARQUITECTURA

Utilizar:

**Modular Monolith**

No crear microservicios para el MVP.

Dominios previstos:

```text
organizations
identity
people
compliance
planning
tasks
documents
risks
inspections
findings
training
ppe
contractors
incidents
occupational-health
emergencies
committees
audits
indicators
automation
notifications
analytics
ai
integrations
```

Mantener límites claros entre dominios.

---

# 16. MULTI-TENANCY

La organización es el tenant principal.

Crear:

```text
organizations
```

La mayoría de las entidades empresariales deben incluir:

```text
organization_id UUID NOT NULL
```

No confiar en `organization_id` enviado por frontend.

La autoridad real es RLS.

---

# 17. ESTRUCTURA EMPRESARIAL

Soportar:

```text
Organization
↓
Legal Entity
↓
Site
↓
Area
```

Una organización puede tener varias razones sociales.

Una razón social puede tener varias sedes.

Una sede puede contener varias áreas.

---

# 18. MODELO INICIAL DE DATOS

Crear inicialmente:

## organizations

```text
id uuid PK
name
slug
nit
country_code
timezone
status
settings jsonb
created_at
updated_at
```

## legal_entities

```text
id
organization_id
legal_name
trade_name
tax_id
ciiu_code
economic_activity
legal_representative
risk_class
employee_count
status
created_at
updated_at
```

## sites

```text
id
organization_id
legal_entity_id
name
code
address
city
department
risk_class
status
created_at
updated_at
```

## areas

```text
id
organization_id
site_id
parent_area_id nullable
name
code
status
created_at
updated_at
```

---

# 19. AUTENTICACIÓN

Utilizar Supabase Auth.

No crear sistema propio de passwords.

Crear:

```text
profiles
```

Relacionado 1:1 con `auth.users`.

Campos:

```text
id uuid PK FK auth.users.id
first_name
middle_name
last_name
second_last_name
phone
avatar_path
status
created_at
updated_at
```

---

# 20. USUARIOS MULTIORGANIZACIÓN

No agregar:

```text
profiles.organization_id
```

Crear:

```text
organization_members
```

Campos:

```text
id
organization_id
user_id
status
joined_at
created_at
```

Restricción única:

```text
organization_id + user_id
```

---

# 21. RBAC

Crear:

```text
roles
permissions
role_permissions
member_roles
```

Roles iniciales:

```text
organization_admin
sst_manager
manager
worker
```

Preparar:

```text
sst_professional
sst_coordinator
hr_manager
operations_manager
site_manager
auditor
contractor
viewer
```

---

# 22. PERMISOS

Formato:

```text
module.action
```

Ejemplo:

```text
organization.read
organization.update

members.read
members.create

sites.read
sites.create

areas.read
areas.update
```

Crear API reutilizable:

```text
can(permission)
```

Evitar comprobaciones dispersas de roles en componentes.

---

# 23. SCOPE DE ROLES

Preparar `member_roles` para scope opcional por sede.

Ejemplo:

```text
User: Carlos
Role: sst_manager
Site: Bucaramanga
```

---

# 24. RLS

Todas las tablas expuestas mediante Supabase Data API deben tener RLS.

Patrón:

```text
auth.uid()
↓
organization_members
↓
organization_id
```

Usuario A no puede consultar datos de Organización B.

---

# 25. TEST CRÍTICO

Crear pruebas:

```text
User A → Organization A → allowed
User A → Organization B → denied
```

No considerar terminado el multi-tenancy sin esta prueba.

---

# 26. SEGURIDAD SUPABASE

Reglas:

* nunca exponer service role;
* no usar `user_metadata` para autorización;
* no confiar solo en `authenticated`;
* UPDATE con `USING` y `WITH CHECK`;
* cuidado con `SECURITY DEFINER`;
* no usar `SECURITY DEFINER` para evitar RLS;
* vistas futuras con `security_invoker` cuando corresponda;
* secretos solo server-side.

---

# 27. ESTRUCTURA DEL REPOSITORIO

Preferencia:

```text
securia360/
│
├── apps/
│   └── web/
│
├── packages/
│   ├── ui/
│   ├── types/
│   ├── validation/
│   └── domain/
│
├── supabase/
│   ├── migrations/
│   ├── functions/
│   ├── seed.sql
│   └── config.toml
│
├── docs/
│   ├── architecture/
│   ├── database/
│   ├── normative/
│   └── decisions/
│
└── README.md
```

Si monorepo no aporta valor todavía, simplificar manteniendo separación equivalente.

---

# 28. MÓDULOS

Dentro de web:

```text
src/
├── modules/
│   ├── auth/
│   ├── organizations/
│   ├── members/
│   ├── sites/
│   ├── areas/
│   └── compliance/
│
├── components/
├── lib/
├── hooks/
├── services/
└── types/
```

---

# 29. VALIDACIÓN

Usar Zod.

Todo formulario debe tener:

* schema;
* errores;
* frontend validation;
* server-side validation cuando corresponda.

---

# 30. UI / UX

Securia360 debe parecer un SaaS B2B moderno.

Estilo:

* profesional;
* limpio;
* minimalista;
* tecnológico;
* orientado a productividad;
* gerencialmente presentable.

Evitar:

* exceso de gradientes;
* glassmorphism excesivo;
* saturación;
* apariencia genérica.

---

# 31. DESIGN SYSTEM

Crear componentes reutilizables:

```text
Button
Input
Textarea
Select
Combobox
Checkbox
Radio
Switch
Badge
Card
KpiCard
Alert
Dialog
Drawer
DataTable
Tabs
Breadcrumb
Avatar
Tooltip
DropdownMenu
CommandPalette
EmptyState
LoadingSkeleton
PageHeader
StatusBadge
```

---

# 32. LAYOUT

Sidebar inicial:

```text
Inicio

Mi SG-SST

Planificación

Personas

Riesgos

Operación

Documentos

Analítica

Automatizaciones

Securia Copilot

Configuración
```

Módulos aún no disponibles pueden mostrarse como:

```text
Próximamente
```

---

# 33. HEADER

Incluir:

* breadcrumbs;
* organización actual;
* búsqueda;
* notificaciones;
* avatar;
* menú perfil.

---

# 34. DASHBOARD INICIAL

Mostrar placeholders estructurados para:

```text
Cumplimiento SG-SST
Plan anual
Acciones pendientes
Documentos
Próximos vencimientos
```

Usar empty states cuando no existan datos.

---

# 35. ONBOARDING

Wizard:

```text
1. Organización
2. Razón social
3. Actividad económica
4. CIIU
5. Número de trabajadores
6. Clase de riesgo
7. Sedes
8. Responsable SST
9. Caracterización operativa
```

Campos iniciales de caracterización:

```text
work_at_height
confined_spaces
chemical_exposure
electrical_work
transport_operations
heavy_machinery
night_work
remote_work
manual_load_handling
```

Estos datos serán usados posteriormente por el motor de aplicabilidad.

---

# 36. AUDITORÍA

Preparar patrón para:

```text
audit_log
```

Campos:

```text
id
organization_id
actor_user_id
action
entity_type
entity_id
before_data jsonb
after_data jsonb
ip_address
created_at
```

---

# 37. DOMAIN EVENTS

Preparar abstracción para:

```text
organization.created
member.invited
site.created
classification.changed
assessment.completed
risk.changed
document.expiring
task.overdue
```

No implementar infraestructura compleja todavía.

---

# 38. EDGE FUNCTIONS

No usarlas para CRUD normal si Supabase + RLS es suficiente.

Reservarlas para:

* invitaciones;
* operaciones privilegiadas;
* generación de documentos;
* IA;
* integraciones;
* automatizaciones;
* procesamiento.

---

# 39. STORAGE

Preparar buckets futuros:

```text
organization-documents
worker-documents
evidences
inspection-media
incident-media
generated-reports
avatars
```

Implementar inicialmente:

```text
avatars
```

---

# 40. DATABASE CONVENTIONS

Usar:

```text
snake_case
UUID
timestamptz
UTC
```

Convenciones:

```text
created_at
updated_at
created_by
updated_by
```

cuando corresponda.

---

# 41. MIGRACIONES

Todo cambio de schema debe realizarse mediante migraciones.

Proceso:

```text
crear migración
↓
aplicar localmente
↓
verificar schema
↓
probar
↓
revisar RLS
↓
documentar
```

---

# 42. FOREIGN KEYS Y CONSTRAINTS

Usar foreign keys reales.

Definir conscientemente:

```text
RESTRICT
CASCADE
SET NULL
```

No usar CASCADE indiscriminadamente.

Crear unique constraints donde aplique.

---

# 43. DATOS DEMO

Crear:

```text
Empresa Demo Colombia SAS
```

Con:

* razón social;
* dos sedes;
* varias áreas;
* usuarios demo.

---

# 44. TESTING

Mínimos:

## Unit

* validadores;
* permisos;
* helpers.

## Integration

* membership;
* multi-tenancy;
* RLS.

## E2E futuro

* login;
* onboarding;
* organization setup.

---

# 45. ERROR HANDLING

Tipos:

```text
ValidationError
AuthorizationError
NotFound
Conflict
UnexpectedError
```

No mostrar errores PostgreSQL crudos.

---

# 46. DOCUMENTACIÓN

Crear:

```text
README.md

docs/architecture/overview.md
docs/database/schema.md
docs/security/multi-tenancy.md

docs/normative/architecture.md
docs/normative/ley-1562-2012.md
docs/normative/decreto-1072-2015.md
docs/normative/resolucion-0312-2019.md
docs/normative/gtc-45.md

docs/decisions/
```

Los documentos normativos internos no deben copiar textos protegidos de forma extensa; documentar estructura, referencias, interpretación funcional y relaciones del sistema.

---

# 47. ADR INICIALES

Crear:

```text
ADR-001 Modular Monolith
ADR-002 Supabase backend
ADR-003 Organization multi-tenancy
ADR-004 PostgreSQL RLS
ADR-005 UUID PKs
ADR-006 Normative source abstraction
ADR-007 Requirements vs Minimum Standards
ADR-008 Risk methodology abstraction
ADR-009 Historical organization classification
ADR-010 Monthly immutable snapshots
```

---

# 48. NO IMPLEMENTAR TODAVÍA

No implementar aún:

* evaluación completa 0312;
* scoring completo;
* GTC 45 completa;
* plan anual;
* task engine;
* DMS completo;
* inspecciones;
* capacitaciones;
* EPP;
* accidentes;
* medicina laboral;
* automatizaciones;
* Copilot;
* aplicación móvil;
* microservicios.

Dejar preparada la arquitectura.

---

# 49. ALCANCE DE LA PRIMERA ITERACIÓN

Implementar únicamente:

```text
1. Estructura repositorio
2. Next.js
3. TypeScript
4. Design system base
5. Supabase
6. Auth
7. Profiles
8. Organizations
9. Organization Members
10. RBAC
11. RLS
12. Legal Entities
13. Sites
14. Areas
15. Organization selector
16. Onboarding
17. Caracterización inicial
18. Layout principal
19. Settings
20. Dashboard placeholder
21. Seed
22. Tests aislamiento
23. Documentación normativa inicial
24. ADRs
```

---

# 50. CRITERIOS DE ACEPTACIÓN

## Auth

* login funciona;
* logout funciona;
* rutas privadas protegidas.

## Multiempresa

* usuario puede pertenecer a varias organizaciones;
* puede cambiar tenant;
* datos cambian correctamente.

## Seguridad

* aislamiento RLS probado;
* llamada directa a Supabase no puede saltarse tenant.

## RBAC

* permisos centralizados;
* acciones protegidas.

## Organización

CRUD para:

* organizaciones;
* razones sociales;
* sedes;
* áreas;
* miembros.

## Onboarding

Captura:

* empresa;
* CIIU;
* actividad;
* trabajadores;
* riesgo;
* sedes;
* caracterización.

## Calidad

* typecheck;
* lint;
* tests;
* build;
* migraciones válidas.

---

# 51. FORMA DE TRABAJO DE CODEX

Antes de modificar:

1. inspeccionar repositorio;
2. revisar dependencias;
3. revisar migraciones;
4. revisar patrones existentes;
5. identificar impacto;
6. proponer implementación breve.

No recrear componentes existentes.

No romper código funcional.

---

# 52. PROCESO POR HISTORIA

Antes:

* explicar objetivo;
* dependencias;
* archivos;
* migraciones;
* riesgos.

Después ejecutar:

```text
typecheck
lint
tests
build
```

Y cuando exista Supabase local:

* migrations;
* RLS tests;
* seed.

---

# 53. PRINCIPIO DE DISEÑO

Aplicar:

**simple now, extensible later.**

No sobrediseñar.

Pero nunca comprometer:

* seguridad;
* tenant isolation;
* versionamiento normativo;
* integridad histórica;
* separación entre requirement / standard / methodology;
* clasificación temporal.

---

# 54. RESULTADO DE ESTA ITERACIÓN

Debe ser posible:

```text
Login
↓
Seleccionar organización
↓
Dashboard
↓
Configurar empresa
↓
Razones sociales
↓
Sedes
↓
Áreas
↓
Miembros
↓
Roles
↓
Onboarding
```

Todo protegido mediante RLS.

---

# 55. SIGUIENTE ITERACIÓN PREVISTA

La arquitectura debe quedar lista para construir después:

```text
Normative Sources
↓
Ley 1562
Decreto 1072
Resolución 0312
GTC 45
↓
Requirements
Minimum Standards
Risk Methodologies
↓
Standard Profiles
↓
Organization Classification
↓
Applicability
↓
Assessment
```

sin reconstruir el núcleo SaaS.

---

# 56. PRIMERA ACCIÓN

Antes de escribir código:

1. inspecciona el repositorio;
2. indica el estado actual;
3. identifica conflictos;
4. describe brevemente la arquitectura a implementar;
5. comienza solo con infraestructura y núcleo SaaS;
6. no implementes el roadmap completo de una sola vez.

El objetivo es construir una base empresarial sólida y jurídicamente extensible para Securia360.
