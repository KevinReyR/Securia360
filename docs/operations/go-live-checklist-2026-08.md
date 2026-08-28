# Checklist Go/No-Go — Securia360

Fecha de revisión: 2026-08-27  
Aplicación revisada: `https://securia360-web.vercel.app`  
Proyecto Supabase: `khnsudlcrpljlnvtynki`  
Decisión: **NO-GO**

La aplicación no debe abrirse a usuarios reales ni recibir datos reales todavía. No se realizaron despliegues, migraciones ni cambios de configuración remota durante esta revisión.

> Actualización operativa 2026-08-28: Mizpa360 es ahora el único proyecto remoto objetivo. Las migraciones se aplican solo desde Codex y siempre después de reconciliar la historia local/remota; no se ejecutan fixtures, E2E ni pruebas destructivas contra este proyecto.

## Resumen ejecutivo

| Área | Estado | Evidencia |
| --- | --- | --- |
| Repositorio y CI | No-Go | `main` apunta a `8db3c49`; CI de ese commit está verde, pero existen cambios funcionales locales sin confirmar y una caché sin seguimiento. |
| Migraciones | Go | 46 migraciones locales y 46 remotas, alineadas por nombre. Proyecto remoto `ACTIVE_HEALTHY`, PostgreSQL 17.6. |
| RLS y Data API | Go condicionado | 155 tablas públicas; 152 tienen RLS. Las tres restantes no conceden acceso a `anon` ni `authenticated`. No existen tablas accesibles sin RLS. |
| Storage | Go condicionado | Cero buckets públicos y siete políticas sobre `storage.objects`. Falta ejecutar prueba real de acceso cruzado y descarga firmada. |
| Auth | No-Go | El sitio fuerza login, pero Site URL, Redirect URLs, confirmación de correo, OTP, MFA organizacional y SMTP personalizado no pudieron verificarse con evidencia de configuración. `NEXT_PUBLIC_SITE_URL` tampoco está configurado en el entorno local inspeccionado. |
| Seguridad de aplicación | No-Go | El dominio tiene HSTS, pero no presenta CSP, `X-Content-Type-Options`, protección anti-framing, `Referrer-Policy` ni `Permissions-Policy`. La protección de contraseñas filtradas está desactivada. |
| Dependencias | No-Go | `npm audit --omit=dev` registra 10 vulnerabilidades altas y 9 moderadas, principalmente en la cadena Expo/Metro. La corrección disponible implica una actualización mayor y debe probarse. |
| Producto | No-Go | La auditoría de interfaz mantiene flujos P0 sin completar; varios dominios solo existen como tablas y no como flujos utilizables y probados. |
| Normativa | No-Go | No existe evidencia de aprobación humana integral de fuentes, reglas, perfiles, fórmulas y textos UI. No se puede declarar cumplimiento legal. |
| Privacidad/legal | No-Go | No se encontraron términos, política de privacidad, consentimiento versionado, política operativa de retención ni contacto formal de incidentes. |
| Pruebas | No-Go | Typecheck y lint pasan; 29 pruebas pasan y una prueba crítica Data API/RLS se omite por falta de credenciales. No hay E2E ni auditoría WCAG 2.2 AA ejecutada. |
| Build | Go condicionado | El build termina, pero emite cuatro advertencias por selectores CSS generados corruptos que deben investigarse en un build limpio. |
| Rendimiento | No-Go | No hay prueba de carga ni mediciones representativas. El asesor reporta 454 observaciones: 87 WARN y 367 INFO, por políticas permisivas múltiples, FKs sin índice e índices sin uso. |
| Observabilidad | No-Go | Existen runbooks, pero no se encontró instrumentación de errores, logging estructurado, métricas, alertas ni health check público. Hay tres eventos pendientes en outbox. |
| Backups/recuperación | No-Go | RPO 24 h y RTO 4 h están documentados, pero no hay evidencia de plan/retención contratada, PITR, backup verificable ni simulacro de restauración. |
| Soporte | No-Go | No hay contacto público de soporte/privacidad/incidentes, matriz de escalamiento ni ventana de atención definida. |
| Dominio | No-Go | Solo se verificó el subdominio de Vercel; no hay evidencia de dominio empresarial, DNS, remitente de correo y URLs de Auth coordinados. |

