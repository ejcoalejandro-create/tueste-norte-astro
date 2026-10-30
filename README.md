# Tueste Norte — web pública (Astro + Tailwind + WordPress)

Web de **Tueste Norte**, tostadero de café de especialidad con tienda física y catas mensuales.
Incluye portada, quiénes somos, catálogo de cafés, contacto, avisos y un blog de recetas y métodos de preparación.

Los **cafés** y las **entradas del blog** se leen de la API REST del WordPress de la tienda: Marta los publica
allí y aparecen en esta web sin tocar código. El resto de páginas son fijas.

Hecha con **Astro 7**, **Tailwind CSS 4** y el adaptador de **Node** (renderizado híbrido).

## Requisitos

- Node.js **22.12 o superior**, en versión par (22 o 24). Comprobar con `node -v`.
- **El WordPress local encendido** (XAMPP con Apache y MySQL), con el plugin de cafés activo, varios cafés
  publicados (con campos ACF e imagen destacada) y entradas normales publicadas (con imagen destacada).
  Sin WordPress, `npm run build` falla, porque las páginas piden los datos a su API.

## Cómo arrancar el proyecto

```bash
cp .env.example .env     # en Windows (PowerShell): copy .env.example .env
npm install              # instala las dependencias (node_modules no se sube a git)
npm run dev              # servidor de desarrollo en http://localhost:4321
npm run build            # construye la web en dist/ (necesita WordPress encendido)
node --env-file=.env ./dist/server/entry.mjs   # sirve la web construida
```

### Configuración del `.env`

El archivo `.env` va en la **raíz** del proyecto (junto a `package.json`) y no se sube a Git. Contiene:

```dotenv
WP_API_URL=http://localhost/tueste-norte-wp/wp-json
```

- Es la base de la API de WordPress: **sin** `/wp/v2/...` y **sin** barra final. El código añade el resto de la ruta.
- Astro lee el `.env` solo al arrancar: si lo cambias, reinicia el servidor.
- El servidor de producción (`node ./dist/server/entry.mjs`) no lee el `.env` por sí solo: por eso se arranca con `--env-file=.env`.
- `.env.example` es la plantilla pública que sí está en el repositorio.

## Páginas

| Ruta | Archivo | Origen del contenido | Renderizado |
|---|---|---|---|
| `/` | `src/pages/index.astro` | Cafés y artículos de WordPress | Servidor (por visita) |
| `/cafes` | `src/pages/cafes/index.astro` | Cafés de WordPress | Servidor |
| `/cafes/<slug>` | `src/pages/cafes/[slug].astro` | Un café de WordPress | Servidor |
| `/blog` | `src/pages/blog/index.astro` | Entradas de WordPress | Servidor |
| `/blog/<slug>` | `src/pages/blog/[slug].astro` | Una entrada de WordPress | Servidor |
| `/quienes-somos` | `src/pages/quienes-somos.astro` | Texto fijo | Estática (build) |
| `/contacto` | `src/pages/contacto.astro` | Texto fijo | Estática (build) |
| `/avisos` | `src/pages/avisos.astro` | Colección local `avisos` (Markdown) | Estática (build) |
| `/pruebas` | `src/pages/pruebas.astro` | Prueba del componente `Badge` (ejercicio 1 de la semana 4) | Estática (build) |
| `/404` | `src/pages/404.astro` | Texto fijo | Estática (build) |
| `/catalogo` | Redirección en `astro.config.mjs` | Lleva a `/cafes` para no romper enlaces antiguos | — |
| `/ejercicios/*` | `src/pages/ejercicios/` | Ejercicios de calentamiento de la semana 5 | Ver abajo |

## Estructura

```
src/
├── lib/
│   └── wp.ts            Acceso a la API de WordPress: tipos y funciones
├── components/          Header, Footer, CafeCard, PostCard, Badge, AvisoCard
├── layouts/             BaseLayout (head, Header, <slot />, Footer)
├── content/
│   └── avisos/          avisos en Markdown (colección local)
├── pages/
│   ├── cafes/           listado y detalle de cafés
│   ├── blog/            listado y detalle del blog
│   ├── ejercicios/      ejercicios de la semana 5 (no forman parte de la web del cliente)
│   └── ...              resto de páginas
├── styles/              global.css (importa Tailwind y el plugin de tipografía)
└── content.config.ts    colección `avisos` con su esquema
```

## Decisión de renderizado

He elegido un modo **híbrido**: las páginas que no cambian (quiénes somos, contacto, avisos) se generan una sola vez
al construir la web (SSG), y las que muestran contenido de WordPress (portada, `/cafes` y `/blog`) se generan en el
servidor en cada visita (SSR, con el adaptador de Node).

- **Cuando Marta publica un café:** con SSR aparece en cuanto pulsa «Publicar», porque la siguiente visita le pide
  los datos a WordPress. Con SSG puro no saldría hasta que alguien volviera a ejecutar `npm run build` y subiera el
  resultado: es justo lo que le pasó con el café de Guatemala.
- **En cristiano:** SSG es una *fotografía* de la tienda, y para que salga el café nuevo hay que hacer otra foto.
  SSR es una *ventana*: se ve lo que hay en ese momento.
