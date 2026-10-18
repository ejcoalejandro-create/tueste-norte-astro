# Tueste Norte — web pública (Astro + Tailwind)

Web estática de **Tueste Norte**, tostadero de café de especialidad con tienda física y catas mensuales.
Incluye portada, quiénes somos, catálogo de cafés, contacto y un blog de recetas y métodos de preparación.
Este repositorio contiene también los ejercicios de la semana 4 (componente `Badge`, página `quienes-somos` y colección `avisos`).

Hecha con **Astro 7** y **Tailwind CSS 4**.

## Requisitos

- Node.js **22.12 o superior**, en versión par (22 o 24). Comprobar con `node -v`.

## Comandos

```bash
npm install        # instala las dependencias (node_modules no se sube a git)
npm run dev        # servidor de desarrollo en http://localhost:4321
npm run build      # genera la web final en dist/
npm run preview    # sirve dist/ en local para comprobar el resultado del build
```

## Páginas

| Ruta | Archivo | Contenido |
|---|---|---|
| `/` | `src/pages/index.astro` | Portada: presentación, cafés, cata mensual y últimos artículos |
| `/quienes-somos` | `src/pages/quienes-somos.astro` | Historia del tostadero y tres valores en rejilla |
| `/catalogo` | `src/pages/catalogo.astro` | Los cuatro cafés de origen |
| `/contacto` | `src/pages/contacto.astro` | Datos de la tienda y horario |
| `/blog` | `src/pages/blog/index.astro` | Listado de artículos, del más reciente al más antiguo |
| `/blog/<slug>` | `src/pages/blog/[slug].astro` | Detalle de cada artículo (ruta dinámica) |
| `/avisos` | `src/pages/avisos.astro` | Avisos de la tienda (ejercicio 3) |
| `/pruebas` | `src/pages/pruebas.astro` | Prueba del componente `Badge` (ejercicio 1) |

## Estructura

```
src/
├── components/   Header, Footer, CafeCard, Badge, PostCard, AvisoCard
├── layouts/      BaseLayout (head, Header, <slot />, Footer)
├── data/         cafes.ts (datos del catálogo)
├── content/
│   ├── blog/     artículos en Markdown
│   └── avisos/   avisos en Markdown
├── pages/        una ruta por archivo
├── styles/       global.css (importa Tailwind y el plugin de tipografía)
└── content.config.ts   colecciones `blog` y `avisos` con su esquema
```

## Decisiones

### Los datos de los cafés están en `src/data/cafes.ts`

Los cuatro cafés (Amanecer, Tierra Alta, Fondo de Casa y Ceniza Volcánica) viven en un array tipado de TypeScript,
y el catálogo y la portada los pintan iterando con `cafes.map(...)` y el componente `CafeCard`, sin copiar HTML.

Elegí un `.ts` en lugar de un JSON por tres motivos:

- **Tipado compartido:** la interfaz `Cafe` es la misma que usa `CafeCard` como `Props`. Si falta un campo, el editor lo marca antes del build.
- **Valores cerrados:** el tueste solo admite `'claro' | 'medio' | 'oscuro'`, igual que el desplegable de ACF en WordPress.
- **Coherencia con WordPress:** son los mismos datos que se cargaron en la web de las semanas 2 y 3.

Cuando el cliente pida gestionar el contenido, el array se podrá sustituir por una llamada a la API sin cambiar la forma de los datos (`Cafe`) ni el componente.

### Contenido estático, sin API de WordPress

Esta semana el contenido son archivos locales. El cliente no ha pedido todavía editarlo, y la conexión con WordPress es un encargo posterior.

### Por qué esta web aguanta un pico de visitas

Astro genera todo el HTML durante `npm run build`. En producción solo se entregan archivos ya hechos:

- No se ejecuta PHP ni código de servidor en cada visita.
- No hay base de datos que consultar, así que no hay nada que se sature.
- El trabajo por visita es mínimo y no crece con el número de visitantes.
- Los archivos estáticos se pueden servir desde una CDN, cerca de cada usuario.
- No se envía JavaScript propio: el menú móvil usa `<details>`, un elemento nativo de HTML.

Es lo contrario de la versión en WordPress, donde cada visita ejecuta PHP y consulta la base de datos.

### Responsive y mobile first

Las clases sin prefijo aplican a móvil, y los prefijos (`md:`) las cambian en pantallas más grandes.
El catálogo pasa de una columna en móvil a dos a partir de 768 px (`grid-cols-1 md:grid-cols-2`).
El menú del `Header` es una fila en escritorio y un desplegable con `<details>` en móvil.

### Blog con content collections

La colección `blog` valida cada artículo con un esquema (zod): título, descripción y fecha obligatorios, autor con valor por defecto y un campo `draft` para ocultar borradores.
Si un artículo no cumple el esquema, el build falla con un mensaje que indica el archivo y el campo.
Añadir un artículo es crear un `.md` en `src/content/blog/`: el listado y la página de detalle se generan solos en el siguiente build.

`[slug].astro` usa `getStaticPaths()` para decir en el build qué páginas existen (una por artículo), porque en un sitio estático no se pueden resolver rutas en tiempo de visita.

### Estilos

Tailwind CSS 4 se instala como plugin de Vite en `astro.config.mjs`; no existe `tailwind.config.js`.
Los artículos usan `@tailwindcss/typography` (clase `prose`), cargado desde `global.css`, porque Tailwind elimina los estilos por defecto de títulos, listas y enlaces del HTML que genera el Markdown.

## Ejercicios de la semana

| Ejercicio | Dónde | Qué es |
|---|---|---|
| 1 | `src/components/Badge.astro`, `src/pages/pruebas.astro` | Componente con props (`texto`, `tono`) y un mapa de tono a clases de Tailwind |
| 2 | `src/layouts/BaseLayout.astro`, `src/pages/quienes-somos.astro` | Layout con `<slot />` y página con rejilla responsive de tres tarjetas |
| 3 | `src/content.config.ts`, `src/content/avisos/`, `src/pages/avisos.astro` | Colección con esquema; incluye el error de esquema provocado a propósito, documentado en un comentario de `avisos.astro` |

## Notas

- `node_modules/` y `dist/` no se versionan (los excluye el `.gitignore` generado por Astro).
- Los datos de contacto (dirección, teléfono y email) y los horarios son ficticios y habrá que sustituirlos por los reales.
- Si se modifica `src/content.config.ts` con el servidor en marcha, hay que reiniciarlo (y borrar la carpeta `.astro` si las colecciones no se actualizan).