## Evidencia técnica positiva

- La página raíz devuelve 307 hacia login; `/auth/login` devuelve 200; el endpoint autenticado también redirige a login sin sesión.
- HSTS está activo con `max-age=63072000; includeSubDomains; preload`.
- El asesor de seguridad de Supabase no reporta hallazgos críticos o altos de base de datos.
- No hay buckets públicos, vistas públicas sin `security_invoker` ni funciones `SECURITY DEFINER` en `public`.
- La Edge Function `invite-member` está activa y exige JWT.
- No se detectó `service_role`, claves privadas ni cadenas de conexión con contraseña en archivos del repositorio revisados.
- Los logs consultados de API y Auth de las últimas 24 horas no mostraron respuestas 5xx en la muestra recuperada.
- Typecheck, lint, pruebas unitarias y build concluyen; GitHub Actions reporta éxito para el último commit remoto.

## Bloqueadores obligatorios

1. Confirmar y documentar en Supabase Site URL, Redirect URLs exactas, email confirmation, OTP, protección de contraseñas filtradas y SMTP con dominio confiable.
2. Resolver las vulnerabilidades altas de dependencias mediante actualización compatible y repetir auditoría, móvil, pruebas y build.
3. Añadir cabeceras CSP, anti-framing, MIME sniffing, referente y permisos; probar login, callback, Storage y recursos externos bajo la política final.
4. Ejecutar con dos usuarios reales las pruebas Data API/RLS/Storage para Organization A permitida y Organization B denegada, incluyendo membresía suspendida y scope por sede.
5. Completar los flujos P0 identificados en `docs/quality/interface-audit-2026-08.md` y ejecutar E2E de login, onboarding, cambio de tenant, evaluación, acción, documentos y logout.
6. Obtener revisión SST/jurídica humana versionada; aprobar o rechazar contenido, reglas, perfiles y fórmulas sin alterar históricos.
7. Publicar términos, privacidad, base/consentimiento aplicable, retención/eliminación, responsables y contactos de soporte e incidentes.
8. Configurar monitoreo de errores, logs estructurados sin PII, métricas, alertas, correlation IDs y un health check operativo. Procesar o justificar el outbox pendiente.
9. Confirmar backup, retención, PITR según RPO/RTO y ejecutar una restauración en entorno aislado con acta y resultados.
10. Resolver advertencias del asesor de rendimiento prioritarias, investigar el CSS generado y ejecutar carga en staging con presupuesto p95 documentado.
11. Cerrar y revisar los cambios locales, obtener CI verde del commit candidato y comprobar que el deployment de Vercel corresponde exactamente a ese SHA.
12. Definir dominio final, DNS, TLS, URL canónica, SMTP/remitente y configuración por entorno; previews nunca deben usar datos de producción.

## Criterio para cambiar a Go

La decisión puede cambiar a **Go** únicamente cuando los doce bloqueadores tengan responsable, evidencia fechada y resultado satisfactorio; no existan vulnerabilidades altas abiertas; las pruebas de aislamiento y E2E hayan sido ejecutadas sin omisiones; y exista aprobación explícita para desplegar. La aprobación técnica no equivale a una declaración de cumplimiento legal.

## Referencias operativas

- Checklist oficial de producción de Supabase: https://supabase.com/docs/guides/deployment/going-into-prod
- Contraseñas filtradas: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
- Asesor de FKs sin índice: https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys
- Políticas RLS permisivas múltiples: https://supabase.com/docs/guides/database/database-linter?lint=0006_multiple_permissive_policies
