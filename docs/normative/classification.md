# Clasificación normativa temporal

La clasificación se conserva en `organization_classifications` como historial de datos fuente y perfil. Solo una fila puede estar vigente por organización y alcance. Las propuestas comparan estado actual y propuesto; `private.approve_classification_change` cierra la vigente, crea la nueva y publica `classification.changed` en una sola transacción. El evaluador inicial exige revisión humana y no toma decisiones jurídicas automáticas.
