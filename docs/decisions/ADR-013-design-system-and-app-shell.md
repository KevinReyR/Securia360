# ADR-013: Design system y app shell compartidos

## Decisión

Mantener un catálogo local de componentes estilo shadcn/ui sobre Tailwind y Radix, con tokens semánticos y un único app shell responsive para todas las rutas `/org/[organizationId]`.

## Consecuencia

Los módulos futuros reutilizan comportamiento, accesibilidad y contexto visual sin introducir shells paralelos. Los componentes permanecen dentro de la aplicación web hasta que exista una segunda aplicación que justifique extraer `packages/ui`.
