# ADR-004: Aislamiento con PostgreSQL RLS

Estado: aceptado.

RLS es la autoridad de acceso. Las políticas resuelven `auth.uid()` hacia membresías activas y permisos. Los filtros del frontend mejoran intención y rendimiento, pero nunca reemplazan RLS.
