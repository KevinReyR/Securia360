# Portal de contratistas

Los contactos se registran mediante el flujo normal de Securia360. Un aprobador interno los vincula por correo con la función `provision-contractor-portal`, que solo usa credenciales administrativas dentro de la función; nunca se exponen al navegador.

El portal `/contractor-portal` no usa membresías de organización. Solo muestra contratos, sedes aprobadas, requisitos y envíos del contacto autenticado. Los documentos se almacenan de forma privada bajo `organization_id/contract_document_requirement/requirement_id/document_id/archivo` y las políticas RLS limitan lectura y carga al contrato activo.

El contacto no puede consultar trabajadores internos, otros contactos, otros contratos, evaluaciones ni aprobar documentos. Las aprobaciones, activaciones de contrato y accesos por sede requieren `contractors.approve`; cada cambio queda auditado. Este flujo no declara cumplimiento legal automático.
