# Reglas de aplicabilidad

Las reglas son datos versionados en `applicability_rules`, no condicionales de TypeScript. Las condiciones admitidas inicialmente son `eq`, `gte` y `truthy` sobre clasificación y caracterización. Campos u operadores desconocidos dan `review_required`. Cada ejecución conserva el snapshot de entrada, regla y explicación en `organization_requirements`; nunca afirma validez jurídica automática.
