# Estrategia de calidad

## Pirámide

- Unitarias: esquemas Zod, permisos, claves de consulta, navegación segura, fórmulas y helpers puros.
- Integración: membresías, RLS/Data API, Storage, outbox, roles y restricciones entre tenants. `data-api-rls.test.ts` conserva factories efímeras para un entorno aislado configurado explícitamente; no se ejecuta contra Mizpa360 ni desde GitHub Actions.
- E2E: login, logout, onboarding reanudable, cambio de organización, CRUD de estructura, carga/descarga firmada/archivo de documento, asignación de rol por sede, flujo brecha → acción → evidencia → validación → cierre y denegación entre tenants. Playwright se usa localmente o con un entorno aislado autorizado; no crea datos en Mizpa360.

Las factories usan UUID por ejecución, prefijos `ci-rls-` y `e2e-`, y nunca datos reales. Se omiten si no existen variables explícitas de un entorno aislado. Nunca se ejecutan contra Mizpa360 ni contra producción.

Las pruebas de mejoramiento verifican que una acción manual solo se cree desde una brecha del tenant, que una versión documental de otra organización no pueda vincularse, que la validación requiera permiso y evidencia, y que el cierre manual de la brecha ocurra únicamente después de una acción validada.

## Accesibilidad

Los flujos críticos deben cubrir teclado completo, foco visible, etiquetas de formularios, mensajes de error anunciables, orden semántico y contraste WCAG 2.2 AA. Antes de liberar se prueba con NVDA/Chrome y VoiceOver/Safari en login, organización, onboarding, configuración y carga documental.

## Cobertura útil

Se exige cobertura de decisiones de seguridad y rutas de error, no un porcentaje global artificial. Un bloqueo de CI incluye fallo de RLS, redirect abierto, escalamiento de rol, pérdida de foco o control crítico sin nombre accesible.
