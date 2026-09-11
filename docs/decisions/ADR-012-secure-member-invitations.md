# ADR-012: Invitaciones privilegiadas en Edge Function

Estado: aceptado.

La invitación usa una Edge Function con JWT obligatorio. La clave privilegiada crea la identidad en Supabase Auth y nunca llega al navegador. La membresía y el rol se escriben con el token del actor mediante una función atómica y RLS.

El registro público está deshabilitado. Las cuentas nuevas se crean mediante invitación. La plantilla usa `TokenHash` y `type=invite`; `/auth/confirm` verifica el token en el servidor, establece la sesión en cookies y activa las membresías pendientes. Después, `/auth/activate` exige contraseña, nombres, primer apellido y teléfono antes de dirigir al administrador al onboarding. La función usa `APP_URL` como configuración server-side para construir únicamente redirecciones permitidas.

La recuperación de contraseña conserva su callback propio y no comparte la pantalla de activación. Las cuentas existentes no se reinvitan ni cambian sus credenciales: aceptan la nueva membresía en el siguiente inicio de sesión.
