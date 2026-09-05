# Inventario de estándares mínimos 0312

## Alcance

La migración `20260905130138_load_0312_standard_inventory.sql` incorpora un inventario funcional de 60 estándares y tres perfiles de aplicabilidad. El contenido se mantiene en `draft/pending` hasta que una persona autorizada registre la revisión y aprobación correspondiente.

El inventario no constituye por sí solo una declaración de cumplimiento ni sustituye la interpretación SST o jurídica aplicable a cada organización.

## Procedencia

- Archivo: `inventario_estandares_resolucion_0312_con_perfiles.xlsx`.
- SHA-256: `F3700F103B53D03EAB076B185084B5DF0F2D5FFEA463FAD5F25C1BCEBC153C57`.
- Fuente relacionada: Resolución 0312 de 2019, versión normativa `2019`.
- Estado inicial: `draft`.
- Revisión experta inicial: `pending`.

## Estructura cargada

| Perfil | Versión | Estándares | Peso total |
| --- | --- | ---: | ---: |
| `RES0312_P07` | `1.0.0` | 7 | 100.00% |
| `RES0312_P21` | `1.0.0` | 21 | 100.00% |
| `RES0312_P60` | `1.0.0` | 60 | 100.00% |

Los ciclos del archivo se normalizan a los valores internos `PLAN`, `DO`, `CHECK` y `ACT`. Los códigos externos con guion se conservan en la descripción del perfil y se normalizan con guion bajo en la clave técnica.

## Revisión y publicación

Cada estándar, asociación, versión de perfil y regla de scoring se registra como artefacto revisable. Una aprobación actualiza el registro operativo dentro de la misma transacción.

Una versión de perfil solo pasa a `published` cuando su artefacto, todas sus asociaciones y todos sus estándares están aprobados, los estándares están activos y revisados, y la suma de pesos es exactamente 100%.

Las reglas de scoring iniciales son borradores técnicos. No pueden utilizarse para completar una evaluación hasta quedar `approved/reviewed` por una persona autorizada.

## Verificación técnica

La prueba transaccional `supabase/tests/0312_review_publication.sql` comprueba que una aprobación parcial no publica un perfil, que la aprobación completa sí lo publica y que la regla de scoring sincroniza su estado operativo. La prueba revierte todas sus decisiones al finalizar.
