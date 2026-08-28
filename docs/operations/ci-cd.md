# CI/CD y despliegue

## Gates de CI

Cada cambio ejecuta npm ci, typecheck, lint, pruebas, build, validación de nombres únicos de migración y escaneo de secretos. Las pruebas de integración contra Supabase usan cuentas efímeras y variables protegidas, nunca secretos de producción.

## Promoción

El repositorio no mantiene un entorno de staging. La validación previa a producción se realiza con el proyecto Supabase aislado `securia360-ci` y con la aplicación levantada temporalmente en el runner de GitHub Actions; no se crea un despliegue, preview ni URL pública para estas pruebas. Las migraciones son forward-only: un rollback de aplicación debe ser compatible con el esquema ya migrado; una corrección de datos o esquema se hace mediante una migración nueva.

## Integración Supabase protegida

El Environment de GitHub `supabase-integration` se ejecuta solo en `main` o manualmente, nunca en pull requests. Antes de la suite aplica migraciones forward-only al proyecto aislado `securia360-ci`, ejecuta pruebas reales de RLS, Data API y Storage y después arranca temporalmente la aplicación con variables públicas del proyecto de pruebas para ejecutar Playwright/Chromium. No hay staging ni despliegue remoto.

Sus secretos exclusivos son `SUPABASE_ACCESS_TOKEN`, `SUPABASE_TEST_PROJECT_REF`, `SUPABASE_TEST_DB_PASSWORD`, `SUPABASE_TEST_URL`, `SUPABASE_TEST_PUBLISHABLE_KEY` y `SUPABASE_TEST_SERVICE_ROLE_KEY`. El último se usa solo por Node para preparar y limpiar fixtures; ningún secreto debe tener prefijo `NEXT_PUBLIC_`, estar en Vercel ni registrarse en logs.

Los E2E cubren alta de cuenta (con confirmación de correo desactivada únicamente en el proyecto aislado), inicio/cierre de sesión, onboarding reanudable, cambio de organización, estructura empresarial, documentos privados, asignación de rol por sede y denegación entre tenants. Cada ejecución crea nombres, NIT, usuarios y rutas Storage con un UUID propio y elimina sus organizaciones, objetos y usuarios al finalizar. Las trazas, vídeo y capturas se adjuntan como artefacto únicamente si falla el job.

### Ejecución local aislada

Instala Chromium una vez con `npx playwright install chromium`. Luego define en la terminal únicamente las variables del proyecto aislado: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_TEST_URL`, `SUPABASE_TEST_PUBLISHABLE_KEY` y `SUPABASE_TEST_SERVICE_ROLE_KEY`; opcionalmente define `NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000`. Ejecuta `npm run test:e2e`. La clave service role queda en el proceso de pruebas Node: `playwright.config.ts` la elimina del proceso de Next y nunca se expone al navegador. Para inspeccionar localmente, usa `npm run test:e2e:ui`; después de un fallo, abre `apps/web/playwright-report/index.html`.

El proyecto remoto de pruebas debe tener la confirmación de correo desactivada y Storage privado. No se configura SMTP, dominios ni usuarios o documentos reales.

## Variables

Guardar URL/publishable key de Supabase, URL pública y claves de observabilidad por entorno. Nunca exponer service_role como variable NEXT_PUBLIC. Los secretos de webhook o proveedor permanecen solo en el runtime server-side.

## Producción

No se despliega ni se aplican migraciones de producción sin aprobación explícita. Antes de aprobar: CI verde, revisión de SQL/RLS, backup disponible, plan de rollback compatible y ventana de monitoreo posterior.