- **Hosting y coste:** SSG solo necesita alojar archivos (casi gratis y en cualquier sitio). SSR necesita un servidor
  Node encendido siempre, algo más caro y con más mantenimiento, y WordPress debe ser accesible desde ese servidor
  (no puede seguir siendo `localhost`).
- **Si WordPress se cae:** en SSG la web ya construida sigue funcionando entera, aunque no se puede reconstruir.
  En SSR, `/cafes`, `/blog` y sus detalles muestran un aviso amable con código 503 en lugar de romperse, la portada
  sigue cargando sin esas secciones y las páginas estáticas siguen funcionando.
- **Velocidad y picos de visitas:** SSR hace trabajo en cada visita. Para el reportaje de la revista, las páginas
  dinámicas envían `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`: un CDN delante guarda la misma
  copia un minuto (y hasta cinco más si WordPress falla) sin molestar a WordPress. Sin CDN, la cabecera no tiene efecto.
- **Alternativa descartada:** mantener todo en SSG y relanzar el build con un aviso automático (webhook) cada vez que
  Marta publique. Es más barato y rápido de servir, pero obliga a montar y vigilar ese proceso.

## Acceso a la API (`src/lib/wp.ts`)

Todo el acceso a WordPress está en un solo módulo. Las páginas no tocan `title.rendered` ni `_embedded`:

- Define dos juegos de tipos: los **crudos** (`WPCafe`, `WPPost`, lo que devuelve WordPress) y los **limpios**
  (`Cafe`, `Post`, lo que usa el proyecto). Si WordPress cambia su forma, solo se toca este archivo.
- Convierte los títulos (que llegan con entidades HTML como `&#8217;`) en texto normal.
- `getCafes()` y `getPosts()` piden **todas** las páginas del listado usando la cabecera `X-WP-TotalPages`.
- `getCafe(slug)` y `getPost(slug)` piden un solo elemento por su `slug` y devuelven `null` si no existe.
- Las entradas se piden con `_embed`, para recibir la imagen destacada en la misma respuesta.
- Si falta `WP_API_URL` o WordPress no responde, lanza un error claro que las páginas capturan.

Los cafés llegan con un campo `ficha` (origen, notas de cata, nivel de tueste, precio e imagen) que añade el plugin
`tueste-norte-cafes` del repositorio de WordPress. Los textos largos (`descripcionHtml`, `contenidoHtml`) se dejan como
HTML y se pintan con `set:html`, algo seguro aquí porque el contenido es de la propia tienda.

## Migración del blog a WordPress

Los tres artículos en Markdown de la semana 4 (`src/content/blog/`) eran la fuente del blog. Ahora el contenido vive
en WordPress, porque el cliente necesita publicar por su cuenta, así que se ha eliminado la colección local `blog` y
su configuración. Los archivos siguen en el historial de Git. Los cafés tampoco están escritos en el código
(`src/data/cafes.ts` se ha eliminado): todo el catálogo sale de la API.

## Ejercicios de la semana 5

Están en `src/pages/ejercicios/` y no forman parte de la web del cliente.

| Ejercicio | Archivo | Qué demuestra |
|---|---|---|
| 1 | `titulares.astro` | `fetch` en el frontmatter con la URL en `import.meta.env`; el `console.log` aparece en la terminal, no en el navegador |
| 2 | `inventario.astro` | Cabeceras `X-WP-Total` y `X-WP-TotalPages` y bucle que pide todas las páginas con `per_page=3` |
| 3 | `reloj.astro` | SSR frente a prerender: sin `prerender` la hora cambia en cada visita; con `prerender = true` se queda congelada en la del build |

## Ejercicios de la semana 4

| Ejercicio | Dónde | Qué es |
|---|---|---|
| 1 | `src/components/Badge.astro`, `src/pages/pruebas.astro` | Componente con props (`texto`, `tono`) y un mapa de tono a clases de Tailwind |
| 2 | `src/layouts/BaseLayout.astro`, `src/pages/quienes-somos.astro` | Layout con `<slot />` y página con rejilla responsive de tres tarjetas |
| 3 | `src/content.config.ts`, `src/content/avisos/`, `src/pages/avisos.astro` | Colección con esquema; incluye el error de esquema provocado a propósito, documentado en un comentario de `avisos.astro` |

## Estilos y diseño

- Tailwind CSS 4, instalado como plugin de Vite en `astro.config.mjs` (no existe `tailwind.config.js`).
- Los artículos y las descripciones de los cafés usan `@tailwindcss/typography` (clase `prose`), cargado desde
  `global.css`, porque Tailwind elimina los estilos por defecto del HTML que llega de WordPress.
- Mobile first: las clases sin prefijo aplican a móvil y `md:`/`lg:` las cambian en pantallas grandes. El catálogo pasa
  de una columna en móvil a dos y tres en pantallas grandes.
- El menú del `Header` es una fila en escritorio y un desplegable con `<details>` en móvil, sin JavaScript propio.

## Notas

- `node_modules/`, `dist/` y `.env` no se versionan.
- Los datos de contacto (dirección, teléfono y email) y los horarios de la página de contacto son ficticios y habrá
  que sustituirlos por los reales.
- Si se modifica `src/content.config.ts` con el servidor en marcha, hay que reiniciarlo (y borrar la carpeta `.astro`
  si las colecciones no se actualizan).