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

- La razón social, el NIT opcional, la caracterización, las respuestas y el resultado permanecen en `localStorage` del navegador.
- La aplicación no envía esos datos a Supabase, OpenAI ni otros servicios.
- Cada evaluación conserva una copia del perfil, la versión, la regla de puntuación y los estándares usados. Una actualización posterior del catálogo no cambia un histórico finalizado.
- El historial se conserva hasta que la persona elimina una evaluación, elimina todo el historial o borra los datos del navegador.
- Un enlace de resultado abierto en otro navegador no transfiere información y muestra un estado explicativo.

La clave de almacenamiento es versionada: `securia360:public-initial-assessments:v1`. Los registros corruptos se omiten sin bloquear la experiencia y se informa que hubo una recuperación parcial.

## Perfil orientativo

La sugerencia usa únicamente número de trabajadores y clase de riesgo:

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
5. ejecutar pruebas unitarias, navegación pública y E2E de los tres perfiles.
