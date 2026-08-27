# Estrategia de calidad

## Pirámide

- Unitarias: esquemas Zod, permisos, claves de consulta, navegación segura, fórmulas y helpers puros.
- Integración: membresías, RLS/Data API, Storage, outbox, roles y restricciones entre tenants.
- E2E: login, onboarding, cambio de organización, evaluación, acción y logout.

Las factories usan UUID deterministas y nunca secretos. Las pruebas de Data API se habilitan en CI con cuentas efímeras mediante variables protegidas; se omiten localmente si esas variables no existen.

## Accesibilidad

Los flujos críticos deben cubrir teclado completo, foco visible, etiquetas de formularios, mensajes de error anunciables, orden semántico y contraste WCAG 2.2 AA. Antes de liberar se prueba con NVDA/Chrome y VoiceOver/Safari en login, organización, onboarding, configuración y carga documental.

## Cobertura útil

Se exige cobertura de decisiones de seguridad y rutas de error, no un porcentaje global artificial. Un bloqueo de CI incluye fallo de RLS, redirect abierto, escalamiento de rol, pérdida de foco o control crítico sin nombre accesible.
