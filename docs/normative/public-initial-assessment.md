# Evaluación inicial SG-SST pública

## Alcance

La ruta pública `/evaluacion-inicial` ofrece un diagnóstico orientativo basado en los perfiles publicados y revisados de la Resolución 0312 de 2019. No requiere autenticación y no crea una evaluación formal dentro de una organización de Securia360.

El flujo es:

```text
Configurar empresa
→ confirmar perfil sugerido
→ responder por ciclo PHVA
→ revisar
→ finalizar
→ consultar o imprimir el resultado
```

## Privacidad y almacenamiento

- La razón social, el NIT opcional, la actividad seleccionada, las respuestas y el resultado permanecen en `localStorage` del navegador.
- La aplicación solo envía a Supabase el texto escrito en el buscador CIIU para consultar el catálogo público. No envía la razón social, el NIT, el número de trabajadores ni las respuestas.
- Cada evaluación conserva una copia del perfil, la versión, la regla de puntuación y los estándares usados. Una actualización posterior del catálogo no cambia un histórico finalizado.
- El historial se conserva hasta que la persona elimina una evaluación, elimina todo el historial o borra los datos del navegador.
- Un enlace de resultado abierto en otro navegador no transfiere información y muestra un estado explicativo.

La clave de almacenamiento se conserva como `securia360:public-initial-assessments:v1` para no perder históricos, mientras cada registro declara su versión de esquema. Los resultados terminados en versión 1 siguen disponibles sin cambios. Un borrador versión 1 exige seleccionar una actividad del catálogo; conserva respuestas si el perfil no cambia y las reinicia, con advertencia, cuando el riesgo cambia el conjunto aplicable.

## Catálogo CIIU y clase de riesgo

La actividad económica es obligatoria y se selecciona desde el catálogo versionado basado en el Decreto 768 de 2022. La fuente cargada tiene la huella SHA-256 `20AE1BC84E751E64EAFDEDC411A09F34B28A835D99C0C342E08CBFA36444BCAA`.

- El código visible combina CIIU normalizado y código adicional: `0161` + `01` se presenta como `161-01`.
- Las 1.069 filas suministradas producen 1.067 opciones después de retirar dos repeticiones idénticas.
- Existen 858 códigos visibles; 168 conservan varias actividades o riesgos.
- Un mismo código no determina el riesgo por sí solo. Por ejemplo, `161-01` ofrece tres actividades distintas con riesgos II, IV y V.
- La actividad exacta seleccionada asigna el riesgo y bloquea su edición manual. La persona debe confirmar que la descripción corresponda a la actividad real.

`public.search_public_economic_activities(text, integer)` devuelve como máximo 50 coincidencias por código o palabras de actividad. Sus tablas permanecen en `public_catalog`, sin lectura o escritura anónima directa. La consulta es una ayuda operativa y no sustituye validación profesional ni constituye una conclusión legal automática.

## Perfil orientativo

La sugerencia usa el número de trabajadores y la clase de riesgo derivada de la actividad exacta seleccionada:

| Condición informada | Perfil sugerido |
| --- | --- |
| Hasta 10 trabajadores y riesgo I a III | 7 estándares |
| Entre 11 y 50 trabajadores y riesgo I a III | 21 estándares |
| Más de 50 trabajadores, o riesgo IV a V | 60 estándares |

La persona debe confirmar la sugerencia. Esta selección no sustituye la validación profesional de la información empresarial ni determina por sí sola obligaciones jurídicas.

## Cálculo

Cada respuesta `Cumple` aporta el 100% del peso del estándar y `No cumple` aporta 0%. La suma usa las ponderaciones congeladas de la versión publicada. Los límites de presentación son:

- Menor de 60%: Crítico.
- Entre 60% y 85%, inclusive: Moderadamente aceptable.
- Mayor de 85%: Aceptable.

El resultado muestra puntaje total, distribución por PHVA y brechas ordenadas por peso. Siempre incluye una advertencia: el diagnóstico orienta prioridades, pero no sustituye la autoevaluación formal, las evidencias, la interpretación normativa ni la revisión profesional.

## Contrato público de catálogo

`public.get_public_initial_assessment_catalog()` devuelve exclusivamente:

- la versión publicada y revisada de cada perfil soportado;
- una regla de puntuación aprobada y revisada con multiplicadores `100/0`;
- estándares activos y revisados;
- código, descripción, PHVA, criterio, evidencia, peso y referencia normativa.

La función no recibe datos de empresa ni respuestas. Se ejecuta con una proyección fija y tiene `EXECUTE` únicamente para `anon` y `authenticated`. Las tablas normativas conservan sus grants y políticas actuales; `anon` no puede consultarlas ni modificarlas directamente.

## Validación operativa

Antes de publicar cambios del catálogo:

1. verificar que cada perfil tenga 7, 21 o 60 estándares según corresponda;
2. verificar que la suma de pesos sea exactamente 100;
3. confirmar estados `published/reviewed`, `active/reviewed` y `approved/reviewed`;
4. ejecutar la prueba SQL `supabase/tests/public_initial_assessment_catalog.sql`;
5. ejecutar pruebas unitarias, navegación pública y E2E de los tres perfiles;
6. ejecutar `supabase/tests/public_economic_activity_catalog.sql` y comprobar los tres resultados de `161-01`.
