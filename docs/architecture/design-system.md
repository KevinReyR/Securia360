# Design system y app shell

Securia360 usa Tailwind CSS 4 con componentes de estilo shadcn/ui construidos sobre primitivas Radix cuando se necesita comportamiento accesible. La identidad visual busca calma, confianza y densidad moderada para un SaaS B2B gerencial.

## Tokens

Los tokens viven en `apps/web/src/app/globals.css`. Se usan variables semánticas para superficies, texto, bordes, marca, foco y estados `success`, `info`, `warning` y `danger`. Los componentes no deben introducir colores aislados cuando ya exista un token equivalente.

## Catálogo base

- Formularios: `Button`, `Input`, `Textarea`, `Select`, `Combobox`, `Checkbox`, `RadioGroup` y `Switch`.
- Información: `Badge`, `StatusBadge`, `Card`, `KpiCard`, `Alert`, `DataTable`, `EmptyState` y `LoadingSkeleton`.
- Navegación: `Tabs`, `Breadcrumb`, `DropdownMenu`, `Command`, `CommandPalette` y `PageHeader`.
- Overlays: `Dialog`, `Drawer`, `Popover` y `Tooltip`.
- Identidad: `Avatar`.

Los componentes viven en `apps/web/src/components/ui`; `PageHeader` y `EmptyState` permanecen en `components` porque combinan varias primitivas y expresan patrones de página.

## App shell

El shell privado incluye:

- sidebar permanente en escritorio y drawer modal en pantallas pequeñas;
- módulos disponibles y futuros marcados como `Próximamente`;
- breadcrumbs derivados de la ruta canónica del tenant;
- selector de organización que conserva la limpieza de caché existente;
- buscador de navegación con `Ctrl/Cmd + K`;
- placeholders de notificaciones;
- avatar y menú de perfil;
- enlace de salto al contenido.

## Accesibilidad

- Radix administra foco, Escape y navegación por teclado en overlays y menús.
- Todos los controles tienen estados `focus-visible` con contraste perceptible.
- Los objetivos interactivos principales tienen una altura mínima de 40 px.
- Los módulos no disponibles no son enlaces ni entran en el orden de tabulación.
- `prefers-reduced-motion` elimina desplazamientos y reduce las transiciones a feedback prácticamente instantáneo.
- `prefers-reduced-transparency` vuelve sólido el header y `prefers-contrast` refuerza bordes y texto secundario.

## Convenciones

Reutilizar primitivas antes de crear variantes locales. Los módulos futuros pueden aparecer en navegación y búsqueda solo como información; no deben exponer rutas vacías ni lógica de negocio antes de su etapa correspondiente.
