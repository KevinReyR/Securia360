# CI/CD y despliegue

## Gates de CI

Cada cambio ejecuta npm ci, typecheck, lint, pruebas, build, validación de nombres únicos de migración y escaneo de secretos. Las pruebas de integración contra Supabase usan cuentas efímeras y variables protegidas, nunca secretos de producción.

## Promoción

Desarrollo → staging → producción. Los previews usan proyecto Supabase/variables de staging sin datos productivos. Las migraciones son forward-only: un rollback de aplicación debe ser compatible con el esquema ya migrado; una corrección de datos o esquema se hace mediante una migración nueva.

## Integración Supabase protegida

El Environment de GitHub `supabase-integration` se ejecuta solo en `main` o manualmente, nunca en pull requests. Antes de la suite aplica migraciones forward-only al proyecto aislado `securia360-ci` y después ejecuta pruebas reales de RLS, Data API y Storage con fixtures efímeras.

Sus secretos exclusivos son `SUPABASE_ACCESS_TOKEN`, `SUPABASE_TEST_PROJECT_REF`, `SUPABASE_TEST_DB_PASSWORD`, `SUPABASE_TEST_URL`, `SUPABASE_TEST_PUBLISHABLE_KEY` y `SUPABASE_TEST_SERVICE_ROLE_KEY`. El último se usa solo por Node para preparar y limpiar fixtures; ningún secreto debe tener prefijo `NEXT_PUBLIC_`, estar en Vercel ni registrarse en logs.

## Variables

Guardar URL/publishable key de Supabase, URL pública y claves de observabilidad por entorno. Nunca exponer service_role como variable NEXT_PUBLIC. Los secretos de webhook o proveedor permanecen solo en el runtime server-side.

## Producción

No se despliega ni se aplican migraciones de producción sin aprobación explícita. Antes de aprobar: CI verde, revisión de SQL/RLS, backup disponible, plan de rollback compatible y ventana de monitoreo posterior.
