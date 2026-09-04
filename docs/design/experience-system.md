# Sistema de experiencia de Securia360

## Dirección

Securia360 utiliza una estética enterprise contemporánea, clara y sobria. La interfaz debe ayudar a detectar, priorizar, asignar, ejecutar, evidenciar, verificar y mejorar.

Parámetros:

- Densidad: 6/10.
- Variación compositiva: 4/10.
- Movimiento: 2/10.
- Tema principal: claro.
- Radio de controles: 10 px.
- Radio de superficies: 14 px.
- Tipografía: Geist Sans; Geist Mono solo para códigos, fechas técnicas y cifras tabulares.

## Jerarquía de navegación

La navegación contiene cinco grupos de trabajo, Inicio y dos utilidades. Solo se muestran destinos permitidos por las capacidades efectivas del actor.

1. Trabajo.
2. Cumplimiento.
3. Prevención.
4. Organización.
5. Análisis.
6. Securia Copilot.
7. Configuración.

Los nombres de rol nunca controlan la interfaz. El perfil de experiencia es una presentación derivada de permisos y no reemplaza la autorización del servidor ni las políticas de datos.

## Patrones

- Resumen: una acción principal, información priorizada y próximos pasos.
- Listado: búsqueda, filtros, paginación y estados de carga, vacío y error.
- Detalle: resumen, acciones, evidencia, actividad y auditoría.
- Creación breve: panel lateral.
- Formulario complejo: página dedicada con progreso y guardado.
- Acción destructiva o irreversible: confirmación con consecuencias.
- Historial: línea de tiempo con actor, fecha y decisión legible.

## Lenguaje

- No mostrar UUID, JSON, nombres de tablas o estados en `snake_case`.
- Usar etiquetas de estado centralizadas.
- Explicar cómo resolver un bloqueo, no solo informar que existe.
- Evitar referencias técnicas de infraestructura en contenido para usuarios.
- Recordar que las decisiones normativas, médicas y jurídicas requieren intervención humana.

## Accesibilidad

- Contraste WCAG 2.2 AA.
- Foco visible en controles y navegación.
- Navegación completa con teclado.
- Zoom al 200 por ciento sin pérdida de contenido.
- Regiones y nombres accesibles para navegación, tablas, diálogos y estados.
- Movimiento reducido respetado globalmente.

## Entrega progresiva

La infraestructura visual, landing, acceso, selector de organización, shell, navegación, dashboard y estructura empresarial constituyen el primer corte. Los módulos operativos deben adoptar estos patrones por flujo completo y conservar sus rutas actuales.

### Estado del primer corte

- Implementado: marca configurable, tokens, tipografía, componentes base, landing, acceso y recuperación de contraseña.
- Implementado: navegación agrupada y filtrada por capacidades, breadcrumbs, organización activa, perfil y bandeja existente.
- Implementado: búsqueda de pantallas y de tareas, acciones, documentos y sedes que el actor puede consultar.
- Implementado: dashboard con datos vivos, atención priorizada, estado por sede y accesos según capacidades.
- Implementado: selección de organización, señal de datos demo, estructura empresarial y personas sin identificadores técnicos visibles.
- Implementado: biblioteca documental con carga contextual, filtros, estados legibles y acceso al historial de versiones.
- Implementado: planificación en tablero o agenda, creación guiada de planes, actividades y tareas, responsables legibles y gestión lateral.
- Implementado: plan de mejoramiento con origen y prioridades traducidos, creación contextual y cierre humano autorizado.
- Implementado: matriz de riesgos por etapas y valoración generada desde variables de una metodología aprobada, sin entrada JSON visible.
- Implementado: Cumplimiento presenta explicaciones estructuradas, cortes históricos y responsables legibles sin mostrar JSON ni UUID.
- Validado: vista pública en 360, 768, 1280 y 1440 px, teclado básico, movimiento reducido, lint, tipos, pruebas y build.

El selector global de sede no se mostrará hasta que cada consulta operativa consuma ese alcance. Mostrarlo antes produciría una expectativa falsa de filtrado y podría mezclar resultados de distintas sedes. Los módulos sensibles y de gobierno adoptarán estos patrones como cortes independientes antes de declararlos renovados.

### Estado del segundo corte: Organización y personas

- La configuración empresarial comparte una navegación estable entre Empresa, Estructura, Personas y Mi perfil.
- Empresa presenta identidad, estado, país, zona horaria y métricas de estructura antes de ofrecer acciones de edición.
- Personas separa dos conceptos: los miembros con acceso a la plataforma y la nómina operativa sin credenciales.
- Los miembros disponen de ficha legible con responsabilidades, alcance por sede, estado, actividad auditada y retiro confirmado de accesos.
- Los trabajadores disponen de ficha laboral mínima, ubicación y origen de importación; sus cambios continúan en el flujo auditado de importaciones.
- Búsqueda, filtros, paginación, estados vacíos y enlaces de detalle conservan el contexto de la organización.
- No se añadieron tablas ni permisos: las consultas reutilizan el JWT del actor, RLS y `can(permission, context)` existentes.

### Estado del tercer corte: flujos centrales SG-SST

- Cumplimiento, mejoramiento, planificación, riesgos y documentos comparten una navegación contextual que permite continuar el trabajo sin volver al menú principal.
- Planificación muestra un resumen de carga, vencimientos, responsables y cierres antes del tablero o la agenda.
- Riesgos orienta el siguiente paso según el avance real de la matriz y mantiene bloqueado el cálculo cuando no existe metodología aprobada y revisada.
- Documentos incorpora resumen de activos, próximos vencimientos y archivados; su detalle traduce el contexto y estado sin exponer nombres técnicos.
- Cumplimiento separa catálogo, decisiones, cortes históricos y evaluaciones mediante navegación estable, estados legibles y auditoría traducida.
- No se añadió una migración: este corte reutiliza permisos, RLS, acciones y modelos existentes sin cambiar el esquema remoto.

### Estado del cuarto corte: operación y datos sensibles

- Capacitaciones guía el flujo de catálogo, plan, sesión, convocatoria, asistencia, evaluación y certificado; las respuestas se construyen desde preguntas legibles y la calificación sigue ocurriendo en el servidor.
- EPP prioriza inventario, alertas, asignaciones e historial por persona sin exponer identificadores internos.
- Contratistas presenta empresas, contratos, requisitos, envíos, evaluaciones y accesos al portal como un expediente operativo filtrable.
- Incidentes organiza reporte, investigación, personas, causas, acciones, evidencia y cierre con advertencias de privacidad y acceso sensible.
- Salud ocupacional separa gestión general, acceso médico y decisiones de talento humano; no solicita diagnósticos ni historias clínicas y exige confirmación humana independiente.
- Emergencias agrupa recursos, brigadas, planes versionados, simulacros, hallazgos, acciones y un directorio local cifrado por sede.
- Los formularios secundarios se abren bajo demanda, los estados se presentan en lenguaje natural y la navegación contextual permite cambiar de módulo sin perder la organización.
- No se añadió una migración: este corte reutiliza el modelo, RLS, permisos y auditoría existentes.
