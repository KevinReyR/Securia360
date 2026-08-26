# ADR-003: Multi-tenancy por organización

Estado: aceptado.

`organizations` representa el tenant. Los usuarios se relacionan mediante `organization_members`; `profiles` no contiene `organization_id`. Cada entidad empresarial conserva una FK real al tenant.
