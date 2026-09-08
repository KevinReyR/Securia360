# Acceso privado y aprovisionamiento de empresas

Securia360 no ofrece registro público. El ciclo comercial y de acceso es:

1. La persona interesada contacta a Reinova Labs por WhatsApp.
2. Un `saas_admin` crea la empresa cliente, selecciona una versión de plan publicada e indica el correo de su administrador operativo.
3. La función de aprovisionamiento crea la organización, su suscripción y una membresía `organization_admin` en estado `invited` dentro de una sola operación de base de datos.
4. Si el correo aún no corresponde a una cuenta, Supabase envía una invitación para definir la contraseña. Si ya existe, la persona acepta la nueva membresía al iniciar sesión.
5. El administrador de la empresa invita después a sus propios miembros mediante el flujo normal de Miembros. Su identidad queda registrada como actor de auditoría.

El correo transaccional siempre se entrega desde Securia360. La dirección del administrador de empresa define quién gestiona los accesos, pero no cambia el remitente SMTP.

## Configuración alojada obligatoria

Antes de habilitar el flujo en producción, un operador con acceso al proyecto Supabase debe:

- Desactivar **Enable Email Signups** en Authentication → Providers → Email.
- Establecer la URL del sitio y permitir `https://securia360-web.vercel.app/auth/callback` como URL de redirección.
- Configurar el secreto de Edge Function `APP_URL` con `https://securia360-web.vercel.app`.
- Desplegar las funciones `invite-member` y `provision-saas-customer` junto con la migración versionada.

La configuración local equivalente está en `supabase/config.toml`. El cambio alojado no se realiza mediante una migración porque pertenece a la configuración de Auth.

## Enlaces vencidos y correcciones

Una invitación vencida no concede acceso. El administrador de la empresa puede reinvitar al miembro; si la cuenta ya existe, también puede usar el flujo de recuperación de contraseña. Un código comercial duplicado, una versión de plan no publicada o un correo inválido se rechazan antes de crear la empresa.

La suspensión, vencimiento o cancelación comercial no elimina información ni modifica membresías, permisos RBAC o políticas RLS.
