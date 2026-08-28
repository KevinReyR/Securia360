# Paquete de revisión humana

Ruta interna: `/internal/normative-review`.

El inventario incluye versiones de fuentes, requirements, estándares mínimos, perfiles y ponderaciones, reglas de aplicabilidad y scoring, metodologías, fórmulas e interpretaciones. También admite textos UI, supuestos y casos de prueba como contenido editorial.

## Flujo

1. Un revisor consulta el snapshot registrado.
2. Registra una decisión de revisión, aprobación o rechazo con fundamento.
3. Puede proponer contenido sucesor sin alterar el historial.
4. La aprobación de la propuesta crea un nuevo artefacto pendiente de revisión; no publica ni ejecuta cambios críticos.

Los datos son soporte de trabajo SST/jurídico. No sustituyen revisión profesional, no constituyen asesoría legal y no declaran cumplimiento automático.

## Acceso

Los administradores internos gestionan revisores usando cuentas de Auth que ya existan y tengan correo confirmado. El flujo normal de registro es el único mecanismo para crear una cuenta; el navegador nunca recibe una credencial privilegiada.
