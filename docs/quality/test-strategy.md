# Estrategia de calidad

## Pirámide

- Unitarias: esquemas Zod, permisos, claves de consulta, navegación segura, fórmulas y helpers puros.
- Integración: membresías, RLS/Data API, Storage, outbox, roles y restricciones entre tenants. `data-api-rls.test.ts` crea usuarios, organizaciones, sedes y archivos con un UUID único en el proyecto aislado `securia360-ci`; usa el cliente administrativo solo dentro de Node para setup/limpieza y ejecuta las aserciones con sesiones reales y clave publicable.
- E2E: signup sin confirmación por correo en el proyecto aislado, login, logout, onboarding reanudable, cambio de organización, CRUD de estructura, carga/descarga firmada/archivo de documento, asignación de rol con alcance por sede, flujo brecha → acción → evidencia → validación → cierre y denegación de ruta entre tenants. Playwright levanta la web de forma temporal en el runner; no se usa staging ni se realiza despliegue.

Las factories usan UUID por ejecución, prefijos `ci-rls-` y `e2e-`, y nunca datos reales. Las pruebas de Data API y E2E se habilitan en CI con cuentas efímeras mediante variables protegidas; se omiten localmente si esas variables no existen. El `afterAll` elimina objetos Storage, tenants y usuarios; si un job es interrumpido, se busca exclusivamente esos prefijos en el proyecto de pruebas y se elimina ese conjunto. Nunca se ejecutan contra producción.

Las pruebas de mejoramiento verifican que una acción manual solo se cree desde una brecha del tenant, que una versión documental de otra organización no pueda vincularse, que la validación requiera permiso y evidencia, y que el cierre manual de la brecha ocurra únicamente después de una acción validada.

## Accesibilidad

Los flujos críticos deben cubrir teclado completo, foco visible, etiquetas de formularios, mensajes de error anunciables, orden semántico y contraste WCAG 2.2 AA. Antes de liberar se prueba con NVDA/Chrome y VoiceOver/Safari en login, organización, onboarding, configuración y carga documental.

## Cobertura útil

Se exige cobertura de decisiones de seguridad y rutas de error, no un porcentaje global artificial. Un bloqueo de CI incluye fallo de RLS, redirect abierto, escalamiento de rol, pérdida de foco o control crítico sin nombre accesible.
