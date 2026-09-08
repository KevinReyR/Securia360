# ADR-012: Invitaciones privilegiadas en Edge Function

Estado: aceptado.

La invitación usa una Edge Function con JWT obligatorio. La clave privilegiada crea la identidad en Supabase Auth y nunca llega al navegador. La membresía y el rol se escriben con el token del actor mediante una función atómica y RLS.

El registro público está deshabilitado. Las cuentas nuevas se crean mediante invitación y el enlace dirige a la definición de contraseña antes del primer inicio de sesión. La función usa `APP_URL` como configuración server-side para construir únicamente redirecciones permitidas.
