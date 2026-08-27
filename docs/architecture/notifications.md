# Notificaciones

El consumidor privado usa evento, destinatario y canal como clave lógica; los reintentos no duplican bandeja ni cola. Las preferencias cubren canales, zona horaria y quiet hours.

Las plantillas aprobadas solo guardan título, resumen y enlace interno seguro. No se replica el payload del evento ni datos sensibles. El correo queda preparado en una cola privada con reintentos: esta etapa no configura proveedor ni envía mensajes.
