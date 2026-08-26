# ADR-011: URL como contexto tenant canónico

Estado: aceptado.

El `organizationId` de la URL es el contexto canónico. La cookie activa solo selecciona el destino por defecto. Cada layout valida la organización mediante una consulta sujeta a RLS. Las claves de caché incluyen siempre el tenant y el selector limpia la caché antes de navegar.
