# Presupuesto de rendimiento

## Objetivos medibles

- Listas tenantizadas paginadas: p95 de consulta inferior a 300 ms con 10.000 filas por tenant.
- Cambio de organización: invalidar todas las claves TanStack Query que incluyan organizationId antes de consultar el siguiente tenant.
- Dashboard: máximo cinco consultas agregadas en paralelo, sin cargar tablas completas.
- Bundle de ruta protegida: medir con build de producción; no añadir dependencias de gráficos sin necesidad.

## Método

Usar EXPLAIN (ANALYZE, BUFFERS) solo sobre un entorno representativo y consultas parametrizadas. Registrar filas, plan, buffers y p95 antes/después. Añadir un índice únicamente cuando la consulta real lo requiera; el asesor de Supabase mantiene una lista de FKs potencialmente no indexadas que debe priorizarse por frecuencia de join y borrado.

## Caché y aislamiento

Las claves de consulta deben comenzar con tenantQueryKeys y organizationId. No se comparte caché de Server Components entre organizaciones ni se usa cache pública para datos autenticados.
