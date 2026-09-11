# Acceso privado y aprovisionamiento de empresas

Securia360 no ofrece registro público. El ciclo comercial y de acceso es:

1. La persona interesada contacta a Reinova Labs por WhatsApp.
2. Un `saas_admin` crea la empresa cliente, selecciona una versión de plan publicada e indica el correo de su administrador operativo.
3. La función de aprovisionamiento crea la organización, su suscripción y una membresía `organization_admin` en estado `invited` dentro de una sola operación de base de datos.
4. Si el correo aún no corresponde a una cuenta, Supabase envía una invitación de un solo uso. Con plantilla personalizada, `/auth/confirm` espera una confirmación humana antes de validar el token para evitar que un escáner de correo lo consuma. Con la plantilla predeterminada alojada, `/auth/activate` convierte la sesión implícita recibida en el fragmento de la URL a cookies SSR. Ambos caminos terminan en el formulario para crear la contraseña y registrar nombres, apellidos y teléfono antes del onboarding empresarial. Si la cuenta ya existe, conserva su contraseña y perfil y acepta la nueva membresía al iniciar sesión.
5. El administrador de la empresa invita después a sus propios miembros mediante el flujo normal de Miembros. Su identidad queda registrada como actor de auditoría.

El correo transaccional siempre se entrega desde Securia360. La dirección del administrador de empresa define quién gestiona los accesos, pero no cambia el remitente SMTP.

## Configuración alojada obligatoria

Antes de habilitar el flujo en producción, un operador con acceso al proyecto Supabase debe:

- Desactivar **Allow new users to sign up** en la configuración general de Authentication y mantener habilitado el proveedor Email para que los usuarios invitados puedan iniciar sesión y recuperar su contraseña.
- Establecer `https://securia360-web.vercel.app` como Site URL y permitir `https://securia360-web.vercel.app/auth/callback**`, `https://securia360-web.vercel.app/auth/confirm**` y `https://securia360-web.vercel.app/auth/activate**`. El sufijo cubre únicamente sus parámetros de consulta; no usar un comodín para todo el dominio en producción.
- Configurar el secreto de Edge Function `APP_URL` con `https://securia360-web.vercel.app`.
- Desplegar las funciones `invite-member` y `provision-saas-customer` junto con la migración versionada.
- Cuando el plan y el proveedor de correo permitan plantillas personalizadas, copiar `supabase/templates/invite.html` en **Authentication → Email Templates → Invite user**. Debe conservar `TokenHash`, `type=invite`, `SiteURL` y `RedirectTo`.
- En proyectos gratuitos con el proveedor de correo predeterminado, Supabase no permite modificar la plantilla. En ese caso se conserva `ConfirmationURL`, se mantienen permitidas las rutas exactas de activación y el puente de sesión de `/auth/activate` completa de forma controlada el flujo implícito.

La configuración local equivalente está en `supabase/config.toml`. El cambio alojado no se realiza mediante una migración porque pertenece a la configuración de Auth.

## Enlaces vencidos y correcciones

Una invitación vencida, reutilizada o manipulada muestra un error específico y no concede acceso. El administrador de la empresa puede reinvitar al miembro; si la cuenta ya existe, también puede usar el flujo independiente de recuperación de contraseña. Un código comercial duplicado, una versión de plan no publicada o un correo inválido se rechazan antes de crear la empresa.

La suspensión, vencimiento o cancelación comercial no elimina información ni modifica membresías, permisos RBAC o políticas RLS.
