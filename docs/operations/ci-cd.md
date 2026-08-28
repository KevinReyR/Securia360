# CI/CD y despliegue

## Gates de CI

Cada cambio ejecuta `npm ci`, typecheck, lint, pruebas unitarias, build, validación de nombres únicos de migración y escaneo de secretos. El CI no recibe secretos de Supabase ni aplica migraciones remotas.

## Proyecto remoto y migraciones

Mizpa360 (`khnsudlcrpljlnvtynki`) es el único proyecto remoto objetivo. No se usa staging ni un proyecto remoto de integración desde este repositorio.

Las migraciones se aplican exclusivamente desde Codex cuando el usuario lo solicita. Nunca se aplican por un push a `main`, una pull request ni un despliegue de aplicación.

Antes de una aplicación directa: verificar el vínculo, comparar `supabase migration list --linked`, detenerse ante drift, confirmar backup/PITR y estado saludable, ejecutar únicamente pendientes con `supabase db push`, y verificar RLS/grants y asesores. Cualquier corrección posterior es una migración forward-only nueva.

No se usa `service_role` en navegador ni se ejecutan fixtures, E2E o pruebas destructivas contra Mizpa360.

## Variables

Guardar URL/publishable key de Supabase, URL pública y claves de observabilidad por entorno. Nunca exponer service_role como variable NEXT_PUBLIC. Los secretos de webhook o proveedor permanecen solo en el runtime server-side.

## Producción

No se despliega ni se aplican migraciones de producción sin aprobación explícita. Antes de aprobar: CI verde, revisión de SQL/RLS, backup disponible, plan de rollback compatible y ventana de monitoreo posterior.
