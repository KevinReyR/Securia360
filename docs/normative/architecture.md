# Arquitectura normativa versionada

Las fuentes normativas no se mezclan en una tabla `regulations`. `normative_sources` identifica la fuente y su tipo; `normative_source_versions` registra vigencia, estado, referencia oficial y supersesión; `requirements` solo se vincula a una versión específica.

Las cuatro referencias iniciales son estructurales y no reproducen texto extenso. Su contenido interpretativo está marcado como pendiente de revisión experta. Resolución 0312 conservará sus estándares en `minimum_standards`; GTC 45 conservará su lógica en `risk_methodologies`.

## Estándares mínimos

`minimum_standards` no es una extensión de `requirements`: registra criterios evaluables con ciclo PHVA y evidencia esperada. Los pesos son propiedad de `profile_standards`, enlazados a `standard_profile_versions`. Solo una versión publicada, con revisión humana y peso total exactamente 100, puede convertirse en un conjunto operativo.
