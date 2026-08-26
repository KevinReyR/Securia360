# ADR-002: Supabase como backend

Estado: aceptado.

PostgreSQL, Auth, Storage y Edge Functions de Supabase forman el backend. PostgreSQL es la fuente única de verdad. El CRUD ordinario usa Data API y RLS; las Edge Functions se reservan para operaciones privilegiadas.
