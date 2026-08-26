# Aislamiento multiempresa

La organización es el tenant principal. La autoridad de acceso se deriva siempre de `auth.uid()` y `organization_members`; el frontend no es una fuente de autorización.

## Patrón RLS

- Lectura empresarial: membresía activa en la organización.
- Escritura: membresía activa más permiso RBAC requerido.
- `UPDATE`: políticas con `USING` y `WITH CHECK`.
- Asignaciones con alcance de sede: `member_roles.site_id` opcional.
- Funciones auxiliares: esquema `private`, `search_path` vacío y referencias totalmente calificadas.
- `raw_user_meta_data` se usa solamente para completar nombres del perfil, nunca para autorización.

## Superficie del Data API

`authenticated` recibe solo las operaciones necesarias por tabla. `anon` no recibe privilegios sobre las tablas empresariales. El bucket `avatars` es privado y cada objeto debe estar bajo una carpeta cuyo primer segmento sea el UUID del usuario autenticado.

## Prueba crítica

La suite `src/tests/data-api-rls.test.ts` inicia sesión con dos usuarios mediante la clave publicable y consulta PostgREST real. Comprueba A/Org A y B/Org B, lecturas cruzadas vacías, una escritura cruzada rechazada y `can()` verdadero solo dentro del tenant autorizado. También valida que un usuario ya existente puede recibir y aceptar una segunda membresía antes de acceder a esa organización.

## Tenant activo

La ruta `/org/[organizationId]` es canónica. La cookie activa no autoriza. El cambio de tenant limpia TanStack Query y todas las claves de caché incluyen `organizationId`.

## Privilegios

Las migraciones revocan por defecto todos los privilegios de futuros objetos creados por `postgres`. Cada tabla o RPC expuesto debe recibir grants mínimos explícitos y RLS cuando corresponda.

La migración `verify_core_tenant_isolation` crea fixtures temporales con integridad controlada, evalúa las políticas como dos identidades autenticadas y falla el despliegue si:

- User A no ve exactamente Organization A;
- User A puede ver Organization B; o
- User B sin membresía puede ver alguna organización.

Los fixtures se eliminan dentro de la misma transacción.
