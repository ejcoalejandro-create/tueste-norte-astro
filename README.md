# Tueste Norte — Astro

Web estática de Tueste Norte (tostadero de café de especialidad), hecha con
**Astro** y **Tailwind CSS 4**. Incluye los ejercicios de la semana 4.

## Requisitos

- Node.js 22.12 o superior, en versión par (22 o 24). Comprobar con `node -v`.

## Cómo arrancar el proyecto

```bash
npm install        # instala las dependencias (node_modules no se sube a git)
npm run dev        # servidor de desarrollo en http://localhost:4321
npm run build      # genera la web final en dist/
npm run preview    # sirve dist/ en local para comprobar el build
```

## Qué hay en cada ejercicio

| Ejercicio | Dónde | Qué es |
|---|---|---|
| 1 | `src/components/Badge.astro`, `src/pages/pruebas.astro` | Componente con props (`texto`, `tono`) y página de pruebas |
| 2 | `src/layouts/BaseLayout.astro`, `src/pages/quienes-somos.astro` | Layout con slot y página con rejilla responsive de Tailwind |
| 3 | `src/content.config.ts`, `src/content/avisos/`, `src/pages/avisos.astro` | Colección de contenido `avisos` con esquema validado |

## Estructura

```
src/
├── components/   Badge, Header, Footer, AvisoCard
├── layouts/      BaseLayout
├── content/      avisos/ (Markdown)
├── pages/        rutas de la web (una por archivo)
└── styles/       global.css (importa Tailwind)
```

## Notas

- Tailwind 4 se instala como plugin de Vite en `astro.config.mjs`; no existe `tailwind.config.js`.
- El esquema de `avisos` se define con zod, importado de `astro/zod`.