# Estrategia de calidad

## Pirámide

- Unitarias: esquemas Zod, permisos, claves de consulta, navegación segura, fórmulas y helpers puros.
- Integración: membresías, RLS/Data API, Storage, outbox, roles y restricciones entre tenants. `data-api-rls.test.ts` crea usuarios, organizaciones, sedes y archivos con un UUID único en el proyecto aislado `securia360-ci`; usa el cliente administrativo solo dentro de Node para setup/limpieza y ejecuta las aserciones con sesiones reales y clave publicable.
- E2E: login, onboarding, cambio de organización, evaluación, acción y logout.

Las factories usan UUID deterministas y nunca secretos. Las pruebas de Data API se habilitan en CI con cuentas efímeras mediante variables protegidas; se omiten localmente si esas variables no existen. El `afterAll` elimina objetos Storage, tenants y usuarios; si un job es interrumpido, se busca el prefijo `ci-rls-` en el proyecto de pruebas y se elimina exclusivamente ese conjunto. Nunca se ejecutan contra producción.

## Accesibilidad

Los flujos críticos deben cubrir teclado completo, foco visible, etiquetas de formularios, mensajes de error anunciables, orden semántico y contraste WCAG 2.2 AA. Antes de liberar se prueba con NVDA/Chrome y VoiceOver/Safari en login, organización, onboarding, configuración y carga documental.

## Cobertura útil

Se exige cobertura de decisiones de seguridad y rutas de error, no un porcentaje global artificial. Un bloqueo de CI incluye fallo de RLS, redirect abierto, escalamiento de rol, pérdida de foco o control crítico sin nombre accesible.